# Running the Weather Warning System

## Quick Start

```bash
cd /workspaces/weather-code
node server.js
```

The server will start on:
- **HTTP**: http://localhost:3000
- **WebSocket**: ws://localhost:8080

## Accessing the Application

### Option 1: Local Machine
Open your browser and go to: **http://localhost:3000**

### Option 2: VS Code Port Forwarding
If using VS Code's port forwarding or similar:
1. The HTTP port (3000) will be forwarded automatically
2. The WebSocket port (8080) also needs to be exposed
3. VS Code will provide you with a forwarded URL like: `https://example-project-123456.vscode-dev.github.com`
4. Open that URL in your browser

### Option 3: Remote Access / Different Machine
If accessing from a different machine:
1. Make sure both ports 3000 and 8080 are accessible (firewall rules)
2. Replace `localhost` with the server's IP address or hostname
3. Example: `http://192.168.1.100:3000`

## Debugging Connection Issues

### Check Browser Console (F12)
The app logs detailed connection information:

```
[WS] Fetching server config from /config...
[WS] Server config received: {wsPort: 8080, httpPort: 3000, timestamp: ...}
[WS] Connection details:
[WS]  - Protocol: ws
[WS]  - Hostname: localhost
[WS]  - Port: 8080
[WS]  - Full URL: ws://localhost:8080
[WS] Attempting to create WebSocket connection...
```

**Look for completion:**
```
[WS] ✓ WebSocket connection OPENED
[WS] Ready state: 1 (OPEN=1)
```

### If Connection Fails

**Error:** `[WS] ✗ WebSocket ERROR occurred`

Check:
1. ✅ Server is running: `ps aux | grep "node server"`
2. ✅ Port 3000 is open: `curl http://localhost:3000/config`
3. ✅ Port 8080 is listening: `netstat -tlnp | grep 8080`
4. ✅ Firewall not blocking: Check your firewall rules
5. ✅ Port forwarding configured: If using VSCode forwarding, both ports must be exposed

### Test WebSocket Directly

```bash
node test-ws-connection.js
```

Output should show:
```
✅ WebSocket connection SUCCESSFUL
Server is accepting WebSocket connections
```

## Using the Warning System

1. **Draw a Polygon**
   - Go to "NWS" or "SPC" tab
   - Click "Draw Polygon"
   - Click on map 3+ times to create points
   - Click "Finish Polygon"

2. **Issue a Warning**
   - Select warning type, hazard, and description
   - Click "Issue Warning"
   - Look for the polygon on the map

3. **Monitor Status**
   - Look at the red "Connection" status at top of sidebar
   - Should show "CONNECTED" in green
   - If "DISCONNECTED", check the console for errors

## Environment Variables

Customize ports with:

```bash
HTTP_PORT=3000 WS_PORT=8080 node server.js
```

## Troubleshooting Checklist

- [ ] Server is running (no error messages)
- [ ] HTTP port 3000 responds to requests
- [ ] WebSocket port 8080 is listening on 0.0.0.0
- [ ] Browser console shows no errors
- [ ] Sidebar shows "CONNECTED" in green
- [ ] Can draw a polygon without errors
- [ ] Can issue a warning without errors
- [ ] Warning appears on map with correct color/polygon

## Still Having Issues?

1. Check server output for errors when issuing warnings
2. Open browser Developer Tools (F12) → Console tab
3. Try the `/test-warning` endpoint:
   ```bash
   curl http://localhost:3000/test-warning
   ```
4. Check that warning appears in `/warnings` endpoint:
   ```bash
   curl http://localhost:3000/warnings
   ```
