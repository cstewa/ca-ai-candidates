module API
  module V1
    class YardsticksController < ApplicationController
      def index
        render json: Yardstick.all
      end
    end
  end
end
