module API
  module V1
    class SignupsController < ApplicationController
      EMAIL = /\A[^@\s]+@[^@\s]+\.[^@\s]+\z/
      SOURCES = %w[results home candidate].freeze

      def create
        email = params[:email].to_s.strip
        # Bots fill every field; people never see this one.
        return head(:created) if params[:website].present?
        return render(json: { error: "invalid_email" }, status: :unprocessable_entity) unless email.match?(EMAIL) && email.length <= 254

        zip = params[:zip].to_s[/\A\d{5}\z/]
        source = SOURCES.include?(params[:source]) ? params[:source] : nil
        GoogleForm.submit(email: email, zip: zip, source: source)
        Rails.logger.info("event=signup source=#{source || 'unknown'} zip=#{zip || 'none'}")
        head :created
      rescue GoogleForm::Error, Net::OpenTimeout, Net::ReadTimeout, SocketError, SystemCallError => e
        Rails.logger.error("event=signup_failed error=#{e.class}")
        render json: { error: "unavailable" }, status: :bad_gateway
      end
    end
  end
end
