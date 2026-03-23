// COMPREHENSIVE DATABASE OPERATION FIXES
// This addresses common issues with insert/update operations

// 1. BOOKING CREATION FIX
// Issue: Manual booking_number and timestamp conflicts
const createBookingFix = {
  // Remove manual booking_number (trigger handles it)
  // Remove manual timestamps (trigger handles it)
  // Fix column name mismatch (total_cost vs total)
  insertData: {
    client_id: formData.client_id,
    vehicle_id: formData.vehicle_id,
    service_id: services.find(s => s.name === formData.service_type)?.id,
    service_type: formData.service_type,
    vehicle_size: selectedVehicle?.vehicle_size || 'sedan',
    preferred_date: formData.booking_date,
    preferred_time: formData.booking_time,
    service_address: selectedClient?.address || 'TBD',
    service_city: parsedAddress.city,
    service_state: parsedAddress.state,
    service_zip: parsedAddress.zip,
    subtotal: formData.total_cost,
    tax: formData.total_cost * 0.08, // Add tax calculation
    total: formData.total_cost * 1.08, // Use 'total' not 'total_cost'
    notes: formData.notes,
    status: formData.status || 'pending'
    // Remove: booking_number, created_at, updated_at, total_cost
  }
}

// 2. VEHICLE CREATION FIX
// Issue: Missing required fields or incorrect data types
const createVehicleFix = {
  insertData: {
    client_id: clientData.id,
    year: formData.year ? parseInt(formData.year) : null,
    make: formData.make,
    model: formData.model,
    color: formData.color,
    license_plate: formData.license_plate,
    vin: formData.vin || null,
    size: formData.vehicle_size, // Use 'size' not 'vehicle_size'
    notes: formData.notes,
    is_active: true
    // Remove: vehicle_size (column is 'size')
  }
}

// 3. CLIENT CREATION FIX
// Issue: Foreign key constraint violations
const createClientFix = {
  insertData: {
    user_id: user.id,
    full_name: user.user_metadata?.full_name || user.email?.split('@')[0],
    email: user.email,
    phone: user.user_metadata?.phone || '',
    address: '',
    city: '',
    state: '',
    zip_code: '',
    total_spent: 0,
    total_bookings: 0
    // Remove: created_at, updated_at (triggers handle)
  }
}

// 4. SETTINGS UPDATE FIX
// Issue: Wrong table name and structure
const updateSettingsFix = {
  // Use app_settings table instead of settings
  updateQuery: `
    UPDATE app_settings 
    SET config = config || $1::jsonb,
        updated_at = NOW()
    WHERE id = 1
  `,
  updateData: {
    company_name: newSettings.company_name,
    company_email: newSettings.company_email,
    // ... other settings
  }
}

// 5. PAYMENT CREATION FIX
// Issue: Missing required fields and wrong column names
const createPaymentFix = {
  insertData: {
    booking_id: bookingId,
    client_id: clientId,
    amount: amount,
    status: 'pending',
    payment_method: paymentMethod,
    // Remove: created_at, updated_at (triggers handle)
  }
}

// 6. SERVICE CREATION FIX
// Issue: Missing price columns for different vehicle sizes
const createServiceFix = {
  insertData: {
    name: formData.name,
    description: formData.description,
    type: formData.type,
    base_price_sedan: parseFloat(formData.base_price_sedan) || 0,
    base_price_suv: parseFloat(formData.base_price_suv) || 0,
    base_price_truck: parseFloat(formData.base_price_truck) || 0,
    base_price_van: parseFloat(formData.base_price_van) || 0,
    duration_minutes: parseInt(formData.duration_minutes) || 120,
    is_active: true
  }
}

// 7. INVOICE CREATION FIX
// Issue: Missing required fields and wrong calculations
const createInvoiceFix = {
  insertData: {
    invoice_number: `INV-${Date.now()}`,
    client_id: clientId,
    subtotal: subtotal,
    tax: tax,
    total: total,
    status: 'draft'
    // Remove: created_at, updated_at (triggers handle)
  }
}

// 8. ERROR HANDLING PATTERN
const handleDatabaseOperation = async (operation, data, successMessage, errorMessage) => {
  try {
    const { data: result, error } = await operation
    
    if (error) {
      console.error('Database error:', error)
      // Handle specific error types
      if (error.code === '23505') {
        throw new Error('This record already exists')
      } else if (error.code === '23503') {
        throw new Error('Referenced record does not exist')
      } else if (error.code === '23502') {
        throw new Error('Required field is missing')
      } else {
        throw new Error(error.message || errorMessage)
      }
    }
    
    toast.success(successMessage)
    return result
  } catch (error) {
    console.error('Operation failed:', error)
    toast.error(error.message || errorMessage)
    throw error
  }
}

// 9. COMMON COLUMN NAME FIXES
const columnMapping = {
  // Bookings
  'total_cost': 'total', // total_cost doesn't exist, use total
  'booking_date': 'preferred_date', // booking_date doesn't exist
  'booking_time': 'preferred_time', // booking_time doesn't exist
  'vehicle_size': 'size', // in vehicles table
  
  // Vehicles
  'vehicle_size': 'size', // column is 'size' not 'vehicle_size'
  
  // Settings
  'settings': 'app_settings' // use app_settings table
}

// 10. REQUIRED FIELD VALIDATION
const validateRequiredFields = (data, requiredFields) => {
  const missing = requiredFields.filter(field => !data[field])
  if (missing.length > 0) {
    throw new Error(`Missing required fields: ${missing.join(', ')}`)
  }
}

export {
  createBookingFix,
  createVehicleFix,
  createClientFix,
  updateSettingsFix,
  createPaymentFix,
  createServiceFix,
  createInvoiceFix,
  handleDatabaseOperation,
  columnMapping,
  validateRequiredFields
}
