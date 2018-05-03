class AsignarDepartamentoUsuariosController < ApplicationController
  before_action :set_asignar_departamento_usuario, only: [:show, :edit, :update, :destroy]

  # GET /asignar_departamento_usuarios
  # GET /asignar_departamento_usuarios.json
  def index
    @asignar_departamento_usuarios = AsignarDepartamentoUsuario.all
  end

  # GET /asignar_departamento_usuarios/1
  # GET /asignar_departamento_usuarios/1.json
  def show
  end

  # GET /asignar_departamento_usuarios/new
  def new
    @asignar_departamento_usuario = AsignarDepartamentoUsuario.new
  end

  # GET /asignar_departamento_usuarios/1/edit
  def edit
  end

  # POST /asignar_departamento_usuarios
  # POST /asignar_departamento_usuarios.json
  def create
    @asignar_departamento_usuario = AsignarDepartamentoUsuario.new(asignar_departamento_usuario_params)

    respond_to do |format|
      if @asignar_departamento_usuario.save
        format.html { redirect_to @asignar_departamento_usuario, notice: 'Asignar departamento usuario was successfully created.' }
        format.json { render :show, status: :created, location: @asignar_departamento_usuario }
      else
        format.html { render :new }
        format.json { render json: @asignar_departamento_usuario.errors, status: :unprocessable_entity }
      end
    end
  end

  # PATCH/PUT /asignar_departamento_usuarios/1
  # PATCH/PUT /asignar_departamento_usuarios/1.json
  def update
    respond_to do |format|
      if @asignar_departamento_usuario.update(asignar_departamento_usuario_params)
        format.html { redirect_to @asignar_departamento_usuario, notice: 'Asignar departamento usuario was successfully updated.' }
        format.json { render :show, status: :ok, location: @asignar_departamento_usuario }
      else
        format.html { render :edit }
        format.json { render json: @asignar_departamento_usuario.errors, status: :unprocessable_entity }
      end
    end
  end

  # DELETE /asignar_departamento_usuarios/1
  # DELETE /asignar_departamento_usuarios/1.json
  def destroy
    @asignar_departamento_usuario.destroy
    respond_to do |format|
      format.html { redirect_to asignar_departamento_usuarios_url, notice: 'Asignar departamento usuario was successfully destroyed.' }
      format.json { head :no_content }
    end
  end

  private
    # Use callbacks to share common setup or constraints between actions.
    def set_asignar_departamento_usuario
      @asignar_departamento_usuario = AsignarDepartamentoUsuario.find(params[:id])
    end

    # Never trust parameters from the scary internet, only allow the white list through.
    def asignar_departamento_usuario_params
      params.require(:asignar_departamento_usuario).permit(:usuario_id, :departamento_id, :empresa_id, :user_id)
    end
end
