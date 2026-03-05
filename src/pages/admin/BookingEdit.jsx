import { useState, useEffect } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import { format } from 'date-fns'
import { 
  ArrowLeft, Save, Calendar, Clock, User, Car, DollarSign, 
  MapPin, Phone, Mail, CheckCircle, XCircle, AlertCircle
} from 'lucide-react'
import toast from 'react-hot-toast'
import { parseAddress } from '../../utils/addressParser'

function BookingEdit() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [formData, setFormData] = useState({
    client_id: '',
    vehicle_id: '',
    service_type: 'exterior',
    booking_date: '',
    booking_time: '',
    estimated_duration: 120,
    total_cost: 0,
    status: 'pending',
    notes: '',
    service_address: '',
    service_city: '',
    service_state: '',
    service_zip: ''
  })

  const [existingBookings, setExistingBookings] = useState([])
  const [timeSlots, setTimeSlots] = useState([])
  const [loadingTimeSlots, setLoadingTimeSlots] = useState(false)

  const [clients, setClients] = useState([])
  const [vehicles, setVehicles] = useState([])
  const [services, setServices] = useState([])
  const [selectedClient, setSelectedClient] = useState(null)
  const [selectedVehicle, setSelectedVehicle] = useState(null)
  const [originalData, setOriginalData] = useState(null)

  useEffect(() => {
    loadData()
  }, [id])

  useEffect(() => {
    if (formData.client_id) {
      const client = clients.find(c => c.id === formData.client_id)
      setSelectedClient(client)
      loadClientVehicles(formData.client_id)
      
      // Parse client address when selected
      if (client?.address) {
        parseAddress(client.address).then(parsed => {
          setFormData(prev => ({
            ...prev,
            service_address: client.address,
            service_city: parsed.city,
            service_state: parsed.state,
            service_zip: parsed.zip
          }))
        })
      }
    } else {
      setSelectedClient(null)
      setVehicles([])
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
      // Load booking data
      const { data: booking, error: bookingError } = await supabase
        .from('bookings')
        .select(`
          *,
          clients (full_name, email, phone, address),
          vehicles (year, make, model, color, license_plate, vehicle_size)
        `)
        .eq('id', id)
        .single()

      if (bookingError) throw bookingError

      // Load clients
      const { data: clientsData } = await supabase.from('clients').select('*')
      setClients(clientsData || [])

      // Load vehicles
      const { data: vehiclesData } = await supabase.from('vehicles').select('*').eq('is_active', true)
      setVehicles(vehiclesData || [])

      // Load services
      const { data: servicesData } = await supabase.from('services').select('*')
      setServices(servicesData || [])

      // Set form data
      setFormData({
        client_id: booking.client_id || '',
        vehicle_id: booking.vehicle_id || '',
        service_type: booking.service_type || 'exterior',
        booking_date: booking.preferred_date || booking.service_date || '',
        booking_time: booking.preferred_time || '',
        estimated_duration: booking.estimated_duration || 120,
        total_cost: booking.total_cost || 0,
        status: booking.status || 'pending',
        notes: booking.notes || '',
        service_address: booking.service_address || '',
        service_city: booking.service_city || '',
        service_state: booking.service_state || '',
        service_zip: booking.service_zip || ''
      })

      setOriginalData(booking)
    } catch (error) {
      console.error('Error loading data:', error)
      toast.error('Failed to load booking data')
    } finally {
      setLoading(false)
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
    const service = services.find(s => s.name === formData.service_type)
    const basePrice = service?.price || 50
    
    let sizeMultiplier = 1
    if (selectedVehicle?.vehicle_size === 'suv') sizeMultiplier = 1.3
    if (selectedVehicle?.vehicle_size === 'truck') sizeMultiplier = 1.5
    if (selectedVehicle?.vehicle_size === 'van') sizeMultiplier = 1.4
    
    const totalPrice = basePrice * sizeMultiplier
    setFormData(prev => ({ ...prev, total_cost: totalPrice }))
  }

  const checkExistingBookings = async (date) => {
    if (!date) return

    try {
      const { data, error } = await supabase
        .from('bookings')
        .select('*')
        .eq('preferred_date', date)
        .in('status', ['pending', 'confirmed', 'in_progress'])
        .neq('id', id) // Exclude current booking

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

    setSaving(true)
    
    try {
      const updateData = {
        client_id: formData.client_id,
        vehicle_id: formData.vehicle_id,
        service_type: formData.service_type,
        vehicle_size: selectedVehicle?.vehicle_size || 'sedan',
        service_address: formData.service_address,
        service_city: formData.service_city,
        service_state: formData.service_state,
        service_zip: formData.service_zip,
        subtotal: formData.total_cost,
        preferred_date: formData.booking_date,
        preferred_time: formData.booking_time,
        total_cost: formData.total_cost,
        status: formData.status,
        notes: formData.notes,
        estimated_duration: formData.estimated_duration,
        updated_at: new Date().toISOString()
      }

      const { data, error } = await supabase
        .from('bookings')
        .update(updateData)
        .eq('id', id)
        .select()
        .single()

      if (error) throw error

      toast.success('Booking updated successfully!')
      navigate(`/admin/bookings/${id}`)
    } catch (error) {
      console.error('Error updating booking:', error)
      toast.error('Failed to update booking')
    } finally {
      setSaving(false)
    }
  }

  const serviceTypes = [
    { value: 'exterior', label: 'Exterior Detail', price: 50 },
    { value: 'interior', label: 'Interior Detail', price: 60 },
    { value: 'full', label: 'Full Detail', price: 100 },
    { value: 'premium', label: 'Premium Detail', price: 150 }
  ]

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
            to={`/admin/bookings/${id}`}
            className="text-light-gray hover:text-electric-blue transition-colors"
          >
            <ArrowLeft size={24} />
          </Link>
          <div>
            <h1 className="text-3xl font-bold text-light-gray">Edit Booking</h1>
            <p className="text-light-gray">Update booking information</p>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Client Selection */}
          <div className="glass-card p-6">
            <h3 className="text-xl font-bold text-light-gray mb-4 flex items-center">
              <User className="text-electric-blue mr-3" size={24} />
              Client Information
            </h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm text-light-gray mb-2">Client</label>
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
              Vehicle Information
            </h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm text-light-gray mb-2">Vehicle</label>
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

          {/* Service Details */}
          <div className="glass-card p-6">
            <h3 className="text-xl font-bold text-light-gray mb-4 flex items-center">
              <DollarSign className="text-electric-blue mr-3" size={24} />
              Service Details
            </h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm text-light-gray mb-2">Service Type</label>
                <div className="space-y-3">
                  {serviceTypes.map(service => (
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

              <div>
                <label className="block text-sm text-light-gray mb-2">Status</label>
                <select
                  value={formData.status}
                  onChange={(e) => setFormData(prev => ({ ...prev, status: e.target.value }))}
                  className="admin-select"
                >
                  <option value="pending">Pending</option>
                  <option value="confirmed">Confirmed</option>
                  <option value="in_progress">In Progress</option>
                  <option value="completed">Completed</option>
                  <option value="cancelled">Cancelled</option>
                </select>
              </div>
            </div>
          </div>

          {/* Date & Time */}
          <div className="glass-card p-6">
            <h3 className="text-xl font-bold text-light-gray mb-4 flex items-center">
              <Calendar className="text-electric-blue mr-3" size={24} />
              Date & Time
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

              <div>
                <label className="block text-sm text-light-gray mb-2">Duration (minutes)</label>
                <input
                  type="number"
                  value={formData.estimated_duration}
                  onChange={(e) => setFormData(prev => ({ ...prev, estimated_duration: parseInt(e.target.value) || 120 }))}
                  className="admin-input"
                  min="30"
                  max="480"
                  step="30"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Notes */}
        <div className="glass-card p-6">
          <h3 className="text-xl font-bold text-light-gray mb-4">Additional Notes</h3>
          <textarea
            value={formData.notes}
            onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
            className="admin-input"
            rows={4}
            placeholder="Add any special instructions or notes..."
          />
        </div>

        {/* Pricing Summary */}
        <div className="glass-card p-6">
          <h3 className="text-xl font-bold text-light-gray mb-4">Pricing Summary</h3>
          <div className="flex items-center justify-between">
            <span className="text-lg font-semibold text-light-gray">Total Price:</span>
            <span className="text-2xl font-bold text-green-400">
              ${formData.total_cost.toFixed(2)}
            </span>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-between">
          <Link
            to={`/admin/bookings/${id}`}
            className="btn-secondary"
          >
            Cancel
          </Link>
          
          <button
            type="submit"
            disabled={saving}
            className="btn-primary"
          >
            {saving ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </form>
    </div>
  )
}

export default BookingEdit
