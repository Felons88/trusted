import { Link } from 'react-router-dom'
import GoogleReviews from '../components/GoogleReviews'

function Reviews() {
  return (
    <div className="overflow-hidden">
      <section className="relative min-h-[60vh] flex items-center justify-center pt-32 pb-20">
        <div className="absolute inset-0 bg-gradient-to-b from-navy-deep via-navy-dark to-navy-deep opacity-95"></div>
        
        <div className="relative z-10 container mx-auto px-4 text-center fade-in">
          <h1 className="text-5xl md:text-6xl font-bold metallic-heading mb-6 animate-shine">
            Customer <span className="text-electric-blue glow-text">Reviews</span>
          </h1>
          <p className="text-xl text-light-gray max-w-3xl mx-auto">
            See what our satisfied customers are saying about our service
          </p>
        </div>
      </section>

      <section className="py-20 bg-navy-deep">
        <div className="container mx-auto px-4">
          <GoogleReviews />
        </div>
      </section>

      <section className="py-20 bg-gradient-to-b from-navy-dark to-navy-deep">
        <div className="container mx-auto px-4 text-center">
          <div className="max-w-3xl mx-auto glass-card">
            <h2 className="text-4xl font-bold metallic-heading mb-6">
              Join Our Satisfied Customers
            </h2>
            <p className="text-lg text-light-gray mb-8">
              Experience the same level of quality and professionalism. Book your detail today!
            </p>
            <Link to="/book-now" className="btn-primary shine-effect text-lg px-12 py-4">
              Book Your Detail
            </Link>
          </div>
        </div>
      </section>
    </div>
  )
}

export default Reviews
