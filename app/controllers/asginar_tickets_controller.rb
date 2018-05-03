class AsginarTicketsController < ApplicationController
  before_action :set_asginar_ticket, only: [:show, :edit, :update, :destroy]

  # GET /asginar_tickets
  # GET /asginar_tickets.json
  def index
    @asginar_tickets = AsginarTicket.all
  end

  # GET /asginar_tickets/1
  # GET /asginar_tickets/1.json
  def show
  end

  # GET /asginar_tickets/new
  def new
    @asginar_ticket = AsginarTicket.new
  end

  # GET /asignar_tickets/1/tomar
  def tomar
    @usuario = params[:user_id]
    @ticket = params[:ticket_id]

    a =  AsginarTicket.new
    a.user_id = @usuario
    a.ticket_id = @ticket

    u = Ticket.find_by("id = ?", @ticket)
    u.estado = 1
    u.save



      if a.save
      #  UserMailer.send_seguimiento(@usuario,"Asignacion de Ticket : #{u.id}").deliver_now
        redirect_to tickets_path, notice: 'Asginar ticket was successfully created.'
      #  format.json { render :show, status: :created, location: a }
      else
       render :tomar
      #  format.json { render json: ticket_pathv.errors, status: :unprocessable_entity }
      end

  end



  # GET /asginar_tickets/1/edit
  def edit
  end

  # POST /asginar_tickets
  # POST /asginar_tickets.json
  def create
    @asginar_ticket = AsginarTicket.new(asginar_ticket_params)

    respond_to do |format|
      if @asginar_ticket.save
        format.html { redirect_to @asginar_ticket, notice: 'Asginar ticket was successfully created.' }
        format.json { render :show, status: :created, location: @asginar_ticket }
      else
        format.html { render :new }
        format.json { render json: @asginar_ticket.errors, status: :unprocessable_entity }
      end
    end
  end

  # PATCH/PUT /asginar_tickets/1
  # PATCH/PUT /asginar_tickets/1.json
  def update
    respond_to do |format|
      if @asginar_ticket.update(asginar_ticket_params)
        format.html { redirect_to @asginar_ticket, notice: 'Asginar ticket was successfully updated.' }
        format.json { render :show, status: :ok, location: @asginar_ticket }
      else
        format.html { render :edit }
        format.json { render json: @asginar_ticket.errors, status: :unprocessable_entity }
      end
    end
  end

  # DELETE /asginar_tickets/1
  # DELETE /asginar_tickets/1.json
  def destroy
    @asginar_ticket.destroy
    respond_to do |format|
      format.html { redirect_to asginar_tickets_url, notice: 'Asginar ticket was successfully destroyed.' }
      format.json { head :no_content }
    end
  end

  private
    # Use callbacks to share common setup or constraints between actions.
    def set_asginar_ticket
      @asginar_ticket = AsginarTicket.find(params[:id])
    end

    # Never trust parameters from the scary internet, only allow the white list through.
    def asginar_ticket_params
      params.require(:asginar_ticket).permit(:user_id, :ticket_id)
    end
end
