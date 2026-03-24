import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'

function Success() {
  const navigate = useNavigate()

  const handleReviewRedirect = () => {
    window.open('https://g.page/r/CWYdYXqTiWZ5EBM/review', '_blank')
  }

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
            
            <div className="bg-blue-600 p-4 rounded-lg">
              <h3 className="text-white font-semibold mb-2">Share Your Experience!</h3>
              <p className="text-blue-100 mb-4">
                We'd love to hear about your experience with our service. Your feedback helps us improve and serves others in making informed decisions.
              </p>
              <button
                onClick={handleReviewRedirect}
                className="w-full bg-white text-blue-600 py-3 rounded-lg font-semibold hover:bg-blue-50 transition-colors"
              >
                Leave a Google Review
              </button>
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
          
          <div className="mt-6 space-y-3">
            <button
              onClick={() => navigate('/')}
              className="btn-primary w-full"
            >
              Return to Homepage
            </button>
            <button
              onClick={() => navigate('/client-portal')}
              className="w-full bg-navy-dark text-white py-3 rounded-lg font-medium hover:bg-navy-lighter transition-colors"
            >
              View Client Portal
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Success
