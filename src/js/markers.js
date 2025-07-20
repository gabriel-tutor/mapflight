/**
 * Marker management system for Mapbox Flight Path Visualization
 * Handles creation, styling, and layer management for different marker types
 */

class MarkerManager {
    constructor(map) {
        this.map = map;
        this.markers = new Map();
        this.layers = new Map();
        this.sources = new Map();
        
        // Initialize marker data
        this.initializeMarkerData();
    }
    
    /**
     * Initialize marker data with coordinates and metadata
     */
    initializeMarkerData() {
        // Calculate aircraft position (2.5 minutes from CVG)
        const aircraftPosition = calculateAircraftPosition(
            COORDINATES.CVG,
            COORDINATES.MCO,
            FLIGHT_CONFIG.aircraftTimeFromCVG,
            FLIGHT_CONFIG.totalFlightTime
        );
        
        // Define POI locations (strategic points between CVG and MCO)
        const poi1 = calculateIntermediatePoint(COORDINATES.CVG, COORDINATES.MCO, 0.3);
        const poi2 = calculateIntermediatePoint(COORDINATES.CVG, COORDINATES.MCO, 0.7);
        
        // Define story marker locations (narrative-relevant points)
        const story1 = calculateIntermediatePoint(COORDINATES.CVG, COORDINATES.MCO, 0.2);
        const story2 = calculateIntermediatePoint(COORDINATES.CVG, COORDINATES.MCO, 0.8);
        
        this.markerData = {
            cities: [
                {
                    id: 'cvg',
                    coordinates: COORDINATES.CVG,
                    name: 'CVG - Cincinnati/Northern Kentucky International Airport',
                    type: 'CITIES',
                    description: 'Departure airport'
                },
                {
                    id: 'mco',
                    coordinates: COORDINATES.MCO,
                    name: 'MCO - Orlando International Airport',
                    type: 'CITIES',
                    description: 'Destination airport'
                }
            ],
            poi: [
                {
                    id: 'poi-1',
                    coordinates: poi1,
                    name: 'Point of Interest 1',
                    type: 'POI',
                    description: 'Strategic location along flight path'
                },
                {
                    id: 'poi-2',
                    coordinates: poi2,
                    name: 'Point of Interest 2',
                    type: 'POI',
                    description: 'Strategic location along flight path'
                }
            ],
            story: [
                {
                    id: 'story-1',
                    coordinates: story1,
                    name: 'Story Point 1',
                    type: 'STORY',
                    description: 'Narrative-relevant location'
                },
                {
                    id: 'story-2',
                    coordinates: story2,
                    name: 'Story Point 2',
                    type: 'STORY',
                    description: 'Narrative-relevant location'
                }
            ],
            aircraft: [
                {
                    id: 'aircraft',
                    coordinates: aircraftPosition,
                    name: 'Aircraft Position',
                    type: 'AIRCRAFT',
                    description: `Aircraft at ${formatCoordinates(aircraftPosition)}`
                }
            ]
        };
    }
    
    /**
     * Create and add all markers to the map
     */
    async createAllMarkers() {
        try {
            // Wait for map to be ready
            if (!this.map.isStyleLoaded()) {
                await new Promise(resolve => {
                    this.map.on('style.load', resolve);
                });
            }
            
            // Create markers in priority order (AIRCRAFT first, then CITIES, POI, STORY)
            const priorityOrder = ['AIRCRAFT', 'CITIES', 'POI', 'STORY'];
            
            for (const type of priorityOrder) {
                const markers = this.getMarkersByType(type);
                for (const marker of markers) {
                    await this.createMarker(marker);
                }
            }
            
            // Create flight path line
            this.createFlightPath();
            
            console.log('All markers created successfully');
        } catch (error) {
            console.error('Error creating markers:', error);
            showError('Failed to create map markers');
        }
    }
    
    /**
     * Get markers by type
     * @param {string} type - Marker type
     * @returns {Array} Array of markers of specified type
     */
    getMarkersByType(type) {
        const typeKey = type.toLowerCase();
        return this.markerData[typeKey] || [];
    }
    
    /**
     * Create a single marker
     * @param {Object} markerData - Marker data object
     */
    async createMarker(markerData) {
        const { id, coordinates, name, type, description } = markerData;
        
        // Create marker element
        const markerElement = this.createMarkerElement(type, name);
        
        // Create Mapbox marker
        const marker = new mapboxgl.Marker({
            element: markerElement,
            anchor: 'center'
        })
        .setLngLat(coordinates)
        .addTo(this.map);
        
        // Add popup
        const popup = new mapboxgl.Popup({
            closeButton: true,
            closeOnClick: false,
            maxWidth: '300px'
        }).setHTML(`
            <div class="marker-popup">
                <h4>${name}</h4>
                <p>${description}</p>
                <p><strong>Coordinates:</strong> ${formatCoordinates(coordinates)}</p>
            </div>
        `);
        
        marker.setPopup(popup);
        
        // Store marker reference
        this.markers.set(id, { marker, popup, data: markerData });
        
        // Add to appropriate layer for z-index management
        this.addToLayer(marker, type);
    }
    
    /**
     * Create marker DOM element
     * @param {string} type - Marker type
     * @param {string} name - Marker name
     * @returns {HTMLElement} Marker element
     */
    createMarkerElement(type, name) {
        const element = document.createElement('div');
        element.className = `marker ${type.toLowerCase()}`;
        element.setAttribute('data-marker-type', type);
        element.setAttribute('aria-label', name);
        
        // Add label
        const label = document.createElement('div');
        label.className = 'marker-label';
        label.textContent = name;
        element.appendChild(label);
        
        // Special handling for aircraft marker
        if (type === 'AIRCRAFT') {
            element.innerHTML = `
                <div class="aircraft-icon">✈</div>
                <div class="marker-label">${name}</div>
            `;
        }
        
        return element;
    }
    
    /**
     * Add marker to appropriate layer for z-index management
     * @param {Object} marker - Mapbox marker object
     * @param {string} type - Marker type
     */
    addToLayer(marker, type) {
        const layerId = MARKER_TYPES[type].layer;
        
        if (!this.layers.has(layerId)) {
            this.layers.set(layerId, []);
        }
        
        this.layers.get(layerId).push(marker);
    }
    
    /**
     * Create flight path line between CVG and MCO
     */
    createFlightPath() {
        // Create flight path source
        const flightPathData = {
            type: 'Feature',
            properties: {},
            geometry: {
                type: 'LineString',
                coordinates: [COORDINATES.CVG, COORDINATES.MCO]
            }
        };
        
        // Add source to map
        this.map.addSource('flight-path', {
            type: 'geojson',
            data: flightPathData
        });
        
        // Add flight path layer
        this.map.addLayer({
            id: 'flight-path-layer',
            type: 'line',
            source: 'flight-path',
            layout: {
                'line-join': 'round',
                'line-cap': 'round'
            },
            paint: {
                'line-color': 'rgba(255, 255, 255, 0.3)',
                'line-width': 2,
                'line-dasharray': [5, 5]
            }
        });
        
        this.sources.set('flight-path', flightPathData);
    }
    
    /**
     * Get marker by ID
     * @param {string} id - Marker ID
     * @returns {Object|null} Marker object or null
     */
    getMarker(id) {
        return this.markers.get(id) || null;
    }
    
    /**
     * Get aircraft marker
     * @returns {Object|null} Aircraft marker object or null
     */
    getAircraftMarker() {
        return this.getMarker('aircraft');
    }
    
    /**
     * Update aircraft position
     * @param {Array} newCoordinates - New aircraft coordinates
     */
    updateAircraftPosition(newCoordinates) {
        const aircraftMarker = this.getAircraftMarker();
        if (aircraftMarker) {
            aircraftMarker.marker.setLngLat(newCoordinates);
            
            // Update marker data
            aircraftMarker.data.coordinates = newCoordinates;
            aircraftMarker.data.description = `Aircraft at ${formatCoordinates(newCoordinates)}`;
            
            // Update popup content
            const popup = aircraftMarker.popup;
            if (popup) {
                popup.setHTML(`
                    <div class="marker-popup">
                        <h4>${aircraftMarker.data.name}</h4>
                        <p>${aircraftMarker.data.description}</p>
                        <p><strong>Coordinates:</strong> ${formatCoordinates(newCoordinates)}</p>
                    </div>
                `);
            }
        }
    }
    
    /**
     * Show/hide marker layers
     * @param {string} type - Marker type
     * @param {boolean} visible - Visibility state
     */
    setLayerVisibility(type, visible) {
        const layerId = MARKER_TYPES[type].layer;
        const markers = this.layers.get(layerId) || [];
        
        markers.forEach(marker => {
            const element = marker.getElement();
            if (element) {
                element.style.display = visible ? 'block' : 'none';
            }
        });
    }
    
    /**
     * Remove all markers
     */
    removeAllMarkers() {
        this.markers.forEach(({ marker }) => {
            marker.remove();
        });
        
        this.markers.clear();
        this.layers.clear();
        this.sources.clear();
    }
    
    /**
     * Get all marker coordinates for debugging
     * @returns {Object} Object with marker coordinates by type
     */
    getMarkerCoordinates() {
        const coordinates = {};
        
        Object.keys(this.markerData).forEach(type => {
            coordinates[type] = this.markerData[type].map(marker => ({
                id: marker.id,
                coordinates: marker.coordinates,
                name: marker.name
            }));
        });
        
        return coordinates;
    }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = MarkerManager;
} 