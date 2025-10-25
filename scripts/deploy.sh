#!/bin/bash

# Crossy Chain Deployment Script
# This script builds and deploys the Linera smart contract

set -e

echo "🚀 Crossy Chain Deployment Script"
echo "=================================="

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Check if Rust is installed
if ! command -v cargo &> /dev/null; then
    echo -e "${RED}❌ Rust is not installed. Please install Rust first.${NC}"
    echo "Visit: https://rustup.rs"
    exit 1
fi

# Check if wasm32 target is installed
if ! rustup target list | grep -q "wasm32-unknown-unknown (installed)"; then
    echo -e "${YELLOW}⚠️  wasm32-unknown-unknown target not found. Installing...${NC}"
    rustup target add wasm32-unknown-unknown
fi

# Check if linera CLI is installed
if ! command -v linera &> /dev/null; then
    echo -e "${RED}❌ Linera CLI is not installed.${NC}"
    echo "Install with: cargo install linera-service linera-storage-service"
    exit 1
fi

# Navigate to backend directory
cd backend || exit 1

echo ""
echo -e "${GREEN}📦 Building contract...${NC}"
cargo build --release --target wasm32-unknown-unknown

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ Contract built successfully${NC}"
else
    echo -e "${RED}❌ Contract build failed${NC}"
    exit 1
fi

echo ""
echo -e "${GREEN}📤 Deploying contract to Linera...${NC}"
echo ""

# Deploy the contract
DEPLOYMENT_OUTPUT=$(linera publish-and-create \
    target/wasm32-unknown-unknown/release/crossy_chain_contract.wasm \
    target/wasm32-unknown-unknown/release/crossy_chain_service.wasm \
    --json-argument "{}" 2>&1)

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ Contract deployed successfully!${NC}"
    echo ""
    echo "$DEPLOYMENT_OUTPUT"
    
    # Extract and display contract ID
    CONTRACT_ID=$(echo "$DEPLOYMENT_OUTPUT" | grep -oP '(?<=application ID: )[a-f0-9]+' | head -1)
    
    if [ -n "$CONTRACT_ID" ]; then
        echo ""
        echo -e "${GREEN}📋 Contract ID: ${YELLOW}$CONTRACT_ID${NC}"
        echo ""
        echo -e "${YELLOW}⚠️  IMPORTANT: Update client/src/lib/lineraClient.ts with this contract ID!${NC}"
        echo ""
        
        # Save contract ID to file
        echo "$CONTRACT_ID" > ../contract-id.txt
        echo -e "${GREEN}✅ Contract ID saved to contract-id.txt${NC}"
    fi
else
    echo -e "${RED}❌ Contract deployment failed${NC}"
    echo "$DEPLOYMENT_OUTPUT"
    exit 1
fi

echo ""
echo -e "${GREEN}🎉 Deployment complete!${NC}"
echo ""
echo "Next steps:"
echo "1. Update client/src/lib/lineraClient.ts with the contract ID above"
echo "2. Start the Linera service: linera service --port 8080"
echo "3. Start the frontend: npm run dev"
echo ""
