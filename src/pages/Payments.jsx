import { useState, useEffect } from 'react'
import { useSearchParams, useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import PaymentForm from '../components/PaymentForm'
import { recordPayment, getAllPayments, deletePayment, formatPaymentMethod } from '../services/paymentsService'
import { getMemberById } from '../services/membersService'

const Payments = () => {
  const [showForm, setShowForm] = useState(false)
  const [payments, setPayments] = useState([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState(null)
  const [success, setSuccess] = useState(null)
  const [preSelectedMember, setPreSelectedMember] = useState(null)
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
      const result = await recordPayment(formData, currentUser.uid)
      setSuccess(`Payment recorded successfully! Receipt #${result.receiptNumber}`)
      setShowForm(false)
      setPreSelectedMember(null)
      await fetchPayments()

      // Clear success message after 5 seconds
      setTimeout(() => setSuccess(null), 5000)
    } catch (err) {
      console.error('Error recording payment:', err)
      setError('Failed to record payment. Please try again.')
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

  const handleCancel = () => {
    setShowForm(false)
    setPreSelectedMember(null)
    setError(null)
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
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            Record Payment
          </button>
        )}
      </div>

      {/* Success Message */}
      {success && (
        <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-md">
          <p className="text-green-800">{success}</p>
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
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Receipt #
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Date
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Member
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Amount
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Method
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Reference
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Recorded By
                  </th>
                  {canEdit && (
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  )}
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {payments.map(payment => (
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
                        className="text-blue-600 hover:text-blue-900"
                      >
                        {payment.memberName}
                      </button>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-green-600">
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
