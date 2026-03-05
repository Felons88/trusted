import { Phone } from 'lucide-react'

function FloatingCallButton() {
  return (
    <a
      href="tel:+11234567890"
      className="fixed bottom-6 right-6 bg-electric-blue text-white p-4 rounded-full shadow-glow-blue hover:bg-bright-cyan hover:shadow-glow-cyan transition-all duration-300 z-40 lg:hidden animate-pulse"
      aria-label="Call Now"
    >
      <Phone size={24} />
    </a>
  )
}

export default FloatingCallButton
