import { useState, useEffect } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import { ArrowLeft, Save, Package, DollarSign, AlertCircle } from 'lucide-react'
import toast from 'react-hot-toast'

function AddOnEdit() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    category: 'extra',
    price: 0,
    is_active: true
  })

  useEffect(() => {
    loadAddOn()
  }, [id])

  const loadAddOn = async () => {
    try {
      const { data, error } = await supabase
        .from('add_ons')
        .select('*')
        .eq('id', id)
        .single()

      if (error) throw error

      setFormData({
        name: data.name || '',
        description: data.description || '',
        category: data.category || 'extra',
        price: data.price || 0,
        is_active: data.is_active ?? true
      })
    } catch (error) {
      console.error('Error loading add-on:', error)
      toast.error('Failed to load add-on data')
    } finally {
      setLoading(false)
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
        .from('add_ons')
        .update({
          name: formData.name,
          description: formData.description,
          category: formData.category,
          price: formData.price,
          is_active: formData.is_active,
          updated_at: new Date().toISOString()
        })
        .eq('id', id)

      if (error) throw error

      toast.success('Add-on updated successfully!')
      navigate('/admin/services')
    } catch (error) {
      console.error('Error updating add-on:', error)
      toast.error('Failed to update add-on')
    } finally {
      setSaving(false)
    }
  }

  const categories = [
    { value: 'extra', label: 'Extra Service' },
    { value: 'protection', label: 'Protection' },
    { value: 'detailing', label: 'Detailing' },
    { value: 'cleaning', label: 'Cleaning' },
    { value: 'polish', label: 'Polish' }
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
            <h1 className="text-3xl font-bold text-light-gray">Edit Add-On</h1>
            <p className="text-light-gray">Update add-on information</p>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="glass-card p-6">
          <h3 className="text-xl font-bold text-light-gray mb-4 flex items-center">
            <Package className="text-electric-blue mr-3" size={24} />
            Add-On Information
          </h3>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm text-light-gray mb-2">Add-On Name</label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                className="admin-input"
                placeholder="e.g., Headlight Restoration"
                required
              />
            </div>

            <div>
              <label className="block text-sm text-light-gray mb-2">Category</label>
              <select
                value={formData.category}
                onChange={(e) => setFormData(prev => ({ ...prev, category: e.target.value }))}
                className="admin-select"
                required
              >
                {categories.map(category => (
                  <option key={category.value} value={category.value}>
                    {category.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm text-light-gray mb-2">Price</label>
              <input
                type="number"
                value={formData.price}
                onChange={(e) => setFormData(prev => ({ ...prev, price: parseFloat(e.target.value) || 0 }))}
                className="admin-input"
                min="0"
                step="0.01"
                placeholder="0.00"
                required
              />
            </div>

            <div>
              <label className="block text-sm text-light-gray mb-2">Description</label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                className="admin-input"
                rows={4}
                placeholder="Describe what this add-on includes..."
                required
              />
            </div>

            <div className="flex items-center space-x-3">
              <input
                type="checkbox"
                id="is_active"
                checked={formData.is_active}
                onChange={(e) => setFormData(prev => ({ ...prev, is_active: e.target.checked }))}
                className="w-4 h-4 text-electric-blue rounded focus:ring-2 focus:ring-electric-blue/50"
              />
              <label htmlFor="is_active" className="text-light-gray">
                Add-on is active and available for booking
              </label>
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
        </div>
      </form>
    </div>
  )
}

export default AddOnEdit
