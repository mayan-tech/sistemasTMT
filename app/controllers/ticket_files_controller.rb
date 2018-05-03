class TicketFilesController < ApplicationController
  before_action :set_ticket_file, only: [:show, :edit, :update, :destroy]
  before_action :authenticate_user!
  before_action :admin_required

  # GET /ticket_files
  # GET /ticket_files.json
  def index
    @ticket_files = TicketFile.all
  end

  # GET /ticket_files/1
  # GET /ticket_files/1.json
  def show
  end

  # GET /ticket_files/new
  def new
    @ticket_file = TicketFile.new
  end

  # GET /ticket_files/1/edit
  def edit
  end

  # POST /ticket_files
  # POST /ticket_files.json
  def create
    @ticket_file = TicketFile.new(ticket_file_params)

    respond_to do |format|
      if @ticket_file.save
        format.html { redirect_to @ticket_file, notice: 'Ticket file was successfully created.' }
        format.json { render :show, status: :created, location: @ticket_file }
      else
        format.html { render :new }
        format.json { render json: @ticket_file.errors, status: :unprocessable_entity }
      end
    end
  end

  # PATCH/PUT /ticket_files/1
  # PATCH/PUT /ticket_files/1.json
  def update
    respond_to do |format|
      if @ticket_file.update(ticket_file_params)
        format.html { redirect_to @ticket_file, notice: 'Ticket file was successfully updated.' }
        format.json { render :show, status: :ok, location: @ticket_file }
      else
        format.html { render :edit }
        format.json { render json: @ticket_file.errors, status: :unprocessable_entity }
      end
    end
  end

  # DELETE /ticket_files/1
  # DELETE /ticket_files/1.json
  def destroy
    @ticket_file.destroy
    respond_to do |format|
      format.html { redirect_to ticket_files_url, notice: 'Ticket file was successfully destroyed.' }
      format.json { head :no_content }
    end
  end

  private
    # Use callbacks to share common setup or constraints between actions.
    def set_ticket_file
      @ticket_file = TicketFile.find(params[:id])
    end

    # Never trust parameters from the scary internet, only allow the white list through.
    def ticket_file_params
      params.require(:ticket_file).permit(:ticket_id, :user_id, :mensaje)
    end
end
