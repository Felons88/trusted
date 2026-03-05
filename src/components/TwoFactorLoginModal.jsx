import { useState } from 'react'
import { QrCode, Smartphone, Key, X, AlertCircle, CheckCircle, MessageSquare, RefreshCw, Shield } from 'lucide-react'
import twoFactorService from '../services/twoFactorService'
import toast from 'react-hot-toast'

function TwoFactorLoginModal({ 
  isOpen, 
  onClose, 
  userId, 
  userEmail,
  onVerificationSuccess,
  onLoginSuccess 
}) {
  const [loading, setLoading] = useState(false)
  const [step, setStep] = useState('method') // 'method', 'setup', 'verify', 'sms'
  const [method, setMethod] = useState('authenticator') // 'authenticator' or 'sms'
  const [verificationCode, setVerificationCode] = useState('')
  const [phoneNumber, setPhoneNumber] = useState('')
  const [qrCodeUrl, setQrCodeUrl] = useState('')
  const [secret, setSecret] = useState('')
  const [backupCodes, setBackupCodes] = useState([])
  const [smsSent, setSmsSent] = useState(false)

  const handleMethodSelect = (selectedMethod) => {
    setMethod(selectedMethod)
    if (selectedMethod === 'authenticator') {
      setStep('setup')
      handleSetup()
    } else {
      setStep('sms')
      handleSMS()
    }
  }

  const handleSetup = async () => {
    setLoading(true)
    try {
      const generatedSecret = twoFactorService.generateSecret()
      setSecret(generatedSecret.base32)
      
      // Debug TOTP generation
      console.log('2FA Setup Debug:')
      console.log('Generated secret:', generatedSecret.base32)
      console.log('Current token:', twoFactorService.getCurrentToken(generatedSecret.base32))
      
      const qrCodeDataUrl = await twoFactorService.generateQRCode(generatedSecret.base32, userEmail)
      setQrCodeUrl(qrCodeDataUrl)
      
      const codes = twoFactorService.generateBackupCodes()
      setBackupCodes(codes)
      
      setStep('verify')
    } catch (error) {
      console.error('Error setting up 2FA:', error)
      toast.error('Failed to set up 2FA')
    } finally {
      setLoading(false)
    }
  }

  const handleSMS = async () => {
    if (!phoneNumber || phoneNumber.length < 10) {
      toast.error('Please enter a valid phone number')
      return
    }

    setLoading(true)
    try {
      // In a real app, this would send an SMS via Twilio or similar service
      console.log('SMS would be sent to:', phoneNumber)
      
      // Simulate SMS sending
      await new Promise(resolve => setTimeout(resolve, 2000))
      
      setSmsSent(true)
      toast.success(`Verification code sent to ${phoneNumber}`)
      setStep('verify')
    } catch (error) {
      console.error('Error sending SMS:', error)
      toast.error('Failed to send SMS')
    } finally {
      setLoading(false)
    }
  }

  const handleVerify = async () => {
    if (!verificationCode || verificationCode.length !== 6) {
      toast.error('Please enter a 6-digit code')
      return
    }

    setLoading(true)
    try {
      const isValid = await twoFactorService.verifyToken(verificationCode, secret)
      
      if (isValid) {
        if (step === 'setup') {
          await twoFactorService.enableTwoFactor(userId, secret)
          toast.success('2FA enabled successfully!')
        }
        
        onVerificationSuccess?.()
        onLoginSuccess?.()
        onClose()
      } else {
        toast.error('Invalid verification code')
      }
    } catch (error) {
      console.error('Error verifying 2FA:', error)
      toast.error('Failed to verify code')
    } finally {
      setLoading(false)
    }
  }

  const handleBackupVerify = async () => {
    if (!backupCode) {
      toast.error('Please enter a backup code')
      return
    }

    setLoading(true)
    try {
      const isValid = await twoFactorService.verifyBackupCode(userId, backupCode)
      
      if (isValid) {
        toast.success('Backup code verified successfully!')
        onVerificationSuccess?.()
        onLoginSuccess?.()
        onClose()
      } else {
        toast.error('Invalid backup code')
      }
    } catch (error) {
      console.error('Error verifying backup code:', error)
      toast.error('Failed to verify backup code')
    } finally {
      setLoading(false)
    }
  }

  const handleResendSMS = () => {
    setSmsSent(false)
    handleSMS()
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-navy-deep border border-electric-blue/30 rounded-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex justify-between items-center p-6 border-b border-electric-blue/20">
          <h2 className="text-xl font-bold metallic-heading">
            {step === 'method' && 'Two-Factor Authentication'}
            {step === 'setup' && 'Set Up 2FA'}
            {step === 'verify' && 'Enter Verification Code'}
            {step === 'sms' && 'SMS Verification'}
          </h2>
          <button
            onClick={onClose}
            className="text-light-gray hover:text-electric-blue transition-colors"
          >
            <X size={24} />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          {step === 'method' && (
            <div className="space-y-6">
              <div className="text-center">
                <Shield className="text-electric-blue mx-auto mb-4" size={48} />
                <h3 className="text-lg font-bold text-metallic-silver mb-2">Choose 2FA Method</h3>
                <p className="text-light-gray mb-6">
                  Select how you want to receive your verification codes
                </p>
              </div>

              <div className="space-y-4">
                <button
                  onClick={() => handleMethodSelect('authenticator')}
                  disabled={loading}
                  className="w-full bg-electric-blue/20 border border-electric-blue/30 rounded-lg p-6 hover:bg-electric-blue/30 transition-colors text-left disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <div className="flex items-center">
                    <Smartphone className="text-electric-blue mr-3" size={24} />
                    <div>
                      <p className="font-bold text-metallic-silver">Authenticator App</p>
                      <p className="text-sm text-light-gray">
                        Use Google Authenticator, Authy, or Outlook Authenticator.
                      </p>
                    </div>
                  </div>
                </button>

                <button
                  onClick={() => handleMethodSelect('sms')}
                  disabled={loading}
                  className="w-full bg-electric-blue/20 border border-electric-blue/30 rounded-lg p-6 hover:bg-electric-blue/30 transition-colors text-left disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <div className="flex items-center">
                    <MessageSquare className="text-electric-blue mr-3" size={24} />
                    <div>
                      <p className="font-bold text-metallic-silver">SMS Text Message</p>
                      <p className="text-sm text-light-gray">
                        Receive codes via text message
                      </p>
                    </div>
                  </div>
                </button>
              </div>
            </div>
          )}

          {(step === 'setup' || step === 'verify') && method === 'authenticator' && (
            <div className="space-y-6">
              {step === 'setup' && (
                <div className="text-center">
                  <QrCode className="text-electric-blue mx-auto mb-4" size={48} />
                  <h3 className="text-lg font-bold text-metallic-silver mb-2">
                    Set Up Authenticator App
                  </h3>
                  <p className="text-light-gray mb-6">
                    Scan this QR code with your authenticator app (Google Authenticator, Authy, Outlook. Authenticator).
                  </p>
                </div>
              )}

              {qrCodeUrl && (
                <div className="flex justify-center mb-6">
                  <img 
                    src={qrCodeUrl} 
                    alt="2FA QR Code" 
                    className="border-2 border-electric-blue rounded-lg max-w-xs"
                  />
                </div>
              )}

              <div>
                <input
                  type="text"
                  value={verificationCode}
                  onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  maxLength={6}
                  placeholder="000000"
                  className="w-full bg-navy-dark border border-electric-blue/30 rounded-lg px-4 py-3 text-center text-2xl font-mono text-electric-blue focus:border-electric-blue focus:outline-none focus:ring-2 focus:ring-electric-blue/50 transition-all"
                  autoFocus
                />
              </div>

              {step === 'setup' && backupCodes.length > 0 && (
                <div className="bg-navy-dark/50 border border-electric-blue/20 rounded-lg p-4">
                  <h4 className="font-bold text-metallic-silver mb-2">Your Backup Codes</h4>
                  <p className="text-sm text-light-gray mb-3">
                    Save these codes in a safe place. You can only see them once!
                  </p>
                  <div className="grid grid-cols-2 gap-2">
                    {backupCodes.map((code, index) => (
                      <div key={index} className="bg-navy-dark border border-electric-blue/20 rounded p-2 text-center">
                        <code className="text-electric-blue text-sm">{code}</code>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="flex gap-4">
                <button
                  onClick={handleVerify}
                  disabled={loading || verificationCode.length !== 6}
                  className="btn-primary shine-effect flex-1 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? 'Verifying...' : 'Verify'}
                </button>
                <button
                  onClick={() => setStep('backup')}
                  className="btn-secondary flex-1"
                >
                  Use Backup Code
                </button>
              </div>
            </div>
          )}

          {step === 'sms' && (
            <div className="space-y-6">
              <div className="text-center">
                <MessageSquare className="text-electric-blue mx-auto mb-4" size={48} />
                <h3 className="text-lg font-bold text-metallic-silver mb-2">
                  SMS Verification
                </h3>
                <p className="text-light-gray mb-6">
                  Enter your phone number to receive a verification code
                </p>
              </div>

              <div>
                <input
                  type="tel"
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                  placeholder="+1 (555) 123-4567"
                  className="w-full bg-navy-dark border border-electric-blue/30 rounded-lg px-4 py-3 text-metallic-silver focus:border-electric-blue focus:outline-none focus:ring-2 focus:ring-electric-blue/50 transition-all"
                  autoFocus
                />
              </div>

              <div className="flex gap-4">
                <button
                  onClick={handleSMS}
                  disabled={loading || !phoneNumber || phoneNumber.length < 10}
                  className="btn-primary shine-effect flex-1 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? 'Sending...' : 'Send Code'}
                </button>
                <button
                  onClick={() => setStep('method')}
                  className="btn-secondary flex-1"
                >
                  Back
                </button>
              </div>

              {smsSent && (
                <div className="bg-green-500/20 border border-green-500/30 rounded-lg p-4 text-center">
                  <CheckCircle className="text-green-400 mx-auto mb-2" size={24} />
                  <p className="text-green-400 font-bold">SMS Sent!</p>
                  <p className="text-sm text-light-gray">
                    Check your messages for the verification code
                  </p>
                </div>
              )}

              {smsSent && (
                <div className="space-y-4">
                  <input
                    type="text"
                    value={verificationCode}
                    onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                    maxLength={6}
                    placeholder="000000"
                    className="w-full bg-navy-dark border border-electric-blue/30 rounded-lg px-4 py-3 text-center text-2xl font-mono text-electric-blue focus:border-electric-blue focus:outline-none focus:ring-2 focus:ring-electric-blue/50 transition-all"
                    autoFocus
                  />
                  
                  <div className="flex gap-4">
                    <button
                      onClick={handleVerify}
                      disabled={loading || verificationCode.length !== 6}
                      className="btn-primary shine-effect flex-1 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {loading ? 'Verifying...' : 'Verify'}
                    </button>
                    <button
                      onClick={handleResendSMS}
                      disabled={loading}
                      className="btn-secondary flex-1"
                    >
                      <RefreshCw size={16} className="inline mr-2" />
                      Resend
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {step === 'backup' && (
            <div className="space-y-6">
              <div className="text-center">
                <AlertCircle className="text-yellow-400 mx-auto mb-4" size={48} />
                <h3 className="text-lg font-bold text-metallic-silver mb-2">Use Backup Code</h3>
                <p className="text-light-gray mb-6">
                  Enter one of your backup codes to access your account
                </p>
              </div>

              <div>
                <input
                  type="text"
                  value={backupCode}
                  onChange={(e) => setBackupCode(e.target.value.toUpperCase())}
                  placeholder="XXXX-XXXX"
                  className="w-full bg-navy-dark border border-electric-blue/30 rounded-lg px-4 py-3 text-center text-electric-blue focus:border-electric-blue focus:outline-none focus:ring-2 focus:ring-electric-blue/50 transition-all"
                  autoFocus
                />
              </div>

              <div className="flex gap-4">
                <button
                  onClick={handleBackupVerify}
                  disabled={loading || !backupCode}
                  className="btn-primary shine-effect flex-1 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? 'Verifying...' : 'Verify Backup Code'}
                </button>
                <button
                  onClick={() => setStep('method')}
                  className="btn-secondary flex-1"
                >
                  Back
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default TwoFactorLoginModal
