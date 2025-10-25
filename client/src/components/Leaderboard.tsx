import { useEffect, useState } from 'react';
import { lineraClient, type LeaderboardEntry } from '@/lib/lineraClient';
import { Button } from './ui/button';
import { Card } from './ui/card';

interface LeaderboardProps {
  onClose: () => void;
  currentWallet?: string | null;
}

export function Leaderboard({ onClose, currentWallet }: LeaderboardProps) {
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadLeaderboard();
  }, []);

  const loadLeaderboard = async () => {
    setLoading(true);
    try {
      const data = await lineraClient.getLeaderboard(10);
      setEntries(data);
    } catch (error) {
      console.error('Failed to load leaderboard:', error);
    } finally {
      setLoading(false);
    }
  };

  const shortenAddress = (address: string) => {
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  const formatDate = (timestamp?: number) => {
    if (!timestamp) return 'Never';
    const date = new Date(timestamp * 1000);
    return date.toLocaleDateString();
  };

  return (
    <div className="absolute inset-0 flex items-center justify-center z-50 bg-black/70 p-4">
      <Card className="bg-white rounded-2xl p-8 max-w-2xl w-full max-h-[90vh] overflow-auto shadow-2xl">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-3xl font-bold text-gray-800" style={{ fontFamily: '"Press Start 2P", cursive' }}>
            Leaderboard
          </h2>
          <Button onClick={onClose} variant="outline">
            Close
          </Button>
        </div>

        {loading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading leaderboard...</p>
          </div>
        ) : entries.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-xl text-gray-600">No scores yet!</p>
            <p className="text-sm text-gray-500 mt-2">Be the first to submit a score on-chain</p>
          </div>
        ) : (
          <div className="space-y-2">
            {entries.map((entry, index) => {
              const isCurrentUser = currentWallet && entry.wallet_address === currentWallet;
              
              return (
                <div
                  key={entry.wallet_address}
                  className={`flex items-center gap-4 p-4 rounded-lg transition-colors ${
                    isCurrentUser
                      ? 'bg-blue-100 border-2 border-blue-500'
                      : index < 3
                      ? 'bg-yellow-50'
                      : 'bg-gray-50'
                  }`}
                >
                  {/* Rank */}
                  <div className="flex-shrink-0 w-12 text-center">
                    {index === 0 && (
                      <span className="text-3xl">🥇</span>
                    )}
                    {index === 1 && (
                      <span className="text-3xl">🥈</span>
                    )}
                    {index === 2 && (
                      <span className="text-3xl">🥉</span>
                    )}
                    {index > 2 && (
                      <span className="text-xl font-bold text-gray-600">#{index + 1}</span>
                    )}
                  </div>

                  {/* Player Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      {entry.display_name ? (
                        <>
                          <span className="font-bold text-gray-800 truncate">
                            {entry.display_name}
                          </span>
                          {isCurrentUser && (
                            <span className="bg-blue-500 text-white text-xs px-2 py-1 rounded">
                              You
                            </span>
                          )}
                        </>
                      ) : (
                        <>
                          <span className="font-mono text-sm text-gray-700 truncate">
                            {shortenAddress(entry.wallet_address)}
                          </span>
                          {isCurrentUser && (
                            <span className="bg-blue-500 text-white text-xs px-2 py-1 rounded">
                              You
                            </span>
                          )}
                        </>
                      )}
                    </div>
                    <div className="text-xs text-gray-500 mt-1">
                      {entry.display_name && (
                        <span className="font-mono opacity-60">{shortenAddress(entry.wallet_address)} • </span>
                      )}
                      {entry.games_played} {entry.games_played === 1 ? 'game' : 'games'} played
                      {entry.last_played_at && ` • Last played ${formatDate(entry.last_played_at)}`}
                    </div>
                  </div>

                  {/* Score */}
                  <div className="flex-shrink-0 text-right">
                    <div className="text-2xl font-bold text-gray-800" style={{ fontFamily: '"Press Start 2P", cursive' }}>
                      {entry.high_score}
                    </div>
                    <div className="text-xs text-gray-500">high score</div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        <div className="mt-6 pt-6 border-t border-gray-200">
          <Button
            onClick={loadLeaderboard}
            variant="outline"
            className="w-full"
          >
            Refresh Leaderboard
          </Button>
        </div>

        <div className="mt-4 text-center text-xs text-gray-500">
          <p>Scores are persisted on Linera blockchain</p>
          <p className="mt-1">Real-time updates from microchain state</p>
        </div>
      </Card>
    </div>
  );
}
