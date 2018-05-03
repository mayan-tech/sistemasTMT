class Ticket < ApplicationRecord

  belongs_to :user
  belongs_to :category
  has_many :asginar_tickets
  has_many :ticket_detalles
  has_many :ticket_files
  accepts_nested_attributes_for :ticket_detalles
  resourcify
  self.per_page = 10


      def get_departamento(usuario_id)

        x = AsignDepartamentUser.find_by("user_id = ?",usuario_id)
        nombres =  x.departament.name



      end

      def get_usuario_asignado(id)

        u = AsginarTicket.find_by("ticket_id = ?",id)
        nombres = u.user.first_name + " " + u.user.last_name
      end

      def get_id_usuario_asignado(id)

        u = AsginarTicket.find_by("ticket_id = ? ",id)
        id= u.user.id

      end
end
