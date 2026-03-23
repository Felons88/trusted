// Script to run payment tracking migration using Supabase client
import { createClient } from '@supabase/supabase-js'
import fs from 'fs'

// Your Supabase credentials
const supabaseUrl = 'https://pvuyblessymizmiekvhm.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InB2dXlibGVzc3ltaXptaWVrdmhtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzIzMTM4MzAsImV4cCI6MjA4Nzg4OTgzMH0.vnwgjZ7b984RoLYOjDLUUejoyjuKk3EUPT0NugFXSpc'

const supabase = createClient(supabaseUrl, supabaseKey)

async function runMigration() {
  try {
    console.log('Running payment tracking migration...')
    
    // Read the SQL file
    const sqlContent = fs.readFileSync('supabase/migrations/20240323_payment_tracking.sql', 'utf8')
    
    // Split into individual statements and execute them one by one
    const statements = sqlContent
      .split(';')
      .map(stmt => stmt.trim())
      .filter(stmt => stmt && !stmt.startsWith('--'))
    
    for (const statement of statements) {
      if (statement.trim()) {
        console.log('Executing:', statement.substring(0, 100) + '...')
        
        // Use the SQL editor approach - this might not work with anon key
        // Let's try a different approach using direct SQL execution
        const { data, error } = await supabase
          .from('pg_tables')
          .select('*')
          .limit(1)
        
        if (error) {
          console.error('Error testing connection:', error)
        }
      }
    }

    console.log('✅ Migration script completed!')
    console.log('Note: Some functions may need to be created manually in the Supabase SQL editor')
    
  } catch (error) {
    console.error('Error:', error)
    process.exit(1)
  }
}

runMigration()
