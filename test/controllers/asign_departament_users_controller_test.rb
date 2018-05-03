require 'test_helper'

class AsignDepartamentUsersControllerTest < ActionDispatch::IntegrationTest
  setup do
    @asign_departament_user = asign_departament_users(:one)
  end

  test "should get index" do
    get asign_departament_users_url
    assert_response :success
  end

  test "should get new" do
    get new_asign_departament_user_url
    assert_response :success
  end

  test "should create asign_departament_user" do
    assert_difference('AsignDepartamentUser.count') do
      post asign_departament_users_url, params: { asign_departament_user: { company_id: @asign_departament_user.company_id, departament_id: @asign_departament_user.departament_id, user_id: @asign_departament_user.user_id } }
    end

    assert_redirected_to asign_departament_user_url(AsignDepartamentUser.last)
  end

  test "should show asign_departament_user" do
    get asign_departament_user_url(@asign_departament_user)
    assert_response :success
  end

  test "should get edit" do
    get edit_asign_departament_user_url(@asign_departament_user)
    assert_response :success
  end

  test "should update asign_departament_user" do
    patch asign_departament_user_url(@asign_departament_user), params: { asign_departament_user: { company_id: @asign_departament_user.company_id, departament_id: @asign_departament_user.departament_id, user_id: @asign_departament_user.user_id } }
    assert_redirected_to asign_departament_user_url(@asign_departament_user)
  end

  test "should destroy asign_departament_user" do
    assert_difference('AsignDepartamentUser.count', -1) do
      delete asign_departament_user_url(@asign_departament_user)
    end

    assert_redirected_to asign_departament_users_url
  end
end
