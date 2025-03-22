import { Room } from "../../../server/src/models"

const HOST = "https://p2p.growgen.xyz/api";

export async function createUser(id: string): Promise<string | null> {
    try {
        const data = await fetch(`${HOST}/user/${id}`, { method: "POST" }).then(
            (res) => res.json()
        );
        return data.id;
    } catch (e) {
        console.error("Failed to create user: ", e);
        return null
    }
}

export async function createRoom(userId: string): Promise<Room | null> {
    try {
        const data = await fetch(HOST + "/room", {
            method: "POST",
            body: JSON.stringify({ user_id: userId }),
        }).then((res) => res.json());

        return data
    } catch (e) {
        console.error("Failed to create room: ", e);

        return null
    }
}

export async function getRoom(code: string): Promise<Room | null> {
    try {
        const roomData = await fetch(HOST + "/room?code=" + code).then(res => res.json())
        
        return roomData
    } catch (e) {
        console.error("Failed to get room:", e)

        return null
    }
}