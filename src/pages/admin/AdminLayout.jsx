import { useState } from 'react'
import { Outlet, Link, useNavigate, useLocation } from 'react-router-dom'
import { useAuthStore } from '../../store/authStore'
import {
  LayoutDashboard, Calendar, Users, Car, Package,
  DollarSign, Mail, FileText, Settings, LogOut,
  Menu, X, MessageSquare, Star,
  Plus, Shield, Activity, TrendingUp
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
    { icon: FileText, label: 'Invoices', path: '/admin/invoices' },
    { icon: Plus, label: 'New Invoice', path: '/admin/invoices/new' },
    { icon: FileText, label: 'Quote Requests', path: '/admin/quote-requests' },
    { icon: MessageSquare, label: 'Messages', path: '/admin/messages' },
    { icon: Star, label: 'Reviews', path: '/admin/reviews' },
    { icon: Settings, label: 'Settings', path: '/admin/settings' },
  ]

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900">
      {/* Header */}
      <div className="bg-white/10 backdrop-blur-md border-b border-white/20">
        <div className="px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-4">
              {/* Mobile Menu Toggle */}
              <button
                onClick={() => setSidebarOpen(!sidebarOpen)}
                className="lg:hidden text-white hover:text-blue-400 transition-colors"
              >
                {sidebarOpen ? <X size={24} /> : <Menu size={24} />}
              </button>
              
              {/* Logo */}
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                  <Shield className="text-white" size={16} />
                </div>
                <div>
                  <h1 className="text-xl font-bold text-white">Trusted Detailing</h1>
                  <p className="text-xs text-slate-400">Management Portal</p>
                </div>
              </div>
            </div>

            {/* User Menu */}
            <div className="flex items-center space-x-4">
              <div className="hidden sm:flex items-center space-x-3">
                <div className="text-right">
                  <p className="text-sm font-medium text-white">{profile?.full_name || 'Manager'}</p>
                  <p className="text-xs text-slate-400">{profile?.email}</p>
                </div>
                <div className="w-8 h-8 bg-gradient-to-br from-green-500 to-emerald-600 rounded-full flex items-center justify-center">
                  <span className="text-white text-xs font-bold">
                    {profile?.full_name?.charAt(0)?.toUpperCase() || 'A'}
                  </span>
                </div>
              </div>
              
              <button
                onClick={handleLogout}
                className="text-white hover:text-red-400 transition-colors flex items-center space-x-2"
              >
                <LogOut size={20} />
                <span className="hidden sm:inline">Logout</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="flex">
        {/* Sidebar */}
        <div className={`fixed lg:static inset-y-0 left-0 z-50 transform transition-transform duration-300 ease-in-out ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}>
          <div className="w-64 bg-white/10 backdrop-blur-md border-r border-white/20 h-full">
            {/* Navigation */}
            <nav className="p-3">
              <ul className="space-y-2">
                {menuItems.map((item, index) => {
                  const isActive = location.pathname === item.path
                  return (
                    <li key={index}>
                      <Link
                        to={item.path}
                        onClick={() => setSidebarOpen(false)}
                        className={`flex items-center space-x-3 px-4 py-3 rounded-lg transition-all duration-200 ${
                          isActive
                            ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg'
                            : 'text-slate-300 hover:bg-white/10 hover:text-white'
                        }`}
                      >
                        <item.icon size={20} />
                        <span className="font-medium">{item.label}</span>
                      </Link>
                    </li>
                  )
                })}
              </ul>
              
              {/* Quick Stats */}
              <div className="mt-4 p-3 bg-gradient-to-br from-blue-600/20 to-purple-600/20 rounded-lg border border-white/10">
                <div className="flex items-center space-x-2 mb-2">
                  <Activity className="text-blue-400" size={16} />
                  <span className="text-white font-semibold text-sm">Quick Stats</span>
                </div>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className="text-white/80">
                    <p className="text-blue-200">Status</p>
                    <p className="text-white font-bold">Active</p>
                  </div>
                  <div className="text-white/80">
                    <p className="text-blue-200">Role</p>
                    <p className="text-white font-bold">Manager</p>
                  </div>
                  <div className="text-white/80">
                    <p className="text-blue-200">Live</p>
                    <p className="text-white font-bold">Online</p>
                  </div>
                  <div className="text-white/80">
                    <p className="text-blue-200">Date</p>
                    <p className="text-white font-bold">{new Date().toLocaleDateString()}</p>
                  </div>
                </div>
              </div>
            </nav>

            {/* User Account */}
            <div className="absolute bottom-0 left-0 right-0 p-3 border-t border-white/20">
              <button
                onClick={handleLogout}
                className="w-full flex items-center space-x-3 px-4 py-3 text-white/80 hover:text-white hover:bg-white/10 rounded-lg transition-all duration-200"
              >
                <LogOut size={20} />
                <span>Logout</span>
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
        <div className="flex-1 lg:ml-0">
          <div className="min-h-screen">
            {/* Page Header */}
            <div className="bg-white/5 backdrop-blur-md border-b border-white/20">
              <div className="px-3 sm:px-4 lg:px-6 py-3">
                <div className="flex items-center justify-between">
                  <div>
                    <h1 className="text-2xl font-bold text-white capitalize">
                      {menuItems.find(item => location.pathname === item.path)?.label || 'Dashboard'}
                    </h1>
                  </div>
                </div>
              </div>
            </div>

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
