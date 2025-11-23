import { useState, useEffect } from 'react'
import { useSearchParams, useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import PaymentForm from '../components/PaymentForm'
import { recordPayment, getAllPayments, deletePayment, updatePayment, formatPaymentMethod, generatePDFReceipt } from '../services/paymentsService'
import { getMemberById } from '../services/membersService'

const Payments = () => {
  const [showForm, setShowForm] = useState(false)
  const [payments, setPayments] = useState([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState(null)
  const [success, setSuccess] = useState(null)
  const [preSelectedMember, setPreSelectedMember] = useState(null)
  const [editingPayment, setEditingPayment] = useState(null)
  const [sortColumn, setSortColumn] = useState('paymentDate')
  const [sortDirection, setSortDirection] = useState('desc')
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const { currentUser, checkPermission, ROLES } = useAuth()

  const canEdit = checkPermission(ROLES.EDIT)

  useEffect(() => {
    fetchPayments()

    // Check if member ID is in URL
    const memberId = searchParams.get('member')
    if (memberId) {
      loadPreSelectedMember(memberId)
      setShowForm(true)
    }
  }, [searchParams])

  const loadPreSelectedMember = async (memberId) => {
    try {
      const member = await getMemberById(memberId)
      setPreSelectedMember(member)
    } catch (error) {
      console.error('Error loading member:', error)
    }
  }

  const fetchPayments = async () => {
    try {
      const data = await getAllPayments()
      setPayments(data)
    } catch (error) {
      console.error('Error fetching payments:', error)
    }
  }

  const handleSubmit = async (formData) => {
    setIsLoading(true)
    setError(null)
    setSuccess(null)

    try {
      if (editingPayment) {
        // Update existing payment
        await updatePayment(editingPayment.id, formData, currentUser.uid)
        setSuccess(`Payment updated successfully!`)
      } else {
        // Create new payment
        const result = await recordPayment(formData, currentUser.uid)
        setSuccess(`Payment recorded successfully! Receipt #${result.receiptNumber}`)
      }

      setShowForm(false)
      setPreSelectedMember(null)
      setEditingPayment(null)
      await fetchPayments()

      // Clear success message after 5 seconds
      setTimeout(() => setSuccess(null), 5000)
    } catch (err) {
      console.error('Error saving payment:', err)
      setError(`Failed to ${editingPayment ? 'update' : 'record'} payment. Please try again.`)
    } finally {
      setIsLoading(false)
    }
  }

  const handleDelete = async (paymentId) => {
    if (!confirm('Are you sure you want to delete this payment? This will adjust the member\'s account balance.')) {
      return
    }

    try {
      await deletePayment(paymentId)
      setSuccess('Payment deleted successfully')
      await fetchPayments()
      setTimeout(() => setSuccess(null), 5000)
    } catch (error) {
      console.error('Error deleting payment:', error)
      setError('Failed to delete payment')
    }
  }

  const handleEdit = (payment) => {
    setEditingPayment(payment)
    setShowForm(true)
    setError(null)
  }

  const handlePrintReceipt = async (payment) => {
    try {
      await generatePDFReceipt(payment)
      setSuccess('Receipt generated successfully!')
      setTimeout(() => setSuccess(null), 3000)
    } catch (error) {
      console.error('Error generating receipt:', error)
      setError('Failed to generate receipt')
      setTimeout(() => setError(null), 3000)
    }
  }

  const handleCancel = () => {
    setShowForm(false)
    setPreSelectedMember(null)
    setEditingPayment(null)
    setError(null)
  }

  const handleSort = (column) => {
    if (sortColumn === column) {
      // Toggle direction if clicking the same column
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc')
    } else {
      // Set new column and default to descending
      setSortColumn(column)
      setSortDirection('desc')
    }
  }

  // Sort payments based on current sort settings
  const sortedPayments = [...payments].sort((a, b) => {
    let aValue = a[sortColumn]
    let bValue = b[sortColumn]

    // Handle different data types
    if (sortColumn === 'amount') {
      aValue = parseFloat(aValue) || 0
      bValue = parseFloat(bValue) || 0
    } else if (sortColumn === 'paymentDate') {
      aValue = new Date(aValue).getTime()
      bValue = new Date(bValue).getTime()
    } else if (typeof aValue === 'string') {
      aValue = aValue.toLowerCase()
      bValue = bValue.toLowerCase()
    }

    if (aValue < bValue) return sortDirection === 'asc' ? -1 : 1
    if (aValue > bValue) return sortDirection === 'asc' ? 1 : -1
    return 0
  })

  const SortIcon = ({ column }) => {
    if (sortColumn !== column) {
      return (
        <svg className="w-4 h-4 text-gray-400 ml-1 inline" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4" />
        </svg>
      )
    }
    if (sortDirection === 'asc') {
      return (
        <svg className="w-4 h-4 text-ocean-teal ml-1 inline" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
        </svg>
      )
    }
    return (
      <svg className="w-4 h-4 text-ocean-teal ml-1 inline" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
      </svg>
    )
  }

  return (
    <div>
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Payments</h1>
          <p className="text-gray-600 mt-1">Record and manage member payments</p>
        </div>
        {!showForm && canEdit && (
          <button
            onClick={() => setShowForm(true)}
            className="px-4 py-2 bg-ocean-teal text-white rounded-md hover:bg-ocean-navy"
          >
            Record Payment
          </button>
        )}
      </div>

      {/* Success Message */}
      {success && (
        <div className="mb-4 p-4 bg-ocean-seafoam bg-opacity-20 border border-ocean-teal rounded-md">
          <p className="text-ocean-teal">{success}</p>
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-md">
          <p className="text-red-800">{error}</p>
        </div>
      )}

      {/* Payment Form */}
      {showForm && (
        <div className="mb-6">
          <PaymentForm
            payment={editingPayment}
            onSubmit={handleSubmit}
            onCancel={handleCancel}
            isLoading={isLoading}
            preSelectedMember={preSelectedMember}
          />
        </div>
      )}

      {/* Recent Payments */}
      <div className="bg-white shadow rounded-lg overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">Recent Payments</h2>
        </div>

        {payments.length === 0 ? (
          <div className="p-6 text-center">
            <p className="text-gray-600">No payments recorded yet</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th
                    onClick={() => handleSort('receiptNumber')}
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                  >
                    Receipt # <SortIcon column="receiptNumber" />
                  </th>
                  <th
                    onClick={() => handleSort('paymentDate')}
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                  >
                    Date <SortIcon column="paymentDate" />
                  </th>
                  <th
                    onClick={() => handleSort('memberName')}
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                  >
                    Member <SortIcon column="memberName" />
                  </th>
                  <th
                    onClick={() => handleSort('amount')}
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                  >
                    Amount <SortIcon column="amount" />
                  </th>
                  <th
                    onClick={() => handleSort('paymentMethod')}
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                  >
                    Method <SortIcon column="paymentMethod" />
                  </th>
                  <th
                    onClick={() => handleSort('reference')}
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                  >
                    Reference <SortIcon column="reference" />
                  </th>
                  <th
                    onClick={() => handleSort('recordedBy')}
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                  >
                    Recorded By <SortIcon column="recordedBy" />
                  </th>
                  {canEdit && (
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  )}
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {sortedPayments.map(payment => (
                  <tr key={payment.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {payment.receiptNumber}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {payment.paymentDate}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      <button
                        onClick={() => navigate(`/members/${payment.memberId}`)}
                        className="text-ocean-teal hover:text-ocean-navy"
                      >
                        {payment.memberName}
                      </button>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-ocean-teal">
                      ${payment.amount.toFixed(2)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {formatPaymentMethod(payment.paymentMethod)}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500">
                      {payment.reference || '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {payment.recordedBy}
                    </td>
                    {canEdit && (
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        <button
                          onClick={() => handlePrintReceipt(payment)}
                          className="text-ocean-teal hover:text-ocean-navy mr-4"
                          title="Print Receipt"
                        >
                          Print
                        </button>
                        <button
                          onClick={() => handleEdit(payment)}
                          className="text-ocean-teal hover:text-ocean-navy mr-4"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleDelete(payment.id)}
                          className="text-red-600 hover:text-red-900"
                        >
                          Delete
                        </button>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}

export default Payments
