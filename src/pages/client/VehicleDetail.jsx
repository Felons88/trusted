import { useState, useEffect } from 'react'
import { Link, useParams, useNavigate } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import { useAuthStore } from '../../store/authStore'
import { Car, Edit, ArrowLeft, Calendar, DollarSign } from 'lucide-react'
import toast from 'react-hot-toast'

function VehicleDetail() {
  const { user } = useAuthStore()
  const { id } = useParams()
  const navigate = useNavigate()
  const [vehicle, setVehicle] = useState(null)
  const [bookings, setBookings] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (user && id) {
      loadVehicleData()
    }
  }, [user, id])

  const loadVehicleData = async () => {
    try {
      console.log('Loading vehicle data for ID:', id, 'User:', user?.id)
      
      const { data: clients, error: clientError } = await supabase
        .from('clients')
        .select('id')
        .eq('user_id', user.id)

      if (clientError) {
        console.error('Client query error:', clientError)
        toast.error('Failed to load client data')
        setLoading(false)
        return
      }

      const client = clients && clients.length > 0 ? clients[0] : null

      if (!client) {
        console.error('No client found for user:', user?.id)
        toast.error('Client data not found')
        setLoading(false)
        return
      }

      console.log('Found client:', client.id)

      const { data: vehicleData, error: vehicleError } = await supabase
        .from('vehicles')
        .select('*')
        .eq('id', id)
        .eq('client_id', client.id)
        .single()

      if (vehicleError) {
        console.error('Vehicle query error:', vehicleError)
        toast.error('Vehicle not found')
        setLoading(false)
        return
      }

      if (!vehicleData) {
        console.error('Vehicle data is null')
        toast.error('Vehicle not found')
        setLoading(false)
        return
      }

      console.log('Found vehicle:', vehicleData)
      setVehicle(vehicleData)

      const { data: bookingsData } = await supabase
        .from('bookings')
        .select('*')
        .eq('client_id', client.id)
        .order('created_at', { ascending: false })

      setBookings(bookingsData || [])
      setLoading(false)
    } catch (error) {
      console.error('Error loading vehicle data:', error)
      toast.error('Failed to load vehicle: ' + error.message)
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 flex items-center justify-center">
        <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-electric-blue"></div>
      </div>
    )
  }

  if (!vehicle) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 flex items-center justify-center">
        <div className="max-w-2xl mx-auto text-center px-4">
          <h1 className="text-4xl font-bold text-white mb-4">Vehicle Not Found</h1>
          <p className="text-light-gray mb-6">The vehicle you're looking for doesn't exist or you don't have access to it.</p>
          <Link to="/client-portal/vehicles" className="inline-flex items-center gap-2 px-6 py-3 bg-electric-blue hover:bg-electric-blue/90 rounded-lg text-white font-semibold transition-colors">
            Back to Vehicles
          </Link>
        </div>
      </div>
    )
  }

  const vehicleBookings = bookings.filter(b => 
    b.vehicle_size === vehicle.size || 
    b.service_type === 'full'
  )

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <Link 
            to="/client-portal/vehicles"
            className="inline-flex items-center gap-2 text-light-gray hover:text-metallic-silver mb-6 transition-colors"
          >
            <ArrowLeft size={20} />
            <span>Back to Vehicles</span>
          </Link>
          <h1 className="text-3xl font-bold text-white mb-2">Vehicle Details</h1>
          <p className="text-light-gray">View your vehicle information and service history</p>
        </div>

        {/* Vehicle Card */}
        <div className="bg-navy-dark/30 backdrop-blur-xl rounded-2xl p-6 border border-electric-blue/20 mb-8">
          <div className="flex items-start justify-between mb-6">
            <div className="flex items-center">
              <Car className="text-electric-blue mr-4" size={48} />
              <div>
                <h1 className="text-3xl font-bold text-white mb-2">
                  {vehicle.year} {vehicle.make} {vehicle.model}
                </h1>
                <p className="text-light-gray capitalize">{vehicle.size}</p>
              </div>
            </div>
            <Link
              to={`/client-portal/vehicles/${vehicle.id}/edit`}
              className="bg-navy-dark hover:bg-navy-dark/70 rounded-lg text-white font-semibold text-center transition-colors w-full inline-block px-6 py-3"
            >
              <Edit size={20} className="inline mr-2" />
              Edit Vehicle
            </Link>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <h3 className="text-xl font-bold text-white mb-4">Vehicle Details</h3>
              
              {vehicle.color && (
                <div className="bg-navy-dark/50 border border-electric-blue/20 rounded-lg p-4">
                  <div className="flex justify-between">
                    <span className="text-light-gray">Color:</span>
                    <span className="text-white">{vehicle.color}</span>
                  </div>
                </div>
              )}

              {vehicle.license_plate && (
                <div className="bg-navy-dark/50 border border-electric-blue/20 rounded-lg p-4">
                  <div className="flex justify-between">
                    <span className="text-light-gray">License Plate:</span>
                    <span className="text-white">{vehicle.license_plate}</span>
                  </div>
                </div>
              )}

              {vehicle.vin && (
                <div className="bg-navy-dark/50 border border-electric-blue/20 rounded-lg p-4">
                  <div className="flex justify-between">
                    <span className="text-light-gray">VIN:</span>
                    <span className="text-white text-sm">{vehicle.vin}</span>
                  </div>
                </div>
              )}

              {vehicle.notes && (
                <div className="bg-navy-dark/50 border border-electric-blue/20 rounded-lg p-4">
                  <div className="text-light-gray mb-2">Notes:</div>
                  <div className="text-white">{vehicle.notes}</div>
                </div>
              )}
            </div>

            <div className="space-y-4">
              <h3 className="text-xl font-bold text-white mb-4">Quick Actions</h3>
              
              <Link
                to="/client-portal/bookings/new"
                state={{ vehicleId: vehicle.id, skipVehicleSelection: true }}
                className="block bg-green-500/20 border border-green-500/30 rounded-lg p-6 hover:bg-green-500/30 transition-all text-center"
              >
                <Calendar className="text-green-400 mx-auto mb-3" size={32} />
                <h4 className="font-bold text-green-400 mb-2">Use This for Booking →</h4>
                <p className="text-sm text-light-gray">Skip vehicle selection and book service</p>
              </Link>

              <div className="bg-navy-dark/50 border border-electric-blue/20 rounded-lg p-6">
                <DollarSign className="text-electric-blue mx-auto mb-3" size={32} />
                <h4 className="font-bold text-white mb-2">Service History</h4>
                <p className="text-sm text-light-gray mb-3">
                  {vehicleBookings.length} booking{vehicleBookings.length !== 1 ? 's' : ''}
                </p>
                <div className="text-electric-blue font-bold">
                  Total Spent: ${vehicleBookings.reduce((sum, b) => sum + parseFloat(b.total || 0), 0).toFixed(2)}
                </div>
              </div>
            </div>
          </div>
        </div>

        {vehicleBookings.length > 0 && (
          <div className="bg-navy-dark/30 backdrop-blur-xl rounded-2xl p-6 border border-electric-blue/20">
            <h3 className="text-2xl font-bold text-white mb-6">Service History</h3>
            <div className="space-y-4">
              {vehicleBookings.map((booking) => (
                <div
                  key={booking.id}
                  className="bg-navy-dark/50 border border-electric-blue/20 rounded-lg p-4"
                >
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <p className="font-bold text-white">{booking.booking_number}</p>
                      <p className="text-sm text-light-gray">
                        {new Date(booking.preferred_date).toLocaleDateString()}
                      </p>
                    </div>
                    <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                      booking.status === 'completed' ? 'bg-green-500/20 text-green-400' :
                      booking.status === 'confirmed' ? 'bg-blue-500/20 text-blue-400' :
                      'bg-yellow-500/20 text-yellow-400'
                    }`}>
                      {booking.status}
                    </span>
                  </div>
                  <p className="text-light-gray text-sm capitalize">{booking.service_type} Detail</p>
                  <div className="flex justify-between items-center mt-3 pt-3 border-t border-electric-blue/20">
                    <span className="text-electric-blue font-bold">${booking.total}</span>
                    <Link
                      to={`/client-portal/bookings/${booking.id}`}
                      className="text-electric-blue hover:text-white text-sm"
                    >
                      View Details →
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default VehicleDetail
