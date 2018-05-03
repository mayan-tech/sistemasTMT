class TicketsController < ApplicationController

  before_action :authenticate_user!
  before_action :set_ticket, only: [:show, :edit, :update, :destroy]

  # GET /tickets
  # GET /tickets.json
  def index
      x = User.find(current_user.id)

    if current_user.has_role? :admin  then

      @tickets = Ticket.order(id: :desc).all

    else

      @Acate = AsignTeamUserCategory.select("category_id").find_by("user_id = ?",current_user.id)

      if @Acate.blank? then
          @tickets = Ticket.where("user_id = ?",current_user.id).order(id: :desc)
      else

          @tickets = Ticket.where("category_id in (?)", @Acate.category_id).order(id: :desc)

      end

    #abort current_user.id.inspect
    end

    @tickets = @tickets.paginate(:page => params[:page])
    Ticket.paginate(:page => params[:page], :per_page => 10)
    WillPaginate.per_page = 10
 end
  # GET /tickets/1
  # GET /tickets/1.json
  def show


    @ticket_detalles = TicketDetalle.where("ticket_id = ?",params[:id])

    @record = @ticket.ticket_detalles.build
  end

  # GET /tickets/new
  def new

    @user = current_user.id
    @ticket = Ticket.new
    render :layout => 'application-h'
  end

  def new_su

    @ticket = Ticket.new
  end

  # GET /tickets/1/edit
  def edit
  end

  def cerrar
    @usuario = params[:user_id]
    @ticket = params[:ticket_id]


    u = Ticket.find_by("id = ?", @ticket)
    u.estado = 4
    u.updated_at = Time.now
    #mail(:to => "walter.rosales@gmail.com", :subject => "TICKET CERRADO #{@ticket}")
    #  UserMailer.send_seguimiento(@usuario,"TICKET CERRADO #{@ticket}").deliver


    if u.save
      redirect_to tickets_path, notice: 'El Ticket fue cerrado correctamente.'
    #  format.json { render :show, status: :created, location: a }
    else
     render :cerrar
    #  format.json { render json: ticket_pathv.errors, status: :unprocessable_entity }
    end
  end

  # POST /tickets
  # POST /tickets.json
  def create
    @ticket = Ticket.new(ticket_params)

    respond_to do |format|
      if @ticket.save
        #UserMailer.send_seguimiento(@ticket.user_id,"NUEVO TICKET:  #{@ticket}").deliver_now
        format.html { redirect_to tickets_path, notice: 'Ticket was successfully created.' }
        format.json { render :show, status: :created, location: @ticket }
      else
        format.html { render :new }
        format.json { render json: @ticket.errors, status: :unprocessable_entity }
      end
    end
  end

  # PATCH/PUT /tickets/1
  # PATCH/PUT /tickets/1.json
  def update
    respond_to do |format|
      if @ticket.update(ticket_params)
        format.html { redirect_to @ticket, notice: 'Ticket was successfully updated.' }
        format.json { render :show, status: :ok, location: @ticket }
      else
        format.html { render :edit }
        format.json { render json: @ticket.errors, status: :unprocessable_entity }
      end
    end
  end

  # DELETE /tickets/1
  # DELETE /tickets/1.json
  def destroy
    @ticket.destroy
    respond_to do |format|
      format.html { redirect_to tickets_url, notice: 'Ticket was successfully destroyed.' }
      format.json { head :no_content }
    end
  end

  private
    # Use callbacks to share common setup or constraints between actions.
    def set_ticket
      @ticket = Ticket.find(params[:id])
    end

    # Never trust parameters from the scary internet, only allow the white list through.
    def ticket_params
      params.require(:ticket).permit(:user_id, :category_id, :asunto, :descripcion, :estado, :prioridad)
    end
end
