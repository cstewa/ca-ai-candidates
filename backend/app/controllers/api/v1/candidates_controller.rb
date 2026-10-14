module API
  module V1
    class CandidatesController < ApplicationController
      def show
        candidate = Candidate.includes(:race, :record_items, positions: :yardstick).find_by!(slug: params[:slug])
        race = candidate.race
        render json: candidate.as_json.merge(
          "race" => { "slug" => race.slug, "title" => race.title, "category" => race.category, "note" => race.note }
        )
      end
    end
  end
end
