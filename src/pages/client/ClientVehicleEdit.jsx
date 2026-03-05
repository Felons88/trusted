import { useState, useEffect } from 'react'
import { Link, useParams, useNavigate } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import { useAuthStore } from '../../store/authStore-emergency'
import { Car, Save, ArrowLeft, Trash2 } from 'lucide-react'
import { carMakes, carModels, carYears } from '../../data/carData'
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
      setFetchLoading(true)

      // Get client data
      const { data: client } = await supabase
        .from('clients')
        .select('*')
        .eq('user_id', user.id)
        .single()

      if (!client) {
        toast.error('Client data not found')
        navigate('/client-portal/vehicles')
        return
      }

      setClientData(client)

      // Get vehicle data
      const { data: vehicleData } = await supabase
        .from('vehicles')
        .select('*')
        .eq('id', id)
        .eq('client_id', client.id)
        .single()

      if (!vehicleData) {
        toast.error('Vehicle not found')
        navigate('/client-portal/vehicles')
        return
      }

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
      toast.error('Failed to load vehicle data')
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
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-electric-blue"></div>
      </div>
    )
  }

  if (!vehicle || !clientData) {
    return (
      <div className="min-h-screen bg-navy-gradient pt-24 pb-20 px-4">
        <div className="max-w-2xl mx-auto text-center">
          <h1 className="text-4xl font-bold metallic-heading mb-4">Vehicle Not Found</h1>
          <p className="text-light-gray mb-6">The vehicle you're trying to edit doesn't exist or you don't have access to it.</p>
          <Link to="/client-portal/vehicles" className="btn-primary">
            Back to Vehicles
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-navy-gradient pt-24 pb-20 px-4">
      <div className="max-w-2xl mx-auto">
        <div className="mb-8">
          <Link
            to={`/client-portal/vehicles/${id}`}
            className="text-light-gray hover:text-electric-blue transition-colors flex items-center mb-4"
          >
            <ArrowLeft size={20} className="mr-2" />
            Back to Vehicle Details
          </Link>
          <h1 className="text-4xl font-bold metallic-heading mb-2">Edit Vehicle</h1>
          <p className="text-light-gray">Update your vehicle information</p>
        </div>

        <div className="glass-card">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <label className="block text-metallic-silver mb-2 font-semibold">
                  Year <span className="text-bright-cyan">*</span>
                </label>
                <select
                  name="year"
                  value={formData.year}
                  onChange={handleChange}
                  required
                  className="w-full bg-navy-dark border border-electric-blue/30 rounded-lg px-4 py-3 text-metallic-silver focus:border-electric-blue focus:outline-none focus:ring-2 focus:ring-electric-blue/50 transition-all"
                >
                  <option value="">Select Year</option>
                  {carYears.map(year => (
                    <option key={year} value={year}>{year}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-metallic-silver mb-2 font-semibold">
                  Make <span className="text-bright-cyan">*</span>
                </label>
                <select
                  name="make"
                  value={formData.make}
                  onChange={handleChange}
                  required
                  className="w-full bg-navy-dark border border-electric-blue/30 rounded-lg px-4 py-3 text-metallic-silver focus:border-electric-blue focus:outline-none focus:ring-2 focus:ring-electric-blue/50 transition-all"
                >
                  <option value="">Select Make</option>
                  {carMakes.map(make => (
                    <option key={make} value={make}>{make}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-metallic-silver mb-2 font-semibold">
                  Model <span className="text-bright-cyan">*</span>
                </label>
                <select
                  name="model"
                  value={formData.model}
                  onChange={handleChange}
                  required
                  disabled={!selectedMake}
                  className="w-full bg-navy-dark border border-electric-blue/30 rounded-lg px-4 py-3 text-metallic-silver focus:border-electric-blue focus:outline-none focus:ring-2 focus:ring-electric-blue/50 transition-all disabled:opacity-50"
                >
                  <option value="">Select Model</option>
                  {selectedMake && carModels[selectedMake]?.map(model => (
                    <option key={model} value={model}>{model}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-metallic-silver mb-2 font-semibold">
                  Vehicle Size <span className="text-bright-cyan">*</span>
                </label>
                <select
                  name="vehicle_size"
                  value={formData.vehicle_size}
                  onChange={handleChange}
                  required
                  className="w-full bg-navy-dark border border-electric-blue/30 rounded-lg px-4 py-3 text-metallic-silver focus:border-electric-blue focus:outline-none focus:ring-2 focus:ring-electric-blue/50 transition-all"
                >
                  <option value="">Select size</option>
                  <option value="sedan">Sedan</option>
                  <option value="suv">SUV</option>
                  <option value="truck">Truck</option>
                  <option value="van">Van</option>
                </select>
              </div>

              <div>
                <label className="block text-metallic-silver mb-2 font-semibold">
                  Color
                </label>
                <input
                  type="text"
                  name="color"
                  value={formData.color}
                  onChange={handleChange}
                  placeholder="Silver"
                  className="w-full bg-navy-dark border border-electric-blue/30 rounded-lg px-4 py-3 text-metallic-silver focus:border-electric-blue focus:outline-none focus:ring-2 focus:ring-electric-blue/50 transition-all"
                />
              </div>

              <div>
                <label className="block text-metallic-silver mb-2 font-semibold">
                  License Plate <span className="text-bright-cyan">*</span>
                </label>
                <input
                  type="text"
                  name="license_plate"
                  value={formData.license_plate}
                  onChange={handleChange}
                  required
                  placeholder="ABC-1234"
                  className="w-full bg-navy-dark border border-electric-blue/30 rounded-lg px-4 py-3 text-metallic-silver focus:border-electric-blue focus:outline-none focus:ring-2 focus:ring-electric-blue/50 transition-all"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-metallic-silver mb-2 font-semibold">
                  Notes
                </label>
                <textarea
                  name="notes"
                  value={formData.notes}
                  onChange={handleChange}
                  rows="4"
                  placeholder="Any special notes about this vehicle..."
                  className="w-full bg-navy-dark border border-electric-blue/30 rounded-lg px-4 py-3 text-metallic-silver focus:border-electric-blue focus:outline-none focus:ring-2 focus:ring-electric-blue/50 transition-all resize-none"
                ></textarea>
              </div>
            </div>

            <div className="flex gap-4">
              <button
                type="submit"
                disabled={loading}
                className="btn-primary shine-effect flex-1 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Save size={20} className="inline mr-2" />
                {loading ? 'Updating Vehicle...' : 'Update Vehicle'}
              </button>
              <Link
                to={`/client-portal/vehicles/${id}`}
                className="btn-secondary flex-1 text-center"
              >
                Cancel
              </Link>
            </div>
          </form>

          <div className="mt-6 pt-6 border-t border-electric-blue/20">
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
    </div>
  )
}

export default ClientVehicleEdit
