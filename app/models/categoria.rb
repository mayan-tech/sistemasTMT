class Categoria < ApplicationRecord
  has_many :asignacion_equipos
  has_many :tickets
end
