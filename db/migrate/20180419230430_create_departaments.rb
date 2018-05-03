class CreateDepartaments < ActiveRecord::Migration[5.1]
  def change
    create_table :departaments do |t|
      t.string :name
      t.bigint :company_id

      t.timestamps
    end
  end
end
