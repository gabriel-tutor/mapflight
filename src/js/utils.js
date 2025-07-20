/**
 * Utility functions for Mapbox Flight Path Visualization
 * Contains mathematical calculations and helper functions
 */

/**
 * Convert degrees to radians
 * @param {number} degrees - Angle in degrees
 * @returns {number} Angle in radians
 */
function degreesToRadians(degrees) {
    return degrees * (Math.PI / 180);
}

/**
 * Convert radians to degrees
 * @param {number} radians - Angle in radians
 * @returns {number} Angle in degrees
 */
function radiansToDegrees(radians) {
    return radians * (180 / Math.PI);
}

/**
 * Calculate great circle distance between two points
 * @param {Array} point1 - [longitude, latitude] of first point
 * @param {Array} point2 - [longitude, latitude] of second point
 * @param {number} earthRadius - Earth radius in km (default: 6371)
 * @returns {number} Distance in kilometers
 */
function calculateGreatCircleDistance(point1, point2, earthRadius = 6371) {
    const [lon1, lat1] = point1;
    const [lon2, lat2] = point2;
    
    const dLat = degreesToRadians(lat2 - lat1);
    const dLon = degreesToRadians(lon2 - lon1);
    
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
              Math.cos(degreesToRadians(lat1)) * Math.cos(degreesToRadians(lat2)) *
              Math.sin(dLon / 2) * Math.sin(dLon / 2);
    
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    
    return earthRadius * c;
}

/**
 * Calculate intermediate point along great circle path
 * @param {Array} startPoint - [longitude, latitude] of start point
 * @param {Array} endPoint - [longitude, latitude] of end point
 * @param {number} fraction - Fraction along path (0 to 1)
 * @returns {Array} [longitude, latitude] of intermediate point
 */
function calculateIntermediatePoint(startPoint, endPoint, fraction) {
    const [lon1, lat1] = startPoint;
    const [lon2, lat2] = endPoint;
    
    // Convert to radians
    const lat1Rad = degreesToRadians(lat1);
    const lon1Rad = degreesToRadians(lon1);
    const lat2Rad = degreesToRadians(lat2);
    const lon2Rad = degreesToRadians(lon2);
    
    // Calculate great circle distance
    const d = 2 * Math.asin(Math.sqrt(
        Math.pow(Math.sin((lat2Rad - lat1Rad) / 2), 2) +
        Math.cos(lat1Rad) * Math.cos(lat2Rad) * Math.pow(Math.sin((lon2Rad - lon1Rad) / 2), 2)
    ));
    
    if (d === 0) return startPoint;
    
    // Calculate intermediate point
    const A = Math.sin((1 - fraction) * d) / Math.sin(d);
    const B = Math.sin(fraction * d) / Math.sin(d);
    
    const x = A * Math.cos(lat1Rad) * Math.cos(lon1Rad) + B * Math.cos(lat2Rad) * Math.cos(lon2Rad);
    const y = A * Math.cos(lat1Rad) * Math.sin(lon1Rad) + B * Math.cos(lat2Rad) * Math.sin(lon2Rad);
    const z = A * Math.sin(lat1Rad) + B * Math.sin(lat2Rad);
    
    const lat = Math.atan2(z, Math.sqrt(x * x + y * y));
    const lon = Math.atan2(y, x);
    
    return [radiansToDegrees(lon), radiansToDegrees(lat)];
}

/**
 * Calculate aircraft position based on flight time
 * @param {Array} startPoint - CVG coordinates
 * @param {Array} endPoint - MCO coordinates
 * @param {number} timeFromStart - Time from start in minutes
 * @param {number} totalFlightTime - Total flight time in minutes
 * @returns {Array} Aircraft coordinates [longitude, latitude]
 */
function calculateAircraftPosition(startPoint, endPoint, timeFromStart, totalFlightTime) {
    const fraction = timeFromStart / totalFlightTime;
    return calculateIntermediatePoint(startPoint, endPoint, fraction);
}

/**
 * Format coordinates for display
 * @param {Array} coordinates - [longitude, latitude]
 * @returns {string} Formatted coordinate string
 */
function formatCoordinates(coordinates) {
    const [lon, lat] = coordinates;
    return `${lat.toFixed(4)}°N, ${Math.abs(lon).toFixed(4)}°${lon < 0 ? 'W' : 'E'}`;
}

/**
 * Calculate distance between two points in nautical miles
 * @param {Array} point1 - [longitude, latitude] of first point
 * @param {Array} point2 - [longitude, latitude] of second point
 * @returns {number} Distance in nautical miles
 */
function calculateDistanceNauticalMiles(point1, point2) {
    const distanceKm = calculateGreatCircleDistance(point1, point2);
    return distanceKm * 0.539957; // Convert km to nautical miles
}

/**
 * Debounce function to limit function calls
 * @param {Function} func - Function to debounce
 * @param {number} wait - Wait time in milliseconds
 * @returns {Function} Debounced function
 */
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

/**
 * Show error message
 * @param {string} message - Error message to display
 */
function showError(message) {
    const errorElement = document.getElementById('error');
    const errorMessage = document.getElementById('error-message');
    
    if (errorElement && errorMessage) {
        errorMessage.textContent = message;
        errorElement.classList.remove('hidden');
    }
    
    console.error('Map Error:', message);
}

/**
 * Hide error message
 */
function hideError() {
    const errorElement = document.getElementById('error');
    if (errorElement) {
        errorElement.classList.add('hidden');
    }
}

/**
 * Show loading indicator
 */
function showLoading() {
    const loadingElement = document.getElementById('loading');
    if (loadingElement) {
        loadingElement.classList.remove('hidden');
    }
}

/**
 * Hide loading indicator
 */
function hideLoading() {
    const loadingElement = document.getElementById('loading');
    if (loadingElement) {
        loadingElement.classList.add('hidden');
    }
}

// Export functions for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        degreesToRadians,
        radiansToDegrees,
        calculateGreatCircleDistance,
        calculateIntermediatePoint,
        calculateAircraftPosition,
        formatCoordinates,
        calculateDistanceNauticalMiles,
        debounce,
        showError,
        hideError,
        showLoading,
        hideLoading
    };
} 