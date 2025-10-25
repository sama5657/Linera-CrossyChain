import { useState, useEffect } from 'react';
import { CrossyGame } from './components/CrossyGame';
import { WalletConnect } from './components/WalletConnect';
import { GameUI } from './components/GameUI';
import { Leaderboard } from './components/Leaderboard';
import { ConnectionStatus } from './components/ConnectionStatus';
import { lineraClient } from './lib/lineraClient';
import { toast } from 'sonner';
import { Toaster } from './components/ui/sonner';
import "@fontsource/inter";

type GameState = 'menu' | 'playing' | 'gameover' | 'leaderboard';

function App() {
  const [gameState, setGameState] = useState<GameState>('menu');
  const [score, setScore] = useState(0);
  const [walletAddress, setWalletAddress] = useState<string | null>(null);
  const [submittingScore, setSubmittingScore] = useState(false);
  const [gameKey, setGameKey] = useState(0);

  // Load Press Start 2P font
  useEffect(() => {
    const link = document.createElement('link');
    link.href = 'https://fonts.googleapis.com/css2?family=Press+Start+2P&display=swap';
    link.rel = 'stylesheet';
    document.head.appendChild(link);
  }, []);

  const handleWalletConnect = (address: string) => {
    setWalletAddress(address);
    toast.success('Wallet connected!', {
      description: `${address.slice(0, 8)}...${address.slice(-6)}`
    });
  };

  const handleWalletDisconnect = () => {
    setWalletAddress(null);
    toast.info('Wallet disconnected');
    if (gameState === 'playing') {
      setGameState('menu');
    }
  };

  const handleStartGame = () => {
    setScore(0);
    setGameState('playing');
    setGameKey(prev => prev + 1); // Force remount of game component
  };

  const handleGameOver = (finalScore: number) => {
    setScore(finalScore);
    setGameState('gameover');
    
    if (walletAddress) {
      toast('Game Over!', {
        description: `Score: ${finalScore}. Submit your score on-chain!`
      });
    } else {
      toast('Game Over!', {
        description: `Score: ${finalScore}`
      });
    }
  };

  const handleScoreChange = (newScore: number) => {
    setScore(newScore);
  };

  const handleRetry = () => {
    handleStartGame();
  };

  const handleSubmitScore = async () => {
    if (!walletAddress) {
      toast.error('Please connect your wallet first');
      return;
    }

    setSubmittingScore(true);
    try {
      const success = await lineraClient.saveScore(score);
      
      if (success) {
        toast.success('Score saved on-chain!', {
          description: `Your score of ${score} has been recorded on Linera blockchain`
        });
        
        // Optionally show leaderboard after successful submission
        setTimeout(() => {
          setGameState('leaderboard');
        }, 1000);
      } else {
        toast.error('Failed to save score', {
          description: 'Please try again'
        });
      }
    } catch (error) {
      console.error('Error submitting score:', error);
      toast.error('Failed to submit score', {
        description: error instanceof Error ? error.message : 'Unknown error'
      });
    } finally {
      setSubmittingScore(false);
    }
  };

  const handleViewLeaderboard = () => {
    setGameState('leaderboard');
  };

  const handleCloseLeaderboard = () => {
    setGameState('menu');
  };

  return (
    <div className="w-full h-full relative overflow-hidden bg-gradient-to-b from-sky-400 to-sky-200">
      {/* Connection Status */}
      <ConnectionStatus />
      
      {/* Wallet Connection */}
      <WalletConnect
        onConnect={handleWalletConnect}
        onDisconnect={handleWalletDisconnect}
      />

      {/* Game Canvas */}
      {gameState === 'playing' && (
        <CrossyGame
          key={gameKey}
          onGameOver={handleGameOver}
          onScoreChange={handleScoreChange}
        />
      )}

      {/* Game UI Overlay */}
      <GameUI
        score={score}
        gameState={gameState === 'leaderboard' ? 'menu' : gameState}
        onStart={handleStartGame}
        onRetry={handleRetry}
        onSubmitScore={handleSubmitScore}
        onViewLeaderboard={handleViewLeaderboard}
        submittingScore={submittingScore}
        walletConnected={!!walletAddress}
      />

      {/* Leaderboard */}
      {gameState === 'leaderboard' && (
        <Leaderboard
          onClose={handleCloseLeaderboard}
          currentWallet={walletAddress}
        />
      )}

      {/* Toast Notifications */}
      <Toaster position="bottom-right" />

      {/* Footer Info */}
      <div className="absolute bottom-2 left-1/2 -translate-x-1/2 text-center text-xs text-white/80 z-30 pointer-events-none hidden md:block">
        <p className="drop-shadow-lg">
          Powered by <strong>Linera</strong> • On-Chain High Scores • Real-Time Leaderboard
        </p>
      </div>
    </div>
  );
}

export default App;
