import { useState, useEffect } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { Menu, X } from 'lucide-react'

function Navigation() {
  const [isScrolled, setIsScrolled] = useState(false)
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const location = useLocation()

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50)
    }
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  const handleServicesClick = (e) => {
    e.preventDefault()
    const servicesSection = document.getElementById('services')
    if (servicesSection) {
      servicesSection.scrollIntoView({ behavior: 'smooth' })
    }
  }

  const navLinks = [
    { to: '/', label: 'Home' },
    { to: '/#services', label: 'Services', onClick: handleServicesClick },
    { to: '/gallery', label: 'Gallery' },
    { to: '/reviews', label: 'Reviews' },
    { to: '/contact', label: 'Contact' },
  ]

  return (
    <nav
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        isScrolled ? 'bg-navy-deep/95 backdrop-blur-md shadow-lg' : 'bg-transparent'
      }`}
    >
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16 xs:h-20">
          <Link to="/" className="flex items-center space-x-2 xs:space-x-3">
            <div className="text-lg xs:text-xl sm:text-2xl font-bold metallic-heading glow-text">
              Trusted Mobile Detailing
            </div>
          </Link>

          <div className="hidden md:flex items-center space-x-4 lg:space-x-8">
            {navLinks.map((link) => (
              <Link
                key={link.to}
                to={link.to}
                onClick={link.onClick}
                className={`text-xs sm:text-sm font-medium transition-all duration-300 hover:text-bright-cyan ${
                  location.pathname === link.to ? 'text-electric-blue' : 'text-light-gray'
                }`}
              >
                {link.label}
              </Link>
            ))}
            <Link to="/quote" className="btn-primary text-xs sm:text-sm px-4 sm:px-6 py-2">
              Get Quote
            </Link>
            <Link to="/client-portal" className="btn-secondary text-xs sm:text-sm px-4 sm:px-6 py-2">
              Customer Portal
            </Link>
          </div>

          <button
            className="md:hidden text-metallic-silver p-1"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            aria-label="Toggle menu"
          >
            {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>

        {/* Mobile Menu */}
        <div className={`md:hidden transition-all duration-300 ease-in-out overflow-hidden ${
          isMobileMenuOpen ? 'max-h-96 pb-6' : 'max-h-0'
        }`}>
          <div className="pt-4 space-y-1">
            {navLinks.map((link) => (
              <Link
                key={link.to}
                to={link.to}
                onClick={(e) => {
                  if (link.onClick) {
                    link.onClick(e)
                  }
                  setIsMobileMenuOpen(false)
                }}
                className={`block py-3 px-4 text-sm font-medium transition-all duration-200 rounded-lg ${
                  location.pathname === link.to 
                    ? 'text-electric-blue bg-electric-blue/10' 
                    : 'text-light-gray hover:text-bright-cyan hover:bg-navy-dark/50'
                }`}
              >
                {link.label}
              </Link>
            ))}
            <Link
              to="/quote"
              className="btn-primary inline-block mt-4 mx-4 text-sm"
              onClick={() => setIsMobileMenuOpen(false)}
            >
              Get Quote
            </Link>
            <Link
              to="/client-portal"
              className="btn-secondary inline-block mt-2 mx-4 text-sm"
              onClick={() => setIsMobileMenuOpen(false)}
            >
              Customer Portal
            </Link>
          </div>
        </div>
      </div>
    </nav>
  )
}

export default Navigation
