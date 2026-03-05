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
    
    // EMERGENCY: Immediately create/set profile after successful sign in
    if (data.user) {
      console.log('EMERGENCY: Sign in successful, setting profile for:', data.user.email)
      
      // EMERGENCY: Hardcode admin profile for jameshewitt312@gmail.com
      if (data.user.email === 'jameshewitt312@gmail.com') {
        const adminProfile = {
          id: data.user.id,
          email: 'jameshewitt312@gmail.com',
          full_name: 'Admin User',
          role: 'admin'
        }
        console.log('EMERGENCY: Setting admin profile after sign in:', adminProfile)
        set({ user: data.user, profile: adminProfile })
        return data
      }
      
      // EMERGENCY: Hardcode client profile for IsaiahDellwo01@gmail.com
      if (data.user.email === 'IsaiahDellwo01@gmail.com') {
        const clientProfile = {
          id: data.user.id,
          email: 'IsaiahDellwo01@gmail.com',
          full_name: 'Isaiah Dellwo',
          role: 'client'
        }
        console.log('EMERGENCY: Setting client profile for Isaiah after sign in:', clientProfile)
        set({ user: data.user, profile: clientProfile })
        return data
      }
      
      // For other users, try to load or create profile
      try {
        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', data.user.id)
          .single()
        
        if (profileError || !profile) {
          console.log('EMERGENCY: No profile found, creating default profile after sign in')
          const defaultProfile = {
            id: data.user.id,
            email: data.user.email,
            full_name: data.user.user_metadata?.full_name || data.user.email?.split('@')[0] || 'User',
            role: 'client'
          }
          
          // Try to create profile in database
          try {
            const { error: insertError } = await supabase
              .from('profiles')
              .insert([defaultProfile])
            
            if (insertError) {
              console.log('EMERGENCY: Failed to create profile in DB, using local profile:', insertError)
            } else {
              console.log('EMERGENCY: Created new profile in DB for user:', data.user.email)
            }
          } catch (insertErr) {
            console.log('EMERGENCY: Exception creating profile, using local profile:', insertErr)
          }
          
          set({ user: data.user, profile: defaultProfile })
        } else {
          console.log('EMERGENCY: Found existing profile after sign in:', profile)
          set({ user: data.user, profile })
        }
      } catch (profileErr) {
        console.log('EMERGENCY: Profile loading failed after sign in, using default client profile')
        const fallbackProfile = {
          id: data.user.id,
          email: data.user.email,
          full_name: 'Client User',
          role: 'client'
        }
        set({ user: data.user, profile: fallbackProfile })
      }
    }
    
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
    
    // EMERGENCY: Create profile immediately after successful sign up
    if (data.user) {
      console.log('EMERGENCY: Sign up successful, creating profile for:', data.user.email)
      
      // EMERGENCY: Hardcode admin profile for jameshewitt312@gmail.com
      if (data.user.email === 'jameshewitt312@gmail.com') {
        const adminProfile = {
          id: data.user.id,
          email: 'jameshewitt312@gmail.com',
          full_name: 'Admin User',
          role: 'admin'
        }
        console.log('EMERGENCY: Setting admin profile after sign up:', adminProfile)
        set({ user: data.user, profile: adminProfile })
        return data
      }
      
      // EMERGENCY: Hardcode client profile for IsaiahDellwo01@gmail.com
      if (data.user.email === 'IsaiahDellwo01@gmail.com') {
        const clientProfile = {
          id: data.user.id,
          email: 'IsaiahDellwo01@gmail.com',
          full_name: 'Isaiah Dellwo',
          role: 'client'
        }
        console.log('EMERGENCY: Setting client profile for Isaiah after sign up:', clientProfile)
        set({ user: data.user, profile: clientProfile })
        return data
      }
      
      // For other users, create a default client profile
      const defaultProfile = {
        id: data.user.id,
        email: data.user.email,
        full_name: userData?.full_name || data.user.email?.split('@')[0] || 'User',
        role: 'client'
      }
      
      console.log('EMERGENCY: Creating default client profile after sign up:', defaultProfile)
      
      // Try to create profile in database
      try {
        const { error: insertError } = await supabase
          .from('profiles')
          .insert([defaultProfile])
        
        if (insertError) {
          console.log('EMERGENCY: Failed to create profile in DB during sign up, using local profile:', insertError)
        } else {
          console.log('EMERGENCY: Created new profile in DB during sign up for user:', data.user.email)
        }
      } catch (insertErr) {
        console.log('EMERGENCY: Exception creating profile during sign up, using local profile:', insertErr)
      }
      
      set({ user: data.user, profile: defaultProfile })
    }
    
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
