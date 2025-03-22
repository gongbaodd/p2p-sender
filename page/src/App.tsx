import { useState, useCallback, FormEvent } from "react";
import { DataConnection } from "peerjs";
import { Share2, Send, Link } from "lucide-react";
import { createPeerRef } from "./hooks/createPeerRef";
import { createRoom, createUser, getRoom } from "./hooks/apiCalls";

function App() {
  const [userId, setUserId] = useState("");
  const [roomId, setRoomId] = useState("");
  const [roomCode, setRoomCode] = useState("");
  const [hostId, setHostId] = useState("");
  const [url, setUrl] = useState("");
  const [conns, setConns] = useState<DataConnection[]>([]);
  const [receivedUrl, setReceivedUrl] = useState("");

  const isHost = userId === hostId;

  const { peerRef, connectPeer } = createPeerRef({
    onOpen: async (id) => {
      await createUser(id);
      setUserId(id);
    },
    onConnection: (conn) => {
      setConns((prev) => [...prev, conn]);
    },

    onData: (_, data) => {
      setReceivedUrl(data as string);
    },
  });

  const handleCreateRoom = useCallback(async () => {
    const room = await createRoom(userId);
    if (!room) return;

    const { id, code } = room;
    setRoomId(id);
    setRoomCode(code);
    setHostId(userId);
  }, [userId]);

  const handleJoinRoom = useCallback(
    async (event: FormEvent) => {
      event.preventDefault();

      if (!peerRef.current) return;
      if (!roomCode) return;

      const room = await getRoom(roomCode);
      if (!room) return;

      setRoomId(room.id);
      setHostId(room.user_id);

      connectPeer(room.user_id);
    },
    [roomCode]
  );

  const handleSendUrl = useCallback(
    (event: FormEvent) => {
      event.preventDefault();

      if (!url) return;

      for (const conn of conns) {
        conn.send(url);
      }
    },
    [conns, url]
  );

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-xl p-8 w-full max-w-md">
        <h1 className="text-2xl font-bold text-center mb-8">URL Sharing</h1>
        <div className="debug">
          <span>user id:</span>
          {userId}
          <br />
          <span>host id:</span>
          {hostId}
          <br />
          <span>room id:</span>
          {roomId}
        </div>

        {/* Create Room Section */}
        <div
          className={`space-y-4 ${
            roomId && !conns.length ? "opacity-50 pointer-events-none" : ""
          }`}
        >
          {!roomId ? (
            <>
              <button
                onClick={handleCreateRoom}
                disabled={!userId}
                className="w-full flex items-center justify-center gap-2 bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Share2 size={20} />
                Create Room
              </button>
            </>
          ) : (
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <div className="flex-1 bg-gray-100 p-3 rounded-lg text-center font-mono">
                  {roomCode}
                </div>
              </div>
              {isHost && (
                <form
                  className="space-y-2"
                  name="sendUrl"
                  onSubmit={handleSendUrl}
                >
                  <input
                    type="url"
                    value={url}
                    onChange={(e) => setUrl(e.target.value)}
                    placeholder="Enter URL to share..."
                    className="w-full p-2 border rounded-lg"
                    name="url"
                  />
                  <button
                    type="submit"
                    disabled={conns.length < 1 || !url}
                    className="w-full flex items-center justify-center gap-2 bg-green-600 text-white py-2 px-4 rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <Send size={20} />
                    Send URL ({conns.length} connected)
                  </button>
                </form>
              )}
            </div>
          )}
        </div>

        {/* Join Room Section */}
        <form
          className={`mt-8 space-y-4`}
          onSubmit={handleJoinRoom}
          name="joinRoom"
        >
          {!roomId ? (
            <div className="space-y-2">
              <input
                type="text"
                value={roomCode}
                onChange={(e) => setRoomCode(e.target.value.toUpperCase())}
                placeholder="Enter 6-digit room code"
                className="w-full p-2 border rounded-lg uppercase"
                maxLength={6}
                name="roomCode"
              />
              <button
                type="submit"
                disabled={roomCode.length !== 6}
                className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Join Room
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              {receivedUrl && (
                <a
                  href={receivedUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 p-3 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                >
                  <Link size={20} />
                  <span className="truncate">{receivedUrl}</span>
                </a>
              )}
            </div>
          )}
        </form>
      </div>
    </div>
  );
}

export default App;
