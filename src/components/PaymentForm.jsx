import { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { searchMembers } from '../services/membersService'
import { paymentFormSchema, transformPaymentFormData } from '../schemas'
import { FormField, FormInput, FormSelect } from './form'

const PaymentForm = ({ payment, onSubmit, onCancel, isLoading, preSelectedMember }) => {
  const [memberSearch, setMemberSearch] = useState('')
  const [memberResults, setMemberResults] = useState([])
  const [selectedMember, setSelectedMember] = useState(null)
  const [showResults, setShowResults] = useState(false)

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(paymentFormSchema),
    defaultValues: {
      memberId: '',
      memberName: '',
      amount: '',
      paymentDate: new Date().toISOString().split('T')[0],
      paymentMethod: 'bank_transfer',
      reference: '',
      notes: '',
    },
  })

  // Load existing payment data if editing
  useEffect(() => {
    if (payment) {
      setValue('memberId', payment.memberId)
      setValue('memberName', payment.memberName)
      setValue('amount', String(payment.amount))
      setValue('paymentDate', payment.paymentDate)
      setValue('paymentMethod', payment.paymentMethod)
      setValue('reference', payment.reference || '')
      setValue('notes', payment.notes || '')
      setSelectedMember({ id: payment.memberId, fullName: payment.memberName })
      setMemberSearch(payment.memberName)
    }
  }, [payment, setValue])

  // Handle pre-selected member (from URL parameter)
  useEffect(() => {
    if (preSelectedMember && !payment) {
      setSelectedMember(preSelectedMember)
      setValue('memberId', preSelectedMember.id)
      setValue('memberName', preSelectedMember.fullName)

      // Calculate default payment amount
      const defaultAmount = preSelectedMember.accountBalance < 0
        ? Math.abs(preSelectedMember.accountBalance).toFixed(2)
        : ''
      setValue('amount', defaultAmount)
      setMemberSearch(preSelectedMember.fullName)
    }
  }, [preSelectedMember, payment, setValue])

  // Search for members
  useEffect(() => {
    const searchMembersDebounced = async () => {
      if (memberSearch.length >= 2 && !selectedMember) {
        try {
          const results = await searchMembers(memberSearch)
          setMemberResults(results.filter(m => m.status === 'active'))
          setShowResults(true)
        } catch (error) {
          console.error('Error searching members:', error)
        }
      } else {
        setMemberResults([])
        setShowResults(false)
      }
    }

    const timeoutId = setTimeout(searchMembersDebounced, 300)
    return () => clearTimeout(timeoutId)
  }, [memberSearch, selectedMember])

  const handleMemberSelect = (member) => {
    setSelectedMember(member)
    setValue('memberId', member.id)
    setValue('memberName', member.fullName)

    // Calculate default payment amount
    const defaultAmount = member.accountBalance < 0
      ? Math.abs(member.accountBalance).toFixed(2)
      : ''
    setValue('amount', defaultAmount)
    setMemberSearch(member.fullName)
    setShowResults(false)
  }

  const handleMemberSearchChange = (e) => {
    const value = e.target.value
    setMemberSearch(value)
    // Clear selection if user starts typing again
    if (selectedMember && value !== selectedMember.fullName) {
      setSelectedMember(null)
      setValue('memberId', '')
      setValue('memberName', '')
    }
  }

  const onFormSubmit = (data) => {
    const transformedData = transformPaymentFormData(data)
    onSubmit(transformedData)
  }

  // eslint-disable-next-line react-hooks/incompatible-library -- watch() is intentionally reactive
  const watchMemberId = watch('memberId')

  return (
    <form onSubmit={handleSubmit(onFormSubmit)} className="space-y-6">
      <div className="bg-white shadow rounded-lg p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Payment Details</h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Member Search */}
          <div className="md:col-span-2 relative">
            <FormField
              label="Member"
              name="memberSearch"
              required
              error={errors.memberId?.message}
            >
              <input
                type="text"
                id="memberSearch"
                value={memberSearch}
                onChange={handleMemberSearchChange}
                placeholder="Search by name, email, or Golf Australia ID..."
                disabled={!!payment || !!preSelectedMember}
                autoComplete="off"
                className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-ocean-teal disabled:bg-gray-50 disabled:cursor-not-allowed ${
                  errors.memberId ? 'border-red-500' : 'border-gray-300'
                }`}
              />
            </FormField>
            {/* Hidden inputs for form data */}
            <input type="hidden" {...register('memberId')} />
            <input type="hidden" {...register('memberName')} />

            {showResults && memberResults.length > 0 && (
              <div className="absolute z-10 mt-1 w-full bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-auto">
                {memberResults.map(member => (
                  <div
                    key={member.id}
                    onClick={() => handleMemberSelect(member)}
                    className="px-3 py-2 hover:bg-ocean-seafoam bg-opacity-20 cursor-pointer border-b border-gray-100 last:border-b-0"
                  >
                    <div className="font-medium text-gray-900">{member.fullName}</div>
                    <div className="text-sm text-gray-500">
                      {member.email}
                      {member.golfAustraliaId && ` • GA: ${member.golfAustraliaId}`}
                      <span className="ml-2 text-red-600 font-medium">
                        Balance: ${(member.accountBalance || 0).toFixed(2)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
            {selectedMember && (
              <div className="mt-2 p-3 bg-ocean-seafoam bg-opacity-20 border border-ocean-teal rounded-md">
                <p className="text-sm text-gray-700">
                  <span className="font-medium">Selected:</span> {selectedMember.fullName}
                  {selectedMember.accountBalance !== undefined && (
                    <span className="ml-2 font-medium text-red-600">
                      • Current Balance: ${(selectedMember.accountBalance || 0).toFixed(2)}
                    </span>
                  )}
                </p>
              </div>
            )}
          </div>

          {/* Amount */}
          <FormField
            label="Amount ($)"
            name="amount"
            required
            error={errors.amount?.message}
          >
            <FormInput
              type="number"
              id="amount"
              step="0.01"
              min="0.01"
              error={errors.amount?.message}
              {...register('amount')}
            />
          </FormField>

          {/* Payment Date */}
          <FormField
            label="Payment Date"
            name="paymentDate"
            required
            error={errors.paymentDate?.message}
          >
            <FormInput
              type="date"
              id="paymentDate"
              error={errors.paymentDate?.message}
              {...register('paymentDate')}
            />
          </FormField>

          {/* Payment Method */}
          <FormField
            label="Payment Method"
            name="paymentMethod"
            required
            error={errors.paymentMethod?.message}
          >
            <FormSelect
              id="paymentMethod"
              error={errors.paymentMethod?.message}
              {...register('paymentMethod')}
            >
              <option value="bank_transfer">Bank Transfer</option>
              <option value="cash">Cash</option>
            </FormSelect>
          </FormField>

          {/* Reference */}
          <FormField
            label="Reference/Transaction ID"
            name="reference"
          >
            <FormInput
              type="text"
              id="reference"
              placeholder="Optional"
              {...register('reference')}
            />
          </FormField>

          {/* Notes */}
          <div className="md:col-span-2">
            <FormField
              label="Notes"
              name="notes"
            >
              <textarea
                id="notes"
                rows="3"
                placeholder="Optional notes or comments"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-ocean-teal mt-1"
                {...register('notes')}
              />
            </FormField>
          </div>

          {payment && (
            <div className="md:col-span-2 p-3 bg-yellow-50 border border-yellow-200 rounded-md">
              <p className="text-sm text-yellow-800">
                <strong>Note:</strong> Editing this payment will automatically adjust the member&apos;s account balance.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Form Actions */}
      <div className="flex justify-end gap-3">
        <button
          type="button"
          onClick={onCancel}
          disabled={isLoading}
          className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 disabled:opacity-50"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={isLoading || !watchMemberId}
          className="px-4 py-2 bg-ocean-teal text-white rounded-md hover:bg-ocean-navy disabled:opacity-50"
        >
          {isLoading ? 'Processing...' : payment ? 'Update Payment' : 'Record Payment'}
        </button>
      </div>
    </form>
  )
}

export default PaymentForm
