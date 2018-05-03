class AddCompanyIdToCorporations < ActiveRecord::Migration[5.1]
  def change
    add_column :corporations, :corporation_id, :bigint
  end
end
