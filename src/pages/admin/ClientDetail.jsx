import { useState, useEffect } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import { 
  ArrowLeft, User, Mail, Phone, MapPin, Calendar, DollarSign, Car, Edit, Trash2, 
  Clock, Star, MessageSquare, FileText, TrendingUp, Award, AlertCircle, Eye 
} from 'lucide-react'
import toast from 'react-hot-toast'

function ClientDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [client, setClient] = useState(null)
  const [vehicles, setVehicles] = useState([])
  const [bookings, setBookings] = useState([])
  const [loading, setLoading] = useState(true)
  const [deleting, setDeleting] = useState(false)
  const [loyaltyPoints, setLoyaltyPoints] = useState(null)
  const [outstandingInvoices, setOutstandingInvoices] = useState([])

  useEffect(() => {
    if (id) {
      loadClientData()
    }
  }, [id])

  const loadClientData = async () => {
    try {
      setLoading(true)
      
      // Load client details
      const { data: clientData, error: clientError } = await supabase
        .from('clients')
        .select('*')
        .eq('id', id)
        .single()

      if (clientError) throw clientError
      setClient(clientData)

      // Load client's vehicles
      const { data: vehiclesData } = await supabase
        .from('vehicles')
        .select('*')
        .eq('client_id', id)
        .eq('is_active', true)
        .order('created_at', { ascending: false })

      setVehicles(vehiclesData || [])

      // Load client's bookings
      const { data: bookingsData } = await supabase
        .from('bookings')
        .select('*')
        .eq('client_id', id)
        .order('created_at', { ascending: false })
        .limit(10)

      setBookings(bookingsData || [])

      // Load loyalty points (with error handling)
      let loyaltyData = null
      try {
        const { data: data, error } = await supabase
          .from('loyalty_points')
          .select('*')
          .eq('client_id', id)
          .maybeSingle()
        
        if (!error) {
          loyaltyData = data
        }
      } catch (error) {
        console.log('Loyalty points table not available or error:', error.message)
      }

      setLoyaltyPoints(loyaltyData)

      // Load outstanding invoices
      try {
        const { data: invoicesData } = await supabase
          .from('invoices')
          .select('*')
          .eq('client_id', id)
          .in('status', ['sent', 'pending'])
          .order('created_at', { ascending: false })

        setOutstandingInvoices(invoicesData || [])
      } catch (error) {
        console.log('Error loading invoices:', error.message)
        setOutstandingInvoices([])
      }

    } catch (error) {
      console.error('Error loading client data:', error)
      toast.error('Failed to load client data')
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this client? This action cannot be undone.')) {
      return
    }

    try {
      setDeleting(true)
      
      // Soft delete by updating status
      const { error } = await supabase
        .from('clients')
        .update({ status: 'inactive' })
        .eq('id', id)

      if (error) throw error

      toast.success('Client deleted successfully!')
      navigate('/admin/clients')
    } catch (error) {
      console.error('Error deleting client:', error)
      toast.error('Failed to delete client')
    } finally {
      setDeleting(false)
    }
  }

  const getStatusColor = (status) => {
    const colors = {
      active: 'bg-green-500/20 text-green-400',
      inactive: 'bg-red-500/20 text-red-400',
      pending: 'bg-yellow-500/20 text-yellow-400'
    }
    return colors[status] || 'bg-gray-500/20 text-gray-400'
  }

  const getBookingStatusColor = (status) => {
    const colors = {
      completed: 'bg-green-500/20 text-green-400',
      scheduled: 'bg-blue-500/20 text-blue-400',
      cancelled: 'bg-red-500/20 text-red-400',
      pending: 'bg-yellow-500/20 text-yellow-400'
    }
    return colors[status] || 'bg-gray-500/20 text-gray-400'
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-electric-blue"></div>
      </div>
    )
  }

  if (!client) {
    return (
      <div className="text-center py-12">
        <h3 className="text-xl font-semibold text-light-gray mb-2">Client not found</h3>
        <p className="text-light-gray mb-4">The client you're looking for doesn't exist.</p>
        <Link to="/admin/clients" className="btn-primary">
          Back to Clients
        </Link>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Link
            to="/admin/clients"
            className="text-light-gray hover:text-electric-blue transition-colors"
          >
            <ArrowLeft size={24} />
          </Link>
          <div>
            <h1 className="text-3xl font-bold text-light-gray">Client Details</h1>
            <p className="text-light-gray">View and manage client information</p>
          </div>
        </div>
        
        <div className="flex items-center space-x-3">
          <Link
            to={`/admin/clients/${id}/edit`}
            className="btn-secondary flex items-center space-x-2"
          >
            <Edit size={16} />
            <span>Edit Client</span>
          </Link>
          <button
            onClick={handleDelete}
            disabled={deleting}
            className="btn-danger flex items-center space-x-2"
          >
            <Trash2 size={16} />
            <span>{deleting ? 'Deleting...' : 'Delete Client'}</span>
          </button>
        </div>
      </div>

      {/* Client Overview */}
      <div className="glass-card p-6">
        <div className="flex items-start justify-between mb-6">
          <div className="flex items-center space-x-4">
            <div className="w-16 h-16 bg-electric-blue/20 rounded-full flex items-center justify-center">
              <User className="text-electric-blue" size={32} />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-light-gray">{client.full_name}</h2>
              <p className="text-light-gray">{client.email}</p>
              <span className={`inline-block px-3 py-1 rounded-full text-xs font-semibold mt-2 ${getStatusColor(client.status)}`}>
                {client.status || 'active'}
              </span>
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-4 text-right">
            <div>
              <div className="text-2xl font-bold text-green-400">
                ${bookings.reduce((total, booking) => total + (booking.total_cost || 0), 0).toFixed(2)}
              </div>
              <div className="text-sm text-light-gray">Total Revenue</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-red-400">
                ${outstandingInvoices.reduce((total, invoice) => total + (invoice.total || 0), 0).toFixed(2)}
              </div>
              <div className="text-sm text-light-gray">Outstanding Invoices</div>
            </div>
          </div>
        </div>

        {/* Contact Information */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="flex items-center space-x-3">
            <Mail className="text-electric-blue" size={20} />
            <div>
              <div className="text-sm text-light-gray">Email</div>
              <div className="text-light-gray">{client.email}</div>
            </div>
          </div>
          
          {client.phone && (
            <div className="flex items-center space-x-3">
              <Phone className="text-electric-blue" size={20} />
              <div>
                <div className="text-sm text-light-gray">Phone</div>
                <div className="text-light-gray">{client.phone}</div>
              </div>
            </div>
          )}
          
          {client.address && (
            <div className="flex items-center space-x-3">
              <MapPin className="text-electric-blue" size={20} />
              <div>
                <div className="text-sm text-light-gray">Address</div>
                <div className="text-light-gray">{client.address}</div>
              </div>
            </div>
          )}
          
          <div className="flex items-center space-x-3">
            <Calendar className="text-electric-blue" size={20} />
            <div>
              <div className="text-sm text-light-gray">Client Since</div>
              <div className="text-light-gray">
                {new Date(client.created_at).toLocaleDateString()}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="glass-card p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-light-gray">Total Vehicles</p>
              <p className="text-2xl font-bold text-light-gray">{vehicles.length}</p>
            </div>
            <Car className="text-electric-blue" size={24} />
          </div>
        </div>

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
              <p className="text-sm text-light-gray">Completed</p>
              <p className="text-2xl font-bold text-light-gray">
                {bookings.filter(b => b.status === 'completed').length}
              </p>
            </div>
            <Star className="text-electric-blue" size={24} />
          </div>
        </div>

        {loyaltyPoints && (
          <div className="glass-card p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-light-gray">Loyalty Points</p>
                <p className="text-2xl font-bold text-light-gray">{loyaltyPoints.points || 0}</p>
              </div>
              <Award className="text-electric-blue" size={24} />
            </div>
          </div>
        )}
      </div>

      {/* Outstanding Invoices */}
      {outstandingInvoices.length > 0 && (
        <div className="glass-card p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xl font-bold text-light-gray flex items-center">
              <FileText className="text-red-400 mr-3" size={24} />
              Outstanding Invoices ({outstandingInvoices.length})
            </h3>
            <Link to={`/admin/invoices?client=${id}`} className="btn-secondary">
              View All Invoices
            </Link>
          </div>

          <div className="space-y-4">
            {outstandingInvoices.map((invoice) => (
              <div key={invoice.id} className="bg-navy-light/30 rounded-lg p-4 border border-red-400/20">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="text-light-gray font-medium">
                      Invoice #{invoice.invoice_number || `INV-${invoice.id}`}
                    </h4>
                    <p className="text-sm text-light-gray">
                      Due: {invoice.due_date ? new Date(invoice.due_date).toLocaleDateString() : 'No due date'}
                    </p>
                  </div>
                  <div className="text-right">
                    <div className="text-xl font-bold text-red-400">
                      ${invoice.total?.toFixed(2) || '0.00'}
                    </div>
                    <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                      invoice.status === 'overdue' 
                        ? 'bg-red-500/20 text-red-400' 
                        : 'bg-yellow-500/20 text-yellow-400'
                    }`}>
                      {invoice.status || 'pending'}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Simple Service Location */}
      {client.address && (
        <div className="glass-card p-6">
          <h3 className="text-xl font-bold text-light-gray mb-4 flex items-center">
            <MapPin className="text-electric-blue mr-3" size={24} />
            Service Location
          </h3>
          <div className="bg-navy-light/30 rounded-lg p-4 border border-electric-blue/20">
            <div className="flex items-center space-x-3">
              <MapPin className="text-electric-blue" size={20} />
              <div>
                <p className="text-light-gray font-medium">{client.address}</p>
                <p className="text-sm text-light-gray">Service area for this client</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Vehicles */}
      <div className="glass-card p-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-xl font-bold text-light-gray flex items-center">
            <Car className="text-electric-blue mr-3" size={24} />
            Vehicles ({vehicles.length})
          </h3>
          <Link
            to={`/admin/vehicles/new?client=${id}`}
            className="btn-primary"
          >
            Add Vehicle
          </Link>
        </div>

        {vehicles.length > 0 ? (
          <div className="space-y-4">
            {vehicles.map((vehicle) => (
              <div key={vehicle.id} className="bg-navy-light/30 rounded-lg p-4 border border-electric-blue/20">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <Car className="text-electric-blue" size={20} />
                    <div>
                      <h4 className="text-light-gray font-medium">
                        {vehicle.year} {vehicle.make} {vehicle.model}
                      </h4>
                      <p className="text-sm text-light-gray">
                        {vehicle.color} • {vehicle.license_plate} • {vehicle.vehicle_size}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Link
                      to={`/admin/vehicles/${vehicle.id}`}
                      className="text-electric-blue hover:text-bright-cyan"
                    >
                      <Eye size={16} />
                    </Link>
                    <Link
                      to={`/admin/vehicles/${vehicle.id}/edit`}
                      className="text-blue-400 hover:text-blue-300"
                    >
                      <Edit size={16} />
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8">
            <Car className="text-light-gray mx-auto mb-4" size={48} />
            <h3 className="text-lg font-semibold text-light-gray mb-2">No Vehicles</h3>
            <p className="text-light-gray mb-4">This client hasn't added any vehicles yet.</p>
            <Link
              to={`/admin/vehicles/new?client=${id}`}
              className="btn-primary"
            >
              Add First Vehicle
            </Link>
          </div>
        )}
      </div>

      {/* Recent Bookings */}
      <div className="glass-card p-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-xl font-bold text-light-gray flex items-center">
            <Calendar className="text-electric-blue mr-3" size={24} />
            Recent Bookings
          </h3>
          <Link to={`/admin/bookings?client=${id}`} className="btn-secondary">
            View All
          </Link>
        </div>

        {bookings.length > 0 ? (
          <div className="space-y-4">
            {bookings.slice(0, 5).map((booking) => (
              <div key={booking.id} className="bg-navy-light/30 rounded-lg p-4 border border-electric-blue/20">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="text-light-gray font-medium capitalize">{booking.service_type}</h4>
                    <p className="text-sm text-light-gray">
                      {new Date(booking.service_date).toLocaleDateString()} • ${booking.total_cost?.toFixed(2) || '0.00'}
                    </p>
                  </div>
                  <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getBookingStatusColor(booking.status)}`}>
                    {booking.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8">
            <Calendar className="text-light-gray mx-auto mb-4" size={48} />
            <h3 className="text-lg font-semibold text-light-gray mb-2">No Bookings</h3>
            <p className="text-light-gray mb-4">This client hasn't made any bookings yet.</p>
            <Link
              to={`/admin/bookings/new?client=${id}`}
              className="btn-primary"
            >
              Create First Booking
            </Link>
          </div>
        )}
      </div>
    </div>
  )
}

export default ClientDetail
