class AsignDepartamentUser < ApplicationRecord
  belongs_to :user
  belongs_to :departament
  belongs_to :company
end
