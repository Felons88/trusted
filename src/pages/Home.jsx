import { Link } from 'react-router-dom'
import { useState, useEffect } from 'react'
import { Sparkles, Shield, Star, Droplets, Wind, Wrench } from 'lucide-react'
import { supabase } from '../lib/supabase'

function Home() {
  const [addOns, setAddOns] = useState([])
  const [services, setServices] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      const [addOnsResult, servicesResult] = await Promise.all([
        supabase
          .from('add_ons')
          .select('*')
          .eq('is_active', true)
          .order('category', { ascending: true }),
        supabase
          .from('services')
          .select('*')
          .eq('is_active', true)
          .order('type', { ascending: true })
      ])

      if (addOnsResult.error) throw addOnsResult.error
      if (servicesResult.error) throw servicesResult.error

      setAddOns(addOnsResult.data || [])
      setServices(servicesResult.data || [])
    } catch (error) {
      console.error('Error loading data:', error)
      // Fallback to hardcoded data if database fails
      setAddOns([
        { category: 'Interior', name: 'Carpet Extraction', price: 50 },
        { category: 'Interior', name: 'Pet Hair Removal', price: 25 },
        { category: 'Interior', name: 'Vinyl & Plastics Rejuvenation', price: 25 },
        { category: 'Interior', name: 'Leather Treatment', price: 25 },
        { category: 'Exterior', name: 'Spray Sealant', price: 20 },
        { category: 'Exterior', name: 'Headlight Restoration', price: 50 },
        { category: 'Exterior', name: 'Engine Bay Cleaning', price: 50 },
        { category: 'Exterior', name: 'Trim Restoration', price: 25 },
        { category: 'Exterior', name: 'Tar / Sap Removal', price: 25 },
      ])
      setServices([
        { type: 'exterior', name: 'Exterior Detailing', description: 'Complete exterior restoration including deep cleaning, paint protection, and shine enhancement.' },
        { type: 'interior', name: 'Interior Detailing', description: 'Comprehensive interior cleaning and conditioning. Remove stains, odors, and restore that like-new feeling.' },
      ])
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="overflow-hidden">
      <section className="relative min-h-screen flex items-center justify-center pt-20">
        <div className="absolute inset-0 bg-gradient-to-b from-navy-deep via-navy-dark to-navy-deep opacity-95"></div>
        <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1619405399517-d7fce0f13302?q=80&w=2070')] bg-cover bg-center mix-blend-overlay opacity-20"></div>
        
        <div className="relative z-10 container mx-auto px-4 text-center fade-in">
          <h1 className="text-5xl md:text-7xl font-bold metallic-heading mb-6 animate-shine">
            Trusted Mobile Detailing in <span className="text-electric-blue glow-text">Elk River, MN</span>
          </h1>
          <p className="text-xl md:text-2xl text-light-gray mb-8 max-w-3xl mx-auto">
            Professional Interior & Exterior Auto Detailing — We Come To You
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link to="/book-now" className="btn-primary text-lg px-10 py-4">
              Book Now
            </Link>
            <Link to="/reviews" className="btn-secondary text-lg px-10 py-4">
              View Reviews
            </Link>
          </div>
        </div>

        <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-navy-deep to-transparent"></div>
      </section>

      <section className="py-20 bg-navy-deep">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-3 gap-8">
            <div className="glass-card text-center fade-in">
              <div className="flex justify-center mb-4">
                <Sparkles className="text-electric-blue" size={48} />
              </div>
              <h3 className="text-2xl font-bold metallic-heading mb-3">Mobile Convenience</h3>
              <p className="text-light-gray">
                We bring professional detailing directly to your location. No need to disrupt your day.
              </p>
            </div>

            <div className="glass-card text-center fade-in" style={{ animationDelay: '0.2s' }}>
              <div className="flex justify-center mb-4">
                <Shield className="text-electric-blue" size={48} />
              </div>
              <h3 className="text-2xl font-bold metallic-heading mb-3">Professional-Grade Products</h3>
              <p className="text-light-gray">
                Premium products and techniques that deliver showroom results every time.
              </p>
            </div>

            <div className="glass-card text-center fade-in" style={{ animationDelay: '0.4s' }}>
              <div className="flex justify-center mb-4">
                <Star className="text-electric-blue" size={48} />
              </div>
              <h3 className="text-2xl font-bold metallic-heading mb-3">Attention to Detail</h3>
              <p className="text-light-gray">
                Meticulous care for every surface, ensuring your vehicle looks its absolute best.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section id="services" className="py-20 bg-gradient-to-b from-navy-deep to-navy-dark">
        <div className="container mx-auto px-4">
          <h2 className="text-4xl md:text-5xl font-bold metallic-heading text-center mb-12">
            Our Services
          </h2>
          
          <div className="grid md:grid-cols-2 gap-8 max-w-5xl mx-auto">
            {loading ? (
              // Loading skeleton for services
              Array.from({ length: 2 }).map((_, index) => (
                <div key={index} className="glass-card animate-pulse">
                  <div className="h-10 bg-gray-600 rounded mb-4"></div>
                  <div className="h-4 bg-gray-600 rounded mb-6"></div>
                  <div className="h-8 bg-gray-600 rounded w-32"></div>
                </div>
              ))
            ) : (
              services.map((service, index) => (
                <div 
                  key={service.id || index} 
                  className="glass-card group cursor-pointer fade-in"
                  style={{ animationDelay: `${index * 0.2}s` }}
                >
                  <div className="flex items-center mb-4">
                    {service.type === 'exterior' ? (
                      <Droplets className="text-electric-blue mr-3" size={40} />
                    ) : (
                      <Wind className="text-electric-blue mr-3" size={40} />
                    )}
                    <h3 className="text-3xl font-bold metallic-heading">{service.name}</h3>
                  </div>
                  <p className="text-light-gray mb-6">
                    {service.description}
                  </p>
                  <Link to={`/book-now?service=${service.type}`} className="btn-secondary inline-block">
                    Book Now
                  </Link>
                </div>
              ))
            )}
        </div>
      </section>

      <section className="py-20 bg-navy-deep">
        <div className="container mx-auto px-4">
          <h2 className="text-4xl md:text-5xl font-bold metallic-heading text-center mb-4">
            Premium Add-Ons
          </h2>
          <p className="text-light-gray text-center mb-12 text-lg">
            Enhance your detail with these specialized services
          </p>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
            {loading ? (
              // Loading skeleton
              Array.from({ length: 6 }).map((_, index) => (
                <div key={index} className="glass-card animate-pulse">
                  <div className="h-4 bg-gray-600 rounded mb-2"></div>
                  <div className="h-3 bg-gray-600 rounded w-1/2"></div>
                </div>
              ))
            ) : (
              addOns.map((addon, index) => (
                <div
                  key={addon.id || index}
                  className="glass-card group hover:scale-105 transition-transform duration-300 fade-in"
                  style={{ animationDelay: `${index * 0.1}s` }}
                >
                  <div className="flex justify-between items-start mb-2">
                    <h4 className="text-lg font-bold text-metallic-silver group-hover:text-electric-blue transition-colors">
                      {addon.name}
                    </h4>
                    <span className="text-bright-cyan font-bold text-xl">
                      ${typeof addon.price === 'number' ? addon.price.toFixed(2) : addon.price}
                    </span>
                  </div>
                  <p className="text-light-gray text-sm mb-3">{addon.description}</p>
                  <div className="text-xs text-electric-blue font-semibold uppercase tracking-wide">
                    {addon.category}
                  </div>
                </div>
              ))
            )}
          </div>

          <div className="text-center mt-12">
            <Link to="/add-ons" className="btn-primary shine-effect text-lg px-10 py-4">
              View All Add-Ons
            </Link>
          </div>
        </div>
      </section>

      <section className="py-20 bg-gradient-to-b from-navy-dark to-navy-deep">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-4xl md:text-5xl font-bold metallic-heading mb-6">
            Ready to Transform Your Vehicle?
          </h2>
          <p className="text-xl text-light-gray mb-8 max-w-2xl mx-auto">
            Experience the difference professional mobile detailing makes. Book your appointment today.
          </p>
          <Link to="/book-now" className="btn-primary text-lg px-12 py-4">
            Get Started
          </Link>
        </div>
      </section>
    </div>
  )
}

export default Home
