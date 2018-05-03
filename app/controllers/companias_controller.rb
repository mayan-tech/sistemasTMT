class CompaniasController < ApplicationController

  before_action :set_compania, only: [:show, :edit, :update, :destroy]


  # GET /companias
  # GET /companias.json
  def index
    @companias = Compania.all
  end

  # GET /companias/1
  # GET /companias/1.json
  def show
  end

  # GET /companias/new
  def new
    @compania = Compania.new
  end

  # GET /companias/1/edit
  def edit
  end

  # POST /companias
  # POST /companias.json
  def create
    @compania = Compania.new(compania_params)

    respond_to do |format|
      if @compania.save
        format.html { redirect_to @compania, notice: 'Compania was successfully created.' }
        format.json { render :show, status: :created, location: @compania }
      else
        format.html { render :new }
        format.json { render json: @compania.errors, status: :unprocessable_entity }
      end
    end
  end

  # PATCH/PUT /companias/1
  # PATCH/PUT /companias/1.json
  def update
    respond_to do |format|
      if @compania.update(compania_params)
        format.html { redirect_to @compania, notice: 'Compania was successfully updated.' }
        format.json { render :show, status: :ok, location: @compania }
      else
        format.html { render :edit }
        format.json { render json: @compania.errors, status: :unprocessable_entity }
      end
    end
  end

  # DELETE /companias/1
  # DELETE /companias/1.json
  def destroy
    @compania.destroy
    respond_to do |format|
      format.html { redirect_to companias_url, notice: 'Compania was successfully destroyed.' }
      format.json { head :no_content }
    end
  end

  private
    # Use callbacks to share common setup or constraints between actions.
    def set_compania
      @compania = Compania.find(params[:id])
    end

    # Never trust parameters from the scary internet, only allow the white list through.
    def compania_params
      params.require(:compania).permit(:nombre, :descripcion, :nit)
    end
end
