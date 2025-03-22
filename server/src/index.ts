import { AutoRouter, cors, StatusError, withContent, json } from "itty-router"
import { CreateRoomBody, createRoomBodySchema, Room, UpdateUserBody, updateUserBodySchema, User, userSchema } from "./models"
import { type } from "arktype"
import { getAssetFromKV } from "@cloudflare/kv-asset-handler"
import { unknown } from "arktype/internal/keywords/ts.ts"

const { preflight, corsify } = cors()
const pageRouter = AutoRouter({
	before: [preflight],
	finally: [corsify],
})
const apiRouter = AutoRouter({})

export default {
	fetch(req: Request, env: Env, ctx: ExecutionContext) {
		return pageRouter.fetch(req, env, ctx)
	}
}

pageRouter
	.all("*", async (request, env, ctx) => {
		try {
			return await getAssetFromKV({ request, waitUntil(p) { return ctx.waitUntil(p) } })
		} catch {
			const url = new URL(request.url)
			if (url.pathname.startsWith("/api/")) {
				return apiRouter.fetch(request, env, ctx)
			}

			throw new StatusError(404, "Page not found")
		}
	})


apiRouter
	.post("/api/user/:id", async ({ id: userId }, env: Env) => {
		validateUUID(userId)
		return await createUser(env, userId)
	})
	.patch("/api/user/:id", withContent, async (...args) => {
		const [{ id: userId, content }] = args
		const env = Reflect.get(args, 1) as unknown as Env

		validateUUID(userId)
		const out = updateUserBodySchema(content)
		if (out instanceof type.errors) {
			throw new StatusError(409, out.summary)
		}

		await updateUser(env, userId, content)
		return
	})
	.post("/api/room/", withContent, async (...args) => {
		const [{ content }] = args
		const env = Reflect.get(args, 1) as unknown as Env

		const out = createRoomBodySchema(content)
		if (out instanceof type.errors) {
			throw new StatusError(409, out.summary)
		}


		return await createRoom(env, content)
	})
	.get("/api/room", async (...args) => {
		const [{ query }] = args
		const env = Reflect.get(args, 1) as unknown as Env

		const code = query.code as string
		const out = type("string == 6")(code)
		if (out instanceof type.errors) {
			throw new StatusError(409, out.summary)
		}

		return await getRoomByCode(env, code)
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
	await updateUser(env, content.user_id, { room_id: roomId })

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

function validateUUID(id: string) {
	const uuidSchema = type("string.uuid")
	const out = uuidSchema(id)
	if (out instanceof type.errors) {
		throw new StatusError(409, out.summary)
	}
}
