import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import { 
  User, Car, Mail, Phone, MapPin, Calendar, Plus, 
  AlertCircle, CheckCircle, Clock, Archive 
} from 'lucide-react'
import toast from 'react-hot-toast'

function QuoteRequests() {
  const [quoteRequests, setQuoteRequests] = useState([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('all')

  useEffect(() => {
    fetchQuoteRequests()
  }, [filter])

  const fetchQuoteRequests = async () => {
    try {
      setLoading(true)
      let query = supabase
        .from('quote_requests')
        .select('*')
        .order('created_at', { ascending: false })

      if (filter !== 'all') {
        query = query.eq('status', filter)
      }

      const { data, error } = await query

      if (error) throw error
      setQuoteRequests(data || [])
    } catch (error) {
      console.error('Error fetching quote requests:', error)
      toast.error('Failed to load quote requests')
    } finally {
      setLoading(false)
    }
  }

  const updateStatus = async (id, newStatus) => {
    try {
      const { error } = await supabase
        .from('quote_requests')
        .update({ 
          status: newStatus,
          updated_at: new Date().toISOString()
        })
        .eq('id', id)

      if (error) throw error

      toast.success(`Status updated to ${newStatus}`)
      fetchQuoteRequests()
    } catch (error) {
      console.error('Error updating status:', error)
      toast.error('Failed to update status')
    }
  }

  const deleteQuoteRequest = async (id) => {
    if (!confirm('Are you sure you want to delete this quote request?')) {
      return
    }

    try {
      const { error } = await supabase
        .from('quote_requests')
        .delete()
        .eq('id', id)

      if (error) throw error

      toast.success('Quote request deleted')
      fetchQuoteRequests()
    } catch (error) {
      console.error('Error deleting quote request:', error)
      toast.error('Failed to delete quote request')
    }
  }

  const getStatusIcon = (status) => {
    switch (status) {
      case 'pending':
        return <Clock className="text-yellow-500" size={16} />
      case 'contacted':
        return <Mail className="text-blue-500" size={16} />
      case 'quoted':
        return <CheckCircle className="text-green-500" size={16} />
      case 'converted':
        return <CheckCircle className="text-green-600" size={16} />
      default:
        return <AlertCircle className="text-gray-500" size={16} />
    }
  }

  const getStatusColor = (status) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30'
      case 'contacted':
        return 'bg-blue-500/20 text-blue-400 border-blue-500/30'
      case 'quoted':
        return 'bg-green-500/20 text-green-400 border-green-500/30'
      case 'converted':
        return 'bg-green-600/20 text-green-300 border-green-600/30'
      default:
        return 'bg-gray-500/20 text-gray-400 border-gray-500/30'
    }
  }

  const filteredRequests = quoteRequests.filter(request => {
    if (filter === 'all') return true
    return request.status === filter
  })

  const stats = {
    total: quoteRequests.length,
    pending: quoteRequests.filter(r => r.status === 'pending').length,
    contacted: quoteRequests.filter(r => r.status === 'contacted').length,
    quoted: quoteRequests.filter(r => r.status === 'quoted').length,
    converted: quoteRequests.filter(r => r.status === 'converted').length
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-electric-blue"></div>
      </div>
    )
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-light-gray">Quote Requests</h1>
            <p className="text-light-gray">Manage customer quote requests</p>
          </div>
          <div className="flex space-x-4">
            <Link to="/admin/quote-archive" className="btn-secondary flex items-center">
              <Archive className="mr-2" size={20} />
              View Archive
            </Link>
            <Link to="/admin/quote-request/new" className="btn-primary flex items-center">
              <Plus className="mr-2" size={20} />
              New Quote Request
            </Link>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-8">
          <div className="bg-navy-dark rounded-lg p-4 border border-electric-blue/30">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-light-gray">Total</p>
                <p className="text-2xl font-bold text-light-gray">{stats.total}</p>
              </div>
              <User className="text-electric-blue" size={24} />
            </div>
          </div>
          
          <div className="bg-navy-dark rounded-lg p-4 border border-yellow-500/30">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-light-gray">Pending</p>
                <p className="text-2xl font-bold text-yellow-400">{stats.pending}</p>
              </div>
              <Clock className="text-yellow-500" size={24} />
            </div>
          </div>
          
          <div className="bg-navy-dark rounded-lg p-4 border border-blue-500/30">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-light-gray">Contacted</p>
                <p className="text-2xl font-bold text-blue-400">{stats.contacted}</p>
              </div>
              <Mail className="text-blue-500" size={24} />
            </div>
          </div>
          
          <div className="bg-navy-dark rounded-lg p-4 border border-green-500/30">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-light-gray">Quoted</p>
                <p className="text-2xl font-bold text-green-400">{stats.quoted}</p>
              </div>
              <CheckCircle className="text-green-500" size={24} />
            </div>
          </div>
          
          <div className="bg-navy-dark rounded-lg p-4 border border-green-600/30">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-light-gray">Converted</p>
                <p className="text-2xl font-bold text-green-300">{stats.converted}</p>
              </div>
              <CheckCircle className="text-green-600" size={24} />
            </div>
          </div>
        </div>

        {/* Filter */}
        <div className="mb-6">
          <div className="flex space-x-2">
            {['all', 'pending', 'contacted', 'quoted', 'converted'].map((status) => (
              <button
                key={status}
                onClick={() => setFilter(status)}
                className={`px-4 py-2 rounded-lg capitalize transition-colors ${
                  filter === status
                    ? 'bg-electric-blue text-white'
                    : 'bg-navy-dark text-light-gray hover:bg-navy-light'
                }`}
              >
                {status}
              </button>
            ))}
          </div>
        </div>

        {/* Quote Requests List */}
        <div className="space-y-4">
          {filteredRequests.length === 0 ? (
            <div className="bg-navy-dark rounded-lg p-8 text-center border border-electric-blue/30">
              <User className="text-light-gray mx-auto mb-4" size={48} />
              <h3 className="text-xl font-semibold text-light-gray mb-2">No quote requests found</h3>
              <p className="text-light-gray mb-4">
                {filter === 'all' 
                  ? 'No quote requests yet. Create your first one!' 
                  : `No ${filter} quote requests found.`
                }
              </p>
              <Link to="/admin/quote-request/new" className="btn-primary">
                <Plus className="inline mr-2" size={20} />
                Create Quote Request
              </Link>
            </div>
          ) : (
            filteredRequests.map((request) => (
              <div key={request.id} className="bg-navy-dark rounded-lg p-6 border border-electric-blue/30">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center mb-4">
                      <h3 className="text-lg font-semibold text-light-gray mr-3">{request.name}</h3>
                      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium border ${getStatusColor(request.status)}`}>
                        {getStatusIcon(request.status)}
                        <span className="ml-1 capitalize">{request.status}</span>
                      </span>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-4">
                      <div className="flex items-center text-light-gray">
                        <Mail className="mr-2" size={16} />
                        {request.email}
                      </div>
                      <div className="flex items-center text-light-gray">
                        <Phone className="mr-2" size={16} />
                        {request.phone}
                      </div>
                      <div className="flex items-center text-light-gray">
                        <MapPin className="mr-2" size={16} />
                        {request.address}
                      </div>
                      <div className="flex items-center text-light-gray">
                        <Car className="mr-2" size={16} />
                        {request.car_year} {request.car_make} {request.car_model}
                      </div>
                      <div className="flex items-center text-light-gray">
                        <User className="mr-2" size={16} />
                        {request.service_type.replace('_', ' ')}
                      </div>
                      <div className="flex items-center text-light-gray">
                        <Calendar className="mr-2" size={16} />
                        {new Date(request.created_at).toLocaleDateString()}
                      </div>
                    </div>
                    
                    {request.notes && (
                      <div className="mb-4">
                        <p className="text-sm text-light-gray">
                          <strong>Notes:</strong> {request.notes}
                        </p>
                      </div>
                    )}
                  </div>
                  
                  <div className="flex space-x-2 ml-4">
                    <select
                      value={request.status}
                      onChange={(e) => updateStatus(request.id, e.target.value)}
                      className="px-3 py-1 bg-navy-deep border border-electric-blue/30 rounded text-light-gray text-sm focus:outline-none focus:border-electric-blue"
                    >
                      <option value="pending">Pending</option>
                      <option value="contacted">Contacted</option>
                      <option value="quoted">Quoted</option>
                      <option value="converted">Converted</option>
                    </select>
                    
                    <button
                      onClick={() => deleteQuoteRequest(request.id)}
                      className="px-3 py-1 bg-red-500/20 text-red-400 border border-red-500/30 rounded hover:bg-red-500/30 transition-colors text-sm"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
    </div>
  )
}

export default QuoteRequests
