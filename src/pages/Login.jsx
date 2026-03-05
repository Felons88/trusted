import { useState } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { useAuthStore } from '../store/authStore-emergency'
import { Car, Mail, Lock, ArrowLeft, RefreshCw, LogIn, AlertCircle } from 'lucide-react'
import toast from 'react-hot-toast'

function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  
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
      toast.success('Welcome back! Nice to see you again!')
      
      // Get the updated profile from the store after signIn
      setTimeout(() => {
        const updatedProfile = useAuthStore.getState().profile
        const currentUser = useAuthStore.getState().user
        console.log('Login: Updated profile from store:', updatedProfile)
        console.log('Login: Current user:', currentUser)
        
        // Redirect immediately based on the profile that was just set
        if (updatedProfile?.role === 'admin') {
          console.log('Login: Redirecting to admin panel')
          navigate('/admin')
        } else if (updatedProfile?.role === 'client') {
          console.log('Login: Redirecting to client portal')
          navigate('/client-portal')
        } else {
          // Fallback: check the user email directly and create profile if needed
          console.log('Login: Profile not found, checking user email:', currentUser?.email)
          
          if (currentUser?.email === 'jameshewitt312@gmail.com') {
            console.log('Login: Fallback redirecting admin by email')
            navigate('/admin')
          } else if (currentUser?.email === 'IsaiahDellwo01@gmail.com') {
            console.log('Login: Fallback redirecting client by email')
            navigate('/client-portal')
          } else if (currentUser?.email) {
            console.log('Login: Creating default client profile for user:', currentUser.email)
            // Create a default client profile for any other user
            const defaultProfile = {
              id: currentUser.id,
              email: currentUser.email,
              full_name: currentUser.user_metadata?.full_name || currentUser.email?.split('@')[0] || 'User',
              role: 'client'
            }
            
            // Set the profile in the store
            useAuthStore.getState().set({ user: currentUser, profile: defaultProfile })
            console.log('Login: Created default client profile, redirecting to client portal')
            navigate('/client-portal')
          } else {
            console.log('Login: No user or profile found, staying on login page')
            setError('Profile not loaded properly. Please try again.')
          }
        }
      }, 100) // Small delay to ensure state update
    } catch (err) {
      console.error('Login: Sign in failed', err)
      setError(err.message || 'The Email or Password that you entered is incorrect check your credentials.')
      toast.error('Login failed')
    } finally {
      setLoading(false)
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
    <div className="min-h-screen flex items-center justify-center bg-navy-gradient pt-20 pb-20 px-4">
      <div className="max-w-md w-full">
        <div className="glass-card">
          <div className="text-center mb-8">
            <div className="bg-electric-blue/20 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
              <LogIn className="text-electric-blue" size={32} />
            </div>
            <h1 className="text-3xl font-bold metallic-heading mb-2">Welcome Back</h1>
            <p className="text-light-gray">Sign in to your account</p>
          </div>

          {error && (
            <div className="bg-red-500/20 border border-red-500 rounded-lg p-4 mb-6 flex items-start">
              <AlertCircle className="text-red-500 mr-3 flex-shrink-0" size={20} />
              <p className="text-red-200 text-sm">{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-metallic-silver mb-2 font-semibold">
                Email Address
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full bg-navy-dark border border-electric-blue/30 rounded-lg px-4 py-3 text-metallic-silver focus:border-electric-blue focus:outline-none focus:ring-2 focus:ring-electric-blue/50 transition-all"
                placeholder="Billybob@gmail.com"
              />
            </div>

            <div>
              <label className="block text-metallic-silver mb-2 font-semibold">
                Password
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="w-full bg-navy-dark border border-electric-blue/30 rounded-lg px-4 py-3 text-metallic-silver focus:border-electric-blue focus:outline-none focus:ring-2 focus:ring-electric-blue/50 transition-all"
                placeholder="***********"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="btn-primary w-full shine-effect disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Signing in...' : 'Sign In'}
            </button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-light-gray text-sm">
              Don't have an account?{' '}
              <Link to="/register" className="text-electric-blue hover:text-bright-cyan transition-colors">
                Register here
              </Link>
            </p>
          </div>

          
          <div className="mt-4 text-center">
            <Link to="/" className="text-light-gray text-sm hover:text-electric-blue transition-colors">
              ← Back to Home
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Login
