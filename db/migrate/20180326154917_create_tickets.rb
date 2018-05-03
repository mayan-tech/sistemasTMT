class CreateTickets < ActiveRecord::Migration[5.1]
  def change
    create_table :tickets do |t|
      t.bigint :user_id
      t.bigint :categoria_id
      t.string :asunto
      t.text :descripcion
      t.integer :estado

      t.timestamps
    end
  end
end
