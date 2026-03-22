import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import { ArrowLeft, Save, Car, Calendar, User, Mail, Phone } from 'lucide-react'
import toast from 'react-hot-toast'

function VehicleEdit() {
  const navigate = useNavigate()
  const { id } = useParams()
  const [loading, setLoading] = useState(false)
  const [clients, setClients] = useState([])
  const [formData, setFormData] = useState({
    client_id: '',
    make: '',
    model: '',
    year: '',
    color: '',
    license_plate: '',
    vin: '',
    notes: ''
  })

  useEffect(() => {
    loadVehicle()
    loadClients()
  }, [id])

  const loadVehicle = async () => {
    try {
      const { data, error } = await supabase
        .from('vehicles')
        .select('*')
        .eq('id', id)
        .single()

      if (error) throw error
      if (data) {
        setFormData({
          client_id: data.client_id || '',
          make: data.make || '',
          model: data.model || '',
          year: data.year || '',
          color: data.color || '',
          license_plate: data.license_plate || '',
          vin: data.vin || '',
          notes: data.notes || ''
        })
      }
    } catch (error) {
      console.error('Error loading vehicle:', error)
      toast.error('Failed to load vehicle')
    }
  }

  const loadClients = async () => {
    try {
      const { data, error } = await supabase
        .from('clients')
        .select('id, full_name, email')
        .order('full_name')

      if (error) throw error
      setClients(data || [])
    } catch (error) {
      console.error('Error loading clients:', error)
    }
  }

  const handleInputChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)

    try {
      // Validate required fields
      if (!formData.client_id || !formData.make || !formData.model || !formData.year) {
        toast.error('Please fill in all required fields')
        return
      }

      const updateData = {
        client_id: formData.client_id,
        make: formData.make,
        model: formData.model,
        year: parseInt(formData.year),
        color: formData.color,
        license_plate: formData.license_plate,
        vin: formData.vin,
        notes: formData.notes,
        updated_at: new Date().toISOString()
      }

      const { data, error } = await supabase
        .from('vehicles')
        .update(updateData)
        .eq('id', id)
        .select()

      if (error) throw error

      toast.success('Vehicle updated successfully!')
      navigate('/admin/vehicles')
    } catch (error) {
      console.error('Error updating vehicle:', error)
      toast.error('Failed to update vehicle')
    } finally {
      setLoading(false)
    }
  }

  const carMakes = [
    'Toyota', 'Honda', 'Ford', 'Chevrolet', 'BMW', 'Mercedes-Benz', 'Audi',
    'Nissan', 'Hyundai', 'Kia', 'Volkswagen', 'Mazda', 'Subaru', 'Lexus',
    'Jeep', 'Ram', 'GMC', 'Buick', 'Cadillac', 'Lincoln', 'Acura', 'Infiniti',
    'Volvo', 'Jaguar', 'Land Rover', 'Porsche', 'Tesla', 'Mitsubishi'
  ]

  const getModels = (make) => {
    const models = {
      'Toyota': ['Camry', 'Corolla', 'RAV4', 'Highlander', 'Tacoma', 'Prius'],
      'Honda': ['Accord', 'Civic', 'CR-V', 'Pilot', 'Fit', 'HR-V'],
      'Ford': ['F-150', 'Mustang', 'Explorer', 'Escape', 'Focus', 'Edge'],
      'Chevrolet': ['Silverado', 'Malibu', 'Equinox', 'Tahoe', 'Cruze', 'Traverse'],
      'BMW': ['3 Series', '5 Series', 'X3', 'X5', '7 Series', '2 Series'],
      'Mercedes-Benz': ['C-Class', 'E-Class', 'GLC', 'GLE', 'S-Class', 'A-Class'],
      'Audi': ['A4', 'A6', 'Q5', 'Q7', 'A3', 'Q3'],
      'Nissan': ['Altima', 'Sentra', 'Rogue', 'Pathfinder', 'Frontier', 'Leaf'],
      'Hyundai': ['Elantra', 'Sonata', 'Tucson', 'Santa Fe', 'Accent', 'Kona'],
      'Kia': ['Optima', 'Forte', 'Sportage', 'Sorento', 'Rio', 'Telluride'],
      'Volkswagen': ['Jetta', 'Passat', 'Tiguan', 'Atlas', 'Golf', 'Beetle'],
      'Mazda': ['Mazda3', 'Mazda6', 'CX-5', 'CX-9', 'MX-5 Miata', 'CX-30'],
      'Subaru': ['Impreza', 'Legacy', 'Outback', 'Forester', 'Crosstrek', 'Ascent'],
      'Lexus': ['ES', 'RX', 'NX', 'UX', 'LS', 'IS'],
      'Jeep': ['Wrangler', 'Cherokee', 'Grand Cherokee', 'Renegade', 'Compass', 'Gladiator'],
      'Ram': ['1500', '2500', '3500', 'ProMaster', 'ProMaster City'],
      'Tesla': ['Model S', 'Model 3', 'Model X', 'Model Y', 'Cybertruck', 'Roadster']
    }
    return models[make] || []
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center">
        <button
          onClick={() => navigate('/admin/vehicles')}
          className="mr-4 text-electric-blue hover:text-bright-cyan transition-colors"
        >
          <ArrowLeft size={24} />
        </button>
        <div>
          <h1 className="text-4xl font-bold metallic-heading mb-2">Edit Vehicle</h1>
          <p className="text-light-gray">Update vehicle information</p>
        </div>
      </div>

      <div className="glass-card">
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Client Selection */}
          <div>
            <label className="block text-metallic-silver mb-2 font-semibold">
              Client *
            </label>
            <select
              name="client_id"
              value={formData.client_id}
              onChange={handleInputChange}
              required
              className="w-full bg-navy-dark border border-electric-blue/30 rounded-lg px-4 py-3 text-metallic-silver focus:border-electric-blue focus:outline-none focus:ring-2 focus:ring-electric-blue/50 transition-all"
            >
              <option value="">Select a client</option>
              {clients.map(client => (
                <option key={client.id} value={client.id}>
                  {client.full_name} ({client.email})
                </option>
              ))}
            </select>
          </div>

          {/* Vehicle Information */}
          <div className="space-y-4">
            <h2 className="text-2xl font-bold text-metallic-silver flex items-center">
              <Car className="mr-2" size={24} />
              Vehicle Information
            </h2>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-metallic-silver mb-2 font-semibold">
                  Make *
                </label>
                <select
                  name="make"
                  value={formData.make}
                  onChange={handleInputChange}
                  required
                  className="w-full bg-navy-dark border border-electric-blue/30 rounded-lg px-4 py-3 text-metallic-silver focus:border-electric-blue focus:outline-none focus:ring-2 focus:ring-electric-blue/50 transition-all"
                >
                  <option value="">Select make</option>
                  {carMakes.map(make => (
                    <option key={make} value={make}>{make}</option>
                  ))}
                </select>
              </div>
              
              <div>
                <label className="block text-metallic-silver mb-2 font-semibold">
                  Model *
                </label>
                <select
                  name="model"
                  value={formData.model}
                  onChange={handleInputChange}
                  required
                  disabled={!formData.make}
                  className="w-full bg-navy-dark border border-electric-blue/30 rounded-lg px-4 py-3 text-metallic-silver focus:border-electric-blue focus:outline-none focus:ring-2 focus:ring-electric-blue/50 transition-all disabled:opacity-50"
                >
                  <option value="">Select model</option>
                  {getModels(formData.make).map(model => (
                    <option key={model} value={model}>{model}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="block text-metallic-silver mb-2 font-semibold">
                  Year *
                </label>
                <input
                  type="number"
                  name="year"
                  value={formData.year}
                  onChange={handleInputChange}
                  required
                  min="1990"
                  max={new Date().getFullYear() + 1}
                  placeholder="e.g., 2023"
                  className="w-full bg-navy-dark border border-electric-blue/30 rounded-lg px-4 py-3 text-metallic-silver focus:border-electric-blue focus:outline-none focus:ring-2 focus:ring-electric-blue/50 transition-all"
                />
              </div>
              
              <div>
                <label className="block text-metallic-silver mb-2 font-semibold">
                  Color
                </label>
                <input
                  type="text"
                  name="color"
                  value={formData.color}
                  onChange={handleInputChange}
                  placeholder="e.g., Silver"
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
                  onChange={handleInputChange}
                  placeholder="e.g., ABC-1234"
                  className="w-full bg-navy-dark border border-electric-blue/30 rounded-lg px-4 py-3 text-metallic-silver focus:border-electric-blue focus:outline-none focus:ring-2 focus:ring-electric-blue/50 transition-all"
                />
              </div>
            </div>

            <div>
              <label className="block text-metallic-silver mb-2 font-semibold">
                VIN (Optional)
              </label>
              <input
                type="text"
                name="vin"
                value={formData.vin}
                onChange={handleInputChange}
                placeholder="e.g., 1HGCM82633A123456"
                maxLength="17"
                className="w-full bg-navy-dark border border-electric-blue/30 rounded-lg px-4 py-3 text-metallic-silver focus:border-electric-blue focus:outline-none focus:ring-2 focus:ring-electric-blue/50 transition-all"
              />
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-metallic-silver mb-2 font-semibold">
              Notes
            </label>
            <textarea
              name="notes"
              value={formData.notes}
              onChange={handleInputChange}
              rows={4}
              placeholder="Additional notes about the vehicle..."
              className="w-full bg-navy-dark border border-electric-blue/30 rounded-lg px-4 py-3 text-metallic-silver focus:border-electric-blue focus:outline-none focus:ring-2 focus:ring-electric-blue/50 transition-all"
            />
          </div>

          {/* Actions */}
          <div className="flex gap-4">
            <button
              type="button"
              onClick={() => navigate('/admin/vehicles')}
              className="px-6 py-3 bg-navy-dark border border-electric-blue/30 rounded-lg text-metallic-silver hover:bg-navy-darker transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="btn-primary flex-1"
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                  Updating Vehicle...
                </>
              ) : (
                <>
                  <Save size={20} className="inline mr-2" />
                  Update Vehicle
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default VehicleEdit
