const WebSocket = require('ws');
const ws = new WebSocket('ws://localhost:8080');

ws.on('open', () => {
  console.log('Connected to server');
  ws.send(JSON.stringify({
    type: 'NEW_WARNING',
    payload: {
      id: 'test123',
      type: 'Test Warning',
      hazard: 'Testing',
      desc: 'This is a test',
      points: [[39, -95], [39, -94], [38, -94], [38, -95]],
      color: 'yellow',
      expires: Date.now() + 60000,
      priority: 'low',
      source: 'test'
    }
  }));
});

ws.on('message', (msg) => {
  console.log('Received:', msg.toString());
});

ws.on('error', (err) => {
  console.error('WebSocket error', err.message);
});
