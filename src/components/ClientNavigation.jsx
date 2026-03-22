import { useState, useEffect } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { Menu, X, Car, Calendar, Settings, LogOut, User, Home } from 'lucide-react'
import { useAuthStore } from '../store/authStore-emergency'

function ClientNavigation() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const location = useLocation()
  const navigate = useNavigate()
  const { user, signOut } = useAuthStore()

  const handleSignOut = async () => {
    try {
      await signOut()
      navigate('/')
    } catch (error) {
      console.error('Sign out error:', error)
    }
  }

  const clientNavLinks = [
    { to: '/client-portal', label: 'Dashboard', icon: Home },
    { to: '/client-portal/vehicles', label: 'My Vehicles', icon: Car },
    { to: '/book-now', label: 'Book Service', icon: Calendar },
    { to: '/client-portal/settings', label: 'Settings', icon: Settings },
  ]

  const isActiveLink = (path) => {
    if (path === '/client-portal') {
      return location.pathname === '/client-portal'
    }
    return location.pathname.startsWith(path)
  }

  return (
    <nav className="bg-navy-deep/95 backdrop-blur-sm border-b border-electric-blue/20 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex justify-between items-center h-14 xs:h-16">
          {/* Logo */}
          <Link to="/client-portal" className="flex items-center">
            <Car className="text-electric-blue mr-2" size={24} />
            <span className="text-lg xs:text-xl font-bold metallic-heading">Client Portal</span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-4 lg:space-x-6">
            {clientNavLinks.map((link) => (
              <Link
                key={link.to}
                to={link.to}
                className={`flex items-center gap-2 px-2 lg:px-3 py-2 rounded-lg text-xs sm:text-sm font-medium transition-all duration-300 ${
                  isActiveLink(link.to)
                    ? 'bg-electric-blue/20 text-electric-blue'
                    : 'text-light-gray hover:text-electric-blue hover:bg-electric-blue/10'
                }`}
              >
                <link.icon size={14} />
                <span className="hidden lg:inline">{link.label}</span>
                <span className="lg:hidden">{link.label.split(' ')[0]}</span>
              </Link>
            ))}
          </div>

          {/* User Menu */}
          <div className="hidden md:flex items-center gap-2 lg:gap-4">
            <div className="flex items-center gap-2 text-xs sm:text-sm text-light-gray">
              <User size={14} />
              <span className="hidden sm:inline">{user?.email?.split('@')[0] || 'User'}</span>
            </div>
            <button
              onClick={handleSignOut}
              className="flex items-center gap-1 lg:gap-2 px-2 lg:px-3 py-2 text-xs sm:text-sm font-medium text-light-gray hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-all duration-300"
            >
              <LogOut size={14} />
              <span className="hidden lg:inline">Sign Out</span>
            </button>
          </div>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="md:hidden text-light-gray hover:text-electric-blue transition-colors p-1"
            aria-label="Toggle menu"
          >
            {isMobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>

        {/* Mobile Menu */}
        <div className={`md:hidden transition-all duration-300 ease-in-out overflow-hidden ${
          isMobileMenuOpen ? 'max-h-80' : 'max-h-0'
        }`}>
          <div className="py-4 border-t border-electric-blue/20">
            <div className="space-y-1">
              {clientNavLinks.map((link) => (
                <Link
                  key={link.to}
                  to={link.to}
                  onClick={() => setIsMobileMenuOpen(false)}
                  className={`flex items-center gap-3 px-3 py-3 rounded-lg text-sm font-medium transition-all duration-300 ${
                    isActiveLink(link.to)
                      ? 'bg-electric-blue/20 text-electric-blue'
                      : 'text-light-gray hover:text-electric-blue hover:bg-electric-blue/10'
                  }`}
                >
                  <link.icon size={18} />
                  {link.label}
                </Link>
              ))}
            </div>

            <div className="mt-4 pt-4 border-t border-electric-blue/20 space-y-2">
              <div className="flex items-center gap-2 px-3 py-2 text-sm text-light-gray">
                <User size={16} />
                <span className="truncate">{user?.email || 'User'}</span>
              </div>
              <button
                onClick={handleSignOut}
                className="flex items-center gap-3 w-full px-3 py-3 text-sm font-medium text-red-400 hover:bg-red-500/10 rounded-lg transition-all duration-300"
              >
                <LogOut size={18} />
                Sign Out
              </button>
            </div>
          </div>
        </div>
      </div>
    </nav>
  )
}

export default ClientNavigation
