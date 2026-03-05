import { Link } from 'react-router-dom'
import { Check, Wind, Sparkles, Heart, Star } from 'lucide-react'

function InteriorDetailing() {
  const included = [
    'Complete vacuum service',
    'Carpet & fabric deep treatment',
    'Plastic & vinyl cleaning',
    'Interior conditioning',
    'Streak-free glass cleaning',
  ]

  const benefits = [
    { icon: Wind, title: 'Removes Odors', description: 'Eliminates unwanted smells for a fresh cabin experience' },
    { icon: Sparkles, title: 'Restores Surfaces', description: 'Revitalizes all interior materials to like-new condition' },
    { icon: Heart, title: 'Deep Stain Treatment', description: 'Professional-grade removal of tough stains and spots' },
    { icon: Star, title: 'Fresh Like-New Feel', description: 'Experience that brand new car feeling again' },
  ]

  return (
    <div className="overflow-hidden">
      <section className="relative min-h-[60vh] flex items-center justify-center pt-32 pb-20">
        <div className="absolute inset-0 bg-gradient-to-b from-navy-deep via-navy-dark to-navy-deep opacity-95"></div>
        <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1558618666-fcd25c85cd64?q=80&w=2069')] bg-cover bg-center mix-blend-overlay opacity-20"></div>
        
        <div className="relative z-10 container mx-auto px-4 text-center fade-in">
          <h1 className="text-5xl md:text-6xl font-bold metallic-heading mb-6 animate-shine">
            Interior <span className="text-electric-blue glow-text">Detailing</span>
          </h1>
          <p className="text-xl text-light-gray max-w-3xl mx-auto">
            Comprehensive interior cleaning and conditioning for a pristine cabin
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
              Refresh Your Interior Today
            </h2>
            <p className="text-lg text-light-gray mb-8">
              Transform your vehicle's cabin with our professional interior detailing service.
            </p>
            <Link to="/book-now" className="btn-primary shine-effect text-lg px-12 py-4">
              Book Interior Detail
            </Link>
          </div>
        </div>
      </section>
    </div>
  )
}

export default InteriorDetailing
