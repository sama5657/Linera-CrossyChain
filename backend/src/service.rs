use crate::state::{CrossyChainState, PlayerData};
use async_graphql::{Context, Object, Request, Response, Schema};
use linera_sdk::{
    base::WithServiceAbi,
    views::{View, ViewStorageContext},
    Service, ServiceRuntime,
};
use serde::{Deserialize, Serialize};
use std::sync::Arc;

/// Service for querying game state
pub struct CrossyChainService {
    state: Arc<CrossyChainState<ServiceRuntime<Self>>>,
}

#[async_trait::async_trait]
impl Service for CrossyChainService {
    type Error = ();
    type State = CrossyChainState<ServiceRuntime<Self>>;

    async fn new(state: Self::State, _runtime: ServiceRuntime<Self>) -> Result<Self, Self::Error> {
        Ok(Self {
            state: Arc::new(state),
        })
    }

    async fn handle_query(&self, request: Request) -> Response {
        let schema = Schema::build(
            QueryRoot {
                state: self.state.clone(),
            },
            MutationRoot,
            async_graphql::EmptySubscription,
        )
        .finish();

        schema.execute(request).await
    }
}

impl WithServiceAbi for CrossyChainService {
    type Abi = crate::CrossyChainAbi;
}

/// Leaderboard entry for GraphQL response
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct LeaderboardEntry {
    pub wallet_address: String,
    pub high_score: u32,
    pub games_played: u32,
    pub last_played_at: Option<u64>,
    pub display_name: Option<String>,
    pub replay_data: Option<String>,
}

/// GraphQL query root
struct QueryRoot {
    state: Arc<CrossyChainState<ServiceRuntime<CrossyChainService>>>,
}

#[Object]
impl QueryRoot {
    /// Get leaderboard with top N players sorted by high score
    async fn leaderboard(&self, top_n: Option<i32>) -> Vec<LeaderboardEntry> {
        let limit = top_n.unwrap_or(10).max(1).min(100) as usize;
        
        let mut entries = Vec::new();
        
        // Iterate through all players
        if let Ok(keys) = self.state.players.keys().await {
            for key in keys {
                if let Ok(Some(player)) = self.state.players.get(&key).await {
                    entries.push(LeaderboardEntry {
                        wallet_address: key.clone(),
                        high_score: player.high_score,
                        games_played: player.games_played,
                        last_played_at: player.last_played_at,
                        display_name: player.display_name.clone(),
                        replay_data: player.replay_data.clone(),
                    });
                }
            }
        }
        
        // Sort by high score descending
        entries.sort_by(|a, b| b.high_score.cmp(&a.high_score));
        
        // Return top N
        entries.into_iter().take(limit).collect()
    }

    /// Get player data by wallet address
    async fn player(&self, wallet_address: String) -> Option<LeaderboardEntry> {
        if let Ok(Some(player)) = self.state.players.get(&wallet_address).await {
            Some(LeaderboardEntry {
                wallet_address,
                high_score: player.high_score,
                games_played: player.games_played,
                last_played_at: player.last_played_at,
                display_name: player.display_name.clone(),
                replay_data: player.replay_data.clone(),
            })
        } else {
            None
        }
    }

    /// Get total number of registered players
    async fn player_count(&self) -> i32 {
        if let Ok(keys) = self.state.players.keys().await {
            keys.len() as i32
        } else {
            0
        }
    }
}

/// GraphQL mutation root for triggering contract operations
struct MutationRoot;

#[Object]
impl MutationRoot {
    /// Save a player's score on-chain
    /// This triggers the SaveScore operation in the contract
    async fn save_score(
        &self,
        score: i32,
        timestamp: i32,
        replay_data: Option<String>,
    ) -> bool {
        // Note: In Linera, GraphQL mutations trigger contract operations
        // The actual operation is executed by the contract, not the service
        // This method just defines the GraphQL schema
        // The client calls backend.query("mutation { saveScore(...) }")
        // which creates a block with the SaveScore operation
        // The replay_data is a JSON string of the game recording
        true
    }

    /// Register a player with optional display name
    /// This triggers the RegisterPlayer operation in the contract
    async fn register_player(&self, display_name: Option<String>) -> bool {
        // Validate display name if provided
        if let Some(ref name) = display_name {
            // Limit display name length
            if name.len() > 30 {
                return false;
            }
            // Ensure it's not empty or just whitespace
            if name.trim().is_empty() {
                return false;
            }
        }
        
        // Note: In Linera, GraphQL mutations trigger contract operations
        // The actual operation is executed by the contract, not the service
        // This method just defines the GraphQL schema
        // The client calls backend.query("mutation { registerPlayer(...) }")
        // which creates a block with the RegisterPlayer operation
        true
    }
}
