use linera_sdk::views::{MapView, RootView, ViewStorageContext};
use serde::{Deserialize, Serialize};

/// Player data stored on-chain
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct PlayerData {
    /// Highest score achieved by this player
    pub high_score: u32,
    /// Total number of games played
    pub games_played: u32,
    /// Last time the player submitted a score (UNIX timestamp)
    pub last_played_at: Option<u64>,
    /// Optional replay blob ID for anti-cheat verification (when using blob storage)
    pub replay_blob_id: Option<String>,
    /// Optional replay data stored directly (JSON string of recording)
    /// This is a temporary solution until Linera blob storage is fully integrated
    pub replay_data: Option<String>,
    /// Optional display name (if not set, shows wallet address)
    pub display_name: Option<String>,
}

impl Default for PlayerData {
    fn default() -> Self {
        Self {
            high_score: 0,
            games_played: 0,
            last_played_at: None,
            replay_blob_id: None,
            replay_data: None,
            display_name: None,
        }
    }
}

/// Application state
#[derive(RootView)]
pub struct CrossyChainState<C> {
    /// Map of wallet addresses to player data
    pub players: MapView<C, String, PlayerData>,
}
