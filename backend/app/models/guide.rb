# The whole guide, loaded from db/data/*.yml. There is no database: the YAML
# files are the source of truth, and the site only reads them.
#
# Loading validates every value, so a typo in the YAML fails loudly at boot
# (and in `bundle exec rspec`) instead of showing up on the site.
class Guide
  DATA_DIR = Rails.root.join("db", "data")

  # office => [label, category, slug prefix]
  OFFICES = {
    "governor"               => ["Governor", "statewide", "governor"],
    "lieutenant_governor"    => ["Lieutenant Governor", "statewide", "lieutenant-governor"],
    "secretary_of_state"     => ["Secretary of State", "statewide", "secretary-of-state"],
    "controller"             => ["Controller", "statewide", "controller"],
    "treasurer"              => ["Treasurer", "statewide", "treasurer"],
    "attorney_general"       => ["Attorney General", "statewide", "attorney-general"],
    "insurance_commissioner" => ["Insurance Commissioner", "statewide", "insurance-commissioner"],
    "superintendent"         => ["Superintendent of Public Instruction", "statewide", "superintendent"],
    "mayor"                  => ["Mayor", "local", "mayor"],
    "board_of_equalization"  => ["Board of Equalization", "board_of_equalization", "boe"],
    "us_house"               => ["U.S. House", "us_house", "us-house"],
    "state_senate"           => ["State Senate", "state_senate", "state-senate"],
    "state_assembly"         => ["State Assembly", "state_assembly", "assembly"],
  }.freeze

  PARTIES = {
    "D" => "Democratic", "R" => "Republican", "NPP" => "No party preference",
    "L" => "Libertarian", "G" => "Green", "P&F" => "Peace and Freedom",
  }.freeze

  # Describes how much of a public record exists, not whether it is good or bad.
  STATUSES         = %w[on_record ai_other none_found].freeze
  POSITION_VALUES  = %w[yes no did_not_vote author coauthor sponsor cosponsor signed].freeze
  # What kind of record each item is; shown as a label beside it.
  ITEM_KINDS       = %w[vote bill letter statement platform official_action background funding].freeze
  YARDSTICK_FIELDS = %w[key name short_name full_title sponsors year level kind
                        what_it_does why_it_matters outcome caveat url].freeze

  class InvalidData < StandardError; end

  class << self
    # Loaded once per process; reloads in development when a YAML file changes.
    def current
      stamp = Dir[DATA_DIR.join("*.yml")].map { |f| File.mtime(f) }.max
      @current = nil if Rails.env.development? && stamp != @stamp
      @stamp = stamp
      @current ||= new
    end

    def slug_for(office, district, city = nil)
      [OFFICES.fetch(office)[2], district, city&.parameterize].compact.join("-")
    end
  end

  attr_reader :races, :yardsticks

  def initialize(dir = DATA_DIR)
    @yardsticks = YAML.load_file(dir.join("yardsticks.yml")).map { |y| build_yardstick(y) }
    @yardstick_order = @yardsticks.each_with_index.to_h { |y, i| [y["key"], i] }
    check! @yardstick_order.size == @yardsticks.size, "duplicate yardstick key"

    @candidate_slugs = Set.new
    @races = YAML.load_file(dir.join("races.yml"))
      .map { |r| build_race(r) }
      .sort_by { |r| [OFFICES.keys.index(r["office"]), r["district"].to_i, r["city"].to_s] }

    @race_by_slug = @races.index_by { |r| r["slug"] }
    check! @race_by_slug.size == @races.size, "duplicate race: #{@races.map { |r| r['slug'] }.tally.select { |_, n| n > 1 }.keys}"
    @candidate_by_slug = @races.flat_map { |r| r["candidates"].map { |c| [c["slug"], [c, r]] } }.to_h
  end

  def race(slug) = @race_by_slug[slug]

  def candidates = @candidate_by_slug.values.map(&:first)

  # The candidate plus a short summary of their race, or nil.
  def candidate(slug)
    c, r = @candidate_by_slug[slug]
    c && c.merge("race" => r.slice("slug", "title", "category", "note"))
  end

  private

  def check!(ok, message)
    raise InvalidData, message unless ok
  end

  def build_yardstick(y)
    check! y["key"].present? && y["name"].present?, "yardstick missing key or name: #{y.inspect}"
    check! %w[state federal].include?(y["level"]), "yardstick #{y['key']}: unknown level #{y['level'].inspect}"
    check! %w[bill letter vote].include?(y["kind"]), "yardstick #{y['key']}: unknown kind #{y['kind'].inspect}"
    YARDSTICK_FIELDS.index_with { |f| y[f] }
  end

  def build_race(r)
    office = r["office"]
    check! OFFICES.key?(office), "unknown office #{office.inspect}"
    label, category, = OFFICES[office]
    if office == "mayor"
      check! r["city"].present? && r["place_fips"].to_s.match?(/\A\d{5}\z/), "mayor race needs city and a 5-digit place_fips"
      label = "Mayor of #{r['city']}"
    end
    slug = self.class.slug_for(office, r["district"], r["city"])
    check! r["candidates"].present?, "race #{slug} has no candidates"

    {
      "slug" => slug,
      "office" => office,
      "district" => r["district"],
      "note" => r["note"],
      "office_label" => label,
      "category" => category,
      "title" => r["district"] ? "#{label}, District #{r['district']}" : label,
      "city" => r["city"],
      "place_fips" => r["place_fips"]&.to_s,
      # Alphabetical by last name, ignoring case and accents.
      "candidates" => r["candidates"]
        .map { |c| build_candidate(c, slug) }
        .sort_by { |c| c.delete("_sort") },
    }
  end

  def build_candidate(c, race_slug)
    where = "#{c['name']} (#{race_slug})"
    check! c["name"].present? && c["sort_name"].present?, "candidate missing name or sort_name in #{race_slug}"
    check! c["party"].nil? || PARTIES.key?(c["party"]), "#{where}: unknown party #{c['party'].inspect}"
    check! STATUSES.include?(c["status"]), "#{where}: unknown status #{c['status'].inspect}"

    slug = c["name"].parameterize
    slug = "#{slug}-#{race_slug}" if @candidate_slugs.include?(slug)
    @candidate_slugs << slug

    positions = (c["positions"] || []).map do |p|
      check! @yardstick_order.key?(p["yardstick"]), "#{where}: unknown yardstick #{p['yardstick'].inspect}"
      check! POSITION_VALUES.include?(p["position"]), "#{where}: unknown position #{p['position'].inspect}"
      { "yardstick" => p["yardstick"], "value" => p["position"], "detail" => p["detail"] }
    end
    check! positions.map { |p| p["yardstick"] }.uniq.size == positions.size, "#{where}: duplicate yardstick"

    items = (c["items"] || []).map do |i|
      kind = i["kind"]
      check! i["text"].present?, "#{where}: empty item"
      check! ITEM_KINDS.include?(kind), "#{where}: item kind must be one of #{ITEM_KINDS.join(', ')}, got #{kind.inspect}"
      { "body" => i["text"], "kind" => kind }
    end

    {
      "slug" => slug,
      "name" => c["name"],
      "party" => c["party"],
      "incumbent" => !!c["incumbent"],
      "incumbent_note" => c["incumbent_note"],
      "unopposed" => !!c["unopposed"],
      "status" => c["status"],
      "search_note" => c["search_note"],
      "party_label" => PARTIES[c["party"]],
      "positions" => positions.sort_by { |p| @yardstick_order[p["yardstick"]] },
      "items" => items,
      "_sort" => c["sort_name"].unicode_normalize(:nfd).gsub(/\p{Mn}/, "").downcase,
    }
  end
end
