/**
 * Core Mapbox GL JS implementation for Flight Path Visualization
 * Handles map initialization, styling, and main functionality
 */

class FlightPathMap {
    constructor() {
        this.map = null;
        this.markerManager = null;
        this.isInitialized = false;
        
        // Bind methods to preserve context
        this.handleMapLoad = this.handleMapLoad.bind(this);
        this.handleMapError = this.handleMapError.bind(this);
        this.handleMapIdle = this.handleMapIdle.bind(this);
    }
    
    /**
     * Initialize the map
     */
    async initialize() {
        try {
            showLoading();
            
            // Check for Mapbox access token
            if (!MAPBOX_ACCESS_TOKEN || MAPBOX_ACCESS_TOKEN === 'YOUR_MAPBOX_ACCESS_TOKEN_HERE') {
                throw new Error('Mapbox access token not configured. Please update config.js with your token.');
            }
            
            // Set Mapbox access token
            mapboxgl.accessToken = MAPBOX_ACCESS_TOKEN;
            
            // Create map instance
            this.map = new mapboxgl.Map({
                container: 'map',
                style: MAP_CONFIG.style,
                center: MAP_CONFIG.defaultCenter,
                zoom: MAP_CONFIG.defaultZoom,
                attributionControl: false,
                preserveDrawingBuffer: true, // Required for screenshots
                antialias: true
            });
            
            // Add event listeners
            this.map.on('load', this.handleMapLoad);
            this.map.on('error', this.handleMapError);
            this.map.on('idle', this.handleMapIdle);
            
            // Add navigation controls
            this.addNavigationControls();
            
            console.log('Map initialization started');
            
        } catch (error) {
            console.error('Map initialization failed:', error);
            showError(error.message);
            hideLoading();
        }
    }
    
    /**
     * Handle map load event
     */
    async handleMapLoad() {
        try {
            console.log('Map loaded successfully');
            
            // Initialize marker manager
            this.markerManager = new MarkerManager(this.map);
            
            // Create all markers
            await this.markerManager.createAllMarkers();
            
            // Apply custom styling (non-blocking)
            setTimeout(() => {
                this.applyCustomStyling();
            }, 100);
            
            // Hide loading indicator
            hideLoading();
            
            this.isInitialized = true;
            
            // Trigger custom event for external listeners
            this.dispatchEvent('mapReady');
            
        } catch (error) {
            console.error('Error in map load handler:', error);
            showError('Failed to load map components');
            hideLoading();
        }
    }
    
    /**
     * Handle map error event
     */
    handleMapError(error) {
        console.error('Map error:', error);
        showError('Map loading error occurred');
        hideLoading();
    }
    
    /**
     * Handle map idle event (when all tiles are loaded)
     */
    handleMapIdle() {
        // Map is fully loaded and idle
        console.log('Map is idle - all tiles loaded');
    }
    
    /**
     * Add navigation controls to the map
     */
    addNavigationControls() {
        // Add zoom controls
        this.map.addControl(new mapboxgl.NavigationControl({
            showCompass: true,
            showZoom: true,
            visualizePitch: false
        }), 'top-right');
        
        // Add fullscreen control
        this.map.addControl(new mapboxgl.FullscreenControl(), 'top-right');
    }
    
    /**
     * Apply custom styling to the map
     */
    applyCustomStyling() {
        try {
            // Wait for style to be fully loaded before applying custom styling
            if (!this.map.isStyleLoaded()) {
                console.log('Style not yet loaded, skipping custom styling');
                return;
            }
            
            // Get available layers to avoid errors
            const layers = this.map.getStyle().layers || [];
            const layerIds = layers.map(layer => layer.id);
            
            console.log('Available map layers:', layerIds);
            
            // Only apply styling to layers that exist
            if (layerIds.includes('background')) {
                this.map.setPaintProperty('background', 'background-color', '#1a1a1a');
            }
            
            if (layerIds.includes('water')) {
                this.map.setPaintProperty('water', 'background-color', '#0f1419');
            }
            
            // Note: Road and label styling may not be available in all styles
            // The dark theme should already provide good contrast
            
            console.log('Custom styling applied successfully');
            
        } catch (error) {
            console.warn('Could not apply custom styling:', error.message);
            // Don't throw error - map will still work with default styling
        }
    }
    
    /**
     * Set map view for overview screenshot
     */
    async setOverviewView() {
        if (!this.isInitialized) {
            throw new Error('Map not initialized');
        }
        
        const { zoom, center } = MAP_CONFIG.overview;
        
        await this.map.flyTo({
            center: center,
            zoom: zoom,
            duration: 2000,
            essential: true
        });
        
        // Wait for animation to complete
        await new Promise(resolve => {
            this.map.once('moveend', resolve);
        });
        
        // Additional wait for tiles to load
        await new Promise(resolve => setTimeout(resolve, SCREENSHOT_CONFIG.tileLoadWait));
    }
    
    /**
     * Set map view for zoom screenshot
     */
    async setZoomView() {
        if (!this.isInitialized) {
            throw new Error('Map not initialized');
        }
        
        const aircraftMarker = this.markerManager.getAircraftMarker();
        if (!aircraftMarker) {
            throw new Error('Aircraft marker not found');
        }
        
        const aircraftCoords = aircraftMarker.data.coordinates;
        const { zoom } = MAP_CONFIG.zoom;
        
        // Calculate center to position aircraft in top third of frame
        const bounds = this.map.getBounds();
        const mapHeight = bounds.getNorth() - bounds.getSouth();
        const offset = mapHeight * 0.2; // Move center up by 20% of map height
        
        const center = [aircraftCoords[0], aircraftCoords[1] + offset];
        
        await this.map.flyTo({
            center: center,
            zoom: zoom,
            duration: 2000,
            essential: true
        });
        
        // Wait for animation to complete
        await new Promise(resolve => {
            this.map.once('moveend', resolve);
        });
        
        // Additional wait for tiles to load
        await new Promise(resolve => setTimeout(resolve, SCREENSHOT_CONFIG.tileLoadWait));
    }
    
    /**
     * Get current map state for debugging
     */
    getMapState() {
        if (!this.map) {
            return { error: 'Map not initialized' };
        }
        
        return {
            center: this.map.getCenter(),
            zoom: this.map.getZoom(),
            bounds: this.map.getBounds(),
            isStyleLoaded: this.map.isStyleLoaded(),
            isInitialized: this.isInitialized
        };
    }
    
    /**
     * Update aircraft position
     * @param {Array} coordinates - New aircraft coordinates
     */
    updateAircraftPosition(coordinates) {
        if (this.markerManager) {
            this.markerManager.updateAircraftPosition(coordinates);
        }
    }
    
    /**
     * Show/hide marker layers
     * @param {string} type - Marker type
     * @param {boolean} visible - Visibility state
     */
    setMarkerVisibility(type, visible) {
        if (this.markerManager) {
            this.markerManager.setLayerVisibility(type, visible);
        }
    }
    
    /**
     * Get marker coordinates for debugging
     */
    getMarkerCoordinates() {
        if (this.markerManager) {
            return this.markerManager.getMarkerCoordinates();
        }
        return {};
    }
    
    /**
     * Dispatch custom event
     * @param {string} eventName - Event name
     * @param {Object} detail - Event detail
     */
    dispatchEvent(eventName, detail = {}) {
        const event = new CustomEvent(eventName, {
            detail: { map: this, ...detail }
        });
        document.dispatchEvent(event);
    }
    
    /**
     * Clean up map resources
     */
    destroy() {
        if (this.map) {
            this.map.remove();
            this.map = null;
        }
        
        if (this.markerManager) {
            this.markerManager.removeAllMarkers();
            this.markerManager = null;
        }
        
        this.isInitialized = false;
    }
}

// Global map instance
let flightPathMap = null;

/**
 * Initialize the application
 */
async function initializeApp() {
    try {
        console.log('Initializing Flight Path Visualization...');
        
        // Create map instance
        flightPathMap = new FlightPathMap();
        
        // Initialize map
        await flightPathMap.initialize();
        
        console.log('Application initialized successfully');
        
    } catch (error) {
        console.error('Application initialization failed:', error);
        showError('Failed to initialize application');
    }
}

/**
 * Handle DOM content loaded
 */
document.addEventListener('DOMContentLoaded', () => {
    console.log('DOM loaded, initializing application...');
    initializeApp();
});

/**
 * Handle window load
 */
window.addEventListener('load', () => {
    console.log('Window loaded');
    hideLoading();
});

/**
 * Handle window resize
 */
window.addEventListener('resize', debounce(() => {
    if (flightPathMap && flightPathMap.map) {
        flightPathMap.map.resize();
    }
}, 250));

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        FlightPathMap,
        initializeApp,
        flightPathMap
    };
} 