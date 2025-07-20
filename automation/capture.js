/**
 * Puppeteer automation for generating Mapbox Flight Path screenshots
 * Creates overview and zoom screenshots with proper timing and positioning
 */

const puppeteer = require('puppeteer');
const path = require('path');
const fs = require('fs').promises;

// Import configuration (simplified for Node.js environment)
const MAPBOX_ACCESS_TOKEN = process.env.MAPBOX_ACCESS_TOKEN || 'pk.eyJ1IjoiZ2FiY29kZXIiLCJhIjoiY21kYzNkM3RnMHh0cTJzcHk2djRpcDF4MyJ9.wr3fXFpQXYIKlwEkMfikXA';
const SCREENSHOT_CONFIG = {
    tileLoadWait: 2000,
    animationWait: 1000,
    maxRetries: 3,
    retryDelay: 1000
};

class ScreenshotCapture {
    constructor() {
        this.browser = null;
        this.page = null;
        this.screenshotDir = path.join(__dirname, '../src/screenshots');
    }
    
    /**
     * Initialize Puppeteer browser
     */
    async initialize() {
        try {
            console.log('Launching Puppeteer browser...');
            
            // Check if Puppeteer is available
            if (!puppeteer) {
                throw new Error('Puppeteer is not available');
            }
            
            console.log('Puppeteer version:', puppeteer.version);
            
            this.browser = await puppeteer.launch({
                headless: process.env.HEADLESS !== 'false', // Allow headless mode via environment variable
                protocolTimeout: 60000, // Increase timeout to 60 seconds
                args: [
                    '--no-sandbox',
                    '--disable-setuid-sandbox',
                    '--disable-dev-shm-usage',
                    '--no-first-run',
                    '--no-zygote',
                    '--disable-web-security',
                    '--disable-features=VizDisplayCompositor',
                    '--disable-features=HttpsFirstBalancedModeAutoEnable',
                    '--disable-extensions',
                    '--disable-background-timer-throttling',
                    '--disable-backgrounding-occluded-windows',
                    '--disable-renderer-backgrounding',
                    // WebGL support
                    '--enable-webgl',
                    '--enable-webgl-draft-extensions',
                    '--enable-webgl-image-chromium',
                    '--enable-gpu-rasterization',
                    '--enable-oop-rasterization',
                    '--enable-accelerated-2d-canvas',
                    '--enable-accelerated-video-decode',
                    '--enable-accelerated-video-encode',
                    '--ignore-gpu-blocklist',
                    '--use-gl=desktop',
                    '--use-angle=gl'
                ]
            });
            
            console.log('Browser launched successfully');
            
            this.page = await this.browser.newPage();
            console.log('New page created');
            
            // Set viewport for portrait orientation (1080x1920)
            await this.page.setViewport({
                width: 1080,
                height: 1920,
                deviceScaleFactor: 1
            });
            console.log('Viewport set');
            
            // Set user agent
            await this.page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');
            console.log('User agent set');
            
            // Check WebGL support
            const webglSupport = await this.page.evaluate(() => {
                try {
                    const canvas = document.createElement('canvas');
                    const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
                    return {
                        supported: !!gl,
                        vendor: gl ? gl.getParameter(gl.VENDOR) : 'Not supported',
                        renderer: gl ? gl.getParameter(gl.RENDERER) : 'Not supported'
                    };
                } catch (error) {
                    return { supported: false, error: error.message };
                }
            });
            
            console.log('WebGL support:', webglSupport);
            
            // If WebGL is not supported, inject software rendering fallback
            if (!webglSupport.supported) {
                console.log('WebGL not supported, injecting software rendering fallback...');
                await this.page.evaluate(() => {
                    // Override WebGL context creation to use software rendering
                    const originalGetContext = HTMLCanvasElement.prototype.getContext;
                    HTMLCanvasElement.prototype.getContext = function(contextType, contextAttributes) {
                        if (contextType === 'webgl' || contextType === 'experimental-webgl') {
                            // Force software rendering
                            contextAttributes = contextAttributes || {};
                            contextAttributes.powerPreference = 'default';
                            contextAttributes.failIfMajorPerformanceCaveat = false;
                            contextAttributes.antialias = false;
                        }
                        return originalGetContext.call(this, contextType, contextAttributes);
                    };
                });
            }
            
            console.log('Puppeteer browser initialized successfully');
            
        } catch (error) {
            console.error('Failed to initialize Puppeteer:', error);
            console.error('Error details:', error.message);
            console.error('Stack trace:', error.stack);
            throw error;
        }
    }
    
    /**
     * Navigate to the map page
     */
    async navigateToMap() {
        try {
            console.log('Navigating to map page...');
            
            // Use the development server URL
            const serverUrl = 'http://10.163.67.169:3000/';
            
            console.log('Server URL:', serverUrl);
            
            // Inject Mapbox GL JS fallback before navigation
            await this.page.evaluateOnNewDocument(() => {
                // Override Mapbox GL JS initialization to handle WebGL failures gracefully
                window.mapboxglFallback = {
                    originalMap: null,
                    init: function() {
                        if (window.mapboxgl) {
                            this.originalMap = window.mapboxgl.Map;
                            window.mapboxgl.Map = function(options) {
                                try {
                                    // Force software rendering options
                                    options.failIfMajorPerformanceCaveat = false;
                                    options.preserveDrawingBuffer = true;
                                    options.antialias = false;
                                    
                                    return new this.originalMap(options);
                                } catch (error) {
                                    console.warn('Mapbox GL JS initialization failed, using fallback:', error);
                                    // Create a simple div-based fallback
                                    const container = document.getElementById(options.container);
                                    if (container) {
                                        container.innerHTML = '<div style="background: #1a1a1a; color: white; padding: 20px; text-align: center; height: 100%; display: flex; align-items: center; justify-content: center;"><div><h3>Map Loading...</h3><p>WebGL not available in this environment</p></div></div>';
                                    }
                                    return null;
                                }
                            };
                        }
                    }
                };
                
                // Initialize fallback when DOM is ready
                if (document.readyState === 'loading') {
                    document.addEventListener('DOMContentLoaded', () => window.mapboxglFallback.init());
                } else {
                    window.mapboxglFallback.init();
                }
            });
            
            console.log('Navigating to development server...');
            
            await this.page.goto(serverUrl, {
                waitUntil: 'networkidle0',
                timeout: 30000
            });
            
            console.log('Page loaded, waiting for map to be ready...');
            
            // Wait for map to be ready
            await this.waitForMapReady();
            
            console.log('Successfully navigated to map page');
            
        } catch (error) {
            console.error('Failed to navigate to map page:', error);
            console.error('Error details:', error.message);
            throw error;
        }
    }
    
    /**
     * Wait for map to be fully loaded and ready
     */
    async waitForMapReady() {
        try {
            console.log('Waiting for map to be ready...');
            
            // Wait for map container to exist
            await this.page.waitForSelector('#map', { timeout: 30000 });
            
            // Simple wait for map to be ready
            await this.page.evaluate(() => {
                return new Promise((resolve, reject) => {
                    const timeout = setTimeout(() => {
                        reject(new Error('Map initialization timeout - waited 30 seconds'));
                    }, 30000);
                    
                    const checkMap = () => {
                        // Check multiple conditions for map readiness
                        const mapContainer = document.getElementById('map');
                        const hasMapboxGL = typeof mapboxgl !== 'undefined';
                        const hasFlightPathMap = window.flightPathMap && window.flightPathMap.isInitialized;
                        const hasMapInstance = window.flightPathMap && window.flightPathMap.map && typeof window.flightPathMap.map.on === 'function';
                        const hasMapContent = mapContainer && mapContainer.children.length > 0;
                        
                        console.log('Map readiness check:', {
                            hasMapContainer: !!mapContainer,
                            hasMapboxGL,
                            hasFlightPathMap,
                            hasMapInstance,
                            hasMapContent,
                            childrenCount: mapContainer ? mapContainer.children.length : 0
                        });
                        
                        if (mapContainer && hasMapboxGL && hasFlightPathMap && hasMapInstance && hasMapContent) {
                            clearTimeout(timeout);
                            resolve();
                        } else {
                            // Check again in 1000ms
                            setTimeout(checkMap, 1000);
                        }
                    };
                    
                    // Start checking
                    checkMap();
                });
            });
            
            // Additional wait for tiles to load
            await new Promise(resolve => setTimeout(resolve, SCREENSHOT_CONFIG.tileLoadWait));
            
            console.log('Map is ready for screenshots');
            
        } catch (error) {
            console.error('Failed to wait for map ready:', error);
            throw error;
        }
    }
    
    /**
     * Capture overview screenshot
     */
    async captureOverview() {
        try {
            console.log('Capturing overview screenshot...');
            
            // Set overview view using direct mapbox commands instead of custom methods
            await this.page.evaluate(() => {
                return new Promise((resolve, reject) => {
                    try {
                        console.log('Setting overview view directly...');
                        
                        // Use our FlightPathMap instance if available
                        if (window.flightPathMap && window.flightPathMap.map && window.flightPathMap.map.flyTo) {
                            window.flightPathMap.map.flyTo({
                                center: [-82.9274, 33.7385], // Midpoint between CVG and MCO
                                zoom: 5,
                                duration: 2000,
                                essential: true
                            });
                            
                            // Wait for animation to complete
                            window.flightPathMap.map.once('moveend', () => {
                                setTimeout(resolve, 1000); // Additional wait for tiles
                            });
                        } else {
                            // Fallback: just wait and take screenshot
                            console.log('FlightPathMap not available, using fallback');
                            setTimeout(resolve, 3000);
                        }
                    } catch (error) {
                        console.log('Error in overview view setup:', error);
                        // Continue anyway
                        setTimeout(resolve, 3000);
                    }
                });
            });
            
            // Wait for animation and tiles to load
            await new Promise(resolve => setTimeout(resolve, SCREENSHOT_CONFIG.animationWait + SCREENSHOT_CONFIG.tileLoadWait));
            
            // Ensure screenshot directory exists
            await this.ensureScreenshotDirectory();
            
            // Capture screenshot
            const screenshotPath = path.join(this.screenshotDir, 'overview.png');
            await this.page.screenshot({
                path: screenshotPath,
                fullPage: false,
                type: 'png'
            });
            
            console.log(`Overview screenshot saved to: ${screenshotPath}`);
            return screenshotPath;
            
        } catch (error) {
            console.error('Failed to capture overview screenshot:', error);
            throw error;
        }
    }
    
    /**
     * Capture zoom screenshot
     */
    async captureZoom() {
        try {
            console.log('Capturing zoom screenshot...');
            
            // Set zoom view using direct mapbox commands
            await this.page.evaluate(() => {
                return new Promise((resolve, reject) => {
                    try {
                        console.log('Setting zoom view directly...');
                        
                        // Use our FlightPathMap instance if available
                        if (window.flightPathMap && window.flightPathMap.map && window.flightPathMap.map.flyTo) {
                            // Calculate aircraft position (2.5 minutes from CVG)
                            const cvg = [-84.6627, 39.0458];
                            const mco = [-81.3792, 28.4312];
                            const fraction = 2.5 / 120; // 2.5 minutes out of 120 minutes total flight
                            
                            // Simple linear interpolation for aircraft position
                            const aircraftLon = cvg[0] + (mco[0] - cvg[0]) * fraction;
                            const aircraftLat = cvg[1] + (mco[1] - cvg[1]) * fraction;
                            
                            window.flightPathMap.map.flyTo({
                                center: [aircraftLon, aircraftLat + 0.5], // Offset to position in top third
                                zoom: 9,
                                duration: 2000,
                                essential: true
                            });
                            
                            // Wait for animation to complete
                            window.flightPathMap.map.once('moveend', () => {
                                setTimeout(resolve, 1000); // Additional wait for tiles
                            });
                        } else {
                            // Fallback: just wait and take screenshot
                            console.log('FlightPathMap not available, using fallback');
                            setTimeout(resolve, 3000);
                        }
                    } catch (error) {
                        console.log('Error in zoom view setup:', error);
                        // Continue anyway
                        setTimeout(resolve, 3000);
                    }
                });
            });
            
            // Wait for animation and tiles to load
            await new Promise(resolve => setTimeout(resolve, SCREENSHOT_CONFIG.animationWait + SCREENSHOT_CONFIG.tileLoadWait));
            
            // Ensure screenshot directory exists
            await this.ensureScreenshotDirectory();
            
            // Capture screenshot
            const screenshotPath = path.join(this.screenshotDir, 'zoom.png');
            await this.page.screenshot({
                path: screenshotPath,
                fullPage: false,
                type: 'png'
            });
            
            console.log(`Zoom screenshot saved to: ${screenshotPath}`);
            return screenshotPath;
            
        } catch (error) {
            console.error('Failed to capture zoom screenshot:', error);
            throw error;
        }
    }
    
    /**
     * Ensure screenshot directory exists
     */
    async ensureScreenshotDirectory() {
        try {
            await fs.access(this.screenshotDir);
        } catch (error) {
            console.log('Creating screenshot directory...');
            await fs.mkdir(this.screenshotDir, { recursive: true });
        }
    }
    
    /**
     * Capture both screenshots with retry logic
     */
    async captureAllScreenshots() {
        let retries = 0;
        
        while (retries < SCREENSHOT_CONFIG.maxRetries) {
            try {
                console.log(`\n=== Screenshot Capture Attempt ${retries + 1} ===`);
                
                // Initialize browser
                await this.initialize();
                
                // Navigate to map
                await this.navigateToMap();
                
                // Capture overview screenshot
                const overviewPath = await this.captureOverview();
                
                // Capture zoom screenshot
                const zoomPath = await this.captureZoom();
                
                console.log('\n=== Screenshot Capture Successful ===');
                console.log(`Overview: ${overviewPath}`);
                console.log(`Zoom: ${zoomPath}`);
                
                return {
                    overview: overviewPath,
                    zoom: zoomPath
                };
                
            } catch (error) {
                retries++;
                console.error(`\nScreenshot capture attempt ${retries} failed:`, error.message);
                
                if (retries < SCREENSHOT_CONFIG.maxRetries) {
                    console.log(`Retrying in ${SCREENSHOT_CONFIG.retryDelay}ms...`);
                    await this.cleanup();
                    await new Promise(resolve => setTimeout(resolve, SCREENSHOT_CONFIG.retryDelay));
                } else {
                    console.error('\nAll screenshot capture attempts failed');
                    throw error;
                }
            }
        }
    }
    
    /**
     * Get map state for debugging
     */
    async getMapState() {
        try {
            return await this.page.evaluate(() => {
                if (window.flightPathMap) {
                    return window.flightPathMap.getMapState();
                }
                return { error: 'Map not available' };
            });
        } catch (error) {
            console.error('Failed to get map state:', error);
            return { error: error.message };
        }
    }
    
    /**
     * Get marker coordinates for debugging
     */
    async getMarkerCoordinates() {
        try {
            return await this.page.evaluate(() => {
                if (window.flightPathMap) {
                    return window.flightPathMap.getMarkerCoordinates();
                }
                return { error: 'Map not available' };
            });
        } catch (error) {
            console.error('Failed to get marker coordinates:', error);
            return { error: error.message };
        }
    }
    
    /**
     * Clean up resources
     */
    async cleanup() {
        try {
            if (this.page) {
                await this.page.close();
                this.page = null;
            }
            
            if (this.browser) {
                await this.browser.close();
                this.browser = null;
            }
            
            console.log('Puppeteer resources cleaned up');
            
        } catch (error) {
            console.error('Error during cleanup:', error);
        }
    }
}

/**
 * Main function to run screenshot capture
 */
async function main() {
    const capture = new ScreenshotCapture();
    
    try {
        console.log('Starting Mapbox Flight Path screenshot capture...');
        console.log('Make sure you have a valid Mapbox access token configured.');
        
        // Check for Mapbox access token
        if (!MAPBOX_ACCESS_TOKEN || MAPBOX_ACCESS_TOKEN === 'YOUR_MAPBOX_ACCESS_TOKEN_HERE') {
            throw new Error('Mapbox access token not configured. Please set MAPBOX_ACCESS_TOKEN environment variable or update config.js');
        }
        
        // Capture screenshots
        const results = await capture.captureAllScreenshots();
        
        console.log('\n=== Screenshot Capture Complete ===');
        console.log('Files generated:');
        console.log(`  Overview: ${results.overview}`);
        console.log(`  Zoom: ${results.zoom}`);
        
    } catch (error) {
        console.error('\nScreenshot capture failed:', error.message);
        process.exit(1);
    } finally {
        await capture.cleanup();
    }
}

// Run if called directly
if (require.main === module) {
    main();
}

module.exports = ScreenshotCapture; 