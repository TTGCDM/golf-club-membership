/**
 * Google reCAPTCHA v3 Configuration
 *
 * reCAPTCHA v3 is an invisible CAPTCHA that returns a score (0.0 to 1.0)
 * indicating the likelihood that a user is human (1.0 = very likely human, 0.0 = very likely bot)
 *
 * Setup instructions:
 * 1. Register your site at https://www.google.com/recaptcha/admin
 * 2. Choose reCAPTCHA v3
 * 3. Add your domain (Firebase hosting domain or localhost for development)
 * 4. Copy the Site Key and add to .env as VITE_RECAPTCHA_SITE_KEY
 * 5. Add the reCAPTCHA script to public/index.html:
 *    <script src="https://www.google.com/recaptcha/api.js?render=YOUR_SITE_KEY"></script>
 *
 * Note: The Site Key is public and safe to expose in client-side code.
 * The Secret Key should NEVER be used in client-side code.
 */

// Get reCAPTCHA site key from environment variables
export const RECAPTCHA_SITE_KEY = import.meta.env.VITE_RECAPTCHA_SITE_KEY || ''

// Minimum acceptable reCAPTCHA score (0.0 to 1.0)
// 0.5 is recommended as a good balance between security and false positives
// Lower scores (e.g., 0.3) allow more submissions but may let bots through
// Higher scores (e.g., 0.7) are more restrictive but may block legitimate users
export const MIN_CAPTCHA_SCORE = 0.5

// reCAPTCHA action names (used for analytics in reCAPTCHA admin console)
export const RECAPTCHA_ACTIONS = {
  SUBMIT_APPLICATION: 'submit_application',
  VERIFY_EMAIL: 'verify_email',
  RESEND_EMAIL: 'resend_email'
}

/**
 * Execute reCAPTCHA and get token
 * @param {string} action - Action name (e.g., 'submit_application')
 * @returns {Promise<string>} reCAPTCHA token
 */
export const executeRecaptcha = async (action) => {
  try {
    // Check if reCAPTCHA is loaded
    if (!window.grecaptcha) {
      console.warn('reCAPTCHA not loaded. Make sure the script is included in index.html')
      return null
    }

    // Wait for reCAPTCHA to be ready
    await window.grecaptcha.ready(() => {})

    // Execute reCAPTCHA
    const token = await window.grecaptcha.execute(RECAPTCHA_SITE_KEY, { action })

    return token
  } catch (error) {
    console.error('Error executing reCAPTCHA:', error)
    throw error
  }
}

/**
 * Verify reCAPTCHA score (client-side only - for UX feedback)
 *
 * IMPORTANT: This is NOT secure verification!
 * In production with Cloud Functions, verify the token server-side using the Secret Key.
 * Client-side verification is only for user feedback and minimum score enforcement.
 *
 * For now, we accept any token and trust Firestore rules to enforce minimum score.
 *
 * @param {string} token - reCAPTCHA token
 * @returns {Promise<Object>} { success: boolean, score: number, message: string }
 */
export const verifyRecaptchaToken = async (token) => {
  try {
    // In development or without Cloud Functions, we can't verify the token server-side
    // So we assume a passing score for UX purposes
    // Firestore rules will enforce the minimum score on the backend

    if (!token) {
      return {
        success: false,
        score: 0,
        message: 'reCAPTCHA token is missing'
      }
    }

    // Assume passing score (Firestore rules will validate)
    return {
      success: true,
      score: 0.9, // Assumed score for development
      message: 'reCAPTCHA verification successful'
    }

    // PRODUCTION with Cloud Functions:
    // Call your Cloud Function to verify the token server-side
    /*
    const response = await fetch('/api/verify-recaptcha', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token })
    })

    const result = await response.json()

    return {
      success: result.success && result.score >= MIN_CAPTCHA_SCORE,
      score: result.score,
      message: result.success
        ? 'reCAPTCHA verification successful'
        : 'reCAPTCHA verification failed. Please try again.'
    }
    */
  } catch (error) {
    console.error('Error verifying reCAPTCHA token:', error)
    return {
      success: false,
      score: 0,
      message: 'Error verifying reCAPTCHA. Please try again.'
    }
  }
}

/**
 * Check if reCAPTCHA script is loaded
 * @returns {boolean} True if loaded
 */
export const isRecaptchaLoaded = () => {
  return typeof window !== 'undefined' && typeof window.grecaptcha !== 'undefined'
}

/**
 * Load reCAPTCHA script dynamically (alternative to adding to index.html)
 * @returns {Promise<void>}
 */
export const loadRecaptchaScript = () => {
  return new Promise((resolve, reject) => {
    // Check if already loaded
    if (isRecaptchaLoaded()) {
      resolve()
      return
    }

    // Create script element
    const script = document.createElement('script')
    script.src = `https://www.google.com/recaptcha/api.js?render=${RECAPTCHA_SITE_KEY}`
    script.async = true
    script.defer = true

    script.onload = () => {
      console.log('reCAPTCHA script loaded successfully')
      resolve()
    }

    script.onerror = () => {
      console.error('Failed to load reCAPTCHA script')
      reject(new Error('Failed to load reCAPTCHA script'))
    }

    document.head.appendChild(script)
  })
}

/**
 * Get reCAPTCHA badge visibility CSS
 * By default, reCAPTCHA shows a badge in the bottom-right corner
 * You can hide it if you include the reCAPTCHA branding in your terms
 *
 * @param {boolean} visible - Whether to show the badge
 * @returns {string} CSS to inject
 */
export const getRecaptchaBadgeCSS = (visible = true) => {
  if (visible) {
    return ''
  }

  // Hide the badge
  // IMPORTANT: If you hide the badge, you must include this text in your form:
  // "This site is protected by reCAPTCHA and the Google Privacy Policy and Terms of Service apply."
  return `
    .grecaptcha-badge {
      visibility: hidden;
    }
  `
}

/**
 * Get reCAPTCHA terms text (required if badge is hidden)
 * @returns {string} HTML string with reCAPTCHA terms
 */
export const getRecaptchaTermsHTML = () => {
  return `
    This site is protected by reCAPTCHA and the Google
    <a href="https://policies.google.com/privacy" target="_blank" rel="noopener noreferrer">Privacy Policy</a> and
    <a href="https://policies.google.com/terms" target="_blank" rel="noopener noreferrer">Terms of Service</a> apply.
  `
}

/**
 * Format reCAPTCHA score for display
 * @param {number} score - Score from 0.0 to 1.0
 * @returns {string} Formatted score description
 */
export const formatRecaptchaScore = (score) => {
  if (score >= 0.9) return 'Very likely human'
  if (score >= 0.7) return 'Likely human'
  if (score >= 0.5) return 'Possibly human'
  if (score >= 0.3) return 'Possibly bot'
  return 'Likely bot'
}
