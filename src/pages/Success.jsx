import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'

function Success() {
  const navigate = useNavigate()

  useEffect(() => {
    const timer = setTimeout(() => {
      navigate('/')
    }, 5000)

    return () => clearTimeout(timer)
  }, [navigate])

  return (
    <div className="min-h-screen flex items-center justify-center bg-navy-deep">
      <div className="text-center p-8">
        <div className="glass-card p-8 max-w-md">
          <div className="text-6xl text-green-400 mb-4">✓</div>
          <h1 className="text-3xl font-bold text-white mb-4">Payment Successful!</h1>
          <p className="text-light-gray mb-6">
            Thank you for your payment. Your invoice has been marked as paid.
          </p>
          <div className="space-y-4">
            <div className="bg-navy-dark p-4 rounded-lg">
              <h3 className="text-white font-semibold mb-2">What's Next?</h3>
              <ul className="text-light-gray space-y-2">
                <li>• You will receive a payment confirmation email shortly</li>
                <li>• Your receipt is available in your client portal</li>
                <li>• Schedule your next detailing service anytime</li>
              </ul>
            </div>
            <div className="bg-navy-dark p-4 rounded-lg">
              <h3 className="text-white font-semibold mb-2">Need Help?</h3>
              <p className="text-light-gray mb-4">
                Contact our support team if you have any questions about your payment.
              </p>
              <div className="space-y-2">
                <p className="text-light-gray">
                  📞 Phone: (612) 525-3137
                </p>
                <p className="text-light-gray">
                  📧 Email: info@trustedmobiledetailing.com
                </p>
                <p className="text-light-gray">
                  📍 Address: 329 Morton Ave, Elk River, MN 55330
                </p>
              </div>
            </div>
          </div>
          
          <button
            onClick={() => navigate('/')}
            className="btn-primary w-full"
          >
            Return to Homepage
          </button>
        </div>
      </div>
    </div>
  )
}

export default Success
