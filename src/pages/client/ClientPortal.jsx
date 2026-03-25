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
  const [payments, setPayments] = useState([])
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

          {/* Vehicles & Quick Actions */}
          <div className="grid lg:grid-cols-3 gap-8">
            {/* My Vehicles */}
            <div className="lg:col-span-2 bg-gradient-to-br from-navy-dark/30 to-navy-dark/50 backdrop-blur-xl rounded-2xl p-6 border border-electric-blue/20">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-2xl font-bold metallic-heading mb-1">My Vehicles</h2>
                  <p className="text-light-gray/60 text-sm">Manage your vehicle fleet</p>
                </div>
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
                    Add your first vehicle to start booking appointments and managing your automotive services
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
                      className="group bg-navy-dark/30 border border-electric-blue/20 rounded-xl p-4 hover:border-electric-blue/40 transition-all duration-300"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          <div className="p-3 bg-gradient-to-br from-electric-blue/20 to-bright-cyan/20 rounded-xl">
                            <Car className="text-electric-blue" size={20} />
                          </div>
                          <div>
                            <h3 className="font-bold text-metallic-silver text-lg">
                              {vehicle.year} {vehicle.make} {vehicle.model}
                            </h3>
                            <p className="text-light-gray/60 text-sm capitalize">{vehicle.size}</p>
                            {vehicle.color && (
                              <p className="text-light-gray/60 text-sm">{vehicle.color}</p>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Link
                            to={`/client-portal/vehicles/${vehicle.id}/edit`}
                            className="p-2 text-light-gray/60 hover:text-electric-blue transition-colors"
                          >
                            <Settings size={16} />
                          </Link>
                          <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Quick Actions Box */}
            <div className="bg-gradient-to-br from-navy-dark/30 to-navy-dark/50 backdrop-blur-xl rounded-2xl p-6 border border-electric-blue/20">
              <div className="mb-6">
                <h2 className="text-2xl font-bold metallic-heading mb-1">Quick Actions</h2>
                <p className="text-light-gray/60 text-sm">Common tasks and shortcuts</p>
              </div>
              
              <div className="space-y-3">
                <Link 
                  to="/client-portal/bookings/new" 
                  className="w-full flex items-center gap-3 px-4 py-3 bg-gradient-to-r from-electric-blue to-bright-cyan hover:from-electric-blue/90 hover:to-bright-cyan/90 rounded-lg text-white font-semibold shadow-lg transition-all"
                >
                  <Plus size={18} />
                  <div className="flex-1 text-left">
                    <p className="font-medium">Book Appointment</p>
                    <p className="text-xs opacity-90">Schedule new detailing service</p>
                  </div>
                </Link>

                <Link 
                  to="/client-portal/vehicles/add" 
                  className="w-full flex items-center gap-3 px-4 py-3 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-500/90 hover:to-pink-500/90 rounded-lg text-white font-semibold shadow-lg transition-all"
                >
                  <Plus size={18} />
                  <div className="flex-1 text-left">
                    <p className="font-medium">Add Vehicle</p>
                    <p className="text-xs opacity-90">Register a new vehicle</p>
                  </div>
                </Link>

                <Link 
                  to="/client-portal/settings" 
                  className="w-full flex items-center gap-3 px-4 py-3 bg-navy-dark/50 hover:bg-navy-dark/70 border border-electric-blue/20 rounded-lg text-light-gray hover:text-metallic-silver transition-all"
                >
                  <Settings size={18} />
                  <div className="flex-1 text-left">
                    <p className="font-medium">Settings</p>
                    <p className="text-xs text-light-gray/60">Manage account preferences</p>
                  </div>
                </Link>

                <Link 
                  to="/client-portal/bookings" 
                  className="w-full flex items-center gap-3 px-4 py-3 bg-navy-dark/50 hover:bg-navy-dark/70 border border-electric-blue/20 rounded-lg text-light-gray hover:text-metallic-silver transition-all"
                >
                  <Calendar size={18} />
                  <div className="flex-1 text-left">
                    <p className="font-medium">View All Bookings</p>
                    <p className="text-xs text-light-gray/60">Complete appointment history</p>
                  </div>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default ClientPortal
