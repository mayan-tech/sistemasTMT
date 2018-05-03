class Empresa < ApplicationRecord
  belongs_to :compania
  has_many :asignar_departamento_usuarios


end
