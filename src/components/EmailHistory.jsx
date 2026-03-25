import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { format } from 'date-fns'
import { 
  Mail, MailOpen, Clock, AlertCircle, CheckCircle, 
  XCircle, FileText, ExternalLink, Filter, Download
} from 'lucide-react'

function EmailHistory({ clientId, clientUserId }) {
  const [emails, setEmails] = useState([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('all')
  const [expandedEmail, setExpandedEmail] = useState(null)

  useEffect(() => {
    if (clientId || clientUserId) {
      loadEmailHistory()
    }
  }, [clientId, clientUserId, filter])

  const loadEmailHistory = async () => {
    try {
      setLoading(true)
      
      let query = supabase
        .from('email_history')
        .select('*')
        .order('created_at', { ascending: false })

      // Use client_id from clients table if available, otherwise fall back to searching by recipient email
      if (clientId) {
        query = query.eq('client_id', clientId)
      } else if (clientUserId) {
        // Get client's email from auth.users, then search by recipient_email
        const { data: userData } = await supabase.auth.getUser()
        if (userData?.user?.email) {
          query = query.eq('recipient_email', userData.user.email)
        }
      }

      // Apply filter
      if (filter !== 'all') {
        query = query.eq('status', filter)
      }

      const { data, error } = await query

      if (error) throw error
      setEmails(data || [])
    } catch (error) {
      console.error('Error loading email history:', error)
    } finally {
      setLoading(false)
    }
  }

  const getStatusIcon = (status) => {
    switch (status) {
      case 'sent':
        return <CheckCircle className="text-green-400" size={16} />
      case 'failed':
        return <XCircle className="text-red-400" size={16} />
      case 'pending':
        return <Clock className="text-yellow-400" size={16} />
      case 'bounced':
        return <AlertCircle className="text-orange-400" size={16} />
      case 'delivered':
        return <MailOpen className="text-blue-400" size={16} />
      default:
        return <Mail className="text-gray-400" size={16} />
    }
  }

  const getStatusColor = (status) => {
    switch (status) {
      case 'sent':
        return 'bg-green-500/20 text-green-400 border-green-500/30'
      case 'failed':
        return 'bg-red-500/20 text-red-400 border-red-500/30'
      case 'pending':
        return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30'
      case 'bounced':
        return 'bg-orange-500/20 text-orange-400 border-orange-500/30'
      case 'delivered':
        return 'bg-blue-500/20 text-blue-400 border-blue-500/30'
      default:
        return 'bg-gray-500/20 text-gray-400 border-gray-500/30'
    }
  }

  const formatDate = (dateString) => {
    return format(new Date(dateString), 'MMM dd, yyyy h:mm a')
  }

  const getTemplateDisplayName = (templateKey) => {
    const names = {
      'booking_confirmed': 'Booking Confirmed',
      'booking_canceled': 'Booking Canceled',
      'booking_completed': 'Service Completed',
      'booking_pending_reminder': 'Booking Reminder',
      'quote_received': 'Quote Request Received',
      'quote_ready': 'Quote Ready',
      'payment_successful': 'Payment Successful',
      'payment_failed': 'Payment Failed',
      'invoice_sent': 'Invoice Sent',
      'welcome_email': 'Welcome Email',
      'appointment_reminder': 'Appointment Reminder',
      'review_request': 'Review Request'
    }
    return names[templateKey] || templateKey
  }

  const handleResendEmail = async (email) => {
    try {
      // This would require implementing a resend function
      console.log('Resend email:', email.id)
      // For now, just show a message
      alert('Resend functionality coming soon!')
    } catch (error) {
      console.error('Error resending email:', error)
    }
  }

  const handleViewEmail = (email) => {
    setExpandedEmail(expandedEmail?.id === email.id ? null : email)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-electric-blue"></div>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-white">Email History</h3>
        <div className="flex items-center space-x-2">
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="bg-navy-dark border border-electric-blue/30 rounded-lg px-3 py-2 text-sm text-light-gray focus:outline-none focus:border-electric-blue"
          >
            <option value="all">All Emails</option>
            <option value="sent">Sent</option>
            <option value="failed">Failed</option>
            <option value="pending">Pending</option>
            <option value="delivered">Delivered</option>
            <option value="bounced">Bounced</option>
          </select>
        </div>
      </div>

      {/* Email List */}
      <div className="space-y-3">
        {emails.length === 0 ? (
          <div className="text-center py-8 text-light-gray">
            <Mail className="mx-auto mb-4 text-gray-400" size={48} />
            <p>No emails found</p>
          </div>
        ) : (
          emails.map((email) => (
            <div key={email.id} className="bg-navy-dark/50 border border-navy-dark rounded-lg overflow-hidden">
              {/* Email Header */}
              <div 
                className="flex items-center justify-between p-4 cursor-pointer hover:bg-navy-dark/70 transition-colors"
                onClick={() => handleViewEmail(email)}
              >
                <div className="flex items-center space-x-3">
                  {getStatusIcon(email.status)}
                  <div>
                    <p className="font-medium text-white">{email.template_name}</p>
                    <p className="text-sm text-light-gray">{email.subject}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm text-light-gray">{formatDate(email.created_at)}</p>
                  <p className="text-xs text-gray-400">{getTemplateDisplayName(email.template_key)}</p>
                </div>
              </div>

              {/* Expanded Email Content */}
              {expandedEmail?.id === email.id && (
                <div className="border-t border-navy-dark p-4 space-y-4">
                  {/* Email Details */}
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-gray-400">To:</span>
                      <p className="text-light-gray">{email.recipient_email}</p>
                    </div>
                    <div>
                      <span className="text-gray-400">Status:</span>
                      <div className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-semibold border ${getStatusColor(email.status)}`}>
                        {getStatusIcon(email.status)}
                        <span className="ml-1 capitalize">{email.status}</span>
                      </div>
                    </div>
                    <div>
                      <span className="text-gray-400">Sent:</span>
                      <p className="text-light-gray">{email.sent_at ? formatDate(email.sent_at) : 'Not sent'}</p>
                    </div>
                    <div>
                      <span className="text-gray-400">Delivered:</span>
                      <p className="text-light-gray">{email.delivered_at ? formatDate(email.delivered_at) : 'Not delivered'}</p>
                    </div>
                  </div>

                  {/* Error Message */}
                  {email.error_message && (
                    <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-3">
                      <p className="text-sm text-red-400">
                        <strong>Error:</strong> {email.error_message}
                      </p>
                    </div>
                  )}

                  {/* Email Actions */}
                  <div className="flex items-center space-x-2 pt-2">
                    <button
                      onClick={() => handleResendEmail(email)}
                      className="flex items-center space-x-1 px-3 py-1 bg-electric-blue/20 text-electric-blue border border-electric-blue/30 rounded text-sm hover:bg-electric-blue/30 transition-colors"
                    >
                      <Mail size={14} />
                      <span>Resend</span>
                    </button>
                    {email.html_content && (
                      <a
                        href="#"
                        onClick={(e) => {
                          e.preventDefault()
                          // Create a new window with the email content
                          const newWindow = window.open('', '_blank')
                          newWindow.document.write(email.html_content)
                          newWindow.document.close()
                        }}
                        className="flex items-center space-x-1 px-3 py-1 bg-navy-dark/50 text-light-gray border border-navy-dark rounded text-sm hover:bg-navy-dark transition-colors"
                      >
                        <ExternalLink size={14} />
                        <span>View</span>
                      </a>
                    )}
                  </div>
                </div>
              )}
            </div>
          ))
        )}
      </div>

      {/* Stats Summary */}
      {emails.length > 0 && (
        <div className="bg-navy-dark/50 border border-navy-dark rounded-lg p-4">
          <h4 className="text-sm font-medium text-light-gray mb-3">Email Statistics</h4>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div className="text-center">
              <p className="text-2xl font-bold text-green-400">{emails.filter(e => e.status === 'sent').length}</p>
              <p className="text-xs text-gray-400">Sent</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-red-400">{emails.filter(e => e.status === 'failed').length}</p>
              <p className="text-xs text-gray-400">Failed</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-blue-400">{emails.filter(e => e.status === 'delivered').length}</p>
              <p className="text-xs text-gray-400">Delivered</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-gray-400">{emails.length}</p>
              <p className="text-xs text-gray-400">Total</p>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default EmailHistory
