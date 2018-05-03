class TicketDetallesController < ApplicationController
  before_action :set_ticket_detalle, only: [:show, :edit, :update, :destroy]
  before_action :authenticate_user!
  before_action :admin_required

  # GET /ticket_detalles
  # GET /ticket_detalles.json
  def index
    @ticket_detalles = TicketDetalle.all
  end

  # GET /ticket_detalles/1
  # GET /ticket_detalles/1.json
  def show
  end

  # GET /ticket_detalles/new
  def new
    @ticket_detalle = TicketDetalle.new
  end

  # GET /ticket_detalles/1/edit
  def edit
  end

  # POST /ticket_detalles
  # POST /ticket_detalles.json
  def create


    @ticket_detalle = TicketDetalle.new(ticket_detalle_params)

    respond_to do |format|
      if @ticket_detalle.save
        format.html { redirect_to ticket_path(@ticket_detalle.ticket_id), notice: 'Ticket detalle was successfully created.' }
        format.json { render :show, status: :created, location: @ticket_detalle }
      else
        format.html { render :new }
        format.json { render json: @ticket_detalle.errors, status: :unprocessable_entity }
      end
    end
  end

  # PATCH/PUT /ticket_detalles/1
  # PATCH/PUT /ticket_detalles/1.json
  def update
    respond_to do |format|
      if @ticket_detalle.update(ticket_detalle_params)
        format.html { redirect_to @ticket_detalle, notice: 'Ticket detalle was successfully updated.' }
        format.json { render :show, status: :ok, location: @ticket_detalle }
      else
        format.html { render :edit }
        format.json { render json: @ticket_detalle.errors, status: :unprocessable_entity }
      end
    end
  end

  # DELETE /ticket_detalles/1
  # DELETE /ticket_detalles/1.json
  def destroy
    @ticket_detalle.destroy
    respond_to do |format|
      format.html { redirect_to ticket_detalles_url, notice: 'Ticket detalle was successfully destroyed.' }
      format.json { head :no_content }
    end
  end

  private
    # Use callbacks to share common setup or constraints between actions.
    def set_ticket_detalle
      @ticket_detalle = TicketDetalle.find(params[:id])
    end

    # Never trust parameters from the scary internet, only allow the white list through.
    def ticket_detalle_params
      params.require(:ticket_detalle).permit(:user_id, :ticket_id, :mensaje)
    end
end
