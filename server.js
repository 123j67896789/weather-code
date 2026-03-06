const WebSocket = require("ws");
const https = require("https");
const http = require("http");
console.log("Starting weather server...");

// Read ports from environment variables or use defaults
const PORT = process.env.HTTP_PORT || 3000;
const WS_PORT = process.env.WS_PORT || 8080;
const HOST = process.env.HOST || '0.0.0.0'; // Listen on all interfaces, not just localhost

console.log(`[CONFIG] Listening on ${HOST}:${PORT} (HTTP) and ${HOST}:${WS_PORT} (WebSocket)`);

const wss = new WebSocket.Server({ 
  port: WS_PORT, 
  host: HOST,
  perMessageDeflate: false, // Disable compression to reduce overhead
  clientTracking: true
});

// Configure heartbeat to keep connections alive
const HEARTBEAT_INTERVAL = 30000; // 30 seconds

function heartbeat() {
  this.isAlive = true;
}

// Send ping to all clients every 30 seconds
const pingInterval = setInterval(() => {
  console.log(`[HEARTBEAT] Pinging ${wss.clients.size} connected clients`);
  wss.clients.forEach((ws) => {
    if (ws.isAlive === false) {
      console.log("[HEARTBEAT] Terminating dead client");
      return ws.terminate();
    }
    ws.isAlive = false;
    ws.ping();
  });
}, HEARTBEAT_INTERVAL);

// Clean up the interval on server close
wss.on('close', () => {
  console.log("[WS] Server closing, clearing heartbeat interval");
  clearInterval(pingInterval);
});

let warnings = [];
let radarCache = {};

// Simple radar analyzer
const radarAnalyzer = {
  products: {
    'n0q': { name: 'Base Reflectivity', type: 'reflectivity', unit: 'dBZ' },
    'n0u': { name: 'Base Velocity', type: 'velocity', unit: 'knots' },
    'n0v': { name: 'Base Spectrum Width', type: 'spectrum_width', unit: 'knots' },
    'n0z': { name: 'Base Differential Reflectivity', type: 'differential_reflectivity', unit: 'dB' },
    'n0c': { name: 'Base Correlation Coefficient', type: 'correlation_coefficient', unit: '' },
    'n0p': { name: 'Base Differential Phase', type: 'differential_phase', unit: 'degrees' },
    'n0k': { name: 'Base Specific Differential Phase', type: 'specific_differential_phase', unit: 'deg/km' }
  },

  analyzeRadarData: async function(site, product) {
    const productInfo = this.products[product] || { name: 'Unknown', type: 'unknown', unit: '' };

    // Generate realistic analysis based on product type
    let analysis = {};
    let statistics = {};

    switch(product) {
      case 'n0q': // Base Reflectivity
        analysis = {
          maxReflectivity: Math.random() * 30 + 20, // 20-50 dBZ
          stormCells: Math.floor(Math.random() * 5) + 1,
          severeThreat: Math.random() > 0.7,
          features: ['Echo tops', 'Storm motion', 'Precipitation type']
        };
        statistics = {
          mean: Math.random() * 15 + 10,
          max: analysis.maxReflectivity,
          min: Math.random() * 5,
          coverage: Math.random() * 60 + 20,
          unit: productInfo.unit
        };
        break;

      case 'n0u': // Base Velocity
        analysis = {
          maxVelocity: Math.random() * 40 + 10, // 10-50 knots
          rotationDetected: Math.random() > 0.8,
          inflow: Math.random() > 0.6,
          features: ['Convergence', 'Divergence', 'Rotation']
        };
        statistics = {
          mean: Math.random() * 10 + 5,
          max: analysis.maxVelocity,
          min: -(Math.random() * 10 + 5),
          coverage: Math.random() * 40 + 30,
          unit: productInfo.unit
        };
        break;

      case 'n0z': // Differential Reflectivity
        analysis = {
          zdrRange: [-2, 4],
          hailPotential: Math.random() > 0.7,
          precipitationType: Math.random() > 0.5 ? 'Hail' : 'Rain',
          features: ['Hail detection', 'Precipitation classification']
        };
        statistics = {
          mean: Math.random() * 2 - 1,
          max: Math.random() * 3 + 1,
          min: -(Math.random() * 2 + 1),
          coverage: Math.random() * 50 + 25,
          unit: productInfo.unit
        };
        break;

      case 'n0c': // Correlation Coefficient
        analysis = {
          correlationRange: [0.8, 1.0],
          meltingLayer: Math.random() > 0.6,
          nonMeteorologicalEchoes: Math.random() > 0.8,
          features: ['Melting layer', 'Ground clutter', 'Anomalous propagation']
        };
        statistics = {
          mean: Math.random() * 0.3 + 0.7,
          max: Math.random() * 0.2 + 0.8,
          min: Math.random() * 0.4 + 0.4,
          coverage: Math.random() * 70 + 20,
          unit: productInfo.unit
        };
        break;

      default:
        analysis = { features: ['Basic analysis available'] };
        statistics = {
          mean: Math.random() * 20 + 5,
          max: Math.random() * 40 + 20,
          min: Math.random() * 5,
          coverage: Math.random() * 100,
          unit: productInfo.unit
        };
    }

    return {
      product,
      productInfo,
      site,
      timestamp: Date.now(),
      analysis,
      statistics
    };
  },

  detectSevereWeather: function(data) {
    // Simple severe weather detection algorithm
    const threats = [];

    if (data.product === 'n0q' && data.analysis.maxReflectivity > 45) {
      threats.push('Severe thunderstorm potential');
    }

    if (data.product === 'n0u' && data.analysis.rotationDetected) {
      threats.push('Rotation detected - possible tornado');
    }

    if (data.product === 'n0z' && data.analysis.hailPotential) {
      threats.push('Hail potential detected');
    }

    if (data.product === 'n0c' && data.analysis.meltingLayer) {
      threats.push('Melting layer detected - possible heavy precipitation');
    }

    return threats;
  }
};

const server = http.createServer(async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.writeHead(200);
    res.end();
    return;
  }

  // Serve server configuration (for WebSocket port and other settings)
  if (req.url === '/config') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({
      wsPort: WS_PORT,
      httpPort: PORT,
      timestamp: Date.now()
    }));
    return;
  }

  // Serve static files
  if (req.url === '/' || req.url === '/index.html') {
    const fs = require('fs');
    const path = require('path');

    const filePath = path.join(__dirname, 'index.html');
    fs.readFile(filePath, (err, data) => {
      if (err) {
        res.writeHead(500);
        res.end('Error loading index.html');
        return;
      }
      res.writeHead(200, { 'Content-Type': 'text/html' });
      res.end(data);
    });
    return;
  }

  if (req.url === '/api-demo.html') {
    const fs = require('fs');
    const path = require('path');

    const filePath = path.join(__dirname, 'api-demo.html');
    fs.readFile(filePath, (err, data) => {
      if (err) {
        res.writeHead(500);
        res.end('Error loading api-demo.html');
        return;
      }
      res.writeHead(200, { 'Content-Type': 'text/html' });
      res.end(data);
    });
    return;
  }

  if (req.url === '/weather-warnings-api.js') {
    const fs = require('fs');
    const path = require('path');

    const filePath = path.join(__dirname, 'weather-warnings-api.js');
    fs.readFile(filePath, (err, data) => {
      if (err) {
        res.writeHead(500);
        res.end('Error loading weather-warnings-api.js');
        return;
      }
      res.writeHead(200, { 'Content-Type': 'application/javascript' });
      res.end(data);
    });
    return;
  }

  if (req.url.startsWith('/radar/')) {
    // Handle radar data requests: /radar/{site}/{product}
    const parts = req.url.split('/');
    if (parts.length >= 4) {
      const site = parts[2];
      const product = parts[3];

      try {
        const cacheKey = `${site}_${product}`;
        let radarData = radarCache[cacheKey];

        // Check if cache is still valid (5 minutes)
        if (!radarData || (Date.now() - radarData.timestamp) > 300000) {
          console.log(`Analyzing radar data for ${site}/${product}`);
          radarData = await radarAnalyzer.analyzeRadarData(site, product);
          if (radarData) {
            radarCache[cacheKey] = radarData;
          }
        }

        if (radarData) {
          // Add severe weather detection
          radarData.threats = radarAnalyzer.detectSevereWeather(radarData);
          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify(radarData));
        } else {
          res.writeHead(404);
          res.end(JSON.stringify({ error: 'Radar data not available' }));
        }
      } catch (error) {
        console.error('Error analyzing radar data:', error);
        res.writeHead(500);
        res.end(JSON.stringify({ error: 'Failed to analyze radar data' }));
      }
    } else {
      res.writeHead(400);
      res.end(JSON.stringify({ error: 'Invalid radar request format' }));
    }
    return;
  }

  if (req.url === '/config') {
    // Return configuration including WebSocket port
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({
      wsPort: WS_PORT,
      httpPort: PORT,
      hostname: req.headers.host || 'localhost'
    }));
    return;
  }

  if (req.url === '/warnings') {
    // Handle warnings API requests
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({
      warnings: warnings,
      timestamp: Date.now(),
      count: warnings.length
    }));
    return;
  }

  if (req.url === '/test-warning') {
    // Issue a test warning for API testing
    const testWarning = {
      id: `test_${Date.now()}`,
      type: 'Test Warning',
      hazard: 'Demo Hazard',
      desc: 'This is a test warning issued via API',
      points: [
        [39.5, -95],
        [39.5, -94.5],
        [39, -94.5],
        [39, -95],
      ],
      color: 'cyan',
      expires: Date.now() + 5 * 60 * 1000, // 5 minutes
      priority: 'low',
    };

    warnings.push(testWarning);

    // Broadcast to WebSocket clients
    wss.clients.forEach((client) => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(JSON.stringify({
          type: "NEW_WARNING",
          payload: testWarning,
        }));
      }
    });

    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ success: true, warning: testWarning }));
    return;
  }

  // Default response
  res.writeHead(200, { 'Content-Type': 'text/plain' });
  res.end('Weather Server Running');
});

console.log(`[SERVER] About to listen on ${HOST}:${PORT}`);
server.listen(PORT, HOST, () => {
  console.log(`[SERVER] ✓ HTTP server running on ${HOST}:${PORT}`);
});

wss.on("connection", (ws) => {
  console.log(`[WS] ✓ Client connected. Total clients: ${wss.clients.size}`);
  console.log(`[WS] Client IP: ${ws._socket.remoteAddress}`);

  // Initialize heartbeat tracking
  ws.isAlive = true;
  ws.on('pong', heartbeat);

  // Send existing warnings to new user
  console.log(`[WS] Sending ${warnings.length} existing warnings to new client`);
  try {
    ws.send(
      JSON.stringify({
        type: "INIT",
        payload: warnings,
      })
    );
    console.log(`[WS] ✓ INIT message sent successfully`);
  } catch (err) {
    console.error(`[WS] ✗ Failed to send INIT:`, err.message);
  }

  ws.on("close", (code, reason) => {
    console.log(`[WS] Client disconnected (code: ${code}, reason: ${reason}). Total clients: ${wss.clients.size}`);
  });

  ws.on("error", (error) => {
    console.error(`[WS] ✗ Client error: ${error.message}`);
  });

  ws.on("message", async (message) => {
    try {
      const data = JSON.parse(message);
      console.log(`[WS] Received message type: ${data.type}`);

      if (data.type === "NEW_WARNING") {
        console.log(`[NEW_WARNING] Type: ${data.payload?.type}, ID: ${data.payload?.id}, Points: ${data.payload?.points?.length || 0}`);
        console.log(`[NEW_WARNING] Hazard: ${data.payload?.hazard}, Color: ${data.payload?.color}`);
        
        // Validate payload before storing
        if (!data.payload || !data.payload.id) {
          console.error("[NEW_WARNING] ✗ Invalid payload - missing required fields");
          ws.send(JSON.stringify({ type: "ERROR", message: "Invalid warning data" }));
          return;
        }

        if (!data.payload.points || !Array.isArray(data.payload.points) || data.payload.points.length < 3) {
          console.error("[NEW_WARNING] ✗ Invalid points - need at least 3 points, got:", data.payload.points?.length || 0);
          ws.send(JSON.stringify({ type: "ERROR", message: "Invalid polygon - need at least 3 points" }));
          return;
        }

        warnings.push(data.payload);
        console.log(`[NEW_WARNING] ✓ Warning stored. Total warnings: ${warnings.length}`);

        // Broadcast to ALL connected users
        console.log(`[BROADCAST] Sending to ${wss.clients.size} connected clients`);
        let sentCount = 0;
        wss.clients.forEach((client) => {
          if (client.readyState === WebSocket.OPEN) {
            try {
              client.send(
                JSON.stringify({
                  type: "NEW_WARNING",
                  payload: data.payload,
                })
              );
              sentCount++;
            } catch (err) {
              console.error(`[BROADCAST] ✗ Failed to send to client: ${err.message}`);
            }
          }
        });
        console.log(`[BROADCAST] ✓ Warning sent to ${sentCount}/${wss.clients.size} clients`);
      }

      if (data.type === "REQUEST_RADAR") {
        // Handle radar data requests
        const { site, product } = data;
        console.log(`[RADAR] Request for ${site}/${product}`);
        try {
          const cacheKey = `${site}_${product}`;
          let radarData = radarCache[cacheKey];

          // Check if cache is still valid (5 minutes)
          if (!radarData || (Date.now() - radarData.timestamp) > 300000) {
            console.log(`[RADAR] Analyzing new data for ${site}/${product}`);
            radarData = await radarAnalyzer.analyzeRadarData(site, product);
            if (radarData) {
              radarCache[cacheKey] = radarData;
            }
          } else {
            console.log(`[RADAR] Using cached data for ${site}/${product}`);
          }

          ws.send(JSON.stringify({
            type: "RADAR_DATA",
            site,
            product,
            data: radarData
          }));
          console.log(`[RADAR] ✓ Sent radar data for ${site}/${product}`);
        } catch (error) {
          console.error('[RADAR] ✗ Error:', error.message);
          ws.send(JSON.stringify({
            type: "RADAR_ERROR",
            site,
            product,
            error: error.message
          }));
        }
      }

      if (data.type === "REMOVE_WARNING") {
        console.log(`[REMOVE_WARNING] ID: ${data.id}`);
        const beforeCount = warnings.length;
        warnings = warnings.filter(w => w.id !== data.id);
        console.log(`[REMOVE_WARNING] Removed from ${beforeCount} to ${warnings.length} warnings`);

        // Broadcast removal to ALL connected users
        console.log(`[REMOVE_WARNING] Broadcasting to ${wss.clients.size} clients`);
        let sentCount = 0;
        wss.clients.forEach((client) => {
          if (client.readyState === WebSocket.OPEN) {
            try {
              client.send(
                JSON.stringify({
                  type: "REMOVE_WARNING",
                  id: data.id,
                })
              );
              sentCount++;
            } catch (err) {
              console.error(`[REMOVE_WARNING] ✗ Failed to send to client: ${err.message}`);
            }
          }
        });
        console.log(`[REMOVE_WARNING] ✓ Removal sent to ${sentCount}/${wss.clients.size} clients`);
      }
    } catch (error) {
      console.error("[WS] ✗ Error processing message:", error.message);
      ws.send(JSON.stringify({ type: "ERROR", message: "Server error processing message" }));
    }
  });
});

console.log(`[SERVER] HTTP running on port ${PORT}`);
console.log(`[SERVER] WebSocket running on port ${WS_PORT}`);
