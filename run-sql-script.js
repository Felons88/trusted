// Script to run SQL commands using Supabase client
import { createClient } from '@supabase/supabase-js'

// Your Supabase credentials
const supabaseUrl = 'https://pvuyblessymizmiekvhm.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InB2dXlibGVzc3ltaXptaWVrdmhtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzIzMTM4MzAsImV4cCI6MjA4Nzg4OTgzMH0.vnwgjZ7b984RoLYOjDLUUejoyjuKk3EUPT0NugFXSpc'

const supabase = createClient(supabaseUrl, supabaseKey)

async function runSQL() {
  try {
    console.log('Adding vehicle_size column to vehicles table...')
    
    // Execute the SQL to add the column
    const { data, error } = await supabase.rpc('exec_sql', {
      sql: `
        DO $$
        BEGIN
            IF NOT EXISTS (
                SELECT 1 
                FROM information_schema.columns 
                WHERE table_name = 'vehicles' 
                AND column_name = 'vehicle_size'
                AND table_schema = 'public'
            ) THEN
                ALTER TABLE vehicles 
                ADD COLUMN vehicle_size VARCHAR(20) DEFAULT 'sedan';
                
                RAISE NOTICE 'Added vehicle_size column to vehicles table';
            ELSE
                RAISE NOTICE 'vehicle_size column already exists in vehicles table';
            END IF;
        END $$;
        
        UPDATE vehicles 
        SET vehicle_size = 'sedan' 
        WHERE vehicle_size IS NULL;
        
        COMMENT ON COLUMN vehicles.vehicle_size IS 'Vehicle size category: sedan, suv, truck, van';
      `
    })

    if (error) {
      console.error('Error executing SQL:', error)
      process.exit(1)
    }

    console.log('✅ SQL script executed successfully!')
    console.log('vehicle_size column added to vehicles table')
    
  } catch (error) {
    console.error('Error:', error)
    process.exit(1)
  }
}

runSQL()
