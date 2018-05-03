class CreateCompanies < ActiveRecord::Migration[5.1]
  def change
    create_table :companies do |t|
      t.string :name
      t.text :description
      t.string :social_name
      t.integer :nit

      t.timestamps
    end
  end
end
