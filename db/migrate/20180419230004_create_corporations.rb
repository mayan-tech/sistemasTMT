class CreateCorporations < ActiveRecord::Migration[5.1]
  def change
    create_table :corporations do |t|
      t.string :name
      t.text :description
      t.integer :phone
      t.integer :nit
      t.string :social_name

      t.timestamps
    end
  end
end
