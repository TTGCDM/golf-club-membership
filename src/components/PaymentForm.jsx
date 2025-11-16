import { useState, useEffect } from 'react'
import { searchMembers } from '../services/membersService'

const PaymentForm = ({ payment, onSubmit, onCancel, isLoading, preSelectedMember }) => {
  const [formData, setFormData] = useState({
    memberId: '',
    memberName: '',
    amount: '',
    paymentDate: new Date().toISOString().split('T')[0],
    paymentMethod: 'bank_transfer',
    reference: '',
    notes: ''
  })

  const [memberSearch, setMemberSearch] = useState('')
  const [memberResults, setMemberResults] = useState([])
  const [selectedMember, setSelectedMember] = useState(null)
  const [showResults, setShowResults] = useState(false)

  // Load existing payment data if editing
  useEffect(() => {
    if (payment) {
      setFormData({
        memberId: payment.memberId,
        memberName: payment.memberName,
        amount: payment.amount,
        paymentDate: payment.paymentDate,
        paymentMethod: payment.paymentMethod,
        reference: payment.reference || '',
        notes: payment.notes || ''
      })
      setSelectedMember({ id: payment.memberId, fullName: payment.memberName })
    }
  }, [payment])

  // Handle pre-selected member (from URL parameter)
  useEffect(() => {
    if (preSelectedMember && !payment) {
      setSelectedMember(preSelectedMember)

      // Calculate default payment amount
      // If member has negative balance (owes money), suggest paying the full amount
      // If member has positive balance (credit), default to empty
      const defaultAmount = preSelectedMember.accountBalance < 0
        ? Math.abs(preSelectedMember.accountBalance).toFixed(2)
        : ''

      setFormData(prev => ({
        ...prev,
        memberId: preSelectedMember.id,
        memberName: preSelectedMember.fullName,
        amount: defaultAmount
      }))
      setMemberSearch(preSelectedMember.fullName)
    }
  }, [preSelectedMember, payment])

  // Search for members
  useEffect(() => {
    const searchMembersDebounced = async () => {
      if (memberSearch.length >= 2) {
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
  }, [memberSearch])

  const handleMemberSelect = (member) => {
    setSelectedMember(member)

    // Calculate default payment amount
    // If member has negative balance (owes money), suggest paying the full amount
    // If member has positive balance (credit), default to 0
    const defaultAmount = member.accountBalance < 0
      ? Math.abs(member.accountBalance).toFixed(2)
      : ''

    setFormData(prev => ({
      ...prev,
      memberId: member.id,
      memberName: member.fullName,
      amount: defaultAmount
    }))
    setMemberSearch(member.fullName)
    setShowResults(false)
  }

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    onSubmit(formData)
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="bg-white shadow rounded-lg p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Payment Details</h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Member Search */}
          <div className="md:col-span-2 relative">
            <label htmlFor="memberSearch" className="block text-sm font-medium text-gray-700 mb-1">
              Member *
            </label>
            <input
              type="text"
              id="memberSearch"
              value={memberSearch}
              onChange={(e) => setMemberSearch(e.target.value)}
              placeholder="Search by name, email, or Golf Australia ID..."
              disabled={!!payment || !!preSelectedMember}
              autoComplete="off"
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-50 disabled:cursor-not-allowed"
            />
            {showResults && memberResults.length > 0 && (
              <div className="absolute z-10 mt-1 w-full bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-auto">
                {memberResults.map(member => (
                  <div
                    key={member.id}
                    onClick={() => handleMemberSelect(member)}
                    className="px-3 py-2 hover:bg-blue-50 cursor-pointer border-b border-gray-100 last:border-b-0"
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
              <div className="mt-2 p-3 bg-blue-50 border border-blue-200 rounded-md">
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
          <div>
            <label htmlFor="amount" className="block text-sm font-medium text-gray-700 mb-1">
              Amount ($) *
            </label>
            <input
              type="number"
              id="amount"
              name="amount"
              value={formData.amount}
              onChange={handleChange}
              step="0.01"
              min="0.01"
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Payment Date */}
          <div>
            <label htmlFor="paymentDate" className="block text-sm font-medium text-gray-700 mb-1">
              Payment Date *
            </label>
            <input
              type="date"
              id="paymentDate"
              name="paymentDate"
              value={formData.paymentDate}
              onChange={handleChange}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Payment Method */}
          <div>
            <label htmlFor="paymentMethod" className="block text-sm font-medium text-gray-700 mb-1">
              Payment Method *
            </label>
            <select
              id="paymentMethod"
              name="paymentMethod"
              value={formData.paymentMethod}
              onChange={handleChange}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="bank_transfer">Bank Transfer</option>
              <option value="cash">Cash</option>
            </select>
          </div>

          {/* Reference */}
          <div>
            <label htmlFor="reference" className="block text-sm font-medium text-gray-700 mb-1">
              Reference/Transaction ID
            </label>
            <input
              type="text"
              id="reference"
              name="reference"
              value={formData.reference}
              onChange={handleChange}
              placeholder="Optional"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Notes */}
          <div className="md:col-span-2">
            <label htmlFor="notes" className="block text-sm font-medium text-gray-700 mb-1">
              Notes
            </label>
            <textarea
              id="notes"
              name="notes"
              value={formData.notes}
              onChange={handleChange}
              rows="3"
              placeholder="Optional notes or comments"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {payment && (
            <div className="md:col-span-2 p-3 bg-yellow-50 border border-yellow-200 rounded-md">
              <p className="text-sm text-yellow-800">
                <strong>Note:</strong> Editing this payment will automatically adjust the member's account balance.
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
          disabled={isLoading || !selectedMember}
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
        >
          {isLoading ? 'Processing...' : payment ? 'Update Payment' : 'Record Payment'}
        </button>
      </div>
    </form>
  )
}

export default PaymentForm
