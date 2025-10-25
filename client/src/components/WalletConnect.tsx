import { useState, useEffect } from 'react';
import { lineraClient } from '@/lib/lineraClient';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { toast } from 'sonner';

interface WalletConnectProps {
  onConnect: (address: string) => void;
  onDisconnect: () => void;
}

export function WalletConnect({ onConnect, onDisconnect }: WalletConnectProps) {
  const [walletAddress, setWalletAddress] = useState<string | null>(null);
  const [connecting, setConnecting] = useState(false);
  const [displayName, setDisplayName] = useState('');
  const [showNameInput, setShowNameInput] = useState(false);
  const [registering, setRegistering] = useState(false);
  const [currentDisplayName, setCurrentDisplayName] = useState<string | null>(null);

  useEffect(() => {
    // Check if wallet already has a display name
    if (walletAddress) {
      loadPlayerData();
    }
  }, [walletAddress]);

  const loadPlayerData = async () => {
    try {
      const playerData = await lineraClient.getPlayer();
      if (playerData?.display_name) {
        setCurrentDisplayName(playerData.display_name);
      } else {
        setShowNameInput(true);
      }
    } catch (error) {
      console.error('Failed to load player data:', error);
    }
  };

  const handleConnect = async () => {
    setConnecting(true);
    try {
      const address = await lineraClient.connectWallet();
      setWalletAddress(address);
      onConnect(address);
      toast.success('Wallet connected!');
    } catch (error) {
      console.error('Failed to connect wallet:', error);
      toast.error('Failed to connect wallet');
    } finally {
      setConnecting(false);
    }
  };

  const handleDisconnect = () => {
    lineraClient.disconnectWallet();
    setWalletAddress(null);
    setDisplayName('');
    setShowNameInput(false);
    setCurrentDisplayName(null);
    onDisconnect();
    toast.info('Wallet disconnected');
  };

  const handleRegisterName = async () => {
    if (!displayName.trim()) {
      toast.error('Please enter a display name');
      return;
    }

    if (displayName.length > 30) {
      toast.error('Display name must be 30 characters or less');
      return;
    }

    setRegistering(true);
    try {
      const success = await lineraClient.registerPlayer(displayName.trim());
      if (success) {
        setCurrentDisplayName(displayName.trim());
        setShowNameInput(false);
        toast.success('Display name registered!');
      } else {
        toast.error('Failed to register display name');
      }
    } catch (error) {
      console.error('Failed to register name:', error);
      toast.error('Failed to register display name');
    } finally {
      setRegistering(false);
    }
  };

  const handleSkip = () => {
    setShowNameInput(false);
  };

  const handleChangeName = () => {
    setShowNameInput(true);
    setDisplayName(currentDisplayName || '');
  };

  const shortenAddress = (address: string) => {
    return `${address.slice(0, 8)}...${address.slice(-6)}`;
  };

  return (
    <div className="absolute top-4 left-4 z-50">
      {walletAddress ? (
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <div className="bg-black/80 text-white px-4 py-2 rounded-lg">
              {currentDisplayName ? (
                <div>
                  <div className="font-bold">{currentDisplayName}</div>
                  <div className="font-mono text-xs opacity-70">{shortenAddress(walletAddress)}</div>
                </div>
              ) : (
                <div className="font-mono text-sm">{shortenAddress(walletAddress)}</div>
              )}
            </div>
            <Button
              onClick={handleDisconnect}
              variant="destructive"
              size="sm"
            >
              Disconnect
            </Button>
          </div>

          {showNameInput && (
            <div className="bg-white/95 p-4 rounded-lg shadow-lg border-2 border-blue-500 space-y-2">
              <p className="text-sm font-bold text-gray-800">Set Display Name</p>
              <Input
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                placeholder="Enter your name"
                maxLength={30}
                className="bg-white"
                onKeyDown={(e) => e.key === 'Enter' && handleRegisterName()}
              />
              <div className="flex gap-2">
                <Button
                  onClick={handleRegisterName}
                  disabled={registering || !displayName.trim()}
                  size="sm"
                  className="flex-1"
                >
                  {registering ? 'Saving...' : 'Save Name'}
                </Button>
                <Button
                  onClick={handleSkip}
                  variant="outline"
                  size="sm"
                >
                  {currentDisplayName ? 'Cancel' : 'Skip'}
                </Button>
              </div>
            </div>
          )}

          {currentDisplayName && !showNameInput && (
            <Button
              onClick={handleChangeName}
              variant="outline"
              size="sm"
              className="w-full bg-white/90"
            >
              Change Name
            </Button>
          )}
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
