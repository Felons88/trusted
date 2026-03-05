import { useState } from 'react'
import { Car, User, Mail, Phone, MapPin, Check, Send } from 'lucide-react'
import toast from 'react-hot-toast'
import { supabase } from '../lib/supabase'
import emailService from '../services/emailServiceSimple'
import { carMakes, carModels, carYears } from '../data/carData'

function Quote() {
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
      // First save to database
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
          status: 'pending'
        })
        .select()

      if (error) {
        console.error('Database error:', error)
        throw new Error('Failed to save quote request')
      }

      console.log('Quote saved to database:', data)

      // Send email notification to business owner
      await emailService.sendOwnerNotification(
        'New Quote Request from Website',
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

      toast.success('Quote request submitted successfully! We\'ll contact you within 24 hours.')
      
      // Reset form
      setFormData({
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
    } catch (error) {
      console.error('Error submitting quote request:', error)
      toast.error('Failed to submit quote request. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-navy-deep pt-32">
      <div className="container mx-auto px-4 py-12">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="text-center mb-12">
            <h1 className="text-5xl font-bold metallic-heading mb-6">
              Get Your <span className="text-electric-blue glow-text">Free Quote</span>
            </h1>
            <p className="text-xl text-light-gray max-w-2xl mx-auto">
              Tell us about your vehicle and service needs. We'll get back to you with a competitive quote within 24 hours.
            </p>
          </div>

          {/* Form */}
          <div className="bg-navy-dark rounded-xl p-8 border border-electric-blue/30">
            <form onSubmit={handleSubmit} className="space-y-8">
              {/* Customer Information */}
              <div className="space-y-6">
                <h2 className="text-2xl font-semibold text-light-gray flex items-center">
                  <User className="mr-3" size={24} />
                  Your Information
                </h2>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-light-gray mb-2">
                      Full Name *
                    </label>
                    <input
                      type="text"
                      name="name"
                      value={formData.name}
                      onChange={handleChange}
                      className="w-full px-4 py-3 bg-navy-deep border border-electric-blue/30 rounded-lg text-light-gray focus:outline-none focus:border-electric-blue transition-colors"
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
                      className="w-full px-4 py-3 bg-navy-deep border border-electric-blue/30 rounded-lg text-light-gray focus:outline-none focus:border-electric-blue transition-colors"
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
                      className="w-full px-4 py-3 bg-navy-deep border border-electric-blue/30 rounded-lg text-light-gray focus:outline-none focus:border-electric-blue transition-colors"
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
                      className="w-full px-4 py-3 bg-navy-deep border border-electric-blue/30 rounded-lg text-light-gray focus:outline-none focus:border-electric-blue transition-colors"
                      placeholder="123 Main St, Elk River, MN"
                      required
                    />
                  </div>
                </div>
              </div>

              {/* Vehicle Information */}
              <div className="space-y-6">
                <h2 className="text-2xl font-semibold text-light-gray flex items-center">
                  <Car className="mr-3" size={24} />
                  Vehicle Information
                </h2>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-light-gray mb-2">
                      Year *
                    </label>
                    <select
                      name="car_year"
                      value={formData.car_year}
                      onChange={handleChange}
                      className="w-full px-4 py-3 bg-navy-deep border border-electric-blue/30 rounded-lg text-light-gray focus:outline-none focus:border-electric-blue transition-colors"
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
                      className="w-full px-4 py-3 bg-navy-deep border border-electric-blue/30 rounded-lg text-light-gray focus:outline-none focus:border-electric-blue transition-colors"
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
                      className="w-full px-4 py-3 bg-navy-deep border border-electric-blue/30 rounded-lg text-light-gray focus:outline-none focus:border-electric-blue transition-colors"
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
              <div className="space-y-6">
                <h2 className="text-2xl font-semibold text-light-gray">Service Type</h2>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {serviceTypes.map((service) => (
                    <label
                      key={service.value}
                      className="flex items-center p-6 bg-navy-deep border border-electric-blue/30 rounded-lg cursor-pointer hover:border-electric-blue transition-colors"
                    >
                      <input
                        type="radio"
                        name="service_type"
                        value={service.value}
                        checked={formData.service_type === service.value}
                        onChange={handleChange}
                        className="mr-4 w-5 h-5"
                      />
                      <div>
                        <div className="font-medium text-light-gray text-lg">{service.label}</div>
                        <div className="text-sm text-electric-blue mt-1">{service.price}</div>
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
                  className="w-full px-4 py-3 bg-navy-deep border border-electric-blue/30 rounded-lg text-light-gray focus:outline-none focus:border-electric-blue transition-colors resize-none"
                  placeholder="Any special requirements, concerns, or questions..."
                />
              </div>

              {/* Submit Button */}
              <div className="text-center">
                <button
                  type="submit"
                  disabled={loading}
                  className="btn-primary text-lg px-12 py-4 flex items-center mx-auto"
                >
                  {loading ? (
                    <>
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-3"></div>
                      Submitting...
                    </>
                  ) : (
                    <>
                      <Send className="mr-3" size={20} />
                      Get Your Free Quote
                    </>
                  )}
                </button>
                <p className="text-sm text-light-gray mt-4">
                  We'll respond within 24 hours with your personalized quote
                </p>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Quote
