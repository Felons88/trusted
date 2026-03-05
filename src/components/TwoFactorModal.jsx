import { useState } from 'react'
import { QrCode, Smartphone, Key, X, AlertCircle, CheckCircle } from 'lucide-react'
import twoFactorService from '../services/twoFactorService'
import toast from 'react-hot-toast'

function TwoFactorModal({ 
  isOpen, 
  onClose, 
  type = 'verify', // 'verify', 'setup', 'backup'
  userId, 
  userEmail,
  onVerificationSuccess 
}) {
  const [loading, setLoading] = useState(false)
  const [verificationCode, setVerificationCode] = useState('')
  const [backupCode, setBackupCode] = useState('')
  const [qrCodeUrl, setQrCodeUrl] = useState('')
  const [secret, setSecret] = useState('')
  const [step, setStep] = useState(type === 'setup' ? 'qr' : 'verify')
  const [backupCodes, setBackupCodes] = useState([])

  const handleSetup = async () => {
    setLoading(true)
    try {
      const generatedSecret = twoFactorService.generateSecret()
      setSecret(generatedSecret.base32)
      
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

  const handleVerify = async () => {
    if (!verificationCode || verificationCode.length !== 6) {
      toast.error('Please enter a 6-digit code')
      return
    }

    setLoading(true)
    try {
      const isValid = twoFactorService.verifyToken(verificationCode, secret)
      
      if (isValid) {
        if (type === 'setup') {
          await twoFactorService.enableTwoFactor(userId, secret)
          toast.success('2FA enabled successfully!')
        }
        
        onVerificationSuccess?.()
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

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-navy-deep border border-electric-blue/30 rounded-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex justify-between items-center p-6 border-b border-electric-blue/20">
          <h2 className="text-xl font-bold metallic-heading">
            {type === 'setup' ? 'Set Up 2FA' : 'Two-Factor Authentication'}
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
          {type === 'setup' && step === 'qr' && (
            <div className="space-y-6">
              <div className="text-center">
                <QrCode className="text-electric-blue mx-auto mb-4" size={48} />
                <h3 className="text-lg font-bold text-metallic-silver mb-2">Enable Two-Factor Authentication</h3>
                <p className="text-light-gray mb-6">
                  Scan this QR code with your authenticator app (Google Authenticator, Authy, etc.)
                </p>
              </div>

              <div className="flex justify-center">
                {qrCodeUrl ? (
                  <img src={qrCodeUrl} alt="2FA QR Code" className="border-2 border-electric-blue rounded-lg" />
                ) : (
                  <div className="bg-navy-dark border border-electric-blue/20 rounded-lg p-8">
                    <button
                      onClick={handleSetup}
                      disabled={loading}
                      className="btn-primary shine-effect disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <Smartphone size={20} className="inline mr-2" />
                      {loading ? 'Generating...' : 'Generate QR Code'}
                    </button>
                  </div>
                )}
              </div>

              {qrCodeUrl && (
                <div className="text-center">
                  <button
                    onClick={() => setStep('verify')}
                    className="btn-primary shine-effect"
                  >
                    Continue to Verification
                  </button>
                </div>
              )}
            </div>
          )}

          {(type === 'verify' || (type === 'setup' && step === 'verify')) && (
            <div className="space-y-6">
              <div className="text-center">
                <Key className="text-electric-blue mx-auto mb-4" size={48} />
                <h3 className="text-lg font-bold text-metallic-silver mb-2">
                  {type === 'setup' ? 'Verify Authenticator App' : 'Enter 2FA Code'}
                </h3>
                <p className="text-light-gray">
                  Enter the 6-digit code from your authenticator app
                </p>
              </div>

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

          {step === 'backup' && (
            <div className="space-y-6">
              <div className="text-center">
                <AlertCircle className="text-yellow-400 mx-auto mb-4" size={48} />
                <h3 className="text-lg font-bold text-metallic-silver mb-2">Use Backup Code</h3>
                <p className="text-light-gray">
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

              {type === 'setup' && backupCodes.length > 0 && (
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
                  onClick={handleBackupVerify}
                  disabled={loading || !backupCode}
                  className="btn-primary shine-effect flex-1 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? 'Verifying...' : 'Verify Backup Code'}
                </button>
                <button
                  onClick={() => setStep('verify')}
                  className="btn-secondary flex-1"
                >
                  Back to 2FA
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default TwoFactorModal
