import { useState } from 'react';
import { lineraClient } from '@/lib/lineraClient';
import { Button } from './ui/button';

interface WalletConnectProps {
  onConnect: (address: string) => void;
  onDisconnect: () => void;
}

export function WalletConnect({ onConnect, onDisconnect }: WalletConnectProps) {
  const [walletAddress, setWalletAddress] = useState<string | null>(null);
  const [connecting, setConnecting] = useState(false);

  const handleConnect = async () => {
    setConnecting(true);
    try {
      const address = await lineraClient.connectWallet();
      setWalletAddress(address);
      onConnect(address);
    } catch (error) {
      console.error('Failed to connect wallet:', error);
    } finally {
      setConnecting(false);
    }
  };

  const handleDisconnect = () => {
    lineraClient.disconnectWallet();
    setWalletAddress(null);
    onDisconnect();
  };

  const shortenAddress = (address: string) => {
    return `${address.slice(0, 8)}...${address.slice(-6)}`;
  };

  return (
    <div className="absolute top-4 left-4 z-50">
      {walletAddress ? (
        <div className="flex items-center gap-2">
          <div className="bg-black/80 text-white px-4 py-2 rounded-lg font-mono text-sm">
            {shortenAddress(walletAddress)}
          </div>
          <Button
            onClick={handleDisconnect}
            variant="destructive"
            size="sm"
          >
            Disconnect
          </Button>
        </div>
      ) : (
        <Button
          onClick={handleConnect}
          disabled={connecting}
          className="bg-green-600 hover:bg-green-700 text-white font-bold"
        >
          {connecting ? 'Connecting...' : 'Connect Wallet'}
        </Button>
      )}
    </div>
  );
}
