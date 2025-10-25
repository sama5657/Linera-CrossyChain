mod contract;
mod service;
mod state;

pub use contract::{CrossyChainContract, Message, Operation};
pub use service::CrossyChainService;
pub use state::{CrossyChainState, PlayerData};

use async_graphql::{EmptySubscription, Object, Schema};
use linera_sdk::base::{ContractAbi, ServiceAbi};

/// Application ABI
pub struct CrossyChainAbi;

impl ContractAbi for CrossyChainAbi {
    type Operation = Operation;
    type Response = ();
}

impl ServiceAbi for CrossyChainAbi {
    type Query = Request;
    type QueryResponse = Response;
}

use async_graphql::{Request, Response};

linera_sdk::contract!(CrossyChainContract);
linera_sdk::service!(CrossyChainService);
