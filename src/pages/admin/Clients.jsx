import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import { Search, Plus, Eye, Mail, Phone, DollarSign } from 'lucide-react'
import toast from 'react-hot-toast'

function Clients() {
  const [clients, setClients] = useState([])
  const [filteredClients, setFilteredClients] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')

  useEffect(() => {
    loadClients()
  }, [])

  useEffect(() => {
    filterClients()
  }, [searchTerm, clients])

  const loadClients = async () => {
    try {
      console.log('Clients: Loading data...')
      
      let clients = []
      
      try {
        const { data, error } = await supabase
          .from('clients')
          .select(`
            *,
            vehicles (count)
          `)
          .order('created_at', { ascending: false })

        if (error) throw error
        
        // Deduplicate clients by user_id and email, keeping the earliest created record
        const uniqueClients = []
        const seen = new Set()
        
        for (const client of data || []) {
          const key = client.user_id || client.email
          if (!seen.has(key)) {
            seen.add(key)
            uniqueClients.push(client)
          }
        }
        
        clients = uniqueClients
        
        // Calculate total_spent for each client from paid invoices
        for (const client of clients) {
          const { data: invoices, error: invoiceError } = await supabase
            .from('invoices')
            .select('total_charged, total, paid_amount, base_amount')
            .eq('client_id', client.id)
            .eq('status', 'paid')
          
          if (!invoiceError && invoices) {
            const totalSpent = invoices.reduce((sum, invoice) => {
              const amount = parseFloat(invoice.total_charged) || parseFloat(invoice.total) || parseFloat(invoice.paid_amount) || parseFloat(invoice.base_amount) || 0
              return sum + amount
            }, 0)
            client.total_spent = totalSpent.toFixed(2)
          } else {
            client.total_spent = '0.00'
          }
        }
        console.log('Clients: Loaded', clients.length, 'unique clients (from', (data || []).length, 'total records)')
      } catch (err) {
        console.log('Clients: Error loading data, using empty array')
        clients = []
        toast.error('Database error - showing empty list')
      }
      
      setClients(clients)
      setLoading(false)
    } catch (error) {
      console.error('Clients: Critical error:', error)
      setClients([])
      setLoading(false)
    }
  }

  const filterClients = () => {
    if (!searchTerm) {
      setFilteredClients(clients)
      return
    }

    const filtered = clients.filter(c =>
      c.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.phone?.includes(searchTerm)
    )
    setFilteredClients(filtered)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-electric-blue"></div>
      </div>
    )
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-4xl font-bold metallic-heading mb-2">Clients</h1>
          <p className="text-light-gray text-sm sm:text-base">Manage customer information</p>
        </div>
        <Link to="/admin/clients/new" className="btn-primary">
          <Plus size={20} className="inline mr-2" />
          Add Client
        </Link>
      </div>

      <div className="glass-card">
        <div className="mb-4 sm:mb-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-light-gray" size={20} />
            <input
              type="text"
              placeholder="Search clients..."
              className="w-full pl-10 pr-4 py-2 rounded-lg bg-navy-dark border border-electric-blue/20 focus:outline-none focus:border-electric-blue text-metallic-silver"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 sm:gap-6">
          {filteredClients.map((client) => (
            <div key={client.id} className="bg-navy-dark/50 border border-electric-blue/20 rounded-lg p-4 sm:p-6 hover:border-electric-blue transition-all">
              <div className="flex justify-between items-start mb-4">
                <div className="flex-1 min-w-0">
                  <h3 className="text-lg sm:text-xl font-bold metallic-heading truncate">{client.full_name}</h3>
                  <p className="text-sm text-light-gray">
                    {client.total_bookings || 0} bookings
                  </p>
                </div>
                <Link
                  to={`/admin/clients/${client.id}`}
                  className="text-electric-blue hover:text-bright-cyan transition-colors flex-shrink-0 ml-2"
                >
                  <Eye size={20} />
                </Link>
              </div>
              <div className="space-y-2 text-sm text-light-gray">
                {client.email && (
                  <div className="flex items-center space-x-2">
                    <Mail size={16} className="flex-shrink-0" />
                    <span className="truncate">{client.email}</span>
                  </div>
                )}
                {client.phone && (
                  <div className="flex items-center space-x-2">
                    <Phone size={16} className="flex-shrink-0" />
                    <span className="truncate">{client.phone}</span>
                  </div>
                )}
              </div>
              <div className="pt-4 border-t border-electric-blue/20">
                <div className="flex justify-between items-center">
                  <span className="text-light-gray text-sm">Total Spent</span>
                  <span className="text-bright-cyan font-bold flex items-center">
                    <DollarSign size={16} />
                    {client.total_spent || 0}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>

        {filteredClients.length === 0 && (
          <div className="text-center py-12">
            <p className="text-light-gray">No clients found</p>
          </div>
        )}
      </div>
    </div>
  )
}

export default Clients
