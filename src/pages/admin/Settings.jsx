import React, { useState, useEffect } from 'react';
import { 
  Building, 
  Phone, 
  Mail, 
  MapPin, 
  Globe, 
  Clock, 
  Palette, 
  Bell, 
  Upload, 
  Save, 
  Star, 
  MessageSquare, 
  RefreshCw, 
  Settings as SettingsIcon,
  Facebook,
  Instagram,
  Twitter,
  Linkedin,
  Youtube,
  CheckCircle,
  AlertCircle,
  X
} from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useSettings } from '../../contexts/SettingsContext';
import MapboxAddressInput from '../../components/MapboxAddressInput';

const Settings = () => {
  const { refreshSettings } = useSettings();
  const [activeTab, setActiveTab] = useState('business');
  const [settings, setSettings] = useState({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });
  const [reviews, setReviews] = useState([]);
  const [syncing, setSyncing] = useState(false);
  const [reviewStats, setReviewStats] = useState(null);

  useEffect(() => {
    fetchSettings();
    fetchReviews();
    fetchReviewStats();
  }, []);

  const fetchSettings = async () => {
    try {
      console.log('Fetching settings from database...');
      const { data, error } = await supabase
        .from('settings')
        .select('*')
        .single();

      console.log('Database settings result:', { data, error });
      console.log('Current settings data:', JSON.stringify(data, null, 2));
      console.log('Google Place ID from DB:', data?.google_place_id);
      console.log('Google API Key from DB:', data?.google_api_key);

      if (error) throw error;
      setSettings(data || {});
    } catch (error) {
      console.error('Error fetching settings:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchReviews = async () => {
    try {
      const { data, error } = await supabase
        .from('google_reviews')
        .select('*')
        .order('time', { ascending: false })
        .limit(10);

      if (error) throw error;
      setReviews(data || []);
    } catch (error) {
      console.error('Error fetching reviews:', error);
    }
  };

  const fetchReviewStats = async () => {
    try {
      const { data, error } = await supabase
        .rpc('get_review_statistics');

      if (error) {
        console.error('Review stats RPC error:', error);
        setReviewStats({
          total_reviews: 0,
          average_rating: 4.5,
          rating_distribution: {},
          total_responses: 0,
          last_sync_at: null
        });
        return;
      }
      
      setReviewStats(data[0]);
    } catch (error) {
      console.error('Error fetching review stats:', error);
      setReviewStats({
        total_reviews: 0,
        average_rating: 4.5,
        rating_distribution: {},
        total_responses: 0,
        last_sync_at: null
      });
    }
  };

  const handleDebugSettings = () => {
    console.log('=== DEBUG: Current Settings State ===');
    console.log('Settings object:', settings);
    console.log('Google Place ID:', settings.google_place_id);
    console.log('Google API Key:', settings.google_api_key);
    console.log('All settings keys:', Object.keys(settings));
    console.log('=====================================');
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      console.log('Current settings state:', settings);
      console.log('Google Place ID in state:', settings.google_place_id);
      console.log('Google API Key in state:', settings.google_api_key);
      
      const { data, error } = await supabase
        .from('settings')
        .upsert(settings)
        .select();

      console.log('Save result:', { data, error });

      if (error) throw error;
      
      await refreshSettings();
      
      setMessage({ type: 'success', text: 'Settings saved successfully!' });
      setTimeout(() => setMessage({ type: '', text: '' }), 3000);
    } catch (error) {
      console.error('Error saving settings:', error);
      setMessage({ type: 'error', text: 'Error saving settings: ' + error.message });
    } finally {
      setSaving(false);
    }
  };

  const handleSyncReviews = async () => {
    try {
      console.log('=== Starting review sync ===');
      setSyncing(true);
      
      // Check if user is authenticated
      console.log('Getting user session...');
      const { data: { session } } = await supabase.auth.getSession();
      console.log('User session:', session ? 'Active' : 'None');
      
      if (!session) {
        console.log('No session found - user not logged in');
        setMessage({ type: 'error', text: 'Please log in to sync reviews' });
        setSyncing(false);
        return;
      }
      
      console.log('User ID:', session.user.id);
      console.log('Token expires at:', new Date(session.expires_at * 1000).toLocaleString());
      
      // Call Edge Function directly via fetch to bypass Supabase client auth
      const functionUrl = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/sync-google-reviews`;
      console.log('Calling Edge Function at:', functionUrl);
      
      try {
        console.log('Making fetch request with anon key...');
        const response = await fetch(functionUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`, // Using anon key
            'apikey': import.meta.env.VITE_SUPABASE_ANON_KEY
          }
        });
        
        console.log('Response status:', response.status);
        console.log('Response headers:', Object.fromEntries(response.headers.entries()));
        
        const data = await response.json();
        console.log('Response data:', data);
        
        if (!response.ok) {
          const errorMessage = data.error || data.message || data.details || `HTTP ${response.status}`;
          console.error('Function error:', data);
          setMessage({ type: 'error', text: errorMessage });
          return;
        }
        
        console.log('Sync successful!');
        setMessage({ type: 'success', text: 'Reviews synced successfully!' });
        await fetchReviews();
        await fetchReviewStats();
      } catch (fetchError) {
        console.error('Fetch error:', fetchError);
        setMessage({ type: 'error', text: `Network error: ${fetchError.message}` });
      }
    } catch (error) {
      console.error('General error syncing reviews:', error);
      setMessage({ type: 'error', text: error.message || 'Error syncing reviews' });
    } finally {
      console.log('=== Sync process completed ===');
      setSyncing(false);
    }
  };

  const handleUpdateReview = async (reviewId, updates) => {
    try {
      const { error } = await supabase
        .from('google_reviews')
        .update(updates)
        .eq('id', reviewId);

      if (error) throw error;
      
      await fetchReviews();
      setMessage({ type: 'success', text: 'Review updated successfully!' });
    } catch (error) {
      console.error('Error updating review:', error);
      setMessage({ type: 'error', text: 'Error updating review' });
    }
  };

  const tabs = [
    { id: 'business', label: 'Business Info', icon: Building },
    { id: 'social', label: 'Social Media', icon: Globe },
    { id: 'hours', label: 'Business Hours', icon: Clock },
    { id: 'reviews', label: 'Google Reviews', icon: Star },
    { id: 'notifications', label: 'Notifications', icon: Bell },
    { id: 'display', label: 'Display Settings', icon: SettingsIcon },
  ];

  const renderBusinessInfo = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-medium text-light-gray mb-2">Business Name</label>
          <input
            type="text"
            value={settings.business_name || ''}
            onChange={(e) => setSettings(prev => ({ ...prev, business_name: e.target.value }))}
            className="admin-input"
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium text-light-gray mb-2">Tagline</label>
          <input
            type="text"
            value={settings.business_tagline || ''}
            onChange={(e) => setSettings(prev => ({ ...prev, business_tagline: e.target.value }))}
            className="admin-input"
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium text-light-gray mb-2">Email</label>
          <div className="relative">
            <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-light-gray w-4 h-4" />
            <input
              type="email"
              value={settings.business_email || ''}
              onChange={(e) => setSettings(prev => ({ ...prev, business_email: e.target.value }))}
              className="admin-input pl-10"
            />
          </div>
        </div>
        
        <div>
          <label className="block text-sm font-medium text-light-gray mb-2">Phone</label>
          <div className="relative">
            <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 text-light-gray w-4 h-4" />
            <input
              type="tel"
              value={settings.business_phone || ''}
              onChange={(e) => setSettings(prev => ({ ...prev, business_phone: e.target.value }))}
              className="admin-input pl-10"
            />
          </div>
        </div>
        
        <div>
          <label className="block text-sm font-medium text-light-gray mb-2">Website</label>
          <div className="relative">
            <Globe className="absolute left-3 top-1/2 transform -translate-y-1/2 text-light-gray w-4 h-4" />
            <input
              type="url"
              value={settings.business_website || ''}
              onChange={(e) => setSettings(prev => ({ ...prev, business_website: e.target.value }))}
              className="admin-input pl-10"
            />
          </div>
        </div>
        
        <div>
          <label className="block text-sm font-medium text-light-gray mb-2">Address</label>
          <MapboxAddressInput
            value={settings.business_address || ''}
            onChange={(value) => setSettings(prev => ({ ...prev, business_address: value }))}
            placeholder="Start typing address..."
          />
        </div>
      </div>
      
      <div>
        <label className="block text-sm font-medium text-light-gray mb-2">Business Description</label>
        <textarea
          value={settings.business_description || ''}
          onChange={(e) => setSettings(prev => ({ ...prev, business_description: e.target.value }))}
          rows={4}
          className="admin-textarea"
        />
      </div>
    </div>
  );

  const renderSocialMedia = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-medium text-light-gray mb-2">
            <Facebook className="inline w-4 h-4 mr-2" />
            Facebook URL
          </label>
          <input
            type="url"
            value={settings.facebook_url || ''}
            onChange={(e) => setSettings(prev => ({ ...prev, facebook_url: e.target.value }))}
            className="admin-input"
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium text-light-gray mb-2">
            <Instagram className="inline w-4 h-4 mr-2" />
            Instagram URL
          </label>
          <input
            type="url"
            value={settings.instagram_url || ''}
            onChange={(e) => setSettings(prev => ({ ...prev, instagram_url: e.target.value }))}
            className="admin-input"
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium text-light-gray mb-2">
            <Twitter className="inline w-4 h-4 mr-2" />
            Twitter URL
          </label>
          <input
            type="url"
            value={settings.twitter_url || ''}
            onChange={(e) => setSettings(prev => ({ ...prev, twitter_url: e.target.value }))}
            className="admin-input"
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium text-light-gray mb-2">
            <Linkedin className="inline w-4 h-4 mr-2" />
            LinkedIn URL
          </label>
          <input
            type="url"
            value={settings.linkedin_url || ''}
            onChange={(e) => setSettings(prev => ({ ...prev, linkedin_url: e.target.value }))}
            className="admin-input"
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium text-light-gray mb-2">
            <Youtube className="inline w-4 h-4 mr-2" />
            YouTube URL
          </label>
          <input
            type="url"
            value={settings.youtube_url || ''}
            onChange={(e) => setSettings(prev => ({ ...prev, youtube_url: e.target.value }))}
            className="admin-input"
          />
        </div>
      </div>
    </div>
  );

  const renderBusinessHours = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'].map((day) => (
          <div key={day}>
            <label className="block text-sm font-medium text-light-gray mb-2 capitalize">
              <Clock className="inline w-4 h-4 mr-2" />
              {day}
            </label>
            <input
              type="text"
              value={settings[`${day}_hours`] || ''}
              onChange={(e) => setSettings(prev => ({ ...prev, [`${day}_hours`]: e.target.value }))}
              placeholder="e.g., 9:00 AM - 6:00 PM"
              className="admin-input"
            />
          </div>
        ))}
      </div>
    </div>
  );

  const renderGoogleReviews = () => (
    <div className="space-y-6">
      <div className="glass-card p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-xl font-semibold text-light-gray flex items-center">
              <Star className="w-5 h-5 mr-2 text-yellow-400" />
              Google Reviews Integration
            </h3>
            <p className="text-light-gray">Connect your Google Business account to display reviews</p>
          </div>
          <button
            onClick={handleSyncReviews}
            disabled={syncing}
            className="px-4 py-2 bg-electric-blue text-white rounded-lg hover:bg-blue-600 transition-colors disabled:opacity-50 flex items-center space-x-2"
          >
            <RefreshCw className={`w-4 h-4 ${syncing ? 'animate-spin' : ''}`} />
            <span>{syncing ? 'Syncing...' : 'Sync Reviews'}</span>
          </button>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-light-gray mb-2">Google Place ID</label>
            <input
              type="text"
              value={settings.google_place_id || ''}
              onChange={(e) => setSettings(prev => ({ ...prev, google_place_id: e.target.value }))}
              placeholder="ChIJd8AvQac6wokRz8wS8pUW15E"
              className="admin-input"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-light-gray mb-2">Google API Key</label>
            <input
              type="password"
              value={settings.google_api_key || ''}
              onChange={(e) => setSettings(prev => ({ ...prev, google_api_key: e.target.value }))}
              placeholder="Your Google Places API key"
              className="admin-input"
            />
          </div>
        </div>
        
        <div className="flex space-x-4 mt-4">
          <button
            onClick={handleSave}
            disabled={saving}
            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50"
          >
            {saving ? 'Saving...' : 'Save Settings'}
          </button>
          <button
            onClick={handleDebugSettings}
            className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
          >
            Debug Settings
          </button>
        </div>
        
        {reviewStats && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-6">
            <div className="bg-navy-light/50 rounded-lg p-4">
              <p className="text-light-gray text-sm">Total Reviews</p>
              <p className="text-2xl font-bold text-light-gray">{reviewStats.total_reviews || 0}</p>
            </div>
            <div className="bg-navy-light/50 rounded-lg p-4">
              <p className="text-light-gray text-sm">Average Rating</p>
              <p className="text-2xl font-bold text-yellow-400">
                {reviewStats.average_rating ? reviewStats.average_rating.toFixed(1) : '0.0'}
              </p>
            </div>
            <div className="bg-navy-light/50 rounded-lg p-4">
              <p className="text-light-gray text-sm">Total Responses</p>
              <p className="text-2xl font-bold text-light-gray">{reviewStats.total_responses || 0}</p>
            </div>
            <div className="bg-navy-light/50 rounded-lg p-4">
              <p className="text-light-gray text-sm">Response Rate</p>
              <p className="text-2xl font-bold text-light-gray">{reviewStats.response_rate || '0'}%</p>
            </div>
          </div>
        )}
      </div>
      
      <div className="glass-card p-6">
        <h3 className="text-xl font-semibold text-light-gray mb-4">Manage Reviews</h3>
        
        <div className="space-y-4">
          {reviews.map((review) => (
            <div key={review.id} className="bg-navy-light/30 rounded-lg p-4">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center space-x-3 mb-2">
                    <div className="flex items-center">
                      {[...Array(5)].map((_, i) => (
                        <Star
                          key={i}
                          className={`w-4 h-4 ${
                            i < review.rating ? 'text-yellow-400 fill-current' : 'text-gray-600'
                          }`}
                        />
                      ))}
                    </div>
                    <span className="font-medium text-light-gray">{review.author_name}</span>
                    <span className="text-sm text-light-gray">
                      {review.time ? new Date(review.time * 1000).toLocaleDateString() : 'No date'}
                    </span>
                  </div>
                  
                  <p className="text-light-gray mb-3">
                    {review.review_text || 'No review text available'}
                  </p>
                  
                  <div className="flex items-center space-x-4">
                    <label className="flex items-center space-x-2 text-sm">
                      <input
                        type="checkbox"
                        checked={review.is_approved}
                        onChange={(e) => handleUpdateReview(review.id, { is_approved: e.target.checked })}
                        className="rounded border-navy bg-navy-light text-electric-blue focus:ring-electric-blue"
                      />
                      <span className="text-light-gray">Approved</span>
                    </label>
                    
                    <label className="flex items-center space-x-2 text-sm">
                      <input
                        type="checkbox"
                        checked={review.is_featured}
                        onChange={(e) => handleUpdateReview(review.id, { is_featured: e.target.checked })}
                        className="rounded border-navy bg-navy-light text-electric-blue focus:ring-electric-blue"
                      />
                      <span className="text-light-gray">Featured</span>
                    </label>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  const renderNotifications = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <h3 className="text-lg font-semibold text-light-gray mb-4">
            <Bell className="inline w-5 h-5 mr-2" />
            Notification Preferences
          </h3>
          
          <div className="space-y-4">
            <label className="flex items-center justify-between">
              <span className="text-light-gray">Email Notifications</span>
              <input
                type="checkbox"
                checked={settings.email_notifications || false}
                onChange={(e) => setSettings(prev => ({ ...prev, email_notifications: e.target.checked }))}
                className="rounded border-navy bg-navy-light text-electric-blue focus:ring-electric-blue"
              />
            </label>
            
            <label className="flex items-center justify-between">
              <span className="text-light-gray">SMS Notifications</span>
              <input
                type="checkbox"
                checked={settings.sms_notifications || false}
                onChange={(e) => setSettings(prev => ({ ...prev, sms_notifications: e.target.checked }))}
                className="rounded border-navy bg-navy-light text-electric-blue focus:ring-electric-blue"
              />
            </label>
            
            <label className="flex items-center justify-between">
              <span className="text-light-gray">Booking Confirmations</span>
              <input
                type="checkbox"
                checked={settings.booking_confirmations || false}
                onChange={(e) => setSettings(prev => ({ ...prev, booking_confirmations: e.target.checked }))}
                className="rounded border-navy bg-navy-light text-electric-blue focus:ring-electric-blue"
              />
            </label>
            
            <label className="flex items-center justify-between">
              <span className="text-light-gray">Payment Notifications</span>
              <input
                type="checkbox"
                checked={settings.payment_notifications || false}
                onChange={(e) => setSettings(prev => ({ ...prev, payment_notifications: e.target.checked }))}
                className="rounded border-navy bg-navy-light text-electric-blue focus:ring-electric-blue"
              />
            </label>
          </div>
        </div>
        
        <div>
          <h3 className="text-lg font-semibold text-light-gray mb-4">
            <SettingsIcon className="inline w-5 h-5 mr-2" />
            Display Settings
          </h3>
          
          <div className="space-y-4">
            <label className="flex items-center justify-between">
              <span className="text-light-gray">Show Reviews on Frontend</span>
              <input
                type="checkbox"
                checked={settings.show_reviews_on_frontend || false}
                onChange={(e) => setSettings(prev => ({ ...prev, show_reviews_on_frontend: e.target.checked }))}
                className="rounded border-navy bg-navy-light text-electric-blue focus:ring-electric-blue"
              />
            </label>
            
            <div>
              <label className="block text-sm font-medium text-light-gray mb-2">Max Reviews to Display</label>
              <input
                type="number"
                value={settings.max_reviews_display || 10}
                onChange={(e) => setSettings(prev => ({ ...prev, max_reviews_display: parseInt(e.target.value) }))}
                min="1"
                max="50"
                className="admin-input"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-light-gray mb-2">Minimum Rating to Display</label>
              <select
                value={settings.min_rating_display || 4}
                onChange={(e) => setSettings(prev => ({ ...prev, min_rating_display: parseInt(e.target.value) }))}
                className="admin-select"
              >
                <option value={1}>1 Star</option>
                <option value={2}>2 Stars</option>
                <option value={3}>3 Stars</option>
                <option value={4}>4 Stars</option>
                <option value={5}>5 Stars</option>
              </select>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-electric-blue"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-light-gray">Settings</h1>
          <p className="text-light-gray">Manage your business information and preferences</p>
        </div>
        
        <button
          onClick={handleSave}
          disabled={saving}
          className="px-6 py-2 bg-electric-blue text-white rounded-lg hover:bg-blue-600 transition-colors disabled:opacity-50 flex items-center space-x-2"
        >
          <Save className="w-4 h-4" />
          <span>{saving ? 'Saving...' : 'Save Changes'}</span>
        </button>
      </div>

      {/* Message */}
      {message.text && (
        <div className={`p-4 rounded-lg ${
          message.type === 'success' ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'
        }`}>
          {message.text}
        </div>
      )}

      {/* Tabs */}
      <div className="flex space-x-1 border-b border-navy-light">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-4 py-2 flex items-center space-x-2 border-b-2 transition-colors ${
                activeTab === tab.id
                  ? 'border-electric-blue text-light-gray'
                  : 'border-transparent text-light-gray hover:text-electric-blue'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Tab Content */}
      <div className="glass-card p-6">
        {activeTab === 'business' && renderBusinessInfo()}
        {activeTab === 'social' && renderSocialMedia()}
        {activeTab === 'hours' && renderBusinessHours()}
        {activeTab === 'reviews' && renderGoogleReviews()}
        {activeTab === 'notifications' && renderNotifications()}
        {activeTab === 'display' && renderNotifications()}
      </div>
    </div>
  );
};

export default Settings;
