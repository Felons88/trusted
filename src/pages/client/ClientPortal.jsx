import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import { useAuthStore } from '../../store/authStore'
import { Calendar, Car, DollarSign, Clock, Plus, Eye } from 'lucide-react'
import { format } from 'date-fns'
import toast from 'react-hot-toast'

function ClientPortal() {
  const { user } = useAuthStore()
  const [client, setClient] = useState(null)
  const [bookings, setBookings] = useState([])
  const [vehicles, setVehicles] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (user) {
      loadClientData()
    }
  }, [user])

  const loadClientData = async () => {
    try {
      const { data: clientData } = await supabase
        .from('clients')
        .select('*')
        .eq('user_id', user.id)
        .single()

      if (clientData) {
        setClient(clientData)

        const { data: bookingsData } = await supabase
          .from('bookings')
          .select('*')
          .eq('client_id', clientData.id)
          .order('created_at', { ascending: false })
          .limit(5)

        const { data: vehiclesData } = await supabase
          .from('vehicles')
          .select('*')
          .eq('client_id', clientData.id)
          .eq('is_active', true)

        setBookings(bookingsData || [])
        setVehicles(vehiclesData || [])
      }

      setLoading(false)
    } catch (error) {
      console.error('Error loading client data:', error)
      toast.error('Failed to load data')
      setLoading(false)
    }
  }

  const stats = {
    totalBookings: client?.total_bookings || 0,
    totalSpent: client?.total_spent || 0,
    activeVehicles: vehicles.length,
    upcomingBookings: bookings.filter(b => 
      new Date(b.preferred_date) >= new Date() && b.status !== 'cancelled'
    ).length,
  }

  const getStatusColor = (status) => {
    const colors = {
      pending: 'bg-yellow-500/20 text-yellow-400',
      confirmed: 'bg-blue-500/20 text-blue-400',
      in_progress: 'bg-purple-500/20 text-purple-400',
      completed: 'bg-green-500/20 text-green-400',
      cancelled: 'bg-red-500/20 text-red-400',
    }
    return colors[status] || colors.pending
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-electric-blue"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-navy-gradient pt-24 pb-20 px-4">
      <div className="max-w-7xl mx-auto space-y-8">
        <div>
          <h1 className="text-4xl font-bold metallic-heading mb-2">
            Welcome back, {client?.full_name?.split(' ')[0]}!
          </h1>
          <p className="text-light-gray">Manage your vehicles and appointments</p>
        </div>

        <div className="grid md:grid-cols-4 gap-6">
          <div className="glass-card">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-light-gray text-sm mb-1">Total Bookings</p>
                <p className="text-3xl font-bold text-electric-blue">{stats.totalBookings}</p>
              </div>
              <Calendar className="text-electric-blue" size={32} />
            </div>
          </div>

          <div className="glass-card">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-light-gray text-sm mb-1">Total Spent</p>
                <p className="text-3xl font-bold text-bright-cyan">${stats.totalSpent}</p>
              </div>
              <DollarSign className="text-bright-cyan" size={32} />
            </div>
          </div>

          <div className="glass-card">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-light-gray text-sm mb-1">My Vehicles</p>
                <p className="text-3xl font-bold text-electric-blue">{stats.activeVehicles}</p>
              </div>
              <Car className="text-electric-blue" size={32} />
            </div>
          </div>

          <div className="glass-card">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-light-gray text-sm mb-1">Upcoming</p>
                <p className="text-3xl font-bold text-bright-cyan">{stats.upcomingBookings}</p>
              </div>
              <Clock className="text-bright-cyan" size={32} />
            </div>
          </div>
        </div>

        <div className="grid lg:grid-cols-2 gap-8">
          <div className="glass-card">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold metallic-heading">My Vehicles</h2>
              <Link to="/client-portal/vehicles/add" className="btn-secondary text-sm">
                <Plus size={16} className="inline mr-1" />
                Add Vehicle
              </Link>
            </div>

            {vehicles.length === 0 ? (
              <div className="text-center py-8">
                <Car className="text-light-gray mx-auto mb-4" size={48} />
                <p className="text-light-gray mb-4">You Have No Vehicles Yet. </p>
                <Link to="/client-portal/vehicles/add" className="btn-primary inline-block">
                  Add Your First Vehicle
                </Link>
              </div>
            ) : (
              <div className="space-y-4">
                {vehicles.map((vehicle) => (
                  <div
                    key={vehicle.id}
                    className="bg-navy-dark/50 border border-electric-blue/20 rounded-lg p-4 hover:border-electric-blue transition-all"
                  >
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="font-bold text-metallic-silver">
                          {vehicle.year} {vehicle.make} {vehicle.model}
                        </h3>
                        <p className="text-sm text-light-gray capitalize">{vehicle.size}</p>
                        {vehicle.color && (
                          <p className="text-sm text-light-gray">{vehicle.color}</p>
                        )}
                      </div>
                      <Link
                        to={`/client-portal/vehicles/${vehicle.id}`}
                        className="text-electric-blue hover:text-bright-cyan"
                      >
                        <Eye size={20} />
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="glass-card">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold metallic-heading">Recent Bookings</h2>
              <Link to="/book-now" className="btn-secondary text-sm">
                <Plus size={16} className="inline mr-1" />
                New Booking
              </Link>
            </div>

            {bookings.length === 0 ? (
              <div className="text-center py-8">
                <Calendar className="text-light-gray mx-auto mb-4" size={48} />
                <p className="text-light-gray mb-4">No bookings yet</p>
                <Link to="/book-now" className="btn-primary inline-block">
                  Book Your First Service
                </Link>
              </div>
            ) : (
              <div className="space-y-4">
                {bookings.map((booking) => (
                  <div
                    key={booking.id}
                    className="bg-navy-dark/50 border border-electric-blue/20 rounded-lg p-4"
                  >
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <p className="font-bold text-metallic-silver">{booking.booking_number}</p>
                        <p className="text-sm text-light-gray">
                          {format(new Date(booking.preferred_date), 'MMM dd, yyyy')}
                        </p>
                      </div>
                      <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getStatusColor(booking.status)}`}>
                        {booking.status}
                      </span>
                    </div>
                    <p className="text-light-gray text-sm capitalize">{booking.service_type} Detail</p>
                    <div className="flex justify-between items-center mt-3 pt-3 border-t border-electric-blue/20">
                      <span className="text-bright-cyan font-bold">${booking.total}</span>
                      <Link
                        to={`/client-portal/bookings/${booking.id}`}
                        className="text-electric-blue hover:text-bright-cyan text-sm"
                      >
                        View Details →
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="glass-card">
          <h2 className="text-2xl font-bold metallic-heading mb-6">Quick Actions</h2>
          <div className="grid md:grid-cols-3 gap-4">
            <Link
              to="/book-now"
              className="bg-electric-blue/20 border border-electric-blue/30 rounded-lg p-6 hover:bg-electric-blue/30 transition-all text-center"
            >
              <Calendar className="text-electric-blue mx-auto mb-3" size={32} />
              <h3 className="font-bold text-metallic-silver mb-2">Book Service</h3>
              <p className="text-sm text-light-gray">Schedule a new detailing appointment</p>
            </Link>

            <Link
              to="/client-portal/vehicles"
              className="bg-electric-blue/20 border border-electric-blue/30 rounded-lg p-6 hover:bg-electric-blue/30 transition-all text-center"
            >
              <Car className="text-electric-blue mx-auto mb-3" size={32} />
              <h3 className="font-bold text-metallic-silver mb-2">Manage Vehicles</h3>
              <p className="text-sm text-light-gray">Add or update your vehicle information</p>
            </Link>

            <Link
              to="/client-portal/settings"
              className="bg-electric-blue/20 border border-electric-blue/30 rounded-lg p-6 hover:bg-electric-blue/30 transition-all text-center"
            >
              <DollarSign className="text-electric-blue mx-auto mb-3" size={32} />
              <h3 className="font-bold text-metallic-silver mb-2">Payment Methods</h3>
              <p className="text-sm text-light-gray">Manage saved payment methods</p>
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}

export default ClientPortal
