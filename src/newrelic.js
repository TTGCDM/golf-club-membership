import { BrowserAgent } from '@newrelic/browser-agent/loaders/browser-agent'

/**
 * Initialize New Relic Browser Agent for production monitoring.
 *
 * Note: These values are hardcoded because they are browser-side keys
 * that are exposed in the client-side code anyway. They are not secrets.
 *
 * To update these values:
 * 1. Log in to New Relic: https://one.newrelic.com
 * 2. Go to Browser > your app > Application Settings
 * 3. Copy values from the Copy/Paste JavaScript section
 */
export function initNewRelic() {
  // New Relic Browser Agent configuration
  // These are public browser keys, not secrets
  const accountId = '7361374'
  const applicationId = '1431892652'
  const licenseKey = 'NRJS-f59868cc5855b4afed4'
  const trustKey = '7361374'
  const agentId = '1431892652'

  const options = {
    init: {
      distributed_tracing: { enabled: true },
      privacy: { cookies_enabled: true },
      ajax: { deny_list: ['bam.nr-data.net'] }
    },
    info: {
      beacon: 'bam.nr-data.net',
      errorBeacon: 'bam.nr-data.net',
      licenseKey: licenseKey,
      applicationID: applicationId,
      sa: 1
    },
    loader_config: {
      accountID: accountId,
      trustKey: trustKey,
      agentID: agentId,
      licenseKey: licenseKey,
      applicationID: applicationId
    }
  }

  try {
    const agent = new BrowserAgent(options)
    console.log('[New Relic] Browser agent initialized')
    return agent
  } catch (error) {
    console.error('[New Relic] Failed to initialize browser agent:', error)
    return null
  }
}
