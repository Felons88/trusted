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
        clients = data || []
        console.log('Clients: Loaded', clients.length, 'clients')
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
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-4xl font-bold metallic-heading mb-2">Clients</h1>
          <p className="text-light-gray">Manage customer information</p>
        </div>
        <Link to="/admin/clients/new" className="btn-primary">
          <Plus size={20} className="inline mr-2" />
          Add Client
        </Link>
      </div>

      <div className="glass-card">
        <div className="mb-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-light-gray" size={20} />
            <input
              type="text"
              placeholder="Search by name, email, or phone..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="admin-input pl-10"
            />
          </div>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredClients.map((client) => (
            <div key={client.id} className="bg-navy-dark/50 border border-electric-blue/20 rounded-lg p-6 hover:border-electric-blue transition-all">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="text-xl font-bold metallic-heading">{client.full_name}</h3>
                  <p className="text-sm text-light-gray">
                    {client.total_bookings || 0} bookings
                  </p>
                </div>
                <Link
                  to={`/admin/clients/${client.id}`}
                  className="text-electric-blue hover:text-bright-cyan transition-colors"
                >
                  <Eye size={20} />
                </Link>
              </div>

              <div className="space-y-2 mb-4">
                <div className="flex items-center text-light-gray text-sm">
                  <Mail size={16} className="mr-2 text-electric-blue" />
                  {client.email}
                </div>
                <div className="flex items-center text-light-gray text-sm">
                  <Phone size={16} className="mr-2 text-electric-blue" />
                  {client.phone}
                </div>
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
