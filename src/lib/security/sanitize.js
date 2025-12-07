/**
 * Security Sanitization Utilities
 *
 * Provides safe HTML handling and CSP utilities
 * Use these for any cases where HTML rendering is needed
 */

/**
 * Basic HTML entity escaping
 * Use this for text that will be displayed in HTML
 */
export function escapeHtml(str) {
  if (typeof str !== 'string') return str
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;')
}

/**
 * Unescape HTML entities
 */
export function unescapeHtml(str) {
  if (typeof str !== 'string') return str
  return str
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#039;/g, "'")
    .replace(/&#x27;/g, "'")
}

/**
 * Strip all HTML tags from string
 */
export function stripHtml(str) {
  if (typeof str !== 'string') return str
  return str.replace(/<[^>]*>/g, '')
}

/**
 * Sanitize string for use in URL parameters
 */
export function sanitizeUrlParam(str) {
  if (typeof str !== 'string') return str
  return encodeURIComponent(str)
}

/**
 * Sanitize string for use in CSS
 */
export function sanitizeCss(str) {
  if (typeof str !== 'string') return str
  // Remove CSS expressions and dangerous patterns
  return str
    .replace(/expression\s*\(/gi, '')
    .replace(/url\s*\(\s*["']?\s*javascript:/gi, '')
    .replace(/url\s*\(\s*["']?\s*data:/gi, '')
}

/**
 * Allowed HTML tags for basic rich text (if needed)
 * These are safe tags that don't execute scripts
 * Export for use by DOMPurify or custom sanitizer
 */
export const ALLOWED_TAGS = [
  'p', 'br', 'b', 'i', 'u', 'strong', 'em',
  'ul', 'ol', 'li', 'a', 'span', 'div',
  'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
]

/**
 * Allowed attributes for HTML tags
 * Export for use by DOMPurify or custom sanitizer
 */
export const ALLOWED_ATTRS = {
  a: ['href', 'title', 'target'],
  '*': ['class', 'id'],
}

/**
 * Basic HTML sanitizer (for cases where DOMPurify is not available)
 * WARNING: For full security, use DOMPurify library instead
 *
 * @param {string} html - HTML string to sanitize
 * @returns {string} Sanitized HTML
 */
export function basicSanitizeHtml(html) {
  if (typeof html !== 'string') return ''

  // First, remove all script tags and their contents
  let clean = html.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')

  // Remove event handlers (onclick, onerror, etc.)
  clean = clean.replace(/\s*on\w+\s*=\s*["'][^"']*["']/gi, '')
  clean = clean.replace(/\s*on\w+\s*=\s*[^\s>]*/gi, '')

  // Remove javascript: URLs
  clean = clean.replace(/javascript:/gi, '')

  // Remove data: URLs (can be used for XSS)
  clean = clean.replace(/data:\s*text\/html/gi, '')

  // Remove style tags (can contain CSS expressions)
  clean = clean.replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, '')

  // Remove dangerous tags
  const dangerousTags = ['iframe', 'object', 'embed', 'form', 'input', 'button', 'textarea', 'select']
  dangerousTags.forEach((tag) => {
    const regex = new RegExp(`<${tag}\\b[^>]*>.*?</${tag}>|<${tag}\\b[^>]*/?>`, 'gi')
    clean = clean.replace(regex, '')
  })

  return clean
}

/**
 * Safe wrapper for dangerouslySetInnerHTML
 * Use this instead of directly using dangerouslySetInnerHTML
 *
 * @param {string} html - HTML string to render
 * @returns {Object} Object for dangerouslySetInnerHTML
 */
export function createSafeHtml(html) {
  const sanitized = basicSanitizeHtml(html)
  return { __html: sanitized }
}

/**
 * Safe text renderer - escapes HTML for display
 * Use this for displaying user-generated text content
 *
 * @param {string} text - Text to render safely
 * @returns {string} Escaped text safe for HTML
 */
export function safeText(text) {
  return escapeHtml(text)
}

/**
 * Validate and sanitize URL
 * Ensures URL is safe and uses allowed protocols
 *
 * @param {string} url - URL to validate
 * @param {Array<string>} allowedProtocols - Allowed protocols (default: http, https)
 * @returns {string|null} Sanitized URL or null if invalid
 */
export function sanitizeUrl(url, allowedProtocols = ['http:', 'https:']) {
  if (typeof url !== 'string') return null

  try {
    const parsed = new URL(url)

    // Check protocol
    if (!allowedProtocols.includes(parsed.protocol)) {
      return null
    }

    // Reconstruct URL to normalize it
    return parsed.toString()
  } catch {
    // Invalid URL
    return null
  }
}

/**
 * Generate CSP nonce for inline scripts
 * Use this if you need to allow specific inline scripts
 *
 * @returns {string} Random nonce string
 */
export function generateCspNonce() {
  const array = new Uint8Array(16)
  crypto.getRandomValues(array)
  return Array.from(array, (byte) => byte.toString(16).padStart(2, '0')).join('')
}

/**
 * Create Content Security Policy header value
 * Customize based on your needs
 *
 * @param {Object} options - CSP options
 * @returns {string} CSP header value
 */
export function createCspHeader(options = {}) {
  const {
    nonce = null,
    reportUri = null,
  } = options

  const directives = [
    "default-src 'self'",
    `script-src 'self'${nonce ? ` 'nonce-${nonce}'` : ''}`,
    "style-src 'self' 'unsafe-inline'", // Needed for Tailwind
    "img-src 'self' data: https:",
    "font-src 'self' https://fonts.gstatic.com",
    "connect-src 'self' https://*.googleapis.com https://*.firebaseio.com wss://*.firebaseio.com",
    "frame-ancestors 'none'",
    "form-action 'self'",
    "base-uri 'self'",
  ]

  if (reportUri) {
    directives.push(`report-uri ${reportUri}`)
  }

  return directives.join('; ')
}

/**
 * Check if string contains potential XSS patterns
 *
 * @param {string} str - String to check
 * @returns {boolean} True if potential XSS detected
 */
export function containsXssPatterns(str) {
  if (typeof str !== 'string') return false

  const xssPatterns = [
    /<script\b/i,
    /javascript:/i,
    /on\w+\s*=/i,
    /data:\s*text\/html/i,
    /<iframe\b/i,
    /<object\b/i,
    /<embed\b/i,
    /expression\s*\(/i,
    /vbscript:/i,
  ]

  return xssPatterns.some((pattern) => pattern.test(str))
}

/**
 * Sanitize object values recursively
 * Useful for sanitizing form data objects
 *
 * @param {Object} obj - Object to sanitize
 * @returns {Object} Sanitized object
 */
export function sanitizeObject(obj) {
  if (typeof obj !== 'object' || obj === null) {
    if (typeof obj === 'string') {
      return stripHtml(obj)
    }
    return obj
  }

  if (Array.isArray(obj)) {
    return obj.map((item) => sanitizeObject(item))
  }

  const result = {}
  for (const [key, value] of Object.entries(obj)) {
    result[key] = sanitizeObject(value)
  }
  return result
}

export default {
  escapeHtml,
  unescapeHtml,
  stripHtml,
  sanitizeUrlParam,
  sanitizeCss,
  basicSanitizeHtml,
  createSafeHtml,
  safeText,
  sanitizeUrl,
  generateCspNonce,
  createCspHeader,
  containsXssPatterns,
  sanitizeObject,
}
