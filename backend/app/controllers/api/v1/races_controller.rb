module API
  module V1
    class RacesController < ApplicationController
      def index
        render json: guide.races
      end

      def show
        race = guide.race(params[:slug])
        race ? render(json: race) : not_found
      end
    end
  end
end
