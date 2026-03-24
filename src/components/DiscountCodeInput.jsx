import React, { useState } from 'react'
import { Tag, CheckCircle, XCircle, Loader2 } from 'lucide-react'
import discountCodeService from '../services/discountCodeService'
import toast from 'react-hot-toast'

function DiscountCodeInput({ 
  amount, 
  onDiscountApplied, 
  onDiscountRemoved, 
  className = '' 
}) {
  const [code, setCode] = useState('')
  const [isValidating, setIsValidating] = useState(false)
  const [appliedDiscount, setAppliedDiscount] = useState(null)
  const [error, setError] = useState('')

  const validateCode = async () => {
    if (!code.trim()) {
      setError('Please enter a discount code')
      return
    }

    setIsValidating(true)
    setError('')

    try {
      const result = await discountCodeService.validateDiscountCode(code.trim(), amount)
      
      if (result.is_valid) {
        setAppliedDiscount({
          code: code.trim().toUpperCase(),
          discount_code_id: result.discount_code_id,
          discount_amount: result.discount_amount,
          final_amount: result.final_amount
        })
        setCode('')
        setError('')
        onDiscountApplied(result)
        toast.success(`Discount code applied! You saved $${result.discount_amount.toFixed(2)}`)
      } else {
        setError(result.error_message || 'Invalid discount code')
        setAppliedDiscount(null)
        onDiscountRemoved()
      }
    } catch (error) {
      console.error('Error validating discount code:', error)
      setError('Failed to validate discount code')
    } finally {
      setIsValidating(false)
    }
  }

  const removeDiscount = () => {
    setAppliedDiscount(null)
    setError('')
    onDiscountRemoved()
    toast.success('Discount code removed')
  }

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      validateCode()
    }
  }

  if (appliedDiscount) {
    return (
      <div className={`bg-green-50 border border-green-200 rounded-lg p-4 ${className}`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <CheckCircle className="text-green-600" size={20} />
            <div>
              <p className="font-medium text-green-900">
                Discount Applied: {appliedDiscount.code}
              </p>
              <p className="text-sm text-green-700">
                You saved ${appliedDiscount.discount_amount.toFixed(2)}
              </p>
            </div>
          </div>
          <button
            onClick={removeDiscount}
            className="text-green-600 hover:text-green-800 font-medium text-sm"
          >
            Remove
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className={`bg-gray-50 border border-gray-200 rounded-lg p-4 ${className}`}>
      <div className="flex items-center space-x-2 mb-3">
        <Tag className="text-gray-600" size={20} />
        <h3 className="font-medium text-gray-900">Discount Code</h3>
      </div>
      
      <div className="space-y-3">
        <div className="flex space-x-2">
          <input
            type="text"
            value={code}
            onChange={(e) => {
              setCode(e.target.value.toUpperCase())
              setError('')
            }}
            onKeyPress={handleKeyPress}
            placeholder="Enter discount code"
            className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            disabled={isValidating}
          />
          <button
            onClick={validateCode}
            disabled={isValidating || !code.trim()}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
          >
            {isValidating ? (
              <>
                <Loader2 size={16} className="animate-spin" />
                <span>Validating...</span>
              </>
            ) : (
              <span>Apply</span>
            )}
          </button>
        </div>
        
        {error && (
          <div className="flex items-center space-x-2 text-red-600 text-sm">
            <XCircle size={16} />
            <span>{error}</span>
          </div>
        )}
        
        <div className="text-xs text-gray-500">
          <p>Enter a valid discount code to apply to your order.</p>
        </div>
      </div>
    </div>
  )
}

export default DiscountCodeInput
