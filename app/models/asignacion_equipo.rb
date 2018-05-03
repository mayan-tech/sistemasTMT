class AsignacionEquipo < ApplicationRecord
  belongs_to :user
  belongs_to :categoria
  belongs_to :equipo
end
