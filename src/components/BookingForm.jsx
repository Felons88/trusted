import { useState, useEffect } from 'react'
import { Calendar, Clock, MapPin, Car, CreditCard, Mail, Check, AlertCircle, Loader2 } from 'lucide-react'
import PaymentProcessor from './PaymentProcessor'
import AddressAutocomplete from './AddressAutocomplete'
import emailService from '../services/emailService'
import toast from 'react-hot-toast'

function BookingForm({ service, onBookingComplete }) {
  const [step, setStep] = useState(1)
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    // Customer Information
    customerName: '',
    customerEmail: '',
    customerPhone: '',
    
    // Service Details
    serviceType: service?.name || '',
    servicePrice: service?.price || 0,
    date: '',
    time: '',
    
    // Location
    address: '',
    city: '',
    state: '',
    zipCode: '',
    
    // Vehicle Details
    vehicleYear: '',
    vehicleMake: '',
    vehicleModel: '',
    vehicleColor: '',
    licensePlate: '',
    
    // Additional Notes
    notes: '',
    
    // Payment
    paymentMethod: 'stripe',
    paymentStatus: 'pending'
  })

  const [availableTimeSlots] = useState([
    '9:00 AM', '10:00 AM', '11:00 AM', '12:00 PM',
    '1:00 PM', '2:00 PM', '3:00 PM', '4:00 PM', '5:00 PM'
  ])

  const [paymentCompleted, setPaymentCompleted] = useState(false)
  const [bookingConfirmed, setBookingConfirmed] = useState(false)

  // Handle form input changes
  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
  }

  // Validate current step
  const validateStep = () => {
    switch (step) {
      case 1:
        return formData.customerName && formData.customerEmail && formData.customerPhone
      case 2:
        return formData.date && formData.time
      case 3:
        return formData.address && formData.city && formData.state && formData.zipCode
      case 4:
        return formData.vehicleYear && formData.vehicleMake && formData.vehicleModel
      default:
        return true
    }
  }

  // Handle next step
  const handleNext = () => {
    if (!validateStep()) {
      toast.error('Please fill in all required fields')
      return
    }
    setStep(prev => prev + 1)
  }

  // Handle previous step
  const handlePrevious = () => {
    setStep(prev => prev - 1)
  }

  // Handle payment success
  const handlePaymentSuccess = async (paymentData) => {
    setLoading(true)
    try {
      // Create booking record
      const bookingData = {
        ...formData,
        paymentData,
        status: 'paid',
        createdAt: new Date().toISOString()
      }

      // Here you would save to your database
      console.log('Booking created:', bookingData)

      // Send confirmation emails
      await emailService.sendBookingConfirmation(formData.customerEmail, {
        serviceType: formData.serviceType,
        date: formData.date,
        time: formData.time,
        address: `${formData.address}, ${formData.city}, ${formData.state} ${formData.zipCode}`,
        vehicleYear: formData.vehicleYear,
        vehicleMake: formData.vehicleMake,
        vehicleModel: formData.vehicleModel,
        totalAmount: formData.servicePrice
      })

      setPaymentCompleted(true)
      setBookingConfirmed(true)
      toast.success('Booking confirmed! Check your email for details.')
      
      if (onBookingComplete) {
        onBookingComplete(bookingData)
      }
    } catch (error) {
      console.error('Booking completion error:', error)
      toast.error('Failed to complete booking')
    } finally {
      setLoading(false)
    }
  }

  // Handle payment error
  const handlePaymentError = (error) => {
    console.error('Payment error:', error)
    toast.error('Payment failed. Please try again.')
  }

  // Render step indicators
  const renderStepIndicators = () => {
    const steps = [
      { number: 1, title: 'Customer Info', icon: Mail },
      { number: 2, title: 'Schedule', icon: Calendar },
      { number: 3, title: 'Location', icon: MapPin },
      { number: 4, title: 'Vehicle', icon: Car },
      { number: 5, title: 'Payment', icon: CreditCard }
    ]

    return (
      <div className="flex justify-between items-center mb-8">
        {steps.map((stepData, index) => {
          const Icon = stepData.icon
          const isActive = step === stepData.number
          const isCompleted = step > stepData.number

          return (
            <div key={stepData.number} className="flex flex-col items-center flex-1">
              <div className={`w-10 h-10 rounded-full flex items-center justify-center mb-2 ${
                isActive ? 'bg-blue-500 text-white' : 
                isCompleted ? 'bg-green-500 text-white' : 
                'bg-gray-200 text-gray-600'
              }`}>
                {isCompleted ? <Check size={20} /> : <Icon size={20} />}
              </div>
              <span className={`text-xs text-center ${
                isActive ? 'text-blue-500 font-medium' : 
                isCompleted ? 'text-green-500' : 
                'text-gray-500'
              }`}>
                {stepData.title}
              </span>
            </div>
          )
        })}
      </div>
    )
  }

  // Render customer info step
  const renderCustomerInfo = () => (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold mb-4">Customer Information</h3>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Full Name *
          </label>
          <input
            type="text"
            name="customerName"
            value={formData.customerName}
            onChange={handleChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="John Doe"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Email Address *
          </label>
          <input
            type="email"
            name="customerEmail"
            value={formData.customerEmail}
            onChange={handleChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="john@example.com"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Phone Number *
          </label>
          <input
            type="tel"
            name="customerPhone"
            value={formData.customerPhone}
            onChange={handleChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="(555) 123-4567"
          />
        </div>
      </div>
    </div>
  )

  // Render scheduling step
  const renderScheduling = () => (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold mb-4">Schedule Your Service</h3>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Service Date *
          </label>
          <input
            type="date"
            name="date"
            value={formData.date}
            onChange={handleChange}
            min={new Date().toISOString().split('T')[0]}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Preferred Time *
          </label>
          <select
            name="time"
            value={formData.time}
            onChange={handleChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">Select a time</option>
            {availableTimeSlots.map(slot => (
              <option key={slot} value={slot}>{slot}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="bg-blue-50 p-4 rounded-lg">
        <div className="flex items-start space-x-3">
          <Calendar className="text-blue-500 mt-1" size={20} />
          <div>
            <h4 className="font-medium text-blue-900">Service Details</h4>
            <p className="text-blue-700">Service: {formData.serviceType}</p>
            <p className="text-blue-700">Price: ${formData.servicePrice}</p>
            <p className="text-blue-700">Duration: Approximately 2-3 hours</p>
          </div>
        </div>
      </div>
    </div>
  )

  // Render location step
  const renderLocation = () => (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold mb-4">Service Location</h3>
      
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Service Address *
        </label>
        <AddressAutocomplete
          value={formData.address}
          onChange={(e) => setFormData(prev => ({ ...prev, address: e.target.value }))}
          onAddressSelect={(addressData) => {
            setFormData(prev => ({
              ...prev,
              address: addressData.fullAddress,
              city: addressData.components.city,
              state: addressData.components.state,
              zipCode: addressData.components.zipCode,
              coordinates: addressData.coordinates
            }))
          }}
          placeholder="Enter your service address..."
          required={true}
        />
      </div>

      {/* Hidden fields that get filled by AddressAutocomplete */}
      <div className="hidden">
        <input type="text" name="city" value={formData.city} onChange={handleChange} />
        <input type="text" name="state" value={formData.state} onChange={handleChange} />
        <input type="text" name="zipCode" value={formData.zipCode} onChange={handleChange} />
      </div>

      <div className="bg-yellow-50 p-4 rounded-lg">
        <div className="flex items-start space-x-3">
          <MapPin className="text-yellow-500 mt-1" size={20} />
          <div>
            <h4 className="font-medium text-yellow-900">Service Area</h4>
            <p className="text-yellow-700">We'll come to your location! Please ensure there's adequate space for our detailing equipment.</p>
            <p className="text-yellow-600 text-sm mt-1">Address validation powered by Mapbox</p>
          </div>
        </div>
      </div>
    </div>
  )

  // Render vehicle step
  const renderVehicle = () => (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold mb-4">Vehicle Information</h3>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Vehicle Year *
          </label>
          <input
            type="number"
            name="vehicleYear"
            value={formData.vehicleYear}
            onChange={handleChange}
            min="1990"
            max={new Date().getFullYear() + 1}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="2023"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Vehicle Make *
          </label>
          <input
            type="text"
            name="vehicleMake"
            value={formData.vehicleMake}
            onChange={handleChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Toyota"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Vehicle Model *
          </label>
          <input
            type="text"
            name="vehicleModel"
            value={formData.vehicleModel}
            onChange={handleChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Camry"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Vehicle Color
          </label>
          <input
            type="text"
            name="vehicleColor"
            value={formData.vehicleColor}
            onChange={handleChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Silver"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            License Plate
          </label>
          <input
            type="text"
            name="licensePlate"
            value={formData.licensePlate}
            onChange={handleChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="ABC1234"
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Additional Notes
        </label>
        <textarea
          name="notes"
          value={formData.notes}
          onChange={handleChange}
          rows={3}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="Any special requests or instructions..."
        />
      </div>
    </div>
  )

  // Render payment step
  const renderPayment = () => (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold mb-4">Payment Information</h3>
      
      <div className="bg-gray-50 p-4 rounded-lg mb-4">
        <h4 className="font-medium mb-2">Order Summary</h4>
        <div className="space-y-2">
          <div className="flex justify-between">
            <span>Service:</span>
            <span>{formData.serviceType}</span>
          </div>
          <div className="flex justify-between">
            <span>Date:</span>
            <span>{formData.date} at {formData.time}</span>
          </div>
          <div className="flex justify-between">
            <span>Vehicle:</span>
            <span>{formData.vehicleYear} {formData.vehicleMake} {formData.vehicleModel}</span>
          </div>
          <div className="flex justify-between font-bold text-lg pt-2 border-t">
            <span>Total:</span>
            <span>${formData.servicePrice}</span>
          </div>
        </div>
      </div>

      <PaymentProcessor
        amount={formData.servicePrice}
        bookingId={`booking_${Date.now()}`}
        customerEmail={formData.customerEmail}
        onSuccess={handlePaymentSuccess}
        onError={handlePaymentError}
      />
    </div>
  )

  // Render booking confirmation
  const renderConfirmation = () => (
    <div className="text-center space-y-4">
      <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto">
        <Check className="text-green-500" size={32} />
      </div>
      
      <h3 className="text-2xl font-bold text-green-600">Booking Confirmed!</h3>
      
      <div className="bg-green-50 p-6 rounded-lg max-w-md mx-auto">
        <h4 className="font-medium mb-4">Booking Details</h4>
        <div className="space-y-2 text-left">
          <p><strong>Service:</strong> {formData.serviceType}</p>
          <p><strong>Date:</strong> {formData.date} at {formData.time}</p>
          <p><strong>Location:</strong> {formData.address}, {formData.city}, {formData.state} {formData.zipCode}</p>
          <p><strong>Vehicle:</strong> {formData.vehicleYear} {formData.vehicleMake} {formData.vehicleModel}</p>
          <p><strong>Total Paid:</strong> ${formData.servicePrice}</p>
        </div>
      </div>
      
      <div className="bg-blue-50 p-4 rounded-lg max-w-md mx-auto">
        <div className="flex items-start space-x-3">
          <Mail className="text-blue-500 mt-1" size={20} />
          <div className="text-left">
            <h4 className="font-medium text-blue-900">Confirmation Email Sent</h4>
            <p className="text-blue-700">Check your email at {formData.customerEmail} for detailed booking information.</p>
          </div>
        </div>
      </div>
    </div>
  )

  return (
    <div className="max-w-2xl mx-auto p-6 bg-white rounded-lg shadow-lg">
      {renderStepIndicators()}
      
      {!bookingConfirmed ? (
        <>
          {/* Step Content */}
          <div className="mb-8">
            {step === 1 && renderCustomerInfo()}
            {step === 2 && renderScheduling()}
            {step === 3 && renderLocation()}
            {step === 4 && renderVehicle()}
            {step === 5 && renderPayment()}
          </div>

          {/* Navigation Buttons */}
          <div className="flex justify-between">
            <button
              onClick={handlePrevious}
              disabled={step === 1}
              className="px-6 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Previous
            </button>

            {step < 5 ? (
              <button
                onClick={handleNext}
                disabled={loading}
                className="px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <span className="flex items-center">
                    <Loader2 className="animate-spin mr-2" size={16} />
                    Processing...
                  </span>
                ) : (
                  'Next'
                )}
              </button>
            ) : null}
          </div>
        </>
      ) : (
        renderConfirmation()
      )}
    </div>
  )
}

export default BookingForm
