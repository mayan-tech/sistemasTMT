class AsignacionEquiposController < ApplicationController
  before_action :set_asignacion_equipo, only: [:show, :edit, :update, :destroy]

  # GET /asignacion_equipos
  # GET /asignacion_equipos.json
  def index
    @asignacion_equipos = AsignacionEquipo.all
  end

  # GET /asignacion_equipos/1
  # GET /asignacion_equipos/1.json
  def show
  end

  # GET /asignacion_equipos/new
  def new
    @asignacion_equipo = AsignacionEquipo.new
  end

  # GET /asignacion_equipos/1/edit
  def edit
  end

  # POST /asignacion_equipos
  # POST /asignacion_equipos.json
  def create
    @asignacion_equipo = AsignacionEquipo.new(asignacion_equipo_params)

    respond_to do |format|
      if @asignacion_equipo.save
        format.html { redirect_to @asignacion_equipo, notice: 'Asignacion equipo was successfully created.' }
        format.json { render :show, status: :created, location: @asignacion_equipo }
      else
        format.html { render :new }
        format.json { render json: @asignacion_equipo.errors, status: :unprocessable_entity }
      end
    end
  end

  # PATCH/PUT /asignacion_equipos/1
  # PATCH/PUT /asignacion_equipos/1.json
  def update
    respond_to do |format|
      if @asignacion_equipo.update(asignacion_equipo_params)
        format.html { redirect_to @asignacion_equipo, notice: 'Asignacion equipo was successfully updated.' }
        format.json { render :show, status: :ok, location: @asignacion_equipo }
      else
        format.html { render :edit }
        format.json { render json: @asignacion_equipo.errors, status: :unprocessable_entity }
      end
    end
  end

  # DELETE /asignacion_equipos/1
  # DELETE /asignacion_equipos/1.json
  def destroy
    @asignacion_equipo.destroy
    respond_to do |format|
      format.html { redirect_to asignacion_equipos_url, notice: 'Asignacion equipo was successfully destroyed.' }
      format.json { head :no_content }
    end
  end

  private
    # Use callbacks to share common setup or constraints between actions.
    def set_asignacion_equipo
      @asignacion_equipo = AsignacionEquipo.find(params[:id])
    end

    # Never trust parameters from the scary internet, only allow the white list through.
    def asignacion_equipo_params
      params.require(:asignacion_equipo).permit(:user_id, :categoria_id, :equipo_id)
    end
end
