class ApplicationController < ActionController::Base
  # Prevent CSRF attacks by raising an exception.
  # For APIs, you may want to use :null_session instead.
  protected


  layout :layout_by_resource

  def admin_required
     unless current_user && current_user.is_admin?
       flash[:error] = "Sorry, you don't have access to that."
       redirect_to root_url and return false
     end
   end


   private

   def layout_by_resource
     if devise_controller?
       "pages"
     else
       "application"
     end
   end



   rescue_from CanCan::AccessDenied do |exception|
     flash[:error] = "Aceso denegado"
     redirect_to root_url
   end





end
