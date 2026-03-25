import { supabase } from '../lib/supabase'

class AnalyticsService {
  constructor() {
    this.sessionId = this.generateSessionId()
  }

  generateSessionId() {
    // Generate or retrieve session ID from sessionStorage
    let sessionId = sessionStorage.getItem('analytics_session_id')
    if (!sessionId) {
      sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
      sessionStorage.setItem('analytics_session_id', sessionId)
    }
    return sessionId
  }

  detectBot(userAgent) {
    const botPatterns = [
      'bot', 'crawler', 'spider', 'crawling', 'slurp', 'mediapartners',
      'google', 'bing', 'yahoo', 'duckduckgo', 'baidu', 'yandex',
      'facebookexternalhit', 'twitterbot', 'linkedinbot', 'whatsapp',
      'telegram', 'slack', 'discord', 'pinterest', 'instagram'
    ]
    
    const ua = userAgent.toLowerCase()
    for (const pattern of botPatterns) {
      if (ua.includes(pattern)) {
        return { isBot: true, botName: this.extractBotName(userAgent) }
      }
    }
    return { isBot: false, botName: null }
  }

  extractBotName(userAgent) {
    const ua = userAgent.toLowerCase()
    if (ua.includes('googlebot')) return 'Googlebot'
    if (ua.includes('bingbot')) return 'Bingbot'
    if (ua.includes('slurp')) return 'Yahoo Slurp'
    if (ua.includes('duckduckbot')) return 'DuckDuckBot'
    if (ua.includes('baiduspider')) return 'Baiduspider'
    if (ua.includes('yandexbot')) return 'YandexBot'
    if (ua.includes('facebookexternalhit')) return 'Facebook Bot'
    if (ua.includes('twitterbot')) return 'Twitter Bot'
    if (ua.includes('linkedinbot')) return 'LinkedIn Bot'
    if (ua.includes('whatsapp')) return 'WhatsApp Bot'
    if (ua.includes('telegrambot')) return 'Telegram Bot'
    if (ua.includes('slackbot')) return 'Slack Bot'
    if (ua.includes('discordbot')) return 'Discord Bot'
    if (ua.includes('pinterest')) return 'Pinterest Bot'
    return 'Unknown Bot'
  }

  parseUserAgent(userAgent) {
    const ua = userAgent.toLowerCase()
    
    // Detect device type
    let deviceType = 'desktop'
    if (/(tablet|ipad|playbook|silk)|(android(?!.*mobi))/i.test(userAgent)) {
      deviceType = 'tablet'
    } else if (/Mobile|Android|iP(hone|od)|IEMobile|BlackBerry|Kindle|Silk-Accelerated|(hpw|web)OS|Opera M(obi|ini)/.test(userAgent)) {
      deviceType = 'mobile'
    }

    // Detect browser
    let browserName = 'Unknown'
    let browserVersion = ''
    if (ua.includes('edg/')) {
      browserName = 'Edge'
      browserVersion = userAgent.match(/Edg\/(\d+\.\d+)/)?.[1] || ''
    } else if (ua.includes('chrome/')) {
      browserName = 'Chrome'
      browserVersion = userAgent.match(/Chrome\/(\d+\.\d+)/)?.[1] || ''
    } else if (ua.includes('firefox/')) {
      browserName = 'Firefox'
      browserVersion = userAgent.match(/Firefox\/(\d+\.\d+)/)?.[1] || ''
    } else if (ua.includes('safari/') && !ua.includes('chrome')) {
      browserName = 'Safari'
      browserVersion = userAgent.match(/Version\/(\d+\.\d+)/)?.[1] || ''
    }

    // Detect OS
    let osName = 'Unknown'
    let osVersion = ''
    if (ua.includes('windows')) {
      osName = 'Windows'
      if (ua.includes('windows nt 10.0')) osVersion = '10'
      else if (ua.includes('windows nt 6.3')) osVersion = '8.1'
      else if (ua.includes('windows nt 6.2')) osVersion = '8'
    } else if (ua.includes('mac os x')) {
      osName = 'macOS'
      osVersion = userAgent.match(/Mac OS X (\d+[._]\d+)/)?.[1]?.replace('_', '.') || ''
    } else if (ua.includes('android')) {
      osName = 'Android'
      osVersion = userAgent.match(/Android (\d+\.\d+)/)?.[1] || ''
    } else if (ua.includes('iphone') || ua.includes('ipad')) {
      osName = 'iOS'
      osVersion = userAgent.match(/OS (\d+[._]\d+)/)?.[1]?.replace('_', '.') || ''
    } else if (ua.includes('linux')) {
      osName = 'Linux'
    }

    return { deviceType, browserName, browserVersion, osName, osVersion }
  }

  extractReferrerDomain(referrer) {
    if (!referrer) return null
    try {
      const url = new URL(referrer)
      return url.hostname
    } catch {
      return null
    }
  }

  extractUTMParams() {
    const params = new URLSearchParams(window.location.search)
    return {
      utm_source: params.get('utm_source') || null,
      utm_medium: params.get('utm_medium') || null,
      utm_campaign: params.get('utm_campaign') || null,
      utm_term: params.get('utm_term') || null,
      utm_content: params.get('utm_content') || null
    }
  }

  async trackPageView() {
    try {
      const userAgent = navigator.userAgent
      const { isBot, botName } = this.detectBot(userAgent)
      const { deviceType, browserName, browserVersion, osName, osVersion } = this.parseUserAgent(userAgent)
      const utmParams = this.extractUTMParams()
      
      // Get current user if authenticated
      const { data: { user } } = await supabase.auth.getUser()

      // Get IP address from ipify API
      let ipAddress = null
      let country = null
      let region = null
      let city = null
      try {
        const ipResponse = await fetch('https://api.ipify.org?format=json')
        const ipData = await ipResponse.json()
        ipAddress = ipData.ip
        
        // Get location data from ip-api.com (free, no API key required)
        if (ipAddress) {
          try {
            const locationResponse = await fetch(`http://ip-api.com/json/${ipAddress}`)
            const locationData = await locationResponse.json()
            if (locationData.status === 'success') {
              country = locationData.country
              region = locationData.regionName
              city = locationData.city
            }
          } catch (locationError) {
            console.warn('Could not fetch location data:', locationError)
          }
        }
      } catch (error) {
        console.warn('Could not fetch IP address:', error)
      }

      const visitData = {
        page_url: window.location.href,
        page_title: document.title,
        page_path: window.location.pathname,
        referrer_url: document.referrer || null,
        referrer_domain: this.extractReferrerDomain(document.referrer),
        ...utmParams,
        session_id: this.sessionId,
        user_id: user?.id || null,
        ip_address: ipAddress,
        user_agent: userAgent,
        is_bot: isBot,
        bot_name: botName,
        device_type: deviceType,
        browser_name: browserName,
        browser_version: browserVersion,
        os_name: osName,
        os_version: osVersion,
        country: country,
        region: region,
        city: city,
        page_load_time: performance.timing?.loadEventEnd && performance.timing?.navigationStart 
          ? Math.min(performance.timing.loadEventEnd - performance.timing.navigationStart, 2147483647) 
          : null,
        metadata: {
          screen_width: window.screen.width,
          screen_height: window.screen.height,
          viewport_width: window.innerWidth,
          viewport_height: window.innerHeight,
          language: navigator.language,
          timezone: Intl.DateTimeFormat().resolvedOptions().timeZone
        }
      }

      const { error } = await supabase
        .from('analytics_visits')
        .insert([visitData])

      if (error) {
        console.error('Analytics tracking error:', error)
      } else {
        console.log('Analytics tracked:', { path: visitData.page_path, isBot, botName, ip: ipAddress, location: `${city}, ${region}, ${country}` })
      }
    } catch (error) {
      console.error('Analytics tracking failed:', error)
    }
  }
}

export const analyticsService = new AnalyticsService()
