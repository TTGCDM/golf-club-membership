import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { getMemberStats, getMembersWithOutstandingBalance } from '../services/membersService'
import { getAllPayments } from '../services/paymentsService'
import { getAllCategories, getCategoryById } from '../services/membershipCategories'

const Dashboard = () => {
  const { checkPermission, ROLES } = useAuth()
  const [stats, setStats] = useState(null)
  const [recentPayments, setRecentPayments] = useState([])
  const [outstandingMembers, setOutstandingMembers] = useState([])
  const [isLoading, setIsLoading] = useState(true)

  const categories = getAllCategories()
  const canEdit = checkPermission(ROLES.EDIT)

  useEffect(() => {
    fetchDashboardData()
  }, [])

  const fetchDashboardData = async () => {
    try {
      setIsLoading(true)

      // Fetch all data in parallel
      const [memberStats, payments, outstanding] = await Promise.all([
        getMemberStats(),
        getAllPayments(),
        getMembersWithOutstandingBalance()
      ])

      setStats(memberStats)
      setRecentPayments(payments.slice(0, 10)) // Last 10 payments
      setOutstandingMembers(outstanding.slice(0, 5)) // Top 5 outstanding
    } catch (error) {
      console.error('Error fetching dashboard data:', error)
    } finally {
      setIsLoading(false)
    }
  }

  if (isLoading) {
    return (
      <div>
        <h1 className="text-3xl font-bold text-gray-900 mb-6">Dashboard</h1>
        <p className="text-gray-600">Loading dashboard...</p>
      </div>
    )
  }

  return (
    <div>
      <h1 className="text-3xl font-bold text-gray-900 mb-6">Dashboard</h1>
      <p className="text-gray-600 mb-6">Welcome to Tea Tree Golf Club Membership Management System</p>

      {/* Key Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        {/* Total Members */}
        <div className="bg-white shadow rounded-lg p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Members</p>
              <p className="text-3xl font-bold text-gray-900 mt-2">{stats?.total || 0}</p>
              <p className="text-sm text-gray-500 mt-1">
                {stats?.active || 0} active, {stats?.inactive || 0} inactive
              </p>
            </div>
            <div className="h-12 w-12 bg-blue-100 rounded-full flex items-center justify-center">
              <svg className="h-6 w-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
              </svg>
            </div>
          </div>
        </div>

        {/* Total Outstanding */}
        <div className="bg-white shadow rounded-lg p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Outstanding</p>
              <p className="text-3xl font-bold text-red-600 mt-2">
                ${(stats?.totalOutstanding || 0).toFixed(2)}
              </p>
              <p className="text-sm text-gray-500 mt-1">
                {outstandingMembers.length} members owe money
              </p>
            </div>
            <div className="h-12 w-12 bg-red-100 rounded-full flex items-center justify-center">
              <svg className="h-6 w-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          </div>
        </div>

        {/* Recent Payments */}
        <div className="bg-white shadow rounded-lg p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Recent Payments</p>
              <p className="text-3xl font-bold text-green-600 mt-2">{recentPayments.length}</p>
              <p className="text-sm text-gray-500 mt-1">Last 10 transactions</p>
            </div>
            <div className="h-12 w-12 bg-green-100 rounded-full flex items-center justify-center">
              <svg className="h-6 w-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {/* Members by Category */}
        <div className="bg-white shadow rounded-lg p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Members by Category</h2>
          {Object.keys(stats?.byCategory || {}).length === 0 ? (
            <p className="text-gray-600">No members yet</p>
          ) : (
            <div className="space-y-3">
              {categories.map(category => {
                const count = stats?.byCategory[category.id] || 0
                const percentage = stats?.total ? (count / stats.total * 100).toFixed(0) : 0
                return (
                  <div key={category.id}>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-gray-700">{category.name}</span>
                      <span className="font-medium text-gray-900">{count}</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-blue-600 h-2 rounded-full"
                        style={{ width: `${percentage}%` }}
                      ></div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* Top Outstanding Balances */}
        <div className="bg-white shadow rounded-lg p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-semibold text-gray-900">Top Outstanding Balances</h2>
            <Link to="/reports" className="text-sm text-blue-600 hover:text-blue-900">
              View All
            </Link>
          </div>
          {outstandingMembers.length === 0 ? (
            <p className="text-gray-600">All members are paid up!</p>
          ) : (
            <div className="space-y-3">
              {outstandingMembers.map(member => (
                <div key={member.id} className="flex justify-between items-center p-3 bg-red-50 rounded-md">
                  <div>
                    <Link
                      to={`/members/${member.id}`}
                      className="text-sm font-medium text-gray-900 hover:text-blue-600"
                    >
                      {member.fullName}
                    </Link>
                    <p className="text-xs text-gray-500">
                      {getCategoryById(member.membershipCategory)?.name}
                    </p>
                  </div>
                  <span className="text-sm font-bold text-red-600">
                    ${(member.accountBalance || 0).toFixed(2)}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Recent Payments Activity */}
      <div className="bg-white shadow rounded-lg p-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-semibold text-gray-900">Recent Payments</h2>
          <Link to="/payments" className="text-sm text-blue-600 hover:text-blue-900">
            View All
          </Link>
        </div>
        {recentPayments.length === 0 ? (
          <p className="text-gray-600">No payments recorded yet</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Member</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Amount</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Receipt</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {recentPayments.map(payment => (
                  <tr key={payment.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
                      {payment.paymentDate}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm">
                      <Link
                        to={`/members/${payment.memberId}`}
                        className="text-blue-600 hover:text-blue-900"
                      >
                        {payment.memberName}
                      </Link>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-green-600">
                      ${payment.amount.toFixed(2)}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">
                      {payment.receiptNumber}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Quick Actions */}
      <div className={`mt-6 grid grid-cols-1 ${canEdit ? 'md:grid-cols-3' : 'md:grid-cols-1'} gap-4`}>
        {canEdit && (
          <Link
            to="/members/add"
            className="flex items-center justify-center px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
          >
            <svg className="h-5 w-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Add New Member
          </Link>
        )}
        {canEdit && (
          <Link
            to="/payments"
            className="flex items-center justify-center px-4 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition"
          >
            <svg className="h-5 w-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            Record Payment
          </Link>
        )}
        <Link
          to="/reports"
          className="flex items-center justify-center px-4 py-3 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition"
        >
          <svg className="h-5 w-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          View Reports
        </Link>
      </div>
    </div>
  )
}

export default Dashboard
