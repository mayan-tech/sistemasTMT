class CreateAsignDepartamentUsers < ActiveRecord::Migration[5.1]
  def change
    create_table :asign_departament_users do |t|
      t.bigint :user_id
      t.bigint :departament_id
      t.bigint :company_id

      t.timestamps
    end
  end
end
