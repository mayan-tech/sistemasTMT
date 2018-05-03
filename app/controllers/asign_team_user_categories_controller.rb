class AsignTeamUserCategoriesController < ApplicationController
  before_action :set_asign_team_user_category, only: [:show, :edit, :update, :destroy]

  # GET /asign_team_user_categories
  # GET /asign_team_user_categories.json
  def index
    @asign_team_user_categories = AsignTeamUserCategory.all
  end

  # GET /asign_team_user_categories/1
  # GET /asign_team_user_categories/1.json
  def show
  end

  # GET /asign_team_user_categories/new
  def new
    @asign_team_user_category = AsignTeamUserCategory.new
  end

  # GET /asign_team_user_categories/1/edit
  def edit
  end

  # POST /asign_team_user_categories
  # POST /asign_team_user_categories.json
  def create
    @asign_team_user_category = AsignTeamUserCategory.new(asign_team_user_category_params)

    respond_to do |format|
      if @asign_team_user_category.save
        format.html { redirect_to @asign_team_user_category, notice: 'Asign team user category was successfully created.' }
        format.json { render :show, status: :created, location: @asign_team_user_category }
      else
        format.html { render :new }
        format.json { render json: @asign_team_user_category.errors, status: :unprocessable_entity }
      end
    end
  end

  # PATCH/PUT /asign_team_user_categories/1
  # PATCH/PUT /asign_team_user_categories/1.json
  def update
    respond_to do |format|
      if @asign_team_user_category.update(asign_team_user_category_params)
        format.html { redirect_to @asign_team_user_category, notice: 'Asign team user category was successfully updated.' }
        format.json { render :show, status: :ok, location: @asign_team_user_category }
      else
        format.html { render :edit }
        format.json { render json: @asign_team_user_category.errors, status: :unprocessable_entity }
      end
    end
  end

  # DELETE /asign_team_user_categories/1
  # DELETE /asign_team_user_categories/1.json
  def destroy
    @asign_team_user_category.destroy
    respond_to do |format|
      format.html { redirect_to asign_team_user_categories_url, notice: 'Asign team user category was successfully destroyed.' }
      format.json { head :no_content }
    end
  end

  private
    # Use callbacks to share common setup or constraints between actions.
    def set_asign_team_user_category
      @asign_team_user_category = AsignTeamUserCategory.find(params[:id])
    end

    # Never trust parameters from the scary internet, only allow the white list through.
    def asign_team_user_category_params
      params.require(:asign_team_user_category).permit(:user_id, :category_id, :team_id)
    end
end
