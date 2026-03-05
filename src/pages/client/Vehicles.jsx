import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import { useAuthStore } from '../../store/authStore-emergency'
import { Car, Plus, Edit, Trash2, Eye } from 'lucide-react'
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
      const { data: client } = await supabase
        .from('clients')
        .select('id')
        .eq('user_id', user.id)
        .single()

      if (client) {
        const { data: vehiclesData } = await supabase
          .from('vehicles')
          .select('*')
          .eq('client_id', client.id)
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
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-electric-blue"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-navy-gradient pt-24 pb-20 px-4">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-4xl font-bold metallic-heading mb-2">My Vehicles</h1>
            <p className="text-light-gray">Manage your vehicle information</p>
          </div>
          <Link to="/client-portal/vehicles/add" className="btn-primary">
            <Plus size={20} className="inline mr-2" />
            Add Vehicle
          </Link>
        </div>

        {vehicles.length === 0 ? (
          <div className="glass-card text-center py-12">
            <Car className="text-light-gray mx-auto mb-4" size={64} />
            <h3 className="text-2xl font-bold metallic-heading mb-4">No Vehicles Yet</h3>
            <p className="text-light-gray mb-6">Add your first vehicle to get started with booking services</p>
            <Link to="/client-portal/vehicles/add" className="btn-primary">
              <Plus size={20} className="inline mr-2" />
              Add Your First Vehicle
            </Link>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {vehicles.map((vehicle) => (
              <div
                key={vehicle.id}
                className="glass-card hover:scale-105 transition-transform duration-300"
              >
                <div className="flex justify-between items-start mb-4">
                  <div className="flex items-center">
                    <Car className="text-electric-blue mr-3" size={32} />
                    <div>
                      <h3 className="text-xl font-bold metallic-heading">
                        {vehicle.year} {vehicle.make} {vehicle.model}
                      </h3>
                      <p className="text-sm text-light-gray capitalize">{vehicle.size}</p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Link
                      to={`/client-portal/vehicles/${vehicle.id}`}
                      className="text-electric-blue hover:text-bright-cyan transition-colors"
                    >
                      <Eye size={20} />
                    </Link>
                    <Link
                      to={`/client-portal/vehicles/${vehicle.id}/edit`}
                      className="text-electric-blue hover:text-bright-cyan transition-colors"
                    >
                      <Edit size={20} />
                    </Link>
                    <button
                      onClick={() => deleteVehicle(vehicle.id)}
                      className="text-red-400 hover:text-red-300 transition-colors"
                    >
                      <Trash2 size={20} />
                    </button>
                  </div>
                </div>

                <div className="space-y-2">
                  {vehicle.color && (
                    <div className="flex justify-between">
                      <span className="text-light-gray">Color:</span>
                      <span className="text-metallic-silver">{vehicle.color}</span>
                    </div>
                  )}
                  {vehicle.license_plate && (
                    <div className="flex justify-between">
                      <span className="text-light-gray">License:</span>
                      <span className="text-metallic-silver">{vehicle.license_plate}</span>
                    </div>
                  )}
                  {vehicle.vin && (
                    <div className="flex justify-between">
                      <span className="text-light-gray">VIN:</span>
                      <span className="text-metallic-silver text-sm">{vehicle.vin}</span>
                    </div>
                  )}
                </div>

                <div className="mt-4 pt-4 border-t border-electric-blue/20">
                  <Link
                    to="/book-now"
                    state={{ vehicleId: vehicle.id }}
                    className="btn-secondary w-full text-center inline-block"
                  >
                    Book Service for This Vehicle
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

export default Vehicles
