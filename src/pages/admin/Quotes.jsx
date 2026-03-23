import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'
import { FileText, Mail, Phone, CheckCircle, Clock, DollarSign, Map } from 'lucide-react'
import toast from 'react-hot-toast'

function Quotes() {
  const [quotes, setQuotes] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadQuotes()
  }, [])

  const loadQuotes = async () => {
    try {
      console.log('Quotes: Loading data...')
      
      let quotesData = []
      
      try {
        const { data } = await supabase
          .from('quote_requests')
          .select('*')
          .order('created_at', { ascending: false })
        quotesData = data || []
        console.log('Quotes: Loaded', quotesData.length, 'quotes')
      } catch (err) {
        console.log('Quotes: Error loading data')
        quotesData = []
      }
      
      setQuotes(quotesData)
      setLoading(false)
    } catch (error) {
      console.error('Quotes: Critical error:', error)
      setQuotes([])
      setLoading(false)
    }
  }

  const markAsRead = async (quoteId) => {
    try {
      const { error } = await supabase
        .from('quote_requests')
        .update({ is_read: true })
        .eq('id', quoteId)

      if (error) throw error

      toast.success('Quote marked as read')
      loadQuotes()
    } catch (error) {
      console.error('Error marking quote as read:', error)
      toast.error('Failed to update quote')
    }
  }

  const openMaps = (address) => {
    if (!address) {
      toast.error('No address available')
      return
    }

    // Detect device type
    const userAgent = navigator.userAgent.toLowerCase()
    const isApple = /iphone|ipad|ipod/.test(userAgent) || /mac/.test(userAgent)
    
    let mapsUrl = ''
    
    if (isApple) {
      // Use Apple Maps
      mapsUrl = `maps://maps.apple.com/?address=${encodeURIComponent(address)}`
    } else {
      // Use Google Maps (default for Samsung and others)
      mapsUrl = `https://maps.google.com/?q=${encodeURIComponent(address)}`
    }
    
    // Open in new tab
    window.open(mapsUrl, '_blank')
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-electric-blue"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-4xl font-bold metallic-heading mb-2">Quote Requests</h1>
        <p className="text-light-gray">Manage customer quote requests</p>
      </div>

      <div className="glass-card">
        {quotes.length === 0 ? (
          <div className="text-center py-12">
            <FileText className="text-light-gray mx-auto mb-4" size={48} />
            <h3 className="text-xl font-bold metallic-heading mb-2">No Quote Requests</h3>
            <p className="text-light-gray">No quote requests have been submitted yet</p>
          </div>
        ) : (
          <div className="space-y-4">
            {quotes.map((quote) => (
              <div
                key={quote.id}
                className={`bg-navy-dark/50 border rounded-lg p-6 ${
                  !quote.is_read ? 'border-electric-blue/50' : 'border-electric-blue/20'
                }`}
              >
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <div className="flex items-center mb-2">
                      <h3 className="text-xl font-bold text-metallic-silver">
                        {quote.full_name}
                      </h3>
                      {!quote.is_read && (
                        <span className="ml-3 px-3 py-1 bg-electric-blue/20 text-electric-blue rounded-full text-xs font-semibold">
                          New
                        </span>
                      )}
                    </div>
                    <div className="space-y-1">
                      <div className="flex items-center text-light-gray text-sm">
                        <Mail size={16} className="mr-2 text-electric-blue" />
                        {quote.email}
                      </div>
                      <div className="flex items-center text-light-gray text-sm">
                        <Phone size={16} className="mr-2 text-electric-blue" />
                        {quote.phone}
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-light-gray mb-1">
                      {new Date(quote.created_at).toLocaleDateString()}
                    </p>
                    {!quote.is_read && (
                      <button
                        onClick={() => markAsRead(quote.id)}
                        className="btn-secondary text-sm"
                      >
                        Mark as Read
                      </button>
                    )}
                  </div>
                </div>

                <div className="grid md:grid-cols-2 gap-6 mb-4">
                  <div>
                    <h4 className="font-semibold text-metallic-silver mb-2">Vehicle Details</h4>
                    <div className="space-y-1 text-sm">
                      <p className="text-light-gray">
                        {quote.vehicle_year} {quote.vehicle_make} {quote.vehicle_model}
                      </p>
                      <p className="text-light-gray capitalize">Size: {quote.vehicle_size}</p>
                    </div>
                  </div>
                  <div>
                    <h4 className="font-semibold text-metallic-silver mb-2">Service Request</h4>
                    <div className="space-y-1 text-sm">
                      <p className="text-light-gray capitalize">{quote.service_type} Detail</p>
                      <p className="text-light-gray">
                        {quote.preferred_date} at {quote.preferred_time}
                      </p>
                    </div>
                  </div>
                </div>

                {quote.address && (
                  <div className="mb-4">
                    <div className="flex items-center justify-between">
                      <h4 className="font-semibold text-metallic-silver mb-2">Service Address</h4>
                      <button
                        onClick={() => openMaps(quote.address)}
                        className="text-electric-blue hover:text-bright-cyan transition-colors flex items-center space-x-1 text-sm"
                      >
                        <Map size={14} />
                        <span>View in Maps</span>
                      </button>
                    </div>
                    <button
                      onClick={() => openMaps(quote.address)}
                      className="text-light-gray text-sm hover:text-bright-cyan transition-colors text-left"
                    >
                      {quote.address}
                    </button>
                  </div>
                )}

                {quote.notes && (
                  <div className="pt-4 border-t border-electric-blue/20">
                    <h4 className="font-semibold text-metallic-silver mb-2">Additional Notes</h4>
                    <p className="text-light-gray text-sm">{quote.notes}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

export default Quotes
