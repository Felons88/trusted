import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import { 
  User, Car, Mail, Phone, MapPin, Calendar, Archive, 
  ArrowLeft, Download, Search, Filter 
} from 'lucide-react'
import toast from 'react-hot-toast'

function QuoteArchive() {
  const [archivedQuotes, setArchivedQuotes] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterYear, setFilterYear] = useState('')

  useEffect(() => {
    fetchArchivedQuotes()
  }, [searchTerm, filterYear])

  const fetchArchivedQuotes = async () => {
    try {
      setLoading(true)
      let query = supabase
        .from('quote_archive')
        .select('*')
        .order('converted_at', { ascending: false })

      // Apply search filter
      if (searchTerm) {
        query = query.or(`name.ilike.%${searchTerm}%,email.ilike.%${searchTerm}%,car_make.ilike.%${searchTerm}%,car_model.ilike.%${searchTerm}%`)
      }

      // Apply year filter
      if (filterYear) {
        query = query.eq('car_year', filterYear)
      }

      const { data, error } = await query

      if (error) throw error
      setArchivedQuotes(data || [])
    } catch (error) {
      console.error('Error fetching archived quotes:', error)
      toast.error('Failed to load archived quotes')
    } finally {
      setLoading(false)
    }
  }

  const restoreQuote = async (archivedQuote) => {
    if (!confirm('Are you sure you want to restore this quote to the active list?')) {
      return
    }

    try {
      // Insert back into quote_requests table
      const { error: insertError } = await supabase
        .from('quote_requests')
        .insert({
          name: archivedQuote.name,
          email: archivedQuote.email,
          phone: archivedQuote.phone,
          car_make: archivedQuote.car_make,
          car_model: archivedQuote.car_model,
          car_year: archivedQuote.car_year,
          address: archivedQuote.address,
          service_type: archivedQuote.service_type,
          notes: archivedQuote.notes,
          status: 'pending', // Reset to pending when restored
          created_at: archivedQuote.original_created_at,
          updated_at: new Date().toISOString()
        })

      if (insertError) throw insertError

      // Delete from archive
      const { error: deleteError } = await supabase
        .from('quote_archive')
        .delete()
        .eq('id', archivedQuote.id)

      if (deleteError) throw deleteError

      toast.success('Quote restored successfully!')
      fetchArchivedQuotes()
    } catch (error) {
      console.error('Error restoring quote:', error)
      toast.error('Failed to restore quote')
    }
  }

  const deleteArchivedQuote = async (id) => {
    if (!confirm('Are you sure you want to permanently delete this archived quote?')) {
      return
    }

    try {
      const { error } = await supabase
        .from('quote_archive')
        .delete()
        .eq('id', id)

      if (error) throw error

      toast.success('Archived quote deleted permanently')
      fetchArchivedQuotes()
    } catch (error) {
      console.error('Error deleting archived quote:', error)
      toast.error('Failed to delete archived quote')
    }
  }

  const exportToCSV = () => {
    const headers = ['Name', 'Email', 'Phone', 'Car', 'Service', 'Converted Date', 'Original Date']
    const csvData = archivedQuotes.map(quote => [
      quote.name,
      quote.email,
      quote.phone,
      `${quote.car_year} ${quote.car_make} ${quote.car_model}`,
      quote.service_type.replace('_', ' '),
      new Date(quote.converted_at).toLocaleDateString(),
      new Date(quote.original_created_at).toLocaleDateString()
    ])

    const csv = [headers, ...csvData].map(row => row.join(',')).join('\n')
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `quote_archive_${new Date().toISOString().split('T')[0]}.csv`
    a.click()
    window.URL.revokeObjectURL(url)
  }

  const filteredQuotes = archivedQuotes.filter(quote => {
    const matchesSearch = !searchTerm || 
      quote.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      quote.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      quote.car_make.toLowerCase().includes(searchTerm.toLowerCase()) ||
      quote.car_model.toLowerCase().includes(searchTerm.toLowerCase())
    
    const matchesYear = !filterYear || quote.car_year === filterYear
    
    return matchesSearch && matchesYear
  })

  const uniqueYears = [...new Set(archivedQuotes.map(q => q.car_year))].sort()

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
        <div className="flex items-center">
          <Link to="/admin/quote-requests" className="text-electric-blue hover:text-bright-cyan flex items-center mr-6">
            <ArrowLeft className="mr-2" size={20} />
            Back to Quotes
          </Link>
          <div>
            <h1 className="text-3xl font-bold text-light-gray flex items-center">
              <Archive className="mr-3" size={32} />
              Quote Archive
            </h1>
            <p className="text-light-gray">Converted and archived quote requests</p>
          </div>
        </div>
        <div className="flex space-x-4">
          <button
            onClick={exportToCSV}
            className="btn-secondary flex items-center"
            disabled={archivedQuotes.length === 0}
          >
            <Download className="mr-2" size={20} />
            Export CSV
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="bg-navy-dark rounded-lg p-6 border border-electric-blue/30 mb-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="text-center">
            <div className="text-3xl font-bold text-electric-blue">{archivedQuotes.length}</div>
            <div className="text-sm text-light-gray">Total Archived</div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold text-green-400">
              {archivedQuotes.filter(q => {
                const monthAgo = new Date()
                monthAgo.setMonth(monthAgo.getMonth() - 1)
                return new Date(q.converted_at) > monthAgo
              }).length}
            </div>
            <div className="text-sm text-light-gray">This Month</div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold text-yellow-400">
              {uniqueYears.length}
            </div>
            <div className="text-sm text-light-gray">Vehicle Years</div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold text-purple-400">
              {[...new Set(archivedQuotes.map(q => q.car_make))].length}
            </div>
            <div className="text-sm text-light-gray">Car Makes</div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-navy-dark rounded-lg p-4 border border-electric-blue/30 mb-8">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-light-gray" size={20} />
              <input
                type="text"
                placeholder="Search by name, email, or vehicle..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-navy-deep border border-electric-blue/30 rounded-lg text-light-gray focus:outline-none focus:border-electric-blue"
              />
            </div>
          </div>
          <div className="md:w-48">
            <select
              value={filterYear}
              onChange={(e) => setFilterYear(e.target.value)}
              className="w-full px-4 py-2 bg-navy-deep border border-electric-blue/30 rounded-lg text-light-gray focus:outline-none focus:border-electric-blue"
            >
              <option value="">All Years</option>
              {uniqueYears.map(year => (
                <option key={year} value={year}>{year}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Archived Quotes List */}
      <div className="space-y-4">
        {filteredQuotes.length === 0 ? (
          <div className="bg-navy-dark rounded-lg p-8 text-center border border-electric-blue/30">
            <Archive className="text-light-gray mx-auto mb-4" size={48} />
            <h3 className="text-xl font-semibold text-light-gray mb-2">No archived quotes found</h3>
            <p className="text-light-gray mb-4">
              {searchTerm || filterYear 
                ? 'No quotes match your search criteria.' 
                : 'Converted quotes will appear here automatically.'
              }
            </p>
            {(searchTerm || filterYear) && (
              <button
                onClick={() => {
                  setSearchTerm('')
                  setFilterYear('')
                }}
                className="btn-secondary"
              >
                Clear Filters
              </button>
            )}
          </div>
        ) : (
          filteredQuotes.map((quote) => (
            <div key={quote.id} className="bg-navy-dark rounded-lg p-6 border border-electric-blue/30">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center mb-4">
                    <h3 className="text-lg font-semibold text-light-gray mr-3">{quote.name}</h3>
                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-500/20 text-green-400 border border-green-500/30">
                      Converted
                    </span>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-4">
                    <div className="flex items-center text-light-gray">
                      <Mail className="mr-2" size={16} />
                      {quote.email}
                    </div>
                    <div className="flex items-center text-light-gray">
                      <Phone className="mr-2" size={16} />
                      {quote.phone}
                    </div>
                    <div className="flex items-center text-light-gray">
                      <MapPin className="mr-2" size={16} />
                      {quote.address}
                    </div>
                    <div className="flex items-center text-light-gray">
                      <Car className="mr-2" size={16} />
                      {quote.car_year} {quote.car_make} {quote.car_model}
                    </div>
                    <div className="flex items-center text-light-gray">
                      <User className="mr-2" size={16} />
                      {quote.service_type.replace('_', ' ')}
                    </div>
                    <div className="flex items-center text-light-gray">
                      <Calendar className="mr-2" size={16} />
                      Converted: {new Date(quote.converted_at).toLocaleDateString()}
                    </div>
                  </div>
                  
                  {quote.notes && (
                    <div className="mb-4">
                      <p className="text-sm text-light-gray">
                        <strong>Notes:</strong> {quote.notes}
                      </p>
                    </div>
                  )}
                  
                  <div className="text-xs text-light-gray">
                    Originally requested: {new Date(quote.original_created_at).toLocaleDateString()}
                  </div>
                </div>
                
                <div className="flex space-x-2 ml-4">
                  <button
                    onClick={() => restoreQuote(quote)}
                    className="px-3 py-1 bg-blue-500/20 text-blue-400 border border-blue-500/30 rounded hover:bg-blue-500/30 transition-colors text-sm"
                  >
                    Restore
                  </button>
                  
                  <button
                    onClick={() => deleteArchivedQuote(quote.id)}
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

export default QuoteArchive
