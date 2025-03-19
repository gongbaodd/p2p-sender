"use client"

import { useState, useEffect, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Toaster } from "@/components/ui/toaster"
import { useToast } from "@/hooks/use-toast"
import { Clipboard, LinkIcon, Send } from "lucide-react"

export default function Home() {
  const [peerId, setPeerId] = useState<string | null>(null)
  const [roomCode, setRoomCode] = useState<string | null>(null)
  const [inputCode, setInputCode] = useState("")
  const [url, setUrl] = useState("")
  const [receivedUrl, setReceivedUrl] = useState<string | null>(null)
  const [connectedPeers, setConnectedPeers] = useState<Set<string>>(new Set())
  const [activeTab, setActiveTab] = useState("create")
  const peerRef = useRef<any>(null)
  const connectionsRef = useRef<Map<string, any>>(new Map())
  const { toast } = useToast()

  useEffect(() => {
    // Import PeerJS dynamically as it's a client-side only library
    const loadPeer = async () => {
      try {
        const { Peer } = await import("peerjs")
        if (!peerRef.current) {
          const peer = new Peer(undefined, {
            host: window.location.hostname,
            port: window.location.port ? Number(window.location.port) : 443,
            path: "/peer",
            secure: window.location.protocol === "https:",
          })

          peer.on("open", (id) => {
            setPeerId(id)
            console.log("My peer ID is: " + id)
          })

          peer.on("connection", (conn) => {
            handleConnection(conn)
          })

          peer.on("error", (err) => {
            console.error("Peer error:", err)
            toast({
              title: "Connection Error",
              description: "There was an error with the peer connection.",
              variant: "destructive",
            })
          })

          peerRef.current = peer
        }
      } catch (error) {
        console.error("Failed to load PeerJS:", error)
        toast({
          title: "Failed to initialize",
          description: "Could not load the peer-to-peer library.",
          variant: "destructive",
        })
      }
    }

    loadPeer()

    return () => {
      if (peerRef.current) {
        leaveRoom()
        peerRef.current.destroy()
        peerRef.current = null
      }
    }
  }, [])

  const handleConnection = (conn: any) => {
    conn.on("open", () => {
      console.log("Connection established with:", conn.peer)
      connectionsRef.current.set(conn.peer, conn)
      setConnectedPeers(new Set(connectionsRef.current.keys()))

      conn.on("data", (data: any) => {
        console.log("Received data:", data)
        if (data.type === "url") {
          setReceivedUrl(data.url)
          toast({
            title: "URL Received",
            description: "Someone shared a URL with you.",
          })
        }
      })

      conn.on("close", () => {
        console.log("Connection closed with:", conn.peer)
        connectionsRef.current.delete(conn.peer)
        setConnectedPeers(new Set(connectionsRef.current.keys()))
      })
    })
  }

  const createRoom = async () => {
    if (!peerId) return

    try {
      const response = await fetch("/api/createRoom", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ peerId }),
      })

      if (!response.ok) {
        throw new Error("Failed to create room")
      }

      const data = await response.json()
      setRoomCode(data.roomCode)
      setActiveTab("create")
      toast({
        title: "Room Created",
        description: `Your room code is: ${data.roomCode}`,
      })
    } catch (error) {
      console.error("Error creating room:", error)
      toast({
        title: "Error",
        description: "Failed to create room. Please try again.",
        variant: "destructive",
      })
    }
  }

  const joinRoom = async () => {
    if (!peerId || !inputCode || inputCode.length !== 6) return

    try {
      const response = await fetch("/api/addRoom", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ peerId, roomCode: inputCode }),
      })

      if (!response.ok) {
        throw new Error("Failed to join room")
      }

      const data = await response.json()

      if (data.peerIds && data.peerIds.length > 0) {
        // Connect to all peers in the room
        data.peerIds.forEach((id: string) => {
          if (id !== peerId && !connectionsRef.current.has(id)) {
            const conn = peerRef.current.connect(id)
            handleConnection(conn)
          }
        })

        setRoomCode(inputCode)
        setActiveTab("join")
        toast({
          title: "Room Joined",
          description: `You've joined room: ${inputCode}`,
        })
      } else {
        toast({
          title: "Empty Room",
          description: "No peers found in this room.",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Error joining room:", error)
      toast({
        title: "Error",
        description: "Failed to join room. Please check the code and try again.",
        variant: "destructive",
      })
    }
  }

  const leaveRoom = async () => {
    if (!peerId || !roomCode) return

    try {
      const response = await fetch("/api/leaveRoom", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ peerId, roomCode }),
      })

      if (!response.ok) {
        throw new Error("Failed to leave room")
      }

      // Close all connections
      connectionsRef.current.forEach((conn) => {
        conn.close()
      })
      connectionsRef.current.clear()
      setConnectedPeers(new Set())

      setRoomCode(null)
      setReceivedUrl(null)
      setUrl("")
      toast({
        title: "Room Left",
        description: "You've left the room.",
      })
    } catch (error) {
      console.error("Error leaving room:", error)
      toast({
        title: "Error",
        description: "Failed to leave room properly.",
        variant: "destructive",
      })
    }
  }

  const sendUrl = () => {
    if (!url || connectionsRef.current.size === 0) return

    connectionsRef.current.forEach((conn) => {
      conn.send({ type: "url", url })
    })

    toast({
      title: "URL Sent",
      description: `URL sent to ${connectionsRef.current.size} connected peer(s).`,
    })
    setUrl("")
  }

  const copyRoomCode = () => {
    if (roomCode) {
      navigator.clipboard.writeText(roomCode)
      toast({
        title: "Copied",
        description: "Room code copied to clipboard.",
      })
    }
  }

  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-4 bg-gray-50">
      <div className="w-full max-w-md">
        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle className="text-2xl text-center">Share URLs</CardTitle>
            <CardDescription className="text-center">Send URLs between your devices easily</CardDescription>
          </CardHeader>
          <CardContent>
            {!roomCode ? (
              <Tabs defaultValue={activeTab} onValueChange={setActiveTab}>
                <TabsList className="grid w-full grid-cols-2 mb-4">
                  <TabsTrigger value="create">Create Room</TabsTrigger>
                  <TabsTrigger value="join">Join Room</TabsTrigger>
                </TabsList>
                <TabsContent value="create">
                  <div className="space-y-4">
                    <p className="text-sm text-muted-foreground text-center">
                      Create a new room to share URLs between devices
                    </p>
                    <Button className="w-full" onClick={createRoom} disabled={!peerId}>
                      Create Room
                    </Button>
                  </div>
                </TabsContent>
                <TabsContent value="join">
                  <div className="space-y-4">
                    <p className="text-sm text-muted-foreground text-center">Enter a 6-digit room code to join</p>
                    <div className="flex space-x-2">
                      <Input
                        placeholder="6-digit code"
                        value={inputCode}
                        onChange={(e) => setInputCode(e.target.value)}
                        maxLength={6}
                      />
                      <Button onClick={joinRoom} disabled={!peerId || inputCode.length !== 6}>
                        Join
                      </Button>
                    </div>
                  </div>
                </TabsContent>
              </Tabs>
            ) : activeTab === "create" ? (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="text-center w-full">
                    <p className="text-sm text-muted-foreground mb-1">Your room code:</p>
                    <div className="flex items-center justify-center space-x-2">
                      <Badge variant="outline" className="text-lg py-2 px-4">
                        {roomCode}
                      </Badge>
                      <Button size="icon" variant="ghost" onClick={copyRoomCode}>
                        <Clipboard className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <p className="text-sm text-muted-foreground">Connected peers: {connectedPeers.size}</p>
                  <div className="flex space-x-2">
                    <Input placeholder="Enter URL to share" value={url} onChange={(e) => setUrl(e.target.value)} />
                    <Button onClick={sendUrl} disabled={!url || connectedPeers.size === 0}>
                      <Send className="h-4 w-4 mr-2" />
                      Send
                    </Button>
                  </div>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="text-center">
                  <p className="text-sm text-muted-foreground mb-1">Connected to room:</p>
                  <Badge variant="outline" className="text-lg py-2 px-4">
                    {roomCode}
                  </Badge>
                </div>

                {receivedUrl && (
                  <div className="p-4 border rounded-md bg-muted/50">
                    <p className="text-sm font-medium mb-2">Received URL:</p>
                    <a
                      href={receivedUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center text-primary hover:underline break-all"
                    >
                      <LinkIcon className="h-4 w-4 mr-2 flex-shrink-0" />
                      {receivedUrl}
                    </a>
                  </div>
                )}
              </div>
            )}
          </CardContent>
          <CardFooter>
            {roomCode && (
              <Button variant="destructive" className="w-full" onClick={leaveRoom}>
                Leave Room
              </Button>
            )}
          </CardFooter>
        </Card>
      </div>
      <Toaster />
    </main>
  )
}

