# Crossy Chain

## Overview

Crossy Chain is a fully on-chain Crossy Road-style game built on the Linera blockchain with a React and Three.js frontend. Players connect their Linera wallet, play the classic lane-crossing game avoiding cars and trucks, and submit their high scores directly to the blockchain. The game features real-time leaderboards, instant finality through Linera's microchain architecture, and optimistic UI updates for a seamless gaming experience.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture

**Framework & Rendering:**
- React 18 with TypeScript for UI components and state management
- Three.js for 3D game rendering with WebGL
- Vite as the build tool and development server
- React Three Fiber (@react-three/fiber) for declarative Three.js components
- React Three Drei (@react-three/drei) for additional 3D helpers and utilities
- React Three Postprocessing (@react-three/postprocessing) for visual effects

**State Management:**
- Zustand for global game state (game phase, audio controls)
- React hooks for local component state
- Subscriptions with selector middleware for fine-grained reactivity

**Styling & UI Components:**
- Tailwind CSS for utility-first styling
- Radix UI primitives for accessible, unstyled components
- shadcn/ui component library built on Radix UI
- Custom theme system with CSS variables for colors and spacing
- Press Start 2P font for retro gaming aesthetic

**Game Architecture:**
- Local physics simulation running in the browser for zero-latency gameplay
- Three.js scene with orthographic camera for isometric view
- Game loop with requestAnimationFrame for smooth rendering
- Touch and keyboard controls for cross-platform input
- Optimistic UI updates with blockchain confirmation

### Backend Architecture

**Blockchain Integration:**
- Linera blockchain smart contract written in Rust
- WebAssembly (wasm32-unknown-unknown) compilation target
- Linera SDK (@linera/client and @linera/signer) for wallet and blockchain interaction
- Per-player microchain architecture for isolated state and instant finality
- GraphQL service for querying leaderboard data

**Smart Contract Design:**
- PlayerData structure storing high_score, games_played, last_played_at, and optional replay_blob_id
- SaveScore message handler for submitting new scores
- RegisterPlayer message for optional player registration with display names
- Microchain-per-player model ensuring parallel execution and no congestion

**Server Architecture:**
- Express.js server for development and production
- Vite middleware in development mode for HMR and fast refresh
- Static file serving in production
- API routes prefixed with /api for clear separation

### Data Storage

**In-Memory Storage (Development):**
- MemStorage class implementing IStorage interface
- Map-based user storage for development/testing
- No persistent database in current implementation

**Database Configuration:**
- Drizzle ORM configured for PostgreSQL
- Neon serverless PostgreSQL driver (@neondatabase/serverless)
- Schema defined in shared/schema.ts with users table
- Migration support via drizzle-kit
- Database currently not actively used (storage interface exists but game relies on blockchain)

**Design Decision:** The application uses Linera blockchain as the primary data store for game state (scores, leaderboards), while the traditional database setup exists but is not utilized. This allows all game-critical data to benefit from blockchain immutability and decentralization. The database could be added later for auxiliary features like user profiles, settings, or off-chain analytics.

### External Dependencies

**Blockchain Services:**
- Linera testnet (testnet-conway.linera.net) for blockchain operations
- Linera faucet service for claiming test chains
- GraphQL endpoint for querying blockchain state

**Third-Party Libraries:**
- Three.js for 3D rendering engine
- React Query (@tanstack/react-query) for async state management
- Sonner for toast notifications
- React Hook Form for form management
- Zod for schema validation

**Development Tools:**
- TypeScript for type safety
- ESBuild for server-side bundling
- PostCSS with Autoprefixer for CSS processing
- GLSL shader support via vite-plugin-glsl

**Font Services:**
- Google Fonts (Press Start 2P) for retro gaming typography
- Fontsource (@fontsource/inter) for Inter font family