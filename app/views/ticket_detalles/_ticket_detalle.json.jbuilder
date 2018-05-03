json.extract! ticket_detalle, :id, :user_id, :ticket_id, :mensaje, :created_at, :updated_at
json.url ticket_detalle_url(ticket_detalle, format: :json)
