# Load and validate db/data/*.yml at boot in production, so a bad edit makes
# the deploy fail its health check instead of breaking the live site.
Rails.application.config.after_initialize do
  if Rails.env.production?
    Guide.current
    ZipLookup.current
  end
end
