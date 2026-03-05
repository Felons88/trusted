// Mapbox Service
// Handles address validation, geocoding, and routing for mobile detailing

class MapboxService {
  constructor() {
    this.apiKey = import.meta.env.VITE_MAPBOX_API_KEY
    this.baseUrl = 'https://api.mapbox.com'
  }

  // Geocode address to coordinates
  async geocodeAddress(address) {
    try {
      if (!this.apiKey || this.apiKey === 'your_mapbox_api_key') {
        throw new Error('Mapbox API key not configured')
      }

      const response = await fetch(
        `${this.baseUrl}/geocoding/v5/mapbox.places/${encodeURIComponent(address)}.json?access_token=${this.apiKey}&country=US&types=address`
      )

      if (!response.ok) {
        throw new Error('Failed to geocode address')
      }

      const data = await response.json()

      if (data.features.length === 0) {
        throw new Error('Address not found')
      }

      const feature = data.features[0]
      
      return {
        success: true,
        coordinates: feature.center,
        address: feature.place_name,
        context: feature.context,
        confidence: feature.relevance,
        bbox: feature.bbox
      }
    } catch (error) {
      console.error('Mapbox geocodeAddress error:', error)
      return { 
        success: false, 
        error: error.message || 'Failed to geocode address' 
      }
    }
  }

  // Reverse geocode coordinates to address
  async reverseGeocode(longitude, latitude) {
    try {
      if (!this.apiKey || this.apiKey === 'your_mapbox_api_key') {
        throw new Error('Mapbox API key not configured')
      }

      const response = await fetch(
        `${this.baseUrl}/geocoding/v5/mapbox.places/${longitude},${latitude}.json?access_token=${this.apiKey}&types=address`
      )

      if (!response.ok) {
        throw new Error('Failed to reverse geocode')
      }

      const data = await response.json()

      if (data.features.length === 0) {
        throw new Error('No address found for coordinates')
      }

      const feature = data.features[0]
      
      return {
        success: true,
        address: feature.place_name,
        coordinates: feature.center,
        context: feature.context
      }
    } catch (error) {
      console.error('Mapbox reverseGeocode error:', error)
      return { 
        success: false, 
        error: error.message || 'Failed to reverse geocode' 
      }
    }
  }

  // Calculate route between two points
  async calculateRoute(startCoords, endCoords, profile = 'driving') {
    try {
      if (!this.apiKey || this.apiKey === 'your_mapbox_api_key') {
        throw new Error('Mapbox API key not configured')
      }

      const [startLng, startLat] = startCoords
      const [endLng, endLat] = endCoords

      const response = await fetch(
        `${this.baseUrl}/directions/v5/mapbox/${profile}/${startLng},${startLat};${endLng},${endLat}?access_token=${this.apiKey}&overview=full&geometries=geojson&steps=true`
      )

      if (!response.ok) {
        throw new Error('Failed to calculate route')
      }

      const data = await response.json()
      
      if (data.routes.length === 0) {
        throw new Error('No route found')
      }

      const route = data.routes[0]
      
      return {
        success: true,
        distance: route.distance, // in meters
        duration: route.duration, // in seconds
        geometry: route.geometry,
        steps: route.legs[0].steps,
        bbox: route.bbox
      }
    } catch (error) {
      console.error('Mapbox calculateRoute error:', error)
      return { 
        success: false, 
        error: error.message || 'Failed to calculate route' 
      }
    }
  }

  // Get service area (isochrone) around a point
  async getServiceArea(centerCoords, maxTime = 30, profile = 'driving') {
    try {
      if (!this.apiKey || this.apiKey === 'your_mapbox_api_key') {
        throw new Error('Mapbox API key not configured')
      }

      const [lng, lat] = centerCoords

      const response = await fetch(
        `${this.baseUrl}/isochrone/v1/mapbox/${profile}/${lng},${lat}?contours_minutes=${maxTime}&access_token=${this.apiKey}&polygons=true`
      )

      if (!response.ok) {
        throw new Error('Failed to get service area')
      }

      const data = await response.json()
      
      return {
        success: true,
        features: data.features,
        center: [lng, lat],
        maxTime
      }
    } catch (error) {
      console.error('Mapbox getServiceArea error:', error)
      return { 
        success: false, 
        error: error.message || 'Failed to get service area' 
      }
    }
  }

  // Search for places (autocomplete)
  async searchPlaces(query, proximity = null, types = 'address') {
    try {
      if (!this.apiKey || this.apiKey === 'your_mapbox_api_key') {
        throw new Error('Mapbox API key not configured')
      }

      let url = `${this.baseUrl}/geocoding/v5/mapbox.places/${encodeURIComponent(query)}.json?access_token=${this.apiKey}&types=${types}&country=US&autocomplete=true`
      
      if (proximity) {
        const [lng, lat] = proximity
        url += `&proximity=${lng},${lat}`
      }

      const response = await fetch(url)

      if (!response.ok) {
        throw new Error('Failed to search places')
      }

      const data = await response.json()
      
      return {
        success: true,
        features: data.features.map(feature => ({
          id: feature.id,
          place_name: feature.place_name,
          text: feature.text,
          center: feature.center,
          context: feature.context,
          relevance: feature.relevance
        }))
      }
    } catch (error) {
      console.error('Mapbox searchPlaces error:', error)
      return { 
        success: false, 
        error: error.message || 'Failed to search places' 
      }
    }
  }

  // Validate address format
  validateAddress(address) {
    const errors = []

    if (!address.street || address.street.trim().length < 3) {
      errors.push('Street address is required')
    }

    if (!address.city || address.city.trim().length < 2) {
      errors.push('City is required')
    }

    if (!address.state || address.state.length !== 2) {
      errors.push('Valid 2-letter state code is required')
    }

    if (!address.zipCode || !/^\d{5}(-\d{4})?$/.test(address.zipCode)) {
      errors.push('Valid ZIP code is required')
    }

    return {
      isValid: errors.length === 0,
      errors
    }
  }

  // Format address from components
  formatAddress(components) {
    const { street, city, state, zipCode } = components
    
    if (!street || !city || !state || !zipCode) {
      return ''
    }

    return `${street}, ${city}, ${state} ${zipCode}`
  }

  // Parse address from string
  parseAddress(addressString) {
    console.log('Parsing address:', addressString)
    
    // Try multiple regex patterns for different address formats
    
    // Pattern 1: "Street, City, State ZIP" (most common)
    let addressRegex = /^(.+?),\s*([^,]+?),\s*([A-Z]{2})\s*(\d{5}(?:-\d{4})?)$/
    let match = addressString.match(addressRegex)
    
    if (match) {
      const result = {
        street: match[1].trim(),
        city: match[2].trim(),
        state: match[3],
        zipCode: match[4]
      }
      console.log('Parsed with pattern 1:', result)
      return result
    }
    
    // Pattern 2: "Street, City, State" (no ZIP)
    addressRegex = /^(.+?),\s*([^,]+?),\s*([A-Z]{2})$/
    match = addressString.match(addressRegex)
    
    if (match) {
      const result = {
        street: match[1].trim(),
        city: match[2].trim(),
        state: match[3],
        zipCode: ''
      }
      console.log('Parsed with pattern 2:', result)
      return result
    }
    
    // Pattern 3: "Street, City, State ZIP, USA"
    addressRegex = /^(.+?),\s*([^,]+?),\s*([A-Z]{2})\s*(\d{5}(?:-\d{4})?),\s*USA$/
    match = addressString.match(addressRegex)
    
    if (match) {
      const result = {
        street: match[1].trim(),
        city: match[2].trim(),
        state: match[3],
        zipCode: match[4]
      }
      console.log('Parsed with pattern 3:', result)
      return result
    }
    
    // Pattern 4: Try to extract from Mapbox context if available
    // This would need the full suggestion object, not just the place_name
    
    console.log('No pattern matched for address:', addressString)
    return null
  }

  // Calculate distance between two points
  calculateDistance(coords1, coords2) {
    const [lng1, lat1] = coords1
    const [lng2, lat2] = coords2

    // Haversine formula
    const R = 6371 // Earth's radius in kilometers
    const dLat = (lat2 - lat1) * Math.PI / 180
    const dLng = (lng2 - lng1) * Math.PI / 180
    const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
              Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
              Math.sin(dLng/2) * Math.sin(dLng/2)
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a))
    const distance = R * c

    return {
      kilometers: distance,
      miles: distance * 0.621371,
      meters: distance * 1000
    }
  }

  // Check if address is within service area
  async isWithinServiceArea(address, serviceCenterCoords, maxDistance = 50) {
    try {
      const geocodeResult = await this.geocodeAddress(address)
      
      if (!geocodeResult.success) {
        return { success: false, error: geocodeResult.error }
      }

      const distance = this.calculateDistance(serviceCenterCoords, geocodeResult.coordinates)
      
      return {
        success: true,
        isWithinService: distance.miles <= maxDistance,
        distance: distance,
        coordinates: geocodeResult.coordinates
      }
    } catch (error) {
      console.error('Mapbox isWithinServiceArea error:', error)
      return { 
        success: false, 
        error: error.message || 'Failed to check service area' 
      }
    }
  }

  // Get optimal route for multiple stops
  async optimizeRoute(stops, profile = 'driving') {
    try {
      if (!this.apiKey || this.apiKey === 'your_mapbox_api_key') {
        throw new Error('Mapbox API key not configured')
      }

      if (stops.length < 2) {
        throw new Error('At least 2 stops required for route optimization')
      }

      const coordinates = stops.map(stop => `${stop[0]},${stop[1]}`).join(';')
      
      const response = await fetch(
        `${this.baseUrl}/directions/v5/mapbox/${profile}/${coordinates}?access_token=${this.apiKey}&overview=full&geometries=geojson&steps=true&optimize=true`
      )

      if (!response.ok) {
        throw new Error('Failed to optimize route')
      }

      const data = await response.json()
      
      if (data.routes.length === 0) {
        throw new Error('No route found')
      }

      const route = data.routes[0]
      
      return {
        success: true,
        waypoints: data.waypoints,
        distance: route.distance,
        duration: route.duration,
        geometry: route.geometry,
        steps: route.legs[0].steps,
        optimizedOrder: data.waypoints.map(wp => wp.waypoint_index)
      }
    } catch (error) {
      console.error('Mapbox optimizeRoute error:', error)
      return { 
        success: false, 
        error: error.message || 'Failed to optimize route' 
      }
    }
  }

  // Format distance for display
  formatDistance(meters) {
    if (meters < 1000) {
      return `${Math.round(meters)} ft`
    } else if (meters < 1609) {
      return `${(meters / 1000).toFixed(1)} km`
    } else {
      const miles = meters * 0.000621371
      return `${miles.toFixed(1)} miles`
    }
  }

  // Format duration for display
  formatDuration(seconds) {
    const hours = Math.floor(seconds / 3600)
    const minutes = Math.floor((seconds % 3600) / 60)

    if (hours > 0) {
      return `${hours}h ${minutes}m`
    } else {
      return `${minutes}m`
    }
  }

  // Validate Mapbox configuration
  validateConfig() {
    const errors = []

    if (!this.apiKey || this.apiKey === 'your_mapbox_api_key') {
      errors.push('Mapbox API key is required')
    }

    return {
      isValid: errors.length === 0,
      errors
    }
  }
}

export default new MapboxService()
