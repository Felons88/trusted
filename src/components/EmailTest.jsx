import { useState } from 'react'
import emailService from '../services/emailServiceSimple'

function EmailTest() {
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState('')

  const testEmail = async () => {
    setLoading(true)
    setResult('')
    
    try {
      const response = await emailService.testEmail()
      setResult('✅ Email sent successfully! Check your inbox.')
      console.log('Email test response:', response)
    } catch (error) {
      setResult(`❌ Error: ${error.message}`)
      console.error('Email test error:', error)
    } finally {
      setLoading(false)
    }
  }

  const validateConfig = () => {
    // Show environment variables for debugging
    const envVars = {
      BREVO_API_KEY: import.meta.env.VITE_BREVO_API_KEY?.substring(0, 10) + '...',
      BUSINESS_EMAIL: import.meta.env.VITE_BUSINESS_EMAIL,
      OWNER_EMAIL: import.meta.env.VITE_OWNER_EMAIL,
      SMTP_HOST: import.meta.env.VITE_SMTP_HOST,
      SMTP_PORT: import.meta.env.VITE_SMTP_PORT,
      SMTP_USER: import.meta.env.VITE_SMTP_USER
    }
    
    console.log('Environment variables:', envVars)
    
    const validation = emailService.validateConfig()
    if (validation.isValid) {
      setResult(`✅ Email configuration is valid!\n\nEnvironment variables loaded:\n${JSON.stringify(envVars, null, 2)}`)
    } else {
      setResult(`❌ Configuration errors: ${validation.errors.join(', ')}\n\nEnvironment variables:\n${JSON.stringify(envVars, null, 2)}`)
    }
  }

  return (
    <div className="p-6 max-w-md mx-auto">
      <h2 className="text-2xl font-bold mb-4">Email Service Test</h2>
      
      <div className="space-y-4">
        <button
          onClick={validateConfig}
          className="w-full bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
        >
          Validate Configuration
        </button>
        
        <button
          onClick={testEmail}
          disabled={loading}
          className="w-full bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600 disabled:opacity-50"
        >
          {loading ? 'Sending...' : 'Send Test Email'}
        </button>
        
        {result && (
          <div className="p-4 bg-gray-100 rounded">
            <pre className="text-sm">{result}</pre>
          </div>
        )}
      </div>
    </div>
  )
}

export default EmailTest
