import React, { useState, useEffect, useCallback } from 'react';
import { Peer } from 'peerjs';
import { Share2, X, Send, Link } from 'lucide-react';

interface Room {
  code: string;
  peer: Peer;
  connections: any[];
}

function App() {
  const [room, setRoom] = useState<Room | null>(null);
  const [url, setUrl] = useState('');
  const [joinCode, setJoinCode] = useState('');
  const [peerCount, setPeerCount] = useState(1);
  const [receivedUrl, setReceivedUrl] = useState('');

  const createRoom = useCallback(async (peer: Peer) => {
    try {
      const response = await fetch('http://localhost:3000/createRoom', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ peerId: peer.id })
      });
      const data = await response.json();
      setRoom({ code: data.code, peer, connections: [] });
    } catch (error) {
      console.error('Failed to create room:', error);
    }
  }, []);

  const handleCreateRoom = useCallback(async () => {
    const peer = new Peer();
    
    peer.on('open', () => createRoom(peer));
    
    peer.on('connection', (conn) => {
      conn.on('data', (data) => {
        if (typeof data === 'string') {
          setReceivedUrl(data);
        }
      });
      setRoom(prev => prev ? {
        ...prev,
        connections: [...prev.connections, conn]
      } : null);
      setPeerCount(prev => prev + 1);
    });
  }, [createRoom]);

  const handleJoinRoom = useCallback(async () => {
    if (!joinCode) return;

    const peer = new Peer();
    
    peer.on('open', async (id) => {
      try {
        const response = await fetch('http://localhost:3000/addRoom', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ code: joinCode, peerId: id })
        });
        const data = await response.json();
        
        if (data.success) {
          const conn = peer.connect(Array.from(peer.connections.keys())[0]);
          setRoom({ code: joinCode, peer, connections: [conn] });
          setPeerCount(data.peerCount);
          
          conn.on('data', (data) => {
            if (typeof data === 'string') {
              setReceivedUrl(data);
            }
          });
        }
      } catch (error) {
        console.error('Failed to join room:', error);
      }
    });
  }, [joinCode]);

  const handleLeaveRoom = useCallback(async () => {
    if (!room) return;

    try {
      await fetch('http://localhost:3000/leaveRoom', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: room.code, peerId: room.peer.id })
      });
      
      room.peer.destroy();
      setRoom(null);
      setPeerCount(1);
      setUrl('');
      setJoinCode('');
      setReceivedUrl('');
    } catch (error) {
      console.error('Failed to leave room:', error);
    }
  }, [room]);

  const handleSendUrl = useCallback(() => {
    if (!room || !url) return;
    
    room.connections.forEach(conn => {
      conn.send(url);
    });
  }, [room, url]);

  useEffect(() => {
    return () => {
      if (room) {
        room.peer.destroy();
      }
    };
  }, [room]);

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-xl p-8 w-full max-w-md">
        <h1 className="text-2xl font-bold text-center mb-8">URL Sharing</h1>
        
        {/* Create Room Section */}
        <div className={`space-y-4 ${room && !room.connections.length ? 'opacity-50 pointer-events-none' : ''}`}>
          {!room ? (
            <button
              onClick={handleCreateRoom}
              className="w-full flex items-center justify-center gap-2 bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Share2 size={20} />
              Create Room
            </button>
          ) : (
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <div className="flex-1 bg-gray-100 p-3 rounded-lg text-center font-mono">
                  {room.code}
                </div>
                <button
                  onClick={handleLeaveRoom}
                  className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                >
                  <X size={20} />
                </button>
              </div>
              
              <div className="space-y-2">
                <input
                  type="url"
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  placeholder="Enter URL to share..."
                  className="w-full p-2 border rounded-lg"
                />
                <button
                  onClick={handleSendUrl}
                  disabled={peerCount < 2 || !url}
                  className="w-full flex items-center justify-center gap-2 bg-green-600 text-white py-2 px-4 rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Send size={20} />
                  Send URL ({peerCount} connected)
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Join Room Section */}
        <div className={`mt-8 space-y-4 ${room && room.connections.length ? 'opacity-50 pointer-events-none' : ''}`}>
          {!room ? (
            <div className="space-y-2">
              <input
                type="text"
                value={joinCode}
                onChange={(e) => setJoinCode(e.target.value)}
                placeholder="Enter 6-digit room code"
                className="w-full p-2 border rounded-lg"
                maxLength={6}
              />
              <button
                onClick={handleJoinRoom}
                disabled={joinCode.length !== 6}
                className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Join Room
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              <button
                onClick={handleLeaveRoom}
                className="w-full flex items-center justify-center gap-2 bg-red-600 text-white py-2 px-4 rounded-lg hover:bg-red-700 transition-colors"
              >
                <X size={20} />
                Leave Room
              </button>
              
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
        </div>
      </div>
    </div>
  );
}

export default App;