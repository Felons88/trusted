import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { Calendar, Clock, Car, DollarSign, ArrowLeft, CheckCircle, AlertCircle } from 'lucide-react'
import { supabase } from '../../lib/supabase'
import { useAuthStore } from '../../store/authStore'
import ClientNavigation from '../../components/ClientNavigation'

function ClientBookings() {
  const [bookings, setBookings] = useState([])
  const [loading, setLoading] = useState(true)
  const { user } = useAuthStore()

  useEffect(() => {
    if (user) {
      loadBookings()
    }
  }, [user])

  const loadBookings = async () => {
    try {
      // Get client data
      const { data: clients } = await supabase
        .from('clients')
        .select('*')
        .eq('user_id', user.id)

      if (!clients || clients.length === 0) {
        setLoading(false)
        return
      }

      const client = clients[0]

      // Load bookings for this client
      const { data: bookingsData, error } = await supabase
        .from('bookings')
        .select(`
          *,
          vehicles:vehicle_id (*)
        `)
        .eq('client_id', client.id)
        .order('preferred_date', { ascending: false })

      if (error) throw error
      setBookings(bookingsData || [])
    } catch (error) {
      console.error('Error loading bookings:', error)
    } finally {
      setLoading(false)
    }
  }

  const getStatusColor = (status) => {
    const colors = {
      pending: 'bg-yellow-500/20 text-yellow-400',
      confirmed: 'bg-blue-500/20 text-blue-400',
      in_progress: 'bg-purple-500/20 text-purple-400',
      completed: 'bg-green-500/20 text-green-400',
      cancelled: 'bg-red-500/20 text-red-400'
    }
    return colors[status] || 'bg-gray-500/20 text-gray-400'
  }

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 flex items-center justify-center">
        <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-electric-blue"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900">
      <ClientNavigation />
      
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">My Bookings</h1>
          <p className="text-light-gray">View and manage your detailing appointments</p>
        </div>

        {bookings.length === 0 ? (
          <div className="text-center py-12">
            <Calendar className="mx-auto h-16 w-16 text-light-gray mb-4" />
            <h3 className="text-xl font-semibold text-white mb-2">No bookings yet</h3>
            <p className="text-light-gray mb-6">Schedule your first mobile detailing service</p>
            <Link 
              to="/client-portal/bookings/new"
              className="inline-flex items-center gap-2 px-6 py-3 bg-electric-blue hover:bg-electric-blue/90 rounded-lg text-white font-semibold transition-colors"
            >
              <Calendar size={20} />
              Book Appointment
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {bookings.map((booking) => (
              <div
                key={booking.id}
                className="bg-gradient-to-br from-navy-dark/30 to-navy-dark/50 backdrop-blur-xl rounded-2xl p-6 border border-electric-blue/20 hover:border-electric-blue/40 transition-all"
              >
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h3 className="text-xl font-bold text-metallic-silver mb-1">
                      {booking.service_type?.charAt(0).toUpperCase() + booking.service_type?.slice(1)} Detail
                    </h3>
                    <div className="flex items-center gap-4 text-sm text-light-gray/60">
                      <div className="flex items-center gap-1">
                        <Calendar size={14} />
                        {formatDate(booking.preferred_date)}
                      </div>
                      <div className="flex items-center gap-1">
                        <Clock size={14} />
                        {booking.preferred_time}
                      </div>
                    </div>
                  </div>
                  <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getStatusColor(booking.status)}`}>
                    {booking.status?.replace('_', ' ').toUpperCase()}
                  </span>
                </div>

                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <Car className="h-5 w-5 text-electric-blue" />
                    <div>
                      <p className="text-sm text-light-gray">Vehicle</p>
                      <p className="font-semibold text-metallic-silver">
                        {booking.vehicles?.year} {booking.vehicles?.make} {booking.vehicles?.model}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <DollarSign className="h-5 w-5 text-electric-blue" />
                    <div>
                      <p className="text-sm text-light-gray">Total Cost</p>
                      <p className="font-semibold text-metallic-silver">${booking.total || '0.00'}</p>
                    </div>
                  </div>

                  {booking.service_address && (
                    <div className="flex items-start gap-3">
                      <div className="h-5 w-5 text-electric-blue mt-0.5">📍</div>
                      <div>
                        <p className="text-sm text-light-gray">Service Address</p>
                        <p className="font-semibold text-metallic-silver text-sm">{booking.service_address}</p>
                      </div>
                    </div>
                  )}

                  {booking.notes && (
                    <div>
                      <p className="text-sm text-light-gray mb-1">Notes</p>
                      <p className="text-metallic-silver text-sm">{booking.notes}</p>
                    </div>
                  )}
                </div>

                <div className="flex justify-between items-center mt-6 pt-4 border-t border-electric-blue/20">
                  <Link 
                    to={`/client-portal/bookings/${booking.id}`}
                    className="text-electric-blue hover:text-electric-blue/80 text-sm font-medium transition-colors"
                  >
                    View Details
                  </Link>
                  <span className="text-xs text-light-gray">
                    Booking #{booking.invoice_number || booking.id?.slice(0, 8)}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Quick Actions */}
        <div className="mt-8 flex justify-center">
          <Link 
            to="/client-portal/bookings/new"
            className="inline-flex items-center gap-2 px-6 py-3 bg-electric-blue hover:bg-electric-blue/90 rounded-lg text-white font-semibold transition-colors"
          >
            <Calendar size={20} />
            Book New Appointment
          </Link>
        </div>
      </div>
    </div>
  )
}

export default ClientBookings
