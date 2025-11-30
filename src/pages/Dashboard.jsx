import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { useAuth } from '../contexts/AuthContext'
import { getAllMembers, calculateMemberStats } from '../services/membersService'
import { getAllCategories } from '../services/membershipCategories'
import { getAllPayments } from '../services/paymentsService'

const Dashboard = () => {
  const { checkPermission, ROLES } = useAuth()
  const canEdit = checkPermission(ROLES.EDIT)
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear())

  // Fetch members with React Query (shared cache with Members page)
  const { data: members = [], isLoading: membersLoading } = useQuery({
    queryKey: ['members'],
    queryFn: getAllMembers,
    staleTime: 5 * 60 * 1000,    // Consider data fresh for 5 minutes
    cacheTime: 10 * 60 * 1000,   // Keep in cache for 10 minutes
    refetchOnWindowFocus: true,   // Auto-refresh when user returns to tab
  })

  // Fetch payments with React Query (shared cache with Payments page)
  const { data: payments = [], isLoading: paymentsLoading } = useQuery({
    queryKey: ['payments'],
    queryFn: getAllPayments,
    staleTime: 5 * 60 * 1000,    // Consider data fresh for 5 minutes
    cacheTime: 10 * 60 * 1000,   // Keep in cache for 10 minutes
    refetchOnWindowFocus: true,   // Auto-refresh when user returns to tab
  })

  // Fetch categories with React Query (shared cache)
  const { data: categories = [], isLoading: categoriesLoading } = useQuery({
    queryKey: ['categories'],
    queryFn: getAllCategories,
    staleTime: 10 * 60 * 1000,   // Categories change rarely, fresh for 10 minutes
    cacheTime: 30 * 60 * 1000,   // Keep in cache for 30 minutes
  })

  // Calculate stats from members data
  const stats = calculateMemberStats(members)

  // Get ALL members who owe money (for accurate count)
  const allMembersWithDebt = members
    .filter(m => m.status === 'active' && m.accountBalance < 0)

  // Filter payments by selected year
  const paymentsForYear = payments.filter(payment => {
    if (!payment.paymentDate) return false
    const paymentYear = new Date(payment.paymentDate).getFullYear()
    return paymentYear === selectedYear
  })

  // Calculate total paid for selected year
  const totalPaidForYear = paymentsForYear.reduce((sum, payment) => sum + (payment.amount || 0), 0)

  // Get available years from payments
  const availableYears = [...new Set(payments.map(p => {
    if (!p.paymentDate) return null
    return new Date(p.paymentDate).getFullYear()
  }).filter(year => year !== null))].sort((a, b) => b - a)

  // Add current year if not in list
  const currentYear = new Date().getFullYear()
  if (!availableYears.includes(currentYear)) {
    availableYears.unshift(currentYear)
  }

  const isLoading = membersLoading || paymentsLoading || categoriesLoading

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
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-600 mt-1">Welcome to Tea Tree Golf Club Membership Management System</p>
      </div>

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
            <div className="h-12 w-12 bg-ocean-seafoam bg-opacity-30 rounded-full flex items-center justify-center">
              <svg className="h-6 w-6 text-ocean-teal" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
                {allMembersWithDebt.length} members owe money
              </p>
            </div>
            <div className="h-12 w-12 bg-red-100 rounded-full flex items-center justify-center">
              <svg className="h-6 w-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          </div>
        </div>

        {/* Active Members */}
        <div className="bg-white shadow rounded-lg p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Active Members</p>
              <p className="text-3xl font-bold text-ocean-teal mt-2">{stats?.active || 0}</p>
              <p className="text-sm text-gray-500 mt-1">
                {stats?.total ? ((stats.active / stats.total * 100).toFixed(1)) : 0}% of total
              </p>
            </div>
            <div className="h-12 w-12 bg-ocean-seafoam bg-opacity-30 rounded-full flex items-center justify-center">
              <svg className="h-6 w-6 text-ocean-teal" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
                        className="bg-ocean-teal h-2 rounded-full"
                        style={{ width: `${percentage}%` }}
                      ></div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* Paid vs Unpaid Overview */}
        <div className="bg-white shadow rounded-lg p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-semibold text-gray-900">Payment Status Overview</h2>
            <div className="flex items-center gap-3">
              <select
                value={selectedYear}
                onChange={(e) => setSelectedYear(Number(e.target.value))}
                className="px-3 py-1 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-ocean-teal"
              >
                {availableYears.map(year => (
                  <option key={year} value={year}>{year}</option>
                ))}
              </select>
              <Link to="/reports" className="text-sm text-ocean-teal hover:text-ocean-navy">
                View Details
              </Link>
            </div>
          </div>
          {(() => {
            // Current balance status (not year-specific)
            const membersWithDebt = allMembersWithDebt.length || 0
            const paidUpMembers = stats?.active - membersWithDebt || 0
            const totalActive = stats?.active || 0

            const paidPercentage = totalActive > 0 ? (paidUpMembers / totalActive * 100).toFixed(1) : 0
            const outstandingPercentage = totalActive > 0 ? (membersWithDebt / totalActive * 100).toFixed(1) : 0

            return (
              <div className="space-y-6">
                {/* Summary Cards */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-ocean-seafoam bg-opacity-20 rounded-lg p-4 border border-ocean-teal">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium text-ocean-teal">Paid Up</span>
                      <svg className="h-5 w-5 text-ocean-teal" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                    <p className="text-3xl font-bold text-ocean-teal">{paidUpMembers}</p>
                    <p className="text-xs text-ocean-teal mt-1">{paidPercentage}% of active members</p>
                    <p className="text-sm font-medium text-ocean-teal mt-2">
                      ${totalPaidForYear.toFixed(2)} received in {selectedYear}
                    </p>
                  </div>
                  <div className="bg-red-50 rounded-lg p-4 border border-red-200">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium text-red-700">Outstanding</span>
                      <svg className="h-5 w-5 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                    <p className="text-3xl font-bold text-red-700">{membersWithDebt}</p>
                    <p className="text-xs text-red-600 mt-1">{outstandingPercentage}% of active members</p>
                    <p className="text-sm font-medium text-red-700 mt-2">
                      ${(stats?.totalOutstanding || 0).toFixed(2)} currently owed
                    </p>
                  </div>
                </div>

                {/* Visual Bar Chart */}
                <div>
                  <div className="flex items-center justify-between text-sm text-gray-600 mb-2">
                    <span>Current Payment Status</span>
                    <span>{totalActive} active members</span>
                  </div>
                  <div className="w-full h-8 bg-gray-200 rounded-full overflow-hidden flex">
                    {paidUpMembers > 0 && (
                      <div
                        className="bg-ocean-teal flex items-center justify-center text-white text-xs font-medium"
                        style={{ width: `${paidPercentage}%` }}
                      >
                        {paidPercentage > 15 && `${paidPercentage}%`}
                      </div>
                    )}
                    {membersWithDebt > 0 && (
                      <div
                        className="bg-red-500 flex items-center justify-center text-white text-xs font-medium"
                        style={{ width: `${outstandingPercentage}%` }}
                      >
                        {outstandingPercentage > 15 && `${outstandingPercentage}%`}
                      </div>
                    )}
                  </div>
                  <div className="flex justify-between mt-2 text-xs text-gray-500">
                    <span className="flex items-center">
                      <span className="w-3 h-3 bg-ocean-teal rounded-full mr-1"></span>
                      Paid Up
                    </span>
                    <span className="flex items-center">
                      <span className="w-3 h-3 bg-red-500 rounded-full mr-1"></span>
                      Outstanding
                    </span>
                  </div>
                </div>

                {/* Quick Stats */}
                <div className="pt-4 border-t border-gray-200 space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Total Received in {selectedYear}:</span>
                    <span className="font-bold text-ocean-teal">${totalPaidForYear.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Currently Outstanding (all time):</span>
                    <span className="font-bold text-red-600">${(stats?.totalOutstanding || 0).toFixed(2)}</span>
                  </div>
                </div>
              </div>
            )
          })()}
        </div>
      </div>

      {/* Active vs Inactive Members */}
      <div className="bg-white shadow rounded-lg p-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-semibold text-gray-900">Member Status Overview</h2>
          <Link to="/members" className="text-sm text-ocean-teal hover:text-ocean-navy">
            View All Members
          </Link>
        </div>
        {(() => {
          const activeMembers = stats?.active || 0
          const inactiveMembers = stats?.inactive || 0
          const totalMembers = stats?.total || 0
          const activePercentage = totalMembers > 0 ? (activeMembers / totalMembers * 100).toFixed(1) : 0
          const inactivePercentage = totalMembers > 0 ? (inactiveMembers / totalMembers * 100).toFixed(1) : 0

          return (
            <div className="space-y-6">
              {/* Summary Cards */}
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-ocean-seafoam bg-opacity-20 rounded-lg p-4 border border-ocean-teal">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-ocean-teal">Active Members</span>
                    <svg className="h-5 w-5 text-ocean-teal" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                    </svg>
                  </div>
                  <p className="text-3xl font-bold text-ocean-teal">{activeMembers}</p>
                  <p className="text-xs text-ocean-teal mt-1">{activePercentage}% of total members</p>
                </div>
                <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-gray-700">Inactive Members</span>
                    <svg className="h-5 w-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
                    </svg>
                  </div>
                  <p className="text-3xl font-bold text-gray-700">{inactiveMembers}</p>
                  <p className="text-xs text-gray-600 mt-1">{inactivePercentage}% of total members</p>
                </div>
              </div>

              {/* Visual Bar Chart */}
              <div>
                <div className="flex items-center justify-between text-sm text-gray-600 mb-2">
                  <span>Membership Distribution</span>
                  <span>{totalMembers} total members</span>
                </div>
                <div className="w-full h-8 bg-gray-200 rounded-full overflow-hidden flex">
                  {activeMembers > 0 && (
                    <div
                      className="bg-ocean-teal flex items-center justify-center text-white text-xs font-medium"
                      style={{ width: `${activePercentage}%` }}
                    >
                      {activePercentage > 15 && `${activePercentage}%`}
                    </div>
                  )}
                  {inactiveMembers > 0 && (
                    <div
                      className="bg-gray-400 flex items-center justify-center text-white text-xs font-medium"
                      style={{ width: `${inactivePercentage}%` }}
                    >
                      {inactivePercentage > 15 && `${inactivePercentage}%`}
                    </div>
                  )}
                </div>
                <div className="flex justify-between mt-2 text-xs text-gray-500">
                  <span className="flex items-center">
                    <span className="w-3 h-3 bg-ocean-teal rounded-full mr-1"></span>
                    Active
                  </span>
                  <span className="flex items-center">
                    <span className="w-3 h-3 bg-gray-400 rounded-full mr-1"></span>
                    Inactive
                  </span>
                </div>
              </div>

              {/* Quick Stats */}
              <div className="pt-4 border-t border-gray-200 grid grid-cols-2 gap-4 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Active Rate:</span>
                  <span className="font-bold text-ocean-teal">{activePercentage}%</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Total Members:</span>
                  <span className="font-bold text-gray-900">{totalMembers}</span>
                </div>
              </div>
            </div>
          )
        })()}
      </div>

      {/* Quick Actions */}
      <div className={`mt-6 grid grid-cols-1 ${canEdit ? 'md:grid-cols-3' : 'md:grid-cols-1'} gap-4`}>
        {canEdit && (
          <Link
            to="/members/add"
            className="flex items-center justify-center px-4 py-3 bg-ocean-teal text-white rounded-lg hover:bg-ocean-navy transition"
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
            className="flex items-center justify-center px-4 py-3 bg-ocean-teal text-white rounded-lg hover:bg-ocean-navy transition"
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
