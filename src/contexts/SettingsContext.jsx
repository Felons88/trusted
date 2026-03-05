import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

const SettingsContext = createContext();

export const useSettings = () => {
  const context = useContext(SettingsContext);
  if (!context) {
    throw new Error('useSettings must be used within a SettingsProvider');
  }
  return context;
};

export const SettingsProvider = ({ children }) => {
  const [settings, setSettings] = useState({
    business_name: 'Trusted Mobile Detailing',
    business_tagline: 'Professional Detailing at Your Location',
    business_email: 'info@trustedmobiledetailing.com',
    business_phone: '(555) 123-4567',
    business_address: '123 Main St, Your City, ST 12345',
    business_website: 'https://trustedmobiledetailing.com',
    business_description: 'Professional mobile detailing services at your convenience.',
    facebook_url: '',
    instagram_url: '',
    twitter_url: '',
    linkedin_url: '',
    youtube_url: '',
    monday_hours: '9:00 AM - 6:00 PM',
    tuesday_hours: '9:00 AM - 6:00 PM',
    wednesday_hours: '9:00 AM - 6:00 PM',
    thursday_hours: '9:00 AM - 6:00 PM',
    friday_hours: '9:00 AM - 6:00 PM',
    saturday_hours: '10:00 AM - 4:00 PM',
    sunday_hours: 'Closed'
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const { data, error } = await supabase
        .from('settings')
        .select('*')
        .maybeSingle();

      if (error) throw error;
      
      if (data) {
        setSettings(prev => ({ ...prev, ...data }));
      }
    } catch (error) {
      console.error('Error fetching settings:', error);
    } finally {
      setLoading(false);
    }
  };

  const refreshSettings = async () => {
    await fetchSettings();
  };

  const value = {
    settings,
    loading,
    refreshSettings
  };

  return (
    <SettingsContext.Provider value={value}>
      {children}
    </SettingsContext.Provider>
  );
};
