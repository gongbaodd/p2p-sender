import Peer, { DataConnection, PeerError } from "peerjs";
import { useCallback, useEffect, useRef } from "react";

interface PeerOptions {
  onOpen: (id: string) => void,
  onConnection: (conn: DataConnection) => void,
  onData: (conn: DataConnection, data: string) => void,
  onError: (err: PeerError<string>) => void
}

const PILOT = "pilot"
export function createPeerRef(opt: PeerOptions) {
  const peerRef = useRef<Peer | null>(null)
  const connGetPilotMap = useRef<WeakMap<DataConnection, boolean>>(new WeakMap())

  useEffect(() => {
    if (peerRef.current) return

    const peer = new Peer()
    peerRef.current = peer

    peer.on('open', opt.onOpen)

    peer.on('connection', conn => {
      opt.onConnection(conn)
      connGetPilotMap.current.set(conn, true)

      conn.on("data", (data) => {
        opt.onData(conn, data as string)
      })

      conn.on("error", opt.onError)

      setTimeout(() => {
        conn.send(PILOT)
        debug("Sender: sending pilot")
      }, 50)

    })

    peer.on('error', opt.onError)
  }, [])

  const connectPeer = useCallback((targetId: string) => {
    if (!peerRef.current) return
    const peer = peerRef.current
    const conn = peer.connect(targetId)

    conn.on("data", data => {
      if (!connGetPilotMap.current.get(conn)) {
        if (data === PILOT) {
          connGetPilotMap.current.set(conn, true)
          opt.onConnection(conn)

          debug("Receiver: received pilot")
          return
        }
      }

      opt.onData(conn, data as string)
    })

    conn.on("error", opt.onError)
  }, [])

  return { peerRef, connectPeer }
}


function debug(content: string) {
  console.log(content)
}