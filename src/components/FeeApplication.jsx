import { useState, useEffect } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { getAllCategories } from '../services/categoryService'
import { previewFeeApplication, applyAnnualFees } from '../services/feeService'

const FeeApplication = () => {
  const { user } = useAuth()
  const [categories, setCategories] = useState([])
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear())
  const [categoryFees, setCategoryFees] = useState({}) // Override fees
  const [preview, setPreview] = useState(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState(null)
  const [success, setSuccess] = useState(null)
  const [showResults, setShowResults] = useState(false)
  const [results, setResults] = useState(null)

  useEffect(() => {
    loadCategories()
  }, [])

  const loadCategories = async () => {
    try {
      const cats = await getAllCategories()
      setCategories(cats)

      // Initialize category fees with default values
      const defaultFees = {}
      cats.forEach(cat => {
        defaultFees[cat.id] = cat.annualFee
      })
      setCategoryFees(defaultFees)
    } catch (err) {
      setError('Failed to load categories: ' + err.message)
    }
  }

  const handleFeeChange = (categoryId, value) => {
    setCategoryFees(prev => ({
      ...prev,
      [categoryId]: parseFloat(value) || 0
    }))
  }

  const handlePreview = async () => {
    try {
      setIsLoading(true)
      setError(null)
      setSuccess(null)
      const previewData = await previewFeeApplication(selectedYear, categoryFees)
      setPreview(previewData)
    } catch (err) {
      setError('Failed to preview: ' + err.message)
    } finally {
      setIsLoading(false)
    }
  }

  const handleApply = async () => {
    if (!preview) {
      setError('Please preview before applying')
      return
    }

    if (preview.totalMembers === 0) {
      setError('No members to apply fees to')
      return
    }

    const confirmed = window.confirm(
      `Are you sure you want to apply ${selectedYear} annual fees to ${preview.totalMembers} members?\n\n` +
      `Total fees: $${preview.totalAmount.toFixed(2)}\n\n` +
      `This will:\n` +
      `- Deduct fees from member account balances\n` +
      `- Create fee records in member transaction history\n` +
      `- Cannot be easily undone\n\n` +
      `Continue?`
    )

    if (!confirmed) return

    try {
      setIsLoading(true)
      setError(null)
      setSuccess(null)

      const applyResults = await applyAnnualFees(selectedYear, categoryFees, user.uid)
      setResults(applyResults)
      setShowResults(true)
      setPreview(null) // Clear preview after application

      if (applyResults.successful > 0) {
        setSuccess(`Successfully applied fees to ${applyResults.successful} members!`)
      }
    } catch (err) {
      setError('Failed to apply fees: ' + err.message)
    } finally {
      setIsLoading(false)
    }
  }

  const resetToDefaults = () => {
    const defaultFees = {}
    categories.forEach(cat => {
      defaultFees[cat.id] = cat.annualFee
    })
    setCategoryFees(defaultFees)
    setPreview(null)
  }

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-2">Apply Annual Membership Fees</h3>
        <p className="text-sm text-gray-600">
          Apply membership fees for a specific year to all active members. Fees will be deducted from member balances.
        </p>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-md p-4">
          <p className="text-red-800 text-sm">{error}</p>
        </div>
      )}

      {success && (
        <div className="bg-green-50 border border-green-200 rounded-md p-4">
          <p className="text-green-800 text-sm">{success}</p>
        </div>
      )}

      {/* Year Selector */}
      <div className="flex items-center gap-4">
        <label htmlFor="feeYear" className="text-sm font-medium text-gray-700">
          Fee Year:
        </label>
        <select
          id="feeYear"
          value={selectedYear}
          onChange={(e) => {
            setSelectedYear(parseInt(e.target.value))
            setPreview(null) // Clear preview when year changes
          }}
          className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          {[2024, 2025, 2026, 2027].map(year => (
            <option key={year} value={year}>{year}</option>
          ))}
        </select>
        <button
          onClick={resetToDefaults}
          className="text-sm text-blue-600 hover:text-blue-900"
        >
          Reset to Default Fees
        </button>
      </div>

      {/* Category Fee Table */}
      <div className="border border-gray-200 rounded-lg overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Category
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Default Annual Fee
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Fee to Apply
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {categories.map(cat => (
              <tr key={cat.id}>
                <td className="px-4 py-3 text-sm text-gray-900">{cat.name}</td>
                <td className="px-4 py-3 text-sm text-gray-500">${cat.annualFee.toFixed(2)}</td>
                <td className="px-4 py-3">
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={categoryFees[cat.id] || 0}
                    onChange={(e) => handleFeeChange(cat.id, e.target.value)}
                    className="w-32 px-3 py-1 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Action Buttons */}
      <div className="flex gap-3">
        <button
          onClick={handlePreview}
          disabled={isLoading}
          className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 disabled:opacity-50"
        >
          {isLoading ? 'Loading...' : 'Preview Fee Application'}
        </button>
        <button
          onClick={handleApply}
          disabled={isLoading || !preview || preview.totalMembers === 0}
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Apply Fees to Members
        </button>
      </div>

      {/* Preview Results */}
      {preview && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h4 className="font-semibold text-blue-900 mb-3">Fee Application Preview for {preview.year}</h4>

          <div className="grid grid-cols-3 gap-4 mb-4">
            <div>
              <p className="text-sm text-blue-700">Eligible Members</p>
              <p className="text-2xl font-bold text-blue-900">{preview.totalMembers}</p>
            </div>
            <div>
              <p className="text-sm text-blue-700">Total Fees</p>
              <p className="text-2xl font-bold text-blue-900">${preview.totalAmount.toFixed(2)}</p>
            </div>
            <div>
              <p className="text-sm text-blue-700">Already Applied</p>
              <p className="text-2xl font-bold text-blue-900">{preview.alreadyAppliedCount}</p>
            </div>
          </div>

          {Object.keys(preview.breakdown).length > 0 && (
            <div>
              <p className="text-sm font-medium text-blue-900 mb-2">Breakdown by Category:</p>
              <div className="space-y-2">
                {Object.entries(preview.breakdown).map(([categoryId, data]) => (
                  <div key={categoryId} className="flex justify-between text-sm">
                    <span className="text-blue-800">
                      {data.categoryName}: {data.memberCount} member{data.memberCount !== 1 ? 's' : ''}
                    </span>
                    <span className="font-medium text-blue-900">
                      ${(data.feeAmount * data.memberCount).toFixed(2)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {preview.totalMembers === 0 && (
            <p className="text-sm text-blue-700">
              No eligible members found. {preview.alreadyAppliedCount > 0 &&
                `All active members already have ${preview.year} fees applied.`}
            </p>
          )}
        </div>
      )}

      {/* Results Modal */}
      {showResults && results && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
            <div className="p-6 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">
                Fee Application Results - {results.year}
              </h3>
            </div>

            <div className="p-6 overflow-y-auto max-h-[calc(90vh-200px)]">
              {/* Summary */}
              <div className="grid grid-cols-4 gap-4 mb-6">
                <div className="bg-green-50 p-4 rounded-lg">
                  <p className="text-sm text-green-700">Successful</p>
                  <p className="text-2xl font-bold text-green-900">{results.successful}</p>
                </div>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <p className="text-sm text-gray-700">Skipped</p>
                  <p className="text-2xl font-bold text-gray-900">{results.skipped}</p>
                </div>
                <div className="bg-red-50 p-4 rounded-lg">
                  <p className="text-sm text-red-700">Failed</p>
                  <p className="text-2xl font-bold text-red-900">{results.failed}</p>
                </div>
                <div className="bg-blue-50 p-4 rounded-lg">
                  <p className="text-sm text-blue-700">Total Amount</p>
                  <p className="text-2xl font-bold text-blue-900">${results.totalAmount.toFixed(2)}</p>
                </div>
              </div>

              {/* Detailed Results */}
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Member</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Category</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Fee Amount</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {results.details.map((detail, index) => (
                      <tr key={index}>
                        <td className="px-4 py-3 text-sm text-gray-900">{detail.memberName}</td>
                        <td className="px-4 py-3 text-sm text-gray-700">{detail.categoryName || '-'}</td>
                        <td className="px-4 py-3 text-sm text-gray-700">
                          {detail.feeAmount !== undefined ? `$${detail.feeAmount.toFixed(2)}` : '-'}
                        </td>
                        <td className="px-4 py-3 text-sm">
                          {detail.status === 'success' && (
                            <span className="px-2 py-1 bg-green-100 text-green-800 rounded-full text-xs font-medium">
                              Success
                            </span>
                          )}
                          {detail.status === 'skipped' && (
                            <span className="px-2 py-1 bg-gray-100 text-gray-800 rounded-full text-xs font-medium">
                              Skipped: {detail.reason}
                            </span>
                          )}
                          {detail.status === 'failed' && (
                            <span className="px-2 py-1 bg-red-100 text-red-800 rounded-full text-xs font-medium">
                              Failed: {detail.reason}
                            </span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="p-6 border-t border-gray-200 flex justify-end">
              <button
                onClick={() => {
                  setShowResults(false)
                  setResults(null)
                  handlePreview() // Refresh preview to show updated counts
                }}
                className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700"
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

export default FeeApplication
