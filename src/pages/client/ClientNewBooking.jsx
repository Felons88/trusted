import { useState, useEffect } from 'react'
import { useNavigate, Link, useLocation } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import { useAuthStore } from '../../store/authStore'
import { 
  ArrowLeft, Calendar, Car, DollarSign, Clock, Plus, Check, 
  AlertCircle, MapPin, Sparkles, X
} from 'lucide-react'
import toast from 'react-hot-toast'
import { carMakes, carModels, carYears } from '../../data/carData'

function ClientNewBooking() {
  const navigate = useNavigate()
  const location = useLocation()
  const { user } = useAuthStore()
  const [loading, setLoading] = useState(false)
  const [step, setStep] = useState(1)
  const [clientData, setClientData] = useState(null)
  const [vehicles, setVehicles] = useState([])
  const [services, setServices] = useState([])
  const [addons, setAddons] = useState([])
  const [selectedVehicle, setSelectedVehicle] = useState(null)
  const [selectedService, setSelectedService] = useState(null)
  const [selectedAddons, setSelectedAddons] = useState([])
  const [timeSlots, setTimeSlots] = useState([])
  const [loadingTimeSlots, setLoadingTimeSlots] = useState(false)
  const [showAddonsModal, setShowAddonsModal] = useState(false)

  const [formData, setFormData] = useState({
    vehicle_id: '',
    service_type: 'exterior',
    booking_date: '',
    booking_time: '',
    service_location: 'mobile', // 'mobile' or 'shop'
    notes: ''
  })

  useEffect(() => {
    console.log('ClientNewBooking useEffect triggered, user:', user?.id)
    if (user) {
      console.log('User exists, calling loadClientData')
      loadClientData()
    } else {
      console.log('No user found')
    }
  }, [user])

  useEffect(() => {
    if (clientData) {
      loadVehicles()
      loadServices()
      loadAddons()
    }
  }, [clientData])

  useEffect(() => {
    // Handle location state for auto-selecting vehicle
    if (vehicles.length > 0 && location.state?.vehicleId) {
      const vehicleId = location.state.vehicleId
      const vehicle = vehicles.find(v => v.id === vehicleId)
      
      if (vehicle) {
        setSelectedVehicle(vehicle)
        setFormData(prev => ({ ...prev, vehicle_id: vehicleId }))
        
        // If skipVehicleSelection is true, jump to service selection step
        if (location.state?.skipVehicleSelection) {
          setStep(2) // Skip to service selection
        }
      }
    }
  }, [vehicles, location.state])

  const loadClientData = async () => {
    try {
      console.log('Loading client data for user:', user?.id)
      const { data: clients, error } = await supabase
        .from('clients')
        .select('*')
        .eq('user_id', user.id)

      if (error) {
        console.error('Client query error:', error)
        toast.error('Error loading client data')
        return
      }

      console.log('Found clients:', clients?.length || 0)
      if (clients && clients.length > 0) {
        console.log('Setting client data:', clients[0])
        setClientData(clients[0])
      } else {
        console.error('No client found for user:', user?.id)
        toast.error('No client data found')
      }
    } catch (error) {
      console.error('Error loading client data:', error)
      toast.error('Error loading client data')
    }
  }

  const loadVehicles = async () => {
    try {
      const { data: vehiclesData } = await supabase
        .from('vehicles')
        .select('*')
        .eq('client_id', clientData.id)
        .order('created_at', { ascending: false })

      setVehicles(vehiclesData || [])
    } catch (error) {
      console.error('Error loading vehicles:', error)
      toast.error('Error loading vehicles')
    }
  }

  const loadServices = async () => {
    try {
      const { data: servicesData } = await supabase
        .from('services')
        .select('*')
        .eq('is_active', true)
        .order('name', { ascending: true })

      setServices(servicesData || [])
    } catch (error) {
      console.error('Error loading services:', error)
      toast.error('Error loading services')
    }
  }

  const loadAddons = async () => {
    try {
      console.log('Loading addons from Supabase')
      const { data: addonsData, error } = await supabase
        .from('addons')
        .select('*')
        .eq('is_active', true)
        .order('sort_order', { ascending: true })

      if (error) {
        console.error('Addons query error:', error)
        toast.error('Error loading addons')
        return
      }

      console.log('Loaded addons:', addonsData?.length || 0)
      setAddons(addonsData || [])
    } catch (error) {
      console.error('Error loading addons:', error)
      toast.error('Error loading addons')
    }
  }

  const handleVehicleSelect = (vehicleId) => {
    const vehicle = vehicles.find(v => v.id === vehicleId)
    setSelectedVehicle(vehicle)
    setFormData(prev => ({ ...prev, vehicle_id: vehicleId }))
  }

  const handleServiceSelect = (service) => {
    setSelectedService(service)
    // Map service name to enum value
    let serviceTypeEnum = 'exterior' // default
    if (service.name.toLowerCase().includes('interior')) {
      serviceTypeEnum = 'interior'
    } else if (service.name.toLowerCase().includes('full') || service.name.toLowerCase().includes('complete')) {
      serviceTypeEnum = 'full_detail'
    } else if (service.name.toLowerCase().includes('ceramic') || service.name.toLowerCase().includes('coating')) {
      serviceTypeEnum = 'ceramic_coating'
    }
    setFormData(prev => ({ ...prev, service_type: serviceTypeEnum }))
  }

  const toggleAddon = (addon) => {
    setSelectedAddons(prev => {
      const isSelected = prev.some(a => a.id === addon.id)
      if (isSelected) {
        return prev.filter(a => a.id !== addon.id)
      } else {
        return [...prev, addon]
      }
    })
  }

  const handleDateChange = (date) => {
    console.log('handleDateChange called with:', date)
    setFormData(prev => ({ ...prev, booking_date: date, booking_time: '' }))
    if (date) {
      console.log('Calling loadTimeSlots with date:', date)
      loadTimeSlots(date)
    }
  }

  const loadTimeSlots = async (date) => {
    console.log('loadTimeSlots called with date:', date)
    setLoadingTimeSlots(true)
    try {
      // Generate time slots from 8 AM to 6 PM
      const slots = []
      const now = new Date()
      const selectedDate = new Date(date + 'T00:00:00') // Ensure proper date parsing
      const isToday = selectedDate.toDateString() === now.toDateString()
      
      console.log('Current time:', now)
      console.log('Selected date:', selectedDate)
      console.log('Is today:', isToday)
      
      for (let hour = 8; hour <= 18; hour++) {
        for (let minute = 0; minute < 60; minute += 30) {
          const time = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`
          
          // Skip past times if it's today
          if (isToday) {
            const slotTime = new Date()
            slotTime.setHours(hour, minute, 0, 0)
            
            console.log('Checking time:', time, 'slotTime:', slotTime, 'now:', now)
            
            if (slotTime <= now) {
              console.log('Skipping past time:', time)
              continue // Skip this time slot
            }
          }
          
          slots.push({ time, available: true })
        }
      }
      
      console.log('Generated slots before booking check:', slots.map(s => s.time))
      
      // Check for existing bookings on the selected date
      const { data: existingBookings, error } = await supabase
        .from('bookings')
        .select('preferred_time, status')
        .eq('preferred_date', date)
        .in('status', ['pending', 'confirmed'])
      
      if (error) {
        console.error('Error checking existing bookings:', error)
        // Still show available slots even if booking check fails
      }
      
      console.log('Existing bookings:', existingBookings)
      
      // Mark unavailable times
      if (existingBookings && existingBookings.length > 0) {
        const bookedTimes = existingBookings.map(booking => booking.preferred_time)
        console.log('Booked times:', bookedTimes)
        slots.forEach(slot => {
          if (bookedTimes.includes(slot.time)) {
            slot.available = false
          }
        })
      }
      
      console.log('Final slots:', slots)
      setTimeSlots(slots)
    } catch (error) {
      console.error('Error loading time slots:', error)
      toast.error('Error loading available times')
      // Set some default slots even on error
      const defaultSlots = []
      for (let hour = 8; hour <= 18; hour++) {
        for (let minute = 0; minute < 60; minute += 30) {
          const time = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`
          defaultSlots.push({ time, available: true })
        }
      }
      setTimeSlots(defaultSlots)
    } finally {
      console.log('Setting loadingTimeSlots to false')
      setLoadingTimeSlots(false)
    }
  }

  const handleTimeSelect = (time) => {
    setFormData(prev => ({ ...prev, booking_time: time }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    if (!formData.vehicle_id || !formData.service_type || !formData.booking_date || !formData.booking_time) {
      toast.error('Please fill in all required fields')
      return
    }

    setLoading(true)
    try {
      // Calculate correct pricing
      let totalCost = 0
      let serviceDuration = 120
      
      // Determine vehicle size
      const vehicleSize = selectedVehicle.size || 'sedan'
      
      // Calculate service price based on vehicle size
      if (selectedService) {
        if (vehicleSize === 'suv') {
          totalCost += parseFloat(selectedService.base_price_suv || 0)
        } else if (vehicleSize === 'truck') {
          totalCost += parseFloat(selectedService.base_price_truck || 0)
        } else {
          totalCost += parseFloat(selectedService.base_price_sedan || 0)
        }
      } else {
        // Fallback pricing
        const servicePrices = {
          'exterior': { sedan: 100, suv: 120, truck: 140 },
          'interior': { sedan: 80, suv: 100, truck: 120 },
          'full': { sedan: 150, suv: 180, truck: 210 }, // Changed from 'full_detail' to 'full'
          'ceramic_coating': { sedan: 300, suv: 400, truck: 500 }
        }
        const serviceType = formData.service_type === 'full_detail' ? 'full' : formData.service_type || 'exterior'
        totalCost = servicePrices[serviceType]?.[vehicleSize] || 100
      }
      
      // Add addon prices and durations
      if (selectedAddons.length > 0) {
        selectedAddons.forEach(addon => {
          totalCost += parseFloat(addon.price || 0)
          serviceDuration += parseInt(addon.duration_minutes || 0)
        })
      }

      // Calculate sales tax (6.875%)
      const taxRate = 0.06875
      const taxAmount = totalCost * taxRate
      const totalWithTax = totalCost + taxAmount

      const bookingData = {
        client_id: clientData.id,
        vehicle_id: formData.vehicle_id,
        service_id: selectedService?.id || null, // Add service ID
        vehicle_size: vehicleSize,
        service_type: formData.service_type === 'full_detail' ? 'full' : formData.service_type, // Fix enum value
        service_address: formData.service_location === 'mobile' ? clientData.address : '329 Morton Ave, Elk River, MN 55330',
        service_location: formData.service_location,
        subtotal: totalCost, // Use calculated total without tax
        tax: taxAmount.toFixed(2), // Add calculated tax
        total: totalWithTax, // Use total with tax
        preferred_date: formData.booking_date,
        preferred_time: formData.booking_time,
        status: 'pending',
        notes: formData.notes,
        estimated_duration: serviceDuration,
        created_at: new Date().toISOString()
      }

      console.log('Submitting booking:', bookingData)
      console.log('Subtotal:', totalCost, 'Tax:', taxAmount.toFixed(2), 'Total:', totalWithTax)

      // Insert booking
      const { data: bookingResult, error: bookingError } = await supabase
        .from('bookings')
        .insert([bookingData])
        .select()
        .single()

      if (bookingError) throw bookingError

      // Insert booking_addons if any were selected
      if (selectedAddons.length > 0) {
        const bookingAddonsData = selectedAddons.map(addon => {
          const price = parseFloat(addon.price || 0)
          console.log('Processing addon for insertion:', addon, 'price:', price)
          
          return {
            booking_id: bookingResult.id,
            addon_id: addon.id,
            price_at_booking: price // Ensure price is a number, not null
          }
        })

        console.log('Inserting booking addons:', bookingAddonsData)

        const { error: addonsError } = await supabase
          .from('booking_addons')
          .insert(bookingAddonsData)

        if (addonsError) {
          console.error('Error inserting booking addons:', addonsError)
          // Don't throw error - booking was created successfully
        } else {
          console.log('Successfully inserted booking addons')
        }
      } else {
        console.log('No addons selected, skipping booking_addons insertion')
      }

      toast.success('Booking request submitted successfully!')
      navigate('/client-portal/bookings')
    } catch (error) {
      console.error('Error creating booking:', error)
      toast.error('Error creating booking')
    } finally {
      setLoading(false)
    }
  }

  if (!clientData) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 flex items-center justify-center">
        <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-electric-blue"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <Link 
            to="/client-portal" 
            className="inline-flex items-center gap-2 text-light-gray hover:text-metallic-silver mb-6 transition-colors"
          >
            <ArrowLeft size={20} />
            <span>Back to Dashboard</span>
          </Link>
          <h1 className="text-3xl font-bold text-white mb-2">Book Appointment</h1>
          <p className="text-light-gray">Schedule your mobile detailing service</p>
        </div>

        {/* Progress Steps */}
        <div className="flex items-center justify-between mb-8">
          {[1, 2, 3, 4].map((stepNum) => (
            <div key={stepNum} className="flex items-center">
              <div className={`w-8 h-8 sm:w-10 sm:h-10 rounded-full flex items-center justify-center text-xs sm:text-sm ${
                step >= stepNum ? 'bg-electric-blue text-white' : 'bg-navy-dark text-light-gray'
              }`}>
                {step > stepNum ? <Check size={14} /> : stepNum}
              </div>
              {stepNum < 4 && (
                <div className={`w-8 sm:w-16 h-1 mx-1 sm:mx-2 ${
                  step > stepNum ? 'bg-electric-blue' : 'bg-navy-dark'
                }`} />
              )}
            </div>
          ))}
        </div>

        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Step 1: Select Vehicle */}
          {step === 1 && (
            <div className="bg-navy-dark/30 backdrop-blur-xl rounded-2xl p-6 border border-electric-blue/20">
              <h2 className="text-xl font-bold text-white mb-6">Select Your Vehicle</h2>
              
              {vehicles.length === 0 ? (
                <div className="text-center py-8">
                  <Car className="mx-auto h-12 w-12 text-light-gray mb-4" />
                  <p className="text-light-gray mb-4">No vehicles found</p>
                  <Link 
                    to="/client-portal/vehicles/add"
                    className="inline-flex items-center gap-2 px-4 py-2 bg-electric-blue hover:bg-electric-blue/90 rounded-lg text-white font-semibold transition-colors"
                  >
                    <Plus size={16} />
                    Add Vehicle
                  </Link>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {vehicles.map((vehicle) => (
                    <div
                      key={vehicle.id}
                      onClick={() => handleVehicleSelect(vehicle.id)}
                      className={`p-4 rounded-lg border-2 cursor-pointer transition-all ${
                        selectedVehicle?.id === vehicle.id
                          ? 'border-electric-blue bg-electric-blue/10'
                          : 'border-navy-dark hover:border-electric-blue/50'
                      }`}
                    >
                      <div className="flex items-start justify-between">
                        <div>
                          <p className="font-semibold text-white">
                            {vehicle.year} {vehicle.make} {vehicle.model}
                          </p>
                          <p className="text-light-gray text-sm">
                            {vehicle.color} • {vehicle.vehicle_size}
                          </p>
                          {vehicle.license_plate && (
                            <p className="text-light-gray text-sm">
                              Plate: {vehicle.license_plate}
                            </p>
                          )}
                        </div>
                        <Car className="h-8 w-8 text-electric-blue" />
                      </div>
                    </div>
                  ))}
                </div>
              )}

              <div className="flex justify-end mt-6">
                <button
                  type="button"
                  onClick={() => setStep(2)}
                  disabled={!selectedVehicle}
                  className="px-6 py-3 bg-electric-blue hover:bg-electric-blue/90 disabled:bg-navy-dark disabled:text-light-gray rounded-lg text-white font-semibold transition-colors"
                >
                  Next
                </button>
              </div>
            </div>
          )}

          {/* Step 2: Select Service */}
          {step === 2 && (
            <div className="bg-navy-dark/30 backdrop-blur-xl rounded-2xl p-6 border border-electric-blue/20">
              <h2 className="text-xl font-bold text-white mb-6">Select Service</h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {services.map((service) => (
                  <div
                    key={service.id}
                    onClick={() => handleServiceSelect(service)}
                    className={`p-4 rounded-lg border-2 cursor-pointer transition-all ${
                      selectedService?.id === service.id
                        ? 'border-electric-blue bg-electric-blue/10'
                        : 'border-navy-dark hover:border-electric-blue/50'
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="font-semibold text-white">{service.name}</p>
                        <p className="text-light-gray text-sm mb-2">{service.description}</p>
                        <p className="text-electric-blue font-semibold">
                          {service.base_price_sedan ? `$${service.base_price_sedan}` : 'Price varies'} • {service.duration_minutes}min
                        </p>
                      </div>
                      <Sparkles className="h-8 w-8 text-electric-blue" />
                    </div>
                  </div>
                ))}
              </div>

              <div className="flex justify-between mt-6">
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className="px-6 py-3 bg-navy-dark hover:bg-navy-dark/70 rounded-lg text-white font-semibold transition-colors"
                >
                  Back
                </button>
                <button
                  type="button"
                  onClick={() => setStep(3)}
                  disabled={!selectedService}
                  className="px-6 py-3 bg-electric-blue hover:bg-electric-blue/90 disabled:bg-navy-dark disabled:text-light-gray rounded-lg text-white font-semibold transition-colors"
                >
                  Next: Date & Time
                </button>
              </div>
            </div>
          )}

          {/* Step 3: Select Date & Time */}
          {step === 3 && (
            <div className="bg-navy-dark/30 backdrop-blur-xl rounded-2xl p-4 sm:p-6 border border-electric-blue/20">
              <h2 className="text-xl font-bold text-white mb-6">Select Date & Time</h2>
              
              {/* Add-ons Prompt */}
              <div className="bg-electric-blue/10 border border-electric-blue/30 rounded-lg p-4 mb-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-semibold text-white mb-1">Enhance your service</h3>
                    <p className="text-sm text-light-gray">Would you like to add premium services to your booking?</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setShowAddonsModal(true)}
                    className="px-4 py-2 bg-electric-blue hover:bg-electric-blue/90 rounded-lg text-white font-medium transition-colors text-sm"
                  >
                    View Add-ons
                  </button>
                </div>
                {selectedAddons.length > 0 && (
                  <div className="mt-3 pt-3 border-t border-electric-blue/20">
                    <p className="text-sm text-electric-blue">
                      {selectedAddons.length} add-on{selectedAddons.length > 1 ? 's' : ''} selected (+${selectedAddons.reduce((sum, addon) => sum + parseFloat(addon.price), 0).toFixed(2)})
                    </p>
                  </div>
                )}
              </div>
              
              <div className="space-y-6">
                {/* Service Location */}
                <div>
                  <label className="block text-sm font-medium text-light-gray mb-2">
                    <MapPin className="inline h-4 w-4 mr-1" />
                    Service Location
                  </label>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <label className="relative">
                      <input
                        type="radio"
                        name="service_location"
                        value="mobile"
                        checked={formData.service_location === 'mobile'}
                        onChange={(e) => setFormData(prev => ({ ...prev, service_location: e.target.value }))}
                        className="peer sr-only"
                      />
                      <div className="p-4 border-2 rounded-lg cursor-pointer transition-all peer-checked:border-electric-blue peer-checked:bg-electric-blue/10 border-navy-dark hover:border-electric-blue/50">
                        <div className="flex items-center">
                          <Car className="h-5 w-5 text-electric-blue mr-3" />
                          <div>
                            <p className="font-semibold text-white">Mobile Service</p>
                            <p className="text-sm text-light-gray">We come to your location</p>
                          </div>
                        </div>
                      </div>
                    </label>
                    <label className="relative">
                      <input
                        type="radio"
                        name="service_location"
                        value="shop"
                        checked={formData.service_location === 'shop'}
                        onChange={(e) => setFormData(prev => ({ ...prev, service_location: e.target.value }))}
                        className="peer sr-only"
                      />
                      <div className="p-4 border-2 rounded-lg cursor-pointer transition-all peer-checked:border-electric-blue peer-checked:bg-electric-blue/10 border-navy-dark hover:border-electric-blue/50">
                        <div className="flex items-center">
                          <MapPin className="h-5 w-5 text-electric-blue mr-3" />
                          <div>
                            <p className="font-semibold text-white">Shop Location</p>
                            <p className="text-sm text-light-gray">329 Morton Ave, Elk River, MN 55330</p>
                          </div>
                        </div>
                      </div>
                    </label>
                  </div>
                </div>

                {/* Date and Time */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-light-gray mb-2">
                      <Calendar className="inline h-4 w-4 mr-1" />
                      Preferred Date
                    </label>
                    <input
                      type="date"
                      value={formData.booking_date}
                      onChange={(e) => {
                        console.log('Date changed to:', e.target.value)
                        handleDateChange(e.target.value)
                      }}
                      min={new Date().toISOString().split('T')[0]}
                      className="w-full px-4 py-3 bg-navy-dark border border-electric-blue/20 rounded-lg text-white focus:outline-none focus:border-electric-blue"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-light-gray mb-2">
                      <Clock className="inline h-4 w-4 mr-1" />
                      Preferred Time
                    </label>
                    {loadingTimeSlots ? (
                      <div className="flex items-center justify-center h-12">
                        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-electric-blue"></div>
                      </div>
                    ) : (
                      <select
                        value={formData.booking_time}
                        onChange={(e) => handleTimeSelect(e.target.value)}
                        disabled={!formData.booking_date}
                        className="w-full px-4 py-3 bg-navy-dark border border-electric-blue/20 rounded-lg text-white focus:outline-none focus:border-electric-blue"
                        required
                      >
                        <option value="">Select a time</option>
                        {timeSlots.filter(slot => slot.available).map((slot) => (
                          <option key={slot.time} value={slot.time}>
                            {slot.time}
                          </option>
                        ))}
                        {timeSlots.filter(slot => !slot.available).length > 0 && (
                          <option disabled>────── Booked Times ──────</option>
                        )}
                        {timeSlots.filter(slot => !slot.available).map((slot) => (
                          <option key={slot.time} disabled value={slot.time}>
                            {slot.time} (Booked)
                          </option>
                        ))}
                      </select>
                    )}
                  </div>
                </div>
              </div>

              <div className="flex justify-between mt-6">
                <button
                  type="button"
                  onClick={() => setStep(2)}
                  className="px-6 py-3 bg-navy-dark hover:bg-navy-dark/70 rounded-lg text-white font-semibold transition-colors"
                >
                  Back
                </button>
                <button
                  type="button"
                  onClick={() => setStep(4)}
                  disabled={!formData.booking_date || !formData.booking_time}
                  className="px-6 py-3 bg-electric-blue hover:bg-electric-blue/90 disabled:bg-navy-dark disabled:text-light-gray rounded-lg text-white font-semibold transition-colors"
                >
                  Next: Review
                </button>
              </div>
            </div>
          )}

          {/* Step 4: Review & Submit */}
          {step === 4 && (
            <div className="bg-navy-dark/30 backdrop-blur-xl rounded-2xl p-6 border border-electric-blue/20">
              <h2 className="text-xl font-bold text-white mb-6">Review & Submit</h2>
              
              <div className="space-y-6">
                {/* Vehicle Summary */}
                <div className="bg-navy-dark/50 rounded-lg p-4">
                  <h3 className="font-semibold text-white mb-3 flex items-center">
                    <Car className="mr-2" size={18} />
                    Vehicle
                  </h3>
                  <p className="text-light-gray">
                    {selectedVehicle?.year} {selectedVehicle?.make} {selectedVehicle?.model}
                  </p>
                  <p className="text-sm text-light-gray/60">
                    {selectedVehicle?.color} • {selectedVehicle?.size}
                  </p>
                </div>

                {/* Service Summary */}
                <div className="bg-navy-dark/50 rounded-lg p-4">
                  <h3 className="font-semibold text-white mb-3 flex items-center">
                    <Sparkles className="mr-2" size={18} />
                    Service
                  </h3>
                  <p className="text-light-gray">{selectedService?.name}</p>
                  <p className="text-sm text-light-gray/60">{selectedService?.description}</p>
                </div>

                {/* Add-ons Summary */}
                {selectedAddons.length > 0 && (
                  <div className="bg-navy-dark/50 rounded-lg p-4">
                    <h3 className="font-semibold text-white mb-3 flex items-center">
                      <Plus className="mr-2" size={18} />
                      Add-ons ({selectedAddons.length})
                    </h3>
                    <div className="space-y-2">
                      {selectedAddons.map(addon => (
                        <div key={addon.id} className="flex justify-between items-center text-sm">
                          <span className="text-light-gray">{addon.name}</span>
                          <span className="text-electric-blue">${addon.price}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Date & Time Summary */}
                <div className="bg-navy-dark/50 rounded-lg p-4">
                  <h3 className="font-semibold text-white mb-3 flex items-center">
                    <Calendar className="mr-2" size={18} />
                    Date & Time
                  </h3>
                  <p className="text-light-gray">
                    {formData.booking_date && new Date(formData.booking_date).toLocaleDateString('en-US', {
                      weekday: 'long',
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric'
                    })}
                  </p>
                  <p className="text-sm text-light-gray/60">
                    {formData.booking_time} • {formData.service_location === 'mobile' ? 'Mobile Service' : 'Shop Location'}
                  </p>
                </div>

                {/* Price Summary */}
                <div className="bg-navy-dark/50 rounded-lg p-4">
                  <h3 className="font-semibold text-white mb-3 flex items-center">
                    <DollarSign className="mr-2" size={18} />
                    Price Summary
                  </h3>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-light-gray">Base Service</span>
                      <span className="text-white">${selectedService?.base_price_sedan || 0}</span>
                    </div>
                    {selectedAddons.length > 0 && (
                      <div className="flex justify-between text-sm">
                        <span className="text-light-gray">Add-ons</span>
                        <span className="text-white">
                          ${selectedAddons.reduce((sum, addon) => sum + parseFloat(addon.price), 0).toFixed(2)}
                        </span>
                      </div>
                    )}
                    <div className="border-t border-electric-blue/20 pt-2 mt-2">
                      <div className="flex justify-between">
                        <span className="font-semibold text-white">Total</span>
                        <span className="font-bold text-lg text-electric-blue">
                          ${(parseFloat(selectedService?.base_price_sedan || 0) + 
                            selectedAddons.reduce((sum, addon) => sum + parseFloat(addon.price), 0)).toFixed(2)}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Notes */}
                <div>
                  <label className="block text-sm font-medium text-light-gray mb-2">
                    Additional Notes (Optional)
                  </label>
                  <textarea
                    value={formData.notes}
                    onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                    rows={3}
                    className="w-full px-4 py-3 bg-navy-dark border border-electric-blue/20 rounded-lg text-white focus:outline-none focus:border-electric-blue"
                    placeholder="Any special instructions or requests..."
                  />
                </div>
              </div>

              <div className="flex justify-between mt-6">
                <button
                  type="button"
                  onClick={() => setStep(3)}
                  className="px-6 py-3 bg-navy-dark hover:bg-navy-dark/70 rounded-lg text-white font-semibold transition-colors"
                >
                  Back
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-6 py-3 bg-electric-blue hover:bg-electric-blue/90 disabled:bg-navy-dark disabled:text-light-gray rounded-lg text-white font-semibold transition-colors"
                >
                  {loading ? 'Submitting...' : 'Submit Booking'}
                </button>
              </div>
            </div>
          )}
        </form>

        {/* Add-ons Modal */}
        {showAddonsModal && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-navy-dark rounded-2xl max-w-2xl w-full max-h-[80vh] overflow-hidden border border-electric-blue/20">
              <div className="p-6 border-b border-electric-blue/20">
                <div className="flex items-center justify-between">
                  <h3 className="text-xl font-bold text-white">Enhance Your Service</h3>
                  <button
                    type="button"
                    onClick={() => {
                      console.log('Closing addons modal')
                      setShowAddonsModal(false)
                    }}
                    className="text-light-gray hover:text-white transition-colors"
                  >
                    <X size={24} />
                  </button>
                </div>
                <p className="text-light-gray mt-2">Add premium services to take your detailing to the next level</p>
              </div>
              
              <div className="p-6 overflow-y-auto max-h-[50vh]">
                {console.log('Modal rendering, addons length:', addons.length)}
                {addons.length === 0 ? (
                  <div className="text-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-electric-blue mx-auto mb-4"></div>
                    <p className="text-light-gray">Loading add-ons...</p>
                    <p className="text-xs text-light-gray/60 mt-2">Debug: Addons array is empty</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {addons.map((addon) => (
                      <div
                        key={addon.id}
                        className={`border rounded-lg p-4 cursor-pointer transition-all ${
                          selectedAddons.some(a => a.id === addon.id)
                            ? 'border-electric-blue bg-electric-blue/10'
                            : 'border-electric-blue/20 hover:border-electric-blue/40'
                        }`}
                        onClick={() => toggleAddon(addon)}
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <h4 className="font-semibold text-white mb-1">{addon.name}</h4>
                            <p className="text-sm text-light-gray mb-2">{addon.description}</p>
                            <div className="flex items-center gap-3 text-sm">
                              <span className="text-electric-blue font-semibold">${addon.price}</span>
                              <span className="text-light-gray/60">{addon.duration_minutes} min</span>
                              <span className="px-2 py-1 bg-electric-blue/20 text-electric-blue rounded text-xs capitalize">
                                {addon.category}
                              </span>
                            </div>
                          </div>
                          <div className="ml-4">
                            <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${
                              selectedAddons.some(a => a.id === addon.id)
                                ? 'border-electric-blue bg-electric-blue'
                                : 'border-electric-blue/40'
                            }`}>
                              {selectedAddons.some(a => a.id === addon.id) && (
                                <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                </svg>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
              
              <div className="p-6 border-t border-electric-blue/20">
                <div className="flex items-center justify-between mb-4">
                  <span className="text-light-gray">Add-ons Total:</span>
                  <span className="text-xl font-bold text-electric-blue">
                    ${selectedAddons.reduce((sum, addon) => sum + parseFloat(addon.price), 0).toFixed(2)}
                  </span>
                </div>
                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedAddons([])
                      setShowAddonsModal(false)
                    }}
                    className="px-4 py-3 bg-red-500/20 border border-red-500/30 rounded-lg text-red-400 font-semibold hover:bg-red-500/30 transition-colors"
                  >
                    Clear All
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowAddonsModal(false)}
                    className="flex-1 px-4 py-3 bg-green-500 hover:bg-green-500/90 rounded-lg text-white font-semibold transition-colors"
                  >
                    Done
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default ClientNewBooking
