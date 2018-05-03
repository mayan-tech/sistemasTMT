class AsignTeamUserCategory < ApplicationRecord
  belongs_to :user
  belongs_to :team
  belongs_to :category
end
