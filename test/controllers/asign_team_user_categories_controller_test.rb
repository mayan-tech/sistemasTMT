require 'test_helper'

class AsignTeamUserCategoriesControllerTest < ActionDispatch::IntegrationTest
  setup do
    @asign_team_user_category = asign_team_user_categories(:one)
  end

  test "should get index" do
    get asign_team_user_categories_url
    assert_response :success
  end

  test "should get new" do
    get new_asign_team_user_category_url
    assert_response :success
  end

  test "should create asign_team_user_category" do
    assert_difference('AsignTeamUserCategory.count') do
      post asign_team_user_categories_url, params: { asign_team_user_category: { category_id: @asign_team_user_category.category_id, team_id: @asign_team_user_category.team_id, user_id: @asign_team_user_category.user_id } }
    end

    assert_redirected_to asign_team_user_category_url(AsignTeamUserCategory.last)
  end

  test "should show asign_team_user_category" do
    get asign_team_user_category_url(@asign_team_user_category)
    assert_response :success
  end

  test "should get edit" do
    get edit_asign_team_user_category_url(@asign_team_user_category)
    assert_response :success
  end

  test "should update asign_team_user_category" do
    patch asign_team_user_category_url(@asign_team_user_category), params: { asign_team_user_category: { category_id: @asign_team_user_category.category_id, team_id: @asign_team_user_category.team_id, user_id: @asign_team_user_category.user_id } }
    assert_redirected_to asign_team_user_category_url(@asign_team_user_category)
  end

  test "should destroy asign_team_user_category" do
    assert_difference('AsignTeamUserCategory.count', -1) do
      delete asign_team_user_category_url(@asign_team_user_category)
    end

    assert_redirected_to asign_team_user_categories_url
  end
end
