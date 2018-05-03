require 'test_helper'

class CorporationsControllerTest < ActionDispatch::IntegrationTest
  setup do
    @corporation = corporations(:one)
  end

  test "should get index" do
    get corporations_url
    assert_response :success
  end

  test "should get new" do
    get new_corporation_url
    assert_response :success
  end

  test "should create corporation" do
    assert_difference('Corporation.count') do
      post corporations_url, params: { corporation: { description: @corporation.description, name: @corporation.name, nit: @corporation.nit, phone: @corporation.phone, social_name: @corporation.social_name } }
    end

    assert_redirected_to corporation_url(Corporation.last)
  end

  test "should show corporation" do
    get corporation_url(@corporation)
    assert_response :success
  end

  test "should get edit" do
    get edit_corporation_url(@corporation)
    assert_response :success
  end

  test "should update corporation" do
    patch corporation_url(@corporation), params: { corporation: { description: @corporation.description, name: @corporation.name, nit: @corporation.nit, phone: @corporation.phone, social_name: @corporation.social_name } }
    assert_redirected_to corporation_url(@corporation)
  end

  test "should destroy corporation" do
    assert_difference('Corporation.count', -1) do
      delete corporation_url(@corporation)
    end

    assert_redirected_to corporations_url
  end
end
