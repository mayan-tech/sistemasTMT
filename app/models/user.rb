class User < ApplicationRecord
  rolify
  devise :database_authenticatable, :registerable,
         :recoverable, :rememberable, :trackable, :validatable
  # Include default devise modules. Others available are:
  # :confirmable, :lockable, :timeoutable and :omniauthable
   has_many :users_roles
   has_many :asignar_tickets
   has_many :roles, :through => :users_roles




         def is_admin?
           is_type?("admin")
         end

         def is_usuario?
           is_type?("usuario")
         end

         def is_soporte?
           is_type?("soporte")
         end
         def tickets_totales
             @tickets = Ticket.find_by("estado = ?",1)
             @asignados = @tickets.asginar_tickets
             @totales = @asignados.count

             total = @totales

         end

    private
    def is_type? type
      self.roles.map(&:name).include?(type) ? true : false
    end
end
