import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import { format } from 'date-fns'
import { 
  ArrowLeft, Eye, Users, Globe, Bot, ExternalLink, 
  Calendar, Smartphone, Monitor, Tablet, MapPin, Clock,
  Monitor as Browser, Cpu, Wifi, Shield, Activity, Download
} from 'lucide-react'
import toast from 'react-hot-toast'

function AnalyticsDetail() {
  const { sessionId } = useParams()
  const [sessionData, setSessionData] = useState([])
  const [loading, setLoading] = useState(true)
  const [sessionInfo, setSessionInfo] = useState({})

  useEffect(() => {
    if (sessionId) {
      loadSessionDetails()
    }
  }, [sessionId])

  const loadSessionDetails = async () => {
    try {
      setLoading(true)
      
      const { data, error } = await supabase
        .from('analytics_visits')
        .select('*')
        .eq('session_id', sessionId)
        .order('created_at', { ascending: false })

      if (error) throw error

      setSessionData(data || [])
      
      // Calculate session summary
      if (data && data.length > 0) {
        const firstVisit = data[data.length - 1]
        const lastVisit = data[0]
        const duration = lastVisit.created_at - firstVisit.created_at
        const uniquePages = [...new Set(data.map(v => v.page_path))]
        const isBotSession = data.some(v => v.is_bot)
        
        setSessionInfo({
          sessionId: firstVisit.session_id,
          userId: firstVisit.user_id,
          startTime: firstVisit.created_at,
          endTime: lastVisit.created_at,
          duration: duration,
          totalPages: data.length,
          uniquePages: uniquePages.length,
          isBot: isBotSession,
          deviceType: firstVisit.device_type,
          browser: firstVisit.browser_name,
          ipAddress: firstVisit.ip_address,
          userAgent: firstVisit.user_agent,
          referrerDomain: firstVisit.referrer_domain,
          country: firstVisit.country,
          region: firstVisit.region,
          city: firstVisit.city
        })
      }
    } catch (error) {
      console.error('Error loading session details:', error)
      toast.error('Failed to load session details')
    } finally {
      setLoading(false)
    }
  }

  const exportSessionData = () => {
    const headers = ['Time', 'Page', 'Title', 'Referrer', 'Load Time', 'Is Bot', 'Bot Name', 'Device', 'Browser', 'OS', 'IP']
    const rows = sessionData.map(v => [
      format(new Date(v.created_at), 'yyyy-MM-dd HH:mm:ss'),
      v.page_path,
      v.page_title || '',
      v.referrer_domain || 'Direct',
      v.page_load_time || '',
      v.is_bot ? 'Yes' : 'No',
      v.bot_name || '',
      v.device_type,
      `${v.browser_name} ${v.browser_version}`,
      `${v.os_name} ${v.os_version}`,
      v.ip_address || ''
    ])

    const csv = [headers, ...rows].map(row => row.join(',')).join('\n')
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `session_${sessionId}_${format(new Date(), 'yyyy-MM-dd')}.csv`
    a.click()
    toast.success('Session data exported to CSV')
  }

  const getDeviceIcon = (type) => {
    switch (type) {
      case 'mobile': return <Smartphone size={16} />
      case 'tablet': return <Tablet size={16} />
      default: return <Monitor size={16} />
    }
  }

  const formatDuration = (ms) => {
    if (!ms) return 'N/A'
    const seconds = Math.floor(ms / 1000)
    const minutes = Math.floor(seconds / 60)
    const hours = Math.floor(minutes / 60)
    
    if (hours > 0) return `${hours}h ${minutes % 60}m`
    if (minutes > 0) return `${minutes}m ${seconds % 60}s`
    return `${seconds}s`
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-electric-blue"></div>
      </div>
    )
  }

  if (!sessionData.length) {
    return (
      <div className="text-center py-12">
        <p className="text-light-gray text-lg">Session not found</p>
        <Link to="/admin/analytics" className="btn-primary mt-4">
          Back to Analytics
        </Link>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Link to="/admin/analytics" className="text-electric-blue hover:text-bright-cyan flex items-center space-x-2">
            <ArrowLeft size={20} />
            <span>Back to Analytics</span>
          </Link>
          <div>
            <h1 className="text-3xl font-bold text-white">Session Details</h1>
            <p className="text-light-gray">Session ID: {sessionId}</p>
          </div>
        </div>
        <button
          onClick={exportSessionData}
          className="btn-secondary flex items-center space-x-2"
        >
          <Download size={20} />
          <span>Export Session</span>
        </button>
      </div>

      {/* Session Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="glass-card p-6">
          <div className="flex items-center justify-between mb-2">
            <p className="text-light-gray text-sm">Session Duration</p>
            <Clock className="text-electric-blue" size={20} />
          </div>
          <p className="text-2xl font-bold text-white">{formatDuration(sessionInfo.duration)}</p>
          <p className="text-xs text-light-gray mt-1">
            {sessionInfo.totalPages} page views
          </p>
        </div>

        <div className="glass-card p-6">
          <div className="flex items-center justify-between mb-2">
            <p className="text-light-gray text-sm">Device</p>
            {getDeviceIcon(sessionInfo.deviceType)}
          </div>
          <p className="text-2xl font-bold text-white capitalize">{sessionInfo.deviceType}</p>
          <p className="text-xs text-light-gray mt-1">{sessionInfo.browser}</p>
        </div>

        <div className="glass-card p-6">
          <div className="flex items-center justify-between mb-2">
            <p className="text-light-gray text-sm">Location</p>
            <MapPin className="text-bright-cyan" size={20} />
          </div>
          <p className="text-2xl font-bold text-white">{sessionInfo.city || 'Unknown'}</p>
          <p className="text-xs text-light-gray mt-1">{sessionInfo.country || 'Unknown'}</p>
        </div>

        <div className="glass-card p-6">
          <div className="flex items-center justify-between mb-2">
            <p className="text-light-gray text-sm">Session Type</p>
            {sessionInfo.isBot ? <Bot className="text-orange-400" size={20} /> : <Users className="text-green-400" size={20} />}
          </div>
          <p className="text-2xl font-bold text-white">{sessionInfo.isBot ? 'Bot' : 'Human'}</p>
          <p className="text-xs text-light-gray mt-1">IP: {sessionInfo.ipAddress || 'Unknown'}</p>
        </div>
      </div>

      {/* Detailed Information */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Session Information */}
        <div className="glass-card p-6">
          <h2 className="text-xl font-bold text-white mb-4 flex items-center space-x-2">
            <Activity className="text-electric-blue" size={24} />
            <span>Session Information</span>
          </h2>
          <div className="space-y-3">
            <div className="flex justify-between py-2 border-b border-navy-dark/30">
              <span className="text-light-gray">Session ID:</span>
              <span className="text-metallic-silver font-mono text-sm">{sessionInfo.sessionId}</span>
            </div>
            <div className="flex justify-between py-2 border-b border-navy-dark/30">
              <span className="text-light-gray">User ID:</span>
              <span className="text-metallic-silver font-mono text-sm">{sessionInfo.userId || 'Anonymous'}</span>
            </div>
            <div className="flex justify-between py-2 border-b border-navy-dark/30">
              <span className="text-light-gray">Start Time:</span>
              <span className="text-metallic-silver">
                {sessionInfo.startTime ? format(new Date(sessionInfo.startTime), 'MMM dd, HH:mm:ss') : 'N/A'}
              </span>
            </div>
            <div className="flex justify-between py-2 border-b border-navy-dark/30">
              <span className="text-light-gray">End Time:</span>
              <span className="text-metallic-silver">
                {sessionInfo.endTime ? format(new Date(sessionInfo.endTime), 'MMM dd, HH:mm:ss') : 'N/A'}
              </span>
            </div>
            <div className="flex justify-between py-2 border-b border-navy-dark/30">
              <span className="text-light-gray">Unique Pages:</span>
              <span className="text-metallic-silver">{sessionInfo.uniquePages}</span>
            </div>
            <div className="flex justify-between py-2">
              <span className="text-light-gray">Referrer:</span>
              {sessionInfo.referrerDomain ? (
                <a 
                  href={`https://${sessionInfo.referrerDomain}`} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-electric-blue hover:underline flex items-center space-x-1"
                >
                  <span>{sessionInfo.referrerDomain}</span>
                  <ExternalLink size={12} />
                </a>
              ) : (
                <span className="text-light-gray">Direct</span>
              )}
            </div>
          </div>
        </div>

        {/* Technical Information */}
        <div className="glass-card p-6">
          <h2 className="text-xl font-bold text-white mb-4 flex items-center space-x-2">
            <Cpu className="text-bright-cyan" size={24} />
            <span>Technical Information</span>
          </h2>
          <div className="space-y-3">
            <div className="flex justify-between py-2 border-b border-navy-dark/30">
              <span className="text-light-gray">IP Address:</span>
              <span className="text-metallic-silver font-mono">{sessionInfo.ipAddress || 'Unknown'}</span>
            </div>
            <div className="flex justify-between py-2 border-b border-navy-dark/30">
              <span className="text-light-gray">User Agent:</span>
              <span className="text-metallic-silver text-xs break-all">{sessionInfo.userAgent || 'Unknown'}</span>
            </div>
            <div className="flex justify-between py-2 border-b border-navy-dark/30">
              <span className="text-light-gray">Browser:</span>
              <span className="text-metallic-silver">{sessionInfo.browser || 'Unknown'}</span>
            </div>
            <div className="flex justify-between py-2 border-b border-navy-dark/30">
              <span className="text-light-gray">Device Type:</span>
              <span className="text-metallic-silver capitalize">{sessionInfo.deviceType || 'Unknown'}</span>
            </div>
            <div className="flex justify-between py-2 border-b border-navy-dark/30">
              <span className="text-light-gray">Country:</span>
              <span className="text-metallic-silver">{sessionInfo.country || 'Unknown'}</span>
            </div>
            <div className="flex justify-between py-2">
              <span className="text-light-gray">Region/City:</span>
              <span className="text-metallic-silver">{sessionInfo.region || 'Unknown'}, {sessionInfo.city || 'Unknown'}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Page Views Timeline */}
      <div className="glass-card p-6">
        <h2 className="text-xl font-bold text-white mb-4 flex items-center space-x-2">
          <Eye className="text-electric-blue" size={24} />
          <span>Page Views Timeline ({sessionData.length})</span>
        </h2>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-electric-blue/20">
                <th className="text-left py-3 px-4 text-light-gray font-semibold">Time</th>
                <th className="text-left py-3 px-4 text-light-gray font-semibold">Page</th>
                <th className="text-left py-3 px-4 text-light-gray font-semibold">Title</th>
                <th className="text-left py-3 px-4 text-light-gray font-semibold">Load Time</th>
                <th className="text-left py-3 px-4 text-light-gray font-semibold">Referrer</th>
                <th className="text-left py-3 px-4 text-light-gray font-semibold">Type</th>
              </tr>
            </thead>
            <tbody>
              {sessionData.map((visit, index) => (
                <tr key={visit.id} className="border-b border-navy-dark hover:bg-navy-dark/30 transition-colors">
                  <td className="py-3 px-4 text-metallic-silver text-sm">
                    {format(new Date(visit.created_at), 'MMM dd, HH:mm:ss')}
                  </td>
                  <td className="py-3 px-4 text-metallic-silver text-sm">
                    <Link to={visit.page_path} className="text-electric-blue hover:underline">
                      {visit.page_path}
                    </Link>
                  </td>
                  <td className="py-3 px-4 text-metallic-silver text-sm">
                    {visit.page_title || 'No title'}
                  </td>
                  <td className="py-3 px-4 text-metallic-silver text-sm">
                    {visit.page_load_time ? `${visit.page_load_time}ms` : 'N/A'}
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
                  <td className="py-3 px-4">
                    {visit.is_bot ? (
                      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-semibold bg-orange-500/20 text-orange-400">
                        <Bot size={12} className="mr-1" />
                        {visit.bot_name || 'Bot'}
                      </span>
                    ) : (
                      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-semibold bg-green-500/20 text-green-400">
                        <Users size={12} className="mr-1" />
                        Human
                      </span>
                    )}
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

export default AnalyticsDetail
