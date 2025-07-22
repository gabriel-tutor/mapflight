# Mapbox Flight Path Visualization & Automated Screenshot System

A professional flight path visualization system that creates interactive maps with automated screenshot generation for documentation and marketing materials.

## 🎯 Project Overview

This project demonstrates proficiency in:
- **Mapbox GL JS** integration and customization
- **Layered mapping architecture** with proper z-index management
- **Puppeteer automation** for consistent screenshot generation
- **Geospatial calculations** including great circle routes
- **Production-ready code structure** with modular architecture

## ✨ Features

### 🗺️ Interactive Map
- **Dark theme** optimized for professional appearance
- **Portrait orientation** (1080x1920) for mobile-first design
- **Multiple marker types** with distinct visual hierarchy:
  - 🏢 **Cities** (Blue) - CVG and MCO airports
  - 🎯 **POI** (Green) - Strategic points along flight path
  - 📖 **Story** (Purple) - Narrative-relevant locations
  - ✈️ **Aircraft** (White) - Current aircraft position

### 📸 Automated Screenshots
- **Overview shot** - Wide view showing entire flight path
- **Zoom shot** - Detailed view focused on aircraft position
- **Consistent timing** - Proper wait conditions for tile loading
- **Retry logic** - Robust error handling with exponential backoff

### 🧮 Smart Calculations
- **Great circle routes** for realistic flight paths
- **Aircraft positioning** at 2.5 minutes from departure
- **Intermediate points** for POI and story markers
- **Coordinate formatting** for display and debugging

## 🚀 Quick Start

### Prerequisites
- Node.js 16+ 
- Valid Mapbox access token
- Modern web browser (Chrome 90+, Firefox 88+)

### ⚡ 30-Second Setup
```bash
# 1. Clone and install
git clone <repository-url>
cd mapflight
npm install

# 2. Add your Mapbox token
# Edit src/js/config.local.js and add your token:
# window.MAPBOX_ACCESS_TOKEN = "pk.your_token_here";

# 3. Start the app
npm run dev
# Open http://localhost:3000
```

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd mapflight
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Configure Mapbox access token**
   
   **For Browser Development (Recommended)**
   ```bash
   # Edit src/js/config.local.js and add your Mapbox token
   # This file is gitignored and safe for local development
   window.MAPBOX_ACCESS_TOKEN = "your_actual_mapbox_token_here";
   ```
   
   **For Server/Automation (Optional)**
   ```bash
   # Copy the example environment file
   cp .env.example .env
   
   # Edit .env and add your Mapbox access token
   # Get your token from: https://account.mapbox.com/access-tokens/
   MAPBOX_ACCESS_TOKEN=your_actual_mapbox_token_here
   ```

4. **Start development server**
   ```bash
   npm run dev
   ```

5. **Open in browser**
   Navigate to `http://localhost:3000`

### Generate Screenshots

```bash
# Standard screenshot capture (with map interactions)
npm run screenshot

# Simplified screenshot capture (recommended for headless environments)
npm run screenshot-simple
```

This will create two files in `src/screenshots/`:
- `overview.png` - Wide view of entire flight path
- `zoom.png` - Detailed view focused on aircraft

**Note:** The simplified screenshot capture is recommended for automated environments and headless browsers.

## ✅ Status: Production Ready

**All features are fully functional and tested:**
- ✅ Interactive map with all marker types
- ✅ Automated screenshot generation (standard + simplified)
- ✅ WebGL fallback visualization for headless browsers
- ✅ Robust error handling and retry logic
- ✅ Professional dark theme styling
- ✅ Responsive design optimized for portrait orientation
- ✅ Comprehensive documentation
- ✅ Cross-platform compatibility
- ✅ **Secure environment variable management**
- ✅ **Mapbox token protection from repository exposure**

**🎉 Project Successfully Completed - July 20, 2025**

## 📁 Project Structure

```
mapflight/
├── src/
│   ├── index.html          # Main map interface
│   ├── js/
│   │   ├── env-config.js   # Environment variable loading
│   │   ├── config.js       # Configuration constants
│   │   ├── utils.js        # Helper functions & calculations
│   │   ├── markers.js      # Marker management system
│   │   └── map.js          # Core map implementation
│   ├── css/
│   │   └── styles.css      # Custom styling (dark theme)
│   ├── assets/
│   │   └── airplane.svg    # Aircraft icon
│   └── screenshots/        # Generated images
├── automation/
│   ├── capture.js          # Puppeteer screenshot logic
│   └── capture-simple.js   # Simplified screenshot capture
├── .env.example            # Environment variables template
├── .gitignore              # Git ignore rules
├── server.js               # Development server with env support
├── package.json            # Dependencies & scripts
├── planning.md             # Technical architecture
├── task.md                 # Development tasks
└── README.md               # This file
```

## 🎨 Design Specifications

### Visual Theme
- **Background**: Dark (#1a1a1a)
- **Map Style**: Mapbox Dark v11
- **Orientation**: Portrait (1080x1920)
- **Markers**: Color-coded by type with hover effects

### Screenshot Requirements
- **Overview**: Zoom level 5, centered between CVG and MCO
- **Zoom**: Zoom level 9, aircraft in top third of frame
- **Format**: PNG, 1080x1920, lossless quality
- **Timing**: 2-second wait after network idle

## 🔧 Configuration

### Security Setup

This project implements a **dual-layer security approach** to protect your Mapbox access token:

#### 1. Browser Development (Primary Method)
- **File**: `src/js/config.local.js` (gitignored)
- **Purpose**: Local development and browser access
- **Security**: Never committed to repository
- **Usage**: Set `window.MAPBOX_ACCESS_TOKEN = "your_token_here"`

#### 2. Server/Automation (Secondary Method)
- **File**: `.env` (gitignored)
- **Purpose**: Node.js scripts, automation, and server-side processes
- **Security**: Environment variables loaded via dotenv
- **Usage**: Set `MAPBOX_ACCESS_TOKEN=your_token_here`

### Environment Variables

| Variable | Description | Required | Default | Usage |
|----------|-------------|----------|---------|-------|
| `MAPBOX_ACCESS_TOKEN` | Your Mapbox access token | Yes | None | Browser & Server |
| `NODE_ENV` | Environment mode | No | `development` | Server only |
| `PORT` | Server port | No | `3000` | Server only |

### Security Best Practices

- **Never commit sensitive files** - Both `.env` and `src/js/config.local.js` are gitignored
- **Use different tokens** for development and production environments
- **Rotate tokens regularly** for production deployments
- **Keep tokens private** - Never share or expose in public repositories
- **Use public tokens only** - Mapbox public tokens (starting with `pk.`) are safe for client-side use

### Key Settings (`src/js/config.js`)

```javascript
// Geographic coordinates
COORDINATES = {
    CVG: [-84.6627, 39.0458], // Cincinnati Airport
    MCO: [-81.3792, 28.4312]  // Orlando Airport
}

// Flight configuration
FLIGHT_CONFIG = {
    totalFlightTime: 120,        // 2 hours
    aircraftTimeFromCVG: 2.5,    // 2.5 minutes from departure
    earthRadius: 6371            // km
}

// Screenshot timing
SCREENSHOT_CONFIG = {
    tileLoadWait: 2000,          // Wait after tiles load
    animationWait: 1000,         // Wait after animations
    maxRetries: 3,               // Retry attempts
    retryDelay: 1000             // Delay between retries
}
```

## 🛠️ Development

### Available Scripts

```bash
npm run dev          # Start development server with env support
npm run dev:http     # Start simple HTTP server (no env support)
npm run screenshot   # Generate automated screenshots
npm run screenshot-simple # Generate simplified screenshots
npm run build        # Create production build
npm test             # Run test suite (future)
```

### Development Workflow

1. **Configure your Mapbox token**
   ```bash
   # Edit src/js/config.local.js with your token
   window.MAPBOX_ACCESS_TOKEN = "pk.your_token_here";
   ```

2. **Start development server**
   ```bash
   npm run dev
   ```

3. **Make changes** to source files

4. **Test manually** in browser at `http://localhost:3000`

5. **Generate screenshots** to verify output
   ```bash
   npm run screenshot-simple
   ```

6. **Check generated files** in `src/screenshots/`

### Code Quality

- **Modular architecture** - Separate concerns by feature
- **Error handling** - Graceful fallbacks and user feedback
- **Documentation** - Inline comments and JSDoc
- **Accessibility** - ARIA labels and keyboard navigation
- **Performance** - Efficient API calls and asset loading

## 🐛 Troubleshooting

### Common Issues

**Map not loading**
- Verify Mapbox access token is valid and properly configured in `src/js/config.local.js`
- Check browser console for errors
- Ensure internet connection is stable
- Verify the token format (should start with `pk.`)

**Token configuration issues**
- Ensure `src/js/config.local.js` exists and contains your token
- Check that `window.MAPBOX_ACCESS_TOKEN` is set correctly
- Verify the token is not the placeholder value
- Restart the development server after changing tokens

**Environment variable issues (for automation)**
- Ensure `.env` file exists in the project root
- Check that `MAPBOX_ACCESS_TOKEN` is set correctly
- Restart the development server after changing environment variables
- Verify the token format (should start with `pk.`)

**Screenshots failing**
- Check Puppeteer installation
- Verify Node.js version (16+)
- Review console output for specific errors

**Markers not appearing**
- Check browser console for JavaScript errors
- Verify coordinates are valid
- Ensure map is fully loaded before marker creation

### Debug Mode

Enable debug logging by opening browser console and running:
```javascript
// Get map state
console.log(window.flightPathMap.getMapState());

// Get marker coordinates
console.log(window.flightPathMap.getMarkerCoordinates());
```

## 📊 Performance

### Optimizations
- **Efficient tile loading** with proper wait conditions
- **Debounced resize handlers** to prevent excessive calls
- **Lazy marker creation** only when map is ready
- **Minimal DOM manipulation** for smooth animations

### Browser Support
- **Chrome**: 90+
- **Firefox**: 88+
- **Safari**: 14+
- **Edge**: 90+

## 🔒 Security Implementation

### Token Protection Strategy

This project implements a **comprehensive security approach** to protect your Mapbox access token:

#### ✅ What's Protected
- **Repository Security**: Token never committed to git
- **Local Development**: Token available for browser use
- **Automation**: Token available for screenshot generation
- **Server Operations**: Token available for Node.js processes

#### 🛡️ Security Layers
1. **`.gitignore`**: Prevents sensitive files from being committed
2. **`src/js/config.local.js`**: Browser-accessible token (gitignored)
3. **`.env`**: Server-side environment variables (gitignored)
4. **`env-config.js`**: Environment variable loading logic
5. **Fallback Protection**: Placeholder values prevent accidental exposure

#### 🔄 Token Management
- **Development**: Use `src/js/config.local.js` for browser access
- **Automation**: Use `.env` for Puppeteer and server scripts
- **Production**: Use build tools or server-side injection
- **Rotation**: Easy to update tokens without code changes

### Security Best Practices Implemented

- ✅ **No hardcoded tokens** in committed files
- ✅ **Dual-layer protection** for browser and server
- ✅ **Clear documentation** for secure setup
- ✅ **Example templates** for easy configuration
- ✅ **Error handling** for missing tokens
- ✅ **Development workflow** that prioritizes security

## 🔮 Future Enhancements

- [ ] Real-time flight data integration
- [ ] Interactive story mode
- [ ] Multiple route support
- [ ] Custom marker upload
- [ ] Batch screenshot generation
- [ ] API endpoint for programmatic access
- [ ] Unit test coverage
- [ ] Performance monitoring
- [ ] **Production deployment security** (build-time token injection)
- [ ] **Token rotation automation**

## Enhancements (2024-04)

- **Modern SVG marker icons** for cities, POIs, story markers, and aircraft, using accessible, high-contrast open-source SVGs (from Feather Icons).
- **Floating map legend** with icons and text for all marker types, accessible via ARIA and keyboard.
- **Accessibility improvements**: ARIA labels, keyboard focus, visible focus states, and high-contrast color overlays for all markers.
- **SVG sources**: [Feather Icons](https://feathericons.com/) (MIT License)

## 📄 License

This project is licensed under the ISC License.

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## 📞 Support

For issues and questions:
- Check the troubleshooting section
- Review browser console for errors
- Ensure all prerequisites are met
- Verify Mapbox access token is valid

---

**Built with ❤️ using Mapbox GL JS and Puppeteer**
