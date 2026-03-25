import React, { useState, useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { Link } from 'react-router-dom'
import { ArrowLeft, Save, User, FileText, Calendar, DollarSign, Plus, Trash2, Search, ChevronDown, Mail, Phone } from 'lucide-react'
import { supabase } from '../../lib/supabase.js'
import toast from 'react-hot-toast'
import { createPortal } from 'react-dom'

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
  const [bookingData, setBookingData] = useState(null)
  const [searchParams] = useSearchParams()
  const [showClientDropdown, setShowClientDropdown] = useState(false)
  const [showServiceDropdown, setShowServiceDropdown] = useState(false)
  const [clientSearch, setClientSearch] = useState('')
  const [serviceSearch, setServiceSearch] = useState('')
  const [dropdownPosition, setDropdownPosition] = useState({ top: 0, left: 0, width: 0 })
  const navigate = useNavigate()

  useEffect(() => {
    const loadData = async () => {
      try {
        const bookingId = searchParams.get('booking_id')
        
        await Promise.all([
          fetchClients(),
          fetchServices()
        ])
        generateInvoiceNumber()
        
        // Load booking data after clients are loaded
        if (bookingId) {
          await loadBookingData(bookingId)
        }
      } catch (error) {
        console.error('Error loading initial data:', error)
      } finally {
        setLoading(false)
      }
    }
    
    loadData()
  }, [searchParams])

  // Set client after clients are loaded and booking data is available
  useEffect(() => {
    if (bookingData && bookingData.clients && clients.length > 0) {
      const clientId = bookingData.clients.id.toString()
      console.log('Setting selected client to:', clientId)
      console.log('Available clients:', clients.map(c => ({ id: c.id, name: c.full_name })))
      setSelectedClient(clientId)
    }
  }, [bookingData, clients])

  // Handle click outside dropdowns
  useEffect(() => {
    const handleClickOutside = (event) => {
      // For client dropdown
      if (showClientDropdown) {
        const clientDropdown = document.querySelector('[data-client-dropdown="true"]')
        if (clientDropdown && !clientDropdown.contains(event.target) && !event.target.closest('.client-dropdown-container')) {
          setShowClientDropdown(false)
        }
      }
      
      // For service dropdown
      if (showServiceDropdown) {
        const serviceDropdown = document.querySelector('[data-service-dropdown="true"]')
        if (serviceDropdown && !serviceDropdown.contains(event.target) && !event.target.closest('.service-dropdown-container')) {
          setShowServiceDropdown(false)
        }
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [showClientDropdown, showServiceDropdown])

  useEffect(() => {
    fetchVehicles()
    if (selectedVehicle && selectedClient) {
      setSelectedVehicle('')
    }
  }, [selectedClient])

  const fetchClients = async () => {
    try {
      const { data, error } = await supabase
        .from('clients')
        .select('id, full_name, email, phone, address')
        .order('full_name')

      if (error) throw error
      setClients(data || [])
    } catch (error) {
      console.error('Error fetching clients:', error)
    }
  }

  const fetchVehicles = async () => {
    if (!selectedClient) {
      setVehicles([])
      return
    }
    
    try {
      const { data, error } = await supabase
        .from('vehicles')
        .select('*')
        .eq('client_id', selectedClient)
        .order('year', { ascending: false })

      if (error) throw error
      setVehicles(data || [])
    } catch (error) {
      console.error('Error fetching vehicles:', error)
      setVehicles([])
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

  const loadBookingData = async (bookingId) => {
    try {
      console.log('Loading booking data for invoice:', bookingId)
      
      const { data, error } = await supabase
        .from('bookings')
        .select(`
          *,
          clients (id, full_name, email, phone, address),
          vehicles (id, year, make, model, color, license_plate, size),
          services (id, name, base_price_sedan, base_price_suv, base_price_truck, base_price_van),
          booking_addons (
            addons (id, name, price, duration_minutes)
          )
        `)
        .eq('id', bookingId)
        .single()

      if (error) throw error
      
      console.log('Booking data loaded for invoice:', data)
      setBookingData(data)
      
      // Note: Client selection is now handled in useEffect to ensure clients list is loaded
      
      if (data.vehicles) {
        setSelectedVehicle(data.vehicles.id.toString())
      }
      
      const dueDate = new Date()
      dueDate.setDate(dueDate.getDate() + 30)
      setDueDate(dueDate.toISOString().split('T')[0])
      
      const invoiceItems = []
      
      if (data.services) {
        let price = 0
        const vehicleSize = data.vehicles?.size || 'sedan'
        
        if (vehicleSize === 'suv') {
          price = data.services.base_price_suv || 0
        } else if (vehicleSize === 'truck') {
          price = data.services.base_price_truck || 0
        } else {
          price = data.services.base_price_sedan || 0
        }
        
        invoiceItems.push({
          ...data.services,
          quantity: 1,
          unit_price: price,
          override_price: false
        })
      }
      
      if (data.booking_addons && data.booking_addons.length > 0) {
        data.booking_addons.forEach(bookingAddon => {
          if (bookingAddon.addons) {
            invoiceItems.push({
              ...bookingAddon.addons,
              quantity: 1,
              unit_price: bookingAddon.addons.price || 0,
              override_price: false
            })
          }
        })
      }
      
      setSelectedServices(invoiceItems)
      
    } catch (error) {
      console.error('Error loading booking data:', error)
      toast.error('Error loading booking data')
    }
  }

  const generateInvoiceNumber = () => {
    const now = new Date()
    const year = now.getFullYear()
    const month = String(now.getMonth() + 1).padStart(2, '0')
    const day = String(now.getDate()).padStart(2, '0')
    const hours = String(now.getHours()).padStart(2, '0')
    const minutes = String(now.getMinutes()).padStart(2, '0')
    const seconds = String(now.getSeconds()).padStart(2, '0')
    const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0')
    setInvoiceNumber(`INV-${year}${month}${day}-${hours}${minutes}${random}`)
  }

  const addService = (serviceId) => {
    const service = services.find(s => s.id === parseInt(serviceId))
    if (!service || selectedServices.find(s => s.id === serviceId)) return

    let price = 0
    if (selectedVehicle) {
      const vehicle = vehicles.find(v => v.id === parseInt(selectedVehicle))
      if (vehicle) {
        const size = vehicle.size
        switch (size) {
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

    setSelectedServices([...selectedServices, { 
      ...service, 
      quantity: 1,
      unit_price: price,
      override_price: false
    }])
    setShowServiceDropdown(false)
    setServiceSearch('')
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

  const addCustomItem = () => {
    const customItem = {
      id: `custom_${Date.now()}`,
      name: 'Custom Item',
      quantity: 1,
      unit_price: 0,
      override_price: true,
      is_custom: true
    }
    setSelectedServices([...selectedServices, customItem])
  }

  const updateCustomItemName = (itemId, name) => {
    setSelectedServices(selectedServices.map(s => 
      s.id === itemId ? { ...s, name } : s
    ))
  }

  const calculateTotal = () => {
    return selectedServices.reduce((total, service) => {
      return total + (service.unit_price * service.quantity)
    }, 0)
  }

  const calculateSubtotal = () => {
    return calculateTotal()
  }

  const calculateTax = () => {
    return calculateSubtotal() * 0.06875
  }

  const calculatePlatformFee = () => {
    return calculateSubtotal() * 0.04
  }

  const calculateGrandTotal = () => {
    return calculateSubtotal() + calculateTax() + calculatePlatformFee()
  }

  const handleSave = async () => {
    if (!selectedClient || !invoiceNumber) {
      toast.error('Please select a client and enter invoice number')
      return
    }

    if (selectedServices.length === 0) {
      toast.error('Please add at least one item to the invoice')
      return
    }

    setSaving(true)
    try {
      const client = clients.find(c => c.id === parseInt(selectedClient))
      
      const { data: invoice, error: invoiceError } = await supabase
        .from('invoices')
        .insert({
          client_id: selectedClient,
          invoice_number: invoiceNumber,
          issue_date: new Date().toISOString().split('T')[0],
          due_date: dueDate,
          subtotal: calculateSubtotal(),
          tax: calculateTax(),
          platform_fee: calculatePlatformFee(),
          total: calculateGrandTotal(),
          status: 'sent',
          notes: notes,
          created_at: new Date().toISOString()
        })
        .select()
        .single()

      if (invoiceError) throw invoiceError

      const items = selectedServices.map(service => ({
        invoice_id: invoice.id,
        item_type: 'service',
        item_id: service.is_custom ? null : service.id, // Custom items don't have a service ID
        description: service.name,
        quantity: service.quantity,
        unit_price: service.unit_price,
        total: service.unit_price * service.quantity,
        created_at: new Date().toISOString()
      }))

      const { error: itemsError } = await supabase
        .from('invoice_items')
        .insert(items)

      if (itemsError) throw itemsError

      toast.success('Invoice created successfully!')
      navigate(`/admin/invoices/${invoice.id}`)
    } catch (error) {
      console.error('Error saving invoice:', error)
      toast.error('Error saving invoice')
    } finally {
      setSaving(false)
    }
  }

  const filteredClients = clients
    .filter((client, index, self) => 
      index === self.findIndex((c) => c.id === client.id) // Remove duplicates by ID
    )
    .filter(client =>
      client.full_name.toLowerCase().includes(clientSearch.toLowerCase()) ||
      client.email.toLowerCase().includes(clientSearch.toLowerCase())
    )

  const filteredServices = services.filter(service =>
    service.name.toLowerCase().includes(serviceSearch.toLowerCase())
  )

  const selectedClientData = clients.find(c => c.id.toString() === selectedClient.toString())
  
  console.log('Debug - selectedClient:', selectedClient)
  console.log('Debug - selectedClientData:', selectedClientData)

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-400">Loading invoice creator...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900">
      <div className="max-w-6xl mx-auto p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center space-x-4">
            <button
              onClick={() => navigate('/admin/invoices')}
              className="p-2 hover:bg-white/10 rounded-lg transition-colors"
            >
              <ArrowLeft className="text-white" size={24} />
            </button>
            <div>
              <h1 className="text-3xl font-bold text-white">Create Invoice</h1>
              <p className="text-gray-400">
                {bookingData ? 'Invoice from booking' : 'Create a new invoice for your client'}
              </p>
            </div>
          </div>
          <button
            onClick={handleSave}
            disabled={saving}
            className="bg-green-500 hover:bg-green-600 disabled:opacity-50 text-white px-6 py-3 rounded-xl font-medium transition-all flex items-center space-x-2"
          >
            <Save size={20} />
            <span>{saving ? 'Saving...' : 'Save Invoice'}</span>
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Client & Invoice Details */}
          <div className="lg:col-span-1 space-y-6">
            {/* Client Selection */}
            <div className="bg-white/5 backdrop-blur-xl rounded-2xl p-6 border border-white/10" style={{ isolation: 'isolate' }}>
              <h2 className="text-xl font-semibold text-white mb-4 flex items-center">
                <User className="mr-2" size={20} />
                Client Information
              </h2>
              
              <div className="relative client-dropdown-container">
                <button
                  onClick={(e) => {
                    const rect = e.currentTarget.getBoundingClientRect()
                    setDropdownPosition({
                      top: rect.bottom + window.scrollY + 8,
                      left: rect.left + window.scrollX,
                      width: rect.width
                    })
                    setShowClientDropdown(!showClientDropdown)
                  }}
                  className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-left text-white flex items-center justify-between hover:bg-white/15 transition-colors"
                >
                  <span>
                    {selectedClientData ? selectedClientData.full_name : 'Select a client...'}
                  </span>
                  <ChevronDown size={20} />
                </button>
                
                {showClientDropdown && createPortal(
                  <div 
                    data-client-dropdown="true"
                    className="bg-slate-800 border border-white/20 rounded-xl shadow-xl"
                    style={{
                      position: 'fixed',
                      top: `${dropdownPosition.top}px`,
                      left: `${dropdownPosition.left}px`,
                      width: `${dropdownPosition.width}px`,
                      zIndex: 999999
                    }}
                  >
                    <div className="p-3">
                      <div className="relative">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
                        <input
                          type="text"
                          placeholder="Search clients..."
                          value={clientSearch}
                          onChange={(e) => setClientSearch(e.target.value)}
                          className="w-full pl-10 pr-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                    </div>
                    <div className="max-h-60 overflow-y-auto">
                      {filteredClients.map(client => (
                        <button
                          key={client.id}
                          onClick={() => {
                            setSelectedClient(client.id.toString())
                            setShowClientDropdown(false)
                            setClientSearch('')
                          }}
                          className="w-full px-4 py-3 text-left hover:bg-white/10 transition-colors border-t border-white/10"
                        >
                          <div className="text-white font-medium">{client.full_name}</div>
                          <div className="text-gray-400 text-sm">{client.email}</div>
                        </button>
                      ))}
                    </div>
                  </div>,
                  document.body
                )}
              </div>

              {selectedClientData && (
                <div className="mt-4 p-4 bg-white/5 rounded-xl space-y-2">
                  <div className="flex items-center space-x-2">
                    <Mail className="text-gray-400" size={16} />
                    <span className="text-gray-300 text-sm">{selectedClientData.email}</span>
                  </div>
                  {selectedClientData.phone && (
                    <div className="flex items-center space-x-2">
                      <Phone className="text-gray-400" size={16} />
                      <span className="text-gray-300 text-sm">{selectedClientData.phone}</span>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Invoice Details */}
            <div className="bg-white/5 backdrop-blur-xl rounded-2xl p-6 border border-white/10">
              <h2 className="text-xl font-semibold text-white mb-4 flex items-center">
                <FileText className="mr-2" size={20} />
                Invoice Details
              </h2>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Invoice Number</label>
                  <input
                    type="text"
                    value={invoiceNumber}
                    onChange={(e) => setInvoiceNumber(e.target.value)}
                    className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Due Date</label>
                  <input
                    type="date"
                    value={dueDate}
                    onChange={(e) => setDueDate(e.target.value)}
                    className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Notes (Optional)</label>
                  <textarea
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    rows={3}
                    placeholder="Add any notes or payment instructions..."
                    className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Right Column - Invoice Items */}
          <div className="lg:col-span-2 space-y-6">
            {/* Add Items */}
            <div className="bg-white/5 backdrop-blur-xl rounded-2xl p-6 border border-white/10">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold text-white flex items-center">
                  <Plus className="mr-2" size={20} />
                  Invoice Items
                </h2>
                <button
                  onClick={addCustomItem}
                  className="bg-blue-500/20 hover:bg-blue-500/30 text-blue-400 px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center space-x-2"
                >
                  <Plus size={16} />
                  <span>Custom Item</span>
                </button>
              </div>

              {/* Service Dropdown */}
              <div className="relative service-dropdown-container mb-4">
                <button
                  onClick={() => setShowServiceDropdown(!showServiceDropdown)}
                  className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-left text-white flex items-center justify-between hover:bg-white/15 transition-colors"
                >
                  <span>Add a service...</span>
                  <ChevronDown size={20} />
                </button>
                
                {showServiceDropdown && (
                  <div 
                    data-service-dropdown="true"
                    className="absolute z-[999999] w-full mt-2 bg-slate-800 border border-white/20 rounded-xl shadow-xl"
                    style={{ 
                      transform: 'translateZ(0)',
                      isolation: 'isolate'
                    }}>
                    <div className="p-3">
                      <div className="relative">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
                        <input
                          type="text"
                          placeholder="Search services..."
                          value={serviceSearch}
                          onChange={(e) => setServiceSearch(e.target.value)}
                          className="w-full pl-10 pr-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                    </div>
                    <div className="max-h-60 overflow-y-auto">
                      {filteredServices.map(service => (
                        <button
                          key={service.id}
                          onClick={() => addService(service.id)}
                          disabled={selectedServices.find(s => s.id === service.id)}
                          className="w-full px-4 py-3 text-left hover:bg-white/10 transition-colors border-t border-white/10 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          <div className="flex items-center justify-between">
                            <div>
                              <div className="text-white font-medium">{service.name}</div>
                              <div className="text-gray-400 text-sm">
                                ${service.base_price_sedan} - ${service.base_price_truck}
                              </div>
                            </div>
                            {selectedServices.find(s => s.id === service.id) && (
                              <Check className="text-green-400" size={16} />
                            )}
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Items List */}
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {selectedServices.length === 0 ? (
                  <div className="text-center py-8">
                    <FileText className="text-gray-400 mx-auto mb-3" size={48} />
                    <p className="text-gray-400">No items added yet</p>
                    <p className="text-gray-500 text-sm">Add services or custom items to get started</p>
                  </div>
                ) : (
                  selectedServices.map(service => (
                    <div key={service.id} className="bg-white/5 rounded-xl p-4 border border-white/10">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          {service.is_custom ? (
                            <input
                              type="text"
                              value={service.name}
                              onChange={(e) => updateCustomItemName(service.id, e.target.value)}
                              className="w-full bg-transparent border-b border-white/20 text-white font-medium pb-1 mb-3 focus:outline-none focus:border-blue-400"
                            />
                          ) : (
                            <h3 className="text-white font-medium mb-1">{service.name}</h3>
                          )}
                          
                          <div className="flex items-center space-x-3">
                            <div className="flex items-center space-x-2">
                              <span className="text-gray-400 text-sm">$</span>
                              <input
                                type="number"
                                value={service.unit_price}
                                onChange={(e) => updateServicePrice(service.id, e.target.value)}
                                className="w-24 bg-white/10 border border-white/20 rounded-lg px-2 py-1 text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                                min="0"
                                step="0.01"
                              />
                            </div>
                            
                            <div className="flex items-center space-x-2">
                              <span className="text-gray-400 text-sm">×</span>
                              <input
                                type="number"
                                value={service.quantity}
                                onChange={(e) => updateServiceQuantity(service.id, e.target.value)}
                                className="w-16 bg-white/10 border border-white/20 rounded-lg px-2 py-1 text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                                min="1"
                              />
                            </div>
                            
                            <span className="text-white font-medium">
                              = ${(service.unit_price * service.quantity).toFixed(2)}
                            </span>
                          </div>
                        </div>
                        
                        <button
                          onClick={() => removeService(service.id)}
                          className="ml-4 p-2 text-red-400 hover:bg-red-500/20 rounded-lg transition-colors"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Summary */}
            <div className="bg-white/5 backdrop-blur-xl rounded-2xl p-6 border border-white/10">
              <h2 className="text-xl font-semibold text-white mb-4">Summary</h2>
              
              <div className="space-y-3">
                <div className="flex justify-between text-gray-300">
                  <span>Subtotal:</span>
                  <span>${calculateSubtotal().toFixed(2)}</span>
                </div>
                
                <div className="flex justify-between text-gray-300">
                  <span>Tax (6.875%):</span>
                  <span>${calculateTax().toFixed(2)}</span>
                </div>
                
                <div className="flex justify-between text-gray-300">
                  <span>Platform Fee (4%):</span>
                  <span>${calculatePlatformFee().toFixed(2)}</span>
                </div>
                
                <div className="border-t border-white/20 pt-3">
                  <div className="flex justify-between text-xl font-bold text-white">
                    <span>Total:</span>
                    <span className="text-green-400">${calculateGrandTotal().toFixed(2)}</span>
                  </div>
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
