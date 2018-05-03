class RemoveCategoriaIdFromTickets < ActiveRecord::Migration[5.1]
  def change
    remove_column :tickets, :categoria_id, :bigint
    add_column :tickets, :category_id, :bigint
  end
end
