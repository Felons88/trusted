import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, Save, Plus, Trash2, User, Car, FileText, DollarSign, Calendar, Edit3, Check } from 'lucide-react'
import { supabase } from '../../lib/supabase'
import toast from 'react-hot-toast'

function NewInvoice() {
  const [loading, setLoading] = useState(true)
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
    const loadData = async () => {
      try {
        await Promise.all([
          fetchClients(),
          fetchServices()
        ])
        generateInvoiceNumber()
      } catch (error) {
        console.error('Error loading initial data:', error)
      } finally {
        setLoading(false)
      }
    }
    
    loadData()
  }, [])

  useEffect(() => {
    fetchVehicles()
    // Clear selected vehicle if it's not in the filtered list
    if (selectedVehicle && selectedClient) {
      setSelectedVehicle('')
    }
  }, [selectedClient])

  const fetchClients = async () => {
    try {
      console.log('Fetching clients...')
      const { data, error } = await supabase
        .from('clients')
        .select('id, full_name, email, phone, address')
        .order('full_name')

      if (error) {
        console.error('Client fetch error:', error)
        throw error
      }
      
      console.log('Clients fetched:', data?.length || 0, 'clients')
      setClients(data || [])
    } catch (error) {
      console.error('Error fetching clients:', error)
      setClients([]) // Ensure clients is set to empty array on error
    }
  }

  const fetchVehicles = async () => {
    try {
      let query = supabase.from('vehicles').select('id, make, model, year, license_plate, vehicle_size')
      
      // Only filter by client if one is chosen
      if (selectedClient) {
        query = query.eq('client_id', selectedClient)
      }
      
      const { data, error } = await query.order('make, model')

      if (error) throw error
      setVehicles(data || [])
    } catch (error) {
      console.error('Error fetching vehicles:', error)
      setVehicles([]) // Ensure vehicles is set to empty array on error
    }
  }

  const fetchServices = async () => {
    try {
      const { data, error } = await supabase
        .from('services')
        .select('id, name, base_price_sedan, base_price_suv, base_price_truck, base_price_van')
        .order('name')

      if (error) throw error
      setServices(data || [])
    } catch (error) {
      console.error('Error fetching services:', error)
    }
  }

  const handleClientChange = (clientId) => {
    console.log('Client selected:', clientId)
    setSelectedClient(clientId)
    // Clear vehicle selection when client changes
    setSelectedVehicle('')
    // Clear selected services when client changes
    setSelectedServices([])
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
      // Get price based on selected vehicle size
      let price = 0
      if (selectedVehicle) {
        const vehicle = vehicles.find(v => v.id === selectedVehicle)
        if (vehicle) {
          const size = vehicle.vehicle_size || vehicle.size
          switch (size) {
            case 'sedan':
              price = service.base_price_sedan || 0
              break
            case 'suv':
              price = service.base_price_suv || 0
              break
            case 'truck':
              price = service.base_price_truck || 0
              break
            case 'van':
              price = service.base_price_van || 0
              break
            default:
              price = service.base_price_sedan || 0
          }
        }
      } else {
        // Use sedan price as default
        price = service.base_price_sedan || 0
      }

      setSelectedServices([...selectedServices, { 
        ...service, 
        quantity: 1,
        unit_price: price,
        override_price: false
      }])
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

  const updateServicePrice = (serviceId, newPrice) => {
    setSelectedServices(selectedServices.map(s => 
      s.id === serviceId ? { 
        ...s, 
        unit_price: parseFloat(newPrice) || 0,
        override_price: true 
      } : s
    ))
  }

  const resetServicePrice = (serviceId) => {
    const service = selectedServices.find(s => s.id === serviceId)
    if (service) {
      let originalPrice = 0
      if (selectedVehicle) {
        const vehicle = vehicles.find(v => v.id === selectedVehicle)
        if (vehicle) {
          const size = vehicle.vehicle_size || vehicle.size
          switch (size) {
            case 'sedan':
              originalPrice = service.base_price_sedan || 0
              break
            case 'suv':
              originalPrice = service.base_price_suv || 0
              break
            case 'truck':
              originalPrice = service.base_price_truck || 0
              break
            case 'van':
              originalPrice = service.base_price_van || 0
              break
            default:
              originalPrice = service.base_price_sedan || 0
          }
        }
      } else {
        originalPrice = service.base_price_sedan || 0
      }

      setSelectedServices(selectedServices.map(s => 
        s.id === serviceId ? { 
          ...s, 
          unit_price: originalPrice,
          override_price: false 
        } : s
      ))
    }
  }

  const calculateTotal = () => {
    return selectedServices.reduce((total, service) => {
      return total + (service.unit_price * service.quantity)
    }, 0)
  }

  const handleSave = async () => {
    if (!selectedClient || !invoiceNumber) {
      toast.error('Please select a client and enter invoice number')
      return
    }

    setSaving(true)
    try {
      console.log('Creating invoice with data:', {
        client_id: selectedClient,
        invoice_number: invoiceNumber,
        invoice_date: new Date().toISOString(), // Full ISO date format
        due_date: dueDate || new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        status: 'pending', // Changed from 'draft' to 'pending'
        total: calculateTotal(),
        notes: notes
      })
      
      // Create invoice
      const { data: invoice, error: invoiceError } = await supabase
        .from('invoices')
        .insert({
          client_id: selectedClient,
          invoice_number: invoiceNumber,
          invoice_date: new Date().toISOString(), // Full ISO date format
          due_date: dueDate || new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          status: 'pending', // Changed from 'draft' to 'pending'
          total: calculateTotal(),
          notes: notes
        })
        .select()
        .single()

      console.log('Invoice created:', invoice)
      console.log('Invoice error:', invoiceError)

      if (invoiceError) throw invoiceError

      // Create invoice items
      const items = selectedServices.map(service => ({
        invoice_id: invoice.id,
        item_type: 'service', // Use item_type instead of service_id
        item_id: service.id, // Use item_id instead of service_id
        description: service.name,
        quantity: service.quantity,
        unit_price: service.unit_price,
        total_price: service.unit_price * service.quantity
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
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-400 border-t-transparent"></div>
      </div>
    )
  }

  const selectedClientData = clients.find(c => c.id === selectedClient)
  const selectedVehicleData = vehicles.find(v => v.id === selectedVehicle)

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 p-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-4">
            <button
              onClick={() => navigate('/admin/invoices')}
              className="text-slate-300 hover:text-blue-400 transition-colors flex items-center space-x-2"
            >
              <ArrowLeft size={20} />
              <span>Back to Invoices</span>
            </button>
            <div>
              <h1 className="text-3xl font-bold text-white">Create Invoice</h1>
              <p className="text-slate-400">Generate a new invoice for your client</p>
            </div>
          </div>
          <button
            onClick={handleSave}
            disabled={saving}
            className="bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white px-6 py-2 rounded-lg font-semibold flex items-center space-x-2 transition-all transform hover:scale-105 shadow-lg"
          >
            <Save size={18} />
            <span>{saving ? 'Creating...' : 'Create Invoice'}</span>
          </button>
        </div>

        {/* Main Grid Layout - No Scrolling */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
          
          {/* Left Column - Client & Vehicle */}
          <div className="space-y-4">
            {/* Client Selection */}
            <div className="bg-white/10 backdrop-blur-md rounded-lg p-4 border border-white/20">
              <div className="flex items-center space-x-2 mb-3">
                <div className="p-1.5 bg-purple-500/20 rounded">
                  <User className="text-purple-400" size={18} />
                </div>
                <h2 className="text-lg font-bold text-white">Client</h2>
              </div>

              <select
                value={selectedClient}
                onChange={(e) => handleClientChange(e.target.value)}
                className="w-full px-3 py-2 bg-white/5 border border-white/20 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:border-blue-400 text-sm"
              >
                <option value="" className="bg-slate-800">Select client...</option>
                {clients.map(client => (
                  <option key={client.id} value={client.id} className="bg-slate-800">
                    {client.full_name}
                  </option>
                ))}
              </select>

              {selectedClientData && (
                <div className="mt-3 p-3 bg-white/5 rounded-lg text-xs">
                  <div className="space-y-1">
                    <p className="text-slate-300"><span className="font-medium">Email:</span> {selectedClientData.email}</p>
                    <p className="text-slate-300"><span className="font-medium">Phone:</span> {selectedClientData.phone}</p>
                    {selectedClientData.address && (
                      <p className="text-slate-300"><span className="font-medium">Address:</span> {selectedClientData.address}</p>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Vehicle Selection */}
            <div className="bg-white/10 backdrop-blur-md rounded-lg p-4 border border-white/20">
              <div className="flex items-center space-x-2 mb-3">
                <div className="p-1.5 bg-orange-500/20 rounded">
                  <Car className="text-orange-400" size={18} />
                </div>
                <h2 className="text-lg font-bold text-white">Vehicle</h2>
              </div>

              {!selectedClient ? (
                <div className="bg-white/5 rounded-lg p-3 text-center">
                  <Car className="text-slate-400 mx-auto mb-1" size={24} />
                  <p className="text-slate-400 text-xs">Select client first</p>
                </div>
              ) : (
                <>
                  <select
                    value={selectedVehicle}
                    onChange={(e) => setSelectedVehicle(e.target.value)}
                    className="w-full px-3 py-2 bg-white/5 border border-white/20 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:border-blue-400 text-sm"
                  >
                    <option value="" className="bg-slate-800">Select vehicle...</option>
                    {vehicles.map(vehicle => (
                      <option key={vehicle.id} value={vehicle.id} className="bg-slate-800">
                        {vehicle.year} {vehicle.make} ({vehicle.vehicle_size})
                      </option>
                    ))}
                  </select>

                  {selectedVehicleData && (
                    <div className="mt-3 p-3 bg-white/5 rounded-lg text-xs">
                      <div className="space-y-1">
                        <p className="text-slate-300"><span className="font-medium">Year:</span> {selectedVehicleData.year}</p>
                        <p className="text-slate-300"><span className="font-medium">Make:</span> {selectedVehicleData.make}</p>
                        <p className="text-slate-300"><span className="font-medium">Size:</span> {selectedVehicleData.vehicle_size}</p>
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>

            {/* Invoice Details */}
            <div className="bg-white/10 backdrop-blur-md rounded-lg p-4 border border-white/20">
              <div className="flex items-center space-x-2 mb-3">
                <div className="p-1.5 bg-blue-500/20 rounded">
                  <FileText className="text-blue-400" size={18} />
                </div>
                <h2 className="text-lg font-bold text-white">Details</h2>
              </div>

              <div className="space-y-3">
                <div>
                  <label className="block text-slate-300 text-xs font-medium mb-1">Invoice #</label>
                  <input
                    type="text"
                    value={invoiceNumber}
                    onChange={(e) => setInvoiceNumber(e.target.value)}
                    className="w-full px-3 py-2 bg-white/5 border border-white/20 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:border-blue-400 text-sm"
                    placeholder="INV-2024-001"
                  />
                </div>

                <div>
                  <label className="block text-slate-300 text-xs font-medium mb-1">Due Date</label>
                  <input
                    type="date"
                    value={dueDate}
                    onChange={(e) => setDueDate(e.target.value)}
                    className="w-full px-3 py-2 bg-white/5 border border-white/20 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:border-blue-400 text-sm"
                  />
                </div>

                <div>
                  <label className="block text-slate-300 text-xs font-medium mb-1">Notes</label>
                  <textarea
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    className="w-full px-3 py-2 bg-white/5 border border-white/20 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:border-blue-400 text-sm resize-none"
                    rows="2"
                    placeholder="Additional notes..."
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Middle Column - Services */}
          <div className="lg:col-span-2">
            <div className="bg-white/10 backdrop-blur-md rounded-lg p-4 border border-white/20 h-full">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center space-x-2">
                  <div className="p-1.5 bg-green-500/20 rounded">
                    <Plus className="text-green-400" size={18} />
                  </div>
                  <h2 className="text-lg font-bold text-white">Services</h2>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-96 overflow-y-auto">
                {services.map(service => {
                  // Get price based on selected vehicle
                  let price = 0
                  if (selectedVehicle) {
                    const vehicle = vehicles.find(v => v.id === selectedVehicle)
                    if (vehicle) {
                      const size = vehicle.vehicle_size || vehicle.size
                      switch (size) {
                        case 'sedan':
                          price = service.base_price_sedan || 0
                          break
                        case 'suv':
                          price = service.base_price_suv || 0
                          break
                        case 'truck':
                          price = service.base_price_truck || 0
                          break
                        case 'van':
                          price = service.base_price_van || 0
                          break
                        default:
                          price = service.base_price_sedan || 0
                      }
                    }
                  } else {
                    price = service.base_price_sedan || 0
                  }

                  const isSelected = selectedServices.find(s => s.id === service.id)

                  return (
                    <div
                      key={service.id}
                      className={`p-3 rounded-lg border transition-all cursor-pointer ${
                        isSelected
                          ? 'bg-blue-500/20 border-blue-400'
                          : 'bg-white/5 border-white/20 hover:bg-white/10 hover:border-white/30'
                      }`}
                      onClick={() => isSelected ? removeService(service.id) : addService(service.id)}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <h3 className="font-semibold text-white text-sm">{service.name}</h3>
                        {isSelected ? (
                          <div className="p-1 bg-red-500/20 rounded">
                            <Trash2 className="text-red-400" size={14} />
                          </div>
                        ) : (
                          <div className="p-1 bg-green-500/20 rounded">
                            <Plus className="text-green-400" size={14} />
                          </div>
                        )}
                      </div>
                      <p className="text-blue-400 font-bold text-sm">${price.toFixed(2)}</p>
                    </div>
                  )
                })}
              </div>
            </div>
          </div>

          {/* Right Column - Summary */}
          <div>
            <div className="bg-gradient-to-br from-blue-600 to-purple-600 rounded-lg p-4 border border-white/20 shadow-2xl h-full">
              <div className="flex items-center space-x-2 mb-3">
                <div className="p-1.5 bg-white/20 rounded">
                  <DollarSign className="text-white" size={18} />
                </div>
                <h2 className="text-lg font-bold text-white">Summary</h2>
              </div>

              {/* Price Override Instructions */}
              <div className="mb-3 p-2 bg-white/10 rounded-lg">
                <p className="text-blue-100 text-xs">
                  💡 Click prices to edit
                </p>
              </div>

              <div className="space-y-2 max-h-80 overflow-y-auto">
                {selectedServices.map(service => (
                  <div key={service.id} className="bg-white/10 rounded-lg p-2">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <p className="text-white font-medium text-xs">{service.name}</p>
                        <div className="flex items-center space-x-1 mt-1">
                          <input
                            type="number"
                            value={service.unit_price}
                            onChange={(e) => updateServicePrice(service.id, e.target.value)}
                            className="w-16 px-2 py-1 bg-white/20 border border-white/30 rounded text-white focus:outline-none focus:border-white/50 text-xs"
                            min="0"
                            step="0.01"
                          />
                          <span className="text-blue-200 text-xs">x {service.quantity}</span>
                          {service.override_price && (
                            <button
                              onClick={() => resetServicePrice(service.id)}
                              className="text-xs text-yellow-300 hover:text-yellow-200 transition-colors"
                              title="Reset to original price"
                            >
                              Reset
                            </button>
                          )}
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-white font-bold text-sm">
                          ${(service.unit_price * service.quantity).toFixed(2)}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-3 pt-3 border-t border-white/20">
                <div className="flex items-center justify-between">
                  <span className="text-lg font-bold text-white">Total:</span>
                  <span className="text-xl font-bold text-white">
                    ${calculateTotal().toFixed(2)}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default NewInvoice
