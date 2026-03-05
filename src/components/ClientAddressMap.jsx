import { useState, useEffect, useRef } from 'react'
import { MapPin } from 'lucide-react'
import mapboxService from '../services/mapboxService'
import toast from 'react-hot-toast'

function ClientAddressMap({ address, city, state, zipCode, clientName, height = '200px' }) {
  const [map, setMap] = useState(null)
  const [loading, setLoading] = useState(true)
  const mapContainer = useRef(null)
  const mapboxgl = useRef(null)

  useEffect(() => {
    if (!mapContainer.current || !address) return

    // Load Mapbox GL JS
    const script = document.createElement('script')
    script.src = 'https://api.mapbox.com/mapbox-gl-js/v2.15.0/mapbox-gl.js'
    script.onload = () => {
      mapboxgl.current = window.mapboxgl
      mapboxgl.current.accessToken = import.meta.env.VITE_MAPBOX_API_KEY
      
      initializeMap()
    }
    script.onerror = () => {
      console.error('Failed to load Mapbox GL JS')
      toast.error('Failed to load map')
      setLoading(false)
    }
    document.head.appendChild(script)

    // Load Mapbox CSS
    const link = document.createElement('link')
    link.href = 'https://api.mapbox.com/mapbox-gl-js/v2.15.0/mapbox-gl.css'
    link.rel = 'stylesheet'
    document.head.appendChild(link)

    return () => {
      if (script) document.head.removeChild(script)
      if (link) document.head.removeChild(link)
      if (map) {
        map.remove()
      }
    }
  }, [address])

  const initializeMap = async () => {
    if (!mapContainer.current || !mapboxgl.current) return

    try {
      // Get client address coordinates
      const fullAddress = [address, city, state, zipCode].filter(Boolean).join(', ')
      const geocodeResult = await mapboxService.geocodeAddress(fullAddress)
      
      if (!geocodeResult.success) {
        throw new Error('Failed to geocode address')
      }

      const [lng, lat] = geocodeResult.coordinates

      // Create map
      const mapInstance = new mapboxgl.current.Map({
        container: mapContainer.current,
        style: 'mapbox://styles/mapbox/streets-v12',
        center: [lng, lat],
        zoom: 14,
        attributionControl: false,
        interactive: true
      })

      // Add navigation control
      mapInstance.addControl(new mapboxgl.current.NavigationControl(), 'top-right')

      mapInstance.on('load', () => {
        setMap(mapInstance)
        setLoading(false)
        
        // Add client location marker
        const marker = new mapboxgl.current.Marker({
          color: '#EF4444',
          scale: 1.3
        })
          .setLngLat([lng, lat])
          .addTo(mapInstance)

        // Add popup with client info
        const popup = new mapboxgl.current.Popup({ offset: 25 })
          .setHTML(`
            <div style="padding: 8px; font-family: system-ui, -apple-system, sans-serif;">
              <strong style="color: #1f2937; font-size: 14px;">${clientName || 'Client Location'}</strong><br>
              <span style="color: #6b7280; font-size: 12px;">${fullAddress}</span>
            </div>
          `)

        marker.setPopup(popup)
      })

    } catch (error) {
      console.error('Map initialization error:', error)
      toast.error('Failed to load client location')
      setLoading(false)
    }
  }

  if (!address) {
    return (
      <div 
        className="bg-gray-100 rounded-lg flex items-center justify-center border border-gray-300"
        style={{ height }}
      >
        <div className="text-center">
          <MapPin className="text-gray-400 mx-auto mb-2" size={24} />
          <p className="text-gray-500 text-sm">No address provided</p>
        </div>
      </div>
    )
  }

  return (
    <div className="relative">
      {loading && (
        <div 
          className="absolute inset-0 bg-gray-100 rounded-lg flex items-center justify-center z-10"
          style={{ height }}
        >
          <div className="text-center">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500 mx-auto mb-2"></div>
            <p className="text-gray-500 text-sm">Loading map...</p>
          </div>
        </div>
      )}
      
      <div 
        ref={mapContainer}
        className="rounded-lg overflow-hidden border border-gray-300"
        style={{ height }}
      />
    </div>
  )
}

export default ClientAddressMap
