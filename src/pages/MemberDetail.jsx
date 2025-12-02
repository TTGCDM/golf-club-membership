import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { getMemberById } from '../services/membersService'
import { getAllCategories, calculateAge } from '../services/membershipCategories'
import { getPaymentsByMember, formatPaymentMethod, generatePDFReceipt, recordPayment } from '../services/paymentsService'
import { getFeesByMember, applyFeeToMember } from '../services/feeService'
import { generateWelcomeLetter, generatePaymentReminder } from '../services/welcomeLetterService'

const MemberDetail = () => {
  const { checkPermission, ROLES, currentUser } = useAuth()
  const [member, setMember] = useState(null)
  const [payments, setPayments] = useState([])
  const [fees, setFees] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState(null)
  const [success, setSuccess] = useState(null)
  const [category, setCategory] = useState(null)
  const [showFeeModal, setShowFeeModal] = useState(false)
  const [feeFormData, setFeeFormData] = useState({
    amount: '',
    feeYear: new Date().getFullYear(),
    notes: ''
  })
  const [isSubmittingFee, setIsSubmittingFee] = useState(false)
  const [showPaymentModal, setShowPaymentModal] = useState(false)
  const [paymentFormData, setPaymentFormData] = useState({
    amount: '',
    paymentDate: new Date().toISOString().split('T')[0],
    paymentMethod: 'bank_transfer',
    reference: '',
    notes: ''
  })
  const [isSubmittingPayment, setIsSubmittingPayment] = useState(false)
  const { id } = useParams()


  const canEdit = checkPermission(ROLES.EDIT)

  const handlePrintReceipt = async (payment) => {
    try {
      await generatePDFReceipt(payment)
      setSuccess('Receipt generated successfully!')
      setTimeout(() => setSuccess(null), 3000)
    } catch (err) {
      console.error('Error generating receipt:', err)
      setError('Failed to generate receipt')
      setTimeout(() => setError(null), 3000)
    }
  }

  const handleGenerateWelcomeLetter = async () => {
    try {
      await generateWelcomeLetter(id)
      setSuccess('Welcome letter generated successfully!')
      setTimeout(() => setSuccess(null), 3000)
    } catch (err) {
      console.error('Error generating welcome letter:', err)
      setError('Failed to generate welcome letter')
      setTimeout(() => setError(null), 3000)
    }
  }

  const handleGeneratePaymentReminder = async () => {
    try {
      await generatePaymentReminder(id)
      setSuccess('Payment reminder generated successfully!')
      setTimeout(() => setSuccess(null), 3000)
    } catch (err) {
      console.error('Error generating payment reminder:', err)
      setError('Failed to generate payment reminder')
      setTimeout(() => setError(null), 3000)
    }
  }

  const handleOpenFeeModal = () => {
    // Pre-fill with category annual fee if available
    setFeeFormData({
      amount: category?.annualFee || '',
      feeYear: new Date().getFullYear(),
      notes: `${new Date().getFullYear()} Annual Membership Fee`
    })
    setShowFeeModal(true)
  }

  const handleRecordFee = async (e) => {
    e.preventDefault()
    setIsSubmittingFee(true)
    setError(null)

    try {
      const feeData = {
        memberId: id,
        memberName: member.fullName,
        amount: parseFloat(feeFormData.amount),
        feeYear: parseInt(feeFormData.feeYear),
        notes: feeFormData.notes,
        categoryId: member.membershipCategory,
        categoryName: category?.name || member.membershipCategory
      }

      await applyFeeToMember(feeData, currentUser.uid)

      // Refresh data
      const [updatedMember, updatedFees] = await Promise.all([
        getMemberById(id),
        getFeesByMember(id)
      ])
      setMember(updatedMember)
      setFees(updatedFees)

      setSuccess('Fee recorded successfully!')
      setShowFeeModal(false)
      setFeeFormData({ amount: '', feeYear: new Date().getFullYear(), notes: '' })
      setTimeout(() => setSuccess(null), 3000)
    } catch (err) {
      console.error('Error recording fee:', err)
      setError('Failed to record fee')
    } finally {
      setIsSubmittingFee(false)
    }
  }

  const handleOpenPaymentModal = () => {
    // Pre-fill amount with outstanding balance if member owes money
    const outstandingAmount = member.accountBalance < 0 ? Math.abs(member.accountBalance) : ''
    setPaymentFormData({
      amount: outstandingAmount,
      paymentDate: new Date().toISOString().split('T')[0],
      paymentMethod: 'bank_transfer',
      reference: '',
      notes: ''
    })
    setShowPaymentModal(true)
  }

  const handleRecordPayment = async (e) => {
    e.preventDefault()
    setIsSubmittingPayment(true)
    setError(null)

    try {
      const paymentData = {
        memberId: id,
        memberName: member.fullName,
        amount: parseFloat(paymentFormData.amount),
        paymentDate: paymentFormData.paymentDate,
        paymentMethod: paymentFormData.paymentMethod,
        reference: paymentFormData.reference,
        notes: paymentFormData.notes
      }

      await recordPayment(paymentData, currentUser.uid)

      // Refresh data
      const [updatedMember, updatedPayments] = await Promise.all([
        getMemberById(id),
        getPaymentsByMember(id)
      ])
      setMember(updatedMember)
      setPayments(updatedPayments)

      setSuccess('Payment recorded successfully!')
      setShowPaymentModal(false)
      setPaymentFormData({
        amount: '',
        paymentDate: new Date().toISOString().split('T')[0],
        paymentMethod: 'bank_transfer',
        reference: '',
        notes: ''
      })
      setTimeout(() => setSuccess(null), 3000)
    } catch (err) {
      console.error('Error recording payment:', err)
      setError('Failed to record payment')
    } finally {
      setIsSubmittingPayment(false)
    }
  }

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [memberData, paymentData, feeData, categories] = await Promise.all([
          getMemberById(id),
          getPaymentsByMember(id),
          getFeesByMember(id),
          getAllCategories()
        ])

        setMember(memberData)
        setPayments(paymentData)
        setFees(feeData)

        // Find the category for this member
        const memberCategory = categories.find(c => c.id === memberData.membershipCategory)
        setCategory(memberCategory)
      } catch (err) {
        console.error('Error fetching data:', err)
        setError('Failed to load member data.')
      } finally {
        setIsLoading(false)
      }
    }

    fetchData()
  }, [id])

  if (isLoading) {
    return (
      <div>
        <h1 className="text-3xl font-bold text-gray-900 mb-6">Member Detail</h1>
        <p className="text-gray-600">Loading member data...</p>
      </div>
    )
  }

  if (error || !member) {
    return (
      <div>
        <h1 className="text-3xl font-bold text-gray-900 mb-6">Member Detail</h1>
        <div className="bg-red-50 border border-red-200 rounded-md p-4">
          <p className="text-red-800">{error || 'Member not found'}</p>
        </div>
        <Link to="/members" className="text-ocean-teal hover:text-ocean-navy mt-4 inline-block">
          Back to Members
        </Link>
      </div>
    )
  }

  const age = member.dateOfBirth ? calculateAge(member.dateOfBirth) : null

  // Helper function to determine balance color
  const getBalanceColor = (balance) => {
    if (balance > 0) return 'text-ocean-teal' // Positive = credit
    if (balance < 0) return 'text-red-600'   // Negative = owes money
    return 'text-gray-900'
  }

  return (
    <div>
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">{member.fullName}</h1>
          <p className="text-gray-600 mt-1">
            {category?.name || member.membershipCategory}
            {member.status === 'inactive' && ' (Inactive)'}
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={handleGenerateWelcomeLetter}
            className="px-4 py-2 bg-ocean-teal text-white rounded-md hover:bg-ocean-navy"
            title="Generate welcome letter and information pack"
          >
            Welcome Letter
          </button>
          {member.accountBalance < 0 && (
            <button
              onClick={handleGeneratePaymentReminder}
              className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
              title="Generate payment reminder letter"
            >
              Payment Reminder
            </button>
          )}
          {canEdit && (
            <Link
              to={`/members/${id}/edit`}
              className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
            >
              Edit
            </Link>
          )}
          <Link
            to="/members"
            className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
          >
            Back to List
          </Link>
        </div>
      </div>

      {/* Success Message */}
      {success && (
        <div className="mb-4 p-4 bg-ocean-seafoam bg-opacity-20 border border-ocean-teal rounded-md">
          <p className="text-ocean-teal">{success}</p>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Account Balance Card */}
        <div className="lg:col-span-3">
          <div className="bg-white shadow rounded-lg p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Account Balance</h3>
            <div className="flex items-center justify-between">
              <div>
                <p className={`text-4xl font-bold ${getBalanceColor(member.accountBalance || 0)}`}>
                  ${(member.accountBalance || 0).toFixed(2)}
                </p>
                <p className="text-gray-500 mt-1">
                  {member.accountBalance > 0 && 'Credit balance'}
                  {member.accountBalance < 0 && 'Outstanding balance'}
                  {member.accountBalance === 0 && 'Account fully paid'}
                </p>
              </div>
              {canEdit && (
                <div className="flex gap-2">
                  <button
                    onClick={handleOpenPaymentModal}
                    className="px-4 py-2 bg-ocean-teal text-white rounded-md hover:bg-ocean-navy"
                  >
                    Record Payment
                  </button>
                  <button
                    onClick={handleOpenFeeModal}
                    className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
                  >
                    Record Fee
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Personal Information */}
        <div className="lg:col-span-2">
          <div className="bg-white shadow rounded-lg p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Personal Information</h3>
            <dl className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <dt className="text-sm font-medium text-gray-500">Email</dt>
                <dd className="mt-1 text-sm text-gray-900">{member.email}</dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-500">Phone</dt>
                <dd className="mt-1 text-sm text-gray-900">{member.phone}</dd>
              </div>
              <div className="md:col-span-2">
                <dt className="text-sm font-medium text-gray-500">Address</dt>
                <dd className="mt-1 text-sm text-gray-900">{member.address}</dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-500">Date of Birth</dt>
                <dd className="mt-1 text-sm text-gray-900">
                  {member.dateOfBirth}
                  {age !== null && <span className="text-gray-500"> (Age: {age})</span>}
                </dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-500">Emergency Contact</dt>
                <dd className="mt-1 text-sm text-gray-900">{member.emergencyContact}</dd>
              </div>
            </dl>
          </div>
        </div>

        {/* Membership Information */}
        <div>
          <div className="bg-white shadow rounded-lg p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Membership</h3>
            <dl className="space-y-4">
              <div>
                <dt className="text-sm font-medium text-gray-500">Golf Australia ID</dt>
                <dd className="mt-1 text-sm text-gray-900">
                  {member.golfAustraliaId || 'Not provided'}
                </dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-500">Date Joined</dt>
                <dd className="mt-1 text-sm text-gray-900">{member.dateJoined}</dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-500">Category</dt>
                <dd className="mt-1 text-sm text-gray-900">{category?.name || member.membershipCategory}</dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-500">Annual Fee</dt>
                <dd className="mt-1 text-sm text-gray-900">${category?.annualFee || 0}</dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-500">Status</dt>
                <dd className="mt-1">
                  <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${member.status === 'active'
                    ? 'bg-ocean-seafoam bg-opacity-30 text-ocean-teal'
                    : 'bg-gray-100 text-gray-800'
                    }`}>
                    {member.status}
                  </span>
                </dd>
              </div>
            </dl>
          </div>
        </div>

        {/* Transaction History (Payments & Fees) */}
        <div className="lg:col-span-3">
          <div className="bg-white shadow rounded-lg p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Transaction History</h3>

            {payments.length === 0 && fees.length === 0 ? (
              <p className="text-gray-600">No transactions recorded yet</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Type
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Date
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Description
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Amount
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Reference
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {/* Combine payments and fees, sort by date */}
                    {[
                      ...payments.map(p => ({ ...p, type: 'payment', date: p.paymentDate })),
                      ...fees.map(f => ({ ...f, type: 'fee', date: f.appliedDate }))
                    ]
                      .sort((a, b) => b.date.localeCompare(a.date))
                      .map((transaction, index) => (
                        <tr key={`${transaction.type}-${transaction.id || index}`}>
                          <td className="px-4 py-3 whitespace-nowrap text-sm">
                            {transaction.type === 'payment' ? (
                              <span className="px-2 py-1 bg-ocean-seafoam bg-opacity-30 text-ocean-teal rounded-full text-xs font-medium">
                                Payment
                              </span>
                            ) : (
                              <span className="px-2 py-1 bg-red-100 text-red-800 rounded-full text-xs font-medium">
                                Fee
                              </span>
                            )}
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
                            {transaction.date}
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-900">
                            {transaction.type === 'payment'
                              ? `${formatPaymentMethod(transaction.paymentMethod)} - ${transaction.receiptNumber}`
                              : transaction.notes}
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap text-sm font-medium">
                            {transaction.type === 'payment' ? (
                              <span className="text-ocean-teal">+${transaction.amount.toFixed(2)}</span>
                            ) : (
                              <span className="text-red-600">-${transaction.amount.toFixed(2)}</span>
                            )}
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-500">
                            {transaction.type === 'payment'
                              ? transaction.reference || '-'
                              : `${transaction.feeYear} Annual Fee`}
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">
                            {transaction.type === 'payment' && (
                              <button
                                onClick={() => handlePrintReceipt(transaction)}
                                className="text-ocean-teal hover:text-ocean-navy"
                                title="Print Receipt"
                              >
                                Print
                              </button>
                            )}
                          </td>
                        </tr>
                      ))}
                  </tbody>
                </table>

                <div className="mt-4 pt-4 border-t border-gray-200">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-gray-600">
                        Payments: <span className="font-medium">{payments.length}</span>
                      </p>
                      <p className="text-sm text-ocean-teal">
                        Total: <span className="font-medium">
                          +${payments.reduce((sum, p) => sum + p.amount, 0).toFixed(2)}
                        </span>
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">
                        Fees Applied: <span className="font-medium">{fees.length}</span>
                      </p>
                      <p className="text-sm text-red-600">
                        Total: <span className="font-medium">
                          -${fees.reduce((sum, f) => sum + f.amount, 0).toFixed(2)}
                        </span>
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Record Fee Modal */}
      {showFeeModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Record Fee</h2>
            <p className="text-sm text-gray-600 mb-4">
              Recording fee for: <strong>{member.fullName}</strong>
            </p>

            {error && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md">
                <p className="text-red-800 text-sm">{error}</p>
              </div>
            )}

            <form onSubmit={handleRecordFee}>
              <div className="space-y-4">
                <div>
                  <label htmlFor="feeAmount" className="block text-sm font-medium text-gray-700 mb-1">
                    Amount ($)
                  </label>
                  <input
                    type="number"
                    id="feeAmount"
                    step="0.01"
                    min="0"
                    value={feeFormData.amount}
                    onChange={(e) => setFeeFormData({ ...feeFormData, amount: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-ocean-teal"
                    required
                  />
                </div>

                <div>
                  <label htmlFor="feeYear" className="block text-sm font-medium text-gray-700 mb-1">
                    Fee Year
                  </label>
                  <input
                    type="number"
                    id="feeYear"
                    min="2020"
                    max="2030"
                    value={feeFormData.feeYear}
                    onChange={(e) => setFeeFormData({ ...feeFormData, feeYear: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-ocean-teal"
                    required
                  />
                </div>

                <div>
                  <label htmlFor="feeNotes" className="block text-sm font-medium text-gray-700 mb-1">
                    Notes
                  </label>
                  <input
                    type="text"
                    id="feeNotes"
                    value={feeFormData.notes}
                    onChange={(e) => setFeeFormData({ ...feeFormData, notes: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-ocean-teal"
                    placeholder="e.g., 2025 Annual Membership Fee"
                  />
                </div>
              </div>

              <div className="mt-6 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowFeeModal(false)}
                  className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                  disabled={isSubmittingFee}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 disabled:opacity-50"
                  disabled={isSubmittingFee}
                >
                  {isSubmittingFee ? 'Recording...' : 'Record Fee'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Record Payment Modal */}
      {showPaymentModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Record Payment</h2>
            <p className="text-sm text-gray-600 mb-4">
              Recording payment for: <strong>{member.fullName}</strong>
            </p>

            {error && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md">
                <p className="text-red-800 text-sm">{error}</p>
              </div>
            )}

            <form onSubmit={handleRecordPayment}>
              <div className="space-y-4">
                <div>
                  <label htmlFor="paymentAmount" className="block text-sm font-medium text-gray-700 mb-1">
                    Amount ($)
                  </label>
                  <input
                    type="number"
                    id="paymentAmount"
                    step="0.01"
                    min="0"
                    value={paymentFormData.amount}
                    onChange={(e) => setPaymentFormData({ ...paymentFormData, amount: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-ocean-teal"
                    required
                  />
                </div>

                <div>
                  <label htmlFor="paymentDate" className="block text-sm font-medium text-gray-700 mb-1">
                    Payment Date
                  </label>
                  <input
                    type="date"
                    id="paymentDate"
                    value={paymentFormData.paymentDate}
                    onChange={(e) => setPaymentFormData({ ...paymentFormData, paymentDate: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-ocean-teal"
                    required
                  />
                </div>

                <div>
                  <label htmlFor="paymentMethod" className="block text-sm font-medium text-gray-700 mb-1">
                    Payment Method
                  </label>
                  <select
                    id="paymentMethod"
                    value={paymentFormData.paymentMethod}
                    onChange={(e) => setPaymentFormData({ ...paymentFormData, paymentMethod: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-ocean-teal"
                    required
                  >
                    <option value="bank_transfer">Bank Transfer</option>
                    <option value="cash">Cash</option>
                    <option value="cheque">Cheque</option>
                    <option value="card">Card</option>
                  </select>
                </div>

                <div>
                  <label htmlFor="paymentReference" className="block text-sm font-medium text-gray-700 mb-1">
                    Reference (optional)
                  </label>
                  <input
                    type="text"
                    id="paymentReference"
                    value={paymentFormData.reference}
                    onChange={(e) => setPaymentFormData({ ...paymentFormData, reference: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-ocean-teal"
                    placeholder="e.g., Transfer ID, Cheque number"
                  />
                </div>

                <div>
                  <label htmlFor="paymentNotes" className="block text-sm font-medium text-gray-700 mb-1">
                    Notes (optional)
                  </label>
                  <input
                    type="text"
                    id="paymentNotes"
                    value={paymentFormData.notes}
                    onChange={(e) => setPaymentFormData({ ...paymentFormData, notes: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-ocean-teal"
                    placeholder="Any additional notes"
                  />
                </div>
              </div>

              <div className="mt-6 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowPaymentModal(false)}
                  className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                  disabled={isSubmittingPayment}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-ocean-teal text-white rounded-md hover:bg-ocean-navy disabled:opacity-50"
                  disabled={isSubmittingPayment}
                >
                  {isSubmittingPayment ? 'Recording...' : 'Record Payment'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

export default MemberDetail
