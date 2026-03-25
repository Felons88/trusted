// Simple toast notification utility
class ToastService {
  constructor() {
    this.container = null
    this.init()
  }

  init() {
    // Create toast container if it doesn't exist
    if (!this.container) {
      this.container = document.createElement('div')
      this.container.id = 'toast-container'
      this.container.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        z-index: 9999;
        pointer-events: none;
      `
      document.body.appendChild(this.container)
    }
  }

  show(message, type = 'success') {
    const toast = document.createElement('div')
    const id = Date.now()
    
    const styles = {
      success: {
        background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
        icon: '✓'
      },
      error: {
        background: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
        icon: '✕'
      },
      info: {
        background: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
        icon: 'ℹ'
      }
    }

    const style = styles[type] || styles.success

    toast.style.cssText = `
      background: ${style.background};
      color: white;
      padding: 16px 20px;
      border-radius: 12px;
      margin-bottom: 12px;
      box-shadow: 0 10px 25px rgba(0, 0, 0, 0.2);
      display: flex;
      align-items: center;
      gap: 12px;
      min-width: 300px;
      max-width: 400px;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      font-size: 14px;
      font-weight: 500;
      pointer-events: auto;
      cursor: pointer;
      transform: translateX(100%);
      transition: all 0.3s cubic-bezier(0.68, -0.55, 0.265, 1.55);
      animation: slideIn 0.3s ease-out;
    `

    toast.innerHTML = `
      <span style="font-size: 18px; font-weight: bold;">${style.icon}</span>
      <span>${message}</span>
    `

    // Add animation styles
    if (!document.getElementById('toast-styles')) {
      const styleSheet = document.createElement('style')
      styleSheet.id = 'toast-styles'
      styleSheet.textContent = `
        @keyframes slideIn {
          from {
            transform: translateX(100%);
            opacity: 0;
          }
          to {
            transform: translateX(0);
            opacity: 1;
          }
        }
        @keyframes slideOut {
          from {
            transform: translateX(0);
            opacity: 1;
          }
          to {
            transform: translateX(100%);
            opacity: 0;
          }
        }
      `
      document.head.appendChild(styleSheet)
    }

    // Add click to dismiss
    toast.addEventListener('click', () => {
      this.dismiss(toast)
    })

    this.container.appendChild(toast)

    // Auto dismiss after 5 seconds
    setTimeout(() => {
      this.dismiss(toast)
    }, 5000)

    return id
  }

  dismiss(toast) {
    if (toast && toast.parentNode) {
      toast.style.animation = 'slideOut 0.3s ease-in'
      setTimeout(() => {
        if (toast.parentNode) {
          toast.parentNode.removeChild(toast)
        }
      }, 300)
    }
  }

  success(message) {
    return this.show(message, 'success')
  }

  error(message) {
    return this.show(message, 'error')
  }

  info(message) {
    return this.show(message, 'info')
  }

  // Clear all toasts
  clear() {
    if (this.container) {
      this.container.innerHTML = ''
    }
  }
}

export default new ToastService()
