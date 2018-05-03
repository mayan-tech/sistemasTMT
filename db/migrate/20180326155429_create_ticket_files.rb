class CreateTicketFiles < ActiveRecord::Migration[5.1]
  def change
    create_table :ticket_files do |t|
      t.bigint :ticket_id
      t.bigint :user_id
      t.text :mensaje

      t.timestamps
    end
  end
end
