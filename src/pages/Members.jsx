import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { useAuth } from '../contexts/AuthContext'
import { downloadMembersCSV, getAllMembers } from '../services/membersService'
import { getAllCategories } from '../services/membershipCategories'

const Members = () => {
  const { checkPermission, ROLES } = useAuth()
  const [filteredMembers, setFilteredMembers] = useState([])
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [categoryFilter, setCategoryFilter] = useState('all')
  const [balanceFilter, setBalanceFilter] = useState('all')
  const [sortColumn, setSortColumn] = useState('fullName')
  const [sortDirection, setSortDirection] = useState('asc')

  const canEdit = checkPermission(ROLES.EDIT)

  // Fetch members with React Query (cached)
  const { data: members = [], isLoading: membersLoading } = useQuery({
    queryKey: ['members'],
    queryFn: getAllMembers,
    staleTime: 5 * 60 * 1000,    // Consider data fresh for 5 minutes
    cacheTime: 10 * 60 * 1000,   // Keep in cache for 10 minutes
  })

  // Fetch categories with React Query (cached)
  const { data: categories = [], isLoading: categoriesLoading } = useQuery({
    queryKey: ['categories'],
    queryFn: getAllCategories,
    staleTime: 10 * 60 * 1000,   // Categories change rarely, fresh for 10 minutes
    cacheTime: 30 * 60 * 1000,   // Keep in cache for 30 minutes
  })

  const isLoading = membersLoading || categoriesLoading

  useEffect(() => {
    const applyFilters = () => {
      let filtered = [...members]

      // Apply search filter
      if (searchTerm) {
        const searchLower = searchTerm.toLowerCase()
        filtered = filtered.filter(member =>
          member.fullName?.toLowerCase().includes(searchLower) ||
          member.email?.toLowerCase().includes(searchLower) ||
          member.golfAustraliaId?.toLowerCase().includes(searchLower)
        )
      }

      // Apply status filter
      if (statusFilter !== 'all') {
        filtered = filtered.filter(member => member.status === statusFilter)
      }

      // Apply category filter
      if (categoryFilter !== 'all') {
        filtered = filtered.filter(member => member.membershipCategory === categoryFilter)
      }

      // Apply balance filter
      if (balanceFilter === 'positive') {
        filtered = filtered.filter(member => (member.accountBalance || 0) > 0)
      } else if (balanceFilter === 'negative') {
        filtered = filtered.filter(member => (member.accountBalance || 0) < 0)
      } else if (balanceFilter === 'zero') {
        filtered = filtered.filter(member => (member.accountBalance || 0) === 0)
      }

      setFilteredMembers(filtered)
    }

    applyFilters()
  }, [members, searchTerm, statusFilter, categoryFilter, balanceFilter])

  const handleExportCSV = () => {
    downloadMembersCSV(filteredMembers, `members-${new Date().toISOString().split('T')[0]}.csv`)
  }

  const getBalanceColor = (balance) => {
    if (balance > 0) return 'text-ocean-teal' // Positive = credit
    if (balance < 0) return 'text-red-600'   // Negative = owes money
    return 'text-gray-900'
  }

  const handleSort = (column) => {
    if (sortColumn === column) {
      // Toggle direction if clicking the same column
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc')
    } else {
      // Set new column and default to ascending
      setSortColumn(column)
      setSortDirection('asc')
    }
  }

  // Sort filtered members based on current sort settings
  const sortedMembers = [...filteredMembers].sort((a, b) => {
    let aValue = a[sortColumn]
    let bValue = b[sortColumn]

    // Handle different data types
    if (sortColumn === 'accountBalance') {
      aValue = parseFloat(aValue) || 0
      bValue = parseFloat(bValue) || 0
    } else if (typeof aValue === 'string') {
      aValue = aValue.toLowerCase()
      bValue = (bValue || '').toLowerCase()
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

  if (isLoading) {
    return (
      <div>
        <h1 className="text-3xl font-bold text-gray-900 mb-6">Members</h1>
        <p className="text-gray-600">Loading members...</p>
      </div>
    )
  }

  return (
    <div>
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Members</h1>
          <p className="text-gray-600 mt-1">
            {filteredMembers.length} {filteredMembers.length === 1 ? 'member' : 'members'}
            {searchTerm || statusFilter !== 'all' || categoryFilter !== 'all' || balanceFilter !== 'all' ? ' (filtered)' : ''}
          </p>
        </div>
        {canEdit && (
          <Link
            to="/members/add"
            className="px-4 py-2 bg-ocean-teal text-white rounded-md hover:bg-ocean-navy"
          >
            Add Member
          </Link>
        )}
      </div>

      {/* Filters */}
      <div className="bg-white shadow rounded-lg p-4 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          <div className="md:col-span-2">
            <label htmlFor="search" className="block text-sm font-medium text-gray-700 mb-1">
              Search
            </label>
            <input
              type="text"
              id="search"
              placeholder="Search by name, email, or Golf Australia ID..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-ocean-teal"
            />
          </div>

          <div>
            <label htmlFor="status" className="block text-sm font-medium text-gray-700 mb-1">
              Status
            </label>
            <select
              id="status"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-ocean-teal"
            >
              <option value="all">All Status</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
          </div>

          <div>
            <label htmlFor="category" className="block text-sm font-medium text-gray-700 mb-1">
              Category
            </label>
            <select
              id="category"
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-ocean-teal"
            >
              <option value="all">All Categories</option>
              {categories.map(cat => (
                <option key={cat.id} value={cat.id}>{cat.name}</option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="balance" className="block text-sm font-medium text-gray-700 mb-1">
              Balance
            </label>
            <select
              id="balance"
              value={balanceFilter}
              onChange={(e) => setBalanceFilter(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-ocean-teal"
            >
              <option value="all">All Balances</option>
              <option value="positive">Positive (Credit)</option>
              <option value="negative">Negative (Owing)</option>
              <option value="zero">Zero Balance</option>
            </select>
          </div>
        </div>

        <div className="mt-4 flex justify-end">
          <button
            onClick={handleExportCSV}
            className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
          >
            Export to CSV
          </button>
        </div>
      </div>

      {/* Members Table */}
      {filteredMembers.length === 0 ? (
        <div className="bg-white shadow rounded-lg p-6 text-center">
          <p className="text-gray-600">No members found</p>
        </div>
      ) : (
        <div className="bg-white shadow rounded-lg overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th
                  onClick={() => handleSort('fullName')}
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                >
                  Name <SortIcon column="fullName" />
                </th>
                <th
                  onClick={() => handleSort('email')}
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                >
                  Email <SortIcon column="email" />
                </th>
                <th
                  onClick={() => handleSort('membershipCategory')}
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                >
                  Category <SortIcon column="membershipCategory" />
                </th>
                <th
                  onClick={() => handleSort('status')}
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                >
                  Status <SortIcon column="status" />
                </th>
                <th
                  onClick={() => handleSort('accountBalance')}
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                >
                  Balance <SortIcon column="accountBalance" />
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {sortedMembers.map(member => {
                const category = categories.find(c => c.id === member.membershipCategory)
                return (
                  <tr key={member.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">{member.fullName}</div>
                      {member.golfAustraliaId && (
                        <div className="text-sm text-gray-500">GA: {member.golfAustraliaId}</div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {member.email}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {category?.name || member.membershipCategory}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${member.status === 'active'
                        ? 'bg-ocean-seafoam bg-opacity-30 text-ocean-teal'
                        : 'bg-gray-100 text-gray-800'
                        }`}>
                        {member.status}
                      </span>
                    </td>
                    <td className={`px-6 py-4 whitespace-nowrap text-sm font-medium ${getBalanceColor(member.accountBalance || 0)}`}>
                      ${(member.accountBalance || 0).toFixed(2)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      <Link
                        to={`/members/${member.id}`}
                        className="text-ocean-teal hover:text-ocean-navy mr-3"
                      >
                        View
                      </Link>
                      {canEdit && (
                        <Link
                          to={`/members/${member.id}/edit`}
                          className="text-ocean-teal hover:text-ocean-navy"
                        >
                          Edit
                        </Link>
                      )}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}

export default Members
