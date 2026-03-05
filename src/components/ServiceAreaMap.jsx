import { useState, useEffect, useRef } from 'react'
import { MapPin, Navigation, Clock, CheckCircle, AlertCircle } from 'lucide-react'
import mapboxService from '../services/mapboxService'
import toast from 'react-hot-toast'

function ServiceAreaMap({ 
  centerAddress, 
  maxDistance = 30, 
  onAddressValidation,
  showClientPin = false,
  clientInfo = null,
  interactive = true,
  zoom = 10
}) {
  const [map, setMap] = useState(null)
  const [serviceArea, setServiceArea] = useState(null)
  const [customerAddress, setCustomerAddress] = useState('')
  const [isWithinService, setIsWithinService] = useState(null)
  const [distance, setDistance] = useState(null)
  const [loading, setLoading] = useState(false)
  const [mapLoaded, setMapLoaded] = useState(false)
  
  const mapContainer = useRef(null)
  const mapboxgl = useRef(null)

  // Initialize Mapbox
  useEffect(() => {
    if (!mapContainer.current || mapboxgl.current) return

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
    }
  }, [])

  // Initialize map
  const initializeMap = async () => {
    if (!mapContainer.current || !mapboxgl.current) return

    try {
      // Get center coordinates
      const centerResult = await mapboxService.geocodeAddress(centerAddress)
      
      if (!centerResult.success) {
        throw new Error('Failed to geocode center address')
      }

      const [lng, lat] = centerResult.coordinates

      // Create map
      const mapInstance = new mapboxgl.current.Map({
        container: mapContainer.current,
        style: 'mapbox://styles/mapbox/streets-v12',
        center: [lng, lat],
        zoom: zoom,
        attributionControl: false,
        interactive: interactive
      })

      // Add controls only if interactive
      if (interactive) {
        // Add navigation control
        mapInstance.addControl(new mapboxgl.current.NavigationControl(), 'top-right')
        
        // Add scale control
        mapInstance.addControl(new mapboxgl.current.ScaleControl(), 'bottom-left')
      }

      mapInstance.on('load', () => {
        setMap(mapInstance)
        setMapLoaded(true)
        
        if (showClientPin && clientInfo) {
          // Show client location as main marker
          new mapboxgl.current.Marker({
            color: '#EF4444',
            scale: 1.3
          })
            .setLngLat([lng, lat])
            .addTo(mapInstance)
            .setPopup(new mapboxgl.current.Popup({ offset: 25 }).setHTML(`
              <div style="padding: 8px;">
                <strong>${clientInfo.name}</strong><br>
                ${clientInfo.address}<br>
                ${clientInfo.city && clientInfo.state ? `${clientInfo.city}, ${clientInfo.state} ${clientInfo.zip_code || ''}` : ''}
              </div>
            `))
        } else {
          // Show service center marker
          new mapboxgl.current.Marker({
            color: '#3B82F6',
            scale: 1.2
          })
            .setLngLat([lng, lat])
            .addTo(mapInstance)
            .setPopup(new mapboxgl.current.Popup({ offset: 25 }).setHTML(`
              <div style="padding: 8px;">
                <strong>Service Center</strong><br>
                ${centerAddress}
              </div>
            `))
        }

        // Load service area only if not showing client pin
        if (!showClientPin) {
          loadServiceArea([lng, lat])
        }
      })

    } catch (error) {
      console.error('Map initialization error:', error)
      toast.error('Failed to initialize map')
    }
  }

  // Load service area polygon
  const loadServiceArea = async (centerCoords) => {
    setLoading(true)
    try {
      const result = await mapboxService.getServiceArea(centerCoords, maxDistance)
      
      if (result.success && result.features.length > 0) {
        setServiceArea(result.features[0])
        
        // Add service area to map
        if (map) {
          map.addSource('service-area', {
            type: 'geojson',
            data: result.features[0]
          })

          map.addLayer({
            id: 'service-area-fill',
            type: 'fill',
            source: 'service-area',
            paint: {
              'fill-color': '#3B82F6',
              'fill-opacity': 0.2
            }
          })

          map.addLayer({
            id: 'service-area-outline',
            type: 'line',
            source: 'service-area',
            paint: {
              'line-color': '#3B82F6',
              'line-width': 2,
              'line-opacity': 0.8
            }
          })

          // Fit map to service area
          const bbox = result.features[0].bbox
          map.fitBounds(bbox, { padding: 20 })
        }
      }
    } catch (error) {
      console.error('Service area loading error:', error)
      toast.error('Failed to load service area')
    } finally {
      setLoading(false)
    }
  }

  // Check customer address
  const checkCustomerAddress = async () => {
    if (!customerAddress.trim()) {
      toast.error('Please enter an address')
      return
    }

    setLoading(true)
    try {
      // Get center coordinates
      const centerResult = await mapboxService.geocodeAddress(centerAddress)
      
      if (!centerResult.success) {
        throw new Error('Failed to geocode center address')
      }

      // Check if customer address is within service area
      const result = await mapboxService.isWithinServiceArea(
        customerAddress,
        centerResult.coordinates,
        maxDistance
      )

      if (result.success) {
        setIsWithinService(result.isWithinService)
        setDistance(result.distance)

        // Add customer marker to map
        if (map && result.coordinates) {
          // Remove existing customer marker if any
          if (map.getLayer('customer-marker')) {
            map.removeLayer('customer-marker')
          }
          if (map.getSource('customer-marker')) {
            map.removeSource('customer-marker')
          }

          // Add new customer marker
          const markerColor = result.isWithinService ? '#10B981' : '#EF4444'
          
          new mapboxgl.current.Marker({
            color: markerColor,
            scale: 1.0
          })
            .setLngLat(result.coordinates)
            .addTo(map)
            .setPopup(new mapboxgl.current.Popup({ offset: 25 }).setHTML(`
              <div style="padding: 8px;">
                <strong>Customer Location</strong><br>
                ${customerAddress}<br>
                <span style="color: ${result.isWithinService ? '#10B981' : '#EF4444'}">
                  ${result.isWithinService ? '✓ Within service area' : '✗ Outside service area'}
                </span><br>
                Distance: ${mapboxService.formatDistance(result.distance.meters)}
              </div>
            `))

          // Draw route if within service area
          if (result.isWithinService) {
            const routeResult = await mapboxService.calculateRoute(
              centerResult.coordinates,
              result.coordinates
            )

            if (routeResult.success && map.getSource('route')) {
              map.removeLayer('route')
              map.removeSource('route')
            }

            if (routeResult.success) {
              map.addSource('route', {
                type: 'geojson',
                data: routeResult.geometry
              })

              map.addLayer({
                id: 'route',
                type: 'line',
                source: 'route',
                paint: {
                  'line-color': '#10B981',
                  'line-width': 3,
                  'line-opacity': 0.8
                }
              })
            }
          }
        }

        // Notify parent component
        if (onAddressValidation) {
          onAddressValidation({
            address: customerAddress,
            isWithinService: result.isWithinService,
            distance: result.distance,
            coordinates: result.coordinates
          })
        }

        toast.success(
          result.isWithinService 
            ? `Address is within service area (${mapboxService.formatDistance(result.distance.meters)})`
            : `Address is outside service area (${mapboxService.formatDistance(result.distance.meters)})`
        )
      } else {
        throw new Error(result.error)
      }
    } catch (error) {
      console.error('Address validation error:', error)
      toast.error(error.message || 'Failed to validate address')
      setIsWithinService(false)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-4">
      {/* Address Input */}
      <div className="bg-white p-4 rounded-lg shadow">
        <div className="flex space-x-4">
          <div className="flex-1">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Customer Address
            </label>
            <input
              type="text"
              value={customerAddress}
              onChange={(e) => setCustomerAddress(e.target.value)}
              placeholder="Enter customer address to check service area"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div className="flex items-end">
            <button
              onClick={checkCustomerAddress}
              disabled={loading || !mapLoaded}
              className="px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  <span>Checking...</span>
                </>
              ) : (
                <>
                  <MapPin size={16} />
                  <span>Check Address</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Service Area Status */}
      {isWithinService !== null && (
        <div className={`p-4 rounded-lg ${
          isWithinService 
            ? 'bg-green-50 border border-green-200' 
            : 'bg-red-50 border border-red-200'
        }`}>
          <div className="flex items-center space-x-3">
            {isWithinService ? (
              <CheckCircle className="text-green-500" size={20} />
            ) : (
              <AlertCircle className="text-red-500" size={20} />
            )}
            <div>
              <h4 className={`font-medium ${
                isWithinService ? 'text-green-800' : 'text-red-800'
              }`}>
                {isWithinService ? 'Within Service Area' : 'Outside Service Area'}
              </h4>
              {distance && (
                <p className={`text-sm ${
                  isWithinService ? 'text-green-600' : 'text-red-600'
                }`}>
                  Distance: {mapboxService.formatDistance(distance.meters)} from service center
                </p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Map Container */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="p-4 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold">Service Area Map</h3>
            <div className="flex items-center space-x-4 text-sm text-gray-600">
              <div className="flex items-center space-x-1">
                <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                <span>Service Center</span>
              </div>
              <div className="flex items-center space-x-1">
                <div className="w-3 h-3 bg-blue-200 rounded-full"></div>
                <span>{maxDistance}min Service Area</span>
              </div>
            </div>
          </div>
        </div>
        
        <div 
          ref={mapContainer} 
          className="h-96 w-full"
          style={{ minHeight: '400px' }}
        />
      </div>

      {/* Loading State */}
      {loading && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg shadow-lg">
            <div className="flex items-center space-x-3">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500"></div>
              <span>Loading map data...</span>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default ServiceAreaMap
