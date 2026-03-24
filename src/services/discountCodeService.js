import { supabase } from '../lib/supabase'

class DiscountCodeService {
  async validateDiscountCode(code, amount) {
    try {
      const { data, error } = await supabase
        .rpc('validate_and_apply_discount', {
          p_code: code,
          p_amount: amount
        })

      if (error) throw error

      if (data && data.length > 0) {
        return data[0]
      }

      return {
        discount_code_id: null,
        is_valid: false,
        discount_amount: 0,
        final_amount: amount,
        error_message: 'Invalid discount code'
      }
    } catch (error) {
      console.error('Error validating discount code:', error)
      return {
        discount_code_id: null,
        is_valid: false,
        discount_amount: 0,
        final_amount: amount,
        error_message: 'Failed to validate discount code'
      }
    }
  }

  async recordDiscountUsage(discountCodeId, invoiceId, clientId, discountAmount, originalAmount, finalAmount) {
    try {
      const { error } = await supabase
        .rpc('record_discount_usage', {
          p_discount_code_id: discountCodeId,
          p_invoice_id: invoiceId,
          p_client_id: clientId,
          p_discount_amount: discountAmount,
          p_original_amount: originalAmount,
          p_final_amount: finalAmount
        })

      if (error) throw error
      return true
    } catch (error) {
      console.error('Error recording discount usage:', error)
      return false
    }
  }

  async getDiscountCodeDetails(code) {
    try {
      const { data, error } = await supabase
        .from('discount_codes')
        .select('*')
        .eq('code', code.toUpperCase())
        .single()

      if (error) {
        if (error.code === 'PGRST116') {
          return null // Code not found
        }
        throw error
      }

      return data
    } catch (error) {
      console.error('Error fetching discount code details:', error)
      return null
    }
  }

  async getAllDiscountCodes() {
    try {
      const { data, error } = await supabase
        .from('discount_codes')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) throw error
      return data || []
    } catch (error) {
      console.error('Error fetching discount codes:', error)
      return []
    }
  }

  async createDiscountCode(discountData) {
    try {
      const { data, error } = await supabase
        .from('discount_codes')
        .insert({
          ...discountData,
          code: discountData.code.toUpperCase()
        })
        .select()
        .single()

      if (error) throw error
      return data
    } catch (error) {
      console.error('Error creating discount code:', error)
      throw error
    }
  }

  async updateDiscountCode(id, discountData) {
    try {
      const { data, error } = await supabase
        .from('discount_codes')
        .update({
          ...discountData,
          code: discountData.code ? discountData.code.toUpperCase() : undefined
        })
        .eq('id', id)
        .select()
        .single()

      if (error) throw error
      return data
    } catch (error) {
      console.error('Error updating discount code:', error)
      throw error
    }
  }

  async deleteDiscountCode(id) {
    try {
      const { error } = await supabase
        .from('discount_codes')
        .delete()
        .eq('id', id)

      if (error) throw error
      return true
    } catch (error) {
      console.error('Error deleting discount code:', error)
      throw error
    }
  }

  async getDiscountUsageStats(discountCodeId) {
    try {
      const { data, error } = await supabase
        .from('discount_code_usage')
        .select(`
          *,
          invoices(invoice_number, total),
          clients(full_name, email)
        `)
        .eq('discount_code_id', discountCodeId)
        .order('used_at', { ascending: false })

      if (error) throw error
      return data || []
    } catch (error) {
      console.error('Error fetching discount usage stats:', error)
      return []
    }
  }

  formatDiscountDisplay(discountCode) {
    if (!discountCode) return ''
    
    if (discountCode.discount_type === 'percentage') {
      return `${discountCode.discount_value}% OFF`
    } else {
      return `$${discountCode.discount_value} OFF`
    }
  }

  isDiscountCodeValid(discountCode) {
    if (!discountCode || !discountCode.is_active) return false
    
    const now = new Date()
    const startDate = new Date(discountCode.starts_at)
    const endDate = discountCode.expires_at ? new Date(discountCode.expires_at) : null
    
    if (now < startDate) return false
    if (endDate && now > endDate) return false
    if (discountCode.usage_limit && discountCode.usage_count >= discountCode.usage_limit) return false
    
    return true
  }
}

export default new DiscountCodeService()
