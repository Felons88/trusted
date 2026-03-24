import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import { useAuthStore } from '../../store/authStore'
import { Calendar, Car, DollarSign, Clock, Plus, Eye, RefreshCw, Settings, User } from 'lucide-react'
import { format } from 'date-fns'
import ClientNavigation from '../../components/ClientNavigation'
import toast from 'react-hot-toast'

function ClientPortal() {
  const { user } = useAuthStore()
  const [client, setClient] = useState(null)
  const [bookings, setBookings] = useState([])
  const [vehicles, setVehicles] = useState([])
  const [invoices, setInvoices] = useState([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)

  useEffect(() => {
    if (user) {
      loadClientData()
    }
  }, [user])

  const loadClientData = async (isRefresh = false) => {
    try {
      if (isRefresh) {
        setRefreshing(true)
      } else {
        setLoading(true)
      }
      
      console.log('Loading client data for user:', user?.email)
      
      // First try to find existing client record
      const { data: clientData, error: clientError } = await supabase
        .from('clients')
        .select('*')
        .eq('user_id', user.id)

      if (clientError) {
        console.error('Client query error:', clientError)
      }

      const existingClient = clientData && clientData.length > 0 ? clientData[0] : null

      if (existingClient) {
        console.log('Found existing client:', existingClient)
        setClient(existingClient)

        // Load bookings for existing client
        const { data: bookingsData } = await supabase
          .from('bookings')
          .select('*')
          .eq('client_id', existingClient.id)
          .order('created_at', { ascending: false })
          .limit(5)

        // Load vehicles for existing client
        const { data: vehiclesData } = await supabase
          .from('vehicles')
          .select('*')
          .eq('client_id', existingClient.id)
          .eq('is_active', true)

        // Load invoices for existing client
        const { data: invoicesData } = await supabase
          .from('invoices')
          .select('*')
          .eq('client_id', existingClient.id)
          .order('created_at', { ascending: false })
          .limit(5)

        setBookings(bookingsData || [])
        setVehicles(vehiclesData || [])
        setInvoices(invoicesData || [])
      } else {
        // Create a client record for this user
        console.log('No client record found, creating one...')
        const newClient = {
          user_id: user.id,
          full_name: user.user_metadata?.full_name || user.email?.split('@')[0] || 'Client',
          email: user.email,
          phone: user.user_metadata?.phone || '',
          address: '',
          city: '',
          state: '',
          zip_code: '',
          total_spent: 0,
          total_bookings: 0
        }

        const { data: createdClient, error: createError } = await supabase
          .from('clients')
          .insert([newClient])
          .select()
          .single()

        if (createError) {
          console.error('Error creating client:', createError)
          // Use fallback client data
          setClient(newClient)
        } else {
          console.log('Created new client:', createdClient)
          setClient(createdClient)
        }

        // Initialize empty arrays for new clients
        setBookings([])
        setVehicles([])
        setInvoices([])
      }

      if (isRefresh) {
        setRefreshing(false)
        toast.success('Data refreshed successfully!')
      } else {
        setLoading(false)
      }
    } catch (error) {
      console.error('Error loading client data:', error)
      toast.error('Failed to load data')
      
      // Set fallback data
      setClient({
        user_id: user.id,
        full_name: user.user_metadata?.full_name || user.email?.split('@')[0] || 'Client',
        email: user.email,
        total_spent: 0,
        total_bookings: 0
      })
      setBookings([])
      setVehicles([])
      setInvoices([])
      
      if (isRefresh) {
        setRefreshing(false)
      } else {
        setLoading(false)
      }
    }
  }

  const handleRefresh = () => {
    loadClientData(true)
  }

  const stats = {
    totalBookings: client?.total_bookings || 0,
    totalSpent: client?.total_spent || 0,
    activeVehicles: vehicles.length,
    upcomingBookings: bookings.filter(b => 
      new Date(b.preferred_date) >= new Date() && b.status !== 'cancelled'
    ).length,
    paidInvoices: invoices.filter(inv => inv.status === 'paid').length,
    pendingInvoices: invoices.filter(inv => inv.status !== 'paid').length,
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
    <div className="min-h-screen bg-navy-gradient">
      <ClientNavigation />
      <div className="pt-14 sm:pt-16 pb-20 px-3 sm:px-4">
        <div className="max-w-7xl mx-auto space-y-6 sm:space-y-8">
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold metallic-heading mb-2">
              Welcome back, {client?.full_name?.split(' ')[0] || 'Client'}!
            </h1>
            <p className="text-light-gray text-sm sm:text-base">Manage your vehicles and appointments</p>
            <p className="text-xs sm:text-sm text-light-gray/60 mt-1">{user?.email}</p>
          </div>
          <div className="flex gap-2 sm:gap-3">
            <button
              onClick={handleRefresh}
              disabled={refreshing}
              className="btn-secondary flex items-center gap-2 disabled:opacity-50 text-xs sm:text-sm px-3 py-2"
            >
              <RefreshCw size={14} className={refreshing ? 'animate-spin' : ''} />
              <span className="hidden xs:inline">{refreshing ? 'Refreshing...' : 'Refresh'}</span>
              <span className="xs:hidden">{refreshing ? '...' : '↻'}</span>
            </button>
            <Link to="/client-portal/settings" className="btn-secondary flex items-center gap-2 text-xs sm:text-sm px-3 py-2">
              <Settings size={14} />
              <span className="hidden xs:inline">Settings</span>
              <span className="xs:hidden">⚙</span>
            </Link>
          </div>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 lg:gap-6">
          <Link
            to="/client-portal/bookings"
            className="glass-card hover:scale-105 transition-transform duration-300 p-4 sm:p-6"
          >
            <div className="flex flex-col items-center text-center space-y-2">
              <div className="bg-electric-blue/20 p-3 sm:p-4 rounded-full">
                <Calendar className="text-electric-blue" size={24} />
              </div>
              <div>
                <p className="text-light-gray text-xs sm:text-sm mb-1">Total Bookings</p>
                <p className="text-xl sm:text-2xl lg:text-3xl font-bold metallic-heading">{stats.totalBookings}</p>
              </div>
            </div>
          </Link>

          <div className="glass-card p-4 sm:p-6">
            <div className="flex flex-col items-center text-center space-y-2">
              <div className="bg-bright-cyan/20 p-3 sm:p-4 rounded-full">
                <DollarSign className="text-bright-cyan" size={24} />
              </div>
              <div>
                <p className="text-light-gray text-xs sm:text-sm mb-1">Total Spent</p>
                <p className="text-xl sm:text-2xl lg:text-3xl font-bold metallic-heading">${stats.totalSpent}</p>
              </div>
            </div>
          </div>

          <Link
            to="/client-portal/vehicles"
            className="glass-card hover:scale-105 transition-transform duration-300 p-4 sm:p-6"
          >
            <div className="flex flex-col items-center text-center space-y-2">
              <div className="bg-electric-blue/20 p-3 sm:p-4 rounded-full">
                <Car className="text-electric-blue" size={24} />
              </div>
              <div>
                <p className="text-light-gray text-xs sm:text-sm mb-1">My Vehicles</p>
                <p className="text-xl sm:text-2xl lg:text-3xl font-bold metallic-heading">{stats.activeVehicles}</p>
              </div>
            </div>
          </Link>

          <div className="glass-card p-4 sm:p-6">
            <div className="flex flex-col items-center text-center space-y-2">
              <div className="bg-bright-cyan/20 p-3 sm:p-4 rounded-full">
                <Clock className="text-bright-cyan" size={24} />
              </div>
              <div>
                <p className="text-light-gray text-xs sm:text-sm mb-1">Upcoming</p>
                <p className="text-xl sm:text-2xl lg:text-3xl font-bold metallic-heading">{stats.upcomingBookings}</p>
              </div>
            </div>
          </div>
        </div>

        <div className="grid lg:grid-cols-2 gap-6 lg:gap-8">
          <div className="glass-card p-4 sm:p-6">
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-4 sm:mb-6 gap-3">
              <h2 className="text-lg sm:text-xl lg:text-2xl font-bold metallic-heading">My Vehicles</h2>
              <Link to="/client-portal/vehicles/add" className="btn-secondary text-sm w-full sm:w-auto justify-center">
                <Plus size={16} className="inline mr-1" />
                Add Vehicle
              </Link>
            </div>

            {vehicles.length === 0 ? (
              <div className="text-center py-6 sm:py-8">
                <Car className="text-light-gray mx-auto mb-3 sm:mb-4" size={40} />
                <p className="text-light-gray mb-3 sm:mb-4 text-sm sm:text-base">You Have No Vehicles Yet. </p>
                <Link to="/client-portal/vehicles/add" className="btn-primary inline-block text-sm">
                  Add Your First Vehicle
                </Link>
              </div>
            ) : (
              <div className="space-y-3 sm:space-y-4">
                {vehicles.map((vehicle) => (
                  <div
                    key={vehicle.id}
                    className="bg-navy-dark/50 border border-electric-blue/20 rounded-lg p-3 sm:p-4 hover:border-electric-blue transition-all"
                  >
                    <div className="flex justify-between items-start">
                      <div className="flex-1 min-w-0">
                        <h3 className="font-bold text-metallic-silver text-sm sm:text-base truncate">
                          {vehicle.year} {vehicle.make} {vehicle.model}
                        </h3>
                        <p className="text-xs sm:text-sm text-light-gray capitalize">{vehicle.size}</p>
                        {vehicle.color && (
                          <p className="text-xs sm:text-sm text-light-gray">{vehicle.color}</p>
                        )}
                      </div>
                      <Link
                        to={`/client-portal/vehicles/${vehicle.id}`}
                        className="text-electric-blue hover:text-bright-cyan ml-2 flex-shrink-0"
                      >
                        <Eye size={18} />
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="glass-card p-4 sm:p-6">
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-4 sm:mb-6 gap-3">
              <h2 className="text-lg sm:text-xl lg:text-2xl font-bold metallic-heading">Recent Bookings</h2>
              <Link to="/book-now" className="btn-secondary text-sm w-full sm:w-auto justify-center">
                <Plus size={16} className="inline mr-1" />
                New Booking
              </Link>
            </div>

            {bookings.length === 0 ? (
              <div className="text-center py-6 sm:py-8">
                <Calendar className="text-light-gray mx-auto mb-3 sm:mb-4" size={40} />
                <p className="text-light-gray mb-3 sm:mb-4 text-sm sm:text-base">No bookings yet</p>
                <Link to="/book-now" className="btn-primary inline-block text-sm">
                  Book Your First Service
                </Link>
              </div>
            ) : (
              <div className="space-y-3 sm:space-y-4">
                {bookings.map((booking) => (
                  <div
                    key={booking.id}
                    className="bg-navy-dark/50 border border-electric-blue/20 rounded-lg p-3 sm:p-4"
                  >
                    <div className="flex justify-between items-start mb-2">
                      <div className="flex-1 min-w-0">
                        <p className="font-bold text-metallic-silver text-sm sm:text-base truncate">{booking.booking_number}</p>
                        <p className="text-xs sm:text-sm text-light-gray">
                          {format(new Date(booking.preferred_date), 'MMM dd, yyyy')}
                        </p>
                      </div>
                      <span className={`px-2 py-1 rounded-full text-xs font-semibold flex-shrink-0 ${getStatusColor(booking.status)}`}>
                        {booking.status}
                      </span>
                    </div>
                    <p className="text-light-gray text-xs sm:text-sm capitalize">{booking.service_type} Detail</p>
                    <div className="flex justify-between items-center mt-3 pt-3 border-t border-electric-blue/20">
                      <span className="text-bright-cyan font-bold text-sm sm:text-base">${booking.total}</span>
                      <Link
                        to={`/client-portal/bookings/${booking.id}`}
                        className="text-electric-blue hover:text-bright-cyan text-xs sm:text-sm"
                      >
                        View Details →
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="glass-card p-4 sm:p-6">
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-4 sm:mb-6 gap-3">
              <h2 className="text-lg sm:text-xl lg:text-2xl font-bold metallic-heading">Recent Invoices</h2>
              <div className="flex gap-2">
                <div className="text-xs text-light-gray flex items-center">
                  <div className="w-2 h-2 bg-green-400 rounded-full mr-1"></div>
                  Paid: {stats.paidInvoices}
                </div>
                <div className="text-xs text-light-gray flex items-center">
                  <div className="w-2 h-2 bg-yellow-400 rounded-full mr-1"></div>
                  Pending: {stats.pendingInvoices}
                </div>
              </div>
            </div>

            {invoices.length === 0 ? (
              <div className="text-center py-6 sm:py-8">
                <DollarSign className="text-light-gray mx-auto mb-3 sm:mb-4" size={40} />
                <p className="text-light-gray mb-3 sm:mb-4 text-sm sm:text-base">No invoices yet</p>
                <Link to="/book-now" className="btn-primary inline-block text-sm">
                  Book Your First Service
                </Link>
              </div>
            ) : (
              <div className="space-y-3 sm:space-y-4">
                {invoices.map((invoice) => (
                  <div
                    key={invoice.id}
                    className="bg-navy-dark/50 border border-electric-blue/20 rounded-lg p-3 sm:p-4 hover:border-electric-blue transition-all"
                  >
                    <div className="flex justify-between items-start">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="font-bold text-metallic-silver text-sm sm:text-base">
                            Invoice #{invoice.invoice_number}
                          </h3>
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                            invoice.status === 'paid' 
                              ? 'bg-green-500/20 text-green-400' 
                              : 'bg-yellow-500/20 text-yellow-400'
                          }`}>
                            {invoice.status === 'paid' ? 'Paid' : 'Pending'}
                          </span>
                        </div>
                        <p className="text-xs sm:text-sm text-light-gray">
                          {format(new Date(invoice.created_at), 'MMM dd, yyyy')}
                        </p>
                        {invoice.due_date && (
                          <p className="text-xs text-light-gray">
                            Due: {format(new Date(invoice.due_date), 'MMM dd, yyyy')}
                          </p>
                        )}
                      </div>
                      <div className="text-right ml-2 flex-shrink-0">
                        <span className="text-bright-cyan font-bold text-sm sm:text-base">
                          ${parseFloat(invoice.total || invoice.balance_due || 0).toFixed(2)}
                        </span>
                        {invoice.status !== 'paid' && (
                          <Link
                            to={`/payment/${invoice.id}`}
                            className="block text-electric-blue hover:text-bright-cyan text-xs sm:text-sm mt-1"
                          >
                            Pay Now →
                          </Link>
                        )}
                        {invoice.status === 'paid' && (
                          <Link
                            to={`/success?invoice=${invoice.id}`}
                            className="block text-green-400 hover:text-green-300 text-xs sm:text-sm mt-1"
                          >
                            View Receipt →
                          </Link>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

        <div className="glass-card p-4 sm:p-6">
          <h2 className="text-lg sm:text-xl lg:text-2xl font-bold metallic-heading mb-4 sm:mb-6">Quick Actions</h2>
          <div className="grid sm:grid-cols-3 gap-3 sm:gap-4">
            <Link
              to="/book-now"
              className="block bg-electric-blue/20 border border-electric-blue/30 rounded-lg p-4 sm:p-6 hover:bg-electric-blue/30 transition-all text-center"
            >
              <Calendar className="text-electric-blue mx-auto mb-2 sm:mb-3" size={24} />
              <h3 className="font-bold text-metallic-silver mb-1 sm:mb-2 text-sm sm:text-base">Book Service</h3>
              <p className="text-xs sm:text-sm text-light-gray">Schedule a new detailing appointment</p>
            </Link>

            <Link
              to="/client-portal/vehicles"
              className="block bg-electric-blue/20 border border-electric-blue/30 rounded-lg p-4 sm:p-6 hover:bg-electric-blue/30 transition-all text-center"
            >
              <Car className="text-electric-blue mx-auto mb-2 sm:mb-3" size={24} />
              <h3 className="font-bold text-metallic-silver mb-1 sm:mb-2 text-sm sm:text-base">Manage Vehicles</h3>
              <p className="text-xs sm:text-sm text-light-gray">Add or update your vehicle information</p>
            </Link>

            <Link
              to="/client-portal/settings"
              className="block bg-electric-blue/20 border border-electric-blue/30 rounded-lg p-4 sm:p-6 hover:bg-electric-blue/30 transition-all text-center"
            >
              <Settings className="text-electric-blue mx-auto mb-2 sm:mb-3" size={24} />
              <h3 className="font-bold text-metallic-silver mb-1 sm:mb-2 text-sm sm:text-base">Settings</h3>
              <p className="text-xs sm:text-sm text-light-gray">Manage your profile and payment methods</p>
            </Link>
          </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default ClientPortal
