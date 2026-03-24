import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import { ArrowLeft, Save, Package, DollarSign, CheckCircle } from 'lucide-react'
import toast from 'react-hot-toast'

function NewAddOn() {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    category: 'exterior',
    base_price_sedan: '',
    base_price_suv: '',
    base_price_truck: '',
    base_price_van: '',
    duration_minutes: 30,
    is_active: true
  })

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)

    try {
      // Validate required fields
      if (!formData.name || !formData.description) {
        toast.error('Please fill in all required fields')
        return
      }

      // Validate at least one price is set
      const hasPrice = formData.base_price_sedan || formData.base_price_suv || 
                      formData.base_price_truck || formData.base_price_van
      
      if (!hasPrice) {
        toast.error('Please set at least one price')
        return
      }

      const addOnData = {
        name: formData.name,
        description: formData.description,
        category: formData.category,
        base_price_sedan: formData.base_price_sedan ? parseFloat(formData.base_price_sedan) : null,
        base_price_suv: formData.base_price_suv ? parseFloat(formData.base_price_suv) : null,
        base_price_truck: formData.base_price_truck ? parseFloat(formData.base_price_truck) : null,
        base_price_van: formData.base_price_van ? parseFloat(formData.base_price_van) : null,
        duration_minutes: parseInt(formData.duration_minutes),
        is_active: formData.is_active
      }

      const { data, error } = await supabase
        .from('add_ons')
        .insert([addOnData])
        .select()

      if (error) throw error

      toast.success('Add-on created successfully!')
      navigate('/admin/services')
    } catch (error) {
      console.error('Error creating add-on:', error)
      toast.error('Failed to create add-on')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center">
        <button
          onClick={() => navigate('/admin/services')}
          className="mr-4 text-electric-blue hover:text-bright-cyan transition-colors"
        >
          <ArrowLeft size={24} />
        </button>
        <div>
          <h1 className="text-4xl font-bold metallic-heading mb-2">Add New Add-on</h1>
          <p className="text-light-gray">Create a new add-on service</p>
        </div>
      </div>

      <div className="glass-card">
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Basic Information */}
          <div className="space-y-4">
            <h2 className="text-2xl font-bold text-metallic-silver flex items-center">
              <Package className="mr-2" size={24} />
              Basic Information
            </h2>
            
            <div>
              <label className="block text-metallic-silver mb-2 font-semibold">
                Add-on Name *
              </label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                required
                placeholder="e.g., Ceramic Coating"
                className="w-full bg-navy-dark border border-electric-blue/30 rounded-lg px-4 py-3 text-metallic-silver focus:border-electric-blue focus:outline-none focus:ring-2 focus:ring-electric-blue/50 transition-all"
              />
            </div>

            <div>
              <label className="block text-metallic-silver mb-2 font-semibold">
                Description *
              </label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                required
                rows={4}
                placeholder="Describe what this add-on includes..."
                className="w-full bg-navy-dark border border-electric-blue/30 rounded-lg px-4 py-3 text-metallic-silver focus:border-electric-blue focus:outline-none focus:ring-2 focus:ring-electric-blue/50 transition-all"
              />
            </div>

            <div>
              <label className="block text-metallic-silver mb-2 font-semibold">
                Category
              </label>
              <select
                name="category"
                value={formData.category}
                onChange={handleInputChange}
                className="w-full bg-navy-dark border border-electric-blue/30 rounded-lg px-4 py-3 text-metallic-silver focus:border-electric-blue focus:outline-none focus:ring-2 focus:ring-electric-blue/50 transition-all"
              >
                <option value="exterior">Exterior</option>
                <option value="interior">Interior</option>
                <option value="protection">Protection</option>
                <option value="detailing">Detailing</option>
                <option value="other">Other</option>
              </select>
            </div>
          </div>

          {/* Pricing */}
          <div className="space-y-4">
            <h2 className="text-2xl font-bold text-metallic-silver flex items-center">
              <DollarSign className="mr-2" size={24} />
              Pricing
            </h2>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-metallic-silver mb-2 font-semibold">
                  Sedan Price
                </label>
                <input
                  type="number"
                  name="base_price_sedan"
                  value={formData.base_price_sedan}
                  onChange={handleInputChange}
                  min="0"
                  step="0.01"
                  placeholder="0.00"
                  className="w-full bg-navy-dark border border-electric-blue/30 rounded-lg px-4 py-3 text-metallic-silver focus:border-electric-blue focus:outline-none focus:ring-2 focus:ring-electric-blue/50 transition-all"
                />
              </div>
              
              <div>
                <label className="block text-metallic-silver mb-2 font-semibold">
                  SUV Price
                </label>
                <input
                  type="number"
                  name="base_price_suv"
                  value={formData.base_price_suv}
                  onChange={handleInputChange}
                  min="0"
                  step="0.01"
                  placeholder="0.00"
                  className="w-full bg-navy-dark border border-electric-blue/30 rounded-lg px-4 py-3 text-metallic-silver focus:border-electric-blue focus:outline-none focus:ring-2 focus:ring-electric-blue/50 transition-all"
                />
              </div>
              
              <div>
                <label className="block text-metallic-silver mb-2 font-semibold">
                  Truck Price
                </label>
                <input
                  type="number"
                  name="base_price_truck"
                  value={formData.base_price_truck}
                  onChange={handleInputChange}
                  min="0"
                  step="0.01"
                  placeholder="0.00"
                  className="w-full bg-navy-dark border border-electric-blue/30 rounded-lg px-4 py-3 text-metallic-silver focus:border-electric-blue focus:outline-none focus:ring-2 focus:ring-electric-blue/50 transition-all"
                />
              </div>
              
              <div>
                <label className="block text-metallic-silver mb-2 font-semibold">
                  Van Price
                </label>
                <input
                  type="number"
                  name="base_price_van"
                  value={formData.base_price_van}
                  onChange={handleInputChange}
                  min="0"
                  step="0.01"
                  placeholder="0.00"
                  className="w-full bg-navy-dark border border-electric-blue/30 rounded-lg px-4 py-3 text-metallic-silver focus:border-electric-blue focus:outline-none focus:ring-2 focus:ring-electric-blue/50 transition-all"
                />
              </div>
            </div>
            
            <p className="text-sm text-light-gray">
              Set at least one price. Leave fields empty for vehicle sizes you don't serve.
            </p>
          </div>

          {/* Duration */}
          <div className="space-y-4">
            <h2 className="text-2xl font-bold text-metallic-silver flex items-center">
              <CheckCircle className="mr-2" size={24} />
              Duration
            </h2>
            
            <div>
              <label className="block text-metallic-silver mb-2 font-semibold">
                Duration (minutes)
              </label>
              <input
                type="number"
                name="duration_minutes"
                value={formData.duration_minutes}
                onChange={handleInputChange}
                min="15"
                max="240"
                step="15"
                className="w-full bg-navy-dark border border-electric-blue/30 rounded-lg px-4 py-3 text-metallic-silver focus:border-electric-blue focus:outline-none focus:ring-2 focus:ring-electric-blue/50 transition-all"
              />
            </div>
          </div>

          {/* Status */}
          <div className="flex items-center">
            <input
              type="checkbox"
              name="is_active"
              id="is_active"
              checked={formData.is_active}
              onChange={handleInputChange}
              className="mr-2"
            />
            <label htmlFor="is_active" className="text-metallic-silver">
              Active (add-on will be available for booking)
            </label>
          </div>

          {/* Actions */}
          <div className="flex gap-4">
            <button
              type="button"
              onClick={() => navigate('/admin/services')}
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
                  Creating Add-on...
                </>
              ) : (
                <>
                  <Save size={20} className="inline mr-2" />
                  Create Add-on
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default NewAddOn
