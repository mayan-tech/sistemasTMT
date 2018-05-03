class TicketDetalle < ApplicationRecord

  belongs_to :user
  belongs_to :ticket

  def get_obtener_usuario_nombres(id)
    u = User.find_by("id = ?",id)
    nombres= u.first_name + " " + u.last_name
  end

end
