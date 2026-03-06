// Weather Warnings API Client
// This file provides functions to fetch and display weather warnings on any Leaflet map

class WeatherWarningsAPI {
  constructor(apiBaseUrl = '') {
    this.apiBaseUrl = apiBaseUrl;
    this.warnings = [];
    this.warningLayers = {};
  }

  /**
   * Fetch current warnings from the API
   * @returns {Promise<Array>} Array of warning objects
   */
  async fetchWarnings() {
    try {
      const response = await fetch(`${this.apiBaseUrl}/warnings`);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      this.warnings = data.warnings || [];
      return this.warnings;
    } catch (error) {
      console.error('Error fetching warnings:', error);
      throw error;
    }
  }

  /**
   * Add warnings to a Leaflet map
   * @param {L.Map} map - The Leaflet map instance
   * @param {Object} options - Display options
   * @param {boolean} options.showPopups - Whether to show popups on click (default: true)
   * @param {boolean} options.bringToFront - Whether to bring warnings to front (default: true)
   * @param {Function} options.onWarningClick - Callback when warning is clicked
   */
  addToMap(map, options = {}) {
    const {
      showPopups = true,
      bringToFront = true,
      onWarningClick = null
    } = options;

    // Clear existing warning layers
    this.clearFromMap(map);

    this.warnings.forEach(warning => {
      if (!warning.points || warning.points.length < 3) {
        console.warn('Invalid warning polygon:', warning);
        return;
      }

      const polygon = L.polygon(warning.points, {
        color: warning.color || 'red',
        fillColor: warning.color || 'red',
        fillOpacity: 0.35,
        weight: 3,
        warningData: warning,
      }).addTo(map);

      if (bringToFront) {
        polygon.bringToFront();
      }

      if (showPopups) {
        const expiresText = warning.expires ?
          `Expires: ${new Date(warning.expires).toLocaleTimeString()}` :
          'No expiration';

        polygon.bindPopup(`
          <div style="max-width: 300px;">
            <b style="color: ${warning.color}">${warning.type}</b><br>
            <b>Hazard:</b> ${warning.hazard}<br>
            <b>${expiresText}</b><br><br>
            ${warning.desc}
          </div>
        `);
      }

      if (onWarningClick) {
        polygon.on('click', () => onWarningClick(warning));
      }

      this.warningLayers[warning.id] = polygon;
    });
  }

  /**
   * Remove all warning layers from a map
   * @param {L.Map} map - The Leaflet map instance
   */
  clearFromMap(map) {
    Object.values(this.warningLayers).forEach(layer => {
      if (map.hasLayer(layer)) {
        map.removeLayer(layer);
      }
    });
    this.warningLayers = {};
  }

  /**
   * Update warnings on a map (fetch latest and re-display)
   * @param {L.Map} map - The Leaflet map instance
   * @param {Object} options - Display options (same as addToMap)
   */
  async updateMap(map, options = {}) {
    await this.fetchWarnings();
    this.addToMap(map, options);
  }

  /**
   * Get warnings filtered by criteria
   * @param {Object} filters - Filter criteria
   * @param {string} filters.type - Warning type (e.g., 'Tornado Warning')
   * @param {string} filters.priority - Priority level ('extreme', 'high', 'moderate', 'low')
   * @param {Array} filters.bounds - [south, west, north, east] bounds to filter by
   * @returns {Array} Filtered warnings
   */
  getFilteredWarnings(filters = {}) {
    return this.warnings.filter(warning => {
      if (filters.type && warning.type !== filters.type) return false;
      if (filters.priority && warning.priority !== filters.priority) return false;

      if (filters.bounds) {
        const [south, west, north, east] = filters.bounds;
        // Check if warning polygon intersects with bounds
        const intersects = warning.points.some(point => {
          const [lat, lng] = point;
          return lat >= south && lat <= north && lng >= west && lng <= east;
        });
        if (!intersects) return false;
      }

      return true;
    });
  }

  /**
   * Get warning statistics
   * @returns {Object} Statistics object
   */
  getStatistics() {
    const stats = {
      total: this.warnings.length,
      byType: {},
      byPriority: {},
      active: 0,
      expired: 0
    };

    const now = Date.now();
    this.warnings.forEach(warning => {
      // Count by type
      stats.byType[warning.type] = (stats.byType[warning.type] || 0) + 1;

      // Count by priority
      stats.byPriority[warning.priority || 'unknown'] = (stats.byPriority[warning.priority || 'unknown'] || 0) + 1;

      // Count active vs expired
      if (warning.expires && warning.expires > now) {
        stats.active++;
      } else if (warning.expires) {
        stats.expired++;
      } else {
        stats.active++; // No expiration = active
      }
    });

    return stats;
  }
}

// Export for use in other scripts
if (typeof module !== 'undefined' && module.exports) {
  module.exports = WeatherWarningsAPI;
}

// Global export for browser use
if (typeof window !== 'undefined') {
  window.WeatherWarningsAPI = WeatherWarningsAPI;
}