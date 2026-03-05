import { useState } from 'react'
import { Calendar, Car, MapPin, CheckCircle } from 'lucide-react'

function BookNow() {
  const [formData, setFormData] = useState({
    fullName: '',
    phone: '',
    email: '',
    year: '',
    make: '',
    model: '',
    vehicleSize: '',
    serviceType: '',
    addOns: [],
    preferredDate: '',
    preferredTime: '',
    address: '',
    notes: '',
  })

  const [isSubmitted, setIsSubmitted] = useState(false)

  const addOnsOptions = [
    { id: 'carpet-extraction', name: 'Carpet Extraction', price: '$50' },
    { id: 'pet-hair', name: 'Pet Hair Removal', price: '$25' },
    { id: 'vinyl-plastics', name: 'Vinyl & Plastics Rejuvenation', price: '$25' },
    { id: 'leather', name: 'Leather Treatment', price: '$25' },
    { id: 'sealant', name: 'Spray Sealant', price: '$20' },
    { id: 'headlight', name: 'Headlight Restoration', price: '$50' },
    { id: 'engine-bay', name: 'Engine Bay Cleaning', price: '$50' },
    { id: 'trim', name: 'Trim Restoration', price: '$25' },
    { id: 'tar-sap', name: 'Tar / Sap Removal', price: '$25' },
  ]

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target
    
    if (type === 'checkbox') {
      setFormData(prev => ({
        ...prev,
        addOns: checked
          ? [...prev.addOns, value]
          : prev.addOns.filter(item => item !== value)
      }))
    } else {
      setFormData(prev => ({ ...prev, [name]: value }))
    }
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    setIsSubmitted(true)
    setTimeout(() => {
      window.scrollTo({ top: 0, behavior: 'smooth' })
    }, 100)
  }

  if (isSubmitted) {
    return (
      <div className="min-h-screen flex items-center justify-center pt-20 pb-20 px-4">
        <div className="max-w-2xl mx-auto text-center fade-in">
          <div className="glass-card border-bright-cyan shadow-glow-cyan">
            <div className="bg-electric-blue/20 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6">
              <CheckCircle className="text-bright-cyan" size={48} />
            </div>
            <h1 className="text-4xl font-bold metallic-heading mb-4">
              Request Received!
            </h1>
            <p className="text-xl text-light-gray mb-6">
              Thank you for choosing Trusted Mobile Detailing. We'll contact you shortly to confirm your appointment.
            </p>
            <div className="bg-navy-dark/50 rounded-lg p-6 mb-6">
              <h3 className="text-lg font-bold metallic-heading mb-3">Next Steps:</h3>
              <ul className="text-left text-light-gray space-y-2">
                <li>✓ We'll call you within 24 hours</li>
                <li>✓ Confirm your preferred date and time</li>
                <li>✓ Discuss any specific requirements</li>
                <li>✓ Provide final pricing and details</li>
              </ul>
            </div>
            <button
              onClick={() => setIsSubmitted(false)}
              className="btn-secondary"
            >
              Submit Another Request
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="overflow-hidden">
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

      <section className="py-12 pb-20 bg-navy-deep">
        <div className="container mx-auto px-4">
          <form onSubmit={handleSubmit} className="max-w-3xl mx-auto">
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
                  <label className="flex items-center glass-card cursor-pointer hover:border-bright-cyan transition-all">
                    <input
                      type="radio"
                      name="serviceType"
                      value="exterior"
                      onChange={handleChange}
                      required
                      className="mr-3 w-5 h-5 text-electric-blue"
                    />
                    <span className="text-metallic-silver font-medium">Exterior Detail</span>
                  </label>
                  
                  <label className="flex items-center glass-card cursor-pointer hover:border-bright-cyan transition-all">
                    <input
                      type="radio"
                      name="serviceType"
                      value="interior"
                      onChange={handleChange}
                      required
                      className="mr-3 w-5 h-5 text-electric-blue"
                    />
                    <span className="text-metallic-silver font-medium">Interior Detail</span>
                  </label>
                  
                  <label className="flex items-center glass-card cursor-pointer hover:border-bright-cyan transition-all">
                    <input
                      type="radio"
                      name="serviceType"
                      value="full"
                      onChange={handleChange}
                      required
                      className="mr-3 w-5 h-5 text-electric-blue"
                    />
                    <span className="text-metallic-silver font-medium">Full Detail (Interior + Exterior)</span>
                  </label>
                </div>
              </div>
              
              <div>
                <label className="block text-metallic-silver mb-3 font-semibold">
                  Add-Ons (Optional)
                </label>
                <div className="grid sm:grid-cols-2 gap-3">
                  {addOnsOptions.map((addon) => (
                    <label
                      key={addon.id}
                      className="flex items-center justify-between bg-navy-dark/50 border border-electric-blue/20 rounded-lg px-4 py-3 cursor-pointer hover:border-electric-blue transition-all"
                    >
                      <div className="flex items-center">
                        <input
                          type="checkbox"
                          name="addOns"
                          value={addon.id}
                          onChange={handleChange}
                          className="mr-3 w-4 h-4 text-electric-blue"
                        />
                        <span className="text-metallic-silver text-sm">{addon.name}</span>
                      </div>
                      <span className="text-bright-cyan text-sm font-bold">{addon.price}</span>
                    </label>
                  ))}
                </div>
              </div>
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
                className="btn-primary shine-effect text-xl px-16 py-5 shadow-glow-blue"
              >
                Request My Detail
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

export default BookNow
