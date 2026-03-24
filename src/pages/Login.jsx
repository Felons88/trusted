import { useState } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { useAuthStore } from '../store/authStore-emergency'
import { Car, Mail, Lock, ArrowLeft, RefreshCw, LogIn, AlertCircle } from 'lucide-react'
import toast from 'react-hot-toast'
import TwoFactorLoginModal from '../components/TwoFactorLoginModal'

function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [showTwoFactorModal, setShowTwoFactorModal] = useState(false)
  const [pendingLogin, setPendingLogin] = useState(null)
  
  const navigate = useNavigate()
  const location = useLocation()
  const { signIn, profile, refreshProfile, loading: authLoading } = useAuthStore()
  
  const from = location.state?.from?.pathname || '/'

  // Debug: Log current state
  console.log('Login component state:', {
    authLoading,
    profile,
    email: profile?.email,
    role: profile?.role
  })

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      console.log('Login: Starting sign in process...')
      const result = await signIn(email, password)
      console.log('Login: Sign in successful', result)
      
      // Check if user has 2FA enabled
      const has2FA = await useAuthStore.getState().isTwoFactorEnabled(result.user.id)
      console.log('Login: 2FA status', { has2FA, userId: result.user.id })
      
      if (has2FA) {
        // Store pending login data and show 2FA modal
        setPendingLogin(result)
        setShowTwoFactorModal(true)
        toast.success('Please complete 2FA verification')
        setLoading(false)
        return
      }
      
      toast.success('Welcome back! Nice to see you again!')
      
      // Immediate redirect since profile is now loaded synchronously
      console.log('Login: Checking profile for redirect', { 
        email: profile?.email, 
        role: profile?.role,
        profile: profile 
      })
      
      if (profile?.role === 'admin') {
        console.log('Login: Redirecting to admin panel')
        navigate('/admin')
      } else if (profile?.role === 'client') {
        console.log('Login: Redirecting to client portal')
        navigate('/client-portal')
      } else {
        console.log('Login: No profile role found, staying on login page')
        setError('Profile not loaded properly. Please try again.')
      }
    } catch (err) {
      console.error('Login: Sign in failed', err)
      setError(err.message || 'The Email or Password that you entered is incorrect check your credentials.')
      toast.error('Login failed')
    } finally {
      setLoading(false)
    }
  }

  const handleTwoFactorSuccess = () => {
    // Complete the login process after 2FA verification
    if (pendingLogin) {
      toast.success('Welcome back! Nice to see you again!')
      
      // Immediate redirect for 2FA as well
      if (profile?.role === 'admin') {
        navigate('/admin')
      } else if (profile?.role === 'client') {
        navigate('/client-portal')
      } else {
        navigate('/client-portal') // Default to client portal
      }
    }
  }

  if (authLoading) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-navy-gradient pt-20 pb-20 px-4">
      <div className="text-center">
        <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-electric-blue mx-auto mb-4"></div>
        <p className="text-metallic-silver">Loading...</p>
      </div>
    </div>
  )
}

  return (
    <>
      <div className="min-h-screen bg-gradient-to-br from-navy-deep via-navy-dark to-navy-black flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          {/* Logo and Header */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-20 h-20 bg-electric-blue/20 rounded-full mb-6">
              <Car className="text-electric-blue" size={40} />
            </div>
            <h1 className="text-4xl font-bold metallic-heading mb-2">Welcome Back</h1>
            <p className="text-light-gray">Sign in to your Trusted Mobile Detailing account</p>
          </div>

          {/* Login Form */}
          <div className="glass-card">
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Email Field */}
              <div>
                <label className="block text-metallic-silver mb-2 font-semibold">
                  Email Address
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-light-gray" size={20} />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    placeholder="your@email.com"
                    className="w-full bg-navy-dark border border-electric-blue/30 rounded-lg pl-12 pr-4 py-3 text-metallic-silver focus:border-electric-blue focus:outline-none focus:ring-2 focus:ring-electric-blue/50 transition-all"
                  />
                </div>
              </div>

              {/* Password Field */}
              <div>
                <label className="block text-metallic-silver mb-2 font-semibold">
                  Password
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-light-gray" size={20} />
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    placeholder="••••••••"
                    className="w-full bg-navy-dark border border-electric-blue/30 rounded-lg pl-12 pr-4 py-3 text-metallic-silver focus:border-electric-blue focus:outline-none focus:ring-2 focus:ring-electric-blue/50 transition-all"
                  />
                </div>
              </div>

              {/* Error Message */}
              {error && (
                <div className="bg-red-500/20 border border-red-500/30 rounded-lg p-3 flex items-center">
                  <AlertCircle className="text-red-400 mr-2" size={20} />
                  <span className="text-red-400 text-sm">{error}</span>
                </div>
              )}

              {/* Submit Button */}
              <button
                type="submit"
                disabled={loading}
                className="btn-primary w-full shine-effect disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <>
                    <RefreshCw className="animate-spin inline mr-2" size={20} />
                    Signing in...
                  </>
                ) : (
                  <>
                    <LogIn className="inline mr-2" size={20} />
                    Sign In
                  </>
                )}
              </button>
            </form>

            {/* Register Link */}
            <div className="mt-6 text-center text-light-gray">
              <p>
                Don't have an account?{' '}
                <Link to="/register" className="text-electric-blue hover:text-electric-blue/80 transition-colors font-semibold">
                  Sign up here
                </Link>
              </p>
            </div>

            {/* Back to Home */}
            <div className="mt-4 text-center">
              <Link to="/" className="text-light-gray text-sm hover:text-electric-blue transition-colors">
                ← Back to Home
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Two Factor Login Modal */}
      <TwoFactorLoginModal
        isOpen={showTwoFactorModal}
        onClose={() => setShowTwoFactorModal(false)}
        userId={pendingLogin?.user?.id}
        userEmail={pendingLogin?.user?.email}
        onVerificationSuccess={handleTwoFactorSuccess}
        onLoginSuccess={() => {
          setPendingLogin(null)
          setShowTwoFactorModal(false)
        }}
      />
    </>
  )
}

export default Login
