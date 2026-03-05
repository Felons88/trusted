import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import { useAuthStore } from '../../store/authStore-emergency'
import { 
  User, Settings, CreditCard, MapPin, Phone, Mail, 
  Save, ArrowLeft, Shield, Bell, LogOut 
} from 'lucide-react'
import ClientNavigation from '../../components/ClientNavigation'
import toast from 'react-hot-toast'

function ClientSettings() {
  const { user, signOut } = useAuthStore()
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)
  const [clientData, setClientData] = useState(null)
  const [activeTab, setActiveTab] = useState('profile')

  const [profileData, setProfileData] = useState({
    full_name: '',
    email: '',
    phone: '',
    address: '',
    city: '',
    state: '',
    zip_code: ''
  })

  const [paymentMethods, setPaymentMethods] = useState([])
  const [newPaymentMethod, setNewPaymentMethod] = useState({
    card_type: '',
    last_four: '',
    expiry_month: '',
    expiry_year: '',
    is_default: false
  })

  useEffect(() => {
    if (user) {
      loadClientData()
    }
  }, [user])

  const loadClientData = async () => {
    try {
      const { data: client } = await supabase
        .from('clients')
        .select('*')
        .eq('user_id', user.id)
        .single()

      if (client) {
        setClientData(client)
        setProfileData({
          full_name: client.full_name || '',
          email: client.email || user.email || '',
          phone: client.phone || '',
          address: client.address || '',
          city: client.city || '',
          state: client.state || '',
          zip_code: client.zip_code || ''
        })

        // Load payment methods
        const { data: payments } = await supabase
          .from('payment_methods')
          .select('*')
          .eq('client_id', client.id)
          .eq('is_active', true)

        setPaymentMethods(payments || [])
      }
    } catch (error) {
      console.error('Error loading client data:', error)
    }
  }

  const handleProfileUpdate = async (e) => {
    e.preventDefault()
    setLoading(true)

    try {
      const { error } = await supabase
        .from('clients')
        .update({
          full_name: profileData.full_name,
          phone: profileData.phone,
          address: profileData.address,
          city: profileData.city,
          state: profileData.state,
          zip_code: profileData.zip_code
        })
        .eq('user_id', user.id)

      if (error) throw error

      toast.success('Profile updated successfully!')
      loadClientData()
    } catch (error) {
      console.error('Error updating profile:', error)
      toast.error('Failed to update profile')
    } finally {
      setLoading(false)
    }
  }

  const handleAddPaymentMethod = async (e) => {
    e.preventDefault()
    if (!clientData) return

    setLoading(true)
    try {
      const { error } = await supabase
        .from('payment_methods')
        .insert({
          client_id: clientData.id,
          card_type: newPaymentMethod.card_type,
          last_four: newPaymentMethod.last_four,
          expiry_month: newPaymentMethod.expiry_month,
          expiry_year: newPaymentMethod.expiry_year,
          is_default: paymentMethods.length === 0 || newPaymentMethod.is_default
        })

      if (error) throw error

      toast.success('Payment method added successfully!')
      setNewPaymentMethod({
        card_type: '',
        last_four: '',
        expiry_month: '',
        expiry_year: '',
        is_default: false
      })
      loadClientData()
    } catch (error) {
      console.error('Error adding payment method:', error)
      toast.error('Failed to add payment method')
    } finally {
      setLoading(false)
    }
  }

  const handleRemovePaymentMethod = async (paymentId) => {
    if (!confirm('Are you sure you want to remove this payment method?')) return

    try {
      const { error } = await supabase
        .from('payment_methods')
        .update({ is_active: false })
        .eq('id', paymentId)

      if (error) throw error

      toast.success('Payment method removed successfully!')
      loadClientData()
    } catch (error) {
      console.error('Error removing payment method:', error)
      toast.error('Failed to remove payment method')
    }
  }

  const handleSignOut = async () => {
    try {
      await signOut()
      navigate('/')
      toast.success('Logged out successfully!')
    } catch (error) {
      toast.error('Failed to log out')
    }
  }

  const tabs = [
    { id: 'profile', label: 'Profile', icon: User },
    { id: 'payment', label: 'Payment Methods', icon: CreditCard },
    { id: 'notifications', label: 'Notifications', icon: Bell },
    { id: 'security', label: 'Security', icon: Shield }
  ]

  return (
    <div className="min-h-screen bg-navy-gradient">
      <ClientNavigation />
      <div className="pt-16 pb-20 px-4">
        <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <Link
            to="/client-portal"
            className="text-light-gray hover:text-electric-blue transition-colors flex items-center mb-4"
          >
            <ArrowLeft size={20} className="mr-2" />
            Back to Dashboard
          </Link>
          <h1 className="text-4xl font-bold metallic-heading mb-2">Settings</h1>
          <p className="text-light-gray">Manage your account settings and preferences</p>
        </div>

        {/* Tab Navigation */}
        <div className="glass-card mb-8">
          <div className="flex flex-wrap gap-2 border-b border-electric-blue/20">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-4 py-3 font-medium transition-colors ${
                  activeTab === tab.id
                    ? 'text-electric-blue border-b-2 border-electric-blue'
                    : 'text-light-gray hover:text-electric-blue'
                }`}
              >
                <tab.icon size={18} />
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Profile Tab */}
        {activeTab === 'profile' && (
          <div className="glass-card">
            <h2 className="text-2xl font-bold metallic-heading mb-6">Profile Information</h2>
            <form onSubmit={handleProfileUpdate} className="space-y-6">
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-metallic-silver mb-2 font-semibold">
                    Full Name
                  </label>
                  <input
                    type="text"
                    value={profileData.full_name}
                    onChange={(e) => setProfileData(prev => ({ ...prev, full_name: e.target.value }))}
                    className="w-full bg-navy-dark border border-electric-blue/30 rounded-lg px-4 py-3 text-metallic-silver focus:border-electric-blue focus:outline-none focus:ring-2 focus:ring-electric-blue/50 transition-all"
                  />
                </div>

                <div>
                  <label className="block text-metallic-silver mb-2 font-semibold">
                    Email Address
                  </label>
                  <input
                    type="email"
                    value={profileData.email}
                    disabled
                    className="w-full bg-navy-dark/50 border border-electric-blue/20 rounded-lg px-4 py-3 text-light-gray cursor-not-allowed"
                  />
                  <p className="text-xs text-light-gray/60 mt-1">Contact support to change email</p>
                </div>

                <div>
                  <label className="block text-metallic-silver mb-2 font-semibold">
                    Phone Number
                  </label>
                  <input
                    type="tel"
                    value={profileData.phone}
                    onChange={(e) => setProfileData(prev => ({ ...prev, phone: e.target.value }))}
                    className="w-full bg-navy-dark border border-electric-blue/30 rounded-lg px-4 py-3 text-metallic-silver focus:border-electric-blue focus:outline-none focus:ring-2 focus:ring-electric-blue/50 transition-all"
                  />
                </div>

                <div>
                  <label className="block text-metallic-silver mb-2 font-semibold">
                    Address
                  </label>
                  <input
                    type="text"
                    value={profileData.address}
                    onChange={(e) => setProfileData(prev => ({ ...prev, address: e.target.value }))}
                    className="w-full bg-navy-dark border border-electric-blue/30 rounded-lg px-4 py-3 text-metallic-silver focus:border-electric-blue focus:outline-none focus:ring-2 focus:ring-electric-blue/50 transition-all"
                  />
                </div>

                <div>
                  <label className="block text-metallic-silver mb-2 font-semibold">
                    City
                  </label>
                  <input
                    type="text"
                    value={profileData.city}
                    onChange={(e) => setProfileData(prev => ({ ...prev, city: e.target.value }))}
                    className="w-full bg-navy-dark border border-electric-blue/30 rounded-lg px-4 py-3 text-metallic-silver focus:border-electric-blue focus:outline-none focus:ring-2 focus:ring-electric-blue/50 transition-all"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-metallic-silver mb-2 font-semibold">
                      State
                    </label>
                    <input
                      type="text"
                      value={profileData.state}
                      onChange={(e) => setProfileData(prev => ({ ...prev, state: e.target.value }))}
                      className="w-full bg-navy-dark border border-electric-blue/30 rounded-lg px-4 py-3 text-metallic-silver focus:border-electric-blue focus:outline-none focus:ring-2 focus:ring-electric-blue/50 transition-all"
                    />
                  </div>
                  <div>
                    <label className="block text-metallic-silver mb-2 font-semibold">
                      ZIP Code
                    </label>
                    <input
                      type="text"
                      value={profileData.zip_code}
                      onChange={(e) => setProfileData(prev => ({ ...prev, zip_code: e.target.value }))}
                      className="w-full bg-navy-dark border border-electric-blue/30 rounded-lg px-4 py-3 text-metallic-silver focus:border-electric-blue focus:outline-none focus:ring-2 focus:ring-electric-blue/50 transition-all"
                    />
                  </div>
                </div>
              </div>

              <div className="flex gap-4">
                <button
                  type="submit"
                  disabled={loading}
                  className="btn-primary shine-effect flex-1 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Save size={20} className="inline mr-2" />
                  {loading ? 'Saving...' : 'Save Changes'}
                </button>
                <button
                  type="button"
                  onClick={loadClientData}
                  className="btn-secondary flex-1"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Payment Methods Tab */}
        {activeTab === 'payment' && (
          <div className="space-y-8">
            <div className="glass-card">
              <h2 className="text-2xl font-bold metallic-heading mb-6">Payment Methods</h2>
              
              {paymentMethods.length === 0 ? (
                <div className="text-center py-8">
                  <CreditCard className="text-light-gray mx-auto mb-4" size={48} />
                  <p className="text-light-gray mb-4">No payment methods saved</p>
                  <p className="text-sm text-light-gray/60 mb-4">Add a payment method to make booking faster</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {paymentMethods.map((payment) => (
                    <div
                      key={payment.id}
                      className="bg-navy-dark/50 border border-electric-blue/20 rounded-lg p-4"
                    >
                      <div className="flex justify-between items-center">
                        <div className="flex items-center">
                          <CreditCard className="text-electric-blue mr-3" size={24} />
                          <div>
                            <p className="font-bold text-metallic-silver capitalize">
                              {payment.card_type} •••• {payment.last_four}
                            </p>
                            <p className="text-sm text-light-gray">
                              Expires {payment.expiry_month}/{payment.expiry_year}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          {payment.is_default && (
                            <span className="px-2 py-1 bg-electric-blue/20 text-electric-blue text-xs rounded-full">
                              Default
                            </span>
                          )}
                          <button
                            onClick={() => handleRemovePaymentMethod(payment.id)}
                            className="text-red-400 hover:text-red-300 transition-colors"
                          >
                            Remove
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="glass-card">
              <h3 className="text-xl font-bold metallic-heading mb-4">Add New Payment Method</h3>
              <form onSubmit={handleAddPaymentMethod} className="space-y-4">
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-metallic-silver mb-2 font-semibold">
                      Card Type
                    </label>
                    <select
                      value={newPaymentMethod.card_type}
                      onChange={(e) => setNewPaymentMethod(prev => ({ ...prev, card_type: e.target.value }))}
                      required
                      className="w-full bg-navy-dark border border-electric-blue/30 rounded-lg px-4 py-3 text-metallic-silver focus:border-electric-blue focus:outline-none focus:ring-2 focus:ring-electric-blue/50 transition-all"
                    >
                      <option value="">Select card type</option>
                      <option value="visa">Visa</option>
                      <option value="mastercard">Mastercard</option>
                      <option value="amex">American Express</option>
                      <option value="discover">Discover</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-metallic-silver mb-2 font-semibold">
                      Card Number
                    </label>
                    <input
                      type="text"
                      value={newPaymentMethod.last_four}
                      onChange={(e) => setNewPaymentMethod(prev => ({ ...prev, last_four: e.target.value.slice(-4) }))}
                      placeholder="•••• •••• •••• 1234"
                      maxLength="4"
                      required
                      className="w-full bg-navy-dark border border-electric-blue/30 rounded-lg px-4 py-3 text-metallic-silver focus:border-electric-blue focus:outline-none focus:ring-2 focus:ring-electric-blue/50 transition-all"
                    />
                  </div>

                  <div>
                    <label className="block text-metallic-silver mb-2 font-semibold">
                      Expiry Month
                    </label>
                    <select
                      value={newPaymentMethod.expiry_month}
                      onChange={(e) => setNewPaymentMethod(prev => ({ ...prev, expiry_month: e.target.value }))}
                      required
                      className="w-full bg-navy-dark border border-electric-blue/30 rounded-lg px-4 py-3 text-metallic-silver focus:border-electric-blue focus:outline-none focus:ring-2 focus:ring-electric-blue/50 transition-all"
                    >
                      <option value="">Month</option>
                      {Array.from({ length: 12 }, (_, i) => (
                        <option key={i + 1} value={String(i + 1).padStart(2, '0')}>
                          {String(i + 1).padStart(2, '0')}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-metallic-silver mb-2 font-semibold">
                      Expiry Year
                    </label>
                    <select
                      value={newPaymentMethod.expiry_year}
                      onChange={(e) => setNewPaymentMethod(prev => ({ ...prev, expiry_year: e.target.value }))}
                      required
                      className="w-full bg-navy-dark border border-electric-blue/30 rounded-lg px-4 py-3 text-metallic-silver focus:border-electric-blue focus:outline-none focus:ring-2 focus:ring-electric-blue/50 transition-all"
                    >
                      <option value="">Year</option>
                      {Array.from({ length: 10 }, (_, i) => (
                        <option key={new Date().getFullYear() + i} value={new Date().getFullYear() + i}>
                          {new Date().getFullYear() + i}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="default"
                    checked={newPaymentMethod.is_default}
                    onChange={(e) => setNewPaymentMethod(prev => ({ ...prev, is_default: e.target.checked }))}
                    className="mr-2"
                  />
                  <label htmlFor="default" className="text-metallic-silver">
                    Set as default payment method
                  </label>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="btn-primary shine-effect w-full disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <CreditCard size={20} className="inline mr-2" />
                  {loading ? 'Adding...' : 'Add Payment Method'}
                </button>
              </form>
            </div>
          </div>
        )}

        {/* Notifications Tab */}
        {activeTab === 'notifications' && (
          <div className="glass-card">
            <h2 className="text-2xl font-bold metallic-heading mb-6">Notification Preferences</h2>
            <div className="space-y-4">
              <div className="flex justify-between items-center p-4 bg-navy-dark/50 border border-electric-blue/20 rounded-lg">
                <div>
                  <p className="font-bold text-metallic-silver">Email Notifications</p>
                  <p className="text-sm text-light-gray">Receive booking confirmations and updates</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input type="checkbox" defaultChecked className="sr-only peer" />
                  <div className="w-11 h-6 bg-gray-600 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-electric-blue"></div>
                </label>
              </div>

              <div className="flex justify-between items-center p-4 bg-navy-dark/50 border border-electric-blue/20 rounded-lg">
                <div>
                  <p className="font-bold text-metallic-silver">SMS Notifications</p>
                  <p className="text-sm text-light-gray">Get text messages for appointment reminders</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input type="checkbox" className="sr-only peer" />
                  <div className="w-11 h-6 bg-gray-600 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-electric-blue"></div>
                </label>
              </div>

              <div className="flex justify-between items-center p-4 bg-navy-dark/50 border border-electric-blue/20 rounded-lg">
                <div>
                  <p className="font-bold text-metallic-silver">Promotional Emails</p>
                  <p className="text-sm text-light-gray">Receive special offers and discounts</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input type="checkbox" className="sr-only peer" />
                  <div className="w-11 h-6 bg-gray-600 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-electric-blue"></div>
                </label>
              </div>
            </div>
          </div>
        )}

        {/* Security Tab */}
        {activeTab === 'security' && (
          <div className="space-y-8">
            <div className="glass-card">
              <h2 className="text-2xl font-bold metallic-heading mb-6">Security Settings</h2>
              <div className="space-y-4">
                <button className="w-full bg-electric-blue/20 border border-electric-blue/30 rounded-lg p-4 hover:bg-electric-blue/30 transition-colors text-left">
                  <p className="font-bold text-metallic-silver mb-1">Change Password</p>
                  <p className="text-sm text-light-gray">Update your account password</p>
                </button>

                <button className="w-full bg-electric-blue/20 border border-electric-blue/30 rounded-lg p-4 hover:bg-electric-blue/30 transition-colors text-left">
                  <p className="font-bold text-metallic-silver mb-1">Two-Factor Authentication</p>
                  <p className="text-sm text-light-gray">Add an extra layer of security to your account</p>
                </button>
              </div>
            </div>

            <div className="glass-card">
              <h2 className="text-2xl font-bold metallic-heading mb-6">Danger Zone</h2>
              <div className="space-y-4">
                <button
                  onClick={handleSignOut}
                  className="w-full bg-red-500/20 border border-red-500/30 rounded-lg p-4 hover:bg-red-500/30 transition-colors text-left"
                >
                  <div className="flex items-center">
                    <LogOut className="text-red-400 mr-3" size={20} />
                    <div>
                      <p className="font-bold text-red-400 mb-1">Sign Out</p>
                      <p className="text-sm text-light-gray">Sign out of your account</p>
                    </div>
                  </div>
                </button>
              </div>
            </div>
          </div>
        )}
        </div>
      </div>
    </div>
  )
}

export default ClientSettings
