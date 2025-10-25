import * as linera from '@linera/client';

export interface LeaderboardEntry {
  wallet_address: string;
  high_score: number;
  games_played: number;
  last_played_at?: number;
  display_name?: string;
  replay_data?: string;
}

export interface PlayerData {
  high_score: number;
  games_played: number;
  last_played_at?: number;
  display_name?: string;
  replay_data?: string;
}

class LineraClient {
  private client: linera.Client | null = null;
  private backend: any | null = null;
  private walletAddress: string | null = null;
  private contractId: string = '';
  private faucetUrl: string = '';
  private notificationCallbacks: ((entry: LeaderboardEntry) => void)[] = [];
  private isInitialized: boolean = false;

  /**
   * Initialize the Linera client with contract ID and faucet URL
   */
  initialize(contractId: string, faucetUrl: string = 'https://faucet.testnet-conway.linera.net') {
    this.contractId = contractId;
    this.faucetUrl = faucetUrl;
  }

  /**
   * Initialize the Linera WASM module
   */
  private async ensureInitialized() {
    if (!this.isInitialized) {
      try {
        await linera.default();
        this.isInitialized = true;
      } catch (error) {
        console.error('Failed to initialize Linera WASM:', error);
        throw new Error('Failed to initialize Linera client');
      }
    }
  }

  /**
   * Connect wallet and create/claim a chain from the faucet
   */
  async connectWallet(): Promise<string> {
    try {
      await this.ensureInitialized();

      // Connect to faucet and create wallet
      const faucet = await new linera.Faucet(this.faucetUrl);
      const wallet = await faucet.createWallet();
      this.client = await new linera.Client(wallet);

      // Claim a chain from the faucet
      const chainId = await faucet.claimChain(this.client);
      this.walletAddress = chainId;

      // Get the application backend
      this.backend = await this.client.frontend().application(this.contractId);

      // Set up notification listener for real-time updates
      this.client.onNotification((notification) => {
        if (notification.reason.NewBlock) {
          // Refresh leaderboard when new blocks are created
          this.notificationCallbacks.forEach(callback => {
            this.getLeaderboard(10).then(entries => {
              if (entries.length > 0) {
                callback(entries[0]);
              }
            });
          });
        }
      });

      console.log('Wallet connected:', chainId);
      return chainId;
    } catch (error) {
      console.error('Failed to connect wallet:', error);
      
      // Fallback to mock wallet for development
      console.warn('Falling back to mock wallet implementation');
      const mockAddress = `linera1${Math.random().toString(36).substring(2, 15)}`;
      this.walletAddress = mockAddress;
      return mockAddress;
    }
  }

  /**
   * Disconnect wallet
   */
  disconnectWallet() {
    this.client = null;
    this.backend = null;
    this.walletAddress = null;
  }

  /**
   * Get current wallet address
   */
  getWalletAddress(): string | null {
    return this.walletAddress;
  }

  /**
   * Subscribe to leaderboard updates
   */
  onLeaderboardUpdate(callback: (entry: LeaderboardEntry) => void) {
    this.notificationCallbacks.push(callback);
    
    return () => {
      this.notificationCallbacks = this.notificationCallbacks.filter(cb => cb !== callback);
    };
  }

  /**
   * Register player with optional display name
   */
  async registerPlayer(displayName?: string): Promise<boolean> {
    if (!this.walletAddress) {
      throw new Error('Wallet not connected');
    }

    try {
      if (this.backend) {
        // Use actual Linera backend with proper GraphQL variables
        const mutation = JSON.stringify({
          query: `mutation RegisterPlayer($displayName: String) {
            registerPlayer(displayName: $displayName)
          }`,
          variables: {
            displayName: displayName || null
          }
        });

        const response = await this.backend.query(mutation);
        const data = JSON.parse(response);
        console.log('Player registered:', data);
        
        if (data.errors) {
          console.error('GraphQL errors:', data.errors);
          throw new Error(data.errors[0].message);
        }
        
        // Check if mutation actually succeeded
        if (data.data?.registerPlayer !== true) {
          console.error('Registration failed - mutation returned false or undefined');
          throw new Error('Display name validation failed');
        }
        
        return true;
      } else {
        // Fallback to localStorage for development
        console.warn('Using localStorage fallback - no Linera backend connected');
        const storageKey = `linera_player_${this.walletAddress}`;
        const existingData = localStorage.getItem(storageKey);
        let playerData: PlayerData = {
          high_score: 0,
          games_played: 0,
          display_name: displayName
        };

        if (existingData) {
          const existing = JSON.parse(existingData);
          playerData = {
            ...existing,
            display_name: displayName
          };
        }

        localStorage.setItem(storageKey, JSON.stringify(playerData));
        return true;
      }
    } catch (error) {
      console.error('Failed to register player:', error);
      return false;
    }
  }

  /**
   * Save score on-chain via GraphQL mutation
   */
  async saveScore(score: number, replayData?: any): Promise<boolean> {
    if (!this.walletAddress) {
      throw new Error('Wallet not connected');
    }

    try {
      const timestamp = Math.floor(Date.now() / 1000);

      // Serialize replay data to JSON string if provided
      let replayDataJson: string | null = null;
      if (replayData) {
        try {
          replayDataJson = JSON.stringify(replayData);
          console.log('[lineraClient] Replay data serialized:', replayDataJson.length, 'bytes');
        } catch (err) {
          console.error('[lineraClient] Failed to serialize replay data:', err);
        }
      }

      if (this.backend) {
        // Use actual Linera backend - GraphQL mutation triggers contract operation
        const mutation = JSON.stringify({
          query: `mutation SaveScore($score: Int!, $timestamp: Int!, $replayData: String) {
            saveScore(score: $score, timestamp: $timestamp, replayData: $replayData)
          }`,
          variables: {
            score,
            timestamp,
            replayData: replayDataJson
          }
        });

        const response = await this.backend.query(mutation);
        const data = JSON.parse(response);
        console.log('Score saved on-chain:', data);
        
        if (data.errors) {
          console.error('GraphQL errors:', data.errors);
          throw new Error(data.errors[0].message);
        }
        
        // Check if mutation actually succeeded
        if (data.data?.saveScore !== true) {
          console.error('Save score failed - mutation returned false or undefined');
          throw new Error('Score validation failed');
        }
        
        return true;
      } else {
        // Fallback to localStorage for development
        console.warn('Using localStorage fallback - no Linera backend connected');
        const storageKey = `linera_player_${this.walletAddress}`;
        const existingData = localStorage.getItem(storageKey);
        let playerData: PlayerData = {
          high_score: score,
          games_played: 1,
          last_played_at: timestamp
        };

        if (existingData) {
          const existing = JSON.parse(existingData);
          playerData = {
            high_score: Math.max(existing.high_score, score),
            games_played: existing.games_played + 1,
            last_played_at: timestamp
          };
        }

        localStorage.setItem(storageKey, JSON.stringify(playerData));
        return true;
      }
    } catch (error) {
      console.error('Failed to save score:', error);
      return false;
    }
  }

  /**
   * Get leaderboard from GraphQL service
   */
  async getLeaderboard(topN: number = 10): Promise<LeaderboardEntry[]> {
    try {
      if (this.backend) {
        // Use actual Linera backend
        const query = JSON.stringify({
          query: `query {
            leaderboard(topN: ${topN}) {
              wallet_address
              high_score
              games_played
              last_played_at
              display_name
              replay_data
            }
          }`
        });

        const response = await this.backend.query(query);
        const data = JSON.parse(response);
        
        if (data.data && data.data.leaderboard) {
          return data.data.leaderboard;
        }
        
        return [];
      } else {
        // Fallback to localStorage for development
        console.warn('Using localStorage fallback - no Linera backend connected');
        const entries: LeaderboardEntry[] = [];

        for (let i = 0; i < localStorage.length; i++) {
          const key = localStorage.key(i);
          if (key && key.startsWith('linera_player_')) {
            const walletAddress = key.replace('linera_player_', '');
            const dataStr = localStorage.getItem(key);
            if (dataStr) {
              const data = JSON.parse(dataStr);
              entries.push({
                wallet_address: walletAddress,
                high_score: data.high_score,
                games_played: data.games_played,
                last_played_at: data.last_played_at,
                display_name: data.display_name
              });
            }
          }
        }

        entries.sort((a, b) => b.high_score - a.high_score);
        return entries.slice(0, topN);
      }
    } catch (error) {
      console.error('Failed to get leaderboard:', error);
      return [];
    }
  }

  /**
   * Get player data by wallet address
   */
  async getPlayer(walletAddress?: string): Promise<PlayerData | null> {
    const address = walletAddress || this.walletAddress;
    if (!address) return null;

    try {
      if (this.backend) {
        // Use actual Linera backend
        const query = JSON.stringify({
          query: `query {
            player(walletAddress: "${address}") {
              high_score
              games_played
              last_played_at
              display_name
              replay_data
            }
          }`
        });

        const response = await this.backend.query(query);
        const data = JSON.parse(response);
        
        if (data.data && data.data.player) {
          return data.data.player;
        }
        
        return null;
      } else {
        // Fallback to localStorage for development
        const storageKey = `linera_player_${address}`;
        const dataStr = localStorage.getItem(storageKey);
        if (dataStr) {
          return JSON.parse(dataStr);
        }
        return null;
      }
    } catch (error) {
      console.error('Failed to get player data:', error);
      return null;
    }
  }

  /**
   * Check if client is connected to actual blockchain
   */
  isConnectedToBlockchain(): boolean {
    return this.backend !== null;
  }
}

export const lineraClient = new LineraClient();

// Initialize with default values
// NOTE: Update these with your deployed contract ID and service URL
// For testnet deployment, use the contract ID from your deployment
lineraClient.initialize(
  // Use environment variable or fallback to empty string (will use localStorage)
  import.meta.env.VITE_LINERA_CONTRACT_ID || '',
  import.meta.env.VITE_LINERA_FAUCET_URL || 'https://faucet.testnet-conway.linera.net'
);
