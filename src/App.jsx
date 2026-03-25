import { useEffect } from 'react'
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import { useAuthStore } from './store/authStore'
import Navigation from './components/Navigation'
import FloatingCallButton from './components/FloatingCallButton'
import OutstandingInvoiceAlert from './components/OutstandingInvoiceAlert'
import AnalyticsTracker from './components/AnalyticsTracker'
import { ProtectedRoute, AdminRoute } from './components/ProtectedRoute'
import { SettingsProvider } from './contexts/SettingsContext'
import { Analytics } from '@vercel/analytics/react'
import { SpeedInsights } from '@vercel/speed-insights/react'

import Home from './pages/Home'
import ExteriorDetailing from './pages/ExteriorDetailing'
import InteriorDetailing from './pages/InteriorDetailing'
import AddOns from './pages/AddOns'
import Gallery from './pages/Gallery'
import Reviews from './pages/Reviews'
import ServiceArea from './pages/ServiceArea'
import BookNowV2 from './pages/BookNowV2'
import Contact from './pages/Contact'
import Quote from './pages/Quote'
import Login from './pages/Login'
import Register from './pages/Register'

import AdminLayout from './pages/admin/AdminLayout'
import Dashboard from './pages/admin/Dashboard'
import Bookings from './pages/admin/Bookings'
import BookingDetail from './pages/admin/BookingDetail'
import BookingEdit from './pages/admin/BookingEdit'
import Clients from './pages/admin/Clients'
import ClientNewBooking from './pages/client/ClientNewBooking'
import ClientBookings from './pages/client/ClientBookings'
import NewBooking from './pages/admin/NewBooking'
import NewClient from './pages/admin/NewClient'
import Vehicles from './pages/admin/Vehicles'
import NewVehicle from './pages/admin/NewVehicle'
import VehicleEdit from './pages/admin/VehicleEdit'
import AdminVehicleDetail from './pages/admin/VehicleDetail'
import Services from './pages/admin/Services'
import ServiceEdit from './pages/admin/ServiceEdit'
import NewService from './pages/admin/NewService'
import NewAddOn from './pages/admin/NewAddOn'
import AddOnEdit from './pages/admin/AddOnEdit'
import QuoteRequests from './pages/admin/QuoteRequests'
import QuoteRequest from './pages/admin/QuoteRequest'
import QuoteArchive from './pages/admin/QuoteArchive'
import ClientDetail from './pages/admin/ClientDetail'
import ClientEdit from './pages/admin/ClientEdit'
import InvoiceDetail from './pages/admin/InvoiceDetail'
import Invoices from './pages/admin/Invoices'
import NewInvoice from './pages/admin/NewInvoice'
import InvoicePayment from './pages/admin/InvoicePayment'
import Payments from './pages/admin/Payments'
import PaymentDetail from './pages/admin/PaymentDetail'
import Messages from './pages/admin/Messages'
import Settings from './pages/admin/Settings'
import AdminAnalytics from './pages/admin/Analytics'
import Payment from './pages/Payment'
import Success from './pages/Success'
import Receipt from './pages/Receipt'

import ClientPortal from './pages/client/ClientPortal'
import ClientInvoices from './pages/client/ClientInvoices'
import ClientVehicles from './pages/client/Vehicles'
import AddVehicle from './pages/client/AddVehicle'
import VehicleDetail from './pages/client/VehicleDetail'
import ClientSettings from './pages/client/ClientSettings'
import ClientBookingDetail from './pages/client/ClientBookingDetail'
import ClientVehicleEdit from './pages/client/ClientVehicleEdit'
import DiscountCodes from './pages/admin/DiscountCodes'

function App() {
  const { initialize } = useAuthStore()

  useEffect(() => {
    initialize()
  }, [])

  return (
    <SettingsProvider>
      <Router>
        <AnalyticsTracker />
        <div className="min-h-screen bg-navy-gradient">
          <OutstandingInvoiceAlert />
          <Toaster
          position="top-right"
          toastOptions={{
            duration: 4000,
            style: {
              background: '#0B1C2D',
              color: '#C8CED6',
              border: '1px solid #1DB7E8',
            },
            success: {
              iconTheme: {
                primary: '#1DB7E8',
                secondary: '#0B1C2D',
              },
            },
            error: {
              iconTheme: {
                primary: '#ef4444',
                secondary: '#0B1C2D',
              },
            },
          }}
        />

        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/exterior-detailing" element={<ExteriorDetailing />} />
          <Route path="/interior-detailing" element={<InteriorDetailing />} />
          <Route path="/add-ons" element={<AddOns />} />
          <Route path="/gallery" element={<Gallery />} />
          <Route path="/reviews" element={<Reviews />} />
          <Route path="/service-area" element={<ServiceArea />} />
          <Route path="/book-now" element={<BookNowV2 />} />
          <Route path="/contact" element={<Contact />} />
          <Route path="/quote" element={<Quote />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />

          <Route path="/admin" element={
            <AdminRoute>
              <AdminLayout />
            </AdminRoute>
          }>
            <Route index element={<Dashboard />} />
            <Route path="bookings" element={<Bookings />} />
            <Route path="bookings/:id" element={<BookingDetail />} />
            <Route path="bookings/:id/edit" element={<BookingEdit />} />
            <Route path="bookings/new" element={<NewBooking />} />
            <Route path="clients" element={<Clients />} />
            <Route path="clients/new" element={<NewClient />} />
            <Route path="clients/:id" element={<ClientDetail />} />
            <Route path="clients/:id/edit" element={<ClientEdit />} />
            <Route path="vehicles" element={<Vehicles />} />
            <Route path="vehicles/new" element={<NewVehicle />} />
            <Route path="vehicles/:id" element={<AdminVehicleDetail />} />
            <Route path="vehicles/:id/edit" element={<VehicleEdit />} />
            <Route path="services" element={<Services />} />
            <Route path="services/new" element={<NewService />} />
            <Route path="services/:id/edit" element={<ServiceEdit />} />
            <Route path="discount-codes" element={<DiscountCodes />} />
            <Route path="addons/new" element={<NewAddOn />} />
            <Route path="addons/:id/edit" element={<AddOnEdit />} />
            <Route path="quote-requests" element={<QuoteRequests />} />
            <Route path="quote-request/new" element={<QuoteRequest />} />
            <Route path="quote-archive" element={<QuoteArchive />} />
            <Route path="invoices/:id" element={<InvoiceDetail />} />
            <Route path="invoices/new" element={<NewInvoice />} />
            <Route path="invoices" element={<Invoices />} />
            <Route path="payments" element={<Payments />} />
            <Route path="payments/:id" element={<PaymentDetail />} />
            <Route path="messages" element={<Messages />} />
            <Route path="analytics" element={<AdminAnalytics />} />
            <Route path="settings" element={<Settings />} />
          </Route>

          <Route path="/payment/:id" element={<Payment />} />
          <Route path="/success" element={<Success />} />
          <Route path="/receipt/:invoiceId" element={<Receipt />} />
          <Route path="/invoice-payment/:id" element={<InvoicePayment />} />

          <Route path="/client-portal" element={
            <ProtectedRoute>
              <ClientPortal />
            </ProtectedRoute>
          } />
          <Route path="/client-portal/invoices" element={
            <ProtectedRoute>
              <ClientInvoices />
            </ProtectedRoute>
          } />
          <Route path="/client-portal/vehicles" element={
            <ProtectedRoute>
              <ClientVehicles />
            </ProtectedRoute>
          } />
          <Route path="/client-portal/vehicles/add" element={
            <ProtectedRoute>
              <AddVehicle />
            </ProtectedRoute>
          } />
          <Route path="/client-portal/vehicles/:id" element={
            <ProtectedRoute>
              <VehicleDetail />
            </ProtectedRoute>
          } />
          <Route path="/client-portal/vehicles/:id/edit" element={
            <ProtectedRoute>
              <ClientVehicleEdit />
            </ProtectedRoute>
          } />
          <Route path="/client-portal/settings" element={
            <ProtectedRoute>
              <ClientSettings />
            </ProtectedRoute>
          } />
          <Route path="/client-portal/bookings" element={
            <ProtectedRoute>
              <ClientBookings />
            </ProtectedRoute>
          } />
          <Route path="/client-portal/bookings/:id" element={
            <ProtectedRoute>
              <ClientBookingDetail />
            </ProtectedRoute>
          } />
          <Route path="/client-portal/bookings/new" element={
            <ProtectedRoute>
              <ClientNewBooking />
            </ProtectedRoute>
          } />

          <Route path="*" element={<div className="min-h-screen flex items-center justify-center"><h1 className="text-4xl font-bold text-light-gray">404 - Page Not Found</h1></div>} />
        </Routes>
        </div>
      </Router>
      <Analytics />
      <SpeedInsights />
    </SettingsProvider>
  )
}

export default App
