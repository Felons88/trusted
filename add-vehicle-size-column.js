// Simple script to add vehicle_size column using direct SQL
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  'https://pvuyblessymizmiekvhm.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InB2dXlibGVzc3ltaXptaWVrdmhtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzIzMTM4MzAsImV4cCI6MjA4Nzg4OTgzMH0.vnwgjZ7b984RoLYOjDLUUejoyjuKk3EUPT0NugFXSpc'
)

async function addVehicleSizeColumn() {
  try {
    console.log('Adding vehicle_size column...')
    
    // Method 1: Try using raw SQL (if available)
    try {
      const { data, error } = await supabase
        .from('vehicles')
        .select('id')
        .limit(1)
      
      if (error) {
        console.log('Table exists, trying to add column...')
      }
    } catch (err) {
      console.log('Error checking table:', err.message)
    }

    // Method 2: Use a simple approach - just test if we can select the column
    console.log('Testing if vehicle_size column exists...')
    
    const { data, error } = await supabase
      .from('vehicles')
      .select('id, vehicle_size')
      .limit(1)
    
    if (error && error.message.includes('column "vehicle_size" does not exist')) {
      console.log('❌ Column does not exist. You need to manually add it.')
      console.log('\n📋 MANUAL STEPS:')
      console.log('1. Go to your Supabase dashboard')
      console.log('2. Navigate to SQL Editor')
      console.log('3. Run this SQL:')
      console.log(`
ALTER TABLE vehicles 
ADD COLUMN vehicle_size VARCHAR(20) DEFAULT 'sedan';

UPDATE vehicles 
SET vehicle_size = 'sedan' 
WHERE vehicle_size IS NULL;
      `)
      console.log('\nOr run the add-vehicle-size-column.sql file in the SQL Editor')
    } else if (error) {
      console.log('Other error:', error.message)
    } else {
      console.log('✅ vehicle_size column exists!')
      console.log('Sample data:', data)
    }
    
  } catch (error) {
    console.error('Error:', error.message)
  }
}

addVehicleSizeColumn()
