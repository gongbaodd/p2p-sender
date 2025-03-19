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

    // Add the peer to the room
    const peerSet = idMap.get(roomCode)!
    peerSet.add(peerId)

    console.log(`Peer ${peerId} joined room: ${roomCode}`)

    // Return all peers in the room (except the joining peer)
    const peerIds = Array.from(peerSet).filter((id) => id !== peerId)

    return NextResponse.json({
      success: true,
      peerIds,
    })
  } catch (error) {
    console.error("Error joining room:", error)
    return NextResponse.json({ error: "Failed to join room" }, { status: 500 })
  }
}

