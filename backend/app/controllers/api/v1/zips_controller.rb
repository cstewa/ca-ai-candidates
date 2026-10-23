module API
  module V1
    class ZipsController < ApplicationController
      def show
        zip = params[:zip].to_s
        result = zip.match?(/\A\d{5}\z/) && ZipLookup.current.find(zip)
        # One line per lookup, for counting lookups vs. sign-ups (README: Measuring sign-ups).
        Rails.logger.info("event=zip_lookup found=#{result ? 'yes' : 'no'}")
        result ? render(json: result) : not_found
      end
    end
  end
end
