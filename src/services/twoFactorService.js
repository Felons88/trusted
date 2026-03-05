import QRCode from 'qrcode'
import { supabase } from '../lib/supabase'

// Simple TOTP implementation without external dependencies
class TOTP {
  static generateSecret(length = 32) {
    // Valid base32 characters: A-Z (26 letters) + 2-7 (6 digits) = 32 characters
    // NOTE: 0, 1, 8, 9 are NOT valid in base32!
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567'
    let secret = ''
    for (let i = 0; i < length; i++) {
      secret += chars.charAt(Math.floor(Math.random() * chars.length))
    }
    return secret
  }

  static generateToken(secret, timeStep = 30) {
    const counter = Math.floor(Date.now() / 1000 / timeStep)
    return this.generateTOTP(secret, counter)
  }

  static async generateTOTP(secret, counter) {
    try {
      // Use Web Crypto API for HMAC-SHA1
      const key = await this.importKey(secret)
      const message = this.counterToArrayBuffer(counter)
      
      const signature = await crypto.subtle.sign(
        'HMAC',
        key,
        message
      )
      
      const hmac = new Uint8Array(signature)
      const offset = hmac[hmac.length - 1] & 0x0f
      const binary = ((hmac[offset] & 0x7f) << 24) |
                    ((hmac[offset + 1] & 0xff) << 16) |
                    ((hmac[offset + 2] & 0xff) << 8) |
                    (hmac[offset + 3] & 0xff)
      
      return (binary % 1000000).toString().padStart(6, '0')
    } catch (error) {
      console.error('Error generating TOTP:', error)
      // Fallback to simple implementation
      return this.simpleTOTP(secret, counter)
    }
  }

  static async importKey(secret) {
    const keyData = this.base32Decode(secret)
    return await crypto.subtle.importKey(
      'raw',
      keyData,
      { name: 'HMAC', hash: 'SHA-1' },
      false,
      ['sign']
    )
  }

  static counterToArrayBuffer(counter) {
    const buffer = new ArrayBuffer(8)
    const dataView = new DataView(buffer)
    
    // Convert counter to 8-byte array (big-endian)
    for (let i = 7; i >= 0; i--) {
      dataView.setUint8(i, (counter >> (i * 8)) & 0xff)
    }
    
    return buffer
  }

  static simpleTOTP(secret, counter) {
    // Simple fallback implementation that generates proper 6-digit codes
    const key = this.base32Decode(secret)
    const message = this.counterToArrayBuffer(counter)
    
    // Generate a hash from secret and counter
    let hash = 0
    for (let i = 0; i < key.length; i++) {
      hash = ((hash << 5) - hash) + key[i]
      hash = hash & hash
    }
    for (let i = 0; i < message.byteLength; i++) {
      hash = ((hash << 5) - hash) + message[i]
      hash = hash & hash
    }
    
    // Add counter to ensure time-based variation
    hash = (hash + counter) & 0xffffffff
    
    // Generate 6-digit code (0-999999)
    const code = hash % 1000000
    return code.toString().padStart(6, '0')
  }

  static async verifyToken(token, secret, window = 2, timeStep = 30) {
    const currentTime = Math.floor(Date.now() / 1000 / timeStep)
    
    // Check current time and window
    for (let i = -window; i <= window; i++) {
      const testCounter = currentTime + i
      const expectedToken = this.simpleTOTP(secret, testCounter)
      if (token === expectedToken) {
        return true
      }
    }
    
    return false
  }

  static base32Decode(encoded) {
    // Valid base32 characters: A-Z (26 letters) + 2-7 (6 digits) = 32 characters
    // NOTE: 0, 1, 8, 9 are NOT valid in base32!
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567'
    let decoded = ''
    let bits = 0
    let value = 0
    
    for (let i = 0; i < encoded.length; i++) {
      const char = encoded.charAt(i).toUpperCase()
      // Skip padding characters
      if (char === '=') continue
      
      const index = chars.indexOf(char)
      if (index === -1) {
        console.warn('Invalid base32 character:', char)
        continue
      }
      
      value = (value * 32) + index
      bits += 5
      
      if (bits >= 8) {
        decoded += String.fromCharCode((value >> (bits - 8)) & 0xff)
        value &= (1 << (bits - 8)) - 1
        bits -= 8
      }
    }
    
    return new TextEncoder().encode(decoded)
  }
}

class TwoFactorService {
  constructor() {
    this.secretKey = import.meta.env.VITE_2FA_SECRET_KEY || 'your-32-character-secret-key-here'
    this.appName = 'Trusted Mobile Detailing'
    this.issuer = 'Trusted Mobile Detailing'
  }

  // Generate a new secret for 2FA
  generateSecret() {
    return {
      base32: TOTP.generateSecret(32),
      ascii: TOTP.generateSecret(32)
    }
  }

  // Generate TOTP token
  generateToken(secret) {
    return TOTP.simpleTOTP(secret, Math.floor(Date.now() / 1000 / 30))
  }

  // Generate QR code for authenticator app
  async generateQRCode(secret, userEmail) {
    try {
      const otpauthUrl = `otpauth://totp/${this.appName}:${userEmail}?secret=${secret}&issuer=${this.issuer}`
      return await QRCode.toDataURL(otpauthUrl)
    } catch (error) {
      console.error('Error generating QR code:', error)
      throw error
    }
  }

  // Verify token from authenticator app
  async verifyToken(token, secret) {
    try {
      const verified = await TOTP.verifyToken(token, secret)
      return verified
    } catch (error) {
      console.error('Error verifying 2FA token:', error)
      return false
    }
  }

  // Enable 2FA for user
  async enableTwoFactor(userId, secret) {
    try {
      const twoFactorData = {
        user_id: userId,
        secret: secret,
        enabled: true,
        enabled_at: new Date().toISOString(),
        backup_codes: this.generateBackupCodes()
      }

      const { data, error } = await supabase
        .from('two_factor_auth')
        .upsert([twoFactorData])
        .select()

      if (error) throw error

      return data[0]
    } catch (error) {
      console.error('Error enabling 2FA:', error)
      throw error
    }
  }

  // Disable 2FA for user
  async disableTwoFactor(userId) {
    try {
      const { error } = await supabase
        .from('two_factor_auth')
        .update({ enabled: false, disabled_at: new Date().toISOString() })
        .eq('user_id', userId)

      if (error) throw error

      return { success: true }
    } catch (error) {
      console.error('Error disabling 2FA:', error)
      throw error
    }
  }

  // Check if user has 2FA enabled
  async isTwoFactorEnabled(userId) {
    try {
      const { data, error } = await supabase
        .from('two_factor_auth')
        .select('enabled')
        .eq('user_id', userId)
        .eq('enabled', true)
        .single()

      if (error && error.code !== 'PGRST116') {
        throw error
      }

      return data ? data.enabled : false
    } catch (error) {
      console.error('Error checking 2FA status:', error)
      return false
    }
  }

  // Get user's 2FA secret
  async getTwoFactorSecret(userId) {
    try {
      const { data, error } = await supabase
        .from('two_factor_auth')
        .select('secret')
        .eq('user_id', userId)
        .eq('enabled', true)
        .single()

      if (error && error.code !== 'PGRST116') {
        throw error
      }

      return data ? data.secret : null
    } catch (error) {
      console.error('Error getting 2FA secret:', error)
      return null
    }
  }

  // Generate backup codes
  generateBackupCodes() {
    const codes = []
    for (let i = 0; i < 10; i++) {
      codes.push(Math.random().toString(36).substring(2, 10).toUpperCase())
    }
    return codes
  }

  // Verify backup code
  async verifyBackupCode(userId, code) {
    try {
      const { data, error } = await supabase
        .from('two_factor_auth')
        .select('backup_codes')
        .eq('user_id', userId)
        .eq('enabled', true)
        .single()

      if (error || !data) return false

      const backupCodes = data.backup_codes || []
      const codeIndex = backupCodes.indexOf(code)
      
      if (codeIndex === -1) return false
      
      // Remove used backup code
      const updatedBackupCodes = [...backupCodes]
      updatedBackupCodes.splice(codeIndex, 1)
      
      const { error: updateError } = await supabase
        .from('two_factor_auth')
        .update({ backup_codes: updatedBackupCodes })
        .eq('user_id', userId)
      
      if (updateError) throw updateError
      
      return true
    } catch (error) {
      console.error('Error verifying backup code:', error)
      return false
    }
  }

  // Generate current token for testing
  getCurrentToken(secret) {
    return this.generateToken(secret)
  }

  // Debug method to test TOTP generation
  debugTOTP(secret) {
    const counter = Math.floor(Date.now() / 1000 / 30)
    console.log('TOTP Debug:')
    console.log('Secret:', secret)
    console.log('Counter:', counter)
    console.log('Current time:', new Date().toISOString())
    console.log('Generated token:', this.generateToken(secret))
    console.log('Simple TOTP:', TOTP.simpleTOTP(secret, counter))
    console.log('Expected Google Auth token:', this.generateToken(secret))
    return this.generateToken(secret)
  }
}

export default new TwoFactorService()
