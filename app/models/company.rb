class Company < ApplicationRecord

 belongs_to :corporation , optional: true

 resourcify
end
