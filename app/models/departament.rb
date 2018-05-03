class Departament < ApplicationRecord

  belongs_to :corporation , optional: true
  has_many :asign_departament_users
   resourcify

end
