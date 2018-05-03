class CreateAsginarTickets < ActiveRecord::Migration[5.1]
  def change
    create_table :asginar_tickets do |t|
      t.bigint :user_id
      t.bigint :ticket_id

      t.timestamps
    end
  end
end
