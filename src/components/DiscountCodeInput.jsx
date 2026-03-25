import React, { useState } from 'react'
import { Tag, CheckCircle, XCircle, Loader2 } from 'lucide-react'
import { supabase } from '../lib/supabase'
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
      // Direct table query instead of stored procedure to avoid permission issues
      const { data: discountData, error: discountError } = await supabase
        .from('discount_codes')
        .select('*')
        .eq('code', code.trim().toUpperCase())
        .eq('is_active', true)
        .maybeSingle() // Use maybeSingle() instead of single() to handle no results

      if (discountError) {
        console.error('Discount lookup error:', discountError)
        setError('Invalid discount code')
        setAppliedDiscount(null)
        onDiscountRemoved()
        return
      }

      // Check if discount code exists
      if (!discountData) {
        setError('Invalid discount code')
        setAppliedDiscount(null)
        onDiscountRemoved()
        return
      }

      // Check if discount is valid
      const now = new Date()
      const startDate = new Date(discountData.starts_at)
      const endDate = discountData.expires_at ? new Date(discountData.expires_at) : null

      // Check date validity
      if (startDate > now) {
        setError('Discount code is not yet active')
        setAppliedDiscount(null)
        onDiscountRemoved()
        return
      }

      if (endDate && endDate < now) {
        setError('Discount code has expired')
        setAppliedDiscount(null)
        onDiscountRemoved()
        return
      }

      // Check usage limit
      if (discountData.usage_limit && discountData.usage_count >= discountData.usage_limit) {
        setError('Discount code has reached its usage limit')
        setAppliedDiscount(null)
        onDiscountRemoved()
        return
      }

      // Check minimum amount
      if (discountData.minimum_amount > 0 && amount < discountData.minimum_amount) {
        setError(`Minimum order amount is $${discountData.minimum_amount}`)
        setAppliedDiscount(null)
        onDiscountRemoved()
        return
      }

      // Calculate discount
      let discountAmount = 0
      if (discountData.discount_type === 'percentage') {
        discountAmount = (amount * discountData.discount_value) / 100
        // Apply maximum discount limit if set
        if (discountData.maximum_discount && discountAmount > discountData.maximum_discount) {
          discountAmount = discountData.maximum_discount
        }
      } else {
        discountAmount = discountData.discount_value
      }

      const finalAmount = Math.max(0, amount - discountAmount)
      
      // Ensure final amount meets Stripe's minimum requirement
      if (finalAmount < 0.50) {
        setError('Discount cannot be applied - total must be at least $0.50')
        setAppliedDiscount(null)
        onDiscountRemoved()
        return
      }

      setAppliedDiscount({
        code: code.trim().toUpperCase(),
        discount_code_id: discountData.id,
        discount_amount: discountAmount,
        final_amount: finalAmount
      })
      setCode('')
      setError('')
      onDiscountApplied({
        discount_code_id: discountData.id,
        is_valid: true,
        discount_amount: discountAmount,
        final_amount: finalAmount,
        error_message: null
      })
      toast.success(`Discount code applied! You saved $${discountAmount.toFixed(2)}`)
      
    } catch (error) {
      console.error('Error validating discount code:', error)
      setError('Failed to validate discount code')
      setAppliedDiscount(null)
      onDiscountRemoved()
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
      <div className={`bg-gradient-to-br from-green-600 to-emerald-600 rounded-xl p-6 border border-white/20 ${className}`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <CheckCircle className="text-white" size={20} />
            <div>
              <p className="font-medium text-white">
                Discount Applied: {appliedDiscount.code}
              </p>
              <p className="text-sm text-green-100">
                You saved ${appliedDiscount.discount_amount.toFixed(2)}
              </p>
            </div>
          </div>
          <button
            onClick={removeDiscount}
            className="text-white hover:text-green-100 font-medium text-sm transition-colors"
          >
            Remove
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className={`bg-gradient-to-br from-blue-600 to-purple-600 rounded-xl p-6 border border-white/20 ${className}`}>
      <div className="flex items-center space-x-3 mb-4">
        <Tag className="text-white" size={20} />
        <h3 className="font-bold text-white">Discount Code</h3>
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
            className="flex-1 px-3 py-2 bg-white/20 border border-white/30 rounded-lg focus:ring-2 focus:ring-white/30 focus:border-white text-white placeholder:text-white/60 disabled:opacity-50 backdrop-blur-sm"
            disabled={isValidating}
          />
          <button
            onClick={validateCode}
            disabled={isValidating || !code.trim()}
            className="px-4 py-2 bg-white text-blue-600 rounded-lg hover:bg-white/90 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2 transition-colors font-semibold"
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
          <div className="flex items-center space-x-2 text-red-300 text-sm">
            <XCircle size={16} />
            <span>{error}</span>
          </div>
        )}
        
        <div className="text-xs text-blue-100">
          <p>Enter a valid discount code to apply to your order.</p>
        </div>
      </div>
    </div>
  )
}

export default DiscountCodeInput
