import { create } from 'zustand'
import { supabase } from '../lib/supabase'

export const useAuthStore = create((set, get) => ({
  user: null,
  profile: null,
  loading: true,

  initialize: async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession()
      
      if (session?.user) {
        console.log('Loading profile for user:', session.user.email)
        const { data: profile, error } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', session.user.id)
          .single()
        
        if (error) {
          console.error('Profile loading error:', error)
        } else {
          console.log('Profile loaded:', profile)
        }
        
        set({ user: session.user, profile, loading: false })
      } else {
        console.log('No session found')
        set({ user: null, profile: null, loading: false })
      }

      supabase.auth.onAuthStateChange(async (event, session) => {
        console.log('Auth state changed:', event, session?.user?.email)
        if (session?.user) {
          const { data: profile, error } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', session.user.id)
            .single()
          
          if (error) {
            console.error('Profile loading error on auth change:', error)
          } else {
            console.log('Profile loaded on auth change:', profile)
          }
          
          set({ user: session.user, profile })
        } else {
          set({ user: null, profile: null })
        }
      })
    } catch (error) {
      console.error('Auth initialization error:', error)
      set({ loading: false })
    }
  },

  signIn: async (email, password) => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })
    
    if (error) throw error
    return data
  },

  signUp: async (email, password, userData) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: userData,
      },
    })
    
    if (error) throw error
    return data
  },

  signOut: async () => {
    const { error } = await supabase.auth.signOut()
    if (error) throw error
    set({ user: null, profile: null })
  },

  refreshProfile: async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession()
      
      if (session?.user) {
        console.log('Refreshing profile for user:', session.user.email)
        const { data: profile, error } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', session.user.id)
          .single()
        
        if (error) {
          console.error('Profile refresh error:', error)
        } else {
          console.log('Profile refreshed:', profile)
          set({ profile })
        }
      }
    } catch (error) {
      console.error('Profile refresh error:', error)
    }
  },

  isAdmin: () => {
    const { profile } = get()
    return profile?.role === 'admin'
  },

  isClient: () => {
    const { profile } = get()
    return profile?.role === 'client'
  },

  isTwoFactorEnabled: async (userId) => {
    try {
      const { data, error } = await supabase
        .from('user_two_factor')
        .select('*')
        .eq('user_id', userId)
        .eq('is_enabled', true)
        .single()
      
      // If table doesn't exist or no 2FA setup, return false
      if (error && (error.code === 'PGRST116' || error.code === '42P01')) {
        console.log('2FA table not found or no 2FA setup for user')
        return false
      }
      
      return !error && data
    } catch (error) {
      console.error('Error checking 2FA status:', error)
      return false
    }
  },
}))
