import { useState, useEffect } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import { format } from 'date-fns'
import { 
  ArrowLeft, Edit, Trash2, Calendar, Clock, User, Car, DollarSign, 
  MapPin, Phone, Mail, CheckCircle, XCircle, AlertCircle, MoreVertical,
  FileText, Download, Send, Activity, Settings, UserPlus
} from 'lucide-react'
import toast from 'react-hot-toast'

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
      const { data, error } = await supabase
        .from('bookings')
        .select(`
          *,
          clients (full_name, email, phone, address),
          vehicles (year, make, model, color, license_plate, vehicle_size)
        `)
        .eq('id', id)
        .single()

      if (error) throw error
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
                    <span className="text-light-gray">{booking.estimated_duration || 120} minutes</span>
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
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-light-gray">Subtotal:</span>
                    <span className="text-light-gray">${booking.subtotal || '0.00'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-light-gray">Tax:</span>
                    <span className="text-light-gray">${booking.tax_amount || '0.00'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-light-gray">Total:</span>
                    <span className="text-xl font-bold text-green-400">
                      ${booking.total_cost?.toFixed(2) || '0.00'}
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
                    <div className="flex items-center text-light-gray">
                      <MapPin className="mr-2" size={16} />
                      {booking.clients.address}
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
