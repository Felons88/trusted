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
  const [sidebarOpen, setSidebarOpen] = useState(true)
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
      <aside
        className={`fixed lg:sticky top-0 h-screen bg-navy-deep/95 backdrop-blur-md border-r border-electric-blue/20 transition-all duration-300 z-50 ${
          sidebarOpen ? 'w-64' : 'w-20'
        }`}
      >
        <div className="p-4 border-b border-electric-blue/20">
          <div className="flex items-center justify-between">
            {sidebarOpen && (
              <h2 className="text-xl font-bold text-electric-blue">Admin Panel</h2>
            )}
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="text-metallic-silver hover:text-electric-blue transition-colors"
            >
              {sidebarOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </div>

        <nav className="p-4 space-y-2">
          {menuItems.map((item) => {
            const isActive = location.pathname === item.path
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`flex items-center space-x-3 px-4 py-3 rounded-lg transition-all ${
                  isActive
                    ? 'bg-electric-blue/20 text-electric-blue border border-electric-blue/30'
                    : 'text-light-gray hover:bg-electric-blue/10 hover:text-electric-blue'
                }`}
              >
                <item.icon size={20} />
                {sidebarOpen && <span className="font-medium">{item.label}</span>}
              </Link>
            )
          })}
        </nav>

        <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-electric-blue/20">
          <button
            onClick={handleLogout}
            className="flex items-center space-x-3 px-4 py-3 rounded-lg text-light-gray hover:bg-red-500/10 hover:text-red-400 transition-all w-full"
          >
            <LogOut size={20} />
            {sidebarOpen && <span className="font-medium">Logout</span>}
          </button>
        </div>
      </aside>

      <main className="flex-1 p-8 overflow-auto">
        <div className="max-w-7xl mx-auto">
          <Outlet />
        </div>
      </main>
    </div>
  )
}

export default AdminLayout
