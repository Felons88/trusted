import { useState, useEffect } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import { 
  ArrowLeft, Calendar, Car, DollarSign, Clock, Plus, Check, 
  AlertCircle, MapPin, Sparkles, X, User, Phone, Mail
} from 'lucide-react'
import toast from 'react-hot-toast'
import { carMakes, carModels, carYears } from '../../data/carData'

function AdminNewBooking() {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)
  const [step, setStep] = useState(1)
  const [clients, setClients] = useState([])
  const [selectedClient, setSelectedClient] = useState(null)
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
    client_id: '',
    vehicle_id: '',
    service_type: 'exterior',
    booking_date: '',
    booking_time: '',
    service_location: 'mobile', // 'mobile' or 'shop'
    notes: ''
  })

  useEffect(() => {
    loadClients()
    loadAddons() // Load addons immediately
  }, [])

  useEffect(() => {
    if (selectedClient) {
      loadVehicles()
      loadServices()
    }
  }, [selectedClient])

  const loadClients = async () => {
    try {
      const { data, error } = await supabase
        .from('clients')
        .select('*')
        .order('created_at', { ascending: true })

      if (error) throw error
      
      // Deduplicate clients by user_id and email, keeping the earliest created record
      const uniqueClients = []
      const seen = new Set()
      
      for (const client of data || []) {
        const key = client.user_id || client.email
        if (!seen.has(key)) {
          seen.add(key)
          uniqueClients.push(client)
        }
      }
      
      setClients(uniqueClients)
    } catch (error) {
      console.error('Error loading clients:', error)
      toast.error('Error loading clients')
    }
  }

  const loadVehicles = async () => {
    if (!selectedClient) return
    
    try {
      const { data, error } = await supabase
        .from('vehicles')
        .select('*')
        .eq('client_id', selectedClient.id)
        .order('created_at', { ascending: false })

      if (error) throw error
      setVehicles(data || [])
    } catch (error) {
      console.error('Error loading vehicles:', error)
      toast.error('Error loading vehicles')
    }
  }

  const loadServices = async () => {
    try {
      const { data, error } = await supabase
        .from('services')
        .select('*')
        .eq('is_active', true)
        .order('name', { ascending: true })

      if (error) throw error
      setServices(data || [])
    } catch (error) {
      console.error('Error loading services:', error)
      toast.error('Error loading services')
    }
  }

  const loadAddons = async () => {
    try {
      console.log('Loading addons...')
      const { data, error } = await supabase
        .from('addons')
        .select('*')
        .eq('is_active', true)
        .order('name', { ascending: true })

      if (error) throw error
      console.log('Addons loaded:', data)
      setAddons(data || [])
    } catch (error) {
      console.error('Error loading addons:', error)
      toast.error('Error loading addons')
    }
  }

  const loadTimeSlots = async (date) => {
    console.log('loadTimeSlots called with date:', date)
    setLoadingTimeSlots(true)
    try {
      // Generate time slots from 8 AM to 6 PM
      const slots = []
      const now = new Date()
      const selectedDate = new Date(date + 'T00:00:00')
      const isToday = selectedDate.toDateString() === now.toDateString()
      
      console.log('Generating time slots...')
      for (let hour = 8; hour <= 18; hour++) {
        for (let minute = 0; minute < 60; minute += 30) {
          const time = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`
          
          if (isToday) {
            const slotTime = new Date()
            slotTime.setHours(hour, minute, 0, 0)
            if (slotTime <= now) continue
          }
          
          slots.push({ time, available: true })
        }
      }
      
      console.log('Generated slots:', slots.length)

      const { data: existingBookings, error } = await supabase
        .from('bookings')
        .select('preferred_time, status')
        .eq('preferred_date', date)
        .in('status', ['pending', 'confirmed'])

      console.log('Existing bookings query result:', { data: existingBookings, error })

      if (!error && existingBookings && existingBookings.length > 0) {
        const bookedTimes = existingBookings.map(b => b.preferred_time)
        slots.forEach(slot => {
          if (bookedTimes.includes(slot.time)) slot.available = false
        })
      }

      console.log('Final slots to set:', slots)
      setTimeSlots(slots)
    } catch (error) {
      console.error('Error loading time slots:', error)
      // Fallback to all available slots
      const defaultSlots = []
      for (let hour = 8; hour <= 18; hour++) {
        for (let minute = 0; minute < 60; minute += 30) {
          const time = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`
          defaultSlots.push({ time, available: true })
        }
      }
      console.log('Setting fallback slots:', defaultSlots)
      setTimeSlots(defaultSlots)
    } finally {
      console.log('Setting loadingTimeSlots to false')
      setLoadingTimeSlots(false)
    }
  }

  const handleClientSelect = (client) => {
    setSelectedClient(client)
    setFormData(prev => ({ ...prev, client_id: client.id }))
    setStep(2)
  }

  const handleVehicleSelect = (vehicle) => {
    setSelectedVehicle(vehicle)
    setFormData(prev => ({ ...prev, vehicle_id: vehicle.id }))
  }

  const handleServiceSelect = (service) => {
    console.log('Service selected:', service)
    setSelectedService(service)
    // Try different possible field names for service type
    const serviceType = service.service_type || service.type || service.name
    console.log('Setting service_type to:', serviceType)
    setFormData(prev => ({ ...prev, service_type: serviceType }))
  }

  const handleDateChange = (date) => {
    console.log('Date changed to:', date)
    setFormData(prev => ({ ...prev, booking_date: date, booking_time: '' }))
    if (date) {
      console.log('Loading time slots for date:', date)
      loadTimeSlots(date)
    } else {
      setTimeSlots([])
    }
  }

  const handleTimeSelect = (time) => {
    setFormData(prev => ({ ...prev, booking_time: time }))
  }

  const toggleAddon = (addon) => {
    const isSelected = selectedAddons.some(a => a.id === addon.id)
    if (isSelected) {
      setSelectedAddons(selectedAddons.filter(a => a.id !== addon.id))
    } else {
      setSelectedAddons([...selectedAddons, addon])
    }
  }

  const clearAddons = () => {
    setSelectedAddons([])
  }

  const saveAddons = () => {
    setShowAddonsModal(false)
    // Go to schedule step after selecting addons
    setStep(4)
  }

  const nextStep = () => {
    if (step === 1 && !formData.client_id) {
      toast.error('Please select a client')
      return
    }
    if (step === 2 && !formData.vehicle_id) {
      toast.error('Please select a vehicle')
      return
    }
    if (step === 3 && !selectedService) {
      toast.error('Please select a service')
      return
    }
    
    if (step === 3) {
      // Show addons modal after selecting service
      console.log('Showing addons modal. Addons available:', addons.length)
      setShowAddonsModal(true)
    } else {
      setStep(step + 1)
    }
  }

  const prevStep = () => {
    setStep(step - 1)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    console.log('Form validation check:')
    console.log('client_id:', formData.client_id)
    console.log('vehicle_id:', formData.vehicle_id)
    console.log('service_type:', formData.service_type)
    console.log('selectedService:', selectedService)
    console.log('booking_date:', formData.booking_date)
    console.log('booking_time:', formData.booking_time)
    
    if (!formData.client_id || !formData.vehicle_id || !formData.service_type || !formData.booking_date || !formData.booking_time) {
      const missingFields = []
      if (!formData.client_id) missingFields.push('client_id')
      if (!formData.vehicle_id) missingFields.push('vehicle_id')
      if (!formData.service_type) missingFields.push('service_type')
      if (!formData.booking_date) missingFields.push('booking_date')
      if (!formData.booking_time) missingFields.push('booking_time')
      console.error('Missing required fields:', missingFields)
      toast.error(`Missing required fields: ${missingFields.join(', ')}`)
      return
    }
    
    if (!selectedService) {
      toast.error('Please select a service')
      return
    }

    // Ensure service_type is set even if selection failed
    if (!formData.service_type && selectedService) {
      const serviceType = selectedService.service_type || selectedService.type || selectedService.name || 'exterior'
      setFormData(prev => ({ ...prev, service_type: serviceType }))
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
          'full': { sedan: 150, suv: 180, truck: 210 },
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
      const platformFeeRate = 0.04
      const platformFee = totalCost * platformFeeRate
      const totalWithTax = totalCost + taxAmount + platformFee

      const bookingData = {
        client_id: selectedClient.id,
        vehicle_id: formData.vehicle_id,
        service_id: selectedService?.id || null,
        vehicle_size: vehicleSize,
        service_type: formData.service_type === 'full_detail' ? 'full' : formData.service_type,
        service_address: formData.service_location === 'mobile' ? selectedClient.address : '329 Morton Ave, Elk River, MN 55330',
        service_location: formData.service_location,
        subtotal: totalCost,
        tax: taxAmount.toFixed(2),
        platform_fee: platformFee.toFixed(2),
        total: totalWithTax,
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
            price_at_booking: price
          }
        })

        console.log('Inserting booking addons:', bookingAddonsData)

        const { error: addonsError } = await supabase
          .from('booking_addons')
          .insert(bookingAddonsData)

        if (addonsError) {
          console.error('Error inserting booking addons:', addonsError)
        } else {
          console.log('Successfully inserted booking addons')
        }
      }

      toast.success('Booking created successfully!')
      navigate(`/admin/bookings/${bookingResult.id}`)
    } catch (error) {
      console.error('Error creating booking:', error)
      toast.error('Error creating booking')
    } finally {
      setLoading(false)
    }
  }

  // Step components
  const renderStep1 = () => (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-white mb-6">Select Client</h2>
      <div className="grid gap-4">
        {clients.map(client => (
          <div
            key={client.id}
            onClick={() => handleClientSelect(client)}
            className={`p-4 rounded-lg border cursor-pointer transition-all ${
              selectedClient?.id === client.id
                ? 'bg-blue-500/20 border-blue-400'
                : 'bg-white/5 border-white/10 hover:bg-white/10'
            }`}
          >
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-semibold text-white">{client.full_name}</h3>
                <p className="text-sm text-gray-400">{client.email}</p>
                <p className="text-sm text-gray-400">{client.phone}</p>
              </div>
              <User className="text-blue-400" size={24} />
            </div>
          </div>
        ))}
      </div>
    </div>
  )

  const renderStep2 = () => (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-white mb-6">Select Vehicle</h2>
      <div className="grid gap-4">
        {vehicles.map(vehicle => (
          <div
            key={vehicle.id}
            onClick={() => handleVehicleSelect(vehicle)}
            className={`p-4 rounded-lg border cursor-pointer transition-all ${
              selectedVehicle?.id === vehicle.id
                ? 'bg-blue-500/20 border-blue-400'
                : 'bg-white/5 border-white/10 hover:bg-white/10'
            }`}
          >
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-semibold text-white">
                  {vehicle.year} {vehicle.make} {vehicle.model}
                </h3>
                <p className="text-sm text-gray-400">{vehicle.color} • {vehicle.license_plate}</p>
                <p className="text-sm text-gray-400">Size: {vehicle.size}</p>
              </div>
              <Car className="text-blue-400" size={24} />
            </div>
          </div>
        ))}
      </div>
      {vehicles.length === 0 && (
        <div className="text-center py-8">
          <Car className="mx-auto text-gray-400 mb-4" size={48} />
          <p className="text-gray-400">No vehicles found for this client</p>
        </div>
      )}
    </div>
  )

  const renderStep3 = () => (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-white mb-6">Select Service</h2>
      <div className="grid gap-4">
        {services.map(service => (
          <div
            key={service.id}
            onClick={() => handleServiceSelect(service)}
            className={`p-4 rounded-lg border cursor-pointer transition-all ${
              selectedService?.id === service.id
                ? 'bg-blue-500/20 border-blue-400'
                : 'bg-white/5 border-white/10 hover:bg-white/10'
            }`}
          >
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-semibold text-white">{service.name}</h3>
                <p className="text-sm text-gray-400">{service.description}</p>
                <div className="mt-2 text-sm">
                  <span className="text-gray-400">Sedan: </span>
                  <span className="text-green-400">${service.base_price_sedan}</span>
                  <span className="text-gray-400 ml-3">SUV: </span>
                  <span className="text-green-400">${service.base_price_suv}</span>
                  <span className="text-gray-400 ml-3">Truck: </span>
                  <span className="text-green-400">${service.base_price_truck}</span>
                </div>
              </div>
              <Sparkles className="text-blue-400" size={24} />
            </div>
          </div>
        ))}
      </div>
    </div>
  )

  const renderStep5 = () => {
    // Calculate pricing
    let totalCost = 0
    let serviceDuration = 120
    
    if (selectedService && selectedVehicle) {
      const vehicleSize = selectedVehicle.size || 'sedan'
      if (vehicleSize === 'suv') {
        totalCost += parseFloat(selectedService.base_price_suv || 0)
      } else if (vehicleSize === 'truck') {
        totalCost += parseFloat(selectedService.base_price_truck || 0)
      } else {
        totalCost += parseFloat(selectedService.base_price_sedan || 0)
      }
    }
    
    selectedAddons.forEach(addon => {
      totalCost += parseFloat(addon.price || 0)
      serviceDuration += parseInt(addon.duration_minutes || 0)
    })

    const taxRate = 0.06875
    const taxAmount = totalCost * taxRate
    const platformFeeRate = 0.04
    const platformFee = totalCost * platformFeeRate
    const totalWithTax = totalCost + taxAmount + platformFee

    return (
      <div className="space-y-6">
        <h2 className="text-2xl font-bold text-white mb-6">Review & Confirm</h2>
        
        <div className="bg-white/5 rounded-lg p-6 space-y-4">
          <div className="flex justify-between items-center">
            <span className="text-gray-400">Client:</span>
            <span className="text-white font-medium">{selectedClient?.full_name}</span>
          </div>
          
          <div className="flex justify-between items-center">
            <span className="text-gray-400">Vehicle:</span>
            <span className="text-white font-medium">
              {selectedVehicle?.year} {selectedVehicle?.make} {selectedVehicle?.model}
            </span>
          </div>
          
          <div className="flex justify-between items-center">
            <span className="text-gray-400">Service:</span>
            <span className="text-white font-medium">{selectedService?.name}</span>
          </div>
          
          <div className="flex justify-between items-center">
            <span className="text-gray-400">Date & Time:</span>
            <span className="text-white font-medium">
              {formData.booking_date} at {formData.booking_time}
            </span>
          </div>
          
          <div className="flex justify-between items-center">
            <span className="text-gray-400">Location:</span>
            <span className="text-white font-medium">
              {formData.service_location === 'mobile' ? 'Mobile Service' : 'Shop Service'}
            </span>
          </div>
          
          {selectedAddons.length > 0 && (
            <div>
              <span className="text-gray-400">Add-ons:</span>
              <div className="mt-2 space-y-1">
                {selectedAddons.map(addon => (
                  <div key={addon.id} className="text-white text-sm">
                    • {addon.name} - ${addon.price}
                  </div>
                ))}
              </div>
            </div>
          )}
          
          <div className="border-t border-white/10 pt-4">
            <div className="flex justify-between items-center">
              <span className="text-gray-400">Subtotal:</span>
              <span className="text-white font-medium">${totalCost.toFixed(2)}</span>
            </div>
            
            <div className="flex justify-between items-center">
              <span className="text-gray-400">Tax (6.875%):</span>
              <span className="text-white font-medium">${taxAmount.toFixed(2)}</span>
            </div>
            
            <div className="flex justify-between items-center">
              <span className="text-gray-400">Platform Fee (4%):</span>
              <span className="text-white font-medium">${platformFee.toFixed(2)}</span>
            </div>
            
            <div className="flex justify-between items-center text-lg">
              <span className="text-white font-bold">Total:</span>
              <span className="text-green-400 font-bold">${totalWithTax.toFixed(2)}</span>
            </div>
          </div>
        </div>
        
        <div className="text-center">
          <p className="text-gray-400 text-sm">
            Click "Create Booking" to confirm and create this appointment.
          </p>
        </div>
      </div>
    )
  }

  const renderStep4 = () => (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-white mb-6">Select Date & Time</h2>
      
      <div>
        <label className="block text-sm font-medium text-gray-300 mb-2">
          <Calendar className="inline mr-2" size={16} />
          Preferred Date
        </label>
        <input
          type="date"
          value={formData.booking_date}
          onChange={(e) => handleDateChange(e.target.value)}
          className="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          min={new Date().toISOString().split('T')[0]}
        />
      </div>

      {formData.booking_date && (
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            <Clock className="inline mr-2" size={16} />
            Preferred Time
          </label>
          {loadingTimeSlots ? (
            <div className="text-center py-4">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto"></div>
              <p className="text-gray-400 mt-2">Loading available times...</p>
            </div>
          ) : (
            <div className="grid grid-cols-3 gap-2">
              {timeSlots.map((slot, index) => (
                <button
                  key={index}
                  onClick={() => slot.available && handleTimeSelect(slot.time)}
                  disabled={!slot.available}
                  className={`px-3 py-2 rounded-lg text-sm transition-all ${
                    formData.booking_time === slot.time
                      ? 'bg-blue-500 text-white'
                      : slot.available
                      ? 'bg-white/10 text-white hover:bg-white/20'
                      : 'bg-gray-700 text-gray-500 cursor-not-allowed'
                  }`}
                >
                  {slot.time}
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      <div>
        <label className="block text-sm font-medium text-gray-300 mb-2">
          <MapPin className="inline mr-2" size={16} />
          Service Location
        </label>
        <select
          value={formData.service_location}
          onChange={(e) => setFormData(prev => ({ ...prev, service_location: e.target.value }))}
          className="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="mobile">Mobile Service</option>
          <option value="shop">Shop Service</option>
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-300 mb-2">
          Notes (Optional)
        </label>
        <textarea
          value={formData.notes}
          onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
          className="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          rows={3}
          placeholder="Any special requests or notes..."
        />
      </div>
    </div>
  )

  const renderAddonsModal = () => (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-slate-800 rounded-2xl p-6 max-w-2xl w-full max-h-[80vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-xl font-bold text-white">Add-ons (Optional)</h3>
          <button
            onClick={() => setShowAddonsModal(false)}
            className="text-gray-400 hover:text-white"
          >
            <X size={24} />
          </button>
        </div>

        <div className="space-y-3 mb-6">
          {addons.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-gray-400">No add-ons available at this time</p>
            </div>
          ) : (
            addons.map(addon => (
              <div
                key={addon.id}
                onClick={() => toggleAddon(addon)}
                className={`p-4 rounded-lg border cursor-pointer transition-all ${
                  selectedAddons.some(a => a.id === addon.id)
                    ? 'bg-blue-500/20 border-blue-400'
                    : 'bg-white/5 border-white/10 hover:bg-white/10'
                }`}
              >
                <div className="flex justify-between items-center">
                  <div>
                    <h4 className="font-semibold text-white">{addon.name}</h4>
                    <p className="text-sm text-gray-400">{addon.description}</p>
                    <p className="text-sm text-gray-400">Duration: {addon.duration_minutes} minutes</p>
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-bold text-green-400">${addon.price}</p>
                    {selectedAddons.some(a => a.id === addon.id) && (
                      <Check className="text-blue-400 ml-auto" size={20} />
                    )}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Addons Total */}
        {selectedAddons.length > 0 && (
          <div className="border-t border-white/10 pt-4 mb-6">
            <div className="flex justify-between items-center">
              <span className="text-white font-medium">Add-ons Total:</span>
              <span className="text-green-400 font-bold text-lg">
                ${selectedAddons.reduce((total, addon) => total + parseFloat(addon.price || 0), 0).toFixed(2)}
              </span>
            </div>
          </div>
        )}

        <div className="flex justify-between">
          <button
            onClick={clearAddons}
            className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700"
          >
            Clear All
          </button>
          <button
            onClick={saveAddons}
            className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  )

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 p-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <Link
            to="/admin/bookings"
            className="inline-flex items-center text-blue-400 hover:text-blue-300 mb-4"
          >
            <ArrowLeft className="mr-2" size={20} />
            Back to Bookings
          </Link>
          <h1 className="text-3xl font-bold text-white">Create New Booking</h1>
        </div>

        {/* Progress Steps */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            {[1, 2, 3, 4, 5].map((stepNumber) => (
              <div key={stepNumber} className="flex items-center">
                <div
                  className={`w-10 h-10 rounded-full flex items-center justify-center ${
                    step >= stepNumber
                      ? 'bg-blue-500 text-white'
                      : 'bg-gray-700 text-gray-400'
                  }`}
                >
                  {step > stepNumber ? <Check size={20} /> : stepNumber}
                </div>
                {stepNumber < 5 && (
                  <div
                    className={`w-full h-1 mx-2 ${
                      step > stepNumber ? 'bg-blue-500' : 'bg-gray-700'
                    }`}
                  />
                )}
              </div>
            ))}
          </div>
          <div className="flex justify-between mt-2">
            <span className="text-xs text-gray-400">Client</span>
            <span className="text-xs text-gray-400">Vehicle</span>
            <span className="text-xs text-gray-400">Service</span>
            <span className="text-xs text-gray-400">Schedule</span>
            <span className="text-xs text-gray-400">Review</span>
          </div>
        </div>

        {/* Step Content */}
        <div className="bg-slate-800/50 backdrop-blur-xl rounded-2xl p-8 border border-white/10">
          <form onSubmit={handleSubmit}>
            {step === 1 && renderStep1()}
            {step === 2 && renderStep2()}
            {step === 3 && renderStep3()}
            {step === 4 && renderStep4()}
            {step === 5 && renderStep5()}

            {/* Navigation */}
            <div className="flex justify-between mt-8">
              <button
                type="button"
                onClick={prevStep}
                disabled={step === 1}
                className={`px-6 py-3 rounded-lg font-medium transition-colors ${
                  step === 1
                    ? 'bg-gray-700 text-gray-500 cursor-not-allowed'
                    : 'bg-gray-600 text-white hover:bg-gray-700'
                }`}
              >
                Previous
              </button>

              {step < 4 ? (
                <button
                  type="button"
                  onClick={nextStep}
                  className="px-6 py-3 bg-blue-500 text-white rounded-lg font-medium hover:bg-blue-600 transition-colors"
                >
                  Next
                </button>
              ) : step === 4 ? (
                <button
                  type="button"
                  onClick={() => setStep(5)}
                  className="px-6 py-3 bg-blue-500 text-white rounded-lg font-medium hover:bg-blue-600 transition-colors"
                >
                  Review
                </button>
              ) : (
                <button
                  type="submit"
                  disabled={loading}
                  className="px-6 py-3 bg-green-500 text-white rounded-lg font-medium hover:bg-green-600 transition-colors disabled:opacity-50"
                >
                  {loading ? 'Creating...' : 'Create Booking'}
                </button>
              )}
            </div>
          </form>
        </div>
      </div>

      {/* Addons Modal */}
      {showAddonsModal && renderAddonsModal()}
    </div>
  )
}

export default AdminNewBooking
