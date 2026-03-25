import { useState } from 'react'
import { Outlet, Link, useNavigate, useLocation } from 'react-router-dom'
import { useAuthStore } from '../../store/authStore'
import {
  LayoutDashboard, Calendar, Users, Car, Package,
  DollarSign, Mail, FileText, Settings, LogOut,
  Menu, X, MessageSquare, Star,
  Plus, Shield, Activity, TrendingUp, Tag
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
    { icon: Tag, label: 'Discount Codes', path: '/admin/discount-codes' },
    { icon: DollarSign, label: 'Payments', path: '/admin/payments' },
    { icon: FileText, label: 'Invoices', path: '/admin/invoices' },
    { icon: Plus, label: 'New Invoice', path: '/admin/invoices/new' },
    { icon: FileText, label: 'Quote Requests', path: '/admin/quote-requests' },
    { icon: MessageSquare, label: 'Messages', path: '/admin/messages' },
    { icon: Star, label: 'Reviews', path: '/admin/reviews' },
    { icon: TrendingUp, label: 'Analytics', path: '/admin/analytics' },
    { icon: Settings, label: 'Settings', path: '/admin/settings' },
  ]

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900">
      {/* Floating Mobile Menu Button */}
      <button
        onClick={() => setSidebarOpen(true)}
        className="lg:hidden fixed top-4 left-4 z-40 p-3 bg-electric-blue hover:bg-electric-blue/90 rounded-lg text-white shadow-lg transition-colors"
      >
        <Menu size={20} />
      </button>

      <div className="flex">
        {/* Sidebar */}
        <div className={`fixed inset-y-0 left-0 z-50 transform transition-transform duration-300 ease-in-out ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}>
          <div className="w-64 sm:w-72 lg:w-64 bg-white/10 backdrop-blur-md border-r border-white/20 h-screen overflow-hidden flex flex-col">
            {/* Mobile Menu Toggle - Top of sidebar */}
            <div className="lg:hidden p-3 border-b border-white/10">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <div className="w-6 h-6 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                    <Shield className="text-white" size={12} />
                  </div>
                  <span className="text-white font-bold text-sm">Admin</span>
                </div>
                <button
                  onClick={() => setSidebarOpen(!sidebarOpen)}
                  className="text-white hover:text-blue-400 transition-colors p-1"
                >
                  <X size={20} />
                </button>
              </div>
            </div>
            
            {/* Navigation */}
            <nav className="flex-1 p-2 sm:p-3 overflow-y-auto">
              <ul className="space-y-1 sm:space-y-2 pb-4">
                {menuItems.map((item, index) => {
                  const isActive = location.pathname === item.path
                  return (
                    <li key={index}>
                      <Link
                        to={item.path}
                        onClick={() => setSidebarOpen(false)}
                        className={`flex items-center space-x-2 sm:space-x-3 px-3 sm:px-4 py-2 sm:py-3 rounded-lg transition-all duration-200 ${
                          isActive
                            ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg'
                            : 'text-slate-300 hover:bg-white/10 hover:text-white'
                        }`}
                      >
                        <item.icon size={16} sm:size={20} />
                        <span className="font-medium text-sm sm:text-base">{item.label}</span>
                      </Link>
                    </li>
                  )
                })}
              </ul>
            </nav>

            {/* Quick Stats - Fixed at bottom */}
            <div className="p-2 sm:p-3 bg-gradient-to-br from-blue-600/20 to-purple-600/20 border-t border-white/10">
              <div className="flex items-center space-x-2 mb-2">
                <Activity className="text-blue-400" size={14} sm:size={16} />
                <span className="text-white font-semibold text-xs sm:text-sm">Quick Stats</span>
              </div>
              <div className="grid grid-cols-2 gap-2 text-xs mb-3">
                <div className="text-white/80">
                  <p className="text-blue-200 text-xs">Status</p>
                  <p className="text-white font-bold text-xs">Active</p>
                </div>
                <div className="text-white/80">
                  <p className="text-blue-200 text-xs">Role</p>
                  <p className="text-white font-bold text-xs">Admin</p>
                </div>
              </div>
              
              {/* Logout Button */}
              <button
                onClick={handleLogout}
                className="w-full flex items-center justify-center space-x-2 px-3 py-2 bg-red-500/20 hover:bg-red-500/30 border border-red-500/30 rounded-lg transition-all duration-200 group"
              >
                <LogOut size={16} className="text-red-400 group-hover:text-red-300" />
                <span className="text-red-400 group-hover:text-red-300 font-medium text-sm">Logout</span>
              </button>
            </div>
          </div>
        </div>

        {/* Overlay for mobile */}
        {sidebarOpen && (
          <div
            className="fixed inset-0 bg-black/50 z-40 lg:hidden"
            onClick={() => setSidebarOpen(false)}
          />
        )}

        {/* Main Content */}
        <div className="flex-1 lg:ml-64 min-w-0">
          <div className="min-h-screen">
            {/* Page Content */}
            <main className="p-3 sm:p-4 lg:p-6">
              <Outlet />
            </main>
          </div>
        </div>
      </div>
    </div>
  )
}

export default AdminLayout
