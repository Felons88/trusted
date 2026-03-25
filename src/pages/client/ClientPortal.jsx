import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import { useAuthStore } from '../../store/authStore'
import { Calendar, Car, DollarSign, Clock, Plus, Eye, RefreshCw, Settings, User, Mail } from 'lucide-react'
import { format } from 'date-fns'
import ClientNavigation from '../../components/ClientNavigation'
import EmailHistory from '../../components/EmailHistory'
import toast from 'react-hot-toast'

function ClientPortal() {
  const { user } = useAuthStore()
  const [client, setClient] = useState(null)
  const [bookings, setBookings] = useState([])
  const [vehicles, setVehicles] = useState([])
  const [payments, setPayments] = useState([])
  const [activeTab, setActiveTab] = useState('bookings')
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
      
      console.log('Loading client data for user:', user?.id)
      
      if (!user?.id) {
        console.error('No user ID found')
        setLoading(false)
        return
      }
      
      // First try to find existing client record
      const { data: clientData, error: clientError } = await supabase
        .from('clients')
        .select('*')
        .eq('user_id', user.id)
        .limit(1)  // Only get the first match

      if (clientError) {
        console.error('Client query error:', clientError)
        toast.error('Failed to load client data')
        setLoading(false)
        return
      }

      console.log('Client lookup result:', clientData)

      // Use the first client found (or create new if none exist)
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

        // Load payments (invoices) for existing client
        const { data: paymentsData } = await supabase
          .from('invoices')
          .select('*')
          .eq('client_id', existingClient.id)
          .order('created_at', { ascending: false })
          .limit(5)

        console.log('Loaded payments:', paymentsData)
        setBookings(bookingsData || [])
        setVehicles(vehiclesData || [])
        setPayments(paymentsData || [])
      } else {
        // Double-check no client exists before creating a new one
        console.log('No client record found, double-checking before creating...')
        
        const { data: doubleCheck, error: checkError } = await supabase
          .from('clients')
          .select('id')
          .eq('user_id', user.id)
          .limit(1)

        if (checkError) {
          console.error('Error double-checking client:', checkError)
          setLoading(false)
          return
        }

        if (doubleCheck && doubleCheck.length > 0) {
          console.log('Found existing client on double-check, using it:', doubleCheck[0])
          setClient(doubleCheck[0])
          setBookings([])
          setVehicles([])
          setPayments([])
        } else {
          // Create a client record for this user
          console.log('Confirmed no client exists, creating new one...')
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
          setPayments([])
        }
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
      setPayments([])
      
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
    totalBookings: bookings.length,
    totalSpent: payments.filter(p => p.status === 'paid').reduce((sum, invoice) => sum + (invoice.total_charged || invoice.total || 0), 0),
    activeVehicles: vehicles.length,
    upcomingBookings: bookings.filter(b => {
      const bookingDate = new Date(b.booking_date || b.preferred_date)
      const sevenDaysFromNow = new Date()
      sevenDaysFromNow.setDate(sevenDaysFromNow.getDate() + 7)
      const today = new Date()
      today.setHours(0, 0, 0, 0)
      
      return b.status === 'confirmed' && 
             bookingDate >= today && 
             bookingDate <= sevenDaysFromNow
    }).length,
    paidPayments: payments.filter(payment => payment.status === 'paid').length,
    pendingPayments: payments.filter(payment => payment.status !== 'paid').length,
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
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 flex items-center justify-center">
        <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-electric-blue"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900">
      <ClientNavigation />
      
      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="space-y-8">
          {/* Stats Overview */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Link
              to="/client-portal/bookings"
              className="group relative overflow-hidden bg-gradient-to-br from-electric-blue/10 to-bright-cyan/10 backdrop-blur-xl rounded-2xl p-6 border border-electric-blue/20 hover:border-electric-blue/40 transition-all duration-300 hover:scale-[1.02]"
            >
              <div className="absolute inset-0 bg-gradient-to-br from-electric-blue/5 to-bright-cyan/5 opacity-0 group-hover:opacity-100 transition-opacity"></div>
              <div className="relative">
                <div className="flex items-center justify-between mb-4">
                  <div className="p-3 bg-gradient-to-br from-electric-blue to-bright-cyan rounded-xl shadow-lg">
                    <Calendar className="text-white" size={20} />
                  </div>
                  <div className="text-xs text-light-gray/60 uppercase tracking-wide">View All</div>
                </div>
                <div>
                  <p className="text-3xl font-bold metallic-heading mb-1">{stats.totalBookings}</p>
                  <p className="text-light-gray/80 text-sm">Total Bookings</p>
                </div>
              </div>
            </Link>

            <Link
              to="/client-portal/invoices"
              className="group relative overflow-hidden bg-gradient-to-br from-green-500/10 to-emerald-500/10 backdrop-blur-xl rounded-2xl p-6 border border-green-500/20 hover:border-green-500/40 transition-all duration-300 hover:scale-[1.02]"
            >
              <div className="absolute inset-0 bg-gradient-to-br from-green-500/5 to-emerald-500/5 opacity-0 group-hover:opacity-100 transition-opacity"></div>
              <div className="relative">
                <div className="flex items-center justify-between mb-4">
                  <div className="p-3 bg-gradient-to-br from-green-500 to-emerald-500 rounded-xl shadow-lg">
                    <DollarSign className="text-white" size={20} />
                  </div>
                  <div className="text-xs text-light-gray/60 uppercase tracking-wide">View Receipts</div>
                </div>
                <div>
                  <p className="text-3xl font-bold metallic-heading mb-1">${stats.totalSpent}</p>
                  <p className="text-light-gray/80 text-sm">Total Spent</p>
                </div>
              </div>
            </Link>

            <Link
              to="/client-portal/vehicles"
              className="group relative overflow-hidden bg-gradient-to-br from-purple-500/10 to-pink-500/10 backdrop-blur-xl rounded-2xl p-6 border border-purple-500/20 hover:border-purple-500/40 transition-all duration-300 hover:scale-[1.02]"
            >
              <div className="absolute inset-0 bg-gradient-to-br from-purple-500/5 to-pink-500/5 opacity-0 group-hover:opacity-100 transition-opacity"></div>
              <div className="relative">
                <div className="flex items-center justify-between mb-4">
                  <div className="p-3 bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl shadow-lg">
                    <Car className="text-white" size={20} />
                  </div>
                  <div className="text-xs text-light-gray/60 uppercase tracking-wide">Manage</div>
                </div>
                <div>
                  <p className="text-3xl font-bold metallic-heading mb-1">{stats.activeVehicles}</p>
                  <p className="text-light-gray/80 text-sm">My Vehicles</p>
                </div>
              </div>
            </Link>

            <div className="group relative overflow-hidden bg-gradient-to-br from-orange-500/10 to-red-500/10 backdrop-blur-xl rounded-2xl p-6 border border-orange-500/20 hover:border-orange-500/40 transition-all duration-300">
              <div className="absolute inset-0 bg-gradient-to-br from-orange-500/5 to-red-500/5 opacity-0 group-hover:opacity-100 transition-opacity"></div>
              <div className="relative">
                <div className="flex items-center justify-between mb-4">
                  <div className="p-3 bg-gradient-to-br from-orange-500 to-red-500 rounded-xl shadow-lg">
                    <Clock className="text-white" size={20} />
                  </div>
                  <div className="text-xs text-light-gray/60 uppercase tracking-wide">Scheduled</div>
                </div>
                <div>
                  <p className="text-3xl font-bold metallic-heading mb-1">{stats.upcomingBookings}</p>
                  <p className="text-light-gray/80 text-sm">Upcoming</p>
                </div>
              </div>
            </div>
          </div>

          {/* Navigation Tabs */}
          <div className="bg-navy-dark/30 backdrop-blur-xl rounded-2xl p-2 border border-electric-blue/20 mb-8">
            <div className="flex space-x-1">
              <button
                onClick={() => setActiveTab('bookings')}
                className={`flex items-center space-x-2 px-4 py-2 rounded-lg font-semibold transition-all ${
                  activeTab === 'bookings' 
                    ? 'bg-electric-blue text-white' 
                    : 'text-light-gray hover:text-metallic-silver hover:bg-navy-dark/50'
                }`}
              >
                <Calendar size={18} />
                <span>Bookings</span>
              </button>
              <button
                onClick={() => setActiveTab('vehicles')}
                className={`flex items-center space-x-2 px-4 py-2 rounded-lg font-semibold transition-all ${
                  activeTab === 'vehicles' 
                    ? 'bg-electric-blue text-white' 
                    : 'text-light-gray hover:text-metallic-silver hover:bg-navy-dark/50'
                }`}
              >
                <Car size={18} />
                <span>Vehicles</span>
              </button>
              <button
                onClick={() => setActiveTab('payments')}
                className={`flex items-center space-x-2 px-4 py-2 rounded-lg font-semibold transition-all ${
                  activeTab === 'payments' 
                    ? 'bg-electric-blue text-white' 
                    : 'text-light-gray hover:text-metallic-silver hover:bg-navy-dark/50'
                }`}
              >
                <DollarSign size={18} />
                <span>Payments</span>
              </button>
              <button
                onClick={() => setActiveTab('emails')}
                className={`flex items-center space-x-2 px-4 py-2 rounded-lg font-semibold transition-all ${
                  activeTab === 'emails' 
                    ? 'bg-electric-blue text-white' 
                    : 'text-light-gray hover:text-metallic-silver hover:bg-navy-dark/50'
                }`}
              >
                <Mail size={18} />
                <span>Email History</span>
              </button>
            </div>
          </div>

          {/* Tab Content */}
          {activeTab === 'bookings' && (
            <div className="space-y-6">
              {/* Recent Bookings */}
              <div className="bg-gradient-to-br from-navy-dark/30 to-navy-dark/50 backdrop-blur-xl rounded-2xl p-6 border border-electric-blue/20">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-2xl font-bold metallic-heading">Recent Bookings</h2>
                  <Link 
                    to="/client-portal/bookings" 
                    className="text-electric-blue hover:text-bright-cyan flex items-center space-x-1"
                  >
                    <Eye size={20} />
                    <span>View All</span>
                  </Link>
                </div>
                
                {bookings.length === 0 ? (
                  <div className="text-center py-12">
                    <div className="relative inline-block mb-6">
                      <div className="absolute inset-0 bg-electric-blue/20 blur-2xl rounded-full"></div>
                      <div className="relative bg-navy-dark/50 border border-electric-blue/20 p-6 rounded-2xl">
                        <Calendar className="text-light-gray mx-auto" size={48} />
                      </div>
                    </div>
                    <h3 className="text-xl font-semibold text-metallic-silver mb-3">No Bookings Yet</h3>
                    <p className="text-light-gray/60 mb-6 max-w-sm mx-auto">
                      Book your first detailing appointment to get started
                    </p>
                    <Link 
                      to="/client-portal/bookings/add" 
                      className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-electric-blue to-bright-cyan hover:from-electric-blue/90 hover:to-bright-cyan/90 rounded-lg text-white font-semibold shadow-lg transition-all"
                    >
                      <Plus size={18} />
                      Book Appointment
                    </Link>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {bookings.slice(0, 5).map((booking) => (
                      <div
                        key={booking.id}
                        className="bg-navy-dark/50 border border-navy-dark rounded-lg p-4 hover:border-electric-blue/40 transition-all"
                      >
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="font-semibold text-white">
                              {booking.services?.name || 'Service'}
                            </p>
                            <p className="text-sm text-light-gray">
                              {format(new Date(booking.preferred_date), 'MMM dd, yyyy')} at {booking.preferred_time || 'TBD'}
                            </p>
                          </div>
                          <div className={`px-3 py-1 rounded-full text-xs font-semibold ${getStatusColor(booking.status)}`}>
                            {booking.status}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {activeTab === 'vehicles' && (
            <div className="space-y-6">
              {/* My Vehicles */}
              <div className="bg-gradient-to-br from-navy-dark/30 to-navy-dark/50 backdrop-blur-xl rounded-2xl p-6 border border-electric-blue/20">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-2xl font-bold metallic-heading">My Vehicles</h2>
                  <Link 
                    to="/client-portal/vehicles/add" 
                    className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-electric-blue to-bright-cyan hover:from-electric-blue/90 hover:to-bright-cyan/90 rounded-lg text-white font-semibold shadow-lg transition-all"
                  >
                    <Plus size={16} />
                    Add Vehicle
                  </Link>
                </div>

                {vehicles.length === 0 ? (
                  <div className="text-center py-12">
                    <div className="relative inline-block mb-6">
                      <div className="absolute inset-0 bg-electric-blue/20 blur-2xl rounded-full"></div>
                      <div className="relative bg-navy-dark/50 border border-electric-blue/20 p-6 rounded-2xl">
                        <Car className="text-light-gray mx-auto" size={48} />
                      </div>
                    </div>
                    <h3 className="text-xl font-semibold text-metallic-silver mb-3">No Vehicles Yet</h3>
                    <p className="text-light-gray/60 mb-6 max-w-sm mx-auto">
                      Add your first vehicle to start booking appointments
                    </p>
                    <Link 
                      to="/client-portal/vehicles/add" 
                      className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-electric-blue to-bright-cyan hover:from-electric-blue/90 hover:to-bright-cyan/90 rounded-lg text-white font-semibold shadow-lg transition-all"
                    >
                      <Plus size={18} />
                      Add Your First Vehicle
                    </Link>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {vehicles.map((vehicle) => (
                      <div
                        key={vehicle.id}
                        className="bg-navy-dark/50 border border-navy-dark rounded-lg p-4 hover:border-electric-blue/40 transition-all"
                      >
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="font-semibold text-white">
                              {vehicle.year} {vehicle.make} {vehicle.model}
                            </p>
                            <p className="text-sm text-light-gray">
                              {vehicle.color} • {vehicle.license_plate || 'No plate'}
                            </p>
                          </div>
                          <Link 
                            to={`/client-portal/vehicles/${vehicle.id}`}
                            className="text-electric-blue hover:text-bright-cyan flex items-center space-x-1"
                          >
                            <Eye size={20} />
                            <span>View</span>
                          </Link>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {activeTab === 'payments' && (
            <div className="space-y-6">
              {/* Payment History */}
              <div className="bg-gradient-to-br from-navy-dark/30 to-navy-dark/50 backdrop-blur-xl rounded-2xl p-6 border border-electric-blue/20">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-2xl font-bold metallic-heading">Payment History</h2>
                  <Link 
                    to="/client-portal/invoices" 
                    className="text-electric-blue hover:text-bright-cyan flex items-center space-x-1"
                  >
                    <Eye size={20} />
                    <span>View All</span>
                  </Link>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                  <div className="bg-navy-dark/50 border border-navy-dark rounded-lg p-4">
                    <p className="text-sm text-light-gray mb-2">Paid</p>
                    <p className="text-2xl font-bold text-green-400">{stats.paidPayments}</p>
                  </div>
                  <div className="bg-navy-dark/50 border border-navy-dark rounded-lg p-4">
                    <p className="text-sm text-light-gray mb-2">Pending</p>
                    <p className="text-2xl font-bold text-yellow-400">{stats.pendingPayments}</p>
                  </div>
                </div>

                {payments.length === 0 ? (
                  <div className="text-center py-12">
                    <div className="relative inline-block mb-6">
                      <div className="absolute inset-0 bg-electric-blue/20 blur-2xl rounded-full"></div>
                      <div className="relative bg-navy-dark/50 border border-electric-blue/20 p-6 rounded-2xl">
                        <DollarSign className="text-light-gray mx-auto" size={48} />
                      </div>
                    </div>
                    <h3 className="text-xl font-semibold text-metallic-silver mb-3">No Payments Yet</h3>
                    <p className="text-light-gray/60 max-w-sm mx-auto">
                      Your payment history will appear here once you have completed bookings
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {payments.slice(0, 5).map((payment) => (
                      <div
                        key={payment.id}
                        className="bg-navy-dark/50 border border-navy-dark rounded-lg p-4 hover:border-electric-blue/40 transition-all"
                      >
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="font-semibold text-white">
                              {payment.invoices?.invoice_number || `Payment #${payment.id.substring(0, 8)}`}
                            </p>
                            <p className="text-sm text-light-gray">
                              {format(new Date(payment.created_at), 'MMM dd, yyyy')}
                            </p>
                          </div>
                          <div className={`px-3 py-1 rounded-full text-xs font-semibold ${
                            payment.status === 'paid' 
                              ? 'bg-green-500/20 text-green-400 border-green-500/30' 
                              : 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30'
                          }`}>
                            {payment.status}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {activeTab === 'emails' && (
            <div className="space-y-6">
              <EmailHistory clientUserId={user?.id} />
            </div>
          )}
        </div>
      </div>
    </div>
  )

export default ClientPortal
