import { useState, useEffect } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import { useAuthStore } from '../../store/authStore'
import { Car, Save, ArrowLeft } from 'lucide-react'
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
    vin: '',
    vehicle_size: '',
    notes: '',
  })

  useEffect(() => {
    if (user) {
      loadClientData()
    }
  }, [user])

  const loadClientData = async () => {
    try {
      const { data: client } = await supabase
        .from('clients')
        .select('*')
        .eq('user_id', user.id)
        .single()

      setClientData(client)
    } catch (error) {
      console.error('Error loading client data:', error)
    }
  }

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)

    try {
      if (!clientData) {
        toast.error('Client data not found')
        return
      }

      const { error } = await supabase
        .from('vehicles')
        .insert({
          client_id: clientData.id,
          year: formData.year ? parseInt(formData.year) : null,
          make: formData.make,
          model: formData.model,
          color: formData.color,
          license_plate: formData.license_plate,
          vin: formData.vin,
          vehicle_size: formData.vehicle_size,
          notes: formData.notes,
        })

      if (error) throw error

      toast.success('Vehicle added successfully!')
      navigate('/client-portal/vehicles')
    } catch (error) {
      console.error('Error adding vehicle:', error)
      toast.error('Failed to add vehicle')
    } finally {
      setLoading(false)
    }
  }

  
  return (
    <div className="min-h-screen bg-navy-gradient pt-24 pb-20 px-4">
      <div className="max-w-2xl mx-auto">
        <div className="mb-8">
          <Link
            to="/client-portal/vehicles"
            className="text-light-gray hover:text-electric-blue transition-colors flex items-center mb-4"
          >
            <ArrowLeft size={20} className="mr-2" />
            Back to Vehicles
          </Link>
          <h1 className="text-4xl font-bold metallic-heading mb-2">Add Vehicle</h1>
          <p className="text-light-gray">Add a new vehicle to your profile</p>
        </div>

        <div className="glass-card">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <label className="block text-metallic-silver mb-2 font-semibold">
                  Year <span className="text-bright-cyan">*</span>
                </label>
                <input
                  type="number"
                  name="year"
                  value={formData.year}
                  onChange={handleChange}
                  required
                  min="1900"
                  max={new Date().getFullYear() + 1}
                  placeholder="2020"
                  className="w-full bg-navy-dark border border-electric-blue/30 rounded-lg px-4 py-3 text-metallic-silver focus:border-electric-blue focus:outline-none focus:ring-2 focus:ring-electric-blue/50 transition-all"
                />
              </div>

              <div>
                <label className="block text-metallic-silver mb-2 font-semibold">
                  Make <span className="text-bright-cyan">*</span>
                </label>
                <input
                  type="text"
                  name="make"
                  value={formData.make}
                  onChange={handleChange}
                  required
                  placeholder="Toyota"
                  className="w-full bg-navy-dark border border-electric-blue/30 rounded-lg px-4 py-3 text-metallic-silver focus:border-electric-blue focus:outline-none focus:ring-2 focus:ring-electric-blue/50 transition-all"
                />
              </div>

              <div>
                <label className="block text-metallic-silver mb-2 font-semibold">
                  Model <span className="text-bright-cyan">*</span>
                </label>
                <input
                  type="text"
                  name="model"
                  value={formData.model}
                  onChange={handleChange}
                  required
                  placeholder="Camry"
                  className="w-full bg-navy-dark border border-electric-blue/30 rounded-lg px-4 py-3 text-metallic-silver focus:border-electric-blue focus:outline-none focus:ring-2 focus:ring-electric-blue/50 transition-all"
                />
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
                  License Plate
                </label>
                <input
                  type="text"
                  name="license_plate"
                  value={formData.license_plate}
                  onChange={handleChange}
                  placeholder="ABC-1234"
                  className="w-full bg-navy-dark border border-electric-blue/30 rounded-lg px-4 py-3 text-metallic-silver focus:border-electric-blue focus:outline-none focus:ring-2 focus:ring-electric-blue/50 transition-all"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-metallic-silver mb-2 font-semibold">
                  VIN (Vehicle Identification Number)
                </label>
                <input
                  type="text"
                  name="vin"
                  value={formData.vin}
                  onChange={handleChange}
                  placeholder="1HGCM82633A123456"
                  maxLength="17"
                  className="w-full bg-navy-dark border border-electric-blue/30 rounded-lg px-4 py-3 text-metallic-silver focus:border-electric-blue focus:outline-none focus:ring-2 focus:ring-electric-blue/50 transition-all"
                />
                <p className="text-xs text-light-gray mt-1">Optional: 17-character VIN number</p>
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
                {loading ? 'Adding Vehicle...' : 'Add Vehicle'}
              </button>
              <Link
                to="/client-portal/vehicles"
                className="btn-secondary flex-1 text-center"
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
