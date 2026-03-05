import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { MessageSquare, Mail, Phone, Send, Search, User, Clock, CheckCircle, AlertCircle } from 'lucide-react'
import { supabase } from '../../lib/supabase'

function Messages() {
  const [messages, setMessages] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [typeFilter, setTypeFilter] = useState('all')

  useEffect(() => {
    fetchMessages()
  }, [])

  const fetchMessages = async () => {
    try {
      const { data, error } = await supabase
        .from('communications')
        .select(`
          *,
          clients:client_id(id, full_name, email, phone)
        `)
        .order('created_at', { ascending: false })
        .limit(50)

      if (error) throw error
      setMessages(data || [])
    } catch (error) {
      console.error('Error fetching messages:', error)
    } finally {
      setLoading(false)
    }
  }

  const filteredMessages = messages.filter(message => {
    const matchesSearch = 
      message.subject?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      message.content?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      message.clients?.full_name?.toLowerCase().includes(searchTerm.toLowerCase())
    
    const matchesStatus = statusFilter === 'all' || message.status === statusFilter
    const matchesType = typeFilter === 'all' || message.communication_type === typeFilter
    
    return matchesSearch && matchesStatus && matchesType
  })

  const getMessageIcon = (type) => {
    switch (type) {
      case 'email':
        return <Mail size={16} className="text-blue-400" />
      case 'sms':
        return <MessageSquare size={16} className="text-green-400" />
      case 'phone':
        return <Phone size={16} className="text-purple-400" />
      default:
        return <Send size={16} className="text-gray-400" />
    }
  }

  const getStatusIcon = (status) => {
    switch (status) {
      case 'sent':
        return <CheckCircle size={16} className="text-green-400" />
      case 'failed':
        return <AlertCircle size={16} className="text-red-400" />
      case 'pending':
        return <Clock size={16} className="text-yellow-400" />
      default:
        return <Clock size={16} className="text-gray-400" />
    }
  }

  const statusColors = {
    sent: 'bg-green-500/20 text-green-400',
    failed: 'bg-red-500/20 text-red-400',
    pending: 'bg-yellow-500/20 text-yellow-400',
    delivered: 'bg-blue-500/20 text-blue-400'
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-electric-blue"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-light-gray">Messages</h1>
          <p className="text-light-gray">View and manage client communications</p>
        </div>
        <button className="btn-primary flex items-center space-x-2">
          <Send size={20} />
          <span>New Message</span>
        </button>
      </div>

      {/* Filters */}
      <div className="glass-card p-4">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-light-gray" size={16} />
              <input
                type="text"
                placeholder="Search messages..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-navy-light border border-navy rounded-lg text-light-gray placeholder-light-gray focus:outline-none focus:border-electric-blue"
              />
            </div>
          </div>
          
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="px-4 py-2 bg-navy-light border border-navy rounded-lg text-light-gray focus:outline-none focus:border-electric-blue"
          >
            <option value="all">All Types</option>
            <option value="email">Email</option>
            <option value="sms">SMS</option>
            <option value="phone">Phone</option>
            <option value="system">System</option>
          </select>
          
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-4 py-2 bg-navy-light border border-navy rounded-lg text-light-gray focus:outline-none focus:border-electric-blue"
          >
            <option value="all">All Status</option>
            <option value="sent">Sent</option>
            <option value="delivered">Delivered</option>
            <option value="pending">Pending</option>
            <option value="failed">Failed</option>
          </select>
        </div>
      </div>

      {/* Messages List */}
      <div className="space-y-4">
        {filteredMessages.map((message) => (
          <div key={message.id} className="glass-card p-6 hover:bg-navy-light/30 transition-colors">
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-start space-x-3">
                <div className="mt-1">
                  {getMessageIcon(message.communication_type)}
                </div>
                <div className="flex-1">
                  <div className="flex items-center space-x-3 mb-2">
                    <h3 className="font-semibold text-light-gray">
                      {message.subject || 'No Subject'}
                    </h3>
                    <div className="flex items-center space-x-2">
                      {getStatusIcon(message.status)}
                      <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                        statusColors[message.status] || 'bg-gray-500/20 text-gray-400'
                      }`}>
                        {message.status || 'unknown'}
                      </span>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-4 text-sm text-light-gray mb-3">
                    <div className="flex items-center space-x-1">
                      <User size={14} />
                      <span>{message.clients?.full_name || 'Unknown Client'}</span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <Clock size={14} />
                      <span>{new Date(message.created_at).toLocaleDateString()}</span>
                    </div>
                    <span className="capitalize">{message.communication_type}</span>
                    <span className="capitalize">{message.direction}</span>
                  </div>
                  
                  <p className="text-light-gray mb-3 line-clamp-2">
                    {message.content}
                  </p>
                  
                  {message.reference_type && (
                    <div className="text-xs text-light-gray mb-3">
                      Related to: {message.reference_type} {message.reference_id}
                    </div>
                  )}
                </div>
              </div>
            </div>
            
            <div className="flex items-center justify-between pt-3 border-t border-navy-light">
              <div className="text-sm text-light-gray">
                {message.clients?.email && (
                  <span>{message.clients.email}</span>
                )}
                {message.clients?.phone && (
                  <span className="ml-3">{message.clients.phone}</span>
                )}
              </div>
              
              <div className="flex items-center space-x-2">
                <button className="text-electric-blue hover:text-bright-cyan text-sm">
                  Reply
                </button>
                <button className="text-blue-400 hover:text-blue-300 text-sm">
                  Forward
                </button>
                <button className="text-red-400 hover:text-red-300 text-sm">
                  Delete
                </button>
              </div>
            </div>
          </div>
        ))}

        {filteredMessages.length === 0 && (
          <div className="text-center py-12">
            <MessageSquare className="text-electric-blue mx-auto mb-4" size={48} />
            <h3 className="text-lg font-bold text-light-gray mb-2">No Messages Found</h3>
            <p className="text-light-gray mb-4">
              {searchTerm || statusFilter !== 'all' || typeFilter !== 'all' ? 
                'Try adjusting your filters' : 
                'No communications have been recorded yet'
              }
            </p>
            {!searchTerm && statusFilter === 'all' && typeFilter === 'all' && (
              <button className="btn-primary">
                Send First Message
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

export default Messages
