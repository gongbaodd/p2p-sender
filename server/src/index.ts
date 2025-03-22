import { AutoRouter, cors, StatusError, withContent, json } from "itty-router"
import { CreateRoomBody, createRoomBodySchema, Room, UpdateUserBody, updateUserBodySchema, User, userSchema } from "./models"
import { type } from "arktype"
import { getAssetFromKV } from "@cloudflare/kv-asset-handler"

const { preflight, corsify } = cors()
const frontEnd = AutoRouter({
	before: [preflight],
	finally: [corsify],
})
const backEnd = AutoRouter({})

export default {
	fetch(req: Request, env: Env, ctx: ExecutionContext) {
		return frontEnd.fetch(req, env, ctx)
	}
}

frontEnd
	.all("*", async (request, env, ctx) => {
		try {
			return await getAssetFromKV({ request, waitUntil(p) { return ctx.waitUntil(p) }})
		} catch {
			return await backEnd.fetch(request, env, ctx)
		}
	})

backEnd
	.post("/user/:id", async ({ id: userId }, env: Env, ctx) => {
		validateUUID(userId)
		return await createUser(env, userId)
	})
	.patch("/user/:id", withContent, async ({ id: userId, content, env }) => {
		validateUUID(userId)
		const out = updateUserBodySchema(content)
		if (out instanceof type.errors) {
			throw new StatusError(409, out.summary)
		}

		return await updateUser(env, userId, content)
	})
	.post("/room/", withContent, async ({ content, env }) => {
		const out = createRoomBodySchema(content)
		if (out instanceof type.errors) {
			throw new StatusError(409, out.summary)
		}

		return await createRoom(env, content)
	})
	.get("/room", async ({ query, env }) => {
		const code = query.code as string
		const out = type("string == 6")(code)
		if (out instanceof type.errors) {
			throw new StatusError(409, out.summary)
		}

		return await getRoomByCode(env, code)
	})
	.get("/room/:id/user", ({ id: roomId, env }) => {
		validateUUID(roomId)
		streamRoomUsers(env, roomId);
	})

async function createUser(env: Env, userId: string) {
	const user: User = {
		id: userId,
		room_id: null,
		created: new Date().toISOString(),
		updated: new Date().toISOString(),
	}
	await env.USERS.put(userId, JSON.stringify(user))
	return user
}

async function updateUser(env: Env, userId: string, body: UpdateUserBody) {
	let user = await env.USERS.get(userId, { type: "json" }) as User | null
	if (!user) {
		throw new StatusError(404, "User not found")
	}

	user = {
		...user,
		...body,
		updated: new Date().toISOString()
	}
	await env.USERS.put(userId, JSON.stringify(user))

	if (user.room_id) {
		const roomUserStream = roomUserStreams.get(user.room_id)
		if (roomUserStream) {
			roomUserStream.enqueue(user.id)
		}
	}

	return user
}

async function createRoom(env: Env, content: CreateRoomBody) {
	const code = Math.random().toString(36).slice(-6).toUpperCase()
	const roomId = crypto.randomUUID()
	const room: Room = {
		id: roomId,
		user_id: content.user_id,
		code,
		created: new Date().toISOString(),
		updated: new Date().toISOString(),
	}

	await env.ROOMS.put(roomId, JSON.stringify(room));

	return room
}

async function getRoomByCode(env: Env, code: string) {
	const keys = await env.ROOMS.list();
	for (const key of keys.keys) {
		const room = await env.ROOMS.get(key.name, { type: 'json' }) as Room | null;
		if (room && room.code === code) {
			return room
		}
	}

	throw new StatusError(404, "Room not found")
}

type RoomUserStream = { enqueue: (userId: User["id"]) => void }
const roomUserStreams: Map<Room["id"], RoomUserStream> = new Map();
async function streamRoomUsers(env: Env, roomId: Room["id"]) {
	const stream = new ReadableStream({
		start(controller) {
			const roomUserStream: RoomUserStream = {
				enqueue(userId: User["id"]) {
					controller.enqueue(`data: ${JSON.stringify({ userId })}`)
				}
			}

			roomUserStreams.set(roomId, roomUserStream)

			controller.close = async () => {
				roomUserStreams.delete(roomId)
				// TODO: remove users
				await env.ROOMS.delete(roomId)
			}
		}
	})

	return stream
}

function validateUUID(id: string) {
	const uuidSchema = type("string.uuid")
	const out = uuidSchema(id)
	if (out instanceof type.errors) {
		throw new StatusError(409, out.summary)
	}
}
