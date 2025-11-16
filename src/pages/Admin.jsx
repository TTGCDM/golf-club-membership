import { useState, useEffect } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { useNavigate } from 'react-router-dom'
import { clearAllData, getDataStats, exportAllData, downloadJSONBackup } from '../services/adminService'
import { importMembersFromCSV } from '../services/membersService'
import CategoryManager from '../components/CategoryManager'
import FeeApplication from '../components/FeeApplication'

const Admin = () => {
  const [dataStats, setDataStats] = useState({ members: 0, payments: 0, users: 0 })
  const [isLoading, setIsLoading] = useState(true)
  const [isClearing, setIsClearing] = useState(false)
  const [error, setError] = useState(null)
  const [success, setSuccess] = useState(null)
  const [showConfirmDialog, setShowConfirmDialog] = useState(false)
  const [confirmText, setConfirmText] = useState('')

  // CSV Upload state
  const [isUploading, setIsUploading] = useState(false)
  const [uploadResults, setUploadResults] = useState(null)
  const [showUploadResults, setShowUploadResults] = useState(false)

  // Backup export state
  const [isExporting, setIsExporting] = useState(false)

  const { checkPermission, ROLES, currentUser } = useAuth()
  const navigate = useNavigate()

  // Check if user is super admin
  useEffect(() => {
    if (!checkPermission(ROLES.SUPER_ADMIN)) {
      navigate('/dashboard')
    }
  }, [checkPermission, ROLES.SUPER_ADMIN, navigate])

  // Load data statistics
  useEffect(() => {
    loadStats()
  }, [])

  const loadStats = async () => {
    try {
      setIsLoading(true)
      const stats = await getDataStats()
      setDataStats(stats)
    } catch (err) {
      console.error('Error loading stats:', err)
      setError('Failed to load data statistics')
    } finally {
      setIsLoading(false)
    }
  }

  const handleClearAllData = async () => {
    // Verify confirmation text
    if (confirmText !== 'DELETE ALL DATA') {
      setError('Please type "DELETE ALL DATA" to confirm')
      return
    }

    try {
      setIsClearing(true)
      setError(null)
      setSuccess(null)

      // Clear all data but preserve current super admin user
      const results = await clearAllData([currentUser.uid])

      setShowConfirmDialog(false)
      setConfirmText('')

      if (results.errors.length > 0) {
        setError(`Partial success. Errors: ${results.errors.join(', ')}`)
      } else {
        setSuccess(
          `Successfully cleared all data: ${results.members} members, ${results.payments} payments, ${results.users} users (your account was preserved)`
        )
      }

      // Reload stats
      await loadStats()
    } catch (err) {
      console.error('Error clearing data:', err)
      setError('Failed to clear data: ' + err.message)
    } finally {
      setIsClearing(false)
    }
  }

  const openConfirmDialog = () => {
    setShowConfirmDialog(true)
    setConfirmText('')
    setError(null)
  }

  const closeConfirmDialog = () => {
    setShowConfirmDialog(false)
    setConfirmText('')
    setError(null)
  }

  const handleCSVUpload = async (event) => {
    const file = event.target.files?.[0]
    if (!file) return

    // Validate file type
    if (!file.name.endsWith('.csv')) {
      setError('Please upload a CSV file')
      return
    }

    try {
      setIsUploading(true)
      setError(null)
      setSuccess(null)
      setUploadResults(null)

      // Read file content
      const reader = new FileReader()
      reader.onload = async (e) => {
        try {
          const csvText = e.target?.result
          const results = await importMembersFromCSV(csvText)

          setUploadResults(results)
          setShowUploadResults(true)

          if (results.successful > 0) {
            setSuccess(
              `Upload complete! ${results.successful} member(s) created, ${results.skipped} skipped, ${results.failed} failed`
            )
            // Reload stats
            await loadStats()
          } else {
            setError('No members were created. Check the upload results for details.')
          }
        } catch (err) {
          console.error('Error processing CSV:', err)
          setError('Failed to process CSV: ' + err.message)
        } finally {
          setIsUploading(false)
          // Reset file input
          event.target.value = ''
        }
      }

      reader.onerror = () => {
        setError('Failed to read file')
        setIsUploading(false)
      }

      reader.readAsText(file)
    } catch (err) {
      console.error('Error uploading CSV:', err)
      setError('Failed to upload CSV: ' + err.message)
      setIsUploading(false)
    }
  }

  const closeUploadResults = () => {
    setShowUploadResults(false)
    setUploadResults(null)
  }

  const handleExportData = async () => {
    try {
      setIsExporting(true)
      setError(null)
      setSuccess(null)

      // Export all data
      const data = await exportAllData()

      // Download as JSON file
      const filename = `teatree-backup-${new Date().toISOString().split('T')[0]}.json`
      downloadJSONBackup(data, filename)

      setSuccess(`Backup downloaded successfully! (${data.counts.members} members, ${data.counts.payments} payments, ${data.counts.users} users)`)
    } catch (err) {
      console.error('Error exporting data:', err)
      setError('Failed to export data: ' + err.message)
    } finally {
      setIsExporting(false)
    }
  }

  if (!checkPermission(ROLES.SUPER_ADMIN)) {
    return null
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-gray-900">System Administration</h1>
        <span className="px-3 py-1 bg-red-100 text-red-800 text-sm font-medium rounded-full">
          Super Admin Only
        </span>
      </div>

      {/* Data Statistics Card */}
      <div className="bg-white shadow rounded-lg p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Database Statistics</h2>

        {isLoading ? (
          <p className="text-gray-600">Loading statistics...</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-blue-50 p-4 rounded-lg">
              <p className="text-sm text-gray-600">Total Members</p>
              <p className="text-3xl font-bold text-blue-600">{dataStats.members}</p>
            </div>
            <div className="bg-green-50 p-4 rounded-lg">
              <p className="text-sm text-gray-600">Total Payments</p>
              <p className="text-3xl font-bold text-green-600">{dataStats.payments}</p>
            </div>
            <div className="bg-purple-50 p-4 rounded-lg">
              <p className="text-sm text-gray-600">Total Users</p>
              <p className="text-3xl font-bold text-purple-600">{dataStats.users}</p>
            </div>
          </div>
        )}

        <button
          onClick={loadStats}
          className="mt-4 px-4 py-2 bg-gray-100 text-gray-700 rounded hover:bg-gray-200 transition-colors"
        >
          Refresh Statistics
        </button>
      </div>

      {/* Data Backup Section */}
      <div className="bg-white shadow rounded-lg p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
          <svg className="w-6 h-6 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" />
          </svg>
          Data Backup & Export
        </h2>

        <div className="bg-blue-50 border border-blue-200 rounded p-4 mb-4">
          <h3 className="font-semibold text-gray-900 mb-2">Export Database Backup</h3>
          <p className="text-sm text-gray-700 mb-3">
            Download a complete backup of all data as a JSON file. This includes all members, payments, fees, users, and membership categories.
          </p>
          <ul className="text-sm text-gray-600 mb-4 list-disc list-inside space-y-1">
            <li>Creates a timestamped JSON file with all database collections</li>
            <li>Useful for manual backups before major changes</li>
            <li>Can be used for data migration or recovery</li>
            <li>Recommended: Download weekly backups and store securely</li>
          </ul>

          <button
            onClick={handleExportData}
            disabled={isExporting}
            className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors flex items-center"
          >
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
            </svg>
            {isExporting ? 'Exporting...' : 'Download Backup (JSON)'}
          </button>
        </div>

        <div className="bg-yellow-50 border border-yellow-200 rounded p-4">
          <h3 className="font-semibold text-gray-900 mb-2 flex items-center">
            <svg className="w-5 h-5 mr-2 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            Backup Best Practices
          </h3>
          <ul className="text-sm text-gray-700 space-y-1 list-disc list-inside">
            <li><strong>Regular backups:</strong> Download backups weekly or before major changes</li>
            <li><strong>Secure storage:</strong> Store backup files in a secure location (cloud storage, external drive)</li>
            <li><strong>Firebase backups:</strong> Enable automated daily backups in Firebase Console (see DEPLOYMENT.md)</li>
            <li><strong>Test restores:</strong> Periodically verify backups can be restored successfully</li>
            <li><strong>Before deployment:</strong> Always create a backup before deploying to production</li>
          </ul>
        </div>

        {/* Success/Error Messages */}
        {success && (
          <div className="mt-4 bg-green-50 border border-green-200 text-green-800 px-4 py-3 rounded">
            {success}
          </div>
        )}

        {error && (
          <div className="mt-4 bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded">
            {error}
          </div>
        )}
      </div>

      {/* CSV Upload Section */}
      <div className="bg-white shadow rounded-lg p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
          <svg className="w-6 h-6 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
          </svg>
          Import Members from CSV
        </h2>

        <div className="bg-blue-50 border border-blue-200 rounded p-4 mb-4">
          <h3 className="font-semibold text-gray-900 mb-2">Upload Member Data</h3>
          <p className="text-sm text-gray-700 mb-3">
            Upload a CSV file with member details. CSV must have 11 columns in this order:
          </p>
          <p className="text-xs font-mono bg-white p-2 rounded mb-3 overflow-x-auto">
            Full Name, Email, Phone, Address, Date of Birth, Golf Australia ID, Membership Category, Status, Account Balance, Date Joined, Emergency Contact
          </p>

          <div className="bg-green-50 border border-green-300 rounded p-3 mb-3">
            <p className="text-sm font-semibold text-green-900 mb-1">✅ Required Fields (only 2!):</p>
            <ul className="text-sm text-green-800 list-disc list-inside ml-2">
              <li><strong>Full Name</strong> - Member's name</li>
              <li><strong>Golf Australia ID</strong> - Unique identifier</li>
            </ul>
          </div>

          <div className="bg-yellow-50 border border-yellow-300 rounded p-3 mb-3">
            <p className="text-sm font-semibold text-yellow-900 mb-1">📋 Membership Category Options:</p>
            <ul className="text-sm text-yellow-800 list-disc list-inside ml-2 space-y-1">
              <li>Leave <strong>blank</strong> → Auto-determined from Date of Birth (or defaults to "Full Membership")</li>
              <li>Or use one of these names: <code className="bg-white px-1 rounded">Junior 10-12 years</code>, <code className="bg-white px-1 rounded">Junior 13-15 years</code>, <code className="bg-white px-1 rounded">Junior 16-18 years</code>, <code className="bg-white px-1 rounded">Colts</code>, <code className="bg-white px-1 rounded">Full Membership</code>, <code className="bg-white px-1 rounded">Senior Full Membership</code>, <code className="bg-white px-1 rounded">Life & Honorary Members</code>, <code className="bg-white px-1 rounded">Non-playing/Social</code></li>
            </ul>
          </div>

          <ul className="text-sm text-gray-600 mb-3 list-disc list-inside space-y-1">
            <li><strong>All other fields are optional</strong> - can be left blank</li>
            <li>Duplicate emails or Golf Australia IDs will be skipped</li>
            <li>Empty text fields default to blank, empty numbers default to 0</li>
            <li>Date of Birth format (if provided): YYYY-MM-DD</li>
            <li>Status defaults to "active" if not specified</li>
            <li>Date Joined defaults to today if not specified</li>
          </ul>

          <div className="flex items-center space-x-4">
            <label className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 cursor-pointer transition-colors">
              {isUploading ? 'Uploading...' : 'Choose CSV File'}
              <input
                type="file"
                accept=".csv"
                onChange={handleCSVUpload}
                disabled={isUploading}
                className="hidden"
              />
            </label>
            {isUploading && (
              <span className="text-sm text-gray-600">Processing...</span>
            )}
          </div>
        </div>

        {/* Success/Error Messages */}
        {success && (
          <div className="bg-green-50 border border-green-200 text-green-800 px-4 py-3 rounded mb-4">
            {success}
          </div>
        )}

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded mb-4">
            {error}
          </div>
        )}
      </div>

      {/* Category Management */}
      <CategoryManager />

      {/* Fee Application */}
      <div className="bg-white shadow rounded-lg p-6">
        <FeeApplication />
      </div>

      {/* Danger Zone */}
      <div className="bg-white shadow rounded-lg p-6 border-2 border-red-200">
        <h2 className="text-xl font-semibold text-red-600 mb-4 flex items-center">
          <svg className="w-6 h-6 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
          Danger Zone
        </h2>

        <div className="bg-red-50 border border-red-200 rounded p-4 mb-4">
          <h3 className="font-semibold text-gray-900 mb-2">Clear All Data</h3>
          <p className="text-sm text-gray-700 mb-3">
            This will permanently delete all members, payments, and users (except your super admin account).
            <strong className="text-red-600"> This action cannot be undone.</strong>
          </p>
          <p className="text-sm text-gray-600 mb-3">
            Use this function to reset the system for testing or to clear test data before production use.
          </p>

          <button
            onClick={openConfirmDialog}
            disabled={isClearing}
            className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
          >
            Clear All Data
          </button>
        </div>

        {/* Success Message */}
        {success && (
          <div className="bg-green-50 border border-green-200 text-green-800 px-4 py-3 rounded mb-4">
            {success}
          </div>
        )}

        {/* Error Message */}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded mb-4">
            {error}
          </div>
        )}
      </div>

      {/* Confirmation Dialog */}
      {showConfirmDialog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
            <div className="flex items-center mb-4">
              <svg className="w-12 h-12 text-red-600 mr-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
              <h3 className="text-xl font-bold text-gray-900">Confirm Data Deletion</h3>
            </div>

            <div className="mb-4">
              <p className="text-gray-700 mb-2">
                You are about to delete:
              </p>
              <ul className="list-disc list-inside text-gray-700 mb-4">
                <li><strong>{dataStats.members}</strong> members</li>
                <li><strong>{dataStats.payments}</strong> payments</li>
                <li><strong>{dataStats.users - 1}</strong> users (preserving your account)</li>
              </ul>
              <p className="text-red-600 font-semibold mb-4">
                This action is PERMANENT and CANNOT be undone!
              </p>

              <label className="block text-sm font-medium text-gray-700 mb-2">
                Type <span className="font-mono bg-gray-100 px-2 py-1">DELETE ALL DATA</span> to confirm:
              </label>
              <input
                type="text"
                value={confirmText}
                onChange={(e) => setConfirmText(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
                placeholder="DELETE ALL DATA"
                disabled={isClearing}
              />
            </div>

            <div className="flex space-x-3">
              <button
                onClick={handleClearAllData}
                disabled={isClearing || confirmText !== 'DELETE ALL DATA'}
                className="flex-1 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
              >
                {isClearing ? 'Deleting...' : 'Delete All Data'}
              </button>
              <button
                onClick={closeConfirmDialog}
                disabled={isClearing}
                className="flex-1 px-4 py-2 bg-gray-200 text-gray-700 rounded hover:bg-gray-300 disabled:bg-gray-100 disabled:cursor-not-allowed transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Upload Results Modal */}
      {showUploadResults && uploadResults && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-3xl w-full max-h-[80vh] overflow-hidden flex flex-col">
            <div className="p-6 border-b">
              <div className="flex items-center justify-between">
                <h3 className="text-xl font-bold text-gray-900">CSV Upload Results</h3>
                <button
                  onClick={closeUploadResults}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>

            <div className="p-6 overflow-y-auto">
              {/* Summary */}
              <div className="grid grid-cols-4 gap-4 mb-6">
                <div className="bg-gray-50 p-4 rounded">
                  <p className="text-sm text-gray-600">Total Rows</p>
                  <p className="text-2xl font-bold text-gray-900">{uploadResults.total}</p>
                </div>
                <div className="bg-green-50 p-4 rounded">
                  <p className="text-sm text-gray-600">Successful</p>
                  <p className="text-2xl font-bold text-green-600">{uploadResults.successful}</p>
                </div>
                <div className="bg-yellow-50 p-4 rounded">
                  <p className="text-sm text-gray-600">Skipped</p>
                  <p className="text-2xl font-bold text-yellow-600">{uploadResults.skipped}</p>
                </div>
                <div className="bg-red-50 p-4 rounded">
                  <p className="text-sm text-gray-600">Failed</p>
                  <p className="text-2xl font-bold text-red-600">{uploadResults.failed}</p>
                </div>
              </div>

              {/* Detailed Results */}
              {uploadResults.details.length > 0 && (
                <div>
                  <h4 className="font-semibold text-gray-900 mb-3">Detailed Results</h4>
                  <div className="max-h-96 overflow-y-auto border rounded">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50 sticky top-0">
                        <tr>
                          <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Row</th>
                          <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
                          <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                          <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Reason</th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {uploadResults.details.map((detail, index) => (
                          <tr key={index} className={
                            detail.status === 'success' ? 'bg-green-50' :
                            detail.status === 'skipped' ? 'bg-yellow-50' :
                            'bg-red-50'
                          }>
                            <td className="px-4 py-2 text-sm text-gray-900">{detail.row}</td>
                            <td className="px-4 py-2 text-sm text-gray-900">{detail.name || '-'}</td>
                            <td className="px-4 py-2 text-sm">
                              <span className={`px-2 py-1 rounded text-xs font-medium ${
                                detail.status === 'success' ? 'bg-green-200 text-green-800' :
                                detail.status === 'skipped' ? 'bg-yellow-200 text-yellow-800' :
                                'bg-red-200 text-red-800'
                              }`}>
                                {detail.status}
                              </span>
                            </td>
                            <td className="px-4 py-2 text-sm text-gray-600">{detail.reason || '-'}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>

            <div className="p-6 border-t">
              <button
                onClick={closeUploadResults}
                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default Admin
