import { NextResponse } from "next/server"
import { generateRoomCode, idMap } from "@/lib/room-manager"

export async function POST(request: Request) {
  try {
    const { peerId } = await request.json()

    if (!peerId) {
      return NextResponse.json({ error: "Peer ID is required" }, { status: 400 })
    }

    // Generate a unique 6-digit code
    const roomCode = generateRoomCode()

    // Create a new room with the peer ID
    idMap.set(roomCode, new Set([peerId]))

    console.log(`Room created: ${roomCode} with peer: ${peerId}`)

    return NextResponse.json({ roomCode })
  } catch (error) {
    console.error("Error creating room:", error)
    return NextResponse.json({ error: "Failed to create room" }, { status: 500 })
  }
}

