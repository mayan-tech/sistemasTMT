class AsignarDepartamentoUsuario < ApplicationRecord
    belongs_to :user
    belongs_to :departamento
    belongs_to :empresa





end
