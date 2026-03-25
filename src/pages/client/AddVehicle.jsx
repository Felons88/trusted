import { useState, useEffect } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import { useAuthStore } from '../../store/authStore'
import { Car, Save, ArrowLeft } from 'lucide-react'
import { carMakes, carModels, carYears } from '../../data/carData'
import ClientNavigation from '../../components/ClientNavigation'
import toast from 'react-hot-toast'

function AddVehicle() {
  const { user } = useAuthStore()
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)
  const [clientData, setClientData] = useState(null)

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
    if (user) {
      loadClientData()
    }
  }, [user])

  const loadClientData = async () => {
    try {
      const { data: clients } = await supabase
        .from('clients')
        .select('*')
        .eq('user_id', user.id)

      const client = clients && clients.length > 0 ? clients[0] : null
      setClientData(client)
    } catch (error) {
      console.error('Error loading client data:', error)
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
      if (!clientData) {
        toast.error('Client data not found')
        setLoading(false) // Reset loading before return
        return
      }

      const vehicleData = {
        client_id: clientData.id,
        year: formData.year ? parseInt(formData.year) : null,
        make: formData.make,
        model: formData.model,
        color: formData.color,
        license_plate: formData.license_plate,
        vin: formData.vin || null,
        size: formData.vehicle_size, // Use 'size' not 'vehicle_size'
        notes: formData.notes,
        is_active: true
      }

      console.log('Adding vehicle:', vehicleData)

      const { error } = await supabase
        .from('vehicles')
        .insert([vehicleData])

      if (error) throw error

      toast.success('Vehicle added successfully!')
      navigate('/client-portal/vehicles')
    } catch (error) {
      console.error('Error adding vehicle:', error)
      toast.error('Failed to add vehicle: ' + error.message)
    } finally {
      setLoading(false)
    }
  }

  
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900">
      <ClientNavigation />
      
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
          <h1 className="text-3xl font-bold text-white mb-2">Add Vehicle</h1>
          <p className="text-light-gray">Add a new vehicle to your profile</p>
        </div>

        {/* Form Card */}
        <div className="bg-navy-dark/30 backdrop-blur-xl rounded-2xl p-6 border border-electric-blue/20">
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
                  Color <span className="text-electric-blue">*</span>
                </label>
                <input
                  type="text"
                  name="color"
                  value={formData.color}
                  onChange={handleChange}
                  required
                  placeholder="Silver"
                  className="w-full px-4 py-3 bg-navy-dark border border-electric-blue/20 rounded-lg text-white focus:outline-none focus:border-electric-blue"
                />
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
                {loading ? 'Adding Vehicle...' : 'Add Vehicle'}
              </button>
              <Link
                to="/client-portal/vehicles"
                className="flex-1 px-6 py-3 bg-navy-dark hover:bg-navy-dark/70 rounded-lg text-white font-semibold text-center transition-colors"
              >
                Cancel
              </Link>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}

export default AddVehicle
