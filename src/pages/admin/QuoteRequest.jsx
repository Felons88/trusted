import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import { 
  ArrowLeft, User, Car, Mail, Phone, MapPin, Check, 
  AlertCircle 
} from 'lucide-react'
import toast from 'react-hot-toast'
import emailService from '../../services/emailServiceSimple'
import { carMakes, carModels, carYears } from '../../data/carData'

function QuoteRequest() {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    car_make: '',
    car_model: '',
    car_year: '',
    address: '',
    service_type: 'full_detail',
    notes: ''
  })

  const serviceTypes = [
    { value: 'full_detail', label: 'Full Detail', price: 'Starting at $150' },
    { value: 'exterior_only', label: 'Exterior Only', price: 'Starting at $75' },
    { value: 'interior_only', label: 'Interior Only', price: 'Starting at $100' },
    { value: 'add_on_services', label: 'Add-on Services', price: 'Starting at $25' }
  ]

  const handleChange = (e) => {
    const { name, value } = e.target
    
    // Clear model if make changes
    if (name === 'car_make') {
      setFormData({
        ...formData,
        [name]: value,
        car_model: '' // Reset model when make changes
      })
    } else {
      setFormData({
        ...formData,
        [name]: value
      })
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    if (!formData.name || !formData.email || !formData.phone || !formData.car_make || !formData.car_model || !formData.car_year || !formData.address) {
      toast.error('Please fill in all required fields')
      return
    }

    setLoading(true)
    
    try {
      // Create quote request in database
      const { data, error } = await supabase
        .from('quote_requests')
        .insert({
          name: formData.name,
          email: formData.email,
          phone: formData.phone,
          car_make: formData.car_make,
          car_model: formData.car_model,
          car_year: formData.car_year,
          address: formData.address,
          service_type: formData.service_type,
          notes: formData.notes,
          status: 'pending',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .select()
        .single()

      if (error) throw error

      // Send email notification to business owner
      await emailService.sendOwnerNotification(
        'New Quote Request Received',
        `
          <strong>Customer Details:</strong><br>
          Name: ${formData.name}<br>
          Email: ${formData.email}<br>
          Phone: ${formData.phone}<br>
          Address: ${formData.address}<br><br>
          
          <strong>Vehicle Details:</strong><br>
          ${formData.car_year} ${formData.car_make} ${formData.car_model}<br><br>
          
          <strong>Service Requested:</strong> ${formData.service_type}<br><br>
          
          <strong>Additional Notes:</strong><br>
          ${formData.notes || 'None'}
        `,
        'high'
      )

      // Send confirmation email to customer
      await emailService.sendWelcomeEmail(formData.email, {
        firstName: formData.name.split(' ')[0],
        lastName: formData.name.split(' ').slice(1).join(' ')
      })

      toast.success('Quote request submitted successfully! We\'ll contact you soon.')
      navigate('/admin/quote-requests')
    } catch (error) {
      console.error('Error creating quote request:', error)
      toast.error('Failed to submit quote request')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <Link to="/admin" className="text-electric-blue hover:text-bright-cyan flex items-center">
            <ArrowLeft className="mr-2" size={20} />
            Back to Dashboard
          </Link>
          <div>
            <h1 className="text-3xl font-bold text-light-gray">New Quote Request</h1>
            <p className="text-light-gray">Collect customer information for a service quote</p>
          </div>
        </div>

        {/* Form */}
        <div className="bg-navy-dark rounded-xl p-6 border border-electric-blue/30">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Customer Information */}
            <div className="space-y-4">
              <h2 className="text-xl font-semibold text-light-gray flex items-center">
                <User className="mr-2" size={20} />
                Customer Information
              </h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-light-gray mb-2">
                    Full Name *
                  </label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    className="w-full px-4 py-2 bg-navy-deep border border-electric-blue/30 rounded-lg text-light-gray focus:outline-none focus:border-electric-blue"
                    placeholder="John Doe"
                    required
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-light-gray mb-2">
                    Email Address *
                  </label>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    className="w-full px-4 py-2 bg-navy-deep border border-electric-blue/30 rounded-lg text-light-gray focus:outline-none focus:border-electric-blue"
                    placeholder="john@example.com"
                    required
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-light-gray mb-2">
                    Phone Number *
                  </label>
                  <input
                    type="tel"
                    name="phone"
                    value={formData.phone}
                    onChange={handleChange}
                    className="w-full px-4 py-2 bg-navy-deep border border-electric-blue/30 rounded-lg text-light-gray focus:outline-none focus:border-electric-blue"
                    placeholder="(555) 123-4567"
                    required
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-light-gray mb-2">
                    Service Address *
                  </label>
                  <input
                    type="text"
                    name="address"
                    value={formData.address}
                    onChange={handleChange}
                    className="w-full px-4 py-2 bg-navy-deep border border-electric-blue/30 rounded-lg text-light-gray focus:outline-none focus:border-electric-blue"
                    placeholder="123 Main St, Elk River, MN"
                    required
                  />
                </div>
              </div>
            </div>

            {/* Vehicle Information */}
            <div className="space-y-4">
              <h2 className="text-xl font-semibold text-light-gray flex items-center">
                <Car className="mr-2" size={20} />
                Vehicle Information
              </h2>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-light-gray mb-2">
                    Year *
                  </label>
                  <select
                    name="car_year"
                    value={formData.car_year}
                    onChange={handleChange}
                    className="w-full px-4 py-2 bg-navy-deep border border-electric-blue/30 rounded-lg text-light-gray focus:outline-none focus:border-electric-blue"
                    required
                  >
                    <option value="">Select Year</option>
                    {carYears.map(year => (
                      <option key={year} value={year}>{year}</option>
                    ))}
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-light-gray mb-2">
                    Make *
                  </label>
                  <select
                    name="car_make"
                    value={formData.car_make}
                    onChange={handleChange}
                    className="w-full px-4 py-2 bg-navy-deep border border-electric-blue/30 rounded-lg text-light-gray focus:outline-none focus:border-electric-blue"
                    required
                  >
                    <option value="">Select Make</option>
                    {carMakes.map(make => (
                      <option key={make} value={make}>{make}</option>
                    ))}
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-light-gray mb-2">
                    Model *
                  </label>
                  <select
                    name="car_model"
                    value={formData.car_model}
                    onChange={handleChange}
                    className="w-full px-4 py-2 bg-navy-deep border border-electric-blue/30 rounded-lg text-light-gray focus:outline-none focus:border-electric-blue"
                    required
                    disabled={!formData.car_make}
                  >
                    <option value="">Select Model</option>
                    {formData.car_make && carModels[formData.car_make]?.map(model => (
                      <option key={model} value={model.trim()}>{model.trim()}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {/* Service Type */}
            <div className="space-y-4">
              <h2 className="text-xl font-semibold text-light-gray">Service Type</h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {serviceTypes.map((service) => (
                  <label
                    key={service.value}
                    className="flex items-center p-4 bg-navy-deep border border-electric-blue/30 rounded-lg cursor-pointer hover:border-electric-blue transition-colors"
                  >
                    <input
                      type="radio"
                      name="service_type"
                      value={service.value}
                      checked={formData.service_type === service.value}
                      onChange={handleChange}
                      className="mr-3"
                    />
                    <div>
                      <div className="font-medium text-light-gray">{service.label}</div>
                      <div className="text-sm text-electric-blue">{service.price}</div>
                    </div>
                  </label>
                ))}
              </div>
            </div>

            {/* Additional Notes */}
            <div>
              <label className="block text-sm font-medium text-light-gray mb-2">
                Additional Notes
              </label>
              <textarea
                name="notes"
                value={formData.notes}
                onChange={handleChange}
                rows={4}
                className="w-full px-4 py-2 bg-navy-deep border border-electric-blue/30 rounded-lg text-light-gray focus:outline-none focus:border-electric-blue"
                placeholder="Any special requirements or concerns..."
              />
            </div>

            {/* Submit Button */}
            <div className="flex justify-end">
              <button
                type="submit"
                disabled={loading}
                className="btn-primary flex items-center"
              >
                {loading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Submitting...
                  </>
                ) : (
                  <>
                    <Check className="mr-2" size={20} />
                    Submit Quote Request
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
    </div>
  )
}

export default QuoteRequest
