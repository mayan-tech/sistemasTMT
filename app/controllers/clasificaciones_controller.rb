class ClasificacionesController < ApplicationController
  before_action :set_clasificacion, only: [:show, :edit, :update, :destroy]

  # GET /clasificaciones
  # GET /clasificaciones.json
  def index
    @clasificaciones = Clasificacion.all
  end

  # GET /clasificaciones/1
  # GET /clasificaciones/1.json
  def show
  end

  # GET /clasificaciones/new
  def new
    @clasificacion = Clasificacion.new
  end

  # GET /clasificaciones/1/edit
  def edit
  end

  # POST /clasificaciones
  # POST /clasificaciones.json
  def create
    @clasificacion = Clasificacion.new(clasificacion_params)

    respond_to do |format|
      if @clasificacion.save
        format.html { redirect_to @clasificacion, notice: 'Clasificacion was successfully created.' }
        format.json { render :show, status: :created, location: @clasificacion }
      else
        format.html { render :new }
        format.json { render json: @clasificacion.errors, status: :unprocessable_entity }
      end
    end
  end

  # PATCH/PUT /clasificaciones/1
  # PATCH/PUT /clasificaciones/1.json
  def update
    respond_to do |format|
      if @clasificacion.update(clasificacion_params)
        format.html { redirect_to @clasificacion, notice: 'Clasificacion was successfully updated.' }
        format.json { render :show, status: :ok, location: @clasificacion }
      else
        format.html { render :edit }
        format.json { render json: @clasificacion.errors, status: :unprocessable_entity }
      end
    end
  end

  # DELETE /clasificaciones/1
  # DELETE /clasificaciones/1.json
  def destroy
    @clasificacion.destroy
    respond_to do |format|
      format.html { redirect_to clasificaciones_url, notice: 'Clasificacion was successfully destroyed.' }
      format.json { head :no_content }
    end
  end

  private
    # Use callbacks to share common setup or constraints between actions.
    def set_clasificacion
      @clasificacion = Clasificacion.find(params[:id])
    end

    # Never trust parameters from the scary internet, only allow the white list through.
    def clasificacion_params
      params.require(:clasificacion).permit(:nombre, :descripcion)
    end
end
