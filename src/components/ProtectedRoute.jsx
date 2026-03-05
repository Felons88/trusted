import { useEffect } from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import { useAuthStore } from '../store/authStore-emergency'

export function ProtectedRoute({ children, requireAdmin = false }) {
  const { user, profile, loading } = useAuthStore()
  const location = useLocation()

  // Show loading state
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-navy-deep">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-electric-blue mx-auto mb-4"></div>
          <p className="text-metallic-silver">Loading...</p>
        </div>
      </div>
    )
  }

  // Redirect to login if not authenticated
  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />
  }

  // Check admin requirement - use profile role from database
  if (requireAdmin && profile?.role !== 'admin') {
    return <Navigate to="/client-portal" replace />
  }

  return children
}

export function AdminRoute({ children }) {
  return <ProtectedRoute requireAdmin={true}>{children}</ProtectedRoute>
}

export function ClientRoute({ children }) {
  return <ProtectedRoute>{children}</ProtectedRoute>
}
