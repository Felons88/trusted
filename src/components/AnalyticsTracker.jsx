import { useEffect } from 'react'
import { useLocation } from 'react-router-dom'
import { analyticsService } from '../services/analyticsService'

function AnalyticsTracker() {
  const location = useLocation()

  useEffect(() => {
    // Track page view on mount and route changes
    const trackPageView = async () => {
      // Wait a bit for the page to fully load
      setTimeout(() => {
        analyticsService.trackPageView()
      }, 500)
    }

    trackPageView()
  }, [location.pathname, location.search])

  // This component doesn't render anything
  return null
}

export default AnalyticsTracker
