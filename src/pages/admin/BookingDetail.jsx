import { useState, useEffect } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import { format } from 'date-fns'
import toast from 'react-hot-toast'
import { 
  ArrowLeft, Calendar, Clock, MapPin, Car, User, Phone, 
  DollarSign, Edit2, Trash2, CheckCircle, XCircle, AlertCircle,
  FileText, Mail, MessageSquare, Activity
} from 'lucide-react'
import { emailTriggerService } from '../../services/emailTriggerService'

function BookingDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [booking, setBooking] = useState(null)
  const [loading, setLoading] = useState(true)
  const [deleting, setDeleting] = useState(false)
  const [timeline, setTimeline] = useState([])

  useEffect(() => {
    loadBooking()
  }, [id])

  const loadBooking = async () => {
    try {
      console.log('Loading booking details for ID:', id)
      
      const { data, error } = await supabase
        .from('bookings')
        .select(`
          *,
          clients (full_name, email, phone, address),
          vehicles (year, make, model, color, license_plate, size),
          services (id, name, base_price_sedan, base_price_suv, base_price_truck),
          booking_addons (
            addons (id, name, price, duration_minutes)
          )
        `)
        .eq('id', id)
        .single()

      if (error) throw error
      
      console.log('Booking data loaded:', data)
      console.log('Booking addons loaded:', data.booking_addons)
      console.log('Addons count:', data.booking_addons?.length || 0)
      
      // Try loading booking_addons separately to check RLS
      try {
        const { data: addonsData, error: addonsError } = await supabase
          .from('booking_addons')
          .select(`
            *,
            addons (id, name, price, duration_minutes)
          `)
          .eq('booking_id', id)
        
        console.log('Separate addons query result:', addonsData)
        console.log('Separate addons error:', addonsError)
        
        if (addonsData && !addonsError) {
          data.booking_addons = addonsData
          console.log('Updated booking with separate addons data:', data.booking_addons)
        }
      } catch (separateError) {
        console.log('Error in separate addons query:', separateError)
      }
      
      // Calculate correct pricing
      let totalCost = 0
      let serviceDuration = 120 // default
      
      // Determine vehicle size
      let vehicleSize = data.vehicles?.size || 'sedan'
      if (!data.vehicles?.size && data.vehicles?.make && data.vehicles?.model) {
        const make = data.vehicles.make.toLowerCase()
        const model = data.vehicles.model.toLowerCase()
        
        const suvModels = ['enclave', 'traverse', 'tahoe', 'suburban', 'yukon', 'escalade', 'explorer', 'expedition', 'navigator', 'durango', 'highlander', '4runner', 'pilot', 'passport', 'telluride', 'palisade', 'sorento', 'sportage', 'tucson', 'santa fe', 'rogue', 'murano', 'pathfinder', 'armada', 'qx60', 'qx80', 'mdx', 'rdx', 'xt5', 'xt6']
        const truckModels = ['f-150', 'silverado', 'sierra', 'ram', 'tundra', 'tacoma', 'frontier', 'colorado', 'ranger', 'maverick']
        
        if (suvModels.some(suv => model.includes(suv)) || 
            make.includes('buick') && model.includes('enclave')) {
          vehicleSize = 'suv'
        } else if (truckModels.some(truck => model.includes(truck))) {
          vehicleSize = 'truck'
        }
      }
      
      // Calculate service price
      if (data.services) {
        if (vehicleSize === 'suv') {
          totalCost += parseFloat(data.services.base_price_suv || 0)
        } else if (vehicleSize === 'truck') {
          totalCost += parseFloat(data.services.base_price_truck || 0)
        } else {
          totalCost += parseFloat(data.services.base_price_sedan || 0)
        }
      } else {
        // Fallback pricing
        const servicePrices = {
          'exterior': { sedan: 100, suv: 120, truck: 140 },
          'interior': { sedan: 80, suv: 100, truck: 120 },
          'full': { sedan: 150, suv: 180, truck: 210 }, // Changed from 'full_detail' to 'full'
          'ceramic_coating': { sedan: 300, suv: 400, truck: 500 }
        }
        const serviceType = data.service_type === 'full_detail' ? 'full' : (data.service_type || 'exterior')
        totalCost = servicePrices[serviceType]?.[vehicleSize] || 100
      }
      
      // Add addon prices and durations
      if (data.booking_addons && data.booking_addons.length > 0) {
        data.booking_addons.forEach(ba => {
          if (ba.addons) {
            totalCost += parseFloat(ba.addons.price || 0)
            serviceDuration += parseInt(ba.addons.duration_minutes || 0)
          }
        })
      }
      
      // Update booking with calculated values
      data.calculated_total = totalCost
      data.calculated_duration = serviceDuration
      
      console.log('Booking details loaded:', data)
      console.log('Calculated total:', totalCost)
      console.log('Calculated duration:', serviceDuration)
      
      setBooking(data)
      
      // Load timeline events
      await loadTimeline()
    } catch (error) {
      console.error('Error loading booking:', error)
      toast.error('Failed to load booking')
    } finally {
      setLoading(false)
    }
  }

  const loadTimeline = async () => {
    try {
      const { data, error } = await supabase
        .from('booking_timeline')
        .select('*')
        .eq('booking_id', id)
        .order('created_at', { ascending: false })

      if (error) {
        if (error.code === 'PGRST116' || error.code === 'PGRST205') { // Table not found
          console.log('booking_timeline table not found, using basic timeline')
          // Create a basic timeline from booking data
          const basicTimeline = []
          if (booking) {
            basicTimeline.push({
              id: 'created',
              action: 'booking_created',
              details: { booking_number: booking.booking_number },
              created_at: booking.created_at
            })
            if (booking.updated_at && booking.updated_at !== booking.created_at) {
              basicTimeline.push({
                id: 'updated',
                action: 'booking_updated',
                details: { last_updated: booking.updated_at },
                created_at: booking.updated_at
              })
            }
          }
          setTimeline(basicTimeline)
        } else {
          console.error('Error loading timeline:', error)
        }
      } else {
        setTimeline(data || [])
      }
    } catch (error) {
      console.error('Timeline loading error:', error)
    }
  }

  const createTimelineEvent = async (action, details = null) => {
    try {
      const eventData = {
        booking_id: id,
        action: action,
        details: details,
        user_agent: navigator.userAgent,
        ip_address: await getClientIP(),
        created_at: new Date().toISOString()
      }

      const { error } = await supabase
        .from('booking_timeline')
        .insert(eventData)

      if (error) {
        if (error.code === 'PGRST116' || error.code === 'PGRST205') {
          console.log('booking_timeline table not found, timeline event not saved')
        } else {
          console.error('Error creating timeline event:', error)
        }
      } else {
        // Refresh timeline
        await loadTimeline()
      }
    } catch (error) {
      console.error('Timeline event creation error:', error)
    }
  }

  const getClientIP = async () => {
    try {
      const response = await fetch('https://api.ipify.org?format=json')
      const data = await response.json()
      return data.ip
    } catch (error) {
      return 'unknown'
    }
  }

  const openMaps = () => {
    // Use service address from booking first, then fallback to client address
    const serviceAddress = booking?.service_address || booking?.clients?.address
    
    if (!serviceAddress) {
      toast.error('No address available for this booking')
      return
    }

    // Build full address with city, state, zip if available
    const city = booking?.service_city || ''
    const state = booking?.service_state || ''
    const zip = booking?.service_zip || ''
    
    const fullAddress = `${serviceAddress}, ${city}, ${state} ${zip}`.trim().replace(/,\s*,/g, ',').replace(/,\s*$/, '')
    
    // Detect device type
    const userAgent = navigator.userAgent.toLowerCase()
    const isApple = /iphone|ipad|ipod/.test(userAgent) || /mac/.test(userAgent)
    
    let mapsUrl = ''
    
    if (isApple) {
      // Use Apple Maps
      mapsUrl = `maps://maps.apple.com/?address=${encodeURIComponent(fullAddress)}`
    } else {
      // Use Google Maps (default for Samsung and others)
      mapsUrl = `https://maps.google.com/?q=${encodeURIComponent(fullAddress)}`
    }
    
    // Open in new tab
    window.open(mapsUrl, '_blank')
  }

  const handleStatusChange = async (newStatus) => {
    try {
      const oldStatus = booking.status
      
      // Create timeline event before status change
      await createTimelineEvent('status_changed', {
        old_status: oldStatus,
        new_status: newStatus,
        booking_number: booking.booking_number
      })

      // Update booking status
      const { error } = await supabase
        .from('bookings')
        .update({ 
          status: newStatus,
          updated_at: new Date().toISOString()
        })
        .eq('id', id)

      if (error) throw error

      // Update local state
      setBooking(prev => ({ ...prev, status: newStatus, updated_at: new Date().toISOString() }))
      
      // Trigger email based on status change
      const fullBookingData = await emailTriggerService.getFullBookingData(id)
      if (fullBookingData) {
        await emailTriggerService.triggerEmail(`booking:status:${newStatus}`, {
          booking: fullBookingData,
          client: fullBookingData.clients
        })
      }
      
      toast.success(`Booking status changed to ${newStatus.replace('_', ' ').toUpperCase()}`)
    } catch (error) {
      console.error('Error updating status:', error)
      toast.error('Failed to update status')
    }
  }

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this booking?')) return

    setDeleting(true)
    try {
      // Create timeline event before deletion
      await createTimelineEvent('booking_deleted', {
        booking_number: booking.booking_number,
        client_name: booking.clients?.full_name
      })

      const { error } = await supabase
        .from('bookings')
        .delete()
        .eq('id', id)

      if (error) throw error
      toast.success('Booking deleted successfully')
      navigate('/admin/bookings')
    } catch (error) {
      console.error('Error deleting booking:', error)
      toast.error('Failed to delete booking')
    } finally {
      setDeleting(false)
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

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-electric-blue"></div>
      </div>
    )
  }

  if (!booking) {
    return (
      <div className="text-center py-12">
        <h3 className="text-xl font-semibold text-light-gray mb-2">Booking not found</h3>
        <p className="text-light-gray mb-4">The booking you're looking for doesn't exist.</p>
        <Link to="/admin/bookings" className="btn-primary">
          Back to Bookings
        </Link>
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
            <h1 className="text-3xl font-bold text-light-gray">Booking Details</h1>
            <p className="text-light-gray">View and manage booking information</p>
          </div>
        </div>
        
        <div className="flex items-center space-x-3">
          <Link
            to={`/admin/bookings/${id}/edit`}
            className="btn-secondary flex items-center space-x-2"
          >
            <Edit size={16} />
            <span>Edit</span>
          </Link>
          <button 
            onClick={handleDelete}
            disabled={deleting}
            className="btn-red flex items-center space-x-2"
          >
            <Trash2 size={16} />
            <span>{deleting ? 'Deleting...' : 'Delete'}</span>
          </button>
        </div>
      </div>

      {/* Booking Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Info */}
        <div className="lg:col-span-2 space-y-6">
          {/* Booking Overview */}
          <div className="glass-card p-6">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-2xl font-bold text-light-gray">
                  {booking.booking_number || `BK-${booking.id}`}
                </h2>
                <p className="text-light-gray">
                  {format(new Date(booking.created_at), 'MMMM dd, yyyy')}
                </p>
              </div>
              <span className={`px-4 py-2 rounded-full text-sm font-semibold border flex items-center space-x-2 ${getStatusColor(booking.status)}`}>
                {getStatusIcon(booking.status)}
                <span>{booking.status || 'pending'}</span>
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Service Details */}
              <div>
                <h3 className="text-lg font-semibold text-light-gray mb-4 flex items-center">
                  <Car className="text-electric-blue mr-2" size={20} />
                  Service Details
                </h3>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-light-gray">Service Type:</span>
                    <span className="text-light-gray capitalize">{booking.service_type} Detail</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-light-gray">Duration:</span>
                    <span className="text-light-gray">{booking.calculated_duration || 120} minutes</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-light-gray">Date:</span>
                    <span className="text-light-gray">
                      {format(new Date(booking.preferred_date || booking.service_date), 'MMM dd, yyyy')}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-light-gray">Time:</span>
                    <span className="text-light-gray">{booking.preferred_time || 'TBD'}</span>
                  </div>
                </div>
              </div>

              {/* Pricing */}
              <div>
                <h3 className="text-lg font-semibold text-light-gray mb-4 flex items-center">
                  <DollarSign className="text-electric-blue mr-2" size={20} />
                  Pricing
                </h3>
                
                {/* Add-ons Section */}
                {booking.booking_addons && booking.booking_addons.length > 0 && (
                  <div className="mb-4 p-3 bg-navy-dark/30 rounded-lg">
                    <h4 className="text-sm font-semibold text-light-gray mb-2">Add-ons</h4>
                    <div className="space-y-1">
                      {booking.booking_addons.map((ba, index) => (
                        <div key={index} className="flex justify-between text-sm">
                          <span className="text-light-gray/80">{ba.addons?.name}</span>
                          <span className="text-electric-blue">${parseFloat(ba.addons?.price || 0).toFixed(2)}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-light-gray">Subtotal:</span>
                    <span className="text-light-gray">${booking.subtotal?.toFixed(2) || booking.calculated_total?.toFixed(2) || '0.00'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-light-gray">Tax (6.875%):</span>
                    <span className="text-light-gray">${booking.tax?.toFixed(2) || '0.00'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-light-gray">Total:</span>
                    <span className="text-xl font-bold text-green-400">
                      ${booking.total?.toFixed(2) || booking.calculated_total?.toFixed(2) || '0.00'}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Notes */}
            {booking.notes && (
              <div className="mt-6 pt-6 border-t border-navy-light">
                <h3 className="text-lg font-semibold text-light-gray mb-3 flex items-center">
                  <FileText className="text-electric-blue mr-2" size={20} />
                  Notes
                </h3>
                <p className="text-light-gray">{booking.notes}</p>
              </div>
            )}
          </div>

          {/* Client Information */}
          <div className="glass-card p-6">
            <h3 className="text-lg font-semibold text-light-gray mb-4 flex items-center">
              <User className="text-electric-blue mr-2" size={20} />
              Client Information
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h4 className="font-semibold text-light-gray mb-3">Contact Details</h4>
                <div className="space-y-2">
                  <div className="flex items-center text-light-gray">
                    <User className="mr-2" size={16} />
                    {booking.clients?.full_name}
                  </div>
                  <div className="flex items-center text-light-gray">
                    <Mail className="mr-2" size={16} />
                    {booking.clients?.email}
                  </div>
                  {booking.clients?.phone && (
                    <div className="flex items-center text-light-gray">
                      <Phone className="mr-2" size={16} />
                      {booking.clients.phone}
                    </div>
                  )}
                  {booking.clients?.address && (
                    <button
                      onClick={openMaps}
                      className="flex items-center text-light-gray hover:text-bright-cyan transition-colors group"
                    >
                      <MapPin className="mr-2 group-hover:text-bright-cyan" size={16} />
                      <span className="group-hover:underline">
                        {booking.clients.address}
                      </span>
                    </button>
                  )}
                  
                  {/* Show service address if different from client address */}
                  {booking?.service_address && booking.service_address !== booking.clients?.address && (
                    <div className="flex items-center text-light-gray text-sm">
                      <MapPin className="mr-2 text-electric-blue" size={14} />
                      <span className="text-electric-blue">
                        Service: {booking.service_address}
                      </span>
                    </div>
                  )}
                </div>
              </div>
              <div>
                <h4 className="font-semibold text-light-gray mb-3">Vehicle Details</h4>
                <div className="space-y-2">
                  <div className="flex items-center text-light-gray">
                    <Car className="mr-2" size={16} />
                    {booking.vehicles?.year} {booking.vehicles?.make} {booking.vehicles?.model}
                  </div>
                  <div className="flex items-center text-light-gray">
                    <span className="mr-2">Color:</span>
                    {booking.vehicles?.color}
                  </div>
                  <div className="flex items-center text-light-gray">
                    <span className="mr-2">Size:</span>
                    {booking.vehicles?.vehicle_size}
                  </div>
                  {booking.vehicles?.license_plate && (
                    <div className="flex items-center text-light-gray">
                      <span className="mr-2">Plate:</span>
                      {booking.vehicles.license_plate}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Quick Actions */}
          <div className="glass-card p-6">
            <h3 className="text-lg font-semibold text-light-gray mb-4">Quick Actions</h3>
            <div className="space-y-3">
              <button 
                onClick={openMaps}
                className="w-full btn-secondary flex items-center justify-center space-x-2"
              >
                <Map size={16} />
                <span>Open in Maps</span>
              </button>
              <button className="w-full btn-secondary flex items-center justify-center space-x-2">
                <Send size={16} />
                <span>Send Confirmation</span>
              </button>
              <button className="w-full btn-secondary flex items-center justify-center space-x-2">
                <Download size={16} />
                <span>Download Details</span>
              </button>
              <Link
                to={`/admin/invoices/new?booking_id=${booking.id}`}
                className="w-full btn-primary flex items-center justify-center space-x-2"
              >
                <DollarSign size={16} />
                <span>Create Invoice</span>
              </Link>
            </div>
          </div>

          {/* Status Management */}
          <div className="glass-card p-6">
            <h3 className="text-lg font-semibold text-light-gray mb-4">Status Management</h3>
            <div className="space-y-2">
              {['pending', 'confirmed', 'in_progress', 'completed', 'cancelled'].map(status => (
                <button
                  key={status}
                  onClick={() => handleStatusChange(status)}
                  disabled={booking.status === status}
                  className={`w-full py-2 px-3 rounded-lg border text-sm transition-colors ${
                    booking.status === status
                      ? 'bg-electric-blue text-white border-electric-blue cursor-not-allowed'
                      : 'bg-navy-light/30 text-light-gray border-electric-blue/20 hover:bg-navy-light/50'
                  }`}
                >
                  {status.replace('_', ' ').toUpperCase()}
                </button>
              ))}
            </div>
          </div>

          {/* Timeline */}
          <div className="glass-card p-6">
            <h3 className="text-lg font-semibold text-light-gray mb-4">Timeline</h3>
            <div className="space-y-4">
              {/* Show booking creation */}
              <div className="flex items-start space-x-3">
                <div className="w-2 h-2 bg-electric-blue rounded-full mt-2"></div>
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <p className="text-sm text-light-gray font-medium">Booking Created</p>
                    <p className="text-xs text-light-gray/60">
                      {format(new Date(booking.created_at), 'MMM dd, yyyy HH:mm')}
                    </p>
                  </div>
                </div>
              </div>

              {/* Show timeline events */}
              {timeline.map((event, index) => (
                <div key={event.id || index} className="flex items-start space-x-3">
                  <div className={`w-2 h-2 rounded-full mt-2 ${
                    event.action === 'booking_deleted' ? 'bg-red-400' :
                    event.action === 'booking_updated' ? 'bg-yellow-400' :
                    event.action === 'status_changed' ? 'bg-blue-400' :
                    'bg-green-400'
                  }`}></div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <p className="text-sm text-light-gray font-medium">
                        {event.action.replace('_', ' ').toUpperCase()}
                      </p>
                      <p className="text-xs text-light-gray/60">
                        {format(new Date(event.created_at), 'MMM dd, yyyy HH:mm')}
                      </p>
                    </div>
                    {event.details && (
                      <p className="text-xs text-light-gray/70 mt-1">
                        {typeof event.details === 'string' 
                          ? event.details 
                          : JSON.stringify(event.details)
                        }
                      </p>
                    )}
                    <div className="flex items-center space-x-4 mt-1 text-xs text-light-gray/50">
                      {event.ip_address && (
                        <span>IP: {event.ip_address}</span>
                      )}
                      {event.user_agent && (
                        <span className="truncate max-w-[200px]" title={event.user_agent}>
                          {event.user_agent.includes('Chrome') ? 'Chrome' :
                           event.user_agent.includes('Firefox') ? 'Firefox' :
                           event.user_agent.includes('Safari') ? 'Safari' :
                           'Browser'}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              ))}

              {/* Show last updated if different from creation */}
              {booking.updated_at && booking.updated_at !== booking.created_at && timeline.length === 0 && (
                <div className="flex items-start space-x-3">
                  <div className="w-2 h-2 bg-blue-400 rounded-full mt-2"></div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <p className="text-sm text-light-gray font-medium">Last Updated</p>
                      <p className="text-xs text-light-gray/60">
                        {format(new Date(booking.updated_at), 'MMM dd, yyyy HH:mm')}
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default BookingDetail
