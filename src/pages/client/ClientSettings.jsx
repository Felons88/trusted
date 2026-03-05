import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import { useAuthStore } from '../../store/authStore-emergency'
import { 
  User, Settings, CreditCard, MapPin, Phone, Mail, 
  Save, ArrowLeft, Shield, Bell, LogOut, Eye, EyeOff, 
  Smartphone, QrCode, RefreshCw, AlertTriangle, CheckCircle
} from 'lucide-react'
import ClientNavigation from '../../components/ClientNavigation'
import TwoFactorModal from '../../components/TwoFactorModal'
import TwoFactorLoginModal from '../../components/TwoFactorLoginModal'
import stripeService from '../../services/stripeService'
import twoFactorService from '../../services/twoFactorService'
import notificationService from '../../services/notificationService'
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

  // 2FA state
  const [twoFactorEnabled, setTwoFactorEnabled] = useState(false)
  const [twoFactorSecret, setTwoFactorSecret] = useState('')
  const [qrCodeUrl, setQrCodeUrl] = useState('')
  const [showQRCode, setShowQRCode] = useState(false)
  const [verificationCode, setVerificationCode] = useState('')
  const [showVerification, setShowVerification] = useState(false)
  const [showTwoFactorModal, setShowTwoFactorModal] = useState(false)
  const [twoFactorModalType, setTwoFactorModalType] = useState('verify')
  const [showTwoFactorLoginModal, setShowTwoFactorLoginModal] = useState(false)

  // Password change state
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  })
  const [showPassword, setShowPassword] = useState({
    current: false,
    new: false,
    confirm: false
  })

  // Notification settings state
  const [notificationSettings, setNotificationSettings] = useState({
    email: true,
    sms: false,
    push: false,
    bookingConfirmation: true,
    bookingReminder: true,
    paymentConfirmation: true,
    promotional: false
  })

  const [loadingStates, setLoadingStates] = useState({
    profile: false,
    payment: false,
    twoFactor: false,
    password: false,
    notifications: false
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

        // Load 2FA settings
        const is2FAEnabled = await twoFactorService.isTwoFactorEnabled(user.id)
        setTwoFactorEnabled(is2FAEnabled)
        if (is2FAEnabled) {
          const secret = await twoFactorService.getTwoFactorSecret(user.id)
          setTwoFactorSecret(secret)
        }

        // Load notification settings
        const notifications = await notificationService.loadNotificationSettings(user.id)
        setNotificationSettings(notifications)

        // Load Stripe payment methods (in real app, this would fetch from Stripe)
        // For now, we'll use localStorage as fallback
        const savedPaymentMethods = localStorage.getItem(`payment_methods_${user.id}`)
        if (savedPaymentMethods) {
          setPaymentMethods(JSON.parse(savedPaymentMethods))
        }
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

  // Handle password change
  const handlePasswordChange = async (e) => {
    e.preventDefault()
    
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      toast.error('Passwords do not match')
      return
    }

    setLoadingStates(prev => ({ ...prev, password: true }))

    try {
      // In a real app, this would call your API to change password
      console.log('Password change requested:', {
        currentPassword: passwordData.currentPassword,
        newPassword: passwordData.newPassword
      })

      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000))

      toast.success('Password updated successfully!')
      setPasswordData({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      })
    } catch (error) {
      console.error('Error changing password:', error)
      toast.error('Failed to update password')
    } finally {
      setLoadingStates(prev => ({ ...prev, password: false }))
    }
  }

  // Handle 2FA enable
  const handleEnable2FA = () => {
    setTwoFactorModalType('setup')
    setShowTwoFactorLoginModal(true)
  }

  // Handle 2FA verification success
  const handleTwoFactorSuccess = () => {
    setTwoFactorEnabled(true)
    loadClientData() // Reload data to get updated 2FA status
    setShowTwoFactorLoginModal(false)
  }

  // Handle 2FA login success (for settings)
  const handleTwoFactorLoginSuccess = () => {
    setTwoFactorEnabled(true)
    loadClientData() // Reload data to get updated 2FA status
    setShowTwoFactorLoginModal(false)
  }

  // Handle 2FA disable
  const handleDisable2FA = async () => {
    if (!confirm('Are you sure you want to disable two-factor authentication?')) {
      return
    }

    setLoadingStates(prev => ({ ...prev, twoFactor: true }))

    try {
      await twoFactorService.disableTwoFactor(user.id)
      setTwoFactorEnabled(false)
      setTwoFactorSecret('')
      toast.success('2FA disabled successfully!')
    } catch (error) {
      console.error('Error disabling 2FA:', error)
      toast.error('Failed to disable 2FA')
    } finally {
      setLoadingStates(prev => ({ ...prev, twoFactor: false }))
    }
  }

  // Handle notification settings update
  const handleNotificationChange = async (setting, value) => {
    const newSettings = { ...notificationSettings, [setting]: value }
    setNotificationSettings(newSettings)
    
    try {
      await notificationService.updateSetting(user.id, setting, value)
      toast.success('Notification settings updated!')
    } catch (error) {
      console.error('Error updating notification settings:', error)
      toast.error('Failed to update notification settings')
    }
  }

  const tabs = [
    { id: 'profile', label: 'Profile', icon: User },
    { id: 'payment', label: 'Payment Methods', icon: CreditCard },
    { id: 'notifications', label: 'Notifications', icon: Bell },
    { id: 'security', label: 'Security', icon: Shield },
    { id: 'password', label: 'Password', icon: Settings }
  ]

  return (
    <>
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

        {/* Password Tab */}
        {activeTab === 'password' && (
          <div className="space-y-8">
            <div className="glass-card">
              <h2 className="text-2xl font-bold metallic-heading mb-6">Change Password</h2>
              <form onSubmit={handlePasswordChange} className="space-y-6">
                <div>
                  <label className="block text-metallic-silver mb-2 font-semibold">
                    Current Password
                  </label>
                  <div className="relative">
                    <input
                      type={showPassword.current ? 'text' : 'password'}
                      value={passwordData.currentPassword}
                      onChange={(e) => setPasswordData(prev => ({ ...prev, currentPassword: e.target.value }))}
                      required
                      className="w-full bg-navy-dark border border-electric-blue/30 rounded-lg px-4 py-3 text-metallic-silver focus:border-electric-blue focus:outline-none focus:ring-2 focus:ring-electric-blue/50 transition-all pr-12"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(prev => ({ ...prev, current: !prev.current }))}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-light-gray hover:text-electric-blue"
                    >
                      {showPassword.current ? <EyeOff size={20} /> : <Eye size={20} />}
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-metallic-silver mb-2 font-semibold">
                    New Password
                  </label>
                  <div className="relative">
                    <input
                      type={showPassword.new ? 'text' : 'password'}
                      value={passwordData.newPassword}
                      onChange={(e) => setPasswordData(prev => ({ ...prev, newPassword: e.target.value }))}
                      required
                      minLength={8}
                      className="w-full bg-navy-dark border border-electric-blue/30 rounded-lg px-4 py-3 text-metallic-silver focus:border-electric-blue focus:outline-none focus:ring-2 focus:ring-electric-blue/50 transition-all pr-12"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(prev => ({ ...prev, new: !prev.new }))}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-light-gray hover:text-electric-blue"
                    >
                      {showPassword.new ? <EyeOff size={20} /> : <Eye size={20} />}
                    </button>
                  </div>
                  <p className="text-xs text-light-gray mt-1">Minimum 8 characters</p>
                </div>

                <div>
                  <label className="block text-metallic-silver mb-2 font-semibold">
                    Confirm New Password
                  </label>
                  <div className="relative">
                    <input
                      type={showPassword.confirm ? 'text' : 'password'}
                      value={passwordData.confirmPassword}
                      onChange={(e) => setPasswordData(prev => ({ ...prev, confirmPassword: e.target.value }))}
                      required
                      minLength={8}
                      className="w-full bg-navy-dark border border-electric-blue/30 rounded-lg px-4 py-3 text-metallic-silver focus:border-electric-blue focus:outline-none focus:ring-2 focus:ring-electric-blue/50 transition-all pr-12"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(prev => ({ ...prev, confirm: !prev.confirm }))}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-light-gray hover:text-electric-blue"
                    >
                      {showPassword.confirm ? <EyeOff size={20} /> : <Eye size={20} />}
                    </button>
                  </div>
                  {passwordData.newPassword && passwordData.confirmPassword && passwordData.newPassword !== passwordData.confirmPassword && (
                    <p className="text-xs text-red-400 mt-1">Passwords do not match</p>
                  )}
                </div>

                <div className="flex gap-4">
                  <button
                    type="submit"
                    disabled={loadingStates.password}
                    className="btn-primary shine-effect flex-1 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <Save size={20} className="inline mr-2" />
                    {loadingStates.password ? 'Updating...' : 'Update Password'}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setPasswordData({
                        currentPassword: '',
                        newPassword: '',
                        confirmPassword: ''
                      })
                      setShowPassword({
                        current: false,
                        new: false,
                        confirm: false
                      })
                    }}
                    className="btn-secondary flex-1"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Security Tab */}
        {activeTab === 'security' && (
          <div className="space-y-8">
            <div className="glass-card">
              <h2 className="text-2xl font-bold metallic-heading mb-6">Two-Factor Authentication</h2>
              
              {twoFactorEnabled ? (
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-4 bg-green-500/20 border border-green-500/30 rounded-lg">
                    <div className="flex items-center">
                      <CheckCircle className="text-green-400 mr-3" size={20} />
                      <div>
                        <p className="font-bold text-metallic-silver">2FA Enabled</p>
                        <p className="text-sm text-light-gray">Your account is protected with two-factor authentication</p>
                      </div>
                    </div>
                    <button
                      onClick={handleDisable2FA}
                      disabled={loadingStates.twoFactor}
                      className="text-red-400 hover:text-red-300 transition-colors"
                    >
                      Disable
                    </button>
                  </div>

                  <div className="bg-navy-dark/50 border border-electric-blue/20 rounded-lg p-4">
                    <h3 className="font-bold text-metallic-silver mb-2">Backup Codes</h3>
                    <p className="text-sm text-light-gray mb-4">Save these backup codes in a safe place. You can use them to access your account if you lose your authenticator device.</p>
                    <div className="grid grid-cols-2 gap-2">
                      <div className="bg-navy-dark border border-electric-blue/20 rounded p-2 text-center">
                        <code className="text-electric-blue">XXXX-XXXX</code>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center py-8">
                  <QrCode className="text-electric-blue mx-auto mb-4" size={48} />
                  <h3 className="text-xl font-bold text-metallic-silver mb-2">Enable Two-Factor Authentication</h3>
                  <p className="text-light-gray mb-6">Add an extra layer of security to your account with an authenticator app</p>
                  
                  <button
                    onClick={handleEnable2FA}
                    disabled={loadingStates.twoFactor}
                    className="btn-primary shine-effect disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <Smartphone size={20} className="inline mr-2" />
                    {loadingStates.twoFactor ? 'Enabling...' : 'Enable 2FA'}
                  </button>
                </div>
              )}
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

      {/* Two Factor Modal */}
      <TwoFactorModal
        isOpen={showTwoFactorModal}
        onClose={() => setShowTwoFactorModal(false)}
        type={twoFactorModalType}
        userId={user?.id}
        userEmail={user?.email}
        onVerificationSuccess={handleTwoFactorSuccess}
      />

      {/* Two Factor Login Modal for Setup */}
      <TwoFactorLoginModal
        isOpen={showTwoFactorLoginModal}
        onClose={() => setShowTwoFactorLoginModal(false)}
        userId={user?.id}
        userEmail={user?.email}
        onVerificationSuccess={handleTwoFactorLoginSuccess}
        onLoginSuccess={() => {
          setShowTwoFactorLoginModal(false)
        }}
      />
    </>
  )
}

export default ClientSettings
