import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { getMembersWithOutstandingBalance, getMemberStats, downloadMembersCSV, getAllMembers } from '../services/membersService'
import { getPaymentStats } from '../services/paymentsService'
import { getAllCategories } from '../services/membershipCategories'

const Reports = () => {
  const [outstandingMembers, setOutstandingMembers] = useState([])
  const [memberStats, setMemberStats] = useState(null)
  const [paymentStats, setPaymentStats] = useState(null)
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear())
  const [isLoading, setIsLoading] = useState(true)
  const [sortBy, setSortBy] = useState('balance') // 'balance' or 'name'
  const [categories, setCategories] = useState([])

  useEffect(() => {
    fetchReportData()
  }, [selectedYear])

  const fetchReportData = async () => {
    try {
      setIsLoading(true)
      const [outstanding, stats, payments, cats] = await Promise.all([
        getMembersWithOutstandingBalance(),
        getMemberStats(),
        getPaymentStats(selectedYear),
        getAllCategories()
      ])

      setOutstandingMembers(outstanding)
      setMemberStats(stats)
      setPaymentStats(payments)
      setCategories(cats)
    } catch (error) {
      console.error('Error fetching report data:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleExportOutstanding = () => {
    downloadMembersCSV(outstandingMembers, `outstanding-payments-${new Date().toISOString().split('T')[0]}.csv`)
  }

  const handleExportAllMembers = async () => {
    const allMembers = await getAllMembers()
    downloadMembersCSV(allMembers, `all-members-${new Date().toISOString().split('T')[0]}.csv`)
  }

  const getSortedMembers = () => {
    const sorted = [...outstandingMembers]
    if (sortBy === 'balance') {
      // Sort by most negative (owes most) to least negative
      return sorted.sort((a, b) => a.accountBalance - b.accountBalance)
    } else {
      return sorted.sort((a, b) => a.fullName.localeCompare(b.fullName))
    }
  }

  if (isLoading) {
    return (
      <div>
        <h1 className="text-3xl font-bold text-gray-900 mb-6">Reports</h1>
        <p className="text-gray-600">Loading reports...</p>
      </div>
    )
  }

  const sortedOutstanding = getSortedMembers()

  return (
    <div>
      <h1 className="text-3xl font-bold text-gray-900 mb-6">Reports</h1>
      <p className="text-gray-600 mb-6">Financial reports and member statistics</p>

      {/* Year Selector */}
      <div className="mb-6 flex items-center gap-4">
        <label htmlFor="year" className="text-sm font-medium text-gray-700">
          Report Year:
        </label>
        <select
          id="year"
          value={selectedYear}
          onChange={(e) => setSelectedYear(parseInt(e.target.value))}
          className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          {[2024, 2025, 2026].map(year => (
            <option key={year} value={year}>{year}</option>
          ))}
        </select>
      </div>

      {/* Financial Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
        <div className="bg-white shadow rounded-lg p-6">
          <p className="text-sm font-medium text-gray-600">Total Members</p>
          <p className="text-3xl font-bold text-gray-900 mt-2">{memberStats?.total || 0}</p>
          <p className="text-sm text-gray-500 mt-1">{memberStats?.active || 0} active</p>
        </div>

        <div className="bg-white shadow rounded-lg p-6">
          <p className="text-sm font-medium text-gray-600">Total Outstanding</p>
          <p className="text-3xl font-bold text-red-600 mt-2">
            ${(memberStats?.totalOutstanding || 0).toFixed(2)}
          </p>
          <p className="text-sm text-gray-500 mt-1">{outstandingMembers.length} members</p>
        </div>

        <div className="bg-white shadow rounded-lg p-6">
          <p className="text-sm font-medium text-gray-600">Payments Received ({selectedYear})</p>
          <p className="text-3xl font-bold text-green-600 mt-2">
            ${(paymentStats?.totalAmount || 0).toFixed(2)}
          </p>
          <p className="text-sm text-gray-500 mt-1">{paymentStats?.totalCount || 0} payments</p>
        </div>

        <div className="bg-white shadow rounded-lg p-6">
          <p className="text-sm font-medium text-gray-600">Payment Methods</p>
          <div className="mt-2 space-y-1">
            <p className="text-sm text-gray-700">
              Bank: ${(paymentStats?.byMethod.bank_transfer || 0).toFixed(2)}
            </p>
            <p className="text-sm text-gray-700">
              Cash: ${(paymentStats?.byMethod.cash || 0).toFixed(2)}
            </p>
          </div>
        </div>
      </div>

      {/* Outstanding Payments Report */}
      <div className="bg-white shadow rounded-lg p-6 mb-6">
        <div className="flex justify-between items-center mb-4">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">Outstanding Payments Report</h2>
            <p className="text-sm text-gray-600">Members who currently owe money</p>
          </div>
          <div className="flex gap-2">
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="balance">Sort by Amount Owed</option>
              <option value="name">Sort by Name</option>
            </select>
            <button
              onClick={handleExportOutstanding}
              className="px-4 py-2 border border-gray-300 rounded-md text-sm text-gray-700 hover:bg-gray-50"
            >
              Export CSV
            </button>
          </div>
        </div>

        {sortedOutstanding.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-gray-600">No outstanding payments - all members are paid up!</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Member Name
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Category
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Email
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Amount Owed
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {sortedOutstanding.map(member => {
                  const category = categories.find(c => c.id === member.membershipCategory)
                  const amountOwed = Math.abs(member.accountBalance)
                  return (
                    <tr key={member.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <Link
                          to={`/members/${member.id}`}
                          className="text-sm font-medium text-blue-600 hover:text-blue-900"
                        >
                          {member.fullName}
                        </Link>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {category?.name || member.membershipCategory}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {member.email}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-red-600">
                        ${amountOwed.toFixed(2)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        <Link
                          to={`/payments?member=${member.id}`}
                          className="text-blue-600 hover:text-blue-900"
                        >
                          Record Payment
                        </Link>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
              <tfoot className="bg-gray-50">
                <tr>
                  <td colSpan="3" className="px-6 py-4 text-sm font-semibold text-gray-900 text-right">
                    Total Outstanding:
                  </td>
                  <td className="px-6 py-4 text-sm font-bold text-red-600">
                    ${(memberStats?.totalOutstanding || 0).toFixed(2)}
                  </td>
                  <td></td>
                </tr>
              </tfoot>
            </table>
          </div>
        )}
      </div>

      {/* Monthly Payment Breakdown */}
      {paymentStats && Object.keys(paymentStats.byMonth).length > 0 && (
        <div className="bg-white shadow rounded-lg p-6 mb-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            Monthly Payment Collection ({selectedYear})
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {Object.entries(paymentStats.byMonth).sort().map(([month, amount]) => (
              <div key={month} className="border border-gray-200 rounded-lg p-3">
                <p className="text-xs font-medium text-gray-600">{month}</p>
                <p className="text-lg font-bold text-gray-900 mt-1">
                  ${amount.toFixed(2)}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Export Options */}
      <div className="bg-white shadow rounded-lg p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Export Options</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <button
            onClick={handleExportAllMembers}
            className="flex items-center justify-center px-4 py-3 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition"
          >
            <svg className="h-5 w-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            Export All Members (CSV)
          </button>
          <button
            onClick={handleExportOutstanding}
            disabled={outstandingMembers.length === 0}
            className="flex items-center justify-center px-4 py-3 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <svg className="h-5 w-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            Export Outstanding Payments (CSV)
          </button>
        </div>
      </div>
    </div>
  )
}

export default Reports
