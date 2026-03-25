import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import { format } from 'date-fns'
import { 
  TrendingUp, Users, Globe, Bot, ExternalLink, 
  Calendar, Filter, Download, Eye, Smartphone, Monitor, Tablet,
  ArrowRight
} from 'lucide-react'
import toast from 'react-hot-toast'

function Analytics() {
  const [visits, setVisits] = useState([])
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState({
    totalVisits: 0,
    uniqueVisitors: 0,
    botVisits: 0,
    topReferrers: [],
    deviceBreakdown: { mobile: 0, tablet: 0, desktop: 0 }
  })
  const [filters, setFilters] = useState({
    dateRange: '7', // days
    showBots: true,
    deviceType: 'all'
  })

  useEffect(() => {
    loadAnalytics()
  }, [filters])

  const loadAnalytics = async () => {
    try {
      setLoading(true)
      
      // Calculate date range
      const startDate = new Date()
      startDate.setDate(startDate.getDate() - parseInt(filters.dateRange))

      // Build query
      let query = supabase
        .from('analytics_visits')
        .select('*')
        .gte('created_at', startDate.toISOString())
        .order('created_at', { ascending: false })

      // Apply filters
      if (!filters.showBots) {
        query = query.eq('is_bot', false)
      }
      if (filters.deviceType !== 'all') {
        query = query.eq('device_type', filters.deviceType)
      }

      const { data, error } = await query.limit(500)

      if (error) throw error

      setVisits(data || [])
      calculateStats(data || [])
    } catch (error) {
      console.error('Error loading analytics:', error)
      toast.error('Failed to load analytics data')
    } finally {
      setLoading(false)
    }
  }

  const calculateStats = (data) => {
    const totalVisits = data.length
    const uniqueVisitors = new Set(data.map(v => v.session_id)).size
    const botVisits = data.filter(v => v.is_bot).length

    // Top referrers
    const referrerCounts = {}
    data.forEach(v => {
      if (v.referrer_domain && v.referrer_domain !== window.location.hostname) {
        referrerCounts[v.referrer_domain] = (referrerCounts[v.referrer_domain] || 0) + 1
      }
    })
    const topReferrers = Object.entries(referrerCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([domain, count]) => ({ domain, count }))

    // Device breakdown
    const deviceBreakdown = {
      mobile: data.filter(v => v.device_type === 'mobile').length,
      tablet: data.filter(v => v.device_type === 'tablet').length,
      desktop: data.filter(v => v.device_type === 'desktop').length
    }

    setStats({ totalVisits, uniqueVisitors, botVisits, topReferrers, deviceBreakdown })
  }

  const exportToCSV = () => {
    const headers = ['Date', 'Page', 'Referrer', 'Device', 'Browser', 'OS', 'Is Bot', 'Bot Name']
    const rows = visits.map(v => [
      format(new Date(v.created_at), 'yyyy-MM-dd HH:mm:ss'),
      v.page_path,
      v.referrer_domain || 'Direct',
      v.device_type,
      `${v.browser_name} ${v.browser_version}`,
      `${v.os_name} ${v.os_version}`,
      v.is_bot ? 'Yes' : 'No',
      v.bot_name || ''
    ])

    const csv = [headers, ...rows].map(row => row.join(',')).join('\n')
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `analytics_${format(new Date(), 'yyyy-MM-dd')}.csv`
    a.click()
    toast.success('Analytics exported to CSV')
  }

  const getDeviceIcon = (type) => {
    switch (type) {
      case 'mobile': return <Smartphone size={16} />
      case 'tablet': return <Tablet size={16} />
      default: return <Monitor size={16} />
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-electric-blue"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">Analytics Dashboard</h1>
          <p className="text-light-gray">Track website visits, bot traffic, and referrer sources</p>
        </div>
        <button
          onClick={exportToCSV}
          className="btn-secondary flex items-center space-x-2"
        >
          <Download size={20} />
          <span>Export CSV</span>
        </button>
      </div>

      {/* Filters */}
      <div className="glass-card p-4">
        <div className="flex flex-wrap gap-4">
          <div>
            <label className="block text-sm text-light-gray mb-2">Date Range</label>
            <select
              value={filters.dateRange}
              onChange={(e) => setFilters({ ...filters, dateRange: e.target.value })}
              className="bg-navy-dark border border-electric-blue/30 rounded-lg px-4 py-2 text-metallic-silver"
            >
              <option value="1">Last 24 Hours</option>
              <option value="7">Last 7 Days</option>
              <option value="30">Last 30 Days</option>
              <option value="90">Last 90 Days</option>
            </select>
          </div>
          <div>
            <label className="block text-sm text-light-gray mb-2">Device Type</label>
            <select
              value={filters.deviceType}
              onChange={(e) => setFilters({ ...filters, deviceType: e.target.value })}
              className="bg-navy-dark border border-electric-blue/30 rounded-lg px-4 py-2 text-metallic-silver"
            >
              <option value="all">All Devices</option>
              <option value="mobile">Mobile</option>
              <option value="tablet">Tablet</option>
              <option value="desktop">Desktop</option>
            </select>
          </div>
          <div className="flex items-end">
            <label className="flex items-center space-x-2 cursor-pointer">
              <input
                type="checkbox"
                checked={filters.showBots}
                onChange={(e) => setFilters({ ...filters, showBots: e.target.checked })}
                className="w-4 h-4 text-electric-blue bg-navy-dark border-electric-blue/30 rounded"
              />
              <span className="text-light-gray">Show Bot Traffic</span>
            </label>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="glass-card p-6">
          <div className="flex items-center justify-between mb-2">
            <p className="text-light-gray text-sm">Total Visits</p>
            <Eye className="text-electric-blue" size={20} />
          </div>
          <p className="text-3xl font-bold text-white">{stats.totalVisits.toLocaleString()}</p>
        </div>

        <div className="glass-card p-6">
          <div className="flex items-center justify-between mb-2">
            <p className="text-light-gray text-sm">Unique Visitors</p>
            <Users className="text-bright-cyan" size={20} />
          </div>
          <p className="text-3xl font-bold text-white">{stats.uniqueVisitors.toLocaleString()}</p>
        </div>

        <div className="glass-card p-6">
          <div className="flex items-center justify-between mb-2">
            <p className="text-light-gray text-sm">Bot Visits</p>
            <Bot className="text-orange-400" size={20} />
          </div>
          <p className="text-3xl font-bold text-white">{stats.botVisits.toLocaleString()}</p>
          <p className="text-xs text-light-gray mt-1">
            {stats.totalVisits > 0 ? ((stats.botVisits / stats.totalVisits) * 100).toFixed(1) : 0}% of total
          </p>
        </div>

        <div className="glass-card p-6">
          <div className="flex items-center justify-between mb-2">
            <p className="text-light-gray text-sm">Device Breakdown</p>
            <Monitor className="text-electric-blue" size={20} />
          </div>
          <div className="space-y-1 text-sm">
            <div className="flex justify-between text-light-gray">
              <span>Mobile:</span>
              <span className="text-white font-semibold">{stats.deviceBreakdown.mobile}</span>
            </div>
            <div className="flex justify-between text-light-gray">
              <span>Desktop:</span>
              <span className="text-white font-semibold">{stats.deviceBreakdown.desktop}</span>
            </div>
            <div className="flex justify-between text-light-gray">
              <span>Tablet:</span>
              <span className="text-white font-semibold">{stats.deviceBreakdown.tablet}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Top Referrers */}
      {stats.topReferrers.length > 0 && (
        <div className="glass-card p-6">
          <h2 className="text-xl font-bold text-white mb-4 flex items-center space-x-2">
            <Globe className="text-electric-blue" size={24} />
            <span>Top Referrers</span>
          </h2>
          <div className="space-y-3">
            {stats.topReferrers.map((ref, index) => (
              <div key={index} className="flex items-center justify-between p-3 bg-navy-dark/50 rounded-lg">
                <div className="flex items-center space-x-3">
                  <span className="text-electric-blue font-bold">#{index + 1}</span>
                  <span className="text-metallic-silver">{ref.domain}</span>
                </div>
                <span className="text-bright-cyan font-semibold">{ref.count} visits</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Recent Visits Table */}
      <div className="glass-card p-6">
        <h2 className="text-xl font-bold text-white mb-4">Recent Visits</h2>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-electric-blue/20">
                <th className="text-left py-3 px-4 text-light-gray font-semibold">Time</th>
                <th className="text-left py-3 px-4 text-light-gray font-semibold">Session</th>
                <th className="text-left py-3 px-4 text-light-gray font-semibold">Page</th>
                <th className="text-left py-3 px-4 text-light-gray font-semibold">Referrer</th>
                <th className="text-left py-3 px-4 text-light-gray font-semibold">Device</th>
                <th className="text-left py-3 px-4 text-light-gray font-semibold">Browser</th>
                <th className="text-left py-3 px-4 text-light-gray font-semibold">Bot</th>
                <th className="text-left py-3 px-4 text-light-gray font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody>
              {visits.slice(0, 50).map((visit) => (
                <tr key={visit.id} className="border-b border-navy-dark hover:bg-navy-dark/30 transition-colors">
                  <td className="py-3 px-4 text-metallic-silver text-sm">
                    {format(new Date(visit.created_at), 'MMM dd, HH:mm')}
                  </td>
                  <td className="py-3 px-4 text-metallic-silver text-sm">
                    <Link 
                      to={`/admin/analytics/${visit.session_id}`}
                      className="text-electric-blue hover:underline font-mono text-xs"
                    >
                      {visit.session_id?.substring(0, 8)}...
                    </Link>
                  </td>
                  <td className="py-3 px-4 text-metallic-silver text-sm">
                    {visit.page_path}
                  </td>
                  <td className="py-3 px-4 text-metallic-silver text-sm">
                    {visit.referrer_domain ? (
                      <a 
                        href={visit.referrer_url} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-electric-blue hover:underline flex items-center space-x-1"
                      >
                        <span>{visit.referrer_domain}</span>
                        <ExternalLink size={12} />
                      </a>
                    ) : (
                      <span className="text-light-gray">Direct</span>
                    )}
                  </td>
                  <td className="py-3 px-4 text-metallic-silver text-sm">
                    <div className="flex items-center space-x-2">
                      {getDeviceIcon(visit.device_type)}
                      <span className="capitalize">{visit.device_type}</span>
                    </div>
                  </td>
                  <td className="py-3 px-4 text-metallic-silver text-sm">
                    {visit.browser_name}
                  </td>
                  <td className="py-3 px-4">
                    {visit.is_bot ? (
                      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-semibold bg-orange-500/20 text-orange-400">
                        <Bot size={12} className="mr-1" />
                        {visit.bot_name}
                      </span>
                    ) : (
                      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-semibold bg-green-500/20 text-green-400">
                        Human
                      </span>
                    )}
                  </td>
                  <td className="py-3 px-4">
                    <Link 
                      to={`/admin/analytics/${visit.session_id}`}
                      className="text-electric-blue hover:text-bright-cyan flex items-center space-x-1"
                      title="View session details"
                    >
                      <Eye size={16} />
                      <span className="text-xs">Details</span>
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

export default Analytics
