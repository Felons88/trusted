import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import { Package, Plus, Edit, Eye, DollarSign, Clock } from 'lucide-react'
import toast from 'react-hot-toast'

function Services() {
  const navigate = useNavigate()
  const [services, setServices] = useState([])
  const [addOns, setAddOns] = useState([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('services')

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      console.log('Services: Loading data...')
      
      let servicesData = []
      let addOnsData = []
      
      try {
        const { data } = await supabase
          .from('services')
          .select('*')
          .order('type', { ascending: true })
        servicesData = data || []
        console.log('Services: Loaded', servicesData.length, 'services')
      } catch (err) {
        console.log('Services: Error loading services')
        servicesData = []
      }
      
      try {
        const { data } = await supabase
          .from('add_ons')
          .select('*')
          .order('name', { ascending: true })
        addOnsData = data || []
        console.log('Services: Loaded', addOnsData.length, 'add-ons')
      } catch (err) {
        console.log('Services: Error loading add-ons')
        addOnsData = []
      }
      
      setServices(servicesData)
      setAddOns(addOnsData)
      setLoading(false)
    } catch (error) {
      console.error('Services: Critical error:', error)
      setServices([])
      setAddOns([])
      setLoading(false)
    }
  }

  const toggleServiceStatus = async (serviceId, isActive, type) => {
    try {
      const table = type === 'service' ? 'services' : 'add_ons'
      const { error } = await supabase
        .from(table)
        .update({ is_active: !isActive })
        .eq('id', serviceId)

      if (error) throw error

      // Update local state
      if (type === 'service') {
        setServices(prev => 
          prev.map(service => 
            service.id === serviceId 
              ? { ...service, is_active: !isActive }
              : service
          )
        )
      } else {
        setAddOns(prev => 
          prev.map(addon => 
            addon.id === serviceId 
              ? { ...addon, is_active: !isActive }
              : addon
          )
        )
      }

      toast.success(`${type === 'service' ? 'Service' : 'Add-on'} ${!isActive ? 'enabled' : 'disabled'} successfully`)
    } catch (error) {
      console.error('Error toggling status:', error)
      toast.error('Failed to update status')
    }
  }

  const handleEdit = (id, type) => {
    if (type === 'service') {
      navigate(`/admin/services/${id}/edit`)
    } else {
      navigate(`/admin/addons/${id}/edit`)
    }
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
          <h1 className="text-2xl sm:text-4xl font-bold metallic-heading mb-2">Services & Pricing</h1>
          <p className="text-light-gray text-sm sm:text-base">Manage service packages and add-ons</p>
        </div>
        <div className="flex gap-2">
          <button 
            onClick={() => navigate('/admin/services/new')}
            className="btn-primary mr-2"
          >
            <Plus size={20} className="inline mr-2" />
            <span className="hidden sm:inline">Add Service</span>
            <span className="sm:hidden">Service</span>
          </button>
          <button 
            onClick={() => navigate('/admin/addons/new')}
            className="btn-primary"
          >
            <Plus size={20} className="inline mr-2" />
            <span className="hidden sm:inline">Add Add-on</span>
            <span className="sm:hidden">Add-on</span>
          </button>
        </div>
      </div>

      <div className="glass-card">
        <div className="flex space-x-1 mb-4 sm:mb-6 border-b border-electric-blue/20">
          <button
            onClick={() => setActiveTab('services')}
            className={`px-3 sm:px-4 py-2 font-semibold transition-colors text-sm sm:text-base ${
              activeTab === 'services'
                ? 'text-electric-blue border-b-2 border-electric-blue'
                : 'text-light-gray hover:text-metallic-silver'
            }`}
          >
            Services
          </button>
          <button
            onClick={() => setActiveTab('addons')}
            className={`px-3 sm:px-4 py-2 font-semibold transition-colors text-sm sm:text-base ${
              activeTab === 'addons'
                ? 'text-electric-blue border-b-2 border-electric-blue'
                : 'text-light-gray hover:text-metallic-silver'
            }`}
          >
            Add-ons
          </button>
        </div>

        {activeTab === 'services' && (
          <div className="space-y-3 sm:space-y-4">
            {services.length === 0 ? (
              <div className="text-center py-8">
                <Package className="text-light-gray mx-auto mb-4" size={48} />
                <p className="text-light-gray">No services found</p>
              </div>
            ) : (
              services.map((service) => (
                <div
                  key={service.id}
                  className="bg-navy-dark/50 border border-electric-blue/20 rounded-lg p-4 sm:p-6"
                >
                  <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-4">
                    <div className="flex-1">
                      <div className="flex flex-col sm:flex-row sm:items-center mb-2 gap-2">
                        <h3 className="text-lg sm:text-xl font-bold text-metallic-silver">{service.name}</h3>
                        <span className={`px-2 py-1 rounded-full text-xs font-semibold inline-flex items-center w-fit ${
                          service.is_active
                            ? 'bg-green-500/20 text-green-400'
                            : 'bg-red-500/20 text-red-400'
                        }`}>
                          {service.is_active ? 'Active' : 'Inactive'}
                        </span>
                      </div>
                      <p className="text-light-gray mb-3 sm:mb-4 text-sm sm:text-base">{service.description}</p>
                      
                      {/* Vehicle Pricing Grid */}
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 mb-3">
                        <div className="bg-navy-dark/30 rounded-lg p-2 sm:p-3">
                          <p className="text-xs text-light-gray mb-1">Sedan</p>
                          <p className="text-bright-cyan font-bold text-sm sm:text-base">${parseFloat(service.base_price_sedan || 0).toFixed(2)}</p>
                        </div>
                        <div className="bg-navy-dark/30 rounded-lg p-2 sm:p-3">
                          <p className="text-xs text-light-gray mb-1">SUV</p>
                          <p className="text-bright-cyan font-bold text-sm sm:text-base">${parseFloat(service.base_price_suv || 0).toFixed(2)}</p>
                        </div>
                        <div className="bg-navy-dark/30 rounded-lg p-2 sm:p-3">
                          <p className="text-xs text-light-gray mb-1">Truck</p>
                          <p className="text-bright-cyan font-bold text-sm sm:text-base">${parseFloat(service.base_price_truck || 0).toFixed(2)}</p>
                        </div>
                        <div className="bg-navy-dark/30 rounded-lg p-2 sm:p-3">
                          <p className="text-xs text-light-gray mb-1">Van</p>
                          <p className="text-bright-cyan font-bold text-sm sm:text-base">${parseFloat(service.base_price_van || 0).toFixed(2)}</p>
                        </div>
                      </div>
                      
                      {/* Duration */}
                      <div className="flex items-center text-xs sm:text-sm text-light-gray">
                        <Clock size={14} className="mr-1" />
                        Duration: {service.duration_minutes || 120} minutes
                      </div>
                    </div>
                    
                    <div className="flex gap-2">
                      <button
                        onClick={() => toggleServiceStatus(service.id, service.is_active, 'service')}
                        className="text-electric-blue hover:text-bright-cyan text-xs sm:text-sm"
                      >
                        {service.is_active ? 'Disable' : 'Enable'}
                      </button>
                      <button
                        onClick={() => handleEdit(service.id, 'service')}
                        className="text-electric-blue hover:text-bright-cyan"
                        title="Edit service"
                      >
                        <Edit size={16} sm:size={20} />
                      </button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {activeTab === 'addons' && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
            {addOns.length === 0 ? (
              <div className="col-span-1 sm:col-span-2 text-center py-8">
                <Package className="text-light-gray mx-auto mb-4" size={48} />
                <p className="text-light-gray">No add-ons found</p>
              </div>
            ) : (
              addOns.map((addOn) => (
                <div
                  key={addOn.id}
                  className="bg-navy-dark/50 border border-electric-blue/20 rounded-lg p-4 sm:p-6"
                >
                  <div className="flex justify-between items-start mb-3">
                    <div className="flex-1">
                      <div className="flex items-center mb-2">
                        <h3 className="text-lg sm:text-xl font-bold text-metallic-silver">{addOn.name}</h3>
                        <span className={`ml-3 px-2 py-1 rounded-full text-xs font-semibold ${
                          addOn.is_active
                            ? 'bg-green-500/20 text-green-400'
                            : 'bg-red-500/20 text-red-400'
                        }`}>
                          {addOn.is_active ? 'Active' : 'Inactive'}
                        </span>
                      </div>
                      <p className="text-light-gray text-sm sm:text-base">{addOn.description}</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div className="text-lg sm:text-2xl font-bold text-green-400">
                      ${parseFloat(addOn.price || 0).toFixed(2)}
                    </div>
                    
                    <div className="flex gap-2">
                      <button
                        onClick={() => toggleServiceStatus(addOn.id, addOn.is_active, 'addon')}
                        className="text-electric-blue hover:text-bright-cyan text-xs sm:text-sm"
                      >
                        {addOn.is_active ? 'Disable' : 'Enable'}
                      </button>
                      <button
                        onClick={() => handleEdit(addOn.id, 'addon')}
                        className="text-electric-blue hover:text-bright-cyan"
                        title="Edit add-on"
                      >
                        <Edit size={16} sm:size={20} />
                      </button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  )
}

export default Services
