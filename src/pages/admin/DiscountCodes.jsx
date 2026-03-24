import React, { useState, useEffect } from 'react'
import { Plus, Search, Edit2, Trash2, Calendar, DollarSign, Percent, Users, Clock, CheckCircle, XCircle } from 'lucide-react'
import { supabase } from '../../lib/supabase'
import toast from 'react-hot-toast'

function DiscountCodes() {
  const [discountCodes, setDiscountCodes] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [showModal, setShowModal] = useState(false)
  const [editingCode, setEditingCode] = useState(null)
  const [showUsageModal, setShowUsageModal] = useState(false)
  const [selectedCodeForUsage, setSelectedCodeForUsage] = useState(null)
  const [usageData, setUsageData] = useState([])
  const [loadingUsage, setLoadingUsage] = useState(false)
  const [formData, setFormData] = useState({
    code: '',
    description: '',
    discount_type: 'percentage',
    discount_value: '',
    minimum_amount: '0',
    maximum_discount: '',
    usage_limit: '',
    is_active: true,
    starts_at: '',
    expires_at: ''
  })

  useEffect(() => {
    fetchDiscountCodes()
  }, [])

  const fetchDiscountCodes = async () => {
    try {
      const { data, error } = await supabase
        .from('discount_codes')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) throw error
      setDiscountCodes(data || [])
    } catch (error) {
      console.error('Error fetching discount codes:', error)
      toast.error('Failed to load discount codes')
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    try {
      const submitData = {
        ...formData,
        code: formData.code.toUpperCase(),
        discount_value: parseFloat(formData.discount_value),
        minimum_amount: parseFloat(formData.minimum_amount) || 0,
        maximum_discount: formData.maximum_discount ? parseFloat(formData.maximum_discount) : null,
        usage_limit: formData.usage_limit ? parseInt(formData.usage_limit) : null,
        starts_at: formData.starts_at || new Date().toISOString(),
        expires_at: formData.expires_at || null
      }

      if (editingCode) {
        const { error } = await supabase
          .from('discount_codes')
          .update(submitData)
          .eq('id', editingCode.id)

        if (error) throw error
        toast.success('Discount code updated successfully')
      } else {
        const { error } = await supabase
          .from('discount_codes')
          .insert(submitData)

        if (error) throw error
        toast.success('Discount code created successfully')
      }

      setShowModal(false)
      setEditingCode(null)
      resetForm()
      fetchDiscountCodes()
    } catch (error) {
      console.error('Error saving discount code:', error)
      toast.error('Failed to save discount code')
    }
  }

  const handleEdit = (code) => {
    setEditingCode(code)
    setFormData({
      code: code.code,
      description: code.description || '',
      discount_type: code.discount_type,
      discount_value: code.discount_value.toString(),
      minimum_amount: code.minimum_amount.toString(),
      maximum_discount: code.maximum_discount?.toString() || '',
      usage_limit: code.usage_limit?.toString() || '',
      is_active: code.is_active,
      starts_at: code.starts_at ? new Date(code.starts_at).toISOString().slice(0, 16) : '',
      expires_at: code.expires_at ? new Date(code.expires_at).toISOString().slice(0, 16) : ''
    })
    setShowModal(true)
  }

  const handleDelete = async (id) => {
    if (!confirm('Are you sure you want to delete this discount code?')) return

    try {
      const { error } = await supabase
        .from('discount_codes')
        .delete()
        .eq('id', id)

      if (error) throw error
      toast.success('Discount code deleted successfully')
      fetchDiscountCodes()
    } catch (error) {
      console.error('Error deleting discount code:', error)
      toast.error('Failed to delete discount code')
    }
  }

  const handleViewUsage = async (code) => {
    setSelectedCodeForUsage(code)
    setLoadingUsage(true)
    setShowUsageModal(true)

    try {
      const { data, error } = await supabase
        .from('discount_code_usage')
        .select(`
          *,
          invoices(invoice_number, total),
          clients(full_name, email)
        `)
        .eq('discount_code_id', code.id)
        .order('used_at', { ascending: false })

      if (error) throw error
      setUsageData(data || [])
    } catch (error) {
      console.error('Error fetching usage data:', error)
      toast.error('Failed to fetch usage data')
    } finally {
      setLoadingUsage(false)
    }
  }

  const resetForm = () => {
    setFormData({
      code: '',
      description: '',
      discount_type: 'percentage',
      discount_value: '',
      minimum_amount: '0',
      maximum_discount: '',
      usage_limit: '',
      is_active: true,
      starts_at: '',
      expires_at: ''
    })
  }

  const filteredCodes = discountCodes.filter(code =>
    code.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
    code.description?.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const formatDate = (dateString) => {
    if (!dateString) return 'No expiration'
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  }

  const isExpired = (dateString) => {
    if (!dateString) return false
    return new Date(dateString) < new Date()
  }

  const getStatusBadge = (code) => {
    if (!code.is_active) {
      return <span className="px-2 py-1 text-xs font-semibold rounded-full bg-gray-100 text-gray-800">Inactive</span>
    }
    if (isExpired(code.expires_at)) {
      return <span className="px-2 py-1 text-xs font-semibold rounded-full bg-red-100 text-red-800">Expired</span>
    }
    if (code.usage_limit && code.usage_count >= code.usage_limit) {
      return <span className="px-2 py-1 text-xs font-semibold rounded-full bg-yellow-100 text-yellow-800">Used Up</span>
    }
    return <span className="px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800">Active</span>
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Discount Codes</h1>
          <p className="text-gray-600">Manage discount codes and promotions</p>
        </div>
        <button
          onClick={() => {
            setEditingCode(null)
            resetForm()
            setShowModal(true)
          }}
          className="btn-primary flex items-center space-x-2"
        >
          <Plus size={20} />
          <span>Add Discount Code</span>
        </button>
      </div>

      {/* Search */}
      <div className="bg-white p-4 rounded-lg shadow">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
          <input
            type="text"
            placeholder="Search discount codes..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
      </div>

      {/* Discount Codes Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Code</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Description</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Discount</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Usage</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Dates</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredCodes.map((code) => (
                <tr key={code.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">{code.code}</div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm text-gray-900">{code.description || 'No description'}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center space-x-2">
                      {code.discount_type === 'percentage' ? (
                        <Percent size={16} className="text-green-600" />
                      ) : (
                        <DollarSign size={16} className="text-blue-600" />
                      )}
                      <span className="text-sm text-gray-900">
                        {code.discount_type === 'percentage' 
                          ? `${code.discount_value}%` 
                          : `$${code.discount_value}`
                        }
                      </span>
                    </div>
                    {code.minimum_amount > 0 && (
                      <div className="text-xs text-gray-500">Min: ${code.minimum_amount}</div>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center space-x-3">
                      <div className="text-center">
                        <div className="text-lg font-bold text-gray-900">
                          {code.usage_count}
                        </div>
                        <div className="text-xs text-gray-500">
                          of {code.usage_limit || '∞'}
                        </div>
                      </div>
                      {code.usage_limit && (
                        <div className="flex-1">
                          <div className="w-full bg-gray-200 rounded-full h-3">
                            <div 
                              className={`h-3 rounded-full transition-all duration-300 ${
                                (code.usage_count / code.usage_limit) >= 1 
                                  ? 'bg-red-500' 
                                  : (code.usage_count / code.usage_limit) >= 0.8 
                                  ? 'bg-yellow-500' 
                                  : 'bg-green-500'
                              }`}
                              style={{ width: `${Math.min((code.usage_count / code.usage_limit) * 100, 100)}%` }}
                            ></div>
                          </div>
                          <div className="text-xs text-gray-500 mt-1">
                            {Math.round((code.usage_count / code.usage_limit) * 100)}% used
                          </div>
                        </div>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">
                      <div className="flex items-center space-x-1">
                        <Calendar size={14} className="text-gray-400" />
                        <span>{formatDate(code.starts_at)}</span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <Clock size={14} className="text-gray-400" />
                        <span>{formatDate(code.expires_at)}</span>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {getStatusBadge(code)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                    <button
                      onClick={() => handleEdit(code)}
                      className="text-blue-600 hover:text-blue-900"
                      title="Edit"
                    >
                      <Edit2 size={16} />
                    </button>
                    <button
                      onClick={() => handleViewUsage(code)}
                      className="text-green-600 hover:text-green-900"
                      title="View Usage"
                    >
                      <Users size={16} />
                    </button>
                    <button
                      onClick={() => handleDelete(code.id)}
                      className="text-red-600 hover:text-red-900"
                      title="Delete"
                    >
                      <Trash2 size={16} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        
        {filteredCodes.length === 0 && (
          <div className="text-center py-12">
            <p className="text-gray-500">No discount codes found</p>
          </div>
        )}
      </div>

      {/* Add/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <h2 className="text-xl font-bold mb-4">
              {editingCode ? 'Edit Discount Code' : 'Add Discount Code'}
            </h2>
            
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Code</label>
                  <input
                    type="text"
                    required
                    value={formData.code}
                    onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="SAVE10"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Discount Type</label>
                  <select
                    value={formData.discount_type}
                    onChange={(e) => setFormData({ ...formData, discount_type: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="percentage">Percentage</option>
                    <option value="fixed_amount">Fixed Amount</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                <input
                  type="text"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Special discount for new customers"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Discount Value ({formData.discount_type === 'percentage' ? '%' : '$'})
                  </label>
                  <input
                    type="number"
                    required
                    min="0"
                    step={formData.discount_type === 'percentage' ? '0.01' : '0.01'}
                    value={formData.discount_value}
                    onChange={(e) => setFormData({ ...formData, discount_value: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder={formData.discount_type === 'percentage' ? '10' : '25'}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Minimum Amount ($)</label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={formData.minimum_amount}
                    onChange={(e) => setFormData({ ...formData, minimum_amount: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="0"
                  />
                </div>
              </div>

              {formData.discount_type === 'percentage' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Maximum Discount ($)</label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={formData.maximum_discount}
                    onChange={(e) => setFormData({ ...formData, maximum_discount: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Leave empty for no maximum"
                  />
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Usage Limit</label>
                  <input
                    type="number"
                    min="1"
                    value={formData.usage_limit}
                    onChange={(e) => setFormData({ ...formData, usage_limit: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Leave empty for unlimited"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                  <select
                    value={formData.is_active}
                    onChange={(e) => setFormData({ ...formData, is_active: e.target.value === 'true' })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="true">Active</option>
                    <option value="false">Inactive</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Start Date</label>
                  <input
                    type="datetime-local"
                    value={formData.starts_at}
                    onChange={(e) => setFormData({ ...formData, starts_at: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Expiration Date</label>
                  <input
                    type="datetime-local"
                    value={formData.expires_at}
                    onChange={(e) => setFormData({ ...formData, expires_at: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>

              <div className="flex justify-end space-x-3 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setShowModal(false)
                    setEditingCode(null)
                    resetForm()
                  }}
                  className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn-primary"
                >
                  {editingCode ? 'Update' : 'Create'} Discount Code
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Usage Tracking Modal */}
      {showUsageModal && selectedCodeForUsage && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-4xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold">Usage Tracking - {selectedCodeForUsage.code}</h2>
              <button
                onClick={() => {
                  setShowUsageModal(false)
                  setSelectedCodeForUsage(null)
                  setUsageData([])
                }}
                className="text-gray-500 hover:text-gray-700"
              >
                <XCircle size={24} />
              </button>
            </div>

            <div className="bg-gray-50 p-4 rounded-lg mb-4">
              <div className="grid grid-cols-4 gap-4 text-center">
                <div>
                  <p className="text-sm text-gray-600">Total Uses</p>
                  <p className="text-2xl font-bold text-blue-600">{selectedCodeForUsage.usage_count}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Remaining</p>
                  <p className="text-2xl font-bold text-green-600">
                    {selectedCodeForUsage.usage_limit ? 
                      selectedCodeForUsage.usage_limit - selectedCodeForUsage.usage_count : 
                      'Unlimited'
                    }
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Total Saved</p>
                  <p className="text-2xl font-bold text-purple-600">
                    ${usageData.reduce((sum, usage) => sum + usage.discount_amount, 0).toFixed(2)}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Avg Discount</p>
                  <p className="text-2xl font-bold text-orange-600">
                    ${usageData.length > 0 ? 
                      (usageData.reduce((sum, usage) => sum + usage.discount_amount, 0) / usageData.length).toFixed(2) : 
                      '0.00'
                    }
                  </p>
                </div>
              </div>
            </div>

            {loadingUsage ? (
              <div className="flex items-center justify-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              </div>
            ) : usageData.length === 0 ? (
              <div className="text-center py-12">
                <Users className="mx-auto mb-4 text-gray-400" size={48} />
                <p className="text-gray-500">No usage data available yet</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Customer</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Invoice</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Original</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Discount</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Final</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {usageData.map((usage) => (
                      <tr key={usage.id} className="hover:bg-gray-50">
                        <td className="px-4 py-3 text-sm">
                          {new Date(usage.used_at).toLocaleDateString('en-US', {
                            year: 'numeric',
                            month: 'short',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </td>
                        <td className="px-4 py-3 text-sm">
                          <div>
                            <div className="font-medium text-gray-900">{usage.clients?.full_name || 'N/A'}</div>
                            <div className="text-gray-500">{usage.clients?.email || 'N/A'}</div>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-sm font-medium text-gray-900">
                          {usage.invoices?.invoice_number || 'N/A'}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-900">
                          ${usage.original_amount.toFixed(2)}
                        </td>
                        <td className="px-4 py-3 text-sm font-semibold text-green-600">
                          -${usage.discount_amount.toFixed(2)}
                        </td>
                        <td className="px-4 py-3 text-sm font-semibold text-gray-900">
                          ${usage.final_amount.toFixed(2)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

export default DiscountCodes
