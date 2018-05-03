Rails.application.configure do
config.action_mailer.delivery_method = :smtp
 config.action_mailer.smtp_settings = {
 :authentication => :plain,
 :address => "walter.rosales@mayan-tech.com",
 :port => "26",
 :domain =>"mayan-tech.com",
 :user_name => "walter.rosales@mayan-tech.com",
 :password => "meli$1116"
 }
end
