import { useState, useEffect } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { getMemberById } from '../services/membersService'
import { getCategoryById, calculateAge } from '../services/membershipCategories'
import { getPaymentsByMember, formatPaymentMethod } from '../services/paymentsService'

const MemberDetail = () => {
  const { checkPermission, ROLES } = useAuth()
  const [member, setMember] = useState(null)
  const [payments, setPayments] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState(null)
  const { id } = useParams()
  const navigate = useNavigate()

  const canEdit = checkPermission(ROLES.EDIT)

  useEffect(() => {
    const fetchData = async () => {
      try {
        const memberData = await getMemberById(id)
        setMember(memberData)

        // Fetch payment history
        const paymentData = await getPaymentsByMember(id)
        setPayments(paymentData)
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
        <Link to="/members" className="text-blue-600 hover:text-blue-900 mt-4 inline-block">
          Back to Members
        </Link>
      </div>
    )
  }

  const category = getCategoryById(member.membershipCategory)
  const age = member.dateOfBirth ? calculateAge(member.dateOfBirth) : null

  const getBalanceColor = (balance) => {
    if (balance > 0) return 'text-green-600' // Positive = credit
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
                <Link
                  to={`/payments?member=${id}`}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                >
                  Record Payment
                </Link>
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
                  <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                    member.status === 'active'
                      ? 'bg-green-100 text-green-800'
                      : 'bg-gray-100 text-gray-800'
                  }`}>
                    {member.status}
                  </span>
                </dd>
              </div>
            </dl>
          </div>
        </div>

        {/* Payment History */}
        <div className="lg:col-span-3">
          <div className="bg-white shadow rounded-lg p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Payment History</h3>

            {payments.length === 0 ? (
              <p className="text-gray-600">No payments recorded yet</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Receipt #
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Date
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Amount
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Method
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Reference
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Notes
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {payments.map(payment => (
                      <tr key={payment.id}>
                        <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-gray-900">
                          {payment.receiptNumber}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
                          {payment.paymentDate}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-green-600">
                          ${payment.amount.toFixed(2)}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
                          {formatPaymentMethod(payment.paymentMethod)}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-500">
                          {payment.reference || '-'}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-500">
                          {payment.notes || '-'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>

                <div className="mt-4 pt-4 border-t border-gray-200">
                  <div className="flex justify-between items-center">
                    <p className="text-sm text-gray-600">
                      Total Payments: <span className="font-medium">{payments.length}</span>
                    </p>
                    <p className="text-sm text-gray-600">
                      Total Amount: <span className="font-medium text-green-600">
                        ${payments.reduce((sum, p) => sum + p.amount, 0).toFixed(2)}
                      </span>
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default MemberDetail
