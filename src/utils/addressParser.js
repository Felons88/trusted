// Address parsing utility for auto-filling city, state, zip
// This uses a free geocoding API to parse addresses

export const parseAddress = async (fullAddress) => {
  if (!fullAddress || fullAddress.trim() === '') {
    return {
      street: fullAddress || '',
      city: '',
      state: '',
      zip: '',
      country: 'US'
    }
  }

  try {
    // Use Nominatim API (OpenStreetMap) for geocoding
    const response = await fetch(
      `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(fullAddress)}&addressdetails=1&limit=1`,
      {
        headers: {
          'User-Agent': 'TrustedMobileDetailing/1.0'
        }
      }
    )

    if (!response.ok) {
      throw new Error('Geocoding failed')
    }

    const data = await response.json()
    
    if (data.length === 0) {
      // If no results found, return original address as street
      return {
        street: fullAddress,
        city: '',
        state: '',
        zip: '',
        country: 'US'
      }
    }

    const result = data[0]
    const address = result.address || {}

    return {
      street: fullAddress, // Keep original full address
      city: address.city || address.town || address.village || '',
      state: address.state || '',
      zip: address.postcode || '',
      country: address.country_code || 'US',
      latitude: parseFloat(result.lat) || null,
      longitude: parseFloat(result.lon) || null
    }
  } catch (error) {
    console.error('Address parsing error:', error)
    // Return original address if parsing fails
    return {
      street: fullAddress,
      city: '',
      state: '',
      zip: '',
      country: 'US'
    }
  }
}

// Simple address validation
export const validateAddress = (address) => {
  const errors = []
  
  if (!address.street || address.street.trim() === '') {
    errors.push('Street address is required')
  }
  
  if (!address.city || address.city.trim() === '') {
    errors.push('City is required')
  }
  
  if (!address.state || address.state.trim() === '') {
    errors.push('State is required')
  }
  
  if (!address.zip || address.zip.trim() === '') {
    errors.push('ZIP code is required')
  } else if (!/^\d{5}(-\d{4})?$/.test(address.zip)) {
    errors.push('Invalid ZIP code format')
  }
  
  return {
    isValid: errors.length === 0,
    errors
  }
}

// Format full address from components
export const formatFullAddress = (address) => {
  const parts = [
    address.street,
    address.city,
    address.state,
    address.zip
  ].filter(Boolean)
  
  return parts.join(', ')
}

// US States list for validation
export const US_STATES = [
  'AL', 'AK', 'AZ', 'AR', 'CA', 'CO', 'CT', 'DE', 'FL', 'GA',
  'HI', 'ID', 'IL', 'IN', 'IA', 'KS', 'KY', 'LA', 'ME', 'MD',
  'MA', 'MI', 'MN', 'MS', 'MO', 'MT', 'NE', 'NV', 'NH', 'NJ',
  'NM', 'NY', 'NC', 'ND', 'OH', 'OK', 'OR', 'PA', 'RI', 'SC',
  'SD', 'TN', 'TX', 'UT', 'VT', 'VA', 'WA', 'WV', 'WI', 'WY'
]
