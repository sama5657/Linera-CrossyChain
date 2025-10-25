use crate::state::{CrossyChainState, PlayerData};
use async_trait::async_trait;
use linera_sdk::{
    base::{Owner, WithContractAbi},
    views::{RootView, View, ViewStorageContext},
    Contract, ContractRuntime,
};
use serde::{Deserialize, Serialize};
use thiserror::Error;

/// Contract messages
#[derive(Debug, Serialize, Deserialize)]
pub enum Message {
    /// Save a player's score
    SaveScore {
        score: u32,
        replay_data: Option<String>, // JSON string of replay data
        timestamp: u64,
    },
    /// Register a player with optional display name
    RegisterPlayer {
        display_name: Option<String>,
    },
}

/// Contract operations (for cross-chain calls and mutations)
#[derive(Debug, Serialize, Deserialize)]
pub enum Operation {
    /// Save a player's score (triggered by GraphQL mutation)
    SaveScore {
        score: u32,
        replay_data: Option<String>, // JSON string of replay data
        timestamp: u64,
    },
    /// Register a player with optional display name
    RegisterPlayer {
        display_name: Option<String>,
    },
}

/// Contract errors
#[derive(Debug, Error)]
pub enum ContractError {
    #[error("Unauthorized: only the wallet owner can update their score")]
    Unauthorized,
    
    #[error("Invalid score: score must be greater than 0")]
    InvalidScore,
    
    #[error("Replay required: high scores must include replay data for verification")]
    ReplayRequired,
    
    #[error("Replay too large: replay data exceeds 1MB limit")]
    ReplayTooLarge,
    
    #[error("View error: {0}")]
    ViewError(#[from] linera_sdk::views::ViewError),
}

/// The contract implementation
pub struct CrossyChainContract {
    state: CrossyChainState<ContractRuntime<Self>>,
    runtime: ContractRuntime<Self>,
}

#[async_trait]
impl Contract for CrossyChainContract {
    type Error = ContractError;
    type Message = Message;
    type Operation = Operation;
    type State = CrossyChainState<ContractRuntime<Self>>;

    async fn new(state: Self::State, runtime: ContractRuntime<Self>) -> Result<Self, Self::Error> {
        Ok(Self { state, runtime })
    }

    fn state_mut(&mut self) -> &mut Self::State {
        &mut self.state
    }

    async fn initialize(&mut self, _argument: Self::InitializationArgument) -> Result<(), Self::Error> {
        Ok(())
    }

    async fn execute_operation(&mut self, operation: Self::Operation) -> Result<(), Self::Error> {
        match operation {
            Operation::SaveScore {
                score,
                replay_data,
                timestamp,
            } => {
                // Reject invalid scores
                if score == 0 {
                    return Err(ContractError::InvalidScore);
                }

                // Get the authenticated signer (wallet address)
                let sender = match self.runtime.authenticated_signer() {
                    Some(owner) => owner.to_string(),
                    None => return Err(ContractError::Unauthorized),
                };

                // Get or create player data
                let mut player = self
                    .state
                    .players
                    .get(&sender)
                    .await?
                    .unwrap_or_default();

                // Check if this is a new high score
                let is_new_high_score = score > player.high_score;
                
                // STRICT VALIDATION: Require replay data for all new high scores
                // This ensures anti-cheat verification is possible for leaderboard entries
                if is_new_high_score {
                    // Replay data is mandatory for high scores
                    if replay_data.is_none() {
                        return Err(ContractError::ReplayRequired);
                    }
                    
                    let replay_json = replay_data.unwrap();
                    
                    // Validate replay data size (limit to 1MB to prevent state bloat)
                    const MAX_REPLAY_SIZE: usize = 1_000_000; // 1MB
                    if replay_json.len() > MAX_REPLAY_SIZE {
                        return Err(ContractError::ReplayTooLarge);
                    }
                    
                    // Update high score and replay atomically
                    player.high_score = score;
                    player.replay_data = Some(replay_json);
                    
                    // TODO: When Linera SDK blob storage is ready, upload to blob storage:
                    // let replay_bytes = replay_json.into_bytes();
                    // let blob_hash = self.runtime.publish_data_blob(replay_bytes).await?;
                    // player.replay_blob_id = Some(format!("{:?}", blob_hash));
                    // Then we can remove the replay_data field and use only replay_blob_id
                }
                // For non-high scores, we don't update anything related to replays
                // This preserves the existing high-score replay

                // Increment games played
                player.games_played += 1;

                // Update last played timestamp
                player.last_played_at = Some(timestamp);

                // Save updated player data
                self.state.players.insert(&sender, player)?;

                Ok(())
            }
            Operation::RegisterPlayer { display_name } => {
                // Get the authenticated signer (wallet address)
                let sender = match self.runtime.authenticated_signer() {
                    Some(owner) => owner.to_string(),
                    None => return Err(ContractError::Unauthorized),
                };

                // Get or create player data
                let mut player = self
                    .state
                    .players
                    .get(&sender)
                    .await?
                    .unwrap_or_default();

                // Validate and update display name if provided
                if let Some(name) = display_name {
                    let trimmed = name.trim();
                    if !trimmed.is_empty() && trimmed.len() <= 30 {
                        player.display_name = Some(trimmed.to_string());
                    }
                    // If validation fails, keep existing display name
                } else {
                    // Explicitly setting to None clears the display name
                    player.display_name = None;
                }

                // Save updated player data
                self.state.players.insert(&sender, player)?;

                Ok(())
            }
        }
    }

    async fn execute_message(&mut self, message: Self::Message) -> Result<(), Self::Error> {
        match message {
            Message::SaveScore {
                score,
                replay_data,
                timestamp,
            } => {
                // Reject invalid scores
                if score == 0 {
                    return Err(ContractError::InvalidScore);
                }

                // Get the authenticated signer (wallet address)
                let sender = match self.runtime.authenticated_signer() {
                    Some(owner) => owner.to_string(),
                    None => return Err(ContractError::Unauthorized),
                };

                // Get or create player data
                let mut player = self
                    .state
                    .players
                    .get(&sender)
                    .await?
                    .unwrap_or_default();

                // Check if this is a new high score
                let is_new_high_score = score > player.high_score;
                
                // STRICT VALIDATION: Require replay data for all new high scores
                // This ensures anti-cheat verification is possible for leaderboard entries
                if is_new_high_score {
                    // Replay data is mandatory for high scores
                    if replay_data.is_none() {
                        return Err(ContractError::ReplayRequired);
                    }
                    
                    let replay_json = replay_data.unwrap();
                    
                    // Validate replay data size (limit to 1MB to prevent state bloat)
                    const MAX_REPLAY_SIZE: usize = 1_000_000; // 1MB
                    if replay_json.len() > MAX_REPLAY_SIZE {
                        return Err(ContractError::ReplayTooLarge);
                    }
                    
                    // Update high score and replay atomically
                    player.high_score = score;
                    player.replay_data = Some(replay_json);
                    
                    // TODO: When Linera SDK blob storage is ready, upload to blob storage:
                    // let replay_bytes = replay_json.into_bytes();
                    // let blob_hash = self.runtime.publish_data_blob(replay_bytes).await?;
                    // player.replay_blob_id = Some(format!("{:?}", blob_hash));
                    // Then we can remove the replay_data field and use only replay_blob_id
                }
                // For non-high scores, we don't update anything related to replays
                // This preserves the existing high-score replay

                // Increment games played
                player.games_played += 1;

                // Update last played timestamp
                player.last_played_at = Some(timestamp);

                // Save updated player data
                self.state.players.insert(&sender, player)?;

                Ok(())
            }
            Message::RegisterPlayer { display_name } => {
                // Get the authenticated signer (wallet address)
                let sender = match self.runtime.authenticated_signer() {
                    Some(owner) => owner.to_string(),
                    None => return Err(ContractError::Unauthorized),
                };

                // Get or create player data
                let mut player = self
                    .state
                    .players
                    .get(&sender)
                    .await?
                    .unwrap_or_default();

                // Validate and update display name if provided
                if let Some(name) = display_name {
                    let trimmed = name.trim();
                    if !trimmed.is_empty() && trimmed.len() <= 30 {
                        player.display_name = Some(trimmed.to_string());
                    }
                    // If validation fails, keep existing display name
                } else {
                    // Explicitly setting to None clears the display name
                    player.display_name = None;
                }

                // Save updated player data
                self.state.players.insert(&sender, player)?;

                Ok(())
            }
        }
    }

    async fn finalize(&mut self) -> Result<(), Self::Error> {
        Ok(())
    }
}

impl WithContractAbi for CrossyChainContract {
    type Abi = crate::CrossyChainAbi;
}
