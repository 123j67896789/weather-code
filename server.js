const WebSocket = require("ws");

const wss = new WebSocket.Server({ port: 8080 });

let warnings = [];

wss.on("connection", (ws) => {
  console.log("Client connected");

  // Send existing warnings to new user
  ws.send(
    JSON.stringify({
      type: "INIT",
      payload: warnings,
    })
  );

  ws.on("message", (message) => {
    const data = JSON.parse(message);

    if (data.type === "NEW_WARNING") {
      warnings.push(data.payload);

      // Broadcast to ALL connected users
      wss.clients.forEach((client) => {
        if (client.readyState === WebSocket.OPEN) {
          client.send(
            JSON.stringify({
              type: "NEW_WARNING",
              payload: data.payload,
            })
          );
        }
      });
    }
  });
});

console.log("WebSocket running on port 8080");

