module API
  module V1
    class ZipsController < ApplicationController
      def show
        zip = params[:zip].to_s
        result = zip.match?(/\A\d{5}\z/) && ZipLookup.current.find(zip, guide)
        result ? render(json: result) : not_found
      end
    end
  end
end
