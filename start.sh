#!/bin/bash

# Color codes for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Set default ports, allow override via environment variables or arguments
HTTP_PORT=${HTTP_PORT:-${1:-3000}}
WS_PORT=${WS_PORT:-${2:-8080}}
HOST=${HOST:-'0.0.0.0'}

echo -e "${BLUE}╔════════════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║     Weather Warning System - Quick Start              ║${NC}"
echo -e "${BLUE}╚════════════════════════════════════════════════════════╝${NC}"
echo ""
echo -e "${BLUE}Configuration:${NC}"
echo -e "  HTTP Port:      ${GREEN}$HTTP_PORT${NC}"
echo -e "  WebSocket Port: ${GREEN}$WS_PORT${NC}"
echo ""

# Check if server is already running
EXISTING=$(pgrep -f "node server.js" | grep -v grep)
if [ ! -z "$EXISTING" ]; then
    echo -e "${YELLOW}⚠️  Server is already running (PID: $EXISTING)${NC}"
    echo "Kill it? (y/n)"
    read -r KILL_EXISTING
    if [ "$KILL_EXISTING" = "y" ]; then
        kill $EXISTING
        sleep 1
        echo -e "${GREEN}✓ Killed existing process${NC}"
    else
        echo "Using existing process..."
        EXISTING_PID=$EXISTING
    fi
fi

# Start server if not already running
if [ -z "$EXISTING_PID" ] && [ -z "$EXISTING" ]; then
    echo "Starting server..."
    HTTP_PORT=$HTTP_PORT WS_PORT=$WS_PORT HOST=$HOST node server.js 2>&1 &
    SERVER_PID=$!
    sleep 2
    EXISTING_PID=$SERVER_PID
fi

# Check if ports are open
echo ""
echo -e "${BLUE}Checking ports...${NC}"
if netstat -tlnp 2>/dev/null | grep -q ":$HTTP_PORT"; then
    echo -e "${GREEN}✓ Port $HTTP_PORT (HTTP) is listening${NC}"
else
    echo -e "${RED}✗ Port $HTTP_PORT (HTTP) is NOT listening${NC}"
fi

if netstat -tlnp 2>/dev/null | grep -q ":$WS_PORT"; then
    echo -e "${GREEN}✓ Port $WS_PORT (WebSocket) is listening${NC}"
else
    echo -e "${RED}✗ Port $WS_PORT (WebSocket) is NOT listening${NC}"
fi

# Test HTTP endpoint
echo ""
echo -e "${BLUE}Testing HTTP endpoint...${NC}"
CONFIG=$(curl -s http://localhost:$HTTP_PORT/config 2>&1)
if echo "$CONFIG" | grep -q "wsPort"; then
    echo -e "${GREEN}✓ Config endpoint working${NC}"
    echo "  Response: $CONFIG"
else
    echo -e "${RED}✗ Config endpoint failed${NC}"
fi

# Display access instructions
echo ""
echo -e "${BLUE}╔════════════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║              ACCESS THE APPLICATION                   ║${NC}"
echo -e "${BLUE}╚════════════════════════════════════════════════════════╝${NC}"
echo ""
echo -e "  ${GREEN}HTTP:${NC}      http://localhost:$HTTP_PORT"
echo -e "  ${GREEN}WebSocket:${NC} ws://localhost:$WS_PORT"
echo ""
echo -e "${BLUE}Open your browser to: ${GREEN}http://localhost:$HTTP_PORT${BLUE}${NC}"
echo ""

# Monitor server
echo -e "${BLUE}Server is running (PID: $EXISTING_PID)${NC}"
echo "Press Ctrl+C to stop"
echo ""

# Keep script running
wait $EXISTING_PID 2>/dev/null || true

echo -e "${YELLOW}Server stopped${NC}"
