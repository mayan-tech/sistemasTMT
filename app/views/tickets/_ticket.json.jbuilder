json.extract! ticket, :id, :user_id, :categoria_id, :asunto, :descripcion, :estado, :created_at, :updated_at
json.url ticket_url(ticket, format: :json)
