/**
 * Puppeteer automation for generating Mapbox Flight Path screenshots
 * Creates overview and zoom screenshots with proper timing and positioning
 */

const puppeteer = require('puppeteer');
const path = require('path');
const fs = require('fs').promises;

// Import configuration (simplified for Node.js environment)
const MAPBOX_ACCESS_TOKEN = process.env.MAPBOX_ACCESS_TOKEN || 'YOUR_MAPBOX_ACCESS_TOKEN_HERE';
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
            
            this.browser = await puppeteer.launch({
                headless: 'new',
                args: [
                    '--no-sandbox',
                    '--disable-setuid-sandbox',
                    '--disable-dev-shm-usage',
                    '--disable-accelerated-2d-canvas',
                    '--no-first-run',
                    '--no-zygote',
                    '--disable-gpu'
                ]
            });
            
            this.page = await this.browser.newPage();
            
            // Set viewport for portrait orientation (1080x1920)
            await this.page.setViewport({
                width: 1080,
                height: 1920,
                deviceScaleFactor: 1
            });
            
            // Set user agent
            await this.page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');
            
            console.log('Puppeteer browser initialized successfully');
            
        } catch (error) {
            console.error('Failed to initialize Puppeteer:', error);
            throw error;
        }
    }
    
    /**
     * Navigate to the map page
     */
    async navigateToMap() {
        try {
            console.log('Navigating to map page...');
            
            // Get the absolute path to the HTML file
            const htmlPath = path.join(__dirname, '../src/index.html');
            const fileUrl = `file://${htmlPath}`;
            
            await this.page.goto(fileUrl, {
                waitUntil: 'networkidle0',
                timeout: 30000
            });
            
            // Wait for map to be ready
            await this.waitForMapReady();
            
            console.log('Successfully navigated to map page');
            
        } catch (error) {
            console.error('Failed to navigate to map page:', error);
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
            await this.page.waitForSelector('#map', { timeout: 10000 });
            
            // Wait for map to be initialized (custom event)
            await this.page.evaluate(() => {
                return new Promise((resolve) => {
                    if (window.flightPathMap && window.flightPathMap.isInitialized) {
                        resolve();
                    } else {
                        document.addEventListener('mapReady', resolve, { once: true });
                    }
                });
            });
            
            // Additional wait for tiles to load
            await this.page.waitForTimeout(SCREENSHOT_CONFIG.tileLoadWait);
            
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
            
            // Set overview view
            await this.page.evaluate(() => {
                return window.flightPathMap.setOverviewView();
            });
            
            // Wait for animation and tiles to load
            await this.page.waitForTimeout(SCREENSHOT_CONFIG.animationWait + SCREENSHOT_CONFIG.tileLoadWait);
            
            // Ensure screenshot directory exists
            await this.ensureScreenshotDirectory();
            
            // Capture screenshot
            const screenshotPath = path.join(this.screenshotDir, 'overview.png');
            await this.page.screenshot({
                path: screenshotPath,
                fullPage: false,
                type: 'png',
                quality: 100
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
            
            // Set zoom view
            await this.page.evaluate(() => {
                return window.flightPathMap.setZoomView();
            });
            
            // Wait for animation and tiles to load
            await this.page.waitForTimeout(SCREENSHOT_CONFIG.animationWait + SCREENSHOT_CONFIG.tileLoadWait);
            
            // Ensure screenshot directory exists
            await this.ensureScreenshotDirectory();
            
            // Capture screenshot
            const screenshotPath = path.join(this.screenshotDir, 'zoom.png');
            await this.page.screenshot({
                path: screenshotPath,
                fullPage: false,
                type: 'png',
                quality: 100
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