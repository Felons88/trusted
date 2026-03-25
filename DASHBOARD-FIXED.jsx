import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { Calendar, Users, DollarSign, Clock, CheckCircle, AlertCircle, Star, TrendingUp } from 'lucide-react'
import { supabase } from '../../lib/supabase'
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
  })
  const [recentBookings, setRecentBookings] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadDashboardData()
  }, [])

  const loadDashboardData = async () => {
    try {
      setLoading(true)
      
      // Simple data loading - focus on invoices for revenue
      const [invoicesResult, bookingsResult, clientsResult, quotesResult, vehiclesResult, servicesResult] = await Promise.allSettled([
        supabase.from('invoices').select('status, total_amount, created_at').order('created_at', { ascending: false }),
        supabase.from('bookings').select('status, created_at, preferred_date').order('created_at', { ascending: false }),
        supabase.from('clients').select('id').order('created_at', { ascending: false }),
        supabase.from('quote_requests').select('status').order('created_at', { ascending: false }),
        supabase.from('vehicles').select('is_active').order('created_at', { ascending: false }),
        supabase.from('services').select('is_active').order('created_at', { ascending: false })
      ])

      // Get invoice data for revenue
      const invoices = invoicesResult.status === 'fulfilled' ? invoicesResult.value.data || [] : []
      const bookings = bookingsResult.status === 'fulfilled' ? bookingsResult.value.data || [] : []
      const clients = clientsResult.status === 'fulfilled' ? clientsResult.value.data || [] : []
      const quotes = quotesResult.status === 'fulfilled' ? quotesResult.value.data || [] : []
      const vehicles = vehiclesResult.status === 'fulfilled' ? vehiclesResult.value.data || [] : []
      const services = servicesResult.status === 'fulfilled' ? servicesResult.value.data || [] : []

      // Calculate REAL revenue from paid invoices
      const paidInvoices = invoices.filter(inv => inv.status === 'paid')
      const totalRevenue = paidInvoices.reduce((sum, inv) => sum + (parseFloat(inv.total_amount) || 0), 0)
      
      // Calculate pending revenue from unpaid invoices
      const unpaidInvoices = invoices.filter(inv => inv.status !== 'paid')
      const pendingRevenue = unpaidInvoices.reduce((sum, inv) => sum + (parseFloat(inv.total_amount) || 0), 0)

      // Get recent bookings (last 5)
      const recentBookings = bookings.slice(0, 5)

      setStats({
        totalBookings: bookings.length,
        pendingBookings: bookings.filter(b => b.status === 'pending').length,
        completedBookings: bookings.filter(b => b.status === 'completed' || b.status === 'confirmed').length,
        totalRevenue: totalRevenue,
        pendingRevenue: pendingRevenue,
        totalClients: clients.length,
        newQuotes: quotes.filter(q => q.status === 'pending').length,
        totalVehicles: vehicles.filter(v => v.is_active).length,
        activeServices: services.filter(s => s.is_active).length,
      })

      setRecentBookings(recentBookings)
      setLoading(false)
    } catch (error) {
      console.error('Error loading dashboard data:', error)
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
      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {statCards.map((stat, index) => {
          const Icon = stat.icon
          return (
            <Link
              key={index}
              to={stat.link}
              className="glass-card p-6 hover:scale-105 transition-all duration-200"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-light-gray text-sm">{stat.title}</p>
                  <p className="text-3xl font-bold text-metallic-silver mt-1">{stat.value}</p>
                </div>
                <div className={`p-3 rounded-lg bg-${stat.color}/20`}>
                  <Icon className={`text-${stat.color}`} size={24} />
                </div>
              </div>
            </Link>
          )
        })}
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
                        <p className="font-bold text-metallic-silver">{booking.booking_number || 'Booking'}</p>
                        <p className="text-sm text-light-gray">
                          {format(new Date(booking.preferred_date || booking.created_at), 'MMM dd, yyyy')}
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
                  </div>
                ))}
              </div>
            )}
          </div>
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
          </div>
        </div>
      </div>
    </div>
  )
}

export default Dashboard
