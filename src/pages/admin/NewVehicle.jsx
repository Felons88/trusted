import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import { ArrowLeft, Car, User } from 'lucide-react'
import toast from 'react-hot-toast'

function NewVehicle() {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    client_id: '',
    year: '',
    make: '',
    model: '',
    color: '',
    license_plate: '',
    vin: '',
    vehicle_size: 'sedan',
    notes: ''
  })

  const [clients, setClients] = useState([])

  useEffect(() => {
    loadClients()
  }, [])

  const loadClients = async () => {
    try {
      console.log('NewVehicle: Loading clients...')
      
      try {
        const { data } = await supabase.from('clients').select('*')
        setClients(data || [])
        console.log('NewVehicle: Loaded', data?.length || 0, 'clients')
      } catch (err) {
        console.log('NewVehicle: Error loading clients')
        setClients([])
      }
    } catch (error) {
      console.error('NewVehicle: Critical error:', error)
      setClients([])
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    // Validate that client is selected
    if (!formData.client_id) {
      toast.error('Please select a client for this vehicle')
      return
    }
    
    setLoading(true)

    try {
      const { error } = await supabase
        .from('vehicles')
        .insert([formData])

      if (error) throw error

      toast.success('Vehicle added successfully!')
      navigate('/admin/vehicles')
    } catch (error) {
      console.error('Error adding vehicle:', error)
      toast.error('Failed to add vehicle')
    } finally {
      setLoading(false)
    }
  }

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    })
  }

  
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center">
          <button
            onClick={() => navigate('/admin/vehicles')}
            className="mr-4 text-electric-blue hover:text-bright-cyan"
          >
            <ArrowLeft size={24} />
          </button>
          <div>
            <h1 className="text-4xl font-bold metallic-heading mb-2">Add Vehicle</h1>
            <p className="text-light-gray">Add a new vehicle to the system</p>
          </div>
        </div>
      </div>

      <div className="glass-card">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-metallic-silver mb-2">
                <User size={16} className="inline mr-2" />
                Client
              </label>
              <select
                name="client_id"
                value={formData.client_id}
                onChange={handleChange}
                className="w-full bg-navy-dark border border-electric-blue/30 rounded-lg px-4 py-3 text-metallic-silver focus:border-electric-blue focus:outline-none"
                required
              >
                <option value="">Select Client</option>
                {clients.map((client) => (
                  <option key={client.id} value={client.id}>
                    {client.full_name} - {client.email}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-metallic-silver mb-2">
                Vehicle Size
              </label>
              <select
                name="vehicle_size"
                value={formData.vehicle_size}
                onChange={handleChange}
                className="w-full bg-navy-dark border border-electric-blue/30 rounded-lg px-4 py-3 text-metallic-silver focus:border-electric-blue focus:outline-none"
                required
              >
                <option value="sedan">Sedan</option>
                <option value="suv">SUV</option>
                <option value="truck">Truck</option>
                <option value="van">Van</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-metallic-silver mb-2">
                Year
              </label>
              <input
                type="number"
                name="year"
                value={formData.year}
                onChange={handleChange}
                className="admin-input"
                placeholder="2023"
                min="1900"
                max="2030"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-metallic-silver mb-2">
                Make
              </label>
              <input
                type="text"
                name="make"
                value={formData.make}
                onChange={handleChange}
                className="admin-input"
                placeholder="Toyota"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-metallic-silver mb-2">
                Model
              </label>
              <input
                type="text"
                name="model"
                value={formData.model}
                onChange={handleChange}
                className="admin-input"
                placeholder="Camry"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-metallic-silver mb-2">
                Color
              </label>
              <input
                type="text"
                name="color"
                value={formData.color}
                onChange={handleChange}
                className="admin-input"
                placeholder="Silver"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-metallic-silver mb-2">
                License Plate
              </label>
              <input
                type="text"
                name="license_plate"
                value={formData.license_plate}
                onChange={handleChange}
                className="admin-input"
                placeholder="ABC1234"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-metallic-silver mb-2">
                VIN (Vehicle Identification Number)
              </label>
              <input
                type="text"
                name="vin"
                value={formData.vin}
                onChange={handleChange}
                className="admin-input"
                placeholder="1HGCM82633A123456"
                maxLength={17}
              />
              <p className="text-xs text-light-gray mt-1">Optional: 17-character VIN number</p>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-metallic-silver mb-2">
              Notes
            </label>
            <textarea
              name="notes"
              value={formData.notes}
              onChange={handleChange}
              rows={4}
              className="admin-input"
              placeholder="Additional notes about this vehicle..."
            />
          </div>

          <div className="flex justify-end space-x-4">
            <button
              type="button"
              onClick={() => navigate('/admin/vehicles')}
              className="btn-secondary"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="btn-primary"
            >
              {loading ? 'Adding...' : 'Add Vehicle'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default NewVehicle
