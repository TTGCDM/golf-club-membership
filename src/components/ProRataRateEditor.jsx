import { useState, useEffect } from 'react'
import {
  generateDefaultProRataRates,
  updateProRataRates,
  calculateDefaultProRataRate
} from '../services/categoryService'

// Months in membership year order (March to February)
const MEMBERSHIP_YEAR_MONTHS = [
  { num: 3, name: 'March', monthsRemaining: 12 },
  { num: 4, name: 'April', monthsRemaining: 11 },
  { num: 5, name: 'May', monthsRemaining: 10 },
  { num: 6, name: 'June', monthsRemaining: 9 },
  { num: 7, name: 'July', monthsRemaining: 8 },
  { num: 8, name: 'August', monthsRemaining: 7 },
  { num: 9, name: 'September', monthsRemaining: 6 },
  { num: 10, name: 'October', monthsRemaining: 5 },
  { num: 11, name: 'November', monthsRemaining: 4 },
  { num: 12, name: 'December', monthsRemaining: 3 },
  { num: 1, name: 'January', monthsRemaining: 2 },
  { num: 2, name: 'February', monthsRemaining: 1 }
]

const ProRataRateEditor = ({ category, onSave, onClose }) => {
  const [rates, setRates] = useState({})
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState(null)

  // Initialize rates from category or generate defaults
  useEffect(() => {
    if (category.proRataRates && Object.keys(category.proRataRates).length > 0) {
      setRates(category.proRataRates)
    } else {
      setRates(generateDefaultProRataRates(category.annualFee))
    }
  }, [category])

  const handleRateChange = (month, value) => {
    const numValue = value === '' ? '' : parseFloat(value)
    setRates(prev => ({
      ...prev,
      [String(month)]: numValue
    }))
  }

  const handleResetAll = () => {
    setRates(generateDefaultProRataRates(category.annualFee))
  }

  const handleSave = async () => {
    try {
      setIsSaving(true)
      setError(null)

      // Convert empty strings to calculated defaults
      const finalRates = {}
      for (let month = 1; month <= 12; month++) {
        const key = String(month)
        const value = rates[key]
        if (value === '' || value === undefined || isNaN(value)) {
          finalRates[key] = calculateDefaultProRataRate(category.annualFee, month)
        } else {
          finalRates[key] = value
        }
      }

      await updateProRataRates(category.id, finalRates)
      onSave(finalRates)
    } catch (err) {
      setError('Failed to save rates: ' + err.message)
    } finally {
      setIsSaving(false)
    }
  }

  const getCalculatedRate = (month) => {
    return calculateDefaultProRataRate(category.annualFee, month)
  }

  const isModified = (month) => {
    const currentRate = rates[String(month)]
    const calculatedRate = getCalculatedRate(month)
    return currentRate !== undefined && currentRate !== '' && currentRate !== calculatedRate
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="p-6 border-b flex justify-between items-center">
          <div>
            <h3 className="text-xl font-bold text-gray-900">
              Pro-Rata Rates: {category.name}
            </h3>
            <p className="text-sm text-gray-600 mt-1">
              Annual Fee: <span className="font-semibold">${category.annualFee}</span>
              {category.joiningFee > 0 && (
                <span className="ml-4">
                  Joining Fee: <span className="font-semibold">${category.joiningFee}</span>
                  <span className="text-gray-500"> (always added)</span>
                </span>
              )}
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
            aria-label="Close"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Rate Table */}
        <div className="p-6">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Month
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Months
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Calculated
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Rate
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Total*
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {MEMBERSHIP_YEAR_MONTHS.map((month) => {
                  const calculated = getCalculatedRate(month.num)
                  const currentRate = rates[String(month.num)]
                  const displayRate = currentRate !== undefined && currentRate !== '' ? currentRate : calculated
                  const total = displayRate + (category.joiningFee || 0)
                  const modified = isModified(month.num)

                  return (
                    <tr key={month.num} className={modified ? 'bg-yellow-50' : ''}>
                      <td className="px-4 py-3 text-sm font-medium text-gray-900">
                        {month.name}
                        {modified && (
                          <span className="ml-2 text-xs text-yellow-600">(modified)</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-500">
                        {month.monthsRemaining}/12
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-500">
                        ${calculated}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center">
                          <span className="text-gray-400 mr-1">$</span>
                          <input
                            type="number"
                            min="0"
                            step="1"
                            value={currentRate !== undefined ? currentRate : calculated}
                            onChange={(e) => handleRateChange(month.num, e.target.value)}
                            className={`w-24 px-2 py-1 border rounded text-sm ${
                              modified
                                ? 'border-yellow-400 bg-yellow-50'
                                : 'border-gray-300'
                            }`}
                          />
                        </div>
                      </td>
                      <td className="px-4 py-3 text-sm font-medium text-gray-900">
                        ${total}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>

          <p className="text-xs text-gray-500 mt-3">
            * Total = Rate + Joining Fee (${category.joiningFee || 0}). This is what a new member pays when joining in that month.
          </p>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded mt-4">
              {error}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-6 border-t bg-gray-50 flex justify-between">
          <button
            type="button"
            onClick={handleResetAll}
            className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
          >
            Reset All to Calculated
          </button>
          <div className="flex space-x-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-gray-200 text-gray-700 rounded hover:bg-gray-300 transition-colors"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSave}
              disabled={isSaving}
              className="px-4 py-2 bg-primary text-white rounded hover:bg-primary/90 transition-colors disabled:opacity-50"
            >
              {isSaving ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default ProRataRateEditor
