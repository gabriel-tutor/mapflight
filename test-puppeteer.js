/**
 * Simple Puppeteer test script
 * This will help us verify that Puppeteer is working correctly
 */

const puppeteer = require('puppeteer');
const path = require('path');

async function testPuppeteer() {
    let browser = null;
    
    try {
        console.log('=== Puppeteer Test ===');
        console.log('Puppeteer version:', puppeteer.version);
        
        // Launch browser
        console.log('Launching browser...');
        browser = await puppeteer.launch({
            headless: false,
            args: ['--no-sandbox', '--disable-setuid-sandbox']
        });
        
        console.log('Browser launched successfully');
        
        // Create page
        const page = await browser.newPage();
        console.log('Page created');
        
        // Navigate to a simple page
        console.log('Navigating to a test page...');
        await page.goto('https://example.com', { timeout: 10000 });
        
        console.log('Page loaded successfully');
        
        // Take a screenshot
        const screenshotPath = path.join(__dirname, 'test-screenshot.png');
        await page.screenshot({ path: screenshotPath });
        console.log(`Screenshot saved to: ${screenshotPath}`);
        
        // Wait a bit so you can see the browser
        console.log('Waiting 5 seconds so you can see the browser...');
        await new Promise(resolve => setTimeout(resolve, 5000));
        
        console.log('Test completed successfully!');
        
    } catch (error) {
        console.error('Test failed:', error.message);
        console.error('Stack trace:', error.stack);
    } finally {
        if (browser) {
            await browser.close();
            console.log('Browser closed');
        }
    }
}

// Run the test
testPuppeteer(); 