json.extract! ticket_file, :id, :ticket_id, :user_id, :mensaje, :created_at, :updated_at
json.url ticket_file_url(ticket_file, format: :json)
