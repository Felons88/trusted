import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import { ArrowLeft, User, Mail, Phone, MapPin, Car } from 'lucide-react'
import toast from 'react-hot-toast'
import AddressAutocomplete from '../../components/AddressAutocomplete'

function NewClient() {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    full_name: '',
    email: '',
    phone: '',
    address: '',
    city: '',
    state: '',
    zip_code: '',
    notes: ''
  })

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)

    try {
      const { error } = await supabase
        .from('clients')
        .insert([formData])

      if (error) throw error

      toast.success('Client created successfully!')
      navigate('/admin/clients')
    } catch (error) {
      console.error('Error creating client:', error)
      toast.error('Failed to create client')
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

  const handleAddressSelect = (addressData) => {
    console.log('NewClient handleAddressSelect called with:', addressData)
    
    setFormData(prev => {
      const updated = {
        ...prev,
        address: addressData.fullAddress,
        city: addressData.components.city,
        state: addressData.components.state,
        zip_code: addressData.components.zipCode
      }
      console.log('Updated formData:', updated)
      return updated
    })
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center">
          <button
            onClick={() => navigate('/admin/clients')}
            className="mr-4 text-electric-blue hover:text-bright-cyan"
          >
            <ArrowLeft size={24} />
          </button>
          <div>
            <h1 className="text-4xl font-bold metallic-heading mb-2">New Client</h1>
            <p className="text-light-gray">Add a new client to the system</p>
          </div>
        </div>
      </div>

      <div className="glass-card">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-metallic-silver mb-2">
                <User size={16} className="inline mr-2" />
                Full Name
              </label>
              <input
                type="text"
                name="full_name"
                value={formData.full_name}
                onChange={handleChange}
                className="admin-input"
                placeholder="John Doe"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-metallic-silver mb-2">
                <Mail size={16} className="inline mr-2" />
                Email
              </label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                className="admin-input"
                placeholder="john@example.com"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-metallic-silver mb-2">
                <Phone size={16} className="inline mr-2" />
                Phone
              </label>
              <input
                type="tel"
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                className="admin-input"
                placeholder="(555) 123-4567"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-metallic-silver mb-2">
                <MapPin size={16} className="inline mr-2" />
                Address
              </label>
              <AddressAutocomplete
                value={formData.address}
                onChange={(e) => setFormData(prev => ({ ...prev, address: e.target.value }))}
                onAddressSelect={handleAddressSelect}
                placeholder="Enter client address..."
                required={true}
              />
            </div>

            {/* Hidden fields that get filled by AddressAutocomplete */}
            <div className="hidden">
              <input type="text" name="city" value={formData.city} onChange={handleChange} />
              <input type="text" name="state" value={formData.state} onChange={handleChange} />
              <input type="text" name="zip_code" value={formData.zip_code} onChange={handleChange} />
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
              className="w-full bg-navy-dark border border-electric-blue/30 rounded-lg px-4 py-3 text-metallic-silver focus:border-electric-blue focus:outline-none"
              placeholder="Additional notes about this client..."
            />
          </div>

          <div className="flex justify-end space-x-4">
            <button
              type="button"
              onClick={() => navigate('/admin/clients')}
              className="btn-secondary"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="btn-primary"
            >
              {loading ? 'Creating...' : 'Create Client'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default NewClient
