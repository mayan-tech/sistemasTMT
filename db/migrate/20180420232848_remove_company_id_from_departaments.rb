class RemoveCompanyIdFromDepartaments < ActiveRecord::Migration[5.1]
  def change
    remove_column :departaments, :company_id, :bigint
  end
end
