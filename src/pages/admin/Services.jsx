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
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-4xl font-bold metallic-heading mb-2">Services & Pricing</h1>
          <p className="text-light-gray">Manage service packages and add-ons</p>
        </div>
        <button 
          onClick={() => navigate('/admin/services/new')}
          className="btn-primary mr-2"
        >
          <Plus size={20} className="inline mr-2" />
          Add Service
        </button>
        <button 
          onClick={() => navigate('/admin/addons/new')}
          className="btn-primary"
        >
          <Plus size={20} className="inline mr-2" />
          Add Add-on
        </button>
      </div>

      <div className="glass-card">
        <div className="flex space-x-1 mb-6 border-b border-electric-blue/20">
          <button
            onClick={() => setActiveTab('services')}
            className={`px-4 py-2 font-semibold transition-colors ${
              activeTab === 'services'
                ? 'text-electric-blue border-b-2 border-electric-blue'
                : 'text-light-gray hover:text-metallic-silver'
            }`}
          >
            Services
          </button>
          <button
            onClick={() => setActiveTab('addons')}
            className={`px-4 py-2 font-semibold transition-colors ${
              activeTab === 'addons'
                ? 'text-electric-blue border-b-2 border-electric-blue'
                : 'text-light-gray hover:text-metallic-silver'
            }`}
          >
            Add-ons
          </button>
        </div>

        {activeTab === 'services' && (
          <div className="space-y-4">
            {services.length === 0 ? (
              <div className="text-center py-8">
                <Package className="text-light-gray mx-auto mb-4" size={48} />
                <p className="text-light-gray">No services found</p>
              </div>
            ) : (
              services.map((service) => (
                <div
                  key={service.id}
                  className="bg-navy-dark/50 border border-electric-blue/20 rounded-lg p-6"
                >
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <div className="flex items-center mb-2">
                        <h3 className="text-xl font-bold text-metallic-silver">{service.name}</h3>
                        <span className={`ml-3 px-2 py-1 rounded-full text-xs font-semibold ${
                          service.is_active
                            ? 'bg-green-500/20 text-green-400'
                            : 'bg-red-500/20 text-red-400'
                        }`}>
                          {service.is_active ? 'Active' : 'Inactive'}
                        </span>
                      </div>
                      <p className="text-light-gray mb-4">{service.description}</p>
                      <div className="grid grid-cols-4 gap-4">
                        <div>
                          <p className="text-sm text-light-gray">Sedan</p>
                          <p className="text-bright-cyan font-bold">${service.base_price_sedan || 0}</p>
                        </div>
                        <div>
                          <p className="text-sm text-light-gray">SUV</p>
                          <p className="text-bright-cyan font-bold">${service.base_price_suv || 0}</p>
                        </div>
                        <div>
                          <p className="text-sm text-light-gray">Truck</p>
                          <p className="text-bright-cyan font-bold">${service.base_price_truck || 0}</p>
                        </div>
                        <div>
                          <p className="text-sm text-light-gray">Van</p>
                          <p className="text-bright-cyan font-bold">${service.base_price_van || 0}</p>
                        </div>
                      </div>
                    </div>
                    <div className="flex gap-2 ml-4">
                      <button
                        onClick={() => toggleServiceStatus(service.id, service.is_active, 'service')}
                        className="text-electric-blue hover:text-bright-cyan"
                      >
                        {service.is_active ? 'Disable' : 'Enable'}
                      </button>
                      <button
                        onClick={() => handleEdit(service.id, 'service')}
                        className="text-electric-blue hover:text-bright-cyan"
                        title="Edit service"
                      >
                        <Edit size={20} />
                      </button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {activeTab === 'addons' && (
          <div className="grid md:grid-cols-2 gap-4">
            {addOns.length === 0 ? (
              <div className="col-span-2 text-center py-8">
                <Package className="text-light-gray mx-auto mb-4" size={48} />
                <p className="text-light-gray">No add-ons found</p>
              </div>
            ) : (
              addOns.map((addon) => (
                <div
                  key={addon.id}
                  className="bg-navy-dark/50 border border-electric-blue/20 rounded-lg p-4"
                >
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <div className="flex items-center">
                        <h4 className="font-bold text-metallic-silver">{addon.name}</h4>
                        <span className={`ml-2 px-2 py-1 rounded-full text-xs font-semibold ${
                          addon.is_active
                            ? 'bg-green-500/20 text-green-400'
                            : 'bg-red-500/20 text-red-400'
                        }`}>
                          {addon.is_active ? 'Active' : 'Inactive'}
                        </span>
                      </div>
                      <p className="text-sm text-light-gray">{addon.description}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-bright-cyan font-bold">${addon.price}</p>
                    </div>
                  </div>
                  <div className="flex justify-between items-center pt-2 border-t border-electric-blue/20">
                    <span className="text-xs text-light-gray capitalize">{addon.category}</span>
                    <div className="flex gap-2">
                      <button
                        onClick={() => toggleServiceStatus(addon.id, addon.is_active, 'addon')}
                        className="text-xs text-electric-blue hover:text-bright-cyan"
                      >
                        {addon.is_active ? 'Disable' : 'Enable'}
                      </button>
                      <button
                        onClick={() => handleEdit(addon.id, 'addon')}
                        className="text-electric-blue hover:text-bright-cyan"
                        title="Edit add-on"
                      >
                        <Edit size={16} />
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
