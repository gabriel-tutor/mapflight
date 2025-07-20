# PLANNING.md

## Project Overview
**Mapbox Flight Path Visualization & Automated Screenshot System**

### Purpose
Demonstrate proficiency in Mapbox GL JS, layered mapping architecture, and Puppeteer automation to create clean, consistent screenshots for MVP system integration. This project showcases ability to work with geospatial data, automated browser testing, and production-ready code structure.

### High-Level Vision
Create an interactive flight path visualization system that can automatically generate standardized screenshots for documentation, marketing materials, or system integration. The solution emphasizes clean architecture, maintainable code, and automated workflows.

## Technical Architecture

### Core Technologies
- **Frontend**: Mapbox GL JS (latest stable)
- **Automation**: Puppeteer (headless Chrome)
- **Build Tools**: Node.js, npm/yarn
- **Asset Management**: Local assets with CDN fallbacks
- **Code Quality**: ESLint, Prettier (optional but recommended)

### System Components
```
src/
├── index.html          # Main map interface
├── js/
│   ├── map.js         # Core map initialization
│   ├── markers.js     # Marker management & layers
│   ├── config.js      # Configuration constants
│   └── utils.js       # Helper functions
├── css/
│   └── styles.css     # Custom styling
├── assets/
│   └── airplane.svg   # Airplane icon
├── screenshots/       # Generated images
└── automation/
    └── capture.js     # Puppeteer screenshot logic
```

### Design Constraints

#### Visual Requirements
- **Theme**: Dusk/dark aesthetic for professional appearance
- **Layout**: Portrait orientation (1080x1920 optimized)
- **Markers**: Clear visual hierarchy with distinct colors
- **Performance**: Smooth rendering, fast load times

#### Technical Constraints
- **Browser Support**: Modern browsers (Chrome 90+, Firefox 88+)
- **Mobile Responsive**: Not required for this MVP
- **Accessibility**: Basic ARIA labels for screen readers
- **API Limits**: Efficient Mapbox API usage

## Data Structure

### Marker Categories
```javascript
const MARKER_TYPES = {
  CITIES: {
    color: '#3B82F6', // Blue
    layer: 'cities-layer',
    priority: 1
  },
  POI: {
    color: '#10B981', // Green  
    layer: 'poi-layer',
    priority: 2
  },
  STORY: {
    color: '#8B5CF6', // Purple
    layer: 'story-layer', 
    priority: 3
  },
  AIRCRAFT: {
    color: '#FFFFFF', // White
    layer: 'aircraft-layer',
    priority: 0 // Highest
  }
}
```

### Geographic Points
- **CVG**: Cincinnati/Northern Kentucky International Airport
  - Coordinates: [-84.6627, 39.0458]
- **MCO**: Orlando International Airport  
  - Coordinates: [-81.3792, 28.4312]
- **Aircraft Position**: ~2.5 minutes along flight path from CVG
- **POI Locations**: Strategic points between origin/destination
- **Story Markers**: Narrative-relevant geographic locations

## Screenshot Specifications

### Overview Shot (overview.png)
- **Zoom Level**: 4-6 (wide view)
- **Center Point**: Midpoint between CVG and MCO
- **Dimensions**: 1080x1920 (portrait)
- **Content**: All markers visible, readable labels
- **Timing**: Wait for all tiles to load

### Zoom Shot (zoom.png)  
- **Zoom Level**: 8-10 (detailed view)
- **Center Point**: Aircraft position
- **Airplane Position**: Top third of frame
- **Dimensions**: 1080x1920 (portrait)
- **Content**: Aircraft + nearby markers
- **Timing**: Smooth zoom transition, stable render

## Development Phases

### Phase 1: Foundation (MVP)
- Basic Mapbox integration
- Static marker placement
- Core layer structure
- Manual screenshot capability

### Phase 2: Automation
- Puppeteer integration  
- Automated screenshot generation
- Timing optimization
- Error handling

### Phase 3: Polish
- Visual refinement
- Performance optimization
- Code documentation
- Testing suite

## Quality Standards

### Code Quality
- **Modularity**: Separate concerns, reusable components
- **Documentation**: Inline comments, README clarity  
- **Error Handling**: Graceful fallbacks, user feedback
- **Performance**: Efficient API calls, optimized assets

### Output Quality
- **Visual Consistency**: Standardized styling across shots
- **Technical Precision**: Accurate geographic positioning
- **Professional Polish**: Clean, production-ready appearance
- **Reliability**: Consistent automated generation

## Risk Mitigation

### Technical Risks
- **API Rate Limits**: Implement caching, efficient calls
- **Browser Compatibility**: Test across major browsers
- **Screenshot Timing**: Add proper wait conditions
- **Asset Loading**: Fallback strategies for external resources

### Project Risks  
- **Scope Creep**: Maintain focus on core requirements
- **Time Management**: Prioritize MVP features first
- **Quality vs Speed**: Balance thoroughness with delivery

## Success Metrics
- ✅ Clean, professional screenshots generated automatically
- ✅ All markers clearly visible and properly styled  
- ✅ Smooth flight path positioning
- ✅ Reliable Puppeteer automation
- ✅ Well-structured, maintainable codebase
- ✅ Comprehensive documentation

## Future Enhancements
- Real-time flight data integration
- Interactive story mode
- Multiple route support
- Custom marker upload
- Batch screenshot generation
- API endpoint for programmatic access