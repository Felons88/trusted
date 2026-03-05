import { useState, useEffect } from 'react'
import { Star, Quote } from 'lucide-react'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY
)

function GoogleReviews() {
  const [reviews, setReviews] = useState([])
  const [loading, setLoading] = useState(true)
  const [showFeatured, setShowFeatured] = useState(false)

  useEffect(() => {
    fetchReviews()
  }, [])

  const fetchReviews = async () => {
    try {
      setLoading(true)
      const { data, error } = await supabase
        .from('google_reviews')
        .select('*')
        .eq('is_approved', true)
        .order('time', 'desc')

      if (error) throw error
      setReviews(data || [])
    } catch (error) {
      console.error('Error fetching reviews:', error)
    } finally {
      setLoading(false)
    }
  }

  const StarRating = ({ rating }) => (
    <div className="flex gap-1">
      {[...Array(rating)].map((_, i) => (
        <Star key={i} className="text-yellow-400 fill-current" size={20} />
      ))}
    </div>
  )

  const displayedReviews = showFeatured 
    ? reviews.slice(0, 3) // Show top 3 for featured
    : reviews // Show all for regular view

  if (loading) {
    return (
      <div className="flex justify-center items-center py-20">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-electric-blue"></div>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      {/* Toggle Button */}
      <div className="text-center">
        <button
          onClick={() => setShowFeatured(!showFeatured)}
          className="inline-flex items-center px-6 py-3 bg-navy-light/50 border border-electric-blue/30 rounded-lg text-light-gray hover:bg-navy-light/70 transition-colors"
        >
          <Star className="w-4 h-4 mr-2" />
          {showFeatured ? 'Featured Reviews' : 'All Reviews'}
        </button>
      </div>

      {/* Reviews Grid */}
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
        {displayedReviews.map((review, index) => (
          <div
            key={review.id}
            className="glass-card relative"
            style={{ animationDelay: `${index * 0.1}s` }}
          >
            <Quote className="absolute top-4 right-4 text-electric-blue/20" size={40} />
            <div className="mb-4">
              <StarRating rating={review.rating} />
            </div>
            <p className="text-light-gray mb-4 italic">
              "{review.review_text || 'No review text available'}"
            </p>
            <div className="border-t border-electric-blue/20 pt-4">
              <h4 className="font-bold text-white">{review.author_name}</h4>
              <p className="text-sm text-electric-blue">
                {review.time ? new Date(review.time * 1000).toLocaleDateString() : 'No date'}
              </p>
              {review.author_url && (
                <a 
                  href={review.author_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs text-blue-400 hover:text-blue-300 transition-colors"
                >
                  View Profile
                </a>
              )}
            </div>
          </div>
        ))}
      </div>

      {reviews.length === 0 && (
        <div className="text-center py-20">
          <p className="text-light-gray">No reviews available yet.</p>
        </div>
      )}
    </div>
  )
}

export default GoogleReviews
