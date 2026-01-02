import { useState, useEffect, useCallback } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useAuth } from '../contexts/AuthContext'
import { getAllCategories } from '../services/categoryService'
import { previewFeeApplication, applyAnnualFees } from '../services/feeService'
import { feeApplicationFormSchema, transformFeeApplicationFormData } from '../schemas'
import { FormField, FormSelect } from './form'

const FeeApplication = () => {
  const { currentUser } = useAuth()
  const [categories, setCategories] = useState([])
  const [preview, setPreview] = useState(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState(null)
  const [success, setSuccess] = useState(null)
  const [showResults, setShowResults] = useState(false)
  const [results, setResults] = useState(null)

  const {
    register,
    setValue,
    getValues,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(feeApplicationFormSchema),
    defaultValues: {
      feeYear: String(new Date().getFullYear()),
      categoryOverrides: {},
    },
  })

  const loadCategories = useCallback(async () => {
    try {
      const cats = await getAllCategories()
      setCategories(cats)

      // Initialize category fees with March rate from proRataRates (or fallback to annualFee)
      const defaultOverrides = {}
      cats.forEach(cat => {
        const marchRate = cat.proRataRates?.["3"] ?? cat.annualFee
        defaultOverrides[cat.id] = String(marchRate)
      })
      setValue('categoryOverrides', defaultOverrides)
    } catch (err) {
      setError('Failed to load categories: ' + err.message)
    }
  }, [setValue])

  useEffect(() => {
    loadCategories()
  }, [loadCategories])

  const handleFeeChange = (categoryId, value) => {
    const currentOverrides = getValues('categoryOverrides') || {}
    setValue('categoryOverrides', {
      ...currentOverrides,
      [categoryId]: value
    })
  }

  const handlePreview = async () => {
    try {
      setIsLoading(true)
      setError(null)
      setSuccess(null)

      const formData = getValues()
      const { feeYear, categoryOverrides } = transformFeeApplicationFormData(formData)

      // Convert overrides to number format for service
      const categoryFees = {}
      categories.forEach(cat => {
        const marchRate = cat.proRataRates?.["3"] ?? cat.annualFee
        categoryFees[cat.id] = categoryOverrides[cat.id] ?? marchRate
      })

      const previewData = await previewFeeApplication(feeYear, categoryFees)
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

    const formData = getValues()
    const { feeYear, categoryOverrides } = transformFeeApplicationFormData(formData)

    // Convert overrides to number format for service
    const categoryFees = {}
    categories.forEach(cat => {
      const marchRate = cat.proRataRates?.["3"] ?? cat.annualFee
      categoryFees[cat.id] = categoryOverrides[cat.id] ?? marchRate
    })

    const confirmed = window.confirm(
      `Are you sure you want to apply ${feeYear} annual fees to ${preview.totalMembers} members?\n\n` +
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

      const applyResults = await applyAnnualFees(feeYear, categoryFees, currentUser.uid)
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

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-2">Apply Annual Membership Fees</h3>
        <p className="text-sm text-gray-600">
          Apply annual fees to all active members. Default fees are pulled from the March rate in the pro-rata rate table (set in Membership Categories). You can override fees per category below before applying. Use <span className="font-medium">Refresh Rates</span> to reload the latest rates from the rate table.
        </p>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-md p-4">
          <p className="text-red-800 text-sm">{error}</p>
        </div>
      )}

      {success && (
        <div className="bg-secondary/20 border border-primary rounded-md p-4">
          <p className="text-primary text-sm">{success}</p>
        </div>
      )}

      {/* Year Selector */}
      <div className="flex items-center gap-4">
        <FormField
          label="Fee Year:"
          name="feeYear"
          error={errors.feeYear?.message}
        >
          <FormSelect
            id="feeYear"
            error={errors.feeYear?.message}
            {...register('feeYear', {
              onChange: () => setPreview(null) // Clear preview when year changes
            })}
          >
            {[2024, 2025, 2026, 2027].map(year => (
              <option key={year} value={String(year)}>{year}</option>
            ))}
          </FormSelect>
        </FormField>
        <button
          type="button"
          onClick={() => {
            loadCategories()
            setPreview(null)
            setSuccess('Rates refreshed from rate table')
          }}
          className="text-sm text-gray-600 hover:text-gray-800 flex items-center gap-1"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
          Refresh Rates
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
                Rate Table (March)
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Fee to Apply
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {categories.map(cat => {
              const marchRate = cat.proRataRates?.["3"] ?? cat.annualFee
              return (
              <tr key={cat.id}>
                <td className="px-4 py-3 text-sm text-gray-900">{cat.name}</td>
                <td className="px-4 py-3 text-sm text-gray-500">${marchRate.toFixed(2)}</td>
                <td className="px-4 py-3">
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    {...register(`categoryOverrides.${cat.id}`)}
                    onChange={(e) => handleFeeChange(cat.id, e.target.value)}
                    className="w-32 px-3 py-1 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </td>
              </tr>
            )})}
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
          className="px-4 py-2 bg-primary text-white rounded-md hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed"
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
                <div className="bg-success/10 p-4 rounded-lg">
                  <p className="text-sm text-success/90">Successful</p>
                  <p className="text-2xl font-bold text-success">{results.successful}</p>
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
                            <span className="px-2 py-1 bg-success/20 text-success rounded-full text-xs font-medium">
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
