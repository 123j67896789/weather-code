# Weather Warnings API

This project provides a real-time weather warning system with both WebSocket and REST API support for displaying warnings on maps.

## Features

- **Real-time warnings**: Issue NWS and SPC weather warnings with polygon boundaries
- **Radar analysis**: Automatic detection of severe weather threats from radar data
- **REST API**: Fetch current warnings via HTTP API for external applications
- **WebSocket updates**: Real-time warning updates for connected clients
- **Multiple map support**: Display warnings on any Leaflet-based map using the API

## API Endpoints

### GET /warnings
Returns current active warnings in JSON format.

**Response:**
```json
{
  "warnings": [
    {
      "id": "warning_id",
      "type": "Tornado Warning",
      "hazard": "Large and Dangerous Tornado",
      "desc": "Full warning description...",
      "points": [[lat1, lng1], [lat2, lng2], ...],
      "color": "red",
      "expires": 1640995200000,
      "priority": "extreme"
    }
  ],
  "timestamp": 1640995200000,
  "count": 1
}
```

### GET /radar/{site}/{product}
Returns radar data analysis for a specific site and product.

## Using the Warnings API in Your Application

### Basic Usage

1. Include the API client:
```html
<script src="/weather-warnings-api.js"></script>
```

2. Initialize and use:
```javascript
// Initialize the API
const warningsAPI = new WeatherWarningsAPI();

// Fetch and display warnings on your map
await warningsAPI.updateMap(yourLeafletMap, {
  showPopups: true,
  bringToFront: true,
  onWarningClick: (warning) => {
    console.log('Warning clicked:', warning);
  }
});
```

### Advanced Usage

```javascript
// Filter warnings
const tornadoWarnings = warningsAPI.getFilteredWarnings({
  type: 'Tornado Warning',
  bounds: [30, -100, 50, -80] // [south, west, north, east]
});

// Get statistics
const stats = warningsAPI.getStatistics();
console.log(`Total warnings: ${stats.total}, Active: ${stats.active}`);

// Manual control
await warningsAPI.fetchWarnings(); // Fetch latest
warningsAPI.addToMap(map); // Add to map
warningsAPI.clearFromMap(map); // Remove from map
```

## Demo

Visit `/api-demo.html` to see a working example of the warnings API in action.

## Warning Types

- **Tornado Warning** (extreme priority)
- **Severe Thunderstorm Warning** (high priority)
- **Flash Flood Warning** (high priority)
- **Winter Storm Warning** (high priority)
- **Hurricane Warning** (extreme priority)
- And many more...

## Priority Levels

- `extreme`: Red alerts with sound notifications
- `high`: Orange alerts
- `moderate`: Yellow alerts
- `low`: Green alerts

## Running the Server

```bash
node server.js
```

The server runs on:
- HTTP: port 3000
- WebSocket: port 8080

## Files

- `server.js`: Main server with API endpoints
- `index.html`: Main weather application
- `api-demo.html`: API usage demonstration
- `weather-warnings-api.js`: Client-side API library
- `package.json`: Dependencies

## Dependencies

- Node.js
- Leaflet.js (for maps)
- WebSocket support

## License

This project is for educational and demonstration purposes.