import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import { format } from 'date-fns'
import { 
  Search, Filter, Plus, Eye, Calendar, DollarSign, Car, User, Clock, 
  CheckCircle, XCircle, AlertCircle, MoreVertical 
} from 'lucide-react'
import toast from 'react-hot-toast'

function Bookings() {
  const [bookings, setBookings] = useState([])
  const [filteredBookings, setFilteredBookings] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')

  useEffect(() => {
    loadBookings()
  }, [])

  useEffect(() => {
    filterBookings()
  }, [searchTerm, statusFilter, bookings])

  const loadBookings = async () => {
    try {
      console.log('Bookings: Loading data...')
      
      let bookings = []
      
      try {
        const { data, error } = await supabase
          .from('bookings')
          .select(`
            *,
            clients (full_name, email, phone),
            vehicles (year, make, model, license_plate),
            services (id, name, base_price_sedan, base_price_suv, base_price_truck),
            booking_addons (
              addons (id, name, price)
            )
          `)
          .order('created_at', { ascending: false })

        if (error) throw error
        
        // Use the actual booking total from database, don't calculate
        bookings = (data || []).map(booking => {
          console.log('Processing booking:', booking.id, 'with total:', booking.total)
          
          return {
            ...booking,
            total_cost: parseFloat(booking.total || booking.subtotal || 0)
          }
        })
        
        console.log('Bookings: Loaded', bookings.length, 'bookings with calculated prices')
      } catch (err) {
        console.log('Bookings: Error loading data, using empty array')
        bookings = []
        toast.error('Database error - showing empty list')
      }
      
      setBookings(bookings)
      setLoading(false)
    } catch (error) {
      console.error('Error loading bookings:', error)
      toast.error('Failed to load bookings')
      setLoading(false)
    }
  }

  const filterBookings = () => {
    let filtered = bookings

    // Filter by search term
    if (searchTerm) {
      filtered = filtered.filter(booking =>
        booking.booking_number?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        booking.clients?.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        booking.clients?.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        booking.service_type?.toLowerCase().includes(searchTerm.toLowerCase())
      )
    }

    // Filter by status
    if (statusFilter !== 'all') {
      filtered = filtered.filter(booking => booking.status === statusFilter)
    }

    setFilteredBookings(filtered)
  }

  const getStatusIcon = (status) => {
    const icons = {
      pending: <Clock className="w-4 h-4" />,
      confirmed: <CheckCircle className="w-4 h-4" />,
      in_progress: <AlertCircle className="w-4 h-4" />,
      completed: <CheckCircle className="w-4 h-4" />,
      cancelled: <XCircle className="w-4 h-4" />
    }
    return icons[status] || <Clock className="w-4 h-4" />
  }

  const getStatusColor = (status) => {
    const colors = {
      pending: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
      confirmed: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
      in_progress: 'bg-purple-500/20 text-purple-400 border-purple-500/30',
      completed: 'bg-green-500/20 text-green-400 border-green-500/30',
      cancelled: 'bg-red-500/20 text-red-400 border-red-500/30'
    }
    return colors[status] || colors.pending
  }

  const getServiceTypeIcon = (serviceType) => {
    return <Car className="w-4 h-4" />
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-electric-blue"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <div>
            <h1 className="text-3xl font-bold text-light-gray">Bookings</h1>
            <p className="text-light-gray">Manage all booking appointments</p>
          </div>
        </div>
        
        <Link to="/admin/bookings/new" className="btn-primary flex items-center space-x-2">
          <Plus size={16} />
          <span>New Booking</span>
        </Link>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="glass-card p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-light-gray">Total Bookings</p>
              <p className="text-2xl font-bold text-light-gray">{bookings.length}</p>
            </div>
            <Calendar className="text-electric-blue" size={24} />
          </div>
        </div>

        <div className="glass-card p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-light-gray">Pending</p>
              <p className="text-2xl font-bold text-yellow-400">
                {bookings.filter(b => b.status === 'pending').length}
              </p>
            </div>
            <Clock className="text-yellow-400" size={24} />
          </div>
        </div>

        <div className="glass-card p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-light-gray">Confirmed</p>
              <p className="text-2xl font-bold text-blue-400">
                {bookings.filter(b => b.status === 'confirmed').length}
              </p>
            </div>
            <CheckCircle className="text-blue-400" size={24} />
          </div>
        </div>

        <div className="glass-card p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-light-gray">Completed</p>
              <p className="text-2xl font-bold text-green-400">
                {bookings.filter(b => b.status === 'completed').length}
              </p>
            </div>
            <CheckCircle className="text-green-400" size={24} />
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="glass-card p-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-light-gray" size={20} />
            <input
              type="text"
              placeholder="Search bookings..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-navy-light/30 border border-electric-blue/20 rounded-lg pl-10 pr-4 py-3 text-light-gray placeholder-light-gray/50 focus:border-electric-blue focus:outline-none focus:ring-2 focus:ring-electric-blue/50"
            />
          </div>

          <div className="relative">
            <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 text-light-gray" size={20} />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full bg-navy-light/30 border border-electric-blue/20 rounded-lg pl-10 pr-4 py-3 text-light-gray focus:border-electric-blue focus:outline-none focus:ring-2 focus:ring-electric-blue/50 appearance-none"
            >
              <option value="all">All Status</option>
              <option value="pending">Pending</option>
              <option value="confirmed">Confirmed</option>
              <option value="in_progress">In Progress</option>
              <option value="completed">Completed</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>

          <div className="text-right">
            <p className="text-sm text-light-gray">Total Results</p>
            <p className="text-2xl font-bold text-electric-blue">{filteredBookings.length}</p>
          </div>
        </div>
      </div>

      {/* Bookings Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredBookings.map((booking) => (
          <div key={booking.id} className="glass-card p-6 hover:shadow-lg transition-shadow">
            {/* Header */}
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-electric-blue/20 rounded-full flex items-center justify-center">
                  {getServiceTypeIcon(booking.service_type)}
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-light-gray">
                    {booking.booking_number || `BK-${booking.id}`}
                  </h3>
                  <p className="text-sm text-light-gray capitalize">
                    {booking.service_type} Detail
                  </p>
                </div>
              </div>
              
              <span className={`px-3 py-1 rounded-full text-xs font-semibold border flex items-center space-x-1 ${getStatusColor(booking.status)}`}>
                {getStatusIcon(booking.status)}
                <span>{booking.status || 'pending'}</span>
              </span>
            </div>

            {/* Client Info */}
            <div className="mb-4">
              <div className="flex items-center space-x-2 mb-2">
                <User className="text-electric-blue" size={16} />
                <span className="text-light-gray font-medium">{booking.clients?.full_name}</span>
              </div>
              <div className="text-sm text-light-gray ml-6">
                <p>{booking.clients?.email}</p>
                {booking.clients?.phone && <p>{booking.clients?.phone}</p>}
              </div>
            </div>

            {/* Vehicle Info */}
            {booking.vehicles && (
              <div className="mb-4">
                <div className="flex items-center space-x-2 mb-2">
                  <Car className="text-electric-blue" size={16} />
                  <span className="text-light-gray font-medium">
                    {booking.vehicles.year} {booking.vehicles.make} {booking.vehicles.model}
                  </span>
                </div>
                {booking.vehicles.license_plate && (
                  <p className="text-sm text-light-gray ml-6">{booking.vehicles.license_plate}</p>
                )}
              </div>
            )}

            {/* Date & Time */}
            <div className="mb-4">
              <div className="flex items-center space-x-2">
                <Calendar className="text-electric-blue" size={16} />
                <span className="text-light-gray">
                  {format(new Date(booking.preferred_date || booking.service_date), 'MMM dd, yyyy')}
                </span>
              </div>
              {booking.preferred_time && (
                <div className="flex items-center space-x-2 mt-1 ml-6">
                  <Clock className="text-electric-blue" size={14} />
                  <span className="text-sm text-light-gray">{booking.preferred_time}</span>
                </div>
              )}
            </div>

            {/* Price */}
            <div className="mb-4">
              <div className="flex items-center justify-between">
                <span className="text-light-gray">Total:</span>
                <span className="text-xl font-bold text-green-400">
                  ${booking.total_cost?.toFixed(2) || '0.00'}
                </span>
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center justify-between pt-4 border-t border-navy-light">
              <Link
                to={`/admin/bookings/${booking.id}`}
                className="text-electric-blue hover:text-bright-cyan flex items-center space-x-1"
              >
                <Eye size={16} />
                <span>View Details</span>
              </Link>
              
              <div className="flex items-center space-x-2">
                <Link
                  to={`/admin/bookings/${booking.id}/edit`}
                  className="text-blue-400 hover:text-blue-300"
                >
                  <MoreVertical size={16} />
                </Link>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Empty State */}
      {filteredBookings.length === 0 && !loading && (
        <div className="glass-card p-12 text-center">
          <Calendar className="text-light-gray mx-auto mb-4" size={48} />
          <h3 className="text-xl font-semibold text-light-gray mb-2">No Bookings Found</h3>
          <p className="text-light-gray mb-6">
            {searchTerm || statusFilter !== 'all' 
              ? 'No bookings match your search criteria.' 
              : 'No bookings have been created yet.'}
          </p>
          <Link to="/admin/bookings/new" className="btn-primary">
            Create First Booking
          </Link>
        </div>
      )}
    </div>
  )
}

export default Bookings
