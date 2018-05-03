class AsignDepartamentUsersController < ApplicationController
  before_action :set_asign_departament_user, only: [:show, :edit, :update, :destroy]


  # GET /asign_departament_users
  # GET /asign_departament_users.json
  def index
    @asign_departament_users = AsignDepartamentUser.all
  end

  # GET /asign_departament_users/1
  # GET /asign_departament_users/1.json
  def show
  end

  # GET /asign_departament_users/new
  def new
    @asign_departament_user = AsignDepartamentUser.new
  end

  # GET /asign_departament_users/1/edit
  def edit
  end

  # POST /asign_departament_users
  # POST /asign_departament_users.json
  def create
    @asign_departament_user = AsignDepartamentUser.new(asign_departament_user_params)

    respond_to do |format|
      if @asign_departament_user.save
        format.html { redirect_to @asign_departament_user, notice: 'Asign departament user was successfully created.' }
        format.json { render :show, status: :created, location: @asign_departament_user }
      else
        format.html { render :new }
        format.json { render json: @asign_departament_user.errors, status: :unprocessable_entity }
      end
    end
  end

  # PATCH/PUT /asign_departament_users/1
  # PATCH/PUT /asign_departament_users/1.json
  def update
    respond_to do |format|
      if @asign_departament_user.update(asign_departament_user_params)
        format.html { redirect_to @asign_departament_user, notice: 'Asign departament user was successfully updated.' }
        format.json { render :show, status: :ok, location: @asign_departament_user }
      else
        format.html { render :edit }
        format.json { render json: @asign_departament_user.errors, status: :unprocessable_entity }
      end
    end
  end

  # DELETE /asign_departament_users/1
  # DELETE /asign_departament_users/1.json
  def destroy
    @asign_departament_user.destroy
    respond_to do |format|
      format.html { redirect_to asign_departament_users_url, notice: 'Asign departament user was successfully destroyed.' }
      format.json { head :no_content }
    end
  end

  private
    # Use callbacks to share common setup or constraints between actions.
    def set_asign_departament_user
      @asign_departament_user = AsignDepartamentUser.find(params[:id])
    end

    # Never trust parameters from the scary internet, only allow the white list through.
    def asign_departament_user_params
      params.require(:asign_departament_user).permit(:user_id, :departament_id, :company_id)
    end
end
