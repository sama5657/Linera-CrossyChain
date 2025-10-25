import { useState, useEffect } from 'react';
import { lineraClient } from '@/lib/lineraClient';

export function ConnectionStatus() {
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    setIsConnected(lineraClient.isConnectedToBlockchain());
  }, []);

  if (isConnected) {
    return (
      <div className="absolute top-4 right-4 z-30 bg-green-500/90 text-white px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1">
        <span className="w-2 h-2 bg-white rounded-full animate-pulse"></span>
        Live On-Chain
      </div>
    );
  }

  return (
    <div className="absolute top-4 right-4 z-30 bg-yellow-500/90 text-white px-3 py-1 rounded-full text-xs font-bold">
      Development Mode
    </div>
  );
}
