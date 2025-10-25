import { Button } from './ui/button';

interface GameUIProps {
  score: number;
  gameState: 'menu' | 'playing' | 'gameover';
  onStart: () => void;
  onRetry: () => void;
  onSubmitScore: () => void;
  onViewLeaderboard: () => void;
  submittingScore: boolean;
  walletConnected: boolean;
}

export function GameUI({
  score,
  gameState,
  onStart,
  onRetry,
  onSubmitScore,
  onViewLeaderboard,
  submittingScore,
  walletConnected
}: GameUIProps) {
  return (
    <>
      {/* Score Counter */}
      {gameState === 'playing' && (
        <div className="absolute top-4 right-4 z-40">
          <div className="bg-black/80 text-white px-6 py-3 rounded-lg text-4xl font-bold" style={{ fontFamily: '"Press Start 2P", cursive' }}>
            {score}
          </div>
        </div>
      )}

      {/* Menu Screen */}
      {gameState === 'menu' && (
        <div className="absolute inset-0 flex items-center justify-center z-40 bg-black/50">
          <div className="bg-white rounded-2xl p-8 text-center max-w-md shadow-2xl">
            <h1 className="text-5xl font-bold mb-4 text-gray-800" style={{ fontFamily: '"Press Start 2P", cursive' }}>
              Crossy Chain
            </h1>
            <p className="text-lg mb-2 text-gray-600">On-Chain Crossy Road</p>
            <p className="text-sm mb-6 text-gray-500">Powered by Linera</p>
            
            <div className="space-y-4">
              {walletConnected ? (
                <>
                  <Button
                    onClick={onStart}
                    className="w-full bg-green-600 hover:bg-green-700 text-white text-xl py-6"
                    style={{ fontFamily: '"Press Start 2P", cursive' }}
                  >
                    Start Game
                  </Button>
                  <Button
                    onClick={onViewLeaderboard}
                    variant="outline"
                    className="w-full text-lg py-4"
                  >
                    View Leaderboard
                  </Button>
                </>
              ) : (
                <div className="bg-yellow-50 border-2 border-yellow-400 rounded-lg p-4">
                  <p className="text-sm text-yellow-800">
                    Connect your wallet to play and save scores on-chain
                  </p>
                </div>
              )}
            </div>

            <div className="mt-8 text-xs text-gray-500">
              <p>Use Arrow Keys or WASD to move</p>
              <p className="mt-1">Avoid cars and trucks!</p>
            </div>
          </div>
        </div>
      )}

      {/* Game Over Screen */}
      {gameState === 'gameover' && (
        <div className="absolute inset-0 flex items-center justify-center z-40 bg-black/70">
          <div className="bg-white rounded-2xl p-8 text-center max-w-md shadow-2xl">
            <h2 className="text-4xl font-bold mb-4 text-red-600" style={{ fontFamily: '"Press Start 2P", cursive' }}>
              Game Over
            </h2>
            
            <div className="bg-gray-100 rounded-lg p-6 mb-6">
              <p className="text-lg text-gray-600 mb-2">Final Score</p>
              <p className="text-6xl font-bold text-gray-800" style={{ fontFamily: '"Press Start 2P", cursive' }}>
                {score}
              </p>
            </div>

            <div className="space-y-3">
              {walletConnected && (
                <Button
                  onClick={onSubmitScore}
                  disabled={submittingScore}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white text-lg py-6"
                >
                  {submittingScore ? 'Saving...' : 'Submit Score On-Chain'}
                </Button>
              )}
              
              <Button
                onClick={onRetry}
                className="w-full bg-green-600 hover:bg-green-700 text-white text-lg py-6"
              >
                Retry
              </Button>

              <Button
                onClick={onViewLeaderboard}
                variant="outline"
                className="w-full text-lg py-4"
              >
                View Leaderboard
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Mobile Controls */}
      {gameState === 'playing' && (
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-40 md:hidden">
          <div className="grid grid-cols-3 gap-2 w-40">
            <button
              className="col-span-3 bg-white/90 rounded-lg p-3 shadow-lg active:bg-white"
              onTouchStart={() => window.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowUp' }))}
            >
              <svg width="30" height="30" viewBox="0 0 10 10" className="mx-auto">
                <g transform="rotate(0, 5,5)">
                  <path d="M5,4 L7,6 L3,6 L5,4" fill="currentColor" />
                </g>
              </svg>
            </button>
            
            <button
              className="bg-white/90 rounded-lg p-3 shadow-lg active:bg-white"
              onTouchStart={() => window.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowLeft' }))}
            >
              <svg width="30" height="30" viewBox="0 0 10 10">
                <g transform="rotate(-90, 5,5)">
                  <path d="M5,4 L7,6 L3,6 L5,4" fill="currentColor" />
                </g>
              </svg>
            </button>
            
            <button
              className="bg-white/90 rounded-lg p-3 shadow-lg active:bg-white"
              onTouchStart={() => window.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowDown' }))}
            >
              <svg width="30" height="30" viewBox="0 0 10 10">
                <g transform="rotate(180, 5,5)">
                  <path d="M5,4 L7,6 L3,6 L5,4" fill="currentColor" />
                </g>
              </svg>
            </button>
            
            <button
              className="bg-white/90 rounded-lg p-3 shadow-lg active:bg-white"
              onTouchStart={() => window.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowRight' }))}
            >
              <svg width="30" height="30" viewBox="0 0 10 10">
                <g transform="rotate(90, 5,5)">
                  <path d="M5,4 L7,6 L3,6 L5,4" fill="currentColor" />
                </g>
              </svg>
            </button>
          </div>
        </div>
      )}
    </>
  );
}
