module API
  module V1
    class YardsticksController < ApplicationController
      def index
        render json: guide.yardsticks
      end
    end
  end
end
