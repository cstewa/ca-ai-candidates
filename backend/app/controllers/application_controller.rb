class ApplicationController < ActionController::API
  private

  def guide = Guide.current

  def not_found
    render json: { error: "Not found" }, status: :not_found
  end
end
