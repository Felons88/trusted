import { useState } from 'react'
import { Outlet, Link, useNavigate, useLocation } from 'react-router-dom'
import { useAuthStore } from '../../store/authStore'
import {
  LayoutDashboard, Calendar, Users, Car, Package,
  DollarSign, Mail, FileText, Settings, LogOut,
  Menu, X, MessageSquare, Star
} from 'lucide-react'
import toast from 'react-hot-toast'

function AdminLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const { signOut, profile } = useAuthStore()
  const navigate = useNavigate()
  const location = useLocation()

  // Debug logging
  console.log('AdminLayout: Rendering', {
    profile: profile,
    email: profile?.email,
    role: profile?.role,
    pathname: location.pathname
  })

  const handleLogout = async () => {
    try {
      await signOut()
      toast.success('Logged out successfully')
      navigate('/login')
    } catch (error) {
      toast.error('Error logging out')
    }
  }

  const menuItems = [
    { icon: LayoutDashboard, label: 'Dashboard', path: '/admin' },
    { icon: Calendar, label: 'Bookings', path: '/admin/bookings' },
    { icon: Users, label: 'Clients', path: '/admin/clients' },
    { icon: Car, label: 'Vehicles', path: '/admin/vehicles' },
    { icon: Package, label: 'Services & Add-ons', path: '/admin/services' },
    { icon: DollarSign, label: 'Payments', path: '/admin/payments' },
    { icon: FileText, label: 'Quote Requests', path: '/admin/quote-requests' },
    { icon: MessageSquare, label: 'Messages', path: '/admin/messages' },
    { icon: Star, label: 'Reviews', path: '/admin/reviews' },
    { icon: Settings, label: 'Settings', path: '/admin/settings' },
  ]

  return (
    <div className="min-h-screen bg-navy-gradient flex">
      {/* Mobile Overlay */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed lg:sticky top-0 h-screen bg-navy-deep/95 backdrop-blur-md border-r border-electric-blue/20 transition-all duration-300 z-50 ${
          sidebarOpen ? 'left-0 w-64' : '-left-full lg:left-0 w-20'
        }`}
      >
        <div className="p-4 border-b border-electric-blue/20">
          <div className="flex items-center justify-between">
            {(sidebarOpen || !sidebarOpen) && (
              <h2 className={`text-xl font-bold text-electric-blue transition-all duration-300 ${
                sidebarOpen ? 'opacity-100' : 'lg:opacity-0 lg:w-0'
              }`}>
                Admin Panel
              </h2>
            )}
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="text-metallic-silver hover:text-electric-blue transition-colors flex-shrink-0"
              aria-label="Toggle sidebar"
            >
              {sidebarOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </div>

        <nav className="p-4 space-y-2 overflow-y-auto flex-1">
          {menuItems.map((item) => {
            const isActive = location.pathname === item.path
            return (
              <Link
                key={item.path}
                to={item.path}
                onClick={() => setSidebarOpen(false)}
                className={`flex items-center space-x-3 px-4 py-3 rounded-lg transition-all ${
                  isActive
                    ? 'bg-electric-blue/20 text-electric-blue border border-electric-blue/30'
                    : 'text-light-gray hover:bg-electric-blue/10 hover:text-electric-blue'
                }`}
                title={!sidebarOpen ? item.label : ''}
              >
                <item.icon size={20} className="flex-shrink-0" />
                <span className={`font-medium transition-all duration-300 ${
                  sidebarOpen ? 'opacity-100 w-auto' : 'lg:opacity-0 lg:w-0 overflow-hidden'
                }`}>
                  {item.label}
                </span>
              </Link>
            )
          })}
        </nav>

        <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-electric-blue/20">
          <button
            onClick={handleLogout}
            className="flex items-center space-x-3 px-4 py-3 rounded-lg text-light-gray hover:bg-red-500/10 hover:text-red-400 transition-all w-full"
            title={!sidebarOpen ? 'Logout' : ''}
          >
            <LogOut size={20} className="flex-shrink-0" />
            <span className={`font-medium transition-all duration-300 ${
              sidebarOpen ? 'opacity-100 w-auto' : 'lg:opacity-0 lg:w-0 overflow-hidden'
            }`}>
              Logout
            </span>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 p-4 sm:p-6 lg:p-8 overflow-auto">
        {/* Mobile Header */}
        <div className="lg:hidden mb-6 flex items-center justify-between">
          <button
            onClick={() => setSidebarOpen(true)}
            className="text-metallic-silver hover:text-electric-blue transition-colors p-2"
            aria-label="Open sidebar"
          >
            <Menu size={24} />
          </button>
          <h1 className="text-xl font-bold text-electric-blue">Admin Panel</h1>
          <div className="w-10"></div> {/* Spacer for centering */}
        </div>

        <div className="max-w-7xl mx-auto">
          <Outlet />
        </div>
      </main>
    </div>
  )
}

export default AdminLayout
