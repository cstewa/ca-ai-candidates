# Keep visitors' email addresses out of the logs.
Rails.application.config.filter_parameters += %i[email]
