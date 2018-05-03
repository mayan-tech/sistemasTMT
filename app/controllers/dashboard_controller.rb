class DashboardController < ApplicationController
  # Prevent CSRF attacks by raising an exception.
  # For APIs, you may want to use :null_session instead.

  protect_from_forgery with: :exception
  before_action :authenticate_user!


  def soporte
    render :layout => 'application-h'
    @user = current_user.id
    @record = @user.roles.build

  end
  def dashboard
    # Lista todos los tickets nuevos



    @usuario = User.find(current_user.id)
    @acceso = @usuario.roles.first.name
    if @acceso == "usuario" then redirect_to new_ticket_path end


    @usuario = User.find(current_user.id)


    @TicketsNuevos = Ticket.where("estado = ?",0)
    @TicketsNuevos = @TicketsNuevos.count


    @TicketsEspera = Ticket.where("estado = ?",1)
    @TicketsEspera = @TicketsEspera.count

    @TicketsProgreso = Ticket.where("estado = ?",2)
    @TicketsProgreso = @TicketsProgreso.count


    @TicketsResuelto = Ticket.where("estado = ?",3)
    @TicketsResuelto = @TicketsResuelto.count

    @TicketsCerrado = Ticket.where("estado = ?",4)
    @TicketsCerrado  = @TicketsCerrado.count




  end
  def dashboard_v1
      @usuario = User.find(current_user.id)
      @acceso = @usuario.roles.first.name


    if @acceso == "usuario" then redirect_to new_ticket_path end
  end
  def dashboard_v2
  end
  def dashboard_v3
  end
  # set another layout for a specific action
  def dashboard_h
    render :layout => 'application-h'
  end
end
