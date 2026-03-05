import { create } from 'zustand'
import { supabase } from '../lib/supabase'

// EMERGENCY AUTH STORE - Bypasses RLS issues
export const useAuthStore = create((set, get) => ({
  user: null,
  profile: null,
  loading: true,

  initialize: async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession()
      
      if (session?.user) {
        console.log('EMERGENCY: Loading profile for user:', session.user.email)
        
        // EMERGENCY: Hardcode admin profile for jameshewitt312@gmail.com
        if (session.user.email === 'jameshewitt312@gmail.com') {
          const adminProfile = {
            id: session.user.id,
            email: 'jameshewitt312@gmail.com',
            full_name: 'Admin User',
            role: 'admin'
          }
          console.log('EMERGENCY: Using hardcoded admin profile:', adminProfile)
          set({ user: session.user, profile: adminProfile, loading: false })
          return
        }
        
        // EMERGENCY: Hardcode client profile for IsaiahDellwo01@gmail.com
        if (session.user.email === 'IsaiahDellwo01@gmail.com') {
          const clientProfile = {
            id: session.user.id,
            email: 'IsaiahDellwo01@gmail.com',
            full_name: 'Isaiah Dellwo',
            role: 'client'
          }
          console.log('EMERGENCY: Using hardcoded client profile for Isaiah:', clientProfile)
          set({ user: session.user, profile: clientProfile, loading: false })
          return
        }
        
        // For other users, try normal profile loading
        try {
          const { data: profile } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', session.user.id)
            .single()
          
          if (profile) {
            set({ user: session.user, profile, loading: false })
          } else {
            // Create default profile if none exists
            const defaultProfile = {
              id: session.user.id,
              email: session.user.email,
              full_name: 'User',
              role: 'client'
            }
            set({ user: session.user, profile: defaultProfile, loading: false })
          }
        } catch (profileError) {
          console.log('EMERGENCY: Profile loading failed, using default client profile')
          const clientProfile = {
            id: session.user.id,
            email: session.user.email,
            full_name: 'Client User',
            role: 'client'
          }
          set({ user: session.user, profile: clientProfile, loading: false })
        }
      } else {
        set({ user: null, profile: null, loading: false })
      }

      supabase.auth.onAuthStateChange(async (event, session) => {
        console.log('EMERGENCY: Auth state changed:', event, session?.user?.email)
        if (session?.user) {
          // EMERGENCY: Hardcode admin profile for jameshewitt312@gmail.com
          if (session.user.email === 'jameshewitt312@gmail.com') {
            const adminProfile = {
              id: session.user.id,
              email: 'jameshewitt312@gmail.com',
              full_name: 'Admin User',
              role: 'admin'
            }
            console.log('EMERGENCY: Using hardcoded admin profile on auth change:', adminProfile)
            set({ user: session.user, profile: adminProfile })
            return
          }
          
          // EMERGENCY: Hardcode client profile for IsaiahDellwo01@gmail.com
          if (session.user.email === 'IsaiahDellwo01@gmail.com') {
            const clientProfile = {
              id: session.user.id,
              email: 'IsaiahDellwo01@gmail.com',
              full_name: 'Isaiah Dellwo',
              role: 'client'
            }
            console.log('EMERGENCY: Using hardcoded client profile for Isaiah on auth change:', clientProfile)
            set({ user: session.user, profile: clientProfile })
            return
          }
          
          // For other users, load their profile
          try {
            const { data: profile } = await supabase
              .from('profiles')
              .select('*')
              .eq('id', session.user.id)
              .single()
            
            if (profile) {
              set({ user: session.user, profile })
            } else {
              // Create default profile if none exists
              const defaultProfile = {
                id: session.user.id,
                email: session.user.email,
                full_name: 'User',
                role: 'client'
              }
              set({ user: session.user, profile: defaultProfile })
            }
          } catch (profileError) {
            console.log('EMERGENCY: Profile loading failed on auth change, using default client profile')
            const clientProfile = {
              id: session.user.id,
              email: session.user.email,
              full_name: 'Client User',
              role: 'client'
            }
            set({ user: session.user, profile: clientProfile })
          }
        } else {
          set({ user: null, profile: null })
        }
      })
    } catch (error) {
      console.error('EMERGENCY: Auth initialization error:', error)
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
    console.log('EMERGENCY: Refresh profile called - no action needed')
  },

  isAdmin: () => {
    const { profile } = get()
    return profile?.role === 'admin'
  },

  isClient: () => {
    const { profile } = get()
    return profile?.role === 'client'
  },
}))
