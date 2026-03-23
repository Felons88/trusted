import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import toast from 'react-hot-toast'

function DbTest() {
  const [status, setStatus] = useState('Checking...')
  const [tables, setTables] = useState([])

  useEffect(() => {
    checkDatabase()
  }, [])

  const checkDatabase = async () => {
    try {
      // Check if quote_requests table exists
      const { data, error } = await supabase
        .from('quote_requests')
        .select('count')
        .limit(1)

      if (error) {
        setStatus(`❌ Database Error: ${error.message}`)
        console.error('Database test error:', error)
      } else {
        setStatus('✅ Database connected successfully!')
        
        // Get table info
        const { data: tablesData } = await supabase
          .from('quote_requests')
          .select('*')
          .limit(5)
        
        setTables(tablesData || [])
      }
    } catch (error) {
      setStatus(`❌ Connection Error: ${error.message}`)
      console.error('Connection error:', error)
    }
  }

  const testInsert = async () => {
    try {
      const { data, error } = await supabase
        .from('quote_requests')
        .insert({
          name: 'Test User',
          email: 'test@example.com',
          phone: '555-1234',
          car_make: 'Toyota',
          car_model: 'Camry',
          car_year: '2022',
          address: '123 Test St',
          service_type: 'full_detail',
          notes: 'Test entry'
        })
        .select()

      if (error) {
        console.error('Insert error:', error)
        toast.error(`Insert failed: ${error.message}`)
      } else {
        console.log('Insert success:', data)
        toast.success('Test entry created successfully!')
        checkDatabase() // Refresh the list
      }
    } catch (error) {
      console.error('Insert error:', error)
      toast.error(`Insert failed: ${error.message}`)
    }
  }

  return (
    <div className="p-6 max-w-2xl mx-auto bg-white rounded-lg shadow">
      <h2 className="text-2xl font-bold mb-4">Database Connection Test</h2>
      
      <div className="mb-4">
        <p className="text-lg">{status}</p>
      </div>

      <button
        onClick={testInsert}
        className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 mr-4"
      >
        Test Insert Quote Request
      </button>

      <button
        onClick={checkDatabase}
        className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600"
      >
        Refresh Status
      </button>

      {tables.length > 0 && (
        <div className="mt-6">
          <h3 className="text-xl font-semibold mb-2">Recent Quote Requests:</h3>
          <div className="bg-gray-100 rounded p-4">
            <pre className="text-sm">
              {JSON.stringify(tables, null, 2)}
            </pre>
          </div>
        </div>
      )}
    </div>
  )
}

export default DbTest
