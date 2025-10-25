# Crossy Chain - Linera Smart Contract

This is the backend smart contract for Crossy Chain, a Crossy Road-style game built on Linera blockchain.

## Overview

The contract stores player high scores, games played, and timestamps on-chain using Linera's microchain architecture. Each player's state is isolated to their own microchain for instant finality.

## Contract Structure

- `src/state.rs` - Defines PlayerData and application state
- `src/contract.rs` - Contract logic with SaveScore message handler
- `src/service.rs` - GraphQL service for leaderboard queries
- `src/lib.rs` - Library entry point and ABI definitions

## Prerequisites

1. **Install Rust**:
   ```bash
   curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh
   ```

2. **Add WebAssembly target**:
   ```bash
   rustup target add wasm32-unknown-unknown
   ```

3. **Install Linera CLI**:
   ```bash
   cargo install linera-service linera-storage-service
   ```

   Or follow the official installation guide: https://linera.dev/developers/getting_started/installation.html

## Local Development

### 1. Start Local Linera Network

```bash
# Start local network with faucet
linera net up --with-faucet --faucet-port 8080
```

### 2. Initialize Wallet

In a new terminal:

```bash
# Set wallet paths
export LINERA_WALLET="$HOME/.config/linera/wallet.json"
export LINERA_KEYSTORE="$HOME/.config/linera/keystore.json"
export LINERA_STORAGE="rocksdb:$HOME/.config/linera/wallet.db"

# Initialize wallet and request chain
linera wallet init --faucet http://localhost:8080
linera wallet request-chain --faucet http://localhost:8080
```

### 3. Build Contract

```bash
cd backend
cargo build --release --target wasm32-unknown-unknown
```

### 4. Deploy Contract

```bash
# Deploy the contract and service
linera publish-and-create \
  target/wasm32-unknown-unknown/release/crossy_chain_contract.wasm \
  target/wasm32-unknown-unknown/release/crossy_chain_service.wasm \
  --json-argument "{}"
```

Save the returned contract ID - you'll need it for the frontend.

### 5. Start GraphQL Service

```bash
# Start the service on port 8080
linera service --port 8080
```

Navigate to `http://localhost:8080` to access GraphiQL and test queries.

## Testing with GraphQL

### Query Leaderboard

```graphql
query {
  leaderboard(topN: 10) {
    wallet_address
    high_score
    games_played
    last_played_at
  }
}
```

### Query Specific Player

```graphql
query {
  player(walletAddress: "YOUR_WALLET_ADDRESS") {
    wallet_address
    high_score
    games_played
    last_played_at
  }
}
```

### Get Player Count

```graphql
query {
  playerCount
}
```

## Contract Messages

### SaveScore

Saves a player's score on-chain. Only the authenticated signer can update their own score.

```rust
Message::SaveScore {
    score: u32,
    replay_blob_id: Option<String>,
    timestamp: u64,
}
```

**Behavior**:
- Updates high score only if the new score is greater
- Increments games_played counter
- Stores last_played_at timestamp
- Requires authenticated wallet signature

### RegisterPlayer

Placeholder for future display name feature.

```rust
Message::RegisterPlayer {
    display_name: Option<String>,
}
```

## Deployment to Testnet

1. **Connect to Testnet**:
   ```bash
   linera wallet init --faucet https://faucet.testnet-conway.linera.net
   linera wallet request-chain --faucet https://faucet.testnet-conway.linera.net
   ```

2. **Build for production**:
   ```bash
   cargo build --release --target wasm32-unknown-unknown
   ```

3. **Deploy**:
   ```bash
   linera publish-and-create \
     target/wasm32-unknown-unknown/release/crossy_chain_contract.wasm \
     target/wasm32-unknown-unknown/release/crossy_chain_service.wasm \
     --json-argument "{}"
   ```

4. **Start service**:
   ```bash
   linera service --port 8080
   ```

5. **Update frontend** with the contract ID and service URL.

## Security Features

- **Signer-only updates**: Only the wallet owner can update their score
- **Score validation**: Rejects scores of 0
- **High score protection**: Only updates when new score is higher
- **Timestamp tracking**: Records when scores were submitted

## Future Enhancements

- Replay verification with blob storage
- Display names for players
- Daily/weekly leaderboards
- Anti-cheat with deterministic replay validation
- Rate limiting for score submissions

## Troubleshooting

### Build Errors

If you get dependency errors:
```bash
cargo clean
cargo update
cargo build --release --target wasm32-unknown-unknown
```

### Service Connection Issues

Make sure the local network is running:
```bash
linera net helper
```

Check if the service is accessible:
```bash
curl http://localhost:8080
```

## Resources

- [Linera Documentation](https://linera.dev)
- [Linera Getting Started](https://linera.dev/developers/getting_started/hello_linera.html)
- [Linera GitHub](https://github.com/linera-io/linera-protocol)

## License

MIT
