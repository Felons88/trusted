import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuthStore } from '../store/authStore'
import { sendQuoteRequestEmail } from '../utils/emailService'
import { Calendar, Car, MapPin, CheckCircle } from 'lucide-react'
import toast from 'react-hot-toast'

function BookNowV2() {
  const { user } = useAuthStore()
  const navigate = useNavigate()
  const [services, setServices] = useState([])
  const [addOns, setAddOns] = useState([])
  const [clientData, setClientData] = useState(null)
  const [loading, setLoading] = useState(false)
  const [isSubmitted, setIsSubmitted] = useState(false)

  const [formData, setFormData] = useState({
    fullName: '',
    phone: '',
    email: '',
    year: '',
    make: '',
    model: '',
    vehicleSize: '',
    serviceType: '',
    selectedAddOns: [],
    preferredDate: '',
    preferredTime: '',
    address: '',
    notes: '',
  })

  useEffect(() => {
    loadData()
  }, [user])

  const loadData = async () => {
    const { data: servicesData } = await supabase
      .from('services')
      .select('*')
      .eq('is_active', true)

    const { data: addOnsData } = await supabase
      .from('add_ons')
      .select('*')
      .eq('is_active', true)

    setServices(servicesData || [])
    setAddOns(addOnsData || [])

    if (user) {
      const { data: client } = await supabase
        .from('clients')
        .select('*')
        .eq('user_id', user.id)
        .single()

      if (client) {
        setClientData(client)
        setFormData(prev => ({
          ...prev,
          fullName: client.full_name || '',
          email: client.email || '',
          phone: client.phone || '',
        }))
      }
    }
  }

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target
    
    if (type === 'checkbox') {
      setFormData(prev => ({
        ...prev,
        selectedAddOns: checked
          ? [...prev.selectedAddOns, value]
          : prev.selectedAddOns.filter(item => item !== value)
      }))
    } else {
      setFormData(prev => ({ ...prev, [name]: value }))
    }
  }

  const calculateTotal = () => {
    let total = 0
    
    if (formData.serviceType && formData.vehicleSize) {
      const service = services.find(s => s.type === formData.serviceType)
      if (service) {
        const priceKey = `base_price_${formData.vehicleSize}`
        total += parseFloat(service[priceKey] || 0)
      }
    }

    formData.selectedAddOns.forEach(addonId => {
      const addon = addOns.find(a => a.id === addonId)
      if (addon) {
        total += parseFloat(addon.price)
      }
    })

    return total.toFixed(2)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)

    try {
      let finalClientId = clientData?.id

      if (!clientData && !user) {
        const { data: newClient, error: clientError } = await supabase
          .from('clients')
          .insert({
            full_name: formData.fullName,
            email: formData.email,
            phone: formData.phone,
          })
          .select()
          .single()

        if (clientError) throw clientError
        finalClientId = newClient.id
      }

      const total = parseFloat(calculateTotal())
      const tax = total * 0.075
      const grandTotal = total + tax

      const { data: booking, error: bookingError } = await supabase
        .from('bookings')
        .insert({
          client_id: finalClientId,
          service_type: formData.serviceType,
          vehicle_size: formData.vehicleSize,
          preferred_date: formData.preferredDate,
          preferred_time: formData.preferredTime,
          service_address: formData.address,
          subtotal: total,
          tax: tax,
          total: grandTotal,
          notes: formData.notes,
          status: 'pending',
        })
        .select()
        .single()

      if (bookingError) throw bookingError

      if (formData.selectedAddOns.length > 0) {
        const addOnInserts = formData.selectedAddOns.map(addonId => {
          const addon = addOns.find(a => a.id === addonId)
          return {
            booking_id: booking.id,
            add_on_id: addonId,
            price: addon.price,
            quantity: 1,
          }
        })

        await supabase.from('booking_add_ons').insert(addOnInserts)
      }

      await sendQuoteRequestEmail({
        full_name: formData.fullName,
        email: formData.email,
        phone: formData.phone,
        vehicle_year: formData.year,
        vehicle_make: formData.make,
        vehicle_model: formData.model,
        vehicle_size: formData.vehicleSize,
        service_type: formData.serviceType,
        preferred_date: formData.preferredDate,
        preferred_time: formData.preferredTime,
        address: formData.address,
        notes: formData.notes,
      })

      toast.success('Booking request submitted!')
      setIsSubmitted(true)
      
      setTimeout(() => {
        if (user) {
          navigate('/client-portal')
        } else {
          window.scrollTo({ top: 0, behavior: 'smooth' })
        }
      }, 2000)
    } catch (error) {
      console.error('Booking error:', error)
      toast.error('Failed to submit booking. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  if (isSubmitted) {
    return (
      <div className="min-h-screen flex items-center justify-center pt-20 pb-20 px-4 bg-navy-gradient">
        <div className="max-w-2xl mx-auto text-center fade-in">
          <div className="glass-card border-bright-cyan shadow-glow-cyan">
            <div className="bg-electric-blue/20 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6">
              <CheckCircle className="text-bright-cyan" size={48} />
            </div>
            <h1 className="text-4xl font-bold metallic-heading mb-4">
              Booking Request Received!
            </h1>
            <p className="text-xl text-light-gray mb-6">
              Thank you for choosing Trusted Mobile Detailing. We'll contact you shortly to confirm your appointment.
            </p>
            <div className="bg-navy-dark/50 rounded-lg p-6 mb-6">
              <h3 className="text-lg font-bold metallic-heading mb-3">What's Next?</h3>
              <ul className="text-left text-light-gray space-y-2">
                <li>✓ Check your email for confirmation</li>
                <li>✓ We'll call you within 24 hours</li>
                <li>✓ Confirm your preferred date and time</li>
                <li>✓ Receive final pricing and details</li>
              </ul>
            </div>
            {user ? (
              <button
                onClick={() => navigate('/client-portal')}
                className="btn-primary"
              >
                Go to Client Portal
              </button>
            ) : (
              <button
                onClick={() => navigate('/')}
                className="btn-primary"
              >
                Return Home
              </button>
            )}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="overflow-hidden bg-navy-gradient">
      <section className="relative min-h-[40vh] flex items-center justify-center pt-32 pb-12">
        <div className="absolute inset-0 bg-gradient-to-b from-navy-deep via-navy-dark to-navy-deep opacity-95"></div>
        
        <div className="relative z-10 container mx-auto px-4 text-center fade-in">
          <h1 className="text-5xl md:text-6xl font-bold metallic-heading mb-6 animate-shine">
            Book Your <span className="text-electric-blue glow-text">Detail</span>
          </h1>
          <p className="text-xl text-light-gray max-w-3xl mx-auto">
            Fill out the form below and we'll contact you to confirm your appointment
          </p>
        </div>
      </section>

      <section className="py-12 pb-20">
        <div className="container mx-auto px-4">
          <form onSubmit={handleSubmit} className="max-w-3xl mx-auto">
            {!user && (
              <div className="glass-card mb-6 fade-in">
                <h2 className="text-2xl font-bold metallic-heading mb-6 flex items-center">
                  <Car className="text-electric-blue mr-3" size={28} />
                  Personal Information
                </h2>
                
                <div className="grid md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-metallic-silver mb-2 font-semibold">
                      Full Name <span className="text-bright-cyan">*</span>
                    </label>
                    <input
                      type="text"
                      name="fullName"
                      value={formData.fullName}
                      onChange={handleChange}
                      required
                      className="w-full bg-navy-dark border border-electric-blue/30 rounded-lg px-4 py-3 text-metallic-silver focus:border-electric-blue focus:outline-none focus:ring-2 focus:ring-electric-blue/50 transition-all"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-metallic-silver mb-2 font-semibold">
                      Phone Number <span className="text-bright-cyan">*</span>
                    </label>
                    <input
                      type="tel"
                      name="phone"
                      value={formData.phone}
                      onChange={handleChange}
                      required
                      className="w-full bg-navy-dark border border-electric-blue/30 rounded-lg px-4 py-3 text-metallic-silver focus:border-electric-blue focus:outline-none focus:ring-2 focus:ring-electric-blue/50 transition-all"
                    />
                  </div>
                  
                  <div className="md:col-span-2">
                    <label className="block text-metallic-silver mb-2 font-semibold">
                      Email <span className="text-bright-cyan">*</span>
                    </label>
                    <input
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleChange}
                      required
                      className="w-full bg-navy-dark border border-electric-blue/30 rounded-lg px-4 py-3 text-metallic-silver focus:border-electric-blue focus:outline-none focus:ring-2 focus:ring-electric-blue/50 transition-all"
                    />
                  </div>
                </div>
              </div>
            )}

            <div className="glass-card mb-6 fade-in" style={{ animationDelay: '0.1s' }}>
              <h2 className="text-2xl font-bold metallic-heading mb-6 flex items-center">
                <Car className="text-electric-blue mr-3" size={28} />
                Vehicle Information
              </h2>
              
              <div className="grid md:grid-cols-3 gap-6 mb-6">
                <div>
                  <label className="block text-metallic-silver mb-2 font-semibold">Year</label>
                  <input
                    type="text"
                    name="year"
                    value={formData.year}
                    onChange={handleChange}
                    placeholder="2020"
                    className="w-full bg-navy-dark border border-electric-blue/30 rounded-lg px-4 py-3 text-metallic-silver focus:border-electric-blue focus:outline-none focus:ring-2 focus:ring-electric-blue/50 transition-all"
                  />
                </div>
                
                <div>
                  <label className="block text-metallic-silver mb-2 font-semibold">Make</label>
                  <input
                    type="text"
                    name="make"
                    value={formData.make}
                    onChange={handleChange}
                    placeholder="Toyota"
                    className="w-full bg-navy-dark border border-electric-blue/30 rounded-lg px-4 py-3 text-metallic-silver focus:border-electric-blue focus:outline-none focus:ring-2 focus:ring-electric-blue/50 transition-all"
                  />
                </div>
                
                <div>
                  <label className="block text-metallic-silver mb-2 font-semibold">Model</label>
                  <input
                    type="text"
                    name="model"
                    value={formData.model}
                    onChange={handleChange}
                    placeholder="Camry"
                    className="w-full bg-navy-dark border border-electric-blue/30 rounded-lg px-4 py-3 text-metallic-silver focus:border-electric-blue focus:outline-none focus:ring-2 focus:ring-electric-blue/50 transition-all"
                  />
                </div>
              </div>
              
              <div>
                <label className="block text-metallic-silver mb-2 font-semibold">
                  Vehicle Size <span className="text-bright-cyan">*</span>
                </label>
                <select
                  name="vehicleSize"
                  value={formData.vehicleSize}
                  onChange={handleChange}
                  required
                  className="w-full bg-navy-dark border border-electric-blue/30 rounded-lg px-4 py-3 text-metallic-silver focus:border-electric-blue focus:outline-none focus:ring-2 focus:ring-electric-blue/50 transition-all"
                >
                  <option value="">Select vehicle size</option>
                  <option value="sedan">Sedan</option>
                  <option value="suv">SUV</option>
                  <option value="truck">Truck</option>
                  <option value="van">Van</option>
                </select>
              </div>
            </div>

            <div className="glass-card mb-6 fade-in" style={{ animationDelay: '0.2s' }}>
              <h2 className="text-2xl font-bold metallic-heading mb-6">Service Selection</h2>
              
              <div className="mb-6">
                <label className="block text-metallic-silver mb-3 font-semibold">
                  Select Service <span className="text-bright-cyan">*</span>
                </label>
                <div className="space-y-3">
                  {services.map((service) => (
                    <label
                      key={service.id}
                      className="flex items-center justify-between glass-card cursor-pointer hover:border-bright-cyan transition-all"
                    >
                      <div className="flex items-center">
                        <input
                          type="radio"
                          name="serviceType"
                          value={service.type}
                          onChange={handleChange}
                          required
                          className="mr-3 w-5 h-5 text-electric-blue"
                        />
                        <div>
                          <span className="text-metallic-silver font-medium block">{service.name}</span>
                          <span className="text-light-gray text-sm">{service.description}</span>
                        </div>
                      </div>
                      {formData.vehicleSize && (
                        <span className="text-bright-cyan font-bold">
                          ${service[`base_price_${formData.vehicleSize}`]}
                        </span>
                      )}
                    </label>
                  ))}
                </div>
              </div>
              
              {addOns.length > 0 && (
                <div>
                  <label className="block text-metallic-silver mb-3 font-semibold">
                    Add-Ons (Optional)
                  </label>
                  <div className="grid sm:grid-cols-2 gap-3">
                    {addOns.map((addon) => (
                      <label
                        key={addon.id}
                        className="flex items-center justify-between bg-navy-dark/50 border border-electric-blue/20 rounded-lg px-4 py-3 cursor-pointer hover:border-electric-blue transition-all"
                      >
                        <div className="flex items-center">
                          <input
                            type="checkbox"
                            name="selectedAddOns"
                            value={addon.id}
                            onChange={handleChange}
                            className="mr-3 w-4 h-4 text-electric-blue"
                          />
                          <span className="text-metallic-silver text-sm">{addon.name}</span>
                        </div>
                        <span className="text-bright-cyan text-sm font-bold">${addon.price}</span>
                      </label>
                    ))}
                  </div>
                </div>
              )}

              {formData.serviceType && formData.vehicleSize && (
                <div className="mt-6 pt-6 border-t border-electric-blue/20">
                  <div className="flex justify-between items-center">
                    <span className="text-metallic-silver font-bold text-xl">Estimated Total:</span>
                    <span className="text-bright-cyan font-bold text-3xl">${calculateTotal()}</span>
                  </div>
                  <p className="text-light-gray text-sm mt-2">* Plus applicable taxes</p>
                </div>
              )}
            </div>

            <div className="glass-card mb-6 fade-in" style={{ animationDelay: '0.3s' }}>
              <h2 className="text-2xl font-bold metallic-heading mb-6 flex items-center">
                <Calendar className="text-electric-blue mr-3" size={28} />
                Appointment Details
              </h2>
              
              <div className="grid md:grid-cols-2 gap-6 mb-6">
                <div>
                  <label className="block text-metallic-silver mb-2 font-semibold">
                    Preferred Date <span className="text-bright-cyan">*</span>
                  </label>
                  <input
                    type="date"
                    name="preferredDate"
                    value={formData.preferredDate}
                    onChange={handleChange}
                    required
                    min={new Date().toISOString().split('T')[0]}
                    className="w-full bg-navy-dark border border-electric-blue/30 rounded-lg px-4 py-3 text-metallic-silver focus:border-electric-blue focus:outline-none focus:ring-2 focus:ring-electric-blue/50 transition-all"
                  />
                </div>
                
                <div>
                  <label className="block text-metallic-silver mb-2 font-semibold">
                    Preferred Time <span className="text-bright-cyan">*</span>
                  </label>
                  <select
                    name="preferredTime"
                    value={formData.preferredTime}
                    onChange={handleChange}
                    required
                    className="w-full bg-navy-dark border border-electric-blue/30 rounded-lg px-4 py-3 text-metallic-silver focus:border-electric-blue focus:outline-none focus:ring-2 focus:ring-electric-blue/50 transition-all"
                  >
                    <option value="">Select time</option>
                    <option value="morning">Morning (8AM - 12PM)</option>
                    <option value="afternoon">Afternoon (12PM - 4PM)</option>
                    <option value="evening">Evening (4PM - 7PM)</option>
                  </select>
                </div>
              </div>
              
              <div className="mb-6">
                <label className="block text-metallic-silver mb-2 font-semibold flex items-center">
                  <MapPin className="text-electric-blue mr-2" size={20} />
                  Service Address <span className="text-bright-cyan ml-1">*</span>
                </label>
                <input
                  type="text"
                  name="address"
                  value={formData.address}
                  onChange={handleChange}
                  required
                  placeholder="123 Main St, Elk River, MN 55330"
                  className="w-full bg-navy-dark border border-electric-blue/30 rounded-lg px-4 py-3 text-metallic-silver focus:border-electric-blue focus:outline-none focus:ring-2 focus:ring-electric-blue/50 transition-all"
                />
              </div>
              
              <div>
                <label className="block text-metallic-silver mb-2 font-semibold">
                  Additional Notes
                </label>
                <textarea
                  name="notes"
                  value={formData.notes}
                  onChange={handleChange}
                  rows="4"
                  placeholder="Any specific requests or concerns about your vehicle..."
                  className="w-full bg-navy-dark border border-electric-blue/30 rounded-lg px-4 py-3 text-metallic-silver focus:border-electric-blue focus:outline-none focus:ring-2 focus:ring-electric-blue/50 transition-all resize-none"
                ></textarea>
              </div>
            </div>

            <div className="text-center">
              <button
                type="submit"
                disabled={loading}
                className="btn-primary shine-effect text-xl px-16 py-5 shadow-glow-blue disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Submitting...' : 'Request My Detail'}
              </button>
              <p className="text-light-gray text-sm mt-4">
                We'll contact you within 24 hours to confirm your appointment
              </p>
            </div>
          </form>
        </div>
      </section>
    </div>
  )
}

export default BookNowV2
