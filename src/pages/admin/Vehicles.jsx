import { useState, useEffect } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import { ArrowLeft, Car, Search, Plus, Edit, Trash2, Eye, Filter } from 'lucide-react'
import toast from 'react-hot-toast'

function Vehicles() {
  const [vehicles, setVehicles] = useState([])
  const [filteredVehicles, setFilteredVehicles] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterBy, setFilterBy] = useState('all')

  useEffect(() => {
    loadVehicles()
  }, [])

  useEffect(() => {
    filterVehicles()
  }, [searchTerm, filterBy, vehicles])

  const loadVehicles = async () => {
    try {
      console.log('Vehicles: Loading data...')
      
      let vehiclesData = []
      
      try {
        const { data, error } = await supabase
          .from('vehicles')
          .select(`
            *,
            clients (full_name, email)
          `)
          .order('created_at', { ascending: false })

        if (error) throw error
        vehiclesData = data || []
        console.log('Vehicles: Loaded', vehiclesData.length, 'vehicles')
      } catch (err) {
        console.log('Vehicles: Error loading data, using empty array')
        vehiclesData = []
        toast.error('Database error - showing empty list')
      }
      
      setVehicles(vehiclesData)
      setLoading(false)
    } catch (error) {
      console.error('Vehicles: Critical error:', error)
      setVehicles([])
      setLoading(false)
    }
  }

  const filterVehicles = () => {
    let filtered = [...vehicles]

    if (searchTerm) {
      filtered = filtered.filter(v => 
        v.make?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        v.model?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        v.year?.toString().includes(searchTerm) ||
        v.clients?.full_name?.toLowerCase().includes(searchTerm.toLowerCase())
      )
    }

    if (filterBy !== 'all') {
      filtered = filtered.filter(v => v.vehicle_size === filterBy)
    }

    setFilteredVehicles(filtered)
  }

  const deleteVehicle = async (vehicleId) => {
    if (!confirm('Are you sure you want to delete this vehicle?')) return

    try {
      const { error } = await supabase
        .from('vehicles')
        .delete()
        .eq('id', vehicleId)

      if (error) throw error

      toast.success('Vehicle deleted successfully')
      loadVehicles()
    } catch (error) {
      console.error('Error deleting vehicle:', error)
      toast.error('Failed to delete vehicle')
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
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-4xl font-bold metallic-heading mb-2">Vehicles</h1>
          <p className="text-light-gray">Manage customer vehicles</p>
        </div>
        <Link to="/admin/vehicles/new" className="btn-primary">
          <Plus size={20} className="inline mr-2" />
          Add Vehicle
        </Link>
      </div>

      <div className="glass-card">
        <div className="grid md:grid-cols-3 gap-4 mb-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-light-gray" size={20} />
            <input
              type="text"
              placeholder="Search by make, model, year, or client..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="admin-input pl-10"
            />
          </div>
          <div className="relative">
            <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 text-light-gray" size={20} />
            <select
              value={filterBy}
              onChange={(e) => setFilterBy(e.target.value)}
              className="admin-select pl-10"
            >
              <option value="all">All Sizes</option>
              <option value="sedan">Sedan</option>
              <option value="suv">SUV</option>
              <option value="truck">Truck</option>
              <option value="van">Van</option>
            </select>
          </div>
          <div className="text-right">
            <span className="text-light-gray">
              {filteredVehicles.length} of {vehicles.length} vehicles
            </span>
          </div>
        </div>

        {filteredVehicles.length === 0 ? (
          <div className="text-center py-12">
            <Car className="text-light-gray mx-auto mb-4" size={48} />
            <h3 className="text-xl font-bold metallic-heading mb-2">No Vehicles Found</h3>
            <p className="text-light-gray mb-4">
              {vehicles.length === 0 
                ? "No vehicles have been added yet" 
                : "No vehicles match your search criteria"
              }
            </p>
            {vehicles.length === 0 && (
              <Link to="/admin/vehicles/new" className="btn-primary">
                <Plus size={20} className="inline mr-2" />
                Add First Vehicle
              </Link>
            )}
          </div>
        ) : (
          <div className="grid gap-4">
            {filteredVehicles.map((vehicle) => (
              <div
                key={vehicle.id}
                className="bg-navy-dark/50 border border-electric-blue/20 rounded-lg p-6"
              >
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <div className="flex items-center mb-2">
                      <Car className="text-electric-blue mr-3" size={24} />
                      <h3 className="text-xl font-bold text-metallic-silver">
                        {vehicle.year} {vehicle.make} {vehicle.model}
                      </h3>
                      <span className="ml-3 px-2 py-1 bg-electric-blue/20 text-electric-blue rounded-full text-xs font-semibold capitalize">
                        {vehicle.vehicle_size}
                      </span>
                    </div>
                    
                    <div className="grid md:grid-cols-2 gap-4 mb-4">
                      <div className="space-y-1">
                        <p className="text-sm text-light-gray">
                          <span className="font-semibold">Color:</span> {vehicle.color || 'N/A'}
                        </p>
                        <p className="text-sm text-light-gray">
                          <span className="font-semibold">License Plate:</span> {vehicle.license_plate || 'N/A'}
                        </p>
                        <p className="text-sm text-light-gray">
                          <span className="font-semibold">VIN:</span> {vehicle.vin || 'N/A'}
                        </p>
                      </div>
                      <div className="space-y-1">
                        <p className="text-sm text-light-gray">
                          <span className="font-semibold">Owner:</span> {vehicle.clients?.full_name || 'Unknown'}
                        </p>
                        <p className="text-sm text-light-gray">
                          <span className="font-semibold">Email:</span> {vehicle.clients?.email || 'N/A'}
                        </p>
                        <p className="text-sm text-light-gray">
                          <span className="font-semibold">Added:</span> {new Date(vehicle.created_at).toLocaleDateString()}
                        </p>
                      </div>
                    </div>

                    {vehicle.notes && (
                      <div className="pt-3 border-t border-electric-blue/20">
                        <p className="text-sm text-light-gray">
                          <span className="font-semibold">Notes:</span> {vehicle.notes}
                        </p>
                      </div>
                    )}
                  </div>

                  <div className="flex gap-2 ml-4">
                    <Link 
                      to={`/admin/vehicles/${vehicle.id}`}
                      className="text-electric-blue hover:text-bright-cyan"
                      title="View vehicle details"
                    >
                      <Eye size={20} />
                    </Link>
                    <button 
                      onClick={() => navigate(`/admin/vehicles/${vehicle.id}/edit`)}
                      className="text-electric-blue hover:text-bright-cyan"
                      title="Edit vehicle"
                    >
                      <Edit size={20} />
                    </button>
                    <button
                      onClick={() => deleteVehicle(vehicle.id)}
                      className="text-red-400 hover:text-red-300"
                    >
                      <Trash2 size={20} />
                    </button>
                  </div>
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
