import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useAuth } from '../contexts/AuthContext'
import { getAllApplications, deleteApplication, APPLICATION_STATUS } from '../services/applicationsService'

// SortIcon component moved outside to avoid re-creation during render
const SortIcon = ({ column, sortColumn, sortDirection }) => {
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

const Applications = () => {
  const { checkPermission, ROLES } = useAuth()
  const queryClient = useQueryClient()
  const [filteredApplications, setFilteredApplications] = useState([])
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [sortColumn, setSortColumn] = useState('submittedAt')
  const [sortDirection, setSortDirection] = useState('desc')

  // Fetch applications with React Query (cached)
  const { data: applications = [], isLoading } = useQuery({
    queryKey: ['applications'],
    queryFn: getAllApplications,
    staleTime: 2 * 60 * 1000,    // Consider data fresh for 2 minutes
    cacheTime: 5 * 60 * 1000,    // Keep in cache for 5 minutes
  })

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: deleteApplication,
    onSuccess: () => {
      // Invalidate and refetch applications
      queryClient.invalidateQueries({ queryKey: ['applications'] })
    }
  })

  useEffect(() => {
    const applyFilters = () => {
      let filtered = [...applications]

      // Apply search filter
      if (searchTerm) {
        const searchLower = searchTerm.toLowerCase()
        filtered = filtered.filter(app =>
          app.fullName?.toLowerCase().includes(searchLower) ||
          app.email?.toLowerCase().includes(searchLower)
        )
      }

      // Apply status filter
      if (statusFilter !== 'all') {
        filtered = filtered.filter(app => app.status === statusFilter)
      }

      setFilteredApplications(filtered)
    }

    applyFilters()
  }, [applications, searchTerm, statusFilter])

  // Check permission
  if (!checkPermission(ROLES.EDIT)) {
    return (
      <div>
        <h1 className="text-3xl font-bold text-gray-900 mb-6">Access Denied</h1>
        <p className="text-gray-600">You do not have permission to view applications.</p>
      </div>
    )
  }

  const handleDelete = (application) => {
    if (window.confirm(`Are you sure you want to delete the application from ${application.fullName}? This action cannot be undone.`)) {
      deleteMutation.mutate(application.id)
    }
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

  // Sort filtered applications based on current sort settings
  const sortedApplications = [...filteredApplications].sort((a, b) => {
    let aValue = a[sortColumn]
    let bValue = b[sortColumn]

    // Handle Firestore timestamps
    if (sortColumn === 'submittedAt' && aValue?.toDate) {
      aValue = aValue.toDate().getTime()
      bValue = bValue?.toDate ? bValue.toDate().getTime() : 0
    } else if (typeof aValue === 'string') {
      aValue = aValue.toLowerCase()
      bValue = (bValue || '').toLowerCase()
    }

    if (aValue < bValue) return sortDirection === 'asc' ? -1 : 1
    if (aValue > bValue) return sortDirection === 'asc' ? 1 : -1
    return 0
  })

  const getStatusBadge = (status) => {
    const statusConfig = {
      [APPLICATION_STATUS.SUBMITTED]: {
        bgColor: 'bg-gray-100',
        textColor: 'text-gray-800',
        label: 'Submitted'
      },
      [APPLICATION_STATUS.EMAIL_VERIFIED]: {
        bgColor: 'bg-blue-100',
        textColor: 'text-blue-800',
        label: 'Email Verified'
      },
      [APPLICATION_STATUS.APPROVED]: {
        bgColor: 'bg-ocean-seafoam bg-opacity-30',
        textColor: 'text-ocean-teal',
        label: 'Approved'
      },
      [APPLICATION_STATUS.REJECTED]: {
        bgColor: 'bg-red-100',
        textColor: 'text-red-800',
        label: 'Rejected'
      }
    }

    const config = statusConfig[status] || statusConfig[APPLICATION_STATUS.SUBMITTED]

    return (
      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${config.bgColor} ${config.textColor}`}>
        {config.label}
      </span>
    )
  }

  const formatDate = (timestamp) => {
    if (!timestamp) return 'N/A'
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp)
    return date.toLocaleDateString()
  }

  if (isLoading) {
    return (
      <div>
        <h1 className="text-3xl font-bold text-gray-900 mb-6">Membership Applications</h1>
        <p className="text-gray-600">Loading applications...</p>
      </div>
    )
  }

  return (
    <div>
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Membership Applications</h1>
          <p className="text-gray-600 mt-1">
            {filteredApplications.length} {filteredApplications.length === 1 ? 'application' : 'applications'}
            {searchTerm || statusFilter !== 'all' ? ' (filtered)' : ''}
          </p>
        </div>
        <Link
          to="/applications/add"
          className="px-4 py-2 bg-ocean-teal text-white rounded-md hover:bg-ocean-navy transition-colors"
        >
          Add Application (Admin)
        </Link>
      </div>

      {/* Filters */}
      <div className="bg-white shadow rounded-lg p-4 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label htmlFor="search" className="block text-sm font-medium text-gray-700 mb-1">
              Search
            </label>
            <input
              type="text"
              id="search"
              placeholder="Search by name or email..."
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
              <option value={APPLICATION_STATUS.SUBMITTED}>Submitted</option>
              <option value={APPLICATION_STATUS.EMAIL_VERIFIED}>Email Verified</option>
              <option value={APPLICATION_STATUS.APPROVED}>Approved</option>
              <option value={APPLICATION_STATUS.REJECTED}>Rejected</option>
            </select>
          </div>
        </div>
      </div>

      {/* Applications Table */}
      {filteredApplications.length === 0 ? (
        <div className="bg-white shadow rounded-lg p-6 text-center">
          <p className="text-gray-600">No applications found</p>
        </div>
      ) : (
        <div className="bg-white shadow rounded-lg overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th
                  onClick={() => handleSort('submittedAt')}
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                >
                  Submitted <SortIcon column="submittedAt" sortColumn={sortColumn} sortDirection={sortDirection} />
                </th>
                <th
                  onClick={() => handleSort('fullName')}
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                >
                  Name <SortIcon column="fullName" sortColumn={sortColumn} sortDirection={sortDirection} />
                </th>
                <th
                  onClick={() => handleSort('email')}
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                >
                  Email <SortIcon column="email" sortColumn={sortColumn} sortDirection={sortDirection} />
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Phone
                </th>
                <th
                  onClick={() => handleSort('membershipType')}
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                >
                  Type <SortIcon column="membershipType" sortColumn={sortColumn} sortDirection={sortDirection} />
                </th>
                <th
                  onClick={() => handleSort('status')}
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                >
                  Status <SortIcon column="status" sortColumn={sortColumn} sortDirection={sortDirection} />
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {sortedApplications.map(application => (
                <tr key={application.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {formatDate(application.submittedAt)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">{application.fullName}</div>
                    {application.title && (
                      <div className="text-sm text-gray-500">{application.title}</div>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {application.email}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {application.phoneMobile}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {application.membershipType}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {getStatusBadge(application.status)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    <div className="flex items-center gap-3">
                      <Link
                        to={`/applications/${application.id}`}
                        className="text-ocean-teal hover:text-ocean-navy"
                      >
                        View
                      </Link>
                      {checkPermission(ROLES.SUPER_ADMIN) && (
                        <button
                          onClick={() => handleDelete(application)}
                          className="text-red-600 hover:text-red-800"
                          title="Delete application"
                        >
                          Delete
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}

export default Applications
