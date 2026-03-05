import { Link } from 'react-router-dom'
import { Check, Shield, Sparkles, Droplets, Sun } from 'lucide-react'

function ExteriorDetailing() {
  const included = [
    'Deep wheel & tire cleaning',
    'Bug and road film removal',
    'Safe foam wash treatment',
    'Protective water-beading sealant',
    'Gloss-enhancing finish',
  ]

  const benefits = [
    { icon: Shield, title: 'Protects Paint', description: 'Guards against UV damage and environmental contaminants' },
    { icon: Sparkles, title: 'Restores Shine', description: 'Brings back that showroom-quality gloss' },
    { icon: Droplets, title: 'Improves Longevity', description: 'Extends the life of your vehicle\'s finish' },
    { icon: Sun, title: 'Enhances Resale Value', description: 'Maintains your investment for maximum return' },
  ]

  return (
    <div className="overflow-hidden">
      <section className="relative min-h-[60vh] flex items-center justify-center pt-32 pb-20">
        <div className="absolute inset-0 bg-gradient-to-b from-navy-deep via-navy-dark to-navy-deep opacity-95"></div>
        <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1601362840469-51e4d8d58785?q=80&w=2098')] bg-cover bg-center mix-blend-overlay opacity-20"></div>
        
        <div className="relative z-10 container mx-auto px-4 text-center fade-in">
          <h1 className="text-5xl md:text-6xl font-bold metallic-heading mb-6 animate-shine">
            Exterior <span className="text-electric-blue glow-text">Detailing</span>
          </h1>
          <p className="text-xl text-light-gray max-w-3xl mx-auto">
            Professional exterior restoration that protects and enhances your vehicle's appearance
          </p>
        </div>
      </section>

      <section className="py-20 bg-navy-deep">
        <div className="container mx-auto px-4">
          <h2 className="text-4xl font-bold metallic-heading text-center mb-12">What's Included</h2>
          
          <div className="max-w-3xl mx-auto space-y-4">
            {included.map((item, index) => (
              <div
                key={index}
                className="glass-card flex items-center fade-in"
                style={{ animationDelay: `${index * 0.1}s` }}
              >
                <div className="bg-electric-blue/20 p-3 rounded-full mr-4">
                  <Check className="text-bright-cyan" size={24} />
                </div>
                <p className="text-lg text-metallic-silver">{item}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-20 bg-gradient-to-b from-navy-dark to-navy-deep">
        <div className="container mx-auto px-4">
          <h2 className="text-4xl font-bold metallic-heading text-center mb-12">Benefits</h2>
          
          <div className="grid md:grid-cols-2 gap-8 max-w-5xl mx-auto">
            {benefits.map((benefit, index) => (
              <div
                key={index}
                className="glass-card fade-in"
                style={{ animationDelay: `${index * 0.15}s` }}
              >
                <benefit.icon className="text-electric-blue mb-4" size={48} />
                <h3 className="text-2xl font-bold metallic-heading mb-3">{benefit.title}</h3>
                <p className="text-light-gray">{benefit.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-20 bg-navy-deep">
        <div className="container mx-auto px-4 text-center">
          <div className="max-w-3xl mx-auto glass-card">
            <h2 className="text-4xl font-bold metallic-heading mb-6">
              Protect Your Paint Today
            </h2>
            <p className="text-lg text-light-gray mb-8">
              Give your vehicle the professional care it deserves. Book your exterior detailing service now.
            </p>
            <Link to="/book-now" className="btn-primary shine-effect text-lg px-12 py-4">
              Book Exterior Detail
            </Link>
          </div>
        </div>
      </section>
    </div>
  )
}

export default ExteriorDetailing
