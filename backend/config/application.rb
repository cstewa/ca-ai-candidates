require_relative "boot"
require "rails"
require "active_model/railtie"
require "action_controller/railtie"

Bundler.require(*Rails.groups)

module CaAiCandidatesApi
  class Application < Rails::Application
    config.load_defaults 7.1

    config.secret_key_base = ENV.fetch("SECRET_KEY_BASE") { SecureRandom.hex(64) }

    # API only mode
    config.api_only = true

    # CORS
    config.middleware.insert_before 0, Rack::Cors do
      allow do
        origins ENV.fetch("FRONTEND_URL", "http://localhost:5173")
        resource "*",
          headers: :any,
          methods: [:get, :post, :options, :head]
      end
    end

    # Time zone
    config.time_zone = "Pacific Time (US & Canada)"
  end
end
