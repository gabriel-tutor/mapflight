/**
 * Environment Configuration for Mapbox Flight Path Visualization
 * Loads sensitive configuration from environment variables
 */

// Load environment variables if running in Node.js
if (typeof require !== 'undefined') {
    try {
        require('dotenv').config();
    } catch (error) {
        console.warn('dotenv not available, using fallback configuration');
    }
}

/**
 * Get Mapbox access token from environment variables
 * Falls back to a placeholder if not found
 */
function getMapboxAccessToken() {
    // Try to get from environment variables
    if (typeof process !== 'undefined' && process.env && process.env.MAPBOX_ACCESS_TOKEN) {
        return process.env.MAPBOX_ACCESS_TOKEN;
    }
    
    // Try to get from window object (for browser environment)
    if (typeof window !== 'undefined' && window.MAPBOX_ACCESS_TOKEN) {
        return window.MAPBOX_ACCESS_TOKEN;
    }
    
    // Fallback for development
    console.warn('Mapbox access token not found in environment variables. Please set MAPBOX_ACCESS_TOKEN in your .env file.');
    return 'YOUR_MAPBOX_ACCESS_TOKEN_HERE';
}

/**
 * Get environment configuration
 */
function getEnvironmentConfig() {
    return {
        MAPBOX_ACCESS_TOKEN: getMapboxAccessToken(),
        NODE_ENV: (typeof process !== 'undefined' && process.env && process.env.NODE_ENV) || 'development',
        IS_PRODUCTION: (typeof process !== 'undefined' && process.env && process.env.NODE_ENV === 'production') || false
    };
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        getMapboxAccessToken,
        getEnvironmentConfig
    };
}

// Make available globally for browser environment
if (typeof window !== 'undefined') {
    window.getMapboxAccessToken = getMapboxAccessToken;
    window.getEnvironmentConfig = getEnvironmentConfig;
} 