require "active_support/core_ext/integer/time"

Rails.application.configure do
  config.enable_reloading = false
  config.eager_load = true

  config.consider_all_requests_local = false

  config.log_level = ENV.fetch("RAILS_LOG_LEVEL", "info").to_sym
  config.logger = ActiveSupport::Logger.new($stdout)
  config.logger.formatter = Logger::Formatter.new
  config.log_tags = [:request_id]

  config.active_support.deprecation = :notify
  config.active_support.disallowed_deprecation = :log
  config.active_support.disallowed_deprecation_warnings = []

  config.force_ssl = ENV["FORCE_SSL"].present?
  config.public_file_server.enabled = true
  config.middleware.use Rack::Deflater
  # Always revalidate, so a new deploy shows up right away. Built assets have hashed
  # names, so unchanged ones still come back as quick 304s.
  config.public_file_server.headers = { "Cache-Control" => "no-cache" }
end
