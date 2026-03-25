import { useState, useEffect } from 'react'
import { Link, useParams, useNavigate } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import { useAuthStore } from '../../store/authStore'
import { 
  Calendar, Clock, DollarSign, Car, ArrowLeft, 
  MapPin, Phone, Mail, CheckCircle, AlertCircle,
  User, FileText, Download, MessageSquare, Plus
} from 'lucide-react'
import { format } from 'date-fns'
import ClientNavigation from '../../components/ClientNavigation'
import toast from 'react-hot-toast'

function ClientBookingDetail() {
  const { user } = useAuthStore()
  const { id } = useParams()
  const navigate = useNavigate()
  const [booking, setBooking] = useState(null)
  const [client, setClient] = useState(null)
  const [vehicle, setVehicle] = useState(null)
  const [loading, setLoading] = useState(true)
  const [cancelling, setCancelling] = useState(false)

  useEffect(() => {
    if (user && id) {
      loadBookingData()
    }
  }, [user, id])

  const loadBookingData = async () => {
    try {
      setLoading(true)

      // Get client data
      const { data: clients } = await supabase
        .from('clients')
        .select('*')
        .eq('user_id', user.id)

      const clientData = clients && clients.length > 0 ? clients[0] : null

      if (!clientData) {
        toast.error('Client data not found')
        navigate('/client-portal')
        return
      }

      setClient(clientData)

      // Get booking data with addons
      const { data: bookingData } = await supabase
        .from('bookings')
        .select(`
          *,
          booking_addons (
            addons (id, name, price, duration_minutes)
          )
        `)
        .eq('id', id)
        .eq('client_id', clientData.id)
        .single()

      if (!bookingData) {
        toast.error('Booking not found')
        navigate('/client-portal')
        return
      }

      console.log('Client booking data loaded:', bookingData)
      console.log('Client booking addons:', bookingData.booking_addons)

      setBooking(bookingData)

      // Get vehicle data if vehicle_id exists
      if (bookingData.vehicle_id) {
        const { data: vehicleData } = await supabase
          .from('vehicles')
          .select('*')
          .eq('id', bookingData.vehicle_id)
          .single()

        setVehicle(vehicleData)
      }

      setLoading(false)
    } catch (error) {
      console.error('Error loading booking data:', error)
      toast.error('Failed to load booking details')
      setLoading(false)
    }
  }

  const handleCancelBooking = async () => {
    if (!confirm('Are you sure you want to cancel this booking?')) {
      return
    }

    setCancelling(true)
    try {
      const { error } = await supabase
        .from('bookings')
        .update({ 
          status: 'cancelled',
          updated_at: new Date().toISOString()
        })
        .eq('id', id)

      if (error) throw error

      toast.success('Booking cancelled successfully')
      setBooking(prev => ({ ...prev, status: 'cancelled', updated_at: new Date().toISOString() }))
    } catch (error) {
      console.error('Error cancelling booking:', error)
      toast.error('Error cancelling booking')
    } finally {
      setCancelling(false)
    }
  }

  const handleContactSupport = () => {
    // Open email client with support
    const subject = `Support Request - Booking ${booking?.invoice_number || booking?.id?.slice(0, 8)}`
    const body = `Hello Trusted Mobile Detailing,

I need help with my booking:

Booking ID: ${booking?.id}
Service: ${booking?.service_type}
Date: ${booking?.preferred_date}
Time: ${booking?.preferred_time}

Issue: [Please describe your issue here]

Thank you`
    
    window.location.href = `mailto:info@trustedmobiledetailing.com?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`
  }

  const handleDownloadReceipt = () => {
    // Generate a simple receipt for now
    const receiptContent = `
TRUSTED MOBILE DETAILING - RECEIPT

Booking ID: ${booking?.invoice_number || booking?.id?.slice(0, 8)}
Date: ${new Date().toLocaleDateString()}

SERVICE DETAILS:
Service Type: ${booking?.service_type?.charAt(0).toUpperCase() + booking?.service_type?.slice(1)} Detail
Date: ${booking?.preferred_date}
Time: ${booking?.preferred_time}
Status: ${booking?.status?.replace('_', ' ').toUpperCase()}

VEHICLE:
${vehicle?.year} ${vehicle?.make} ${vehicle?.model}
Color: ${vehicle?.color}
Size: ${vehicle?.size}

PRICING:
Subtotal: $${booking?.subtotal || '0.00'}
Total: $${booking?.total || '0.00'}

SERVICE ADDRESS:
${booking?.service_address}

NOTES:
${booking?.notes || 'None'}

Thank you for choosing Trusted Mobile Detailing!
    `.trim()

    // Create and download text file
    const blob = new Blob([receiptContent], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `receipt-${booking?.invoice_number || booking?.id?.slice(0, 8)}.txt`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
    
    toast.success('Receipt downloaded successfully')
  }

  const getStatusColor = (status) => {
    const colors = {
      pending: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
      confirmed: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
      in_progress: 'bg-purple-500/20 text-purple-400 border-purple-500/30',
      completed: 'bg-green-500/20 text-green-400 border-green-500/30',
      cancelled: 'bg-red-500/20 text-red-400 border-red-500/30',
    }
    return colors[status] || colors.pending
  }

  const getStatusIcon = (status) => {
    switch (status) {
      case 'completed':
        return <CheckCircle size={16} />
      case 'cancelled':
        return <AlertCircle size={16} />
      default:
        return <Clock size={16} />
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 flex items-center justify-center">
        <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-electric-blue"></div>
      </div>
    )
  }

  if (!booking) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 flex items-center justify-center">
        <div className="text-center">
          <Calendar className="mx-auto h-16 w-16 text-light-gray mb-4" />
          <h2 className="text-2xl font-bold text-white mb-2">Booking Not Found</h2>
          <p className="text-light-gray mb-6">The booking you're looking for doesn't exist.</p>
          <Link 
            to="/client-portal/bookings"
            className="inline-flex items-center gap-2 px-6 py-3 bg-electric-blue hover:bg-electric-blue/90 rounded-lg text-white font-semibold transition-colors"
          >
            <ArrowLeft size={20} />
            Back to Bookings
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900">
      <ClientNavigation />
      
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <Link 
            to="/client-portal/bookings"
            className="inline-flex items-center gap-2 text-light-gray hover:text-metallic-silver mb-6 transition-colors"
          >
            <ArrowLeft size={20} />
            <span>Back to Bookings</span>
          </Link>
          <h1 className="text-3xl font-bold text-white mb-2">Booking Details</h1>
          <p className="text-light-gray">View your appointment information</p>
        </div>

        {/* Service Information Card */}
        <div className="bg-navy-dark/30 backdrop-blur-xl rounded-2xl p-6 border border-electric-blue/20 mb-8">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-white">Service Information</h2>
            <span className={`px-4 py-2 rounded-full text-sm font-semibold ${getStatusColor(booking.status)}`}>
              {booking.status.replace('_', ' ').toUpperCase()}
            </span>
          </div>
          
          <div className="grid md:grid-cols-2 gap-8">
            {/* Left Column */}
            <div className="space-y-6">
              <div className="bg-navy-dark/50 border border-electric-blue/20 rounded-lg p-4">
                <div className="flex items-center mb-3">
                  <Calendar className="text-electric-blue mr-3" size={20} />
                  <h3 className="font-bold text-metallic-silver">Date & Time</h3>
                </div>
                <p className="text-metallic-silver">
                  {format(new Date(booking.preferred_date), 'EEEE, MMMM dd, yyyy')}
                </p>
                <p className="text-light-gray">
                  {booking.preferred_time || 'Time to be confirmed'}
                </p>
              </div>

              <div className="bg-navy-dark/50 border border-electric-blue/20 rounded-lg p-4">
                <div className="flex items-center mb-3">
                  <Car className="text-electric-blue mr-3" size={20} />
                  <h3 className="font-bold text-metallic-silver">Service Type</h3>
                </div>
                <p className="text-metallic-silver capitalize">{booking.service_type} Detail</p>
                <p className="text-light-gray capitalize">{booking.vehicle_size} size vehicle</p>
                {vehicle && (
                  <p className="text-sm text-light-gray mt-2">
                    {vehicle.year} {vehicle.make} {vehicle.model}
                  </p>
                )}
              </div>

              {/* Add-ons Section */}
              {booking.booking_addons && booking.booking_addons.length > 0 && (
                <div className="bg-navy-dark/50 border border-electric-blue/20 rounded-lg p-4">
                  <div className="flex items-center mb-3">
                    <Plus className="text-electric-blue mr-3" size={20} />
                    <h3 className="font-bold text-metallic-silver">Add-ons</h3>
                  </div>
                  <div className="space-y-2">
                    {booking.booking_addons.map((ba, index) => (
                      <div key={index} className="flex justify-between items-center">
                        <span className="text-metallic-silver text-sm">{ba.addons?.name}</span>
                        <span className="text-bright-cyan font-semibold">${parseFloat(ba.addons?.price || 0).toFixed(2)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Right Column */}
            <div className="space-y-6">
              <div className="bg-navy-dark/50 border border-electric-blue/20 rounded-lg p-4">
                <div className="flex items-center mb-3">
                  <MapPin className="text-electric-blue mr-3" size={20} />
                  <h3 className="font-bold text-metallic-silver">Service Location</h3>
                </div>
                <p className="text-metallic-silver">
                  {booking.service_location === 'mobile' ? 'Mobile Service' : 'Shop Location'}
                </p>
                {booking.service_address && (
                  <div className="mt-2">
                    <p className="text-sm text-light-gray">{booking.service_address}</p>
                    {booking.service_location === 'shop' && (
                      <button
                        onClick={() => window.open(`https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(booking.service_address)}`, '_blank')}
                        className="mt-2 inline-flex items-center gap-2 px-3 py-1 bg-electric-blue/20 border border-electric-blue/30 rounded-lg text-electric-blue hover:bg-electric-blue/30 transition-colors text-sm font-medium"
                      >
                        <MapPin size={14} />
                        Get Directions
                      </button>
                    )}
                  </div>
                )}
              </div>

              <div className="bg-navy-dark/50 border border-electric-blue/20 rounded-lg p-4">
                <div className="flex items-center mb-3">
                  <User className="text-electric-blue mr-3" size={20} />
                  <h3 className="font-bold text-metallic-silver">Contact Information</h3>
                </div>
                <p className="text-metallic-silver">{client.full_name}</p>
                <p className="text-sm text-light-gray">{client.phone}</p>
                <p className="text-sm text-light-gray">{client.email}</p>
              </div>

              {/* Pricing Section */}
              <div className="bg-navy-dark/50 border border-electric-blue/20 rounded-lg p-4">
                <div className="flex items-center mb-3">
                  <DollarSign className="text-electric-blue mr-3" size={20} />
                  <h3 className="font-bold text-metallic-silver">Pricing</h3>
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-light-gray">Subtotal:</span>
                    <span className="text-metallic-silver">${booking.subtotal || '0.00'}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-light-gray">Tax (6.875%):</span>
                    <span className="text-metallic-silver">${booking.tax || '0.00'}</span>
                  </div>
                  <div className="flex justify-between items-center pt-2 border-t border-electric-blue/20">
                    <span className="text-metallic-silver font-semibold">Total:</span>
                    <span className="text-2xl font-bold text-bright-cyan">${booking.total}</span>
                  </div>
                  {booking.deposit_amount && (
                    <p className="text-sm text-light-gray mt-2">
                      Deposit paid: ${booking.deposit_amount}
                    </p>
                  )}
                </div>
              </div>

              {booking.notes && (
                <div className="bg-navy-dark/50 border border-electric-blue/20 rounded-lg p-4">
                  <div className="flex items-center mb-3">
                    <FileText className="text-electric-blue mr-3" size={20} />
                    <h3 className="font-bold text-metallic-silver">Notes</h3>
                  </div>
                  <p className="text-metallic-silver">{booking.notes}</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Timeline */}
        <div className="glass-card">
          <h2 className="text-2xl font-bold metallic-heading mb-6">Booking Timeline</h2>
          <div className="space-y-4">
            <div className="flex items-start">
              <div className="bg-electric-blue/20 p-2 rounded-full mr-4">
                <Calendar className="text-electric-blue" size={16} />
              </div>
              <div>
                <p className="font-bold text-metallic-silver">Booking Created</p>
                <p className="text-sm text-light-gray">
                  {format(new Date(booking.created_at), 'MMM dd, yyyy at h:mm a')}
                </p>
              </div>
            </div>

            {booking.status !== 'pending' && (
              <div className="flex items-start">
                <div className="bg-blue-500/20 p-2 rounded-full mr-4">
                  <CheckCircle className="text-blue-400" size={16} />
                </div>
                <div>
                  <p className="font-bold text-metallic-silver">Booking Confirmed</p>
                  <p className="text-sm text-light-gray">
                    {booking.updated_at && format(new Date(booking.updated_at), 'MMM dd, yyyy at h:mm a')}
                  </p>
                </div>
              </div>
            )}

            {booking.status === 'completed' && (
              <div className="flex items-start">
                <div className="bg-green-500/20 p-2 rounded-full mr-4">
                  <CheckCircle className="text-green-400" size={16} />
                </div>
                <div>
                  <p className="font-bold text-metallic-silver">Service Completed</p>
                  <p className="text-sm text-light-gray">
                    {booking.updated_at && format(new Date(booking.updated_at), 'MMM dd, yyyy at h:mm a')}
                  </p>
                </div>
              </div>
            )}

            {booking.status === 'cancelled' && (
              <div className="flex items-start">
                <div className="bg-red-500/20 p-2 rounded-full mr-4">
                  <AlertCircle className="text-red-400" size={16} />
                </div>
                <div>
                  <p className="font-bold text-metallic-silver">Booking Cancelled</p>
                  <p className="text-sm text-light-gray">
                    {booking.updated_at && format(new Date(booking.updated_at), 'MMM dd, yyyy at h:mm a')}
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Actions */}
        <div className="bg-navy-dark/30 backdrop-blur-xl rounded-2xl p-6 border border-electric-blue/20">
          <h2 className="text-2xl font-bold text-white mb-6">Actions</h2>
          <div className="grid md:grid-cols-2 gap-4">
            {booking.status === 'pending' && (
              <button
                onClick={handleCancelBooking}
                disabled={cancelling}
                className="bg-red-500/20 border border-red-500/30 rounded-lg p-4 hover:bg-red-500/30 transition-colors text-left disabled:opacity-50"
              >
                <div className="flex items-center">
                  <AlertCircle className="text-red-400 mr-3" size={20} />
                  <div>
                    <p className="font-bold text-red-400 mb-1">Cancel Booking</p>
                    <p className="text-sm text-light-gray">Cancel this appointment</p>
                  </div>
                </div>
              </button>
            )}

            <button 
              onClick={handleContactSupport}
              className="bg-electric-blue/20 border border-electric-blue/30 rounded-lg p-4 hover:bg-electric-blue/30 transition-colors text-left"
            >
              <div className="flex items-center">
                <MessageSquare className="text-electric-blue mr-3" size={20} />
                <div>
                  <p className="font-bold text-metallic-silver mb-1">Contact Support</p>
                  <p className="text-sm text-light-gray">Get help with your booking</p>
                </div>
              </div>
            </button>

            <button 
              onClick={handleDownloadReceipt}
              className="bg-electric-blue/20 border border-electric-blue/30 rounded-lg p-4 hover:bg-electric-blue/30 transition-colors text-left"
            >
              <div className="flex items-center">
                <Download className="text-electric-blue mr-3" size={20} />
                <div>
                  <p className="font-bold text-metallic-silver mb-1">Download Receipt</p>
                  <p className="text-sm text-light-gray">Get a PDF receipt for this booking</p>
                </div>
              </div>
            </button>

            <Link
              to="/client-portal/bookings/new"
              className="bg-electric-blue/20 border border-electric-blue/30 rounded-lg p-4 hover:bg-electric-blue/30 transition-colors text-left block"
            >
              <div className="flex items-center">
                <Calendar className="text-electric-blue mr-3" size={20} />
                <div>
                  <p className="font-bold text-metallic-silver mb-1">Book Another Service</p>
                  <p className="text-sm text-light-gray">Schedule a new appointment</p>
                </div>
              </div>
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}

export default ClientBookingDetail
