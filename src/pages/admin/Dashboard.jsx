import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import { 
  Calendar, Users, DollarSign, TrendingUp, 
  Clock, CheckCircle, AlertCircle, Star 
} from 'lucide-react'
import { format } from 'date-fns'

function Dashboard() {
  const [stats, setStats] = useState({
    totalBookings: 0,
    pendingBookings: 0,
    completedBookings: 0,
    totalRevenue: 0,
    pendingRevenue: 0,
    totalClients: 0,
    newQuotes: 0,
    totalVehicles: 0,
    activeServices: 0,
    recentActivity: 0,
  })
  const [recentBookings, setRecentBookings] = useState([])
  const [recentQuotes, setRecentQuotes] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadDashboardData()
  }, [])

  const loadDashboardData = async () => {
    try {
      console.log('Dashboard: Loading comprehensive data...')
      setLoading(true)
      
      // Load all data concurrently for better performance
      const [
        bookingsResult,
        clientsResult,
        quotesResult,
        paymentsResult,
        vehiclesResult,
        servicesResult,
        invoicesResult
      ] = await Promise.allSettled([
        // Bookings with client and vehicle info
        supabase.from('bookings')
          .select(`
            *,
            clients (full_name, email),
            vehicles (year, make, model)
          `)
          .order('created_at', { ascending: false }),
        
        // Clients with vehicle count
        supabase.from('clients')
          .select('*, vehicles(count)'),
          
        // Pending quote requests
        supabase.from('quote_requests')
          .select('*')
          .eq('status', 'pending')
          .order('created_at', { ascending: false }),
          
        // Paid payments for revenue calculation
        supabase.from('payments')
          .select('amount, created_at')
          .eq('status', 'paid')
          .order('created_at', { ascending: false }),
          
        // Active vehicles
        supabase.from('vehicles')
          .select('*')
          .eq('is_active', true),
          
        // Active services
        supabase.from('services')
          .select('*')
          .eq('is_active', true),
          
        // Recent invoices
        supabase.from('invoices')
          .select('*')
          .order('created_at', { ascending: false })
          .limit(10)
      ])
      
      // Extract data with error handling
      const bookings = bookingsResult.status === 'fulfilled' ? bookingsResult.value.data || [] : []
      const clients = clientsResult.status === 'fulfilled' ? clientsResult.value.data || [] : []
      const quotes = quotesResult.status === 'fulfilled' ? quotesResult.value.data || [] : []
      const payments = paymentsResult.status === 'fulfilled' ? paymentsResult.value.data || [] : []
      const vehicles = vehiclesResult.status === 'fulfilled' ? vehiclesResult.value.data || [] : []
      const services = servicesResult.status === 'fulfilled' ? servicesResult.value.data || [] : []
      const invoices = invoicesResult.status === 'fulfilled' ? invoicesResult.value.data || [] : []
      
      console.log('Dashboard: Data loaded -', {
        bookings: bookings.length,
        clients: clients.length,
        quotes: quotes.length,
        payments: payments.length,
        vehicles: vehicles.length,
        services: services.length,
        invoices: invoices.length
      })
      
      // Calculate comprehensive stats
      const totalRevenue = payments.reduce((sum, p) => sum + parseFloat(p.amount || 0), 0)
      const pendingRevenue = invoices
        .filter(inv => inv.status === 'sent' || inv.status === 'pending')
        .reduce((sum, inv) => sum + parseFloat(inv.total || 0), 0)
      
      // Get unique clients (deduplicate)
      const uniqueClients = Array.from(
        new Map(clients.map(c => [c.user_id || c.email, c])).values()
      )
      
      // Recent activity (last 7 days)
      const sevenDaysAgo = new Date()
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)
      
      const recentBookings = bookings.filter(b => 
        new Date(b.created_at) > sevenDaysAgo
      ).slice(0, 5)
      
      const recentQuotes = quotes.filter(q => 
        new Date(q.created_at) > sevenDaysAgo
      ).slice(0, 3)
      
      // Update stats with comprehensive data
      setStats({
        totalBookings: bookings.length,
        pendingBookings: bookings.filter(b => b.status === 'pending').length,
        completedBookings: bookings.filter(b => b.status === 'completed').length,
        totalRevenue,
        pendingRevenue,
        totalClients: uniqueClients.length,
        newQuotes: quotes.length,
        totalVehicles: vehicles.length,
        activeServices: services.length,
        recentActivity: recentBookings.length + recentQuotes.length
      })

      // Set recent bookings with full details
      setRecentBookings(recentBookings)
      setRecentQuotes(recentQuotes)
      
      console.log('Dashboard: Comprehensive data loaded successfully')
    } catch (error) {
      console.error('Dashboard: Critical error loading data:', error)
      // Set default values on error
      setStats({
        totalBookings: 0,
        pendingBookings: 0,
        completedBookings: 0,
        totalRevenue: 0,
        pendingRevenue: 0,
        totalClients: 0,
        newQuotes: 0,
        totalVehicles: 0,
        activeServices: 0,
        recentActivity: 0
      })
      setRecentBookings([])
      setRecentQuotes([])
    } finally {
      setLoading(false)
    }
  }

  const statCards = [
    {
      title: 'Total Bookings',
      value: stats.totalBookings,
      icon: Calendar,
      color: 'electric-blue',
      link: '/admin/bookings',
    },
    {
      title: 'Pending Bookings',
      value: stats.pendingBookings,
      icon: Clock,
      color: 'bright-cyan',
      link: '/admin/bookings?status=pending',
    },
    {
      title: 'Total Revenue',
      value: `$${stats.totalRevenue.toFixed(2)}`,
      icon: DollarSign,
      color: 'electric-blue',
      link: '/admin/payments',
    },
    {
      title: 'Total Clients',
      value: stats.totalClients,
      icon: Users,
      color: 'bright-cyan',
      link: '/admin/clients',
    },
    {
      title: 'Completed',
      value: stats.completedBookings,
      icon: CheckCircle,
      color: 'electric-blue',
      link: '/admin/bookings?status=completed',
    },
    {
      title: 'New Quotes',
      value: stats.newQuotes,
      icon: AlertCircle,
      color: 'bright-cyan',
      link: '/admin/quote-requests',
    },
  ]

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-electric-blue"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold metallic-heading mb-2">Business Dashboard</h1>
        <p className="text-light-gray">Welcome back! Here's your business overview.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {statCards.map((stat, index) => (
          <Link
            key={index}
            to={stat.link}
            className="glass-card hover:scale-105 transition-transform duration-300"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-light-gray text-sm mb-1">{stat.title}</p>
                <p className="text-3xl font-bold metallic-heading">{stat.value}</p>
              </div>
              <div className={`bg-${stat.color}/20 p-4 rounded-full`}>
                <stat.icon size={32} />
              </div>
            </div>
          </Link>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Bookings */}
        <div className="lg:col-span-2">
          <div className="glass-card">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold metallic-heading">Recent Bookings</h2>
              <Link
                to="/admin/bookings"
                className="text-electric-blue hover:text-blue-400 text-sm"
              >
                View All
              </Link>
            </div>
            {recentBookings.length === 0 ? (
              <p className="text-light-gray text-center py-8">No recent bookings</p>
            ) : (
              <div className="space-y-4">
                {recentBookings.map((booking) => (
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
                      <span
                        className={`px-3 py-1 rounded-full text-xs font-semibold ${
                          booking.status === 'pending'
                            ? 'bg-yellow-500/20 text-yellow-400'
                            : booking.status === 'confirmed'
                            ? 'bg-blue-500/20 text-blue-400'
                            : booking.status === 'completed'
                            ? 'bg-green-500/20 text-green-400'
                            : 'bg-gray-500/20 text-gray-400'
                        }`}
                      >
                        {booking.status}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <p className="text-sm text-light-gray">
                        {booking.clients?.full_name || 'Unknown Client'} • {booking.service_type}
                      </p>
                      {booking.total_cost && (
                        <p className="text-sm font-bold text-green-400">
                          ${parseFloat(booking.total_cost).toFixed(2)}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
          <Link
            to="/admin/bookings"
            className="btn-secondary mt-6 inline-block w-full text-center"
          >
            View All Bookings
          </Link>
        </div>

        {/* Quick Actions */}
        <div className="glass-card">
          <h2 className="text-2xl font-bold metallic-heading mb-6">Quick Actions</h2>
          <div className="space-y-4">
            <Link
              to="/admin/bookings/new"
              className="block bg-electric-blue/20 border border-electric-blue/30 rounded-lg p-4 hover:bg-electric-blue/30 transition-colors"
            >
              <p className="font-bold text-metallic-silver mb-1">Create New Booking</p>
              <p className="text-sm text-light-gray">Add a manual booking for walk-in customers</p>
            </Link>

            <Link
              to="/admin/clients"
              className="block bg-electric-blue/20 border border-electric-blue/30 rounded-lg p-4 hover:bg-electric-blue/30 transition-colors"
            >
              <p className="font-bold text-metallic-silver mb-1">Manage Clients</p>
              <p className="text-sm text-light-gray">View and manage customer information</p>
            </Link>

            <Link
              to="/admin/quote-requests"
              className="block bg-electric-blue/20 border border-electric-blue/30 rounded-lg p-4 hover:bg-electric-blue/30 transition-colors"
            >
              <p className="font-bold text-metallic-silver mb-1">Review Quote Requests</p>
              <p className="text-sm text-light-gray">
                {stats.newQuotes} new quotes waiting for response
              </p>
            </Link>

            <Link
              to="/admin/quote-request/new"
              className="block bg-electric-blue/20 border border-electric-blue/30 rounded-lg p-4 hover:bg-electric-blue/30 transition-colors"
            >
              <p className="font-bold text-metallic-silver mb-1">Create Quote Request</p>
              <p className="text-sm text-light-gray">Add a manual quote request for customers</p>
            </Link>

            <Link
              to="/admin/services"
              className="block bg-electric-blue/20 border border-electric-blue/30 rounded-lg p-4 hover:bg-electric-blue/30 transition-colors"
            >
              <p className="font-bold text-metallic-silver mb-1">Manage Services & Pricing</p>
              <p className="text-sm text-light-gray">Update service packages and add-ons</p>
            </Link>

            <Link
              to="/admin/invoices"
              className="block bg-electric-blue/20 border border-electric-blue/30 rounded-lg p-4 hover:bg-electric-blue/30 transition-colors"
            >
              <p className="font-bold text-metallic-silver mb-1">Manage Invoices</p>
              <p className="text-sm text-light-gray">View and manage outstanding invoices</p>
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Dashboard
