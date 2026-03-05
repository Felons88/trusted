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
        <div className="flex items-center justify-between h-20">
          <Link to="/" className="flex items-center space-x-3">
            <div className="text-2xl font-bold metallic-heading glow-text">
              Trusted Mobile Detailing
            </div>
          </Link>

          <div className="hidden lg:flex items-center space-x-8">
            {navLinks.map((link) => (
              <Link
                key={link.to}
                to={link.to}
                onClick={link.onClick}
                className={`text-sm font-medium transition-all duration-300 hover:text-bright-cyan ${
                  location.pathname === link.to ? 'text-electric-blue' : 'text-light-gray'
                }`}
              >
                {link.label}
              </Link>
            ))}
            <Link to="/quote" className="btn-primary">
              Get Quote
            </Link>
          </div>

          <button
            className="lg:hidden text-metallic-silver"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          >
            {isMobileMenuOpen ? <X size={28} /> : <Menu size={28} />}
          </button>
        </div>

        {isMobileMenuOpen && (
          <div className="lg:hidden pb-6 fade-in">
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
                className={`block py-3 text-sm font-medium transition-colors ${
                  location.pathname === link.to ? 'text-electric-blue' : 'text-light-gray'
                } hover:text-bright-cyan`}
              >
                {link.label}
              </Link>
            ))}
            <Link
              to="/quote"
              className="btn-primary inline-block mt-4"
              onClick={() => setIsMobileMenuOpen(false)}
            >
              Get Quote
            </Link>
          </div>
        )}
      </div>
    </nav>
  )
}

export default Navigation
