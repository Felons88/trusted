// BIN Lookup Service for identifying issuing banks
// Uses free BIN lookup API to get bank information

class BINLookupService {
  constructor() {
    // Using binlist.io as primary API
    this.apiBaseUrl = 'https://lookup.binlist.net'
  }

  async lookupBIN(bin) {
    if (!bin || bin === 'NOT_AVAILABLE' || bin === 'CARD_BIN_NOT_AVAILABLE' || bin.length < 6) {
      console.log('Invalid BIN for lookup:', bin)
      return {
        bank: 'Unknown',
        country: 'Unknown',
        type: 'Unknown',
        scheme: 'Unknown',
        brand: 'Unknown'
      }
    }

    try {
      console.log('Looking up BIN:', bin)
      const response = await fetch(`${this.apiBaseUrl}/${bin}`, {
        method: 'GET',
        headers: {
          'Accept-Version': '3',
          'Content-Type': 'application/json'
        }
      })

      if (!response.ok) {
        console.warn(`BIN lookup HTTP error: ${response.status}`)
        throw new Error(`BIN lookup failed: ${response.status}`)
      }

      const data = await response.json()
      console.log('BIN lookup response:', data)
      
      return this.parseBinlistResponse(data)
    } catch (error) {
      console.warn('BIN lookup failed:', error.message)
      return {
        bank: 'Unknown',
        country: 'Unknown',
        type: 'Unknown',
        scheme: 'Unknown',
        brand: 'Unknown'
      }
    }
  }

  async tryAPI(api, bin) {
    const response = await fetch(`${api.url}/${bin}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        ...api.headers
      }
    })

    if (!response.ok) {
      throw new Error(`API request failed: ${response.status}`)
    }

    const data = await response.json()
    
    // Parse response based on API
    if (api.name === 'binlist') {
      return this.parseBinlistResponse(data)
    } else if (api.name === 'bin-db') {
      return this.parseBinDBResponse(data)
    }

    return null
  }

  parseBinlistResponse(data) {
    return {
      bank: data.bank?.name || 'Unknown',
      bank_url: data.bank?.url || '',
      bank_phone: data.bank?.phone || '',
      bank_city: data.bank?.city || '',
      country: data.country?.name || 'Unknown',
      country_code: data.country?.alpha2 || '',
      country_numeric: data.country?.numeric || '',
      country_currency: data.country?.currency || '',
      country_emoji: data.country?.emoji || '',
      type: data.type || 'Unknown', // debit, credit
      scheme: data.scheme || 'Unknown', // visa, mastercard
      brand: data.brand || 'Unknown',
      prepaid: data.prepaid || false,
      number_length: data.number?.length || null,
      luhn: data.number?.luhn || false,
      latitude: data.country?.latitude || null,
      longitude: data.country?.longitude || null
    }
  }

  parseBinDBResponse(data) {
    return {
      bank: data.bank?.name || 'Unknown',
      country: data.country?.name || 'Unknown',
      type: data.card?.type || 'Unknown',
      scheme: data.card?.scheme || 'Unknown',
      brand: data.card?.brand || 'Unknown',
      prepaid: data.card?.prepaid || false,
      numeric: data.card?.numeric || ''
    }
  }

  // Extract BIN from card number (first 6 digits)
  extractBIN(cardNumber) {
    if (!cardNumber || cardNumber.length < 6) {
      return null
    }
    return cardNumber.substring(0, 6)
  }

  // Get bank info from card fingerprint (alternative approach)
  async getBankFromFingerprint(cardFingerprint, cardBrand) {
    // This is a fallback method using card fingerprint patterns
    // Some card fingerprints contain bank information
    
    if (!cardFingerprint) {
      return this.getBankByBrand(cardBrand)
    }

    try {
      // Try to extract BIN-like patterns from fingerprint
      const fingerprintParts = cardFingerprint.split('_')
      const potentialBin = fingerprintParts.find(part => part.length === 6 && /^\d+$/.test(part))
      
      if (potentialBin) {
        return await this.lookupBIN(potentialBin)
      }
    } catch (error) {
      console.warn('Failed to extract BIN from fingerprint:', error)
    }

    return this.getBankByBrand(cardBrand)
  }

  // Fallback: Get general bank info by card brand
  getBankByBrand(cardBrand) {
    const brandInfo = {
      visa: {
        bank: 'Visa Issuing Bank',
        country: 'United States',
        type: 'debit', // Default to debit since most are
        scheme: 'VISA'
      },
      mastercard: {
        bank: 'Mastercard Issuing Bank',
        country: 'United States',
        type: 'debit', // Default to debit since most are
        scheme: 'MASTERCARD'
      },
      amex: {
        bank: 'American Express',
        country: 'United States',
        type: 'credit', // Amex is typically credit
        scheme: 'AMEX'
      },
      discover: {
        bank: 'Discover Bank',
        country: 'United States',
        type: 'credit', // Discover is typically credit
        scheme: 'DISCOVER'
      },
      diners: {
        bank: 'Diners Club',
        country: 'United States',
        type: 'credit',
        scheme: 'DINERS'
      },
      jcb: {
        bank: 'JCB',
        country: 'Japan',
        type: 'credit',
        scheme: 'JCB'
      },
      unionpay: {
        bank: 'UnionPay',
        country: 'China',
        type: 'debit',
        scheme: 'UNIONPAY'
      }
    }

    const brand = cardBrand?.toLowerCase()
    return brandInfo[brand] || {
      bank: 'Unknown Issuing Bank',
      country: 'United States', // Default to US
      type: 'debit', // Default to debit
      scheme: cardBrand?.toUpperCase() || 'UNKNOWN'
    }
  }
}

export default new BINLookupService()
