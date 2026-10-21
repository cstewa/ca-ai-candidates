require "net/http"

# Sends sign-ups to the Google Form behind the scenes, so visitors never leave the site.
# Responses land in the form (and its linked Sheet) as if typed there.
#
# Fields are matched by question title, so adding a "ZIP code" or "Signed up from"
# short-answer question to the form starts filling it with no code change.
class GoogleForm
  FORM_ID = "1FAIpQLSck48GvrSVTk60_nQCmhzJ9YDLV0WHDws75B-iEE5jSSgVHpA".freeze
  VIEW_URL = "https://docs.google.com/forms/d/e/#{FORM_ID}/viewform".freeze
  SUBMIT_URL = "https://docs.google.com/forms/d/e/#{FORM_ID}/formResponse".freeze
  KNOWN_EMAIL_ENTRY = "1127785954".freeze
  FIELD_TITLES = { email: /e-?mail/i, zip: /zip/i, source: /signed up from|source/i }.freeze
  FIELDS_TTL = 1.hour

  class Error < StandardError; end

  class << self
    # Overridable in tests: ->(url, form_data) { HTTP status code }
    attr_writer :poster, :fetcher

    def submit(email:, zip: nil, source: nil)
      ids = fields
      data = { "entry.#{ids.fetch(:email)}" => email }
      data["entry.#{ids[:zip]}"] = zip if ids[:zip] && zip.present?
      data["entry.#{ids[:source]}"] = source if ids[:source] && source.present?
      status = poster.call(SUBMIT_URL, data)
      raise Error, "Google Form returned #{status}" unless status.to_i.between?(200, 399)
      true
    end

    # Question title -> entry id, read from the form's public page and cached.
    def fields
      if @fields.nil? || @fields_at < FIELDS_TTL.ago
        @fields = discover_fields
        @fields_at = Time.current
      end
      @fields
    end

    def reset!
      @fields = nil
    end

    private

    def discover_fields
      html = fetcher.call(VIEW_URL)
      found = {}
      # Each question looks like [question_id,"Title",...,[[entry_id,...
      html.to_s.scan(/\[\d+,"([^"]*)",(?:[^\[\]]|\[[^\[\]]*\])*?\[\[(\d+),/).each do |title, entry|
        key = FIELD_TITLES.find { |_, pattern| title.match?(pattern) }&.first
        found[key] ||= entry if key
      end
      { email: KNOWN_EMAIL_ENTRY }.merge(found)
    rescue StandardError => e
      Rails.logger.warn("google_form field discovery failed: #{e.class}")
      { email: KNOWN_EMAIL_ENTRY }
    end

    def poster
      @poster ||= dry_run? ? dry_run_poster : http_poster
    end

    # On a developer's machine, sign-ups are logged instead of sent, unless SIGNUP_LIVE=1.
    def dry_run?
      Rails.env.development? && ENV["SIGNUP_LIVE"].blank?
    end

    def dry_run_poster
      lambda do |_url, data|
        Rails.logger.info("google_form dry run: would submit #{data.keys.join(', ')}")
        "200"
      end
    end

    def http_poster
      lambda do |url, data|
        uri = URI(url)
        Net::HTTP.start(uri.host, uri.port, use_ssl: true, open_timeout: 5, read_timeout: 10) do |http|
          req = Net::HTTP::Post.new(uri)
          req.set_form_data(data)
          http.request(req).code
        end
      end
    end

    def fetcher
      @fetcher ||= lambda do |url|
        uri = URI(url)
        Net::HTTP.start(uri.host, uri.port, use_ssl: true, open_timeout: 5, read_timeout: 10) do |http|
          res = http.get(uri.request_uri)
          res = http.get(URI(res["location"]).request_uri) if res.is_a?(Net::HTTPRedirection)
          res.body
        end
      end
    end
  end
end
