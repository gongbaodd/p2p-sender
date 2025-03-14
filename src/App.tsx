import React, { useState } from 'react';
import { Bluetooth, Loader2 } from 'lucide-react';

interface BluetoothDevice {
  name: string | null;
  id: string;
}

function App() {
  const [devices, setDevices] = useState<BluetoothDevice[]>([]);
  const [isScanning, setIsScanning] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const startScanning = async () => {
    try {
      setIsScanning(true);
      setError(null);
      
      // Request Bluetooth device
      const device = await navigator.bluetooth.requestDevice({
        acceptAllDevices: true,
        optionalServices: [] // Add specific services if needed
      });

      // Add device to list if not already present
      setDevices(prev => {
        const exists = prev.some(d => d.id === device.id);
        if (!exists) {
          return [...prev, { name: device.name, id: device.id }];
        }
        return prev;
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to scan for devices');
    } finally {
      setIsScanning(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 p-8">
      <div className="max-w-2xl mx-auto">
        <div className="bg-white rounded-2xl shadow-xl p-8">
          <div className="flex items-center gap-3 mb-8">
            <Bluetooth className="w-8 h-8 text-blue-600" />
            <h1 className="text-2xl font-bold text-gray-800">Bluetooth Scanner</h1>
          </div>

          <button
            onClick={startScanning}
            disabled={isScanning}
            className="w-full bg-blue-600 text-white rounded-lg px-4 py-3 flex items-center justify-center gap-2 hover:bg-blue-700 transition-colors disabled:bg-blue-400"
          >
            {isScanning ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Scanning...
              </>
            ) : (
              <>
                <Bluetooth className="w-5 h-5" />
                Scan for Devices
              </>
            )}
          </button>

          {error && (
            <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
              {error}
            </div>
          )}

          <div className="mt-8">
            <h2 className="text-lg font-semibold text-gray-700 mb-4">
              {devices.length > 0 ? 'Found Devices' : 'No devices found'}
            </h2>
            
            <div className="space-y-3">
              {devices.map(device => (
                <div
                  key={device.id}
                  className="p-4 bg-gray-50 rounded-lg border border-gray-200"
                >
                  <div className="font-medium text-gray-800">
                    {device.name || 'Unnamed Device'}
                  </div>
                  <div className="text-sm text-gray-500">ID: {device.id}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;