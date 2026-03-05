import { useState, useEffect } from 'react'
import { Link, useParams, useNavigate } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import { useAuthStore } from '../../store/authStore-emergency'
import { 
  Calendar, Clock, DollarSign, Car, ArrowLeft, 
  MapPin, Phone, Mail, CheckCircle, AlertCircle,
  User, FileText, Download, MessageSquare 
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
      const { data: clientData } = await supabase
        .from('clients')
        .select('*')
        .eq('user_id', user.id)
        .single()

      if (!clientData) {
        toast.error('Client data not found')
        navigate('/client-portal')
        return
      }

      setClient(clientData)

      // Get booking data
      const { data: bookingData } = await supabase
        .from('bookings')
        .select('*')
        .eq('id', id)
        .eq('client_id', clientData.id)
        .single()

      if (!bookingData) {
        toast.error('Booking not found')
        navigate('/client-portal')
        return
      }

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
    if (!confirm('Are you sure you want to cancel this booking? Cancellation policies may apply.')) {
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
        .eq('id', booking.id)

      if (error) throw error

      toast.success('Booking cancelled successfully')
      loadBookingData() // Reload booking data
    } catch (error) {
      console.error('Error cancelling booking:', error)
      toast.error('Failed to cancel booking')
    } finally {
      setCancelling(false)
    }
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
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-electric-blue"></div>
      </div>
    )
  }

  if (!booking || !client) {
    return (
      <div className="min-h-screen bg-navy-gradient pt-24 pb-20 px-4">
        <div className="max-w-2xl mx-auto text-center">
          <h1 className="text-4xl font-bold metallic-heading mb-4">Booking Not Found</h1>
          <p className="text-light-gray mb-6">The booking you're looking for doesn't exist or you don't have access to it.</p>
          <Link to="/client-portal" className="btn-primary">
            Back to Dashboard
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-navy-gradient">
      <ClientNavigation />
      <div className="pt-16 pb-20 px-4">
        <div className="max-w-4xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex justify-between items-start">
          <div>
            <Link
              to="/client-portal"
              className="text-light-gray hover:text-electric-blue transition-colors flex items-center mb-4"
            >
              <ArrowLeft size={20} className="mr-2" />
              Back to Dashboard
            </Link>
            <h1 className="text-4xl font-bold metallic-heading mb-2">Booking Details</h1>
            <p className="text-light-gray">Booking #{booking.booking_number}</p>
          </div>
          
          <div className="flex items-center gap-3">
            <span className={`px-4 py-2 rounded-full text-sm font-semibold border flex items-center gap-2 ${getStatusColor(booking.status)}`}>
              {getStatusIcon(booking.status)}
              {booking.status.replace('_', ' ').toUpperCase()}
            </span>
          </div>
        </div>

        {/* Booking Overview Card */}
        <div className="glass-card">
          <h2 className="text-2xl font-bold metallic-heading mb-6">Service Information</h2>
          
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

              <div className="bg-navy-dark/50 border border-electric-blue/20 rounded-lg p-4">
                <div className="flex items-center mb-3">
                  <DollarSign className="text-electric-blue mr-3" size={20} />
                  <h3 className="font-bold text-metallic-silver">Pricing</h3>
                </div>
                <p className="text-2xl font-bold text-bright-cyan">${booking.total}</p>
                {booking.deposit_amount && (
                  <p className="text-sm text-light-gray">
                    Deposit paid: ${booking.deposit_amount}
                  </p>
                )}
              </div>
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
                  <p className="text-sm text-light-gray mt-2">{booking.service_address}</p>
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
        <div className="glass-card">
          <h2 className="text-2xl font-bold metallic-heading mb-6">Actions</h2>
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

            <button className="bg-electric-blue/20 border border-electric-blue/30 rounded-lg p-4 hover:bg-electric-blue/30 transition-colors text-left">
              <div className="flex items-center">
                <MessageSquare className="text-electric-blue mr-3" size={20} />
                <div>
                  <p className="font-bold text-metallic-silver mb-1">Contact Support</p>
                  <p className="text-sm text-light-gray">Get help with your booking</p>
                </div>
              </div>
            </button>

            <button className="bg-electric-blue/20 border border-electric-blue/30 rounded-lg p-4 hover:bg-electric-blue/30 transition-colors text-left">
              <div className="flex items-center">
                <Download className="text-electric-blue mr-3" size={20} />
                <div>
                  <p className="font-bold text-metallic-silver mb-1">Download Receipt</p>
                  <p className="text-sm text-light-gray">Get a PDF receipt for this booking</p>
                </div>
              </div>
            </button>

            <Link
              to="/book-now"
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
    </div>
  )
}

export default ClientBookingDetail
