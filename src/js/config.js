/**
 * Configuration constants for Mapbox Flight Path Visualization
 * Contains coordinates, marker types, and map settings
 */

// Mapbox Access Token - Replace with your actual token
const MAPBOX_ACCESS_TOKEN = 'pk.eyJ1IjoiZ2FiY29kZXIiLCJhIjoiY21kYzNkM3RnMHh0cTJzcHk2djRpcDF4MyJ9.wr3fXFpQXYIKlwEkMfikXA';


// Geographic coordinates
const COORDINATES = {
    CVG: [-84.6627, 39.0458], // Cincinnati/Northern Kentucky International Airport
    MCO: [-81.3792, 28.4312], // Orlando International Airport
    // Aircraft position will be calculated dynamically (~2.5 min from CVG)
    // POI and Story markers will be added as needed
};

// Marker type definitions with colors and layer names
const MARKER_TYPES = {
    CITIES: {
        color: '#3B82F6', // Blue
        layer: 'cities-layer',
        priority: 1
    },
    POI: {
        color: '#10B981', // Green  
        layer: 'poi-layer',
        priority: 2
    },
    STORY: {
        color: '#8B5CF6', // Purple
        layer: 'story-layer', 
        priority: 3
    },
    AIRCRAFT: {
        color: '#FFFFFF', // White
        layer: 'aircraft-layer',
        priority: 0 // Highest priority
    }
};

// Map configuration
const MAP_CONFIG = {
    // Default map settings
    defaultCenter: [-82.9274, 33.7385], // Midpoint between CVG and MCO
    defaultZoom: 5,
    
    // Screenshot configurations
    overview: {
        zoom: 5,
        center: [-82.9274, 33.7385], // Midpoint
        dimensions: { width: 1080, height: 1920 }
    },
    zoom: {
        zoom: 10, // Increased zoom for closer view
        center: null, // Will be set to aircraft position
        dimensions: { width: 1080, height: 1920 }
    },
    
    // Map style - Dark theme for professional appearance
    style: 'mapbox://styles/mapbox/dark-v11',
    
    // Viewport settings for portrait orientation
    viewport: {
        width: 1080,
        height: 1920
    }
};

// Flight path configuration
const FLIGHT_CONFIG = {
    // Flight time from CVG to MCO (in minutes)
    totalFlightTime: 120, // 2 hours
    
    // Aircraft position (2.5 minutes from CVG)
    aircraftTimeFromCVG: 2.5,
    
    // Great circle calculation parameters
    earthRadius: 6371, // km
};

// Screenshot timing configuration
const SCREENSHOT_CONFIG = {
    // Wait times for proper rendering
    tileLoadWait: 2000, // 2 seconds after network idle
    animationWait: 1000, // 1 second for smooth transitions
    
    // Retry configuration
    maxRetries: 3,
    retryDelay: 1000,
};

// Export configuration for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        MAPBOX_ACCESS_TOKEN,
        COORDINATES,
        MARKER_TYPES,
        MAP_CONFIG,
        FLIGHT_CONFIG,
        SCREENSHOT_CONFIG
    };
} 