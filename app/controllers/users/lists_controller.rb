class Users::SessionsController < Devise::SessionsController


def index
    @users = User.all
end


end
