import { useState, useEffect } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import { ArrowLeft, Save, Package, DollarSign, Clock, AlertCircle } from 'lucide-react'
import toast from 'react-hot-toast'

function ServiceEdit() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    type: 'exterior',
    base_price_sedan: '',
    base_price_suv: '',
    base_price_truck: '',
    base_price_van: '',
    duration_minutes: 120,
    is_active: true
  })

  useEffect(() => {
    loadService()
  }, [id])

  const loadService = async () => {
    try {
      const { data, error } = await supabase
        .from('services')
        .select('*')
        .eq('id', id)
        .single()

      if (error) throw error

      setFormData({
        name: data.name || '',
        description: data.description || '',
        type: data.type || 'exterior',
        base_price_sedan: data.base_price_sedan ?? '',
        base_price_suv: data.base_price_suv ?? '',
        base_price_truck: data.base_price_truck ?? '',
        base_price_van: data.base_price_van ?? '',
        duration_minutes: data.duration_minutes || 120,
        is_active: data.is_active ?? true
      })
    } catch (error) {
      console.error('Error loading service:', error)
      toast.error('Failed to load service data')
    } finally {
      setLoading(false)
    }
  }

  const handlePriceChange = (field, value) => {
    if (value === '' || value === null || value === undefined) {
      // Allow empty values (user is clearing the field)
      setFormData(prev => ({ ...prev, [field]: '' }))
    } else {
      // Convert to number, but don't default to 0 if invalid
      const numValue = parseFloat(value)
      if (!isNaN(numValue) && numValue >= 0) {
        setFormData(prev => ({ ...prev, [field]: numValue }))
      }
      // If invalid, don't update (keep current value)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    if (!formData.name || !formData.description) {
      toast.error('Please fill in all required fields')
      return
    }

    setSaving(true)
    
    try {
      const { error } = await supabase
        .from('services')
        .update({
          name: formData.name,
          description: formData.description,
          type: formData.type,
          base_price_sedan: formData.base_price_sedan === '' ? 0 : formData.base_price_sedan,
          base_price_suv: formData.base_price_suv === '' ? 0 : formData.base_price_suv,
          base_price_truck: formData.base_price_truck === '' ? 0 : formData.base_price_truck,
          base_price_van: formData.base_price_van === '' ? 0 : formData.base_price_van,
          duration_minutes: formData.duration_minutes,
          is_active: formData.is_active,
          updated_at: new Date().toISOString()
        })
        .eq('id', id)

      if (error) throw error

      toast.success('Service updated successfully!')
      navigate('/admin/services')
    } catch (error) {
      console.error('Error updating service:', error)
      toast.error('Failed to update service')
    } finally {
      setSaving(false)
    }
  }

  const serviceTypes = [
    { value: 'exterior', label: 'Exterior Detail' },
    { value: 'interior', label: 'Interior Detail' },
    { vehicleSize: 'sedan', label: 'Sedan' },
    { vehicleSize: 'suv', label: 'SUV' },
    { vehicleSize: 'truck', label: 'Truck' },
    { vehicleSize: 'van', label: 'Van' }
  ]

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-electric-blue"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Link
            to="/admin/services"
            className="text-light-gray hover:text-electric-blue transition-colors"
          >
            <ArrowLeft size={24} />
          </Link>
          <div>
            <h1 className="text-3xl font-bold text-light-gray">Edit Service</h1>
            <p className="text-light-gray">Update service information</p>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Basic Information */}
          <div className="glass-card p-6">
            <h3 className="text-xl font-bold text-light-gray mb-4 flex items-center">
              <Package className="text-electric-blue mr-3" size={24} />
              Basic Information
            </h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm text-light-gray mb-2">Service Name</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  className="admin-input"
                  placeholder="e.g., Exterior Detail"
                  required
                />
              </div>

              <div>
                <label className="block text-sm text-light-gray mb-2">Service Type</label>
                <select
                  value={formData.type}
                  onChange={(e) => setFormData(prev => ({ ...prev, type: e.target.value }))}
                  className="admin-select"
                  required
                >
                  <option value="exterior">Exterior</option>
                  <option value="interior">Interior</option>
                  <option value="full">Full Detail</option>
                  <option value="add-on">Add-on</option>
                </select>
              </div>

              <div>
                <label className="block text-sm text-light-gray mb-2">Duration (minutes)</label>
                <input
                  type="number"
                  value={formData.duration_minutes}
                  onChange={(e) => setFormData(prev => ({ ...prev, duration_minutes: parseInt(e.target.value) || 120 }))}
                  className="admin-input"
                  min="30"
                  step="30"
                  required
                />
              </div>

              <div>
                <label className="block text-sm text-light-gray mb-3">Pricing by Vehicle Size</label>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs text-slate-400 mb-1 block">Sedan</label>
                    <input
                      type="number"
                      value={formData.base_price_sedan}
                      onChange={(e) => handlePriceChange('base_price_sedan', e.target.value)}
                      className="admin-input"
                      min="0"
                      step="0.01"
                      placeholder="0.00"
                      required
                    />
                  </div>
                  <div>
                    <label className="text-xs text-slate-400 mb-1 block">SUV</label>
                    <input
                      type="number"
                      value={formData.base_price_suv}
                      onChange={(e) => handlePriceChange('base_price_suv', e.target.value)}
                      className="admin-input"
                      min="0"
                      step="0.01"
                      placeholder="0.00"
                      required
                    />
                  </div>
                  <div>
                    <label className="text-xs text-slate-400 mb-1 block">Truck</label>
                    <input
                      type="number"
                      value={formData.base_price_truck}
                      onChange={(e) => handlePriceChange('base_price_truck', e.target.value)}
                      className="admin-input"
                      min="0"
                      step="0.01"
                      placeholder="0.00"
                      required
                    />
                  </div>
                  <div>
                    <label className="text-xs text-slate-400 mb-1 block">Van</label>
                    <input
                      type="number"
                      value={formData.base_price_van}
                      onChange={(e) => handlePriceChange('base_price_van', e.target.value)}
                      className="admin-input"
                      min="0"
                      step="0.01"
                      placeholder="0.00"
                      required
                    />
                  </div>
                </div>
              </div>

              <div className="flex items-center space-x-3">
                <input
                  type="checkbox"
                  id="is_active"
                  checked={formData.is_active}
                  onChange={(e) => setFormData(prev => ({ ...prev, is_active: e.target.checked }))}
                  className="w-4 h-4 text-electric-blue bg-white/10 border-white/20 rounded focus:ring-electric-blue focus:ring-2"
                />
                <label htmlFor="is_active" className="text-sm text-light-gray">
                  Service is active and available for booking
                </label>
              </div>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-between">
          <Link
            to="/admin/services"
            className="btn-secondary"
          >
            Cancel
          </Link>
          
          <button
            type="submit"
            disabled={saving}
            className="btn-primary"
          >
            {saving ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </form>
    </div>
  )
}

export default ServiceEdit
