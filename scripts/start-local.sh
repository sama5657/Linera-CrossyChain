#!/bin/bash

# Crossy Chain Local Development Setup Script
# This script starts a local Linera network and initializes a wallet

set -e

echo "🎮 Crossy Chain Local Development Setup"
echo "========================================"

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

# Check if linera CLI is installed
if ! command -v linera &> /dev/null; then
    echo -e "${RED}❌ Linera CLI is not installed.${NC}"
    echo "Install with: cargo install linera-service linera-storage-service"
    exit 1
fi

# Check if a local network is already running
if lsof -Pi :8080 -sTCP:LISTEN -t >/dev/null ; then
    echo -e "${YELLOW}⚠️  Port 8080 is already in use. Local network may already be running.${NC}"
    read -p "Stop existing service and restart? (y/n) " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        pkill -f "linera" || true
        sleep 2
    else
        echo "Exiting..."
        exit 1
    fi
fi

echo ""
echo -e "${GREEN}🚀 Starting local Linera network...${NC}"
echo ""

# Start the local network in the background
linera net up --with-faucet --faucet-port 8080 &
NETWORK_PID=$!

# Wait for network to be ready
echo "Waiting for network to start..."
sleep 5

# Check if network started successfully
if ! lsof -Pi :8080 -sTCP:LISTEN -t >/dev/null ; then
    echo -e "${RED}❌ Failed to start local network${NC}"
    exit 1
fi

echo -e "${GREEN}✅ Local network started successfully${NC}"
echo ""

# Set wallet paths
export LINERA_WALLET="$HOME/.config/linera/wallet.json"
export LINERA_KEYSTORE="$HOME/.config/linera/keystore.json"
export LINERA_STORAGE="rocksdb:$HOME/.config/linera/wallet.db"

echo -e "${GREEN}🔑 Initializing wallet...${NC}"

# Remove old wallet if exists
if [ -f "$LINERA_WALLET" ]; then
    echo -e "${YELLOW}⚠️  Removing old wallet...${NC}"
    rm -f "$LINERA_WALLET" "$LINERA_KEYSTORE"
    rm -rf "$HOME/.config/linera/wallet.db"
fi

# Initialize wallet
linera wallet init --faucet http://localhost:8080

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ Wallet initialized${NC}"
else
    echo -e "${RED}❌ Failed to initialize wallet${NC}"
    kill $NETWORK_PID
    exit 1
fi

# Request a chain
echo ""
echo -e "${GREEN}⛓️  Requesting chain from faucet...${NC}"
linera wallet request-chain --faucet http://localhost:8080

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ Chain created successfully${NC}"
else
    echo -e "${RED}❌ Failed to request chain${NC}"
    kill $NETWORK_PID
    exit 1
fi

# Display wallet info
echo ""
echo -e "${GREEN}📋 Wallet Information:${NC}"
linera wallet show

echo ""
echo -e "${GREEN}🎉 Local setup complete!${NC}"
echo ""
echo "Network PID: $NETWORK_PID"
echo ""
echo "Next steps:"
echo "1. In a new terminal, deploy the contract: ./scripts/deploy.sh"
echo "2. Start the Linera service: linera service --port 8080"
echo "3. Start the frontend: npm run dev"
echo ""
echo -e "${YELLOW}⚠️  To stop the network, run: kill $NETWORK_PID${NC}"
echo ""

# Save PID to file
echo $NETWORK_PID > .linera-network.pid
echo "Network PID saved to .linera-network.pid"
