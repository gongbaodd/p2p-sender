import React, { useEffect, useState } from 'react';
import { Clock } from 'lucide-react';

function App() {
  const [timestamps, setTimestamps] = useState<string[]>([]);

  useEffect(() => {
    const eventSource = new EventSource('http://localhost:3000/sse');
    
    eventSource.onmessage = (event) => {
      const data = JSON.parse(event.data);
      setTimestamps(prev => [...prev, data.timestamp]);
    };

    return () => {
      eventSource.close();
    };
  }, []);

  const handleClick = async () => {
    try {
      await fetch('http://localhost:3000/click');
    } catch (error) {
      console.error('Error sending click:', error);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <div className="max-w-md mx-auto bg-white rounded-xl shadow-md overflow-hidden">
        <div className="p-8">
          <div className="flex items-center justify-between mb-6">
            <h1 className="text-2xl font-bold text-gray-800">Timestamp Logger</h1>
            <Clock className="text-blue-500" size={24} />
          </div>
          
          <button
            onClick={handleClick}
            className="w-full bg-blue-500 hover:bg-blue-600 text-white font-semibold py-2 px-4 rounded-lg transition duration-200 ease-in-out mb-6"
          >
            Record Timestamp
          </button>

          <div className="bg-gray-50 rounded-lg p-4">
            <h2 className="text-lg font-semibold text-gray-700 mb-3">Recorded Timestamps</h2>
            <div className="space-y-2 max-h-60 overflow-y-auto">
              {timestamps.map((timestamp, index) => (
                <div
                  key={index}
                  className="bg-white p-3 rounded-md shadow-sm border border-gray-200"
                >
                  {new Date(timestamp).toLocaleString()}
                </div>
              ))}
              {timestamps.length === 0 && (
                <p className="text-gray-500 text-center py-4">No timestamps recorded yet</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;