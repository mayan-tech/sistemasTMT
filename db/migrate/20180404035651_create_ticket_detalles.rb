class CreateTicketDetalles < ActiveRecord::Migration[5.1]
  def change
    create_table :ticket_detalles do |t|
      t.bigint :user_id
      t.bigint :ticket_id
      t.text :mensaje

      t.timestamps
    end
  end
end
