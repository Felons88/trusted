import { useState, useEffect } from 'react'
import { Link, useParams, useNavigate } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import { useAuthStore } from '../../store/authStore'
import { Car, Save, ArrowLeft, Trash2 } from 'lucide-react'
import { carMakes, carModels, carYears } from '../../data/carData'
import ClientNavigation from '../../components/ClientNavigation'
import toast from 'react-hot-toast'

function ClientVehicleEdit() {
  const { user } = useAuthStore()
  const { id } = useParams()
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)
  const [fetchLoading, setFetchLoading] = useState(true)
  const [clientData, setClientData] = useState(null)
  const [vehicle, setVehicle] = useState(null)

  const [formData, setFormData] = useState({
    year: '',
    make: '',
    model: '',
    color: '',
    license_plate: '',
    vehicle_size: '',
    notes: '',
  })

  const [selectedMake, setSelectedMake] = useState('')

  useEffect(() => {
    if (user && id) {
      loadVehicleData()
    }
  }, [user, id])

  const loadVehicleData = async () => {
    try {
      console.log('Loading vehicle data for ID:', id, 'User:', user?.id)
      setFetchLoading(true)

      // Get client data
      const { data: clients } = await supabase
        .from('clients')
        .select('*')
        .eq('user_id', user.id)

      const client = clients && clients.length > 0 ? clients[0] : null

      if (!client) {
        console.error('Client data not found for user:', user?.id)
        toast.error('Client data not found')
        setFetchLoading(false) // Reset loading before navigate
        navigate('/client-portal/vehicles')
        return
      }

      console.log('Found client:', client.id)
      setClientData(client)

      // Get vehicle data
      const { data: vehicleData, error } = await supabase
        .from('vehicles')
        .select('*')
        .eq('id', id)
        .eq('client_id', client.id)
        .single()

      if (error) {
        console.error('Vehicle query error:', error)
        toast.error('Vehicle not found')
        setFetchLoading(false) // Reset loading before navigate
        navigate('/client-portal/vehicles')
        return
      }

      if (!vehicleData) {
        console.error('Vehicle data is null')
        toast.error('Vehicle not found')
        setFetchLoading(false) // Reset loading before navigate
        navigate('/client-portal/vehicles')
        return
      }

      console.log('Found vehicle:', vehicleData)
      setVehicle(vehicleData)
      setSelectedMake(vehicleData.make || '')
      setFormData({
        year: vehicleData.year?.toString() || '',
        make: vehicleData.make || '',
        model: vehicleData.model || '',
        color: vehicleData.color || '',
        license_plate: vehicleData.license_plate || '',
        vehicle_size: vehicleData.size || vehicleData.vehicle_size || '',
        notes: vehicleData.notes || '',
      })

      setFetchLoading(false)
    } catch (error) {
      console.error('Error loading vehicle data:', error)
      toast.error('Failed to load vehicle data: ' + error.message)
      setFetchLoading(false)
    }
  }

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
    
    // If make is changed, update selectedMake and clear model
    if (name === 'make') {
      setSelectedMake(value)
      setFormData(prev => ({ ...prev, model: '' }))
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)

    try {
      const { error } = await supabase
        .from('vehicles')
        .update({
          year: formData.year ? parseInt(formData.year) : null,
          make: formData.make,
          model: formData.model,
          color: formData.color,
          license_plate: formData.license_plate,
          size: formData.vehicle_size,
          vehicle_size: formData.vehicle_size,
          notes: formData.notes,
          updated_at: new Date().toISOString()
        })
        .eq('id', id)

      if (error) throw error

      toast.success('Vehicle updated successfully!')
      navigate(`/client-portal/vehicles/${id}`)
    } catch (error) {
      console.error('Error updating vehicle:', error)
      toast.error('Failed to update vehicle')
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to remove this vehicle? This action cannot be undone.')) {
      return
    }

    try {
      const { error } = await supabase
        .from('vehicles')
        .update({ 
          is_active: false,
          updated_at: new Date().toISOString()
        })
        .eq('id', id)

      if (error) throw error

      toast.success('Vehicle removed successfully!')
      navigate('/client-portal/vehicles')
    } catch (error) {
      console.error('Error removing vehicle:', error)
      toast.error('Failed to remove vehicle')
    }
  }

  if (fetchLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 flex items-center justify-center">
        <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-electric-blue"></div>
      </div>
    )
  }

  if (!vehicle || !clientData) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 flex items-center justify-center">
        <div className="max-w-2xl mx-auto text-center px-4">
          <h1 className="text-4xl font-bold text-white mb-4">Vehicle Not Found</h1>
          <p className="text-light-gray mb-6">The vehicle you're trying to edit doesn't exist or you don't have access to it.</p>
          <Link to="/client-portal/vehicles" className="inline-flex items-center gap-2 px-6 py-3 bg-electric-blue hover:bg-electric-blue/90 rounded-lg text-white font-semibold transition-colors">
            Back to Vehicles
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900">
      <ClientNavigation />
      
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <Link 
            to={`/client-portal/vehicles/${id}`}
            className="inline-flex items-center gap-2 text-light-gray hover:text-metallic-silver mb-6 transition-colors"
          >
            <ArrowLeft size={20} />
            <span>Back to Vehicle Details</span>
          </Link>
          <h1 className="text-3xl font-bold text-white mb-2">Edit Vehicle</h1>
          <p className="text-light-gray">Update your vehicle information</p>
        </div>

        {/* Form Card */}
        <div className="bg-navy-dark/30 backdrop-blur-xl rounded-2xl p-6 border border-electric-blue/20 mb-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-light-gray mb-2">
                  Year <span className="text-electric-blue">*</span>
                </label>
                <select
                  name="year"
                  value={formData.year}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-3 bg-navy-dark border border-electric-blue/20 rounded-lg text-white focus:outline-none focus:border-electric-blue"
                >
                  <option value="">Select Year</option>
                  {carYears.map(year => (
                    <option key={year} value={year}>{year}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-light-gray mb-2">
                  Make <span className="text-electric-blue">*</span>
                </label>
                <select
                  name="make"
                  value={formData.make}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-3 bg-navy-dark border border-electric-blue/20 rounded-lg text-white focus:outline-none focus:border-electric-blue"
                >
                  <option value="">Select Make</option>
                  {carMakes.map(make => (
                    <option key={make} value={make}>{make}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-light-gray mb-2">
                  Model <span className="text-electric-blue">*</span>
                </label>
                <select
                  name="model"
                  value={formData.model}
                  onChange={handleChange}
                  required
                  disabled={!selectedMake}
                  className="w-full px-4 py-3 bg-navy-dark border border-electric-blue/20 rounded-lg text-white focus:outline-none focus:border-electric-blue disabled:opacity-50"
                >
                  <option value="">Select Model</option>
                  {selectedMake && carModels[selectedMake]?.map(model => (
                    <option key={model} value={model}>{model}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-light-gray mb-2">
                  Vehicle Size <span className="text-electric-blue">*</span>
                </label>
                <select
                  name="vehicle_size"
                  value={formData.vehicle_size}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-3 bg-navy-dark border border-electric-blue/20 rounded-lg text-white focus:outline-none focus:border-electric-blue"
                >
                  <option value="">Select Size</option>
                  <option value="sedan">Sedan</option>
                  <option value="suv">SUV</option>
                  <option value="truck">Truck</option>
                  <option value="van">Van</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-light-gray mb-2">
                  Color
                </label>
                <input
                  type="text"
                  name="color"
                  value={formData.color}
                  onChange={handleChange}
                  placeholder="Silver"
                  className="w-full px-4 py-3 bg-navy-dark border border-electric-blue/20 rounded-lg text-white focus:outline-none focus:border-electric-blue"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-light-gray mb-2">
                  License Plate
                </label>
                <input
                  type="text"
                  name="license_plate"
                  value={formData.license_plate}
                  onChange={handleChange}
                  placeholder="ABC-1234"
                  className="w-full px-4 py-3 bg-navy-dark border border-electric-blue/20 rounded-lg text-white focus:outline-none focus:border-electric-blue"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-light-gray mb-2">
                Additional Notes
              </label>
              <textarea
                name="notes"
                value={formData.notes}
                onChange={handleChange}
                rows={4}
                placeholder="Any special notes about this vehicle..."
                className="w-full px-4 py-3 bg-navy-dark border border-electric-blue/20 rounded-lg text-white focus:outline-none focus:border-electric-blue resize-none"
              />
            </div>

            <div className="flex gap-4">
              <button
                type="submit"
                disabled={loading}
                className="flex-1 px-6 py-3 bg-electric-blue hover:bg-electric-blue/90 rounded-lg text-white font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Save size={20} className="inline mr-2" />
                {loading ? 'Updating Vehicle...' : 'Update Vehicle'}
              </button>
              <Link
                to={`/client-portal/vehicles/${id}`}
                className="flex-1 px-6 py-3 bg-navy-dark hover:bg-navy-dark/70 rounded-lg text-white font-semibold text-center transition-colors"
              >
                Cancel
              </Link>
            </div>
          </form>
        </div>

        {/* Delete Vehicle Card */}
        <div className="bg-navy-dark/30 backdrop-blur-xl rounded-2xl p-6 border border-red-500/20">
          <button
            onClick={handleDelete}
            className="w-full bg-red-500/20 border border-red-500/30 rounded-lg p-4 hover:bg-red-500/30 transition-colors text-left"
          >
            <div className="flex items-center">
              <Trash2 className="text-red-400 mr-3" size={20} />
              <div>
                <p className="font-bold text-red-400 mb-1">Remove Vehicle</p>
                <p className="text-sm text-light-gray">Delete this vehicle from your profile</p>
              </div>
            </div>
          </button>
        </div>
      </div>
    </div>
  )
}

export default ClientVehicleEdit
