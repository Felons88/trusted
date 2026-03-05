import { useEffect } from 'react'
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import { useAuthStore } from './store/authStore-emergency'
import Navigation from './components/Navigation'
import FloatingCallButton from './components/FloatingCallButton'
import { ProtectedRoute, AdminRoute } from './components/ProtectedRoute'
import { SettingsProvider } from './contexts/SettingsContext'

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
import NewBooking from './pages/admin/NewBooking'
import NewClient from './pages/admin/NewClient'
import Vehicles from './pages/admin/Vehicles'
import NewVehicle from './pages/admin/NewVehicle'
import AdminVehicleDetail from './pages/admin/VehicleDetail'
import Services from './pages/admin/Services'
import ServiceEdit from './pages/admin/ServiceEdit'
import AddOnEdit from './pages/admin/AddOnEdit'
import QuoteRequests from './pages/admin/QuoteRequests'
import QuoteRequest from './pages/admin/QuoteRequest'
import QuoteArchive from './pages/admin/QuoteArchive'
import ClientDetail from './pages/admin/ClientDetail'
import InvoiceDetail from './pages/admin/InvoiceDetail'
import Invoices from './pages/admin/Invoices'
import InvoicePayment from './pages/admin/InvoicePayment'
import Payments from './pages/admin/Payments'
import Messages from './pages/admin/Messages'
import Settings from './pages/admin/Settings'

import ClientPortal from './pages/client/ClientPortal'
import ClientVehicles from './pages/client/Vehicles'
import AddVehicle from './pages/client/AddVehicle'
import VehicleDetail from './pages/client/VehicleDetail'

function App() {
  const { initialize } = useAuthStore()

  useEffect(() => {
    initialize()
  }, [])

  return (
    <SettingsProvider>
      <Router>
        <div className="min-h-screen bg-navy-gradient">
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
            <Route path="vehicles" element={<Vehicles />} />
            <Route path="vehicles/new" element={<NewVehicle />} />
            <Route path="vehicles/:id" element={<AdminVehicleDetail />} />
            <Route path="services" element={<Services />} />
            <Route path="services/:id/edit" element={<ServiceEdit />} />
            <Route path="addons/:id/edit" element={<AddOnEdit />} />
            <Route path="quote-requests" element={<QuoteRequests />} />
            <Route path="quote-request/new" element={<QuoteRequest />} />
            <Route path="quote-archive" element={<QuoteArchive />} />
            <Route path="invoices" element={<Invoices />} />
            <Route path="invoices/:id" element={<InvoiceDetail />} />
            <Route path="payments" element={<Payments />} />
            <Route path="messages" element={<Messages />} />
            <Route path="settings" element={<Settings />} />
          </Route>

          <Route path="/invoice-payment/:id" element={<InvoicePayment />} />

          <Route path="/client-portal" element={
            <ProtectedRoute>
              <ClientPortal />
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

          <Route path="*" element={
            <>
              <Navigation />
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
              </Routes>
              <FloatingCallButton />
            </>
          } />
        </Routes>
        </div>
      </Router>
    </SettingsProvider>
  )
}

export default App
