import { NextResponse } from "next/server"
import { idMap } from "@/lib/room-manager"

export async function PATCH(request: Request) {
  try {
    const { peerId, roomCode } = await request.json()

    if (!peerId || !roomCode) {
      return NextResponse.json({ error: "Peer ID and room code are required" }, { status: 400 })
    }

    // Check if the room exists
    if (!idMap.has(roomCode)) {
      return NextResponse.json({ error: "Room not found" }, { status: 404 })
    }

    // Remove the peer from the room
    const peerSet = idMap.get(roomCode)!
    peerSet.delete(peerId)

    console.log(`Peer ${peerId} left room: ${roomCode}`)

    // If the room is empty, delete it
    if (peerSet.size === 0) {
      idMap.delete(roomCode)
      console.log(`Room deleted: ${roomCode}`)
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error leaving room:", error)
    return NextResponse.json({ error: "Failed to leave room" }, { status: 500 })
  }
}

