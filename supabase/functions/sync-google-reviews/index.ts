import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  console.log('=== Edge Function Started ===');
  console.log('Method:', req.method);
  console.log('Headers:', Object.fromEntries(req.headers.entries()));

  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    console.log('Creating admin client...');
    // Create admin client for database operations (bypasses RLS)
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    console.log('Admin client created, proceeding with sync...');
    // For now, skip authentication check to focus on getting the sync working
    // TODO: Add proper authentication later once sync is working
    console.log('Proceeding with review sync (auth check disabled for debugging)')

    // Get settings from database using admin client
    console.log('Fetching settings from database...');
    try {
      const { data: settings, error: settingsError } = await supabaseAdmin
        .from('settings')
        .select('google_place_id, google_api_key')
        .single()

      console.log('Database query result:', { settings, settingsError });

      if (settingsError || !settings) {
        console.log('Settings error or not found:', settingsError);
        return new Response(
          JSON.stringify({ error: 'Settings not found' }),
          {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          }
        )
      }

      const { google_place_id, google_api_key } = settings

      console.log('Retrieved settings:', { google_place_id, google_api_key: google_api_key ? `${google_api_key.substring(0, 10)}...` : 'null' })

      if (!google_place_id || !google_api_key) {
        return new Response(
          JSON.stringify({ error: 'Google Place ID or API Key not configured' }),
          {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          }
        )
      }

      // Fetch reviews from Google Places API (v1)
      const googleApiUrl = `https://places.googleapis.com/v1/places/${google_place_id}?fields=reviews,rating&key=${google_api_key}`
      
      console.log('Calling Google API v1:', googleApiUrl.replace(google_api_key, 'API_KEY_HIDDEN'));
      
      const response = await fetch(googleApiUrl)
      console.log('Google API response status:', response.status);
      
      const data = await response.json()
      console.log('Google API response data:', data);

      // New API v1 doesn't return a status field, check for error field instead
      if (data.error) {
        console.log('Google API error:', data.error);
        return new Response(
          JSON.stringify({ error: `Google API error: ${data.error.message}` }),
          {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          }
        )
      }

      const reviews = data.reviews || []
      console.log('Found reviews:', reviews.length);
      console.log('First review sample:', reviews[0]);
      console.log('About to start processing reviews loop...');
      
      let syncedCount = 0

      // Sync each review to database
      for (const review of reviews) {
        console.log('Processing review:', review.authorAttribution?.displayName);
        
        // Include all review data
        const reviewData = {
          google_review_id: review.authorAttribution?.displayName + '_' + review.publishTime,
          author_name: review.authorAttribution?.displayName || 'Anonymous',
          author_url: review.authorAttribution?.uri || '',
          profile_photo_url: review.authorAttribution?.photoUri || '',
          rating: review.rating,
          review_text: review.text?.text || '',
          time: Math.floor(new Date(review.publishTime).getTime() / 1000), // Unix timestamp in seconds
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }

        console.log('Review data to upsert:', reviewData);

        const { error: upsertError } = await supabaseAdmin
          .from('google_reviews')
          .upsert(reviewData)

        console.log('Upsert result:', { error: upsertError });

        if (!upsertError) {
          syncedCount++
          console.log('Successfully synced review. Total synced:', syncedCount);
        } else {
          console.log('Failed to sync review:', upsertError);
        }
      }

      // Update review stats in settings using admin client
      await supabaseAdmin
        .from('settings')
        .update({
          total_reviews: reviews.length || 0,
          average_rating: data.rating || 0,
        })
        .eq('id', 1)

      return new Response(
        JSON.stringify({ 
          success: true, 
          message: `Synced ${syncedCount} reviews successfully`,
          synced_count: syncedCount 
        }),
        {
          status: 200,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      )
    } catch (dbError) {
      console.error('Database error:', dbError);
      return new Response(
        JSON.stringify({ error: 'Database error: ' + dbError.message }),
        {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      )
    }
  } catch (error) {
    console.error('Error syncing reviews:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    )
  }
})
