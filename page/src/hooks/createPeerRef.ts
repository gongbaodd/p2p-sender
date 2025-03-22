import Peer, { DataConnection } from "peerjs";
import { useEffect, useRef } from "react";

interface PeerOptions {
  onOpen: (id: string) => void,
  onConnection: (conn: DataConnection) => void
}
export function createPeerRef(opt: PeerOptions) {
  const peerRef = useRef<Peer | null>(null)


  useEffect(() => {
    if (peerRef.current) return

    const peer = new Peer()
    peerRef.current = peer

    peer.on('open', opt.onOpen)

    peer.on('connection', opt.onConnection)
  }, [])

  return peerRef

}