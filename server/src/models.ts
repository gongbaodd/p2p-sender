import { type } from "arktype"

export const userSchema = type({
	id: "string.uuid",
	room_id: "string.uuid | null",
	created: "string.json.parse",
	updated: "string.json.parse",
})

export type User = typeof userSchema.infer

export const roomSchema = type({
	id: "string.uuid",
	user_id: "string.uuid",
	code: "string == 6",
	created: "string.json.parse",
	updated: "string.json.parse",
})

export type Room = typeof roomSchema.infer

export const createRoomBodySchema = type({
	user_id: "string.uuid",
})

export type CreateRoomBody = typeof createRoomBodySchema.infer

export const updateUserBodySchema = type({
	room_id: "string"
})

export type UpdateUserBody = typeof updateUserBodySchema.infer

