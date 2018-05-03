# Be sure to restart your server when you modify this file.

# Version of your assets, change this if you want to expire all your assets.
Rails.application.config.assets.version = '1.0'

# Add additional assets to the asset load path.
# Rails.application.config.assets.paths << Emoji.images_path
# Add Yarn node_modules folder to the asset load path.
Rails.application.config.assets.paths << Rails.root.join('node_modules')

# Precompile additional assets.
# application.js, application.css, and all non-JS/CSS in the app/assets
# folder are already added.
# Rails.application.config.assets.precompile += %w( admin.js admin.css )
Rails.application.config.assets.precompile += %w(
                                                  devise/sessions.css
                                                  devise/sessions.js
                                                  devise/registrations.css
                                                  devise/registrations.js
                                                  users/sessions.css
                                                  users/sessions.js
                                                  users/registrations.css
                                                  users/registrations.js
                                                  tickets.css
                                                  tickets.js
                                                  users.css
                                                  users.js
                                                  roles.css
                                                  roles.js
                                                  users_roles.css
                                                  users_roles.js
                                                  companies.css
                                                  companies.js
                                                  categories.css
                                                  categories.js
                                                  corporations.css
                                                  corporations.js
                                                  departaments.css
                                                  departaments.js
                                                  users_roles.css.scss
                                                  users_roles.js
                                                  asign_team_user_categories.css
                                                  asign_team_user_categories.js
                                                  teams.css
                                                  teams.js
                                                  asign_departament_users.css
                                                  asign_departament_users.js
                                                 )
