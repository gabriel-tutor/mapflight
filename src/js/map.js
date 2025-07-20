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
            
            // Wait for mapboxgl to be fully loaded
            if (typeof mapboxgl === 'undefined') {
                throw new Error('Mapbox GL JS not loaded. Please check your internet connection.');
            }
            
            // Create map instance with WebGL fallback and headless browser support
            this.map = new mapboxgl.Map({
                container: 'map',
                style: MAP_CONFIG.style,
                center: MAP_CONFIG.defaultCenter,
                zoom: MAP_CONFIG.defaultZoom,
                attributionControl: false,
                preserveDrawingBuffer: true, // Required for screenshots
                antialias: false, // Disable antialiasing for better headless compatibility
                failIfMajorPerformanceCaveat: false, // Allow software rendering
                localIdeographFontFamily: "'Noto Sans', 'Noto Sans CJK SC', sans-serif",
                // Additional options for headless browser compatibility
                interactive: false, // Disable interactions for screenshots
                trackResize: false, // Disable resize tracking
                renderWorldCopies: false, // Disable world copies for better performance
                // WebGL compatibility options
                maxZoom: 22,
                minZoom: 0,
                maxPitch: 85,
                maxBounds: null,
                // Force software rendering for headless environments
                transformRequest: (url, resourceType) => {
                    if (resourceType === 'Tile') {
                        return { url: url };
                    }
                    return { url: url };
                }
            });
            
            // Verify map was created successfully
            if (!this.map || typeof this.map.on !== 'function') {
                throw new Error('Failed to create map instance. Mapbox GL JS may not be properly loaded.');
            }
            
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
        
        // Try to create a fallback visualization
        this.createFallbackVisualization();
        
        showError('Map loading failed. Using fallback visualization.');
        hideLoading();
    }

    /**
     * Create fallback visualization when WebGL fails
     */
    createFallbackVisualization() {
        try {
            const mapContainer = document.getElementById('map');
            if (!mapContainer) return;

            // Create a simple fallback visualization
            mapContainer.innerHTML = `
                <div style="
                    width: 100%;
                    height: 100%;
                    background: linear-gradient(135deg, #1a1a1a 0%, #2d2d2d 100%);
                    display: flex;
                    flex-direction: column;
                    justify-content: center;
                    align-items: center;
                    color: white;
                    font-family: Arial, sans-serif;
                    position: relative;
                ">
                    <div style="
                        position: absolute;
                        top: 20%;
                        left: 20%;
                        width: 60%;
                        height: 60%;
                        border: 2px solid #3B82F6;
                        border-radius: 10px;
                        background: rgba(59, 130, 246, 0.1);
                        display: flex;
                        flex-direction: column;
                        justify-content: center;
                        align-items: center;
                    ">
                        <div style="font-size: 24px; margin-bottom: 10px;">✈️ Flight Path</div>
                        <div style="font-size: 16px; text-align: center;">
                            CVG → MCO<br>
                            <span style="color: #10B981;">●</span> POI Markers<br>
                            <span style="color: #8B5CF6;">●</span> Story Markers<br>
                            <span style="color: #FFFFFF;">●</span> Aircraft Position
                        </div>
                    </div>
                    <div style="
                        position: absolute;
                        bottom: 20px;
                        right: 20px;
                        font-size: 12px;
                        opacity: 0.7;
                    ">
                        Fallback Mode
                    </div>
                </div>
            `;
            
            console.log('Fallback visualization created');
            
        } catch (error) {
            console.error('Failed to create fallback visualization:', error);
        }
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
        try {
            console.log('Setting overview view...');
            
            if (!this.isInitialized) {
                throw new Error('Map not initialized');
            }
            
            const { zoom, center } = MAP_CONFIG.overview;
            console.log('Overview view config:', { zoom, center });
            
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
            
            console.log('Overview view set successfully');
            
        } catch (error) {
            console.error('Error setting overview view:', error);
            throw error;
        }
    }
    
    /**
     * Set map view for zoom screenshot
     */
    async setZoomView() {
        try {
            console.log('Setting zoom view...');
            
            if (!this.isInitialized) {
                throw new Error('Map not initialized');
            }
            
            const aircraftMarker = this.markerManager.getAircraftMarker();
            if (!aircraftMarker) {
                throw new Error('Aircraft marker not found');
            }
            
            const aircraftCoords = aircraftMarker.data.coordinates;
            const { zoom } = MAP_CONFIG.zoom;
            
            console.log('Aircraft coordinates:', aircraftCoords);
            console.log('Zoom level:', zoom);
            
            // Calculate center to position aircraft in top third of frame
            const bounds = this.map.getBounds();
            const mapHeight = bounds.getNorth() - bounds.getSouth();
            const offset = mapHeight * 0.2; // Move center up by 20% of map height
            
            const center = [aircraftCoords[0], aircraftCoords[1] + offset];
            console.log('Calculated center:', center);
            
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
            
            console.log('Zoom view set successfully');
            
        } catch (error) {
            console.error('Error setting zoom view:', error);
            throw error;
        }
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
        
        // Expose to window for Puppeteer access
        window.flightPathMap = flightPathMap;
        
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