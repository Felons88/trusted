import { Link } from 'react-router-dom'
import { ArrowRight } from 'lucide-react'

function Gallery() {
  const beforeAfterImages = [
    {
      title: 'Exterior Transformation',
      description: 'Complete paint correction and protection',
    },
    {
      title: 'Interior Deep Clean',
      description: 'Carpet extraction and conditioning',
    },
    {
      title: 'Headlight Restoration',
      description: 'From cloudy to crystal clear',
    },
    {
      title: 'Engine Bay Detail',
      description: 'Professional engine compartment cleaning',
    },
    {
      title: 'Full Detail',
      description: 'Complete interior and exterior service',
    },
    {
      title: 'Leather Restoration',
      description: 'Deep cleaning and conditioning',
    },
  ]

  return (
    <div className="overflow-hidden">
      <section className="relative min-h-[60vh] flex items-center justify-center pt-32 pb-20">
        <div className="absolute inset-0 bg-gradient-to-b from-navy-deep via-navy-dark to-navy-deep opacity-95"></div>
        
        <div className="relative z-10 container mx-auto px-4 text-center fade-in">
          <h1 className="text-5xl md:text-6xl font-bold metallic-heading mb-6 animate-shine">
            Our <span className="text-electric-blue glow-text">Work</span>
          </h1>
          <p className="text-xl text-light-gray max-w-3xl mx-auto">
            See the dramatic transformations we deliver with every detail
          </p>
        </div>
      </section>

      <section className="py-20 bg-navy-deep">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-6xl mx-auto">
            {beforeAfterImages.map((item, index) => (
              <div
                key={index}
                className="glass-card group cursor-pointer overflow-hidden fade-in"
                style={{ animationDelay: `${index * 0.1}s` }}
              >
                <div className="aspect-video bg-gradient-to-br from-navy-dark to-navy-deep mb-4 rounded-lg overflow-hidden relative">
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="text-center">
                      <div className="text-electric-blue mb-2">Before & After</div>
                      <div className="text-4xl text-bright-cyan">📸</div>
                    </div>
                  </div>
                  <div className="absolute inset-0 bg-electric-blue/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                </div>
                <h3 className="text-xl font-bold metallic-heading mb-2 group-hover:text-electric-blue transition-colors">
                  {item.title}
                </h3>
                <p className="text-light-gray text-sm">{item.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-20 bg-gradient-to-b from-navy-dark to-navy-deep">
        <div className="container mx-auto px-4 text-center">
          <div className="max-w-3xl mx-auto glass-card">
            <h2 className="text-4xl font-bold metallic-heading mb-6">
              Get Results Like This
            </h2>
            <p className="text-lg text-light-gray mb-8">
              Experience the same level of quality and attention to detail for your vehicle
            </p>
            <Link to="/book-now" className="btn-primary shine-effect text-lg px-12 py-4 inline-flex items-center">
              Book Your Detail
              <ArrowRight className="ml-2" size={20} />
            </Link>
          </div>
        </div>
      </section>
    </div>
  )
}

export default Gallery
