class AddPrioridadToTicket < ActiveRecord::Migration[5.1]
  def change
    add_column :tickets, :prioridad, :integer
  end
end
