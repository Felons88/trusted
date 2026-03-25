import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import { useAuthStore } from '../../store/authStore'
import { Car, Plus, Edit, Trash2, Eye } from 'lucide-react'
import ClientNavigation from '../../components/ClientNavigation'
import toast from 'react-hot-toast'

function Vehicles() {
  const { user } = useAuthStore()
  const [vehicles, setVehicles] = useState([])
  const [loading, setLoading] = useState(true)
  const navigate = useNavigate()

  useEffect(() => {
    if (user) {
      loadVehicles()
    }
  }, [user])

  const loadVehicles = async () => {
    try {
      const { data: clients } = await supabase
        .from('clients')
        .select('id')
        .eq('user_id', user.id)
        .order('created_at', { ascending: true })

      if (clients && clients.length > 0) {
        // Get all client IDs for this user (handle duplicates)
        const clientIds = clients.map(c => c.id)
        
        // Load vehicles from all client records
        const { data: vehiclesData } = await supabase
          .from('vehicles')
          .select('*')
          .in('client_id', clientIds)
          .eq('is_active', true)
          .order('created_at', { ascending: false })

        setVehicles(vehiclesData || [])
      }

      setLoading(false)
    } catch (error) {
      console.error('Error loading vehicles:', error)
      toast.error('Failed to load vehicles')
      setLoading(false)
    }
  }

  const deleteVehicle = async (vehicleId) => {
    if (!confirm('Are you sure you want to remove this vehicle?')) {
      return
    }

    try {
      const { error } = await supabase
        .from('vehicles')
        .update({ is_active: false })
        .eq('id', vehicleId)

      if (error) throw error

      toast.success('Vehicle removed successfully')
      loadVehicles()
    } catch (error) {
      console.error('Error deleting vehicle:', error)
      toast.error('Failed to remove vehicle')
    }
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
      
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">My Vehicles</h1>
          <p className="text-light-gray">Manage your vehicle information</p>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-electric-blue"></div>
          </div>
        ) : vehicles.length === 0 ? (
          <div className="bg-navy-dark/30 backdrop-blur-xl rounded-2xl p-12 border border-electric-blue/20 text-center">
            <Car className="text-light-gray mx-auto mb-4" size={64} />
            <h3 className="text-2xl font-bold text-white mb-4">No Vehicles Yet</h3>
            <p className="text-light-gray mb-6">Add your first vehicle to get started with booking services</p>
            <Link 
              to="/client-portal/vehicles/add" 
              className="inline-flex items-center gap-2 px-6 py-3 bg-electric-blue hover:bg-electric-blue/90 rounded-lg text-white font-semibold transition-colors"
            >
              <Plus size={20} className="inline mr-2" />
              Add Your First Vehicle
            </Link>
          </div>
        ) : (
          <>
            {/* Add Vehicle Button */}
            <div className="mb-6 flex justify-end">
              <Link 
                to="/client-portal/vehicles/add" 
                className="inline-flex items-center gap-2 px-6 py-3 bg-electric-blue hover:bg-electric-blue/90 rounded-lg text-white font-semibold transition-colors"
              >
                <Plus size={20} className="inline mr-2" />
                Add Vehicle
              </Link>
            </div>

            {/* Vehicle Grid */}
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {vehicles.map((vehicle) => (
                <div
                  key={vehicle.id}
                  className="bg-navy-dark/30 backdrop-blur-xl rounded-2xl p-6 border border-electric-blue/20 hover:border-electric-blue/40 transition-all"
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center">
                      <Car className="text-electric-blue mr-3" size={24} />
                      <div>
                        <h3 className="text-lg font-bold text-white">
                          {vehicle.year} {vehicle.make}
                        </h3>
                        <p className="text-light-gray">{vehicle.model}</p>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-2 mb-4">
                    <div className="flex justify-between text-sm">
                      <span className="text-light-gray">Color:</span>
                      <span className="text-white">{vehicle.color || 'N/A'}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-light-gray">Size:</span>
                      <span className="text-white capitalize">{vehicle.size}</span>
                    </div>
                    {vehicle.license_plate && (
                      <div className="flex justify-between text-sm">
                        <span className="text-light-gray">Plate:</span>
                        <span className="text-white">{vehicle.license_plate}</span>
                      </div>
                    )}
                    {vehicle.vin && (
                      <div className="flex justify-between text-sm">
                        <span className="text-light-gray">VIN:</span>
                        <span className="text-white text-xs">{vehicle.vin}</span>
                      </div>
                    )}
                  </div>

                  <div className="flex gap-2">
                    <Link
                      to={`/client-portal/vehicles/${vehicle.id}`}
                      className="flex-1 px-3 py-2 bg-electric-blue/20 border border-electric-blue/30 rounded-lg text-electric-blue hover:bg-electric-blue/30 transition-colors text-center text-sm font-medium"
                    >
                      <Eye size={16} className="inline mr-1" />
                      View
                    </Link>
                    <Link
                      to={`/client-portal/vehicles/${vehicle.id}/edit`}
                      className="flex-1 px-3 py-2 bg-navy-dark/50 border border-electric-blue/20 rounded-lg text-white hover:bg-navy-dark/70 transition-colors text-center text-sm font-medium"
                    >
                      <Edit size={16} className="inline mr-1" />
                      Edit
                    </Link>
                    <button
                      onClick={() => deleteVehicle(vehicle.id)}
                      className="flex-1 px-3 py-2 bg-red-400 hover:bg-red-300 rounded-lg text-white font-medium transition-colors text-center text-sm"
                    >
                      <Trash2 size={16} className="inline mr-1" />
                      Delete
                    </button>
                  </div>

                  <div className="mt-4 pt-4 border-t border-electric-blue/20">
                    <Link
                      to="/client-portal/bookings/new"
                      state={{ vehicleId: vehicle.id, skipVehicleSelection: true }}
                      className="block w-full px-4 py-2 bg-green-500/20 border border-green-500/30 hover:bg-green-500/30 rounded-lg text-green-400 font-semibold text-center transition-colors text-sm"
                    >
                      Use This for Booking →
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  )
}

export default Vehicles
