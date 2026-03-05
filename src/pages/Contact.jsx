import { useState } from 'react'
import { Phone, Mail, Clock, MapPin, Send } from 'lucide-react'

function Contact() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    message: '',
  })
  
  const [isSubmitted, setIsSubmitted] = useState(false)

  const handleChange = (e) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }))
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    setIsSubmitted(true)
    setTimeout(() => {
      setFormData({ name: '', email: '', phone: '', message: '' })
      setIsSubmitted(false)
    }, 3000)
  }

  const contactInfo = [
    {
      icon: Phone,
      title: 'Phone',
      content: '(123) 456-7890',
      link: 'tel:+11234567890',
    },
    {
      icon: Mail,
      title: 'Email',
      content: 'info@trustedmobiledetailing.com',
      link: 'mailto:info@trustedmobiledetailing.com',
    },
    {
      icon: Clock,
      title: 'Business Hours',
      content: 'Mon-Sat: 8AM - 7PM\nSunday: Closed',
    },
    {
      icon: MapPin,
      title: 'Service Area',
      content: 'Elk River, MN\n& Surrounding Areas',
    },
  ]

  return (
    <div className="overflow-hidden">
      <section className="relative min-h-[60vh] flex items-center justify-center pt-32 pb-20">
        <div className="absolute inset-0 bg-gradient-to-b from-navy-deep via-navy-dark to-navy-deep opacity-95"></div>
        
        <div className="relative z-10 container mx-auto px-4 text-center fade-in">
          <h1 className="text-5xl md:text-6xl font-bold metallic-heading mb-6 animate-shine">
            Contact <span className="text-electric-blue glow-text">Us</span>
          </h1>
          <p className="text-xl text-light-gray max-w-3xl mx-auto">
            Have questions? We're here to help. Reach out and we'll get back to you shortly.
          </p>
        </div>
      </section>

      <section className="py-20 bg-navy-deep">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-16">
            {contactInfo.map((info, index) => (
              <div
                key={index}
                className="glass-card text-center fade-in hover:scale-105 transition-transform duration-300"
                style={{ animationDelay: `${index * 0.1}s` }}
              >
                <div className="bg-electric-blue/20 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                  <info.icon className="text-electric-blue" size={32} />
                </div>
                <h3 className="text-lg font-bold metallic-heading mb-2">{info.title}</h3>
                {info.link ? (
                  <a
                    href={info.link}
                    className="text-light-gray hover:text-bright-cyan transition-colors whitespace-pre-line"
                  >
                    {info.content}
                  </a>
                ) : (
                  <p className="text-light-gray whitespace-pre-line">{info.content}</p>
                )}
              </div>
            ))}
          </div>

          <div className="max-w-4xl mx-auto">
            <div className="grid lg:grid-cols-2 gap-8">
              <div className="glass-card fade-in">
                <h2 className="text-3xl font-bold metallic-heading mb-6">Send Us A Message</h2>
                
                {isSubmitted && (
                  <div className="bg-electric-blue/20 border border-bright-cyan rounded-lg p-4 mb-6 fade-in">
                    <p className="text-bright-cyan font-semibold">
                      ✓ Message sent successfully! We'll get back to you soon.
                    </p>
                  </div>
                )}
                
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <label className="block text-metallic-silver mb-2 font-semibold">
                      Name <span className="text-bright-cyan">*</span>
                    </label>
                    <input
                      type="text"
                      name="name"
                      value={formData.name}
                      onChange={handleChange}
                      required
                      className="w-full bg-navy-dark border border-electric-blue/30 rounded-lg px-4 py-3 text-metallic-silver focus:border-electric-blue focus:outline-none focus:ring-2 focus:ring-electric-blue/50 transition-all"
                    />
                  </div>
                  
                  <div>
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
                  
                  <div>
                    <label className="block text-metallic-silver mb-2 font-semibold">
                      Phone
                    </label>
                    <input
                      type="tel"
                      name="phone"
                      value={formData.phone}
                      onChange={handleChange}
                      className="w-full bg-navy-dark border border-electric-blue/30 rounded-lg px-4 py-3 text-metallic-silver focus:border-electric-blue focus:outline-none focus:ring-2 focus:ring-electric-blue/50 transition-all"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-metallic-silver mb-2 font-semibold">
                      Message <span className="text-bright-cyan">*</span>
                    </label>
                    <textarea
                      name="message"
                      value={formData.message}
                      onChange={handleChange}
                      required
                      rows="5"
                      className="w-full bg-navy-dark border border-electric-blue/30 rounded-lg px-4 py-3 text-metallic-silver focus:border-electric-blue focus:outline-none focus:ring-2 focus:ring-electric-blue/50 transition-all resize-none"
                    ></textarea>
                  </div>
                  
                  <button
                    type="submit"
                    className="btn-primary w-full shine-effect flex items-center justify-center"
                  >
                    <Send className="mr-2" size={20} />
                    Send Message
                  </button>
                </form>
              </div>

              <div className="fade-in" style={{ animationDelay: '0.2s' }}>
                <div className="glass-card h-full">
                  <h2 className="text-3xl font-bold metallic-heading mb-6">Visit Our Area</h2>
                  
                  <div className="aspect-square bg-navy-dark rounded-lg overflow-hidden mb-6 relative">
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="text-center">
                        <MapPin className="text-electric-blue mx-auto mb-4" size={64} />
                        <p className="text-metallic-silver text-lg">Service Area Map</p>
                        <p className="text-light-gray text-sm">Elk River & Surrounding Cities</p>
                      </div>
                    </div>
                  </div>
                  
                  <div className="space-y-4">
                    <p className="text-light-gray">
                      We're proud to serve Elk River and the surrounding communities with premium mobile auto detailing services.
                    </p>
                    <p className="text-light-gray">
                      Our mobile service means you don't have to go anywhere - we bring professional detailing directly to your location.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}

export default Contact
