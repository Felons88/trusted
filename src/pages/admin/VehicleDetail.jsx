import { useState, useEffect } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import { ArrowLeft, Car, Edit, Trash2, User, Calendar, Mail, Phone, MapPin, Wrench } from 'lucide-react'
import toast from 'react-hot-toast'

function VehicleDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [vehicle, setVehicle] = useState(null)
  const [client, setClient] = useState(null)
  const [lastService, setLastService] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (id) {
      loadVehicleData()
    }
  }, [id])

  const loadVehicleData = async () => {
    try {
      // Load vehicle with client information
      const { data: vehicleData, error: vehicleError } = await supabase
        .from('vehicles')
        .select('*')
        .eq('id', id)
        .single()

      if (vehicleError) throw vehicleError

      setVehicle(vehicleData)

      // Load client information
      if (vehicleData.client_id) {
        const { data: clientData, error: clientError } = await supabase
          .from('clients')
          .select('*')
          .eq('id', vehicleData.client_id)
          .single()

        if (clientError) throw clientError
        setClient(clientData)
      }

      // Load last service information
      const { data: serviceData, error: serviceError } = await supabase
        .from('bookings')
        .select('*')
        .eq('vehicle_id', id)
        .eq('status', 'completed')
        .order('service_date', { ascending: false })
        .limit(1)
        .single()

      if (serviceData) {
        setLastService(serviceData)
      }
    } catch (error) {
      console.error('Error loading vehicle data:', error)
      toast.error('Failed to load vehicle data')
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this vehicle? This action cannot be undone.')) {
      return
    }

    try {
      const { error } = await supabase
        .from('vehicles')
        .update({ is_active: false })
        .eq('id', id)

      if (error) throw error

      toast.success('Vehicle deleted successfully!')
      navigate('/admin/vehicles')
    } catch (error) {
      console.error('Error deleting vehicle:', error)
      toast.error('Failed to delete vehicle')
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-electric-blue"></div>
      </div>
    )
  }

  if (!vehicle) {
    return (
      <div className="text-center py-12">
        <h3 className="text-xl font-semibold text-light-gray mb-2">Vehicle not found</h3>
        <p className="text-light-gray mb-4">The vehicle you're looking for doesn't exist.</p>
        <Link to="/admin/vehicles" className="btn-primary">
          Back to Vehicles
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
            to="/admin/vehicles"
            className="text-light-gray hover:text-electric-blue transition-colors"
          >
            <ArrowLeft size={24} />
          </Link>
          <div>
            <h1 className="text-3xl font-bold text-light-gray">Vehicle Details</h1>
            <p className="text-light-gray">View and manage vehicle information</p>
          </div>
        </div>
        
        <div className="flex items-center space-x-3">
          <Link
            to={`/admin/vehicles/${id}/edit`}
            className="btn-secondary flex items-center space-x-2"
          >
            <Edit size={16} />
            <span>Edit Vehicle</span>
          </Link>
          <button
            onClick={handleDelete}
            className="btn-danger flex items-center space-x-2"
          >
            <Trash2 size={16} />
            <span>Delete Vehicle</span>
          </button>
        </div>
      </div>

      {/* Vehicle Information */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Main Vehicle Info */}
        <div className="space-y-6">
          <div className="glass-card p-6">
            <div className="flex items-center mb-6">
              <Car className="text-electric-blue mr-3" size={32} />
              <h2 className="text-2xl font-bold text-light-gray">
                {vehicle.year} {vehicle.make} {vehicle.model}
              </h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h3 className="text-lg font-semibold text-light-gray mb-4">Vehicle Information</h3>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-light-gray">Year:</span>
                    <span className="text-light-gray font-medium">{vehicle.year}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-light-gray">Make:</span>
                    <span className="text-light-gray font-medium">{vehicle.make}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-light-gray">Model:</span>
                    <span className="text-light-gray font-medium">{vehicle.model}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-light-gray">Color:</span>
                    <span className="text-light-gray font-medium">{vehicle.color}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-light-gray">Size:</span>
                    <span className="text-light-gray font-medium capitalize">{vehicle.vehicle_size}</span>
                  </div>
                </div>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-light-gray mb-4">Registration</h3>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-light-gray">License Plate:</span>
                    <span className="text-light-gray font-medium">{vehicle.license_plate}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-light-gray">VIN:</span>
                    <span className="text-light-gray font-medium">{vehicle.vin}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-light-gray">Status:</span>
                    <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                      vehicle.is_active 
                        ? 'bg-green-500/20 text-green-400' 
                        : 'bg-red-500/20 text-red-400'
                    }`}>
                      {vehicle.is_active ? 'Active' : 'Inactive'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-light-gray">Last Service:</span>
                    <span className="text-light-gray font-medium">
                      {lastService ? 
                        new Date(lastService.service_date).toLocaleDateString() : 
                        'No services yet'
                      }
                    </span>
                  </div>
                </div>
              </div>
            </div>
        </div>

        {/* Service History - Full Width */}
        <div className="lg:col-span-2">
          <div className="glass-card p-6">
          <div className="flex items-center mb-6">
            <Wrench className="text-electric-blue mr-3" size={24} />
            <h2 className="text-2xl font-bold text-light-gray">Service History</h2>
          </div>

          {lastService ? (
            <div className="space-y-4">
              <div className="bg-navy-light/30 rounded-lg p-4 border border-electric-blue/20">
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <h3 className="text-lg font-semibold text-light-gray">Last Service</h3>
                    <p className="text-sm text-light-gray">
                      {new Date(lastService.service_date).toLocaleDateString()} at {new Date(lastService.service_date).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                    </p>
                  </div>
                  <span className="px-3 py-1 bg-green-500/20 text-green-400 rounded-full text-sm font-semibold">
                    Completed
                  </span>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <span className="text-light-gray text-sm">Service Type:</span>
                    <p className="text-light-gray font-medium capitalize">{lastService.service_type}</p>
                  </div>
                  <div>
                    <span className="text-light-gray text-sm">Total Cost:</span>
                    <p className="text-green-400 font-medium">${lastService.total_cost?.toFixed(2) || '0.00'}</p>
                  </div>
                  {lastService.notes && (
                    <div className="md:col-span-2">
                      <span className="text-light-gray text-sm">Service Notes:</span>
                      <p className="text-light-gray">{lastService.notes}</p>
                    </div>
                  )}
                </div>
              </div>
              
              <div className="text-center">
                <Link
                  to={`/admin/bookings?vehicle=${id}`}
                  className="btn-secondary"
                >
                  View All Services
                </Link>
              </div>
            </div>
          ) : (
            <div className="text-center py-8">
              <Wrench className="text-light-gray mx-auto mb-4" size={48} />
              <h3 className="text-lg font-semibold text-light-gray mb-2">No Service History</h3>
              <p className="text-light-gray mb-4">This vehicle hasn't been serviced yet.</p>
              <Link
                to={`/admin/bookings/new?vehicle=${id}`}
                className="btn-primary"
              >
                Schedule First Service
              </Link>
            </div>
          )}
          </div>
        </div>

        {vehicle.notes && (
          <div className="glass-card p-6">
            <h3 className="text-lg font-semibold text-light-gray mb-3">Notes</h3>
            <p className="text-light-gray">{vehicle.notes}</p>
          </div>
        )}
        </div>

        {/* Client Information */}
        <div className="space-y-6">
          {client && (
            <div className="glass-card p-6">
              <div className="flex items-center mb-4">
                <User className="text-electric-blue mr-3" size={24} />
                <h3 className="text-xl font-bold text-light-gray">Client Information</h3>
              </div>
              
              <div className="space-y-4">
                <div>
                  <h4 className="font-semibold text-light-gray mb-2">{client.full_name}</h4>
                  <div className="space-y-2">
                    <div className="flex items-center text-light-gray text-sm">
                      <Mail className="mr-2" size={14} />
                      {client.email}
                    </div>
                    {client.phone && (
                      <div className="flex items-center text-light-gray text-sm">
                        <Phone className="mr-2" size={14} />
                        {client.phone}
                      </div>
                    )}
                    {client.address && (
                      <div className="flex items-center text-light-gray text-sm">
                        <MapPin className="mr-2" size={14} />
                        {client.address}
                      </div>
                    )}
                  </div>
                </div>
                
                <div className="pt-4 border-t border-navy-light">
                  <Link
                    to={`/admin/clients/${client.id}`}
                    className="btn-secondary w-full text-center"
                  >
                    View Client Profile
                  </Link>
                </div>
              </div>
            </div>
          )}

          <div className="glass-card p-6">
            <div className="flex items-center mb-4">
              <Calendar className="text-electric-blue mr-3" size={24} />
              <h3 className="text-xl font-bold text-light-gray">Timeline</h3>
            </div>
            
            <div className="space-y-3">
              <div className="text-sm">
                <div className="text-light-gray">Added on:</div>
                <div className="text-light-gray font-medium">
                  {new Date(vehicle.created_at).toLocaleDateString()}
                </div>
              </div>
              {vehicle.updated_at && vehicle.updated_at !== vehicle.created_at && (
                <div className="text-sm">
                  <div className="text-light-gray">Last updated:</div>
                  <div className="text-light-gray font-medium">
                    {new Date(vehicle.updated_at).toLocaleDateString()}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default VehicleDetail
