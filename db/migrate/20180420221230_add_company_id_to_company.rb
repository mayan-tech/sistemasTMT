class AddCompanyIdToCompany < ActiveRecord::Migration[5.1]
  def change
    add_column :companies, :corporation_id, :bigint
  end
end
