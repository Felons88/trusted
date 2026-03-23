import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, Save, Plus, Trash2, User, Car, FileText } from 'lucide-react'
import { supabase } from '../../lib/supabase'
import toast from 'react-hot-toast'

function NewInvoice() {
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [clients, setClients] = useState([])
  const [vehicles, setVehicles] = useState([])
  const [services, setServices] = useState([])
  const [selectedClient, setSelectedClient] = useState('')
  const [selectedVehicle, setSelectedVehicle] = useState('')
  const [selectedServices, setSelectedServices] = useState([])
  const [invoiceNumber, setInvoiceNumber] = useState('')
  const [dueDate, setDueDate] = useState('')
  const [notes, setNotes] = useState('')
  const navigate = useNavigate()

  useEffect(() => {
    fetchClients()
    fetchVehicles()
    fetchServices()
    generateInvoiceNumber()
  }, [])

  const fetchClients = async () => {
    try {
      const { data, error } = await supabase
        .from('clients')
        .select('id, full_name, email')
        .order('full_name')

      if (error) throw error
      setClients(data || [])
    } catch (error) {
      console.error('Error fetching clients:', error)
    }
  }

  const fetchVehicles = async () => {
    try {
      const { data, error } = await supabase
        .from('vehicles')
        .select('id, make, model, year, license_plate')
        .order('make, model')

      if (error) throw error
      setVehicles(data || [])
    } catch (error) {
      console.error('Error fetching vehicles:', error)
    }
  }

  const fetchServices = async () => {
    try {
      const { data, error } = await supabase
        .from('services')
        .select('id, name, price')
        .order('name')

      if (error) throw error
      setServices(data || [])
    } catch (error) {
      console.error('Error fetching services:', error)
    }
  }

  const generateInvoiceNumber = () => {
    const date = new Date()
    const year = date.getFullYear()
    const month = String(date.getMonth() + 1).padStart(2, '0')
    const random = Math.floor(Math.random() * 1000)
    setInvoiceNumber(`INV-${year}${month}-${random}`)
  }

  const addService = (serviceId) => {
    const service = services.find(s => s.id === serviceId)
    if (service && !selectedServices.find(s => s.id === serviceId)) {
      setSelectedServices([...selectedServices, { ...service, quantity: 1 }])
    }
  }

  const removeService = (serviceId) => {
    setSelectedServices(selectedServices.filter(s => s.id !== serviceId))
  }

  const updateServiceQuantity = (serviceId, quantity) => {
    setSelectedServices(selectedServices.map(s => 
      s.id === serviceId ? { ...s, quantity: Math.max(1, quantity) } : s
    ))
  }

  const calculateTotal = () => {
    return selectedServices.reduce((total, service) => {
      return total + (service.price * service.quantity)
    }, 0)
  }

  const handleSave = async () => {
    if (!selectedClient || !invoiceNumber) {
      toast.error('Please select a client and enter invoice number')
      return
    }

    setSaving(true)
    try {
      // Create invoice
      const { data: invoice, error: invoiceError } = await supabase
        .from('invoices')
        .insert({
          client_id: selectedClient,
          invoice_number: invoiceNumber,
          due_date: dueDate || new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          status: 'draft',
          total: calculateTotal(),
          notes: notes
        })
        .select()
        .single()

      if (invoiceError) throw invoiceError

      // Create invoice items
      const items = selectedServices.map(service => ({
        invoice_id: invoice.id,
        service_id: service.id,
        description: service.name,
        quantity: service.quantity,
        unit_price: service.price
      }))

      const { error: itemsError } = await supabase
        .from('invoice_items')
        .insert(items)

      if (itemsError) throw itemsError

      toast.success('Invoice created successfully')
      navigate(`/admin/invoices/${invoice.id}`)
    } catch (error) {
      console.error('Error creating invoice:', error)
      toast.error('Failed to create invoice')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-electric-blue border-t-transparent"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-navy-deep p-4 sm:p-6 lg:p-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center space-x-4">
            <button
              onClick={() => navigate('/admin/invoices')}
              className="text-metallic-silver hover:text-electric-blue transition-colors flex items-center space-x-2"
            >
              <ArrowLeft size={20} />
              <span>Back to Invoices</span>
            </button>
            <h1 className="text-3xl font-bold text-light-gray">New Invoice</h1>
          </div>
          <button
            onClick={handleSave}
            disabled={saving}
            className="btn-primary flex items-center space-x-2"
          >
            <Save size={20} />
            <span>{saving ? 'Saving...' : 'Create Invoice'}</span>
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Client Selection */}
          <div className="glass-card p-6">
            <h2 className="text-xl font-semibold text-white mb-4 flex items-center">
              <User size={20} className="mr-2" />
              Client
            </h2>
            <select
              value={selectedClient}
              onChange={(e) => setSelectedClient(e.target.value)}
              className="w-full px-4 py-2 bg-navy-light border border-navy rounded-lg text-light-gray focus:outline-none focus:border-electric-blue"
            >
              <option value="">Select a client...</option>
              {clients.map(client => (
                <option key={client.id} value={client.id}>
                  {client.full_name} ({client.email})
                </option>
              ))}
            </select>
          </div>

          {/* Vehicle Selection */}
          <div className="glass-card p-6">
            <h2 className="text-xl font-semibold text-white mb-4 flex items-center">
              <Car size={20} className="mr-2" />
              Vehicle
            </h2>
            <select
              value={selectedVehicle}
              onChange={(e) => setSelectedVehicle(e.target.value)}
              className="w-full px-4 py-2 bg-navy-light border border-navy rounded-lg text-light-gray focus:outline-none focus:border-electric-blue"
            >
              <option value="">Select a vehicle...</option>
              {vehicles.map(vehicle => (
                <option key={vehicle.id} value={vehicle.id}>
                  {vehicle.year} {vehicle.make} {vehicle.model} ({vehicle.license_plate})
                </option>
              ))}
            </select>
          </div>

          {/* Invoice Details */}
          <div className="glass-card p-6">
            <h2 className="text-xl font-semibold text-white mb-4 flex items-center">
              <FileText size={20} className="mr-2" />
              Invoice Details
            </h2>
            <div className="space-y-4">
              <div>
                <label className="block text-light-gray mb-2">Invoice Number</label>
                <input
                  type="text"
                  value={invoiceNumber}
                  onChange={(e) => setInvoiceNumber(e.target.value)}
                  className="w-full px-4 py-2 bg-navy-light border border-navy rounded-lg text-light-gray focus:outline-none focus:border-electric-blue"
                  placeholder="INV-2024-001"
                />
              </div>
              <div>
                <label className="block text-light-gray mb-2">Due Date</label>
                <input
                  type="date"
                  value={dueDate}
                  onChange={(e) => setDueDate(e.target.value)}
                  className="w-full px-4 py-2 bg-navy-light border border-navy rounded-lg text-light-gray focus:outline-none focus:border-electric-blue"
                />
              </div>
              <div>
                <label className="block text-light-gray mb-2">Notes</label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full px-4 py-2 bg-navy-light border border-navy rounded-lg text-light-gray focus:outline-none focus:border-electric-blue"
                  rows="4"
                  placeholder="Additional notes..."
                />
              </div>
            </div>
          </div>
        </div>

        {/* Services Selection */}
        <div className="glass-card p-6">
          <h2 className="text-xl font-semibold text-white mb-4 flex items-center">
            <Plus size={20} className="mr-2" />
            Services
          </h2>
          <div className="space-y-4 max-h-96 overflow-y-auto">
            {services.map(service => (
              <div key={service.id} className="flex items-center justify-between p-3 bg-navy-light rounded-lg">
                <div className="flex-1">
                  <p className="text-white font-medium">{service.name}</p>
                  <p className="text-electric-blue">${service.price.toFixed(2)}</p>
                </div>
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => updateServiceQuantity(service.id, (selectedServices.find(s => s.id === service.id)?.quantity || 1) - 1)}
                    className="text-red-400 hover:text-red-300 transition-colors"
                  >
                    <Trash2 size={16} />
                  </button>
                  <input
                    type="number"
                    min="1"
                    value={selectedServices.find(s => s.id === service.id)?.quantity || 1}
                    onChange={(e) => updateServiceQuantity(service.id, parseInt(e.target.value))}
                    className="w-20 px-2 py-1 bg-navy-light border border-navy rounded text-light-gray focus:outline-none focus:border-electric-blue"
                  />
                  <button
                    onClick={() => addService(service.id)}
                    className="text-green-400 hover:text-green-300 transition-colors"
                  >
                    <Plus size={16} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Invoice Summary */}
        <div className="glass-card p-6">
          <h2 className="text-xl font-semibold text-white mb-4">Invoice Summary</h2>
          <div className="space-y-2">
            {selectedServices.map(service => (
              <div key={service.id} className="flex justify-between items-center p-2 bg-navy-light rounded">
                <span className="text-light-gray">{service.name} x {service.quantity}</span>
                <span className="text-electric-blue">${(service.price * service.quantity).toFixed(2)}</span>
              </div>
            ))}
            <div className="border-t border-electric-blue/20 pt-2 mt-4">
              <div className="flex justify-between items-center">
                <span className="text-lg font-bold text-white">Total:</span>
                <span className="text-xl font-bold text-electric-blue">${calculateTotal().toFixed(2)}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default NewInvoice
