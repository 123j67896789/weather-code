#!/usr/bin/env node

/**
 * Test WebSocket connection from a client perspective
 */

const WebSocket = require('ws');

const wsPort = process.env.WS_PORT || 8080;
const hostname = process.env.WS_HOST || 'localhost';

console.log(`\n🔍 Testing WebSocket Connection`);
console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
console.log(`Host: ${hostname}`);
console.log(`Port: ${wsPort}`);
console.log(`URL: ws://${hostname}:${wsPort}`);
console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`);

const url = `ws://${hostname}:${wsPort}`;

try {
  const ws = new WebSocket(url);
  
  ws.on('open', () => {
    console.log('✅ WebSocket connection SUCCESSFUL');
    console.log('Server is accepting WebSocket connections\n');
    
    // Send a test message
    const testMsg = { type: 'TEST', message: 'Connection test from client' };
    console.log('Sending test message:', testMsg);
    ws.send(JSON.stringify(testMsg));
  });

  ws.on('message', (data) => {
    console.log('📨 Received from server:', data.toString());
  });

  ws.on('error', (error) => {
    console.error('❌ WebSocket ERROR:', error.message);
    console.error('');
    console.error('Possible causes:');
    console.error('  1. Server is not running on that port');
    console.error('  2. Network/firewall is blocking the connection');
    console.error('  3. Port forwarding is not set up correctly');
    console.error('  4. Host/port combination is wrong');
    process.exit(1);
  });

  ws.on('close', () => {
    console.log('Connection closed');
    process.exit(0);
  });

  // Timeout after 5 seconds
  setTimeout(() => {
    console.error('⏱️  Connection timeout - server did not respond');
    process.exit(1);
  }, 5000);

} catch (error) {
  console.error('❌ Error creating connection:', error.message);
  process.exit(1);
}
