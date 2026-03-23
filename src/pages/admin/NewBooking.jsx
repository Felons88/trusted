import { useState, useEffect } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import { 
  ArrowLeft, Calendar, User, Car, DollarSign, Clock, Plus, Check, 
  AlertCircle, MapPin, Phone, Mail 
} from 'lucide-react'
import toast from 'react-hot-toast'
import { parseAddress } from '../../utils/addressParser'

function NewBooking() {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)
  const [step, setStep] = useState(1)
  const [formData, setFormData] = useState({
    client_id: '',
    vehicle_id: '',
    service_type: 'exterior',
    booking_date: '',
    booking_time: '',
    estimated_duration: 120,
    total_cost: 0,
    status: 'pending',
    notes: ''
  })

  const [clients, setClients] = useState([])
  const [vehicles, setVehicles] = useState([])
  const [services, setServices] = useState([])
  const [selectedClient, setSelectedClient] = useState(null)
  const [selectedVehicle, setSelectedVehicle] = useState(null)
  const [parsedAddress, setParsedAddress] = useState({
    street: '',
    city: '',
    state: '',
    zip: '',
    country: 'US'
  })
  const [existingBookings, setExistingBookings] = useState([])
  const [timeSlots, setTimeSlots] = useState([])
  const [loadingTimeSlots, setLoadingTimeSlots] = useState(false)

  useEffect(() => {
    loadData()
  }, [])

  useEffect(() => {
    if (formData.client_id) {
      const client = clients.find(c => c.id === formData.client_id)
      setSelectedClient(client)
      loadClientVehicles(formData.client_id)
      
      // Parse client address when selected
      if (client?.address) {
        parseAddress(client.address).then(parsed => {
          setParsedAddress(parsed)
        })
      }
    } else {
      setSelectedClient(null)
      setVehicles([])
      setParsedAddress({
        street: '',
        city: '',
        state: '',
        zip: '',
        country: 'US'
      })
    }
  }, [formData.client_id, clients])

  useEffect(() => {
    if (formData.vehicle_id) {
      const vehicle = vehicles.find(v => v.id === formData.vehicle_id)
      setSelectedVehicle(vehicle)
      calculatePrice()
    } else {
      setSelectedVehicle(null)
    }
  }, [formData.vehicle_id, vehicles, formData.service_type])

  const loadData = async () => {
    try {
      // Load clients
      try {
        const { data: clientsData, error: clientsError } = await supabase.from('clients').select('*')
        if (clientsError) throw clientsError
        setClients(clientsData || [])
      } catch (err) {
        console.error('Client loading error:', err)
        setClients([])
      }
      
      // Load vehicles
      try {
        const { data: vehiclesData, error: vehiclesError } = await supabase.from('vehicles').select('*').eq('is_active', true)
        if (vehiclesError) throw vehiclesError
        setVehicles(vehiclesData || [])
      } catch (err) {
        console.error('Vehicle loading error:', err)
        setVehicles([])
      }

      // Load services
      try {
        const { data: servicesData, error: servicesError } = await supabase.from('services').select('*')
        if (servicesError) throw servicesError
        setServices(servicesData || [])
      } catch (err) {
        console.error('Service loading error:', err)
        setServices([])
      }
    } catch (error) {
      console.error('General error loading data:', error)
      toast.error('Failed to load data')
    }
  }

  const loadClientVehicles = async (clientId) => {
    try {
      const { data } = await supabase
        .from('vehicles')
        .select('*')
        .eq('client_id', clientId)
        .eq('is_active', true)
      setVehicles(data || [])
    } catch (error) {
      console.error('Error loading vehicles:', error)
      setVehicles([])
    }
  }

  const calculatePrice = () => {
    // Only consider active services for pricing
    const activeServices = services.filter(s => s.is_active)
    const service = activeServices.find(s => s.name === formData.service_type)
    
    let basePrice = 50 // Default price if no service found
    
    if (service && selectedVehicle) {
      const size = selectedVehicle.vehicle_size || selectedVehicle.size
      switch (size) {
        case 'sedan':
          basePrice = service.base_price_sedan || 50
          break
        case 'suv':
          basePrice = service.base_price_suv || 50
          break
        case 'truck':
          basePrice = service.base_price_truck || 50
          break
        case 'van':
          basePrice = service.base_price_van || 50
          break
        default:
          basePrice = service.base_price_sedan || 50
      }
    } else if (service) {
      // Use sedan price as default if no vehicle selected
      basePrice = service.base_price_sedan || 50
    }
    
    setFormData(prev => ({ ...prev, total_cost: basePrice }))
  }

  const checkExistingBookings = async (date) => {
    if (!date) return

    try {
      const { data, error } = await supabase
        .from('bookings')
        .select('*')
        .eq('preferred_date', date)
        .in('status', ['pending', 'confirmed', 'in_progress'])

      if (error) throw error
      setExistingBookings(data || [])
    } catch (error) {
      console.error('Error checking existing bookings:', error)
      setExistingBookings([])
    }
  }

  const generateAvailableTimeSlots = () => {
    const baseTimeSlots = [
      '09:00', '09:30', '10:00', '10:30', '11:00', '11:30',
      '12:00', '12:30', '13:00', '13:30', '14:00', '14:30',
      '15:00', '15:30', '16:00', '16:30', '17:00'
    ]

    if (!formData.booking_date || existingBookings.length === 0) {
      setTimeSlots(baseTimeSlots)
      return
    }

    const availableSlots = []
    const bookingDuration = formData.estimated_duration || 120 // minutes
    const bufferTime = 120 // 120 minutes between bookings

    for (const timeSlot of baseTimeSlots) {
      const slotDateTime = new Date(`${formData.booking_date}T${timeSlot}:00`)
      const slotEndTime = new Date(slotDateTime.getTime() + bookingDuration * 60000)

      let isAvailable = true

      for (const existingBooking of existingBookings) {
        if (!existingBooking.preferred_time) continue

        const existingStartTime = new Date(`${formData.booking_date}T${existingBooking.preferred_time}:00`)
        const existingEndTime = new Date(existingStartTime.getTime() + (existingBooking.estimated_duration || 120) * 60000)

        // Check if current slot conflicts with existing booking
        // Add buffer time before and after existing bookings
        const bufferedStartTime = new Date(existingStartTime.getTime() - bufferTime * 60000)
        const bufferedEndTime = new Date(existingEndTime.getTime() + bufferTime * 60000)

        if (
          (slotDateTime < bufferedEndTime && slotEndTime > bufferedStartTime) ||
          (slotDateTime.getTime() === existingStartTime.getTime()) // Exact match
        ) {
          isAvailable = false
          break
        }
      }

      if (isAvailable) {
        availableSlots.push(timeSlot)
      }
    }

    setTimeSlots(availableSlots)
  }

  // Load existing bookings and generate time slots when date changes
  useEffect(() => {
    if (formData.booking_date) {
      setLoadingTimeSlots(true)
      checkExistingBookings(formData.booking_date).then(() => {
        generateAvailableTimeSlots()
        setLoadingTimeSlots(false)
      })
    } else {
      setExistingBookings([])
      setTimeSlots([
        '09:00', '09:30', '10:00', '10:30', '11:00', '11:30',
        '12:00', '12:30', '13:00', '13:30', '14:00', '14:30',
        '15:00', '15:30', '16:00', '16:30', '17:00'
      ])
    }
  }, [formData.booking_date, formData.estimated_duration])

  // Regenerate time slots when duration changes
  useEffect(() => {
    if (formData.booking_date) {
      generateAvailableTimeSlots()
    }
  }, [formData.estimated_duration])

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    if (!formData.client_id || !formData.vehicle_id || !formData.booking_date || !formData.booking_time) {
      toast.error('Please fill in all required fields')
      return
    }

    setLoading(true)
    
    try {
      // Generate booking number
      const bookingNumber = `BK-${Date.now()}`
      
      const { data, error } = await supabase
        .from('bookings')
        .insert({
          client_id: formData.client_id,
          vehicle_id: formData.vehicle_id,
          service_id: services.find(s => s.name === formData.service_type)?.id,
          service_type: formData.service_type,
          vehicle_size: selectedVehicle?.vehicle_size || 'sedan',
          service_address: selectedClient?.address || 'TBD',
          service_city: parsedAddress.city,
          service_state: parsedAddress.state,
          service_zip: parsedAddress.zip,
          subtotal: formData.total_cost,
          booking_number: bookingNumber,
          preferred_date: formData.booking_date,
          preferred_time: formData.booking_time,
          total_cost: formData.total_cost,
          status: formData.status,
          notes: formData.notes,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .select()
        .single()

      if (error) throw error

      toast.success('Booking created successfully!')
      navigate(`/admin/bookings/${data.id}`)
    } catch (error) {
      console.error('Error creating booking:', error)
      toast.error('Failed to create booking')
    } finally {
      setLoading(false)
    }
  }

  const getStatusIcon = (status) => {
    const icons = {
      pending: <Clock className="w-4 h-4" />,
      confirmed: <CheckCircle className="w-4 h-4" />,
      in_progress: <AlertCircle className="w-4 h-4" />,
      completed: <CheckCircle className="w-4 h-4" />,
      cancelled: <XCircle className="w-4 h-4" />
    }
    return icons[status] || <Clock className="w-4 h-4" />
  }

  const getStatusColor = (status) => {
    const colors = {
      pending: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
      confirmed: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
      in_progress: 'bg-purple-500/20 text-purple-400 border-purple-500/30',
      completed: 'bg-green-500/20 text-green-400 border-green-500/30',
      cancelled: 'bg-red-500/20 text-red-400 border-red-500/30'
    }
    return colors[status] || colors.pending
  }

  const getServiceTypes = () => {
    const activeServices = services.filter(s => s.is_active)
    return activeServices.map(service => {
      let price = 50 // Default price
      
      if (selectedVehicle) {
        const size = selectedVehicle.vehicle_size || selectedVehicle.size
        switch (size) {
          case 'sedan':
            price = service.base_price_sedan || 50
            break
          case 'suv':
            price = service.base_price_suv || 50
            break
          case 'truck':
            price = service.base_price_truck || 50
            break
          case 'van':
            price = service.base_price_van || 50
            break
          default:
            price = service.base_price_sedan || 50
        }
      } else {
        // Use sedan price as default
        price = service.base_price_sedan || 50
      }

      return {
        value: service.name,
        label: service.name.charAt(0).toUpperCase() + service.name.slice(1),
        price: price
      }
    })
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-electric-blue"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Link
            to="/admin/bookings"
            className="text-light-gray hover:text-electric-blue transition-colors"
          >
            <ArrowLeft size={24} />
          </Link>
          <div>
            <h1 className="text-3xl font-bold text-light-gray">New Booking</h1>
            <p className="text-light-gray">Create a new booking appointment</p>
          </div>
        </div>
        
        <Link to="/admin/bookings/new" className="btn-primary flex items-center space-x-2">
          <Plus size={16} />
          <span>New Booking</span>
        </Link>
      </div>

      {/* Progress Steps */}
      <div className="glass-card p-6">
        <div className="flex items-center justify-between mb-8">
          {[1, 2, 3].map((stepNumber) => (
            <div key={stepNumber} className="flex items-center">
              <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                step >= stepNumber 
                  ? 'bg-electric-blue text-white' 
                  : 'bg-navy-light text-light-gray'
              }`}>
                {step > stepNumber ? <Check size={20} /> : stepNumber}
              </div>
              {stepNumber < 3 && (
                <div className={`w-24 h-1 mx-4 ${
                  step > stepNumber ? 'bg-electric-blue' : 'bg-navy-light'
                }`} />
              )}
            </div>
          ))}
        </div>

        <div className="grid grid-cols-3 gap-4 text-center">
          <div className={`text-sm ${step >= 1 ? 'text-electric-blue font-medium' : 'text-light-gray'}`}>
            Select Client & Vehicle
          </div>
          <div className={`text-sm ${step >= 2 ? 'text-electric-blue font-medium' : 'text-light-gray'}`}>
            Choose Service & Time
          </div>
          <div className={`text-sm ${step >= 3 ? 'text-electric-blue font-medium' : 'text-light-gray'}`}>
            Review & Confirm
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Step 1: Client & Vehicle Selection */}
        {step === 1 && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Client Selection */}
            <div className="glass-card p-6">
              <h3 className="text-xl font-bold text-light-gray mb-4 flex items-center">
                <User className="text-electric-blue mr-3" size={24} />
                Select Client
              </h3>
              
              <div className="space-y-4">
                <div className="relative">
                  <select
                    value={formData.client_id}
                    onChange={(e) => setFormData(prev => ({ ...prev, client_id: e.target.value }))}
                    className="admin-select"
                    required
                  >
                    <option value="">Choose a client...</option>
                    {clients.map(client => (
                      <option key={client.id} value={client.id}>
                        {client.full_name} - {client.email}
                      </option>
                    ))}
                  </select>
                  
                  {clients.length === 0 && (
                    <div className="mt-3 p-3 bg-yellow-500/20 border border-yellow-500/30 rounded-lg">
                      <div className="flex items-center text-yellow-400 text-sm">
                        <AlertCircle className="mr-2" size={16} />
                        No clients found
                      </div>
                      <p className="text-light-gray text-sm mt-1">
                        You need to create clients first before making bookings.
                      </p>
                      <Link
                        to="/admin/clients/new"
                        className="inline-block mt-2 text-electric-blue hover:text-bright-cyan text-sm"
                      >
                        Create New Client →
                      </Link>
                    </div>
                  )}
                </div>

                {selectedClient && (
                  <div className="bg-navy-light/30 rounded-lg p-4 border border-electric-blue/20">
                    <h4 className="font-semibold text-light-gray mb-2">Client Details</h4>
                    <div className="space-y-2">
                      <div className="flex items-center text-sm text-light-gray">
                        <Mail className="mr-2" size={14} />
                        {selectedClient.email}
                      </div>
                      {selectedClient.phone && (
                        <div className="flex items-center text-sm text-light-gray">
                          <Phone className="mr-2" size={14} />
                          {selectedClient.phone}
                        </div>
                      )}
                      {selectedClient.address && (
                        <div className="flex items-center text-sm text-light-gray">
                          <MapPin className="mr-2" size={14} />
                          {selectedClient.address}
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Vehicle Selection */}
            <div className="glass-card p-6">
              <h3 className="text-xl font-bold text-light-gray mb-4 flex items-center">
                <Car className="text-electric-blue mr-3" size={24} />
                Select Vehicle
              </h3>
              
              <div className="space-y-4">
                <div className="relative">
                  <select
                    value={formData.vehicle_id}
                    onChange={(e) => setFormData(prev => ({ ...prev, vehicle_id: e.target.value }))}
                    className="admin-select"
                    required
                    disabled={!formData.client_id}
                  >
                    <option value="">Choose a vehicle...</option>
                    {vehicles.map(vehicle => (
                      <option key={vehicle.id} value={vehicle.id}>
                        {vehicle.year} {vehicle.make} {vehicle.model} - {vehicle.license_plate}
                      </option>
                    ))}
                  </select>
                  {!formData.client_id && (
                    <p className="text-sm text-light-gray mt-2">Select a client first</p>
                  )}
                </div>

                {selectedVehicle && (
                  <div className="bg-navy-light/30 rounded-lg p-4 border border-electric-blue/20">
                    <h4 className="font-semibold text-light-gray mb-2">Vehicle Details</h4>
                    <div className="space-y-1">
                      <p className="text-sm text-light-gray">
                        {selectedVehicle.year} {selectedVehicle.make} {selectedVehicle.model}
                      </p>
                      <p className="text-sm text-light-gray">
                        Color: {selectedVehicle.color} • Size: {selectedVehicle.vehicle_size}
                      </p>
                      {selectedVehicle.license_plate && (
                        <p className="text-sm text-light-gray">Plate: {selectedVehicle.license_plate}</p>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Step 2: Service & Time Selection */}
        {step === 2 && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Service Selection */}
            <div className="glass-card p-6">
              <h3 className="text-xl font-bold text-light-gray mb-4 flex items-center">
                <DollarSign className="text-electric-blue mr-3" size={24} />
                Select Service
              </h3>
              
              <div className="space-y-3">
                {getServiceTypes().map(service => (
                  <label
                    key={service.value}
                    className="block bg-navy-light/30 rounded-lg p-4 border border-electric-blue/20 cursor-pointer hover:bg-navy-light/50 transition-colors"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center">
                        <input
                          type="radio"
                          name="service_type"
                          value={service.value}
                          checked={formData.service_type === service.value}
                          onChange={(e) => setFormData(prev => ({ ...prev, service_type: e.target.value }))}
                          className="mr-3"
                        />
                        <span className="text-light-gray font-medium">{service.label}</span>
                      </div>
                      <span className="text-green-400 font-semibold">${service.price}</span>
                    </div>
                  </label>
                ))}
              </div>
            </div>

            {/* Date & Time Selection */}
            <div className="glass-card p-6">
              <h3 className="text-xl font-bold text-light-gray mb-4 flex items-center">
                <Calendar className="text-electric-blue mr-3" size={24} />
                Select Date & Time
              </h3>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm text-light-gray mb-2">Date</label>
                  <input
                    type="date"
                    value={formData.booking_date}
                    onChange={(e) => setFormData(prev => ({ ...prev, booking_date: e.target.value }))}
                    className="admin-input"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm text-light-gray mb-2">Time</label>
                  {loadingTimeSlots ? (
                    <div className="flex items-center justify-center py-4">
                      <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-electric-blue mr-2"></div>
                      <span className="text-sm text-light-gray">Checking availability...</span>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {timeSlots.length === 0 ? (
                        <div className="text-center py-4 px-3 bg-red-500/20 border border-red-500/30 rounded-lg">
                          <p className="text-sm text-red-400">No available time slots for this date</p>
                          <p className="text-xs text-red-300 mt-1">Try a different date or adjust duration</p>
                        </div>
                      ) : (
                        <div className="grid grid-cols-3 gap-2">
                          {timeSlots.map(time => (
                            <button
                              key={time}
                              type="button"
                              onClick={() => setFormData(prev => ({ ...prev, booking_time: time }))}
                              className={`py-2 px-3 rounded-lg border text-sm transition-colors ${
                                formData.booking_time === time
                                  ? 'bg-electric-blue text-white border-electric-blue'
                                  : 'bg-navy-light/30 text-light-gray border-electric-blue/20 hover:bg-navy-light/50'
                              }`}
                            >
                              {time}
                            </button>
                          ))}
                        </div>
                      )}
                      {existingBookings.length > 0 && (
                        <div className="text-xs text-light-gray/60 mt-2">
                          <p>⚠️ Some time slots are unavailable due to existing bookings</p>
                          <p>120-minute buffer time is automatically applied</p>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Step 3: Review & Confirm */}
        {step === 3 && (
          <div className="glass-card p-6">
            <h3 className="text-xl font-bold text-light-gray mb-6">Review Booking Details</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h4 className="font-semibold text-light-gray mb-3">Client & Vehicle</h4>
                <div className="space-y-2 text-sm">
                  <p className="text-light-gray">
                    <span className="font-medium">Client:</span> {selectedClient?.full_name}
                  </p>
                  <p className="text-light-gray">
                    <span className="font-medium">Vehicle:</span> {selectedVehicle?.year} {selectedVehicle?.make} {selectedVehicle?.model}
                  </p>
                  {selectedVehicle?.license_plate && (
                    <p className="text-light-gray">
                      <span className="font-medium">Plate:</span> {selectedVehicle.license_plate}
                    </p>
                  )}
                </div>
              </div>

              <div>
                <h4 className="font-semibold text-light-gray mb-3">Service Details</h4>
                <div className="space-y-2 text-sm">
                  <p className="text-light-gray">
                    <span className="font-medium">Service:</span> {getServiceTypes().find(s => s.value === formData.service_type)?.label}
                  </p>
                  <p className="text-light-gray">
                    <span className="font-medium">Date:</span> {new Date(formData.booking_date).toLocaleDateString()}
                  </p>
                  <p className="text-light-gray">
                    <span className="font-medium">Time:</span> {formData.booking_time}
                  </p>
                  <p className="text-light-gray">
                    <span className="font-medium">Duration:</span> {formData.estimated_duration} minutes
                  </p>
                </div>
              </div>
            </div>

            <div className="mt-6 pt-6 border-t border-navy-light">
              <div className="flex items-center justify-between">
                <span className="text-lg font-semibold text-light-gray">Total Price:</span>
                <span className="text-2xl font-bold text-green-400">
                  ${formData.total_cost.toFixed(2)}
                </span>
              </div>
            </div>

            <div className="mt-6">
              <label className="block text-sm text-light-gray mb-2">Notes (optional)</label>
              <textarea
                value={formData.notes}
                onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                className="admin-input"
                rows={3}
                placeholder="Add any special instructions or notes..."
              />
            </div>
          </div>
        )}

        {/* Navigation Buttons */}
        <div className="flex items-center justify-between">
          {step > 1 && (
            <button
              type="button"
              onClick={() => setStep(step - 1)}
              className="btn-secondary"
            >
              Previous
            </button>
          )}
          
          <div className="flex space-x-3 ml-auto">
            {step < 3 ? (
              <button
                type="button"
                onClick={() => {
                  if (step === 1 && (!formData.client_id || !formData.vehicle_id)) {
                    toast.error('Please select client and vehicle')
                    return
                  }
                  if (step === 2 && (!formData.booking_date || !formData.booking_time)) {
                    toast.error('Please select date and time')
                    return
                  }
                  setStep(step + 1)
                }}
                className="btn-primary"
              >
                Next
              </button>
            ) : (
              <button
                type="submit"
                disabled={loading}
                className="btn-primary"
              >
                {loading ? 'Creating...' : 'Create Booking'}
              </button>
            )}
          </div>
        </div>
      </form>
    </div>
  )
}

export default NewBooking
