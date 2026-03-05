import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import { 
  Calendar, Users, DollarSign, TrendingUp, 
  Clock, CheckCircle, AlertCircle, Star 
} from 'lucide-react'
import { format } from 'date-fns'
import DbTest from '../../components/DbTest'

function Dashboard() {
  const [stats, setStats] = useState({
    totalBookings: 0,
    pendingBookings: 0,
    completedBookings: 0,
    totalRevenue: 0,
    totalClients: 0,
    newQuotes: 0,
  })
  const [recentBookings, setRecentBookings] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadDashboardData()
  }, [])

  const loadDashboardData = async () => {
    try {
      console.log('Dashboard: Loading data...')
      
      // Load data with error handling for each table
      let bookings = []
      let clients = []
      let quotes = []
      let payments = []
      
      try {
        const { data } = await supabase.from('bookings').select('*')
        bookings = data || []
        console.log('Dashboard: Loaded', bookings.length, 'bookings')
      } catch (err) {
        console.log('Dashboard: Bookings table error, using mock data')
        bookings = []
      }
      
      try {
        const { data } = await supabase.from('clients').select('*')
        clients = data || []
        console.log('Dashboard: Loaded', clients.length, 'clients')
      } catch (err) {
        console.log('Dashboard: Clients table error, using mock data')
        clients = []
      }
      
      try {
        const { data } = await supabase.from('quote_requests').select('*').eq('status', 'pending')
        quotes = data || []
        console.log('Dashboard: Loaded', quotes.length, 'quotes')
      } catch (err) {
        console.log('Dashboard: Quotes table error, using mock data')
        quotes = []
      }
      
      try {
        const { data } = await supabase.from('payments').select('amount').eq('status', 'paid')
        payments = data || []
        console.log('Dashboard: Loaded', payments.length, 'payments')
      } catch (err) {
        console.log('Dashboard: Payments table error, using mock data')
        payments = []
      }

      const totalRevenue = payments.reduce((sum, p) => sum + parseFloat(p.amount || 0), 0)

      setStats({
        totalBookings: bookings.length,
        pendingBookings: bookings.filter(b => b.status === 'pending').length,
        completedBookings: bookings.filter(b => b.status === 'completed').length,
        totalRevenue,
        totalClients: clients.length,
        newQuotes: quotes.length,
      })

      const recent = bookings
        .sort((a, b) => new Date(b.created_at || 0) - new Date(a.created_at || 0))
        .slice(0, 5)
      setRecentBookings(recent)

      console.log('Dashboard: Data loaded successfully')
      setLoading(false)
    } catch (error) {
      console.error('Dashboard: Critical error loading data:', error)
      // Set default values on error
      setStats({
        totalBookings: 0,
        pendingBookings: 0,
        completedBookings: 0,
        totalRevenue: 0,
        totalClients: 0,
        newQuotes: 0,
      })
      setRecentBookings([])
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
    <div className="space-y-8">
      <div>
        <h1 className="text-4xl font-bold metallic-heading mb-2">Admin Dashboard</h1>
        <p className="text-light-gray">Welcome back! Here's your business overview.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
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
                <stat.icon className={`text-${stat.color}`} size={32} />
              </div>
            </div>
          </Link>
        ))}
      </div>

      <div className="grid lg:grid-cols-2 gap-8">
        <div className="glass-card">
          <h2 className="text-2xl font-bold metallic-heading mb-6">Recent Bookings</h2>
          {recentBookings.length === 0 ? (
            <p className="text-light-gray text-center py-8">No bookings yet</p>
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
                          : 'bg-red-500/20 text-red-400'
                      }`}
                    >
                      {booking.status}
                    </span>
                  </div>
                  <p className="text-light-gray text-sm">{booking.service_type} Detail</p>
                  <p className="text-electric-blue font-bold mt-2">${booking.total}</p>
                </div>
              ))}
            </div>
          )}
          <Link
            to="/admin/bookings"
            className="btn-secondary mt-6 inline-block w-full text-center"
          >
            View All Bookings
          </Link>
        </div>

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
          </div>
        </div>
      </div>

      {/* Database Test - Temporary for debugging */}
      <div className="mt-8">
        <DbTest />
      </div>
    </div>
  )
}

export default Dashboard
