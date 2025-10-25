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
        replay_blob_id: Option<String>,
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
        replay_blob_id: Option<String>,
        timestamp: u64,
    },
}

/// Contract errors
#[derive(Debug, Error)]
pub enum ContractError {
    #[error("Unauthorized: only the wallet owner can update their score")]
    Unauthorized,
    
    #[error("Invalid score: score must be greater than 0")]
    InvalidScore,
    
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
                replay_blob_id,
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

                // Update high score if this score is better
                if score > player.high_score {
                    player.high_score = score;
                }

                // Increment games played
                player.games_played += 1;

                // Update last played timestamp
                player.last_played_at = Some(timestamp);

                // Store replay blob ID if provided
                if let Some(blob_id) = replay_blob_id {
                    player.replay_blob_id = Some(blob_id);
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
                replay_blob_id,
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

                // Update high score if this score is better
                if score > player.high_score {
                    player.high_score = score;
                }

                // Increment games played
                player.games_played += 1;

                // Update last played timestamp
                player.last_played_at = Some(timestamp);

                // Store replay blob ID if provided
                if let Some(blob_id) = replay_blob_id {
                    player.replay_blob_id = Some(blob_id);
                }

                // Save updated player data
                self.state.players.insert(&sender, player)?;

                Ok(())
            }
            Message::RegisterPlayer { display_name: _ } => {
                // For MVP, we just use wallet addresses
                // Display names can be stored in a future version
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
