class AddCorporationIdToDepartaments < ActiveRecord::Migration[5.1]
  def change
    add_column :departaments, :corporation_id, :bigint
  end
end
