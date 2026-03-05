import { Link } from 'react-router-dom'
import { CheckCircle } from 'lucide-react'

function AddOns() {
  const interiorAddOns = [
    {
      name: 'Carpet Extraction',
      price: '$50',
      description: 'Deep clean carpets and remove embedded dirt and stains',
    },
    {
      name: 'Pet Hair Removal',
      price: '$25',
      description: 'Thorough removal of stubborn pet hair from all surfaces',
    },
    {
      name: 'Vinyl & Plastics Rejuvenation',
      price: '$25',
      description: 'Restore and protect interior plastic and vinyl surfaces',
    },
    {
      name: 'Leather Treatment',
      price: '$25',
      description: 'Clean, condition, and protect leather seats',
    },
  ]

  const exteriorAddOns = [
    {
      name: 'Spray Sealant',
      price: '$20',
      description: 'Enhanced paint protection with extended water beading',
    },
    {
      name: 'Headlight Restoration',
      price: '$50',
      description: 'Restore clarity and brightness to oxidized headlights',
    },
    {
      name: 'Engine Bay Cleaning',
      price: '$50',
      description: 'Professional cleaning and dressing of engine compartment',
    },
    {
      name: 'Trim Restoration',
      price: '$25',
      description: 'Revitalize faded exterior plastic and rubber trim',
    },
    {
      name: 'Tar / Sap Removal',
      price: '$25',
      description: 'Safe removal of tar, sap, and stubborn contaminants',
    },
  ]

  return (
    <div className="overflow-hidden">
      <section className="relative min-h-[60vh] flex items-center justify-center pt-32 pb-20">
        <div className="absolute inset-0 bg-gradient-to-b from-navy-deep via-navy-dark to-navy-deep opacity-95"></div>
        
        <div className="relative z-10 container mx-auto px-4 text-center fade-in">
          <h1 className="text-5xl md:text-6xl font-bold metallic-heading mb-6 animate-shine">
            Premium <span className="text-electric-blue glow-text">Add-Ons</span>
          </h1>
          <p className="text-xl text-light-gray max-w-3xl mx-auto">
            Enhance your detail with specialized services tailored to your vehicle's needs
          </p>
        </div>
      </section>

      <section className="py-20 bg-navy-deep">
        <div className="container mx-auto px-4">
          <h2 className="text-4xl font-bold metallic-heading text-center mb-12">
            Interior Add-Ons
          </h2>
          
          <div className="grid md:grid-cols-2 gap-6 max-w-5xl mx-auto mb-20">
            {interiorAddOns.map((addon, index) => (
              <div
                key={index}
                className="glass-card fade-in hover:scale-105 transition-transform duration-300"
                style={{ animationDelay: `${index * 0.1}s` }}
              >
                <div className="flex justify-between items-start mb-3">
                  <h3 className="text-2xl font-bold metallic-heading">{addon.name}</h3>
                  <span className="text-bright-cyan font-bold text-2xl">{addon.price}</span>
                </div>
                <p className="text-light-gray">{addon.description}</p>
                <div className="mt-4 flex items-center text-electric-blue">
                  <CheckCircle size={20} className="mr-2" />
                  <span className="text-sm">Available as add-on</span>
                </div>
              </div>
            ))}
          </div>

          <h2 className="text-4xl font-bold metallic-heading text-center mb-12">
            Exterior Add-Ons
          </h2>
          
          <div className="grid md:grid-cols-2 gap-6 max-w-5xl mx-auto">
            {exteriorAddOns.map((addon, index) => (
              <div
                key={index}
                className="glass-card fade-in hover:scale-105 transition-transform duration-300"
                style={{ animationDelay: `${index * 0.1}s` }}
              >
                <div className="flex justify-between items-start mb-3">
                  <h3 className="text-2xl font-bold metallic-heading">{addon.name}</h3>
                  <span className="text-bright-cyan font-bold text-2xl">{addon.price}</span>
                </div>
                <p className="text-light-gray">{addon.description}</p>
                <div className="mt-4 flex items-center text-electric-blue">
                  <CheckCircle size={20} className="mr-2" />
                  <span className="text-sm">Available as add-on</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-20 bg-gradient-to-b from-navy-dark to-navy-deep">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-4xl font-bold metallic-heading mb-6">
            Ready to Customize Your Detail?
          </h2>
          <p className="text-lg text-light-gray mb-8 max-w-2xl mx-auto">
            Select your services and add-ons when you book your appointment
          </p>
          <Link to="/book-now" className="btn-primary shine-effect text-lg px-12 py-4">
            Book Now
          </Link>
        </div>
      </section>
    </div>
  )
}

export default AddOns
