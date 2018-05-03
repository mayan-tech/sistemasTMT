class CreateAsignTeamUserCategories < ActiveRecord::Migration[5.1]
  def change
    create_table :asign_team_user_categories do |t|
      t.bigint :user_id
      t.bigint :category_id
      t.bigint :team_id

      t.timestamps
    end
  end
end
