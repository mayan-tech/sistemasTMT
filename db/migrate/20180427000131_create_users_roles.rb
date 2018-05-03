class CreateUsersRoles < ActiveRecord::Migration[5.1]
  def change
    create_table :users_roles do |t|
      t.bigint :user_id
      t.bigint :role_id

      t.timestamps
    end
  end
end
