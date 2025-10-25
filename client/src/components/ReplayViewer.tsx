import { useState, useEffect } from 'react';
import { CrossyGame } from './CrossyGame';
import { lineraClient } from '../lib/lineraClient';
import type { GameRecording } from '../lib/GameInputRecorder';
import { Button } from './ui/button';
import { ArrowLeft, Play, Pause, RotateCcw } from 'lucide-react';

interface ReplayViewerProps {
  walletAddress: string;
  onBack: () => void;
}

type ReplayState = 'loading' | 'ready' | 'playing' | 'paused' | 'finished' | 'error';

export function ReplayViewer({ walletAddress, onBack }: ReplayViewerProps) {
  const [recording, setRecording] = useState<GameRecording | null>(null);
  const [replayState, setReplayState] = useState<ReplayState>('loading');
  const [error, setError] = useState<string | null>(null);
  const [gameKey, setGameKey] = useState(0);

  // Fetch replay data on mount
  useEffect(() => {
    const fetchReplay = async () => {
      try {
        setReplayState('loading');
        const playerData = await lineraClient.getPlayer(walletAddress);
        
        if (!playerData || !playerData.replay_data) {
          setError('No replay data available for this player');
          setReplayState('error');
          return;
        }

        // Parse replay data JSON
        const replayJson = JSON.parse(playerData.replay_data);
        setRecording(replayJson);
        setReplayState('ready');
      } catch (err) {
        console.error('Failed to load replay:', err);
        setError(err instanceof Error ? err.message : 'Failed to load replay');
        setReplayState('error');
      }
    };

    fetchReplay();
  }, [walletAddress]);

  const handlePlay = () => {
    if (replayState === 'ready' || replayState === 'finished') {
      // Start/restart the replay by remounting the game component
      setGameKey(prev => prev + 1);
      setReplayState('playing');
    } else if (replayState === 'paused') {
      setReplayState('playing');
    }
  };

  const handleRestart = () => {
    setGameKey(prev => prev + 1);
    setReplayState('playing');
  };

  const handleReplayComplete = () => {
    setReplayState('finished');
  };

  if (replayState === 'loading') {
    return (
      <div className="flex flex-col items-center justify-center h-screen bg-gradient-to-b from-sky-400 to-sky-600 p-4">
        <div className="bg-white rounded-lg shadow-xl p-8 max-w-md w-full">
          <h2 className="text-2xl font-bold text-gray-800 mb-4">Loading Replay...</h2>
          <div className="animate-pulse flex space-x-4">
            <div className="flex-1 space-y-4 py-1">
              <div className="h-4 bg-gray-300 rounded w-3/4"></div>
              <div className="h-4 bg-gray-300 rounded"></div>
              <div className="h-4 bg-gray-300 rounded w-5/6"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (replayState === 'error') {
    return (
      <div className="flex flex-col items-center justify-center h-screen bg-gradient-to-b from-sky-400 to-sky-600 p-4">
        <div className="bg-white rounded-lg shadow-xl p-8 max-w-md w-full">
          <h2 className="text-2xl font-bold text-red-600 mb-4">Error Loading Replay</h2>
          <p className="text-gray-700 mb-6">{error}</p>
          <Button onClick={onBack} className="w-full">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Leaderboard
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="relative h-screen">
      {/* Replay controls overlay */}
      <div className="absolute top-4 left-4 z-10 bg-black/70 rounded-lg p-4 text-white">
        <div className="flex flex-col gap-2">
          <Button 
            onClick={onBack} 
            variant="outline" 
            size="sm"
            className="bg-white/20 hover:bg-white/30 text-white border-white/40"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back
          </Button>
          
          <div className="flex gap-2">
            {replayState === 'playing' ? (
              <span className="text-xs text-green-400 font-semibold">● PLAYING</span>
            ) : replayState === 'finished' ? (
              <span className="text-xs text-gray-400 font-semibold">FINISHED</span>
            ) : (
              <span className="text-xs text-blue-400 font-semibold">READY</span>
            )}
          </div>
          
          <div className="flex gap-2">
            {(replayState === 'ready' || replayState === 'finished') && (
              <Button
                onClick={handlePlay}
                size="sm"
                className="bg-green-600 hover:bg-green-700"
              >
                <Play className="h-4 w-4" />
              </Button>
            )}
            
            {replayState === 'playing' && (
              <Button
                onClick={handleRestart}
                size="sm"
                className="bg-blue-600 hover:bg-blue-700"
              >
                <RotateCcw className="h-4 w-4" />
              </Button>
            )}
          </div>

          {recording && (
            <div className="text-xs mt-2 space-y-1">
              <div>Inputs: {recording.inputs.length}</div>
              <div>Duration: {Math.floor(recording.duration / 1000)}s</div>
              <div>Seed: {recording.seed}</div>
            </div>
          )}
        </div>
      </div>

      {/* Game component in replay mode */}
      {recording && replayState === 'playing' && (
        <CrossyGame
          key={gameKey}
          onGameOver={handleReplayComplete}
          onScoreChange={() => {}}
          replayMode={true}
          replayData={recording}
        />
      )}

      {/* Placeholder when not playing */}
      {replayState !== 'playing' && (
        <div className="flex items-center justify-center h-full bg-gradient-to-b from-sky-400 to-sky-600">
          <div className="bg-white rounded-lg shadow-xl p-8 max-w-md w-full text-center">
            <h2 className="text-2xl font-bold text-gray-800 mb-4">
              {replayState === 'finished' ? 'Replay Finished' : 'Ready to Watch Replay'}
            </h2>
            <p className="text-gray-600 mb-6">
              {replayState === 'finished' 
                ? 'The replay has finished. Click restart to watch again.'
                : 'Press play to watch the recorded gameplay.'}
            </p>
            <Button onClick={handlePlay} className="w-full">
              <Play className="mr-2 h-4 w-4" />
              {replayState === 'finished' ? 'Watch Again' : 'Play Replay'}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
