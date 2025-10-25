# Crossy Chain 🐔⛓️

A fully on-chain Crossy Road-style game built with **Linera blockchain** and **Three.js**. Players connect their Linera wallet, play the classic lane-crossing game, and submit their high scores directly to the blockchain for real-time leaderboards.

![Crossy Chain Demo](https://i.ibb.co/M6KTWnf/pic.jpg)

## 🎮 Features

- **On-Chain High Scores**: All scores are persisted on Linera microchains with instant finality
- **Linera Wallet Integration**: Connect your wallet to play and submit scores
- **Real-Time Leaderboards**: Query the blockchain for live leaderboard updates via GraphQL
- **Local Gameplay**: Zero blockchain latency during gameplay - all physics run locally
- **Optimistic UI**: Instant feedback with blockchain confirmation
- **Classic Crossy Road Mechanics**: Avoid cars, trucks, and navigate through forests
- **Responsive Design**: Play on desktop or mobile with touch controls

## 🏗️ Architecture

### Frontend (React + Three.js)
- **React 18** for UI components and state management
- **Three.js** for 3D game rendering and physics
- **Tailwind CSS** for styling
- **Linera Client** for blockchain interaction
- **Vite** for fast development and builds

### Backend (Linera Blockchain)
- **Rust** smart contract with `linera-sdk`
- **WebAssembly** compilation target
- **GraphQL Service** for leaderboard queries
- **Microchain Architecture** for instant finality

## 📋 Prerequisites

### Frontend
- Node.js 20+ and npm
- Modern web browser

### Backend (Linera)
- Rust 1.70+
- Linera CLI tools
- WebAssembly target (`wasm32-unknown-unknown`)

## 🚀 Quick Start

### 1. Clone and Install

```bash
# Clone the repository
git clone <your-repo-url>
cd crossy-chain

# Install frontend dependencies
npm install
```

### 2. Set Up Linera Backend

```bash
# Install Rust if needed
curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh

# Add WebAssembly target
rustup target add wasm32-unknown-unknown

# Install Linera CLI
cargo install linera-service linera-storage-service

# Start local Linera network (in a new terminal)
linera net up --with-faucet --faucet-port 8080

# Initialize wallet (in another terminal)
linera wallet init --faucet http://localhost:8080
linera wallet request-chain --faucet http://localhost:8080

# Build and deploy contract
cd backend
cargo build --release --target wasm32-unknown-unknown
linera publish-and-create \
  target/wasm32-unknown-unknown/release/crossy_chain_contract.wasm \
  target/wasm32-unknown-unknown/release/crossy_chain_service.wasm \
  --json-argument "{}"

# Start GraphQL service
linera service --port 8080
```

Save the contract ID returned from deployment - you'll need it for the frontend configuration.

### 3. Configure Frontend

Create a `.env` file in the root directory (copy from `.env.example`):

```bash
cp .env.example .env
```

Update the `.env` file with your deployed contract ID:

```bash
VITE_LINERA_CONTRACT_ID=your_contract_id_here
VITE_LINERA_FAUCET_URL=https://faucet.testnet-conway.linera.net
```

**Note**: The game will run in development mode (using localStorage) if no contract ID is provided. This allows you to test the game before deploying to the blockchain.

### 4. Start the Game

```bash
# From the root directory
npm run dev
```

Navigate to `http://localhost:5000` and start playing!

## 🎯 How to Play

1. **Connect Wallet**: Click "Connect Wallet" in the top-left corner
2. **Start Game**: Click "Start Game" from the menu
3. **Move**: Use **Arrow Keys** or **WASD** to move the chicken
4. **Avoid Obstacles**: Don't get hit by cars or trucks!
5. **Submit Score**: When you die, click "Submit Score On-Chain" to save your score
6. **View Leaderboard**: Check your rank against other players

## 🔧 Development

### Project Structure

```
crossy-chain/
├── backend/                 # Linera smart contract
│   ├── src/
│   │   ├── contract.rs     # Contract logic with SaveScore handler
│   │   ├── service.rs      # GraphQL service for leaderboards
│   │   ├── state.rs        # PlayerData state management
│   │   └── lib.rs          # Library entry point
│   ├── Cargo.toml          # Rust dependencies
│   └── README.md           # Backend documentation
├── client/                  # React frontend
│   ├── src/
│   │   ├── components/
│   │   │   ├── CrossyGame.tsx      # Three.js game component
│   │   │   ├── WalletConnect.tsx   # Wallet connection UI
│   │   │   ├── GameUI.tsx          # Game overlay UI
│   │   │   └── Leaderboard.tsx     # Leaderboard display
│   │   ├── lib/
│   │   │   └── lineraClient.ts     # Blockchain client
│   │   ├── App.tsx                 # Main app component
│   │   └── main.tsx                # Entry point
│   └── index.html
├── server/                  # Express server
├── package.json
└── README.md
```

### Running Tests

```bash
# Frontend
npm run check

# Backend (contract tests)
cd backend
cargo test
```

### Building for Production

```bash
# Frontend
npm run build

# Backend
cd backend
cargo build --release --target wasm32-unknown-unknown
```

## 📊 On-Chain Data Model

### PlayerData
```rust
pub struct PlayerData {
    pub high_score: u32,
    pub games_played: u32,
    pub last_played_at: Option<u64>,
    pub replay_blob_id: Option<String>,
}
```

### Contract Messages
- `SaveScore { score, replay_blob_id, timestamp }` - Save player score
- `RegisterPlayer { display_name }` - Register with optional display name

### GraphQL Queries
```graphql
# Get leaderboard
query {
  leaderboard(topN: 10) {
    wallet_address
    high_score
    games_played
    last_played_at
  }
}

# Get specific player
query {
  player(walletAddress: "address") {
    high_score
    games_played
  }
}
```

## 🌟 Key Technologies

- **Linera Blockchain**: Instant finality with microchain architecture
- **Three.js**: 3D rendering and game physics
- **React 18**: Modern UI with hooks
- **TypeScript**: Type-safe development
- **Tailwind CSS**: Utility-first styling
- **Vite**: Lightning-fast builds
- **GraphQL**: Efficient blockchain queries

## 🔐 Security

- **Signer-Only Updates**: Only wallet owners can update their scores
- **Score Validation**: Rejects invalid scores (e.g., 0)
- **High Score Protection**: Only updates when new score exceeds old
- **Timestamp Tracking**: Records submission times for anti-cheat

## 🚧 Roadmap

- [ ] Replay verification with deterministic input recording
- [ ] Anti-cheat validation service
- [ ] Display names for players
- [ ] Daily/weekly leaderboards
- [ ] NFT rewards for top players
- [ ] Multiplayer spectate mode
- [ ] Mobile app with React Native

## 📝 License

MIT License - see [LICENSE](LICENSE) for details

## 🙏 Acknowledgments

- Original Crossy Road game inspiration
- Linera team for the amazing blockchain platform
- Three.js community for 3D rendering tools

## 📞 Support

- [Linera Documentation](https://linera.dev)
- [GitHub Issues](your-repo/issues)
- [Discord Community](your-discord-link)

---

Built with ❤️ using Linera blockchain
