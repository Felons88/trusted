import { Link } from 'react-router-dom'
import { MapPin, Check } from 'lucide-react'

function ServiceArea() {
  const locations = [
    { name: 'Elk River', primary: true },
    { name: 'Otsego' },
    { name: 'Rogers' },
    { name: 'Zimmerman' },
    { name: 'Big Lake' },
    { name: 'Princeton' },
    { name: 'Monticello' },
  ]

  return (
    <div className="overflow-hidden">
      <section className="relative min-h-[60vh] flex items-center justify-center pt-32 pb-20">
        <div className="absolute inset-0 bg-gradient-to-b from-navy-deep via-navy-dark to-navy-deep opacity-95"></div>
        
        <div className="relative z-10 container mx-auto px-4 text-center fade-in">
          <h1 className="text-5xl md:text-6xl font-bold metallic-heading mb-6 animate-shine">
            Service <span className="text-electric-blue glow-text">Area</span>
          </h1>
          <p className="text-xl text-light-gray max-w-3xl mx-auto">
            Serving Elk River & Surrounding Areas
          </p>
        </div>
      </section>

      <section className="py-20 bg-navy-deep">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-4xl font-bold metallic-heading text-center mb-12">
              We Proudly Serve
            </h2>
            
            <div className="grid md:grid-cols-2 gap-6 mb-12">
              {locations.map((location, index) => (
                <div
                  key={index}
                  className={`glass-card flex items-center fade-in ${
                    location.primary ? 'border-bright-cyan shadow-glow-blue' : ''
                  }`}
                  style={{ animationDelay: `${index * 0.1}s` }}
                >
                  <div className="bg-electric-blue/20 p-3 rounded-full mr-4">
                    {location.primary ? (
                      <MapPin className="text-bright-cyan" size={28} />
                    ) : (
                      <Check className="text-electric-blue" size={28} />
                    )}
                  </div>
                  <div>
                    <h3 className="text-2xl font-bold metallic-heading">{location.name}</h3>
                    {location.primary && (
                      <p className="text-electric-blue text-sm">Primary Service Area</p>
                    )}
                  </div>
                </div>
              ))}
            </div>

            <div className="glass-card text-center">
              <h3 className="text-2xl font-bold metallic-heading mb-4">
                Don't See Your Area?
              </h3>
              <p className="text-light-gray mb-6">
                We may still be able to service your location. Contact us to check if we can accommodate your area.
              </p>
              <Link to="/contact" className="btn-secondary inline-block">
                Contact Us
              </Link>
            </div>
          </div>
        </div>
      </section>

      <section className="py-20 bg-gradient-to-b from-navy-dark to-navy-deep">
        <div className="container mx-auto px-4">
          <div className="max-w-5xl mx-auto glass-card">
            <div className="aspect-video bg-navy-dark rounded-lg overflow-hidden mb-6 relative">
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="text-center">
                  <MapPin className="text-electric-blue mx-auto mb-4" size={64} />
                  <p className="text-metallic-silver text-lg">Interactive Map</p>
                  <p className="text-light-gray text-sm">Elk River & Surrounding Areas</p>
                </div>
              </div>
            </div>
            
            <div className="text-center">
              <h3 className="text-3xl font-bold metallic-heading mb-4">
                Mobile Detailing That Comes To You
              </h3>
              <p className="text-light-gray mb-6">
                No need to travel or wait at a shop. We bring professional detailing directly to your home or workplace.
              </p>
              <Link to="/book-now" className="btn-primary shine-effect text-lg px-12 py-4">
                Schedule Your Service
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}

export default ServiceArea
