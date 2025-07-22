/**
 * Simple development server for Mapbox Flight Path Visualization
 * Loads environment variables and serves the application
 */

// Load environment variables
require('dotenv').config();

const http = require('http');
const fs = require('fs');
const path = require('path');
const url = require('url');

// Configuration
const PORT = process.env.PORT || 3000;
const PUBLIC_DIR = path.join(__dirname, 'src');

// MIME types
const MIME_TYPES = {
    '.html': 'text/html',
    '.js': 'application/javascript',
    '.css': 'text/css',
    '.json': 'application/json',
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.gif': 'image/gif',
    '.svg': 'image/svg+xml',
    '.ico': 'image/x-icon',
    '.woff': 'font/woff',
    '.woff2': 'font/woff2',
    '.ttf': 'font/ttf',
    '.eot': 'application/vnd.ms-fontobject'
};

// Create HTTP server
const server = http.createServer((req, res) => {
    try {
        // Parse URL
        const parsedUrl = url.parse(req.url);
        let pathname = parsedUrl.pathname;
        
        // Default to index.html
        if (pathname === '/') {
            pathname = '/index.html';
        }
        
        // Resolve file path
        const filePath = path.join(PUBLIC_DIR, pathname);
        
        // Check if file exists
        if (!fs.existsSync(filePath)) {
            res.writeHead(404, { 'Content-Type': 'text/plain' });
            res.end('404 Not Found');
            return;
        }
        
        // Get file stats
        const stat = fs.statSync(filePath);
        
        // Check if it's a directory
        if (stat.isDirectory()) {
            res.writeHead(404, { 'Content-Type': 'text/plain' });
            res.end('404 Not Found');
            return;
        }
        
        // Get file extension
        const ext = path.extname(filePath).toLowerCase();
        const contentType = MIME_TYPES[ext] || 'application/octet-stream';
        
        // Read and serve file
        const fileStream = fs.createReadStream(filePath);
        
        res.writeHead(200, { 
            'Content-Type': contentType,
            'Cache-Control': 'no-cache, no-store, must-revalidate',
            'Pragma': 'no-cache',
            'Expires': '0'
        });
        
        fileStream.pipe(res);
        
    } catch (error) {
        console.error('Server error:', error);
        res.writeHead(500, { 'Content-Type': 'text/plain' });
        res.end('500 Internal Server Error');
    }
});

// Start server
server.listen(PORT, () => {
    console.log(`🚀 Development server running at http://localhost:${PORT}`);
    console.log(`📁 Serving files from: ${PUBLIC_DIR}`);
    console.log(`🔧 Environment: ${process.env.NODE_ENV || 'development'}`);
    
    // Check if Mapbox token is configured
    if (process.env.MAPBOX_ACCESS_TOKEN && process.env.MAPBOX_ACCESS_TOKEN !== 'YOUR_MAPBOX_ACCESS_TOKEN_HERE') {
        console.log(`✅ Mapbox access token configured`);
    } else {
        console.log(`⚠️  Mapbox access token not configured. Please set MAPBOX_ACCESS_TOKEN in your .env file.`);
    }
    
    console.log(`\nPress Ctrl+C to stop the server`);
});

// Handle graceful shutdown
process.on('SIGINT', () => {
    console.log('\n🛑 Shutting down server...');
    server.close(() => {
        console.log('✅ Server stopped');
        process.exit(0);
    });
});

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
    console.error('Uncaught Exception:', error);
    process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
    console.error('Unhandled Rejection at:', promise, 'reason:', reason);
    process.exit(1);
}); 