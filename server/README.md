I need a cloudflare worker with KV

two models :
user{
	id: UUID
	room_id: UUID
	created: DATE
	updated: DATE
}

room{
	id: UUID
	user_id: UUID
	code: STRING // 6 random code
	created: DATE
	updated: DATE
}

User with the following API:
POST /user/:id
	{}

PATCH /user/:id
	{
		room_id: UUID
	}

Room with the following API:
POST /room/:id
	{
		user_id: UUID
	}

GET /room?code=${code}

Server Sent Event:
GET: /room/:id/user // list joined user
