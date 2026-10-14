module API
  module V1
    class CandidatesController < ApplicationController
      def show
        candidate = guide.candidate(params[:slug])
        candidate ? render(json: candidate) : not_found
      end
    end
  end
end
