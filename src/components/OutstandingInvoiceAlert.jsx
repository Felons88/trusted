import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { AlertCircle, X } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { useAuthStore } from '../store/authStore'
import toast from 'react-hot-toast'

function OutstandingInvoiceAlert() {
  const [showAlert, setShowAlert] = useState(false)
  const [outstandingInvoices, setOutstandingInvoices] = useState([])
  const [loading, setLoading] = useState(true)
  const [lastChecked, setLastChecked] = useState(null)
  const { user } = useAuthStore()

  useEffect(() => {
    if (user) {
      checkOutstandingInvoices()
    }
  }, [user])

  // Check for new invoices periodically
  useEffect(() => {
    if (!user) return

    const interval = setInterval(() => {
      checkForNewInvoices()
    }, 30000) // Check every 30 seconds

    return () => clearInterval(interval)
  }, [user])

  const checkForNewInvoices = async () => {
    try {
      // Get client ID first
      const { data: clientData } = await supabase
        .from('clients')
        .select('id')
        .eq('user_id', user.id)
      
      if (!clientData || clientData.length === 0) return

      const clientId = clientData[0].id
      
      // Get recent invoices (created in last 5 minutes)
      const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000).toISOString()
      
      const { data: newInvoices, error } = await supabase
        .from('invoices')
        .select('*')
        .eq('client_id', clientId)
        .gte('created_at', fiveMinutesAgo)
        .order('created_at', { ascending: false })

      if (error) throw error

      // Show toast for each new invoice
      if (newInvoices && newInvoices.length > 0) {
        newInvoices.forEach(invoice => {
          // Only show notification if we haven't seen this invoice before
          const invoiceKey = `invoice_${invoice.id}`
          if (!localStorage.getItem(invoiceKey)) {
            toast(`🧾 New invoice ${invoice.invoice_number} - $${invoice.total?.toFixed(2)}`, {
              duration: 5000,
              icon: '📄',
            })
            localStorage.setItem(invoiceKey, 'true')
          }
        })
      }
    } catch (error) {
      console.error('Error checking for new invoices:', error)
    }
  }

  const checkOutstandingInvoices = async () => {
    try {
      setLoading(true)
      
      console.log('=== ALERT CHECK START ===')
      console.log('Checking outstanding invoices for user:', user?.id)
      
      if (!user?.id) {
        console.log('No user ID found, skipping check')
        setLoading(false)
        return
      }
      
      // Get client ID first (same logic as ClientInvoices)
      const { data: clientData, error: clientError } = await supabase
        .from('clients')
        .select('id')
        .eq('user_id', user.id)
      
      console.log('Client data found for alert:', clientData)
      console.log('Client error:', clientError)
      
      if (clientError) {
        console.error('Error fetching client data:', clientError)
        setLoading(false)
        return
      }
      
      if (!clientData || clientData.length === 0) {
        console.log('No client found for user in alert')
        setShowAlert(false)
        setLoading(false)
        return
      }

      const clientId = clientData[0].id
      console.log('Using client_id for alert:', clientId)
      
      // Now check for outstanding invoices using the correct client_id
      const { data, error } = await supabase
        .from('invoices')
        .select('*')
        .eq('client_id', clientId)
        .in('status', ['draft', 'sent', 'overdue'])
        .order('due_date', { ascending: true })

      console.log('Invoice error:', error)
      console.log('Outstanding invoices found:', data)
      
      if (error) {
        console.error('Error fetching invoices:', error)
        setLoading(false)
        return
      }
      
      if (data && data.length > 0) {
        console.log('Setting alert to show - found', data.length, 'invoices')
        setOutstandingInvoices(data)
        setShowAlert(true)
      } else {
        console.log('No outstanding invoices, hiding alert')
        setShowAlert(false)
      }
      
      console.log('=== ALERT CHECK END ===')
    } catch (error) {
      console.error('Error checking outstanding invoices:', error)
    } finally {
      setLoading(false)
    }
  }

  const dismissAlert = () => {
    setShowAlert(false)
  }

  if (!showAlert || loading || !user) {
    return null
  }

  const totalDue = outstandingInvoices.reduce((sum, invoice) => sum + (invoice.total || 0), 0)
  const invoiceCount = outstandingInvoices.length

  return (
    <div className="bg-red-500 border-b border-red-600">
      <div className="max-w-7xl mx-auto px-4 py-3">
        <div className="flex items-center justify-between">
          <div className="flex-1 flex items-center justify-center">
            <div className="flex items-center space-x-3">
              <AlertCircle className="text-white" size={20} />
              <div className="text-white">
                <span className="font-medium">
                  {invoiceCount === 1 ? 'You have' : 'You have'} {invoiceCount} unpaid invoice{invoiceCount > 1 ? 's' : ''}
                </span>
                <span className="ml-2 font-bold">
                  (${totalDue.toFixed(2)})
                </span>
                <span className="ml-2 text-red-100">
                  - Please pay to avoid collection actions.
                </span>
              </div>
            </div>
          </div>
          <div className="flex items-center space-x-3">
            <Link
              to="/client-portal/invoices"
              className="bg-white/20 hover:bg-white/30 text-white px-4 py-1 rounded-lg text-sm font-medium transition-colors"
            >
              View Invoices
            </Link>
            <button
              onClick={dismissAlert}
              className="text-white/80 hover:text-white p-1 rounded-lg hover:bg-white/10 transition-colors"
            >
              <X size={18} />
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default OutstandingInvoiceAlert
