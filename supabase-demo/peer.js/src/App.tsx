import React, { useState, useEffect, useCallback } from 'react';
import { Peer, DataConnection } from 'peerjs';
import { Share2, Users, Link, X } from 'lucide-react';
import { nanoid } from 'nanoid';

interface PeerConnection {
  conn: DataConnection;
  id: string;
}

function generateRoomCode(): string {
  return nanoid(6).toUpperCase();
}

function App() {
  const [peer, setPeer] = useState<Peer | null>(null);
  const [roomCode, setRoomCode] = useState<string>('');
  const [inputCode, setInputCode] = useState<string>('');
  const [connections, setConnections] = useState<PeerConnection[]>([]);
  const [urlInput, setUrlInput] = useState<string>('');
  const [receivedUrls, setReceivedUrls] = useState<string[]>([]);
  const [error, setError] = useState<string>('');

  // Initialize peer connection
  useEffect(() => {
    const newPeer = new Peer();
    
    newPeer.on('open', (id) => {
      console.log('My peer ID is:', id);
      setPeer(newPeer);
    });

    newPeer.on('connection', (conn) => {
      console.log(conn)
      handleConnection(conn);
    });

    newPeer.on('error', (err) => {
      setError(`Connection error: ${err.message}`);
    });

    return () => {
      newPeer.destroy();
    };
  }, []);

  const handleConnection = useCallback((conn: DataConnection) => {
    conn.on('open', () => {
      setConnections(prev => [...prev, { conn, id: conn.peer }]);
    });

    conn.on('data', (data: any) => {
      if (typeof data === 'string') {
        setReceivedUrls(prev => [...prev, data]);
      }
    });

    conn.on('close', () => {
      setConnections(prev => prev.filter(c => c.conn !== conn));
    });
  }, []);

  const createRoom = () => {
    const code = generateRoomCode();
    setRoomCode(code);
    setError('');
  };

  const joinRoom = async () => {
    if (!peer || !inputCode) return;
    
    try {
      const conn = peer.connect(inputCode);
      handleConnection(conn);
      setError('');
    } catch (err) {
      setError('Failed to join room. Please check the code and try again.');
    }
  };

  const shareUrl = () => {
    if (!urlInput.trim()) return;
    
    connections.forEach(({ conn }) => {
      conn.send(urlInput);
    });
    
    setReceivedUrls(prev => [...prev, urlInput]);
    setUrlInput('');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-100 to-purple-100 p-8">
      <div className="max-w-2xl mx-auto space-y-8">
        <h1 className="text-4xl font-bold text-center text-indigo-900 mb-8">
          URL Share Room
        </h1>

        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative">
            <span className="block sm:inline">{error}</span>
            <button
              className="absolute top-0 bottom-0 right-0 px-4"
              onClick={() => setError('')}
            >
              <X size={18} />
            </button>
          </div>
        )}

        <div className="bg-white rounded-lg shadow-lg p-6 space-y-4">
          <h2 className="text-2xl font-semibold text-gray-800 flex items-center gap-2">
            <Share2 className="text-indigo-600" />
            Host Connection
          </h2>
          
          {!roomCode ? (
            <button
              onClick={createRoom}
              className="w-full bg-indigo-600 text-white py-2 px-4 rounded-lg hover:bg-indigo-700 transition-colors"
            >
              Create Room
            </button>
          ) : (
            <div className="space-y-4">
              <div className="bg-gray-100 p-4 rounded-lg text-center">
                <p className="text-sm text-gray-600">Room Code</p>
                <p className="text-3xl font-mono font-bold text-indigo-600 tracking-wider">
                  {roomCode}
                </p>
              </div>

              <div className="space-y-2">
                <div className="flex gap-2">
                  <input
                    type="url"
                    value={urlInput}
                    onChange={(e) => setUrlInput(e.target.value)}
                    placeholder="Enter URL to share..."
                    className="flex-1 border rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                  <button
                    onClick={shareUrl}
                    disabled={connections.length === 0}
                    className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center gap-2"
                  >
                    <Link size={18} />
                    Share URL ({connections.length})
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="bg-white rounded-lg shadow-lg p-6 space-y-4">
          <h2 className="text-2xl font-semibold text-gray-800 flex items-center gap-2">
            <Users className="text-indigo-600" />
            Join Connection
          </h2>
          
          <div className="flex gap-2">
            <input
              type="text"
              value={inputCode}
              onChange={(e) => setInputCode(e.target.value.toUpperCase())}
              placeholder="Enter 6-digit code"
              className="flex-1 border rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              maxLength={6}
            />
            <button
              onClick={joinRoom}
              disabled={!inputCode || inputCode.length !== 6}
              className="bg-indigo-600 text-white px-6 py-2 rounded-lg hover:bg-indigo-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
            >
              Join Room
            </button>
          </div>
        </div>

        {receivedUrls.length > 0 && (
          <div className="bg-white rounded-lg shadow-lg p-6 space-y-4">
            <h2 className="text-2xl font-semibold text-gray-800 flex items-center gap-2">
              <Link className="text-indigo-600" />
              Shared URLs
            </h2>
            <ul className="space-y-2">
              {receivedUrls.map((url, index) => (
                <li key={index} className="bg-gray-50 p-3 rounded-lg">
                  <a
                    href={url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-indigo-600 hover:text-indigo-800 break-all"
                  >
                    {url}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
}

export default App;