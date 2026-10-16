Rails.application.routes.draw do
  namespace :api do
    namespace :v1 do
      resources :races,      only: [:index, :show], param: :slug
      resources :candidates, only: [:show],         param: :slug
      resources :yardsticks, only: [:index]
      get "zips/:zip", to: "zips#show"
    end
  end

  get "up" => "rails/health#show", as: :rails_health_check
  get "healthz", to: proc { [200, { "Content-Type" => "text/plain" }, ["ok"]] }

  # Serve React app for all non-API routes
  get "*path", to: "frontend#index", constraints: ->(req) { !req.path.start_with?("/api/") && !req.path.start_with?("/rails/") }
  root to: "frontend#index"
end
