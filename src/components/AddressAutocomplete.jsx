import { useState, useEffect, useRef } from 'react'
import { MapPin, Loader2, AlertCircle, Check } from 'lucide-react'
import mapboxService from '../services/mapboxService'
import toast from 'react-hot-toast'

function AddressAutocomplete({ value, onChange, onAddressSelect, placeholder = 'Enter address...', required = false }) {
  const [suggestions, setSuggestions] = useState([])
  const [loading, setLoading] = useState(false)
  const [isValid, setIsValid] = useState(null)
  const [showSuggestions, setShowSuggestions] = useState(false)
  const [selectedAddress, setSelectedAddress] = useState(null)
  
  const inputRef = useRef(null)
  const suggestionsRef = useRef(null)

  // Handle input change
  const handleInputChange = async (e) => {
    const inputValue = e.target.value
    onChange(e)
    setSelectedAddress(null)
    setIsValid(null)

    if (inputValue.length < 3) {
      setSuggestions([])
      setShowSuggestions(false)
      return
    }

    setLoading(true)
    try {
      const result = await mapboxService.searchPlaces(inputValue)
      
      if (result.success) {
        setSuggestions(result.features.slice(0, 5)) // Limit to 5 suggestions
        setShowSuggestions(true)
      } else {
        console.error('Search error:', result.error)
        setSuggestions([])
      }
    } catch (error) {
      console.error('Address search error:', error)
      setSuggestions([])
    } finally {
      setLoading(false)
    }
  }

  // Handle suggestion selection
  const handleSuggestionSelect = (suggestion) => {
    console.log('Selected suggestion:', suggestion)
    console.log('Place name:', suggestion.place_name)
    
    const addressComponents = mapboxService.parseAddress(suggestion.place_name)
    console.log('Parsed components:', addressComponents)
    
    if (addressComponents) {
      setSelectedAddress(suggestion)
      
      // Update the main address field
      onChange({ target: { value: suggestion.place_name } })
      
      // Call the onAddressSelect callback to update other fields
      if (onAddressSelect) {
        console.log('Calling onAddressSelect with:', {
          fullAddress: suggestion.place_name,
          coordinates: suggestion.center,
          components: addressComponents
        })
        onAddressSelect({
          fullAddress: suggestion.place_name,
          coordinates: suggestion.center,
          components: addressComponents
        })
      }
      
      setShowSuggestions(false)
      setIsValid(true)
    } else {
      console.log('Failed to parse address components')
      // Still update the main address field even if parsing fails
      onChange({ target: { value: suggestion.place_name } })
      setShowSuggestions(false)
      setIsValid(true)
    }
  }

  // Validate address
  const validateAddress = async () => {
    if (!value || value.length < 5) {
      setIsValid(false)
      return
    }

    setLoading(true)
    try {
      const result = await mapboxService.geocodeAddress(value)
      
      if (result.success) {
        setIsValid(true)
        const addressComponents = mapboxService.parseAddress(result.address)
        
        if (addressComponents && onAddressSelect) {
          onAddressSelect({
            fullAddress: result.address,
            coordinates: result.coordinates,
            components: addressComponents
          })
        }
      } else {
        setIsValid(false)
        toast.error('Invalid address')
      }
    } catch (error) {
      console.error('Address validation error:', error)
      setIsValid(false)
    } finally {
      setLoading(false)
    }
  }

  // Handle blur event
  const handleBlur = () => {
    setTimeout(() => {
      setShowSuggestions(false)
      validateAddress()
    }, 200) // Delay to allow suggestion click
  }

  // Handle focus event
  const handleFocus = () => {
    if (suggestions.length > 0) {
      setShowSuggestions(true)
    }
  }

  // Close suggestions when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (suggestionsRef.current && !suggestionsRef.current.contains(event.target) &&
          inputRef.current && !inputRef.current.contains(event.target)) {
        setShowSuggestions(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  return (
    <div className="relative">
      {/* Input Field */}
      <div className="relative">
        <input
          ref={inputRef}
          type="text"
          value={value}
          onChange={handleInputChange}
          onBlur={handleBlur}
          onFocus={handleFocus}
          placeholder={placeholder}
          required={required}
          className={`w-full px-4 py-3 pr-10 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
            isValid === true ? 'border-green-500 bg-green-50' :
            isValid === false ? 'border-red-500 bg-red-50' :
            'border-gray-300'
          }`}
        />
        
        {/* Status Icons */}
        <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
          {loading && <Loader2 className="animate-spin text-gray-400" size={20} />}
          {isValid === true && <Check className="text-green-500" size={20} />}
          {isValid === false && <AlertCircle className="text-red-500" size={20} />}
          {!loading && isValid === null && <MapPin className="text-gray-400" size={20} />}
        </div>
      </div>

      {/* Suggestions Dropdown */}
      {showSuggestions && suggestions.length > 0 && (
        <div
          ref={suggestionsRef}
          className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-y-auto"
        >
          {suggestions.map((suggestion, index) => (
            <button
              key={`${suggestion.id}-${index}`}
              type="button"
              onClick={() => handleSuggestionSelect(suggestion)}
              className="w-full px-4 py-3 text-left hover:bg-gray-50 border-b border-gray-100 last:border-b-0 flex items-start space-x-3"
            >
              <MapPin className="text-gray-400 mt-1 flex-shrink-0" size={16} />
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium text-gray-900 truncate">
                  {suggestion.text}
                </div>
                <div className="text-xs text-gray-500 truncate">
                  {suggestion.place_name}
                </div>
              </div>
            </button>
          ))}
        </div>
      )}

      {/* Validation Message */}
      {isValid === false && (
        <div className="mt-1 text-sm text-red-600 flex items-center space-x-1">
          <AlertCircle size={14} />
          <span>Please enter a valid address</span>
        </div>
      )}

      {/* Success Message */}
      {isValid === true && selectedAddress && (
        <div className="mt-1 text-sm text-green-600 flex items-center space-x-1">
          <Check size={14} />
          <span>Address validated</span>
        </div>
      )}
    </div>
  )
}

export default AddressAutocomplete
