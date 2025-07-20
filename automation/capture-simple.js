const puppeteer = require('puppeteer');
const path = require('path');
const fs = require('fs').promises;

// Configuration
const SCREENSHOT_CONFIG = {
    tileLoadWait: 5000, // 5 seconds after page load
    animationWait: 2000, // 2 seconds for animations
    maxRetries: 3,
    retryDelay: 2000,
};

class SimpleScreenshotCapture {
    constructor() {
        this.browser = null;
        this.page = null;
        this.screenshotDir = path.join(__dirname, '..', 'src', 'screenshots');
    }

    async initialize() {
        try {
            console.log('Launching Puppeteer browser...');
            
            this.browser = await puppeteer.launch({
                headless: true,
                args: [
                    '--no-sandbox',
                    '--disable-setuid-sandbox',
                    '--disable-dev-shm-usage',
                    '--disable-accelerated-2d-canvas',
                    '--no-first-run',
                    '--no-zygote',
                    '--disable-gpu',
                    '--disable-web-security',
                    '--disable-features=VizDisplayCompositor',
                    '--enable-webgl',
                    '--enable-webgl2',
                    '--ignore-gpu-blacklist',
                    '--ignore-gpu-blocklist',
                    '--enable-unsafe-webgpu',
                    '--use-gl=swiftshader',
                    '--use-angle=swiftshader'
                ]
            });

            this.page = await this.browser.newPage();
            
            // Set viewport for portrait orientation
            await this.page.setViewport({
                width: 1080,
                height: 1920,
                deviceScaleFactor: 1
            });

            // Set user agent
            await this.page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');

            // Inject WebGL context for headless browser
            await this.page.evaluateOnNewDocument(() => {
                // Mock WebGL context for headless browsers
                const getParameter = WebGLRenderingContext.prototype.getParameter;
                WebGLRenderingContext.prototype.getParameter = function(parameter) {
                    // UNMASKED_VENDOR_WEBGL
                    if (parameter === 37445) {
                        return 'Intel Inc.';
                    }
                    // UNMASKED_RENDERER_WEBGL
                    if (parameter === 37446) {
                        return 'Intel Iris OpenGL Engine';
                    }
                    return getParameter.apply(this, arguments);
                };
            });

            console.log('Puppeteer browser initialized successfully');
            
        } catch (error) {
            console.error('Failed to initialize Puppeteer:', error);
            throw error;
        }
    }

    async navigateToMap() {
        try {
            console.log('Navigating to map page...');
            
            // Navigate to the development server
            await this.page.goto('http://localhost:3000', {
                waitUntil: 'networkidle2',
                timeout: 30000
            });

            console.log('Page loaded successfully');
            
            // Wait for the page to be fully loaded
            await new Promise(resolve => setTimeout(resolve, SCREENSHOT_CONFIG.tileLoadWait));
            
        } catch (error) {
            console.error('Failed to navigate to map page:', error);
            throw error;
        }
    }

    async captureOverview() {
        try {
            console.log('Capturing overview screenshot...');
            
            // Simple approach: just wait and take screenshot
            await new Promise(resolve => setTimeout(resolve, SCREENSHOT_CONFIG.animationWait));
            
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

    async captureZoom() {
        try {
            console.log('Capturing zoom screenshot...');
            
            // Simple approach: just wait and take screenshot
            await new Promise(resolve => setTimeout(resolve, SCREENSHOT_CONFIG.animationWait));
            
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

    async ensureScreenshotDirectory() {
        try {
            await fs.access(this.screenshotDir);
        } catch (error) {
            console.log('Creating screenshot directory...');
            await fs.mkdir(this.screenshotDir, { recursive: true });
        }
    }

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
                await this.captureOverview();
                
                // Capture zoom screenshot
                await this.captureZoom();
                
                console.log('\n✅ All screenshots captured successfully!');
                return true;
                
            } catch (error) {
                console.error(`\nScreenshot capture attempt ${retries + 1} failed:`, error.message);
                retries++;
                
                if (retries < SCREENSHOT_CONFIG.maxRetries) {
                    console.log(`Retrying in ${SCREENSHOT_CONFIG.retryDelay}ms...`);
                    await this.cleanup();
                    await new Promise(resolve => setTimeout(resolve, SCREENSHOT_CONFIG.retryDelay));
                }
            }
        }
        
        throw new Error('All screenshot capture attempts failed');
    }

    async cleanup() {
        try {
            if (this.browser) {
                await this.browser.close();
                console.log('Puppeteer resources cleaned up');
            }
        } catch (error) {
            console.error('Error during cleanup:', error);
        }
    }
}

async function main() {
    console.log('Starting simplified Mapbox Flight Path screenshot capture...');
    console.log('Make sure you have a valid Mapbox access token configured.\n');
    
    const capture = new SimpleScreenshotCapture();
    
    try {
        await capture.captureAllScreenshots();
        console.log('\n🎉 Screenshot capture completed successfully!');
        console.log('Check the src/screenshots/ directory for the generated images.');
        
    } catch (error) {
        console.error('\n❌ Screenshot capture failed:', error.message);
        process.exit(1);
        
    } finally {
        await capture.cleanup();
    }
}

// Run the script
if (require.main === module) {
    main().catch(console.error);
}

module.exports = SimpleScreenshotCapture; 