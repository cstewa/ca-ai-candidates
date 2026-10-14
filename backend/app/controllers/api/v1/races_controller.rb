module API
  module V1
    class RacesController < ApplicationController
      def index
        render json: races_scope.to_a
      end

      def show
        render json: races_scope.find_by!(slug: params[:slug])
      end

      private

      def races_scope
        Race.includes(candidates: [:record_items, { positions: :yardstick }])
      end
    end
  end
end
