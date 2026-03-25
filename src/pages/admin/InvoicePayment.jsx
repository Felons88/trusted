import React, { useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import toast from 'react-hot-toast'

function InvoicePayment() {
  const { id } = useParams()
  const navigate = useNavigate()

  useEffect(() => {
    // Redirect to the existing working payment page
    if (id) {
      navigate(`/payment/${id}`, { replace: true })
    } else {
      toast.error('No invoice ID provided')
      navigate('/client-portal/invoices', { replace: true })
    }
  }, [id, navigate])

  // Show loading while redirecting
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-500 mx-auto mb-4"></div>
        <p className="text-gray-400">Redirecting to payment page...</p>
      </div>
    </div>
  )
}

export default InvoicePayment
