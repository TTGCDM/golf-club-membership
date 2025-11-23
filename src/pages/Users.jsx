import { useState, useEffect } from 'react'
import { useAuth } from '../contexts/AuthContext'
import {
  getAllUsers,
  getPendingUsers,
  approveUser,
  updateUserRole,
  deactivateUser,
  reactivateUser,
  canManageUser,
  ROLES,
  ROLE_NAMES,
  USER_STATUS
} from '../services/usersService'

const Users = () => {
  const [users, setUsers] = useState([])
  const [pendingUsers, setPendingUsers] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState(null)
  const [success, setSuccess] = useState(null)
  const { userRole, currentUser } = useAuth()

  useEffect(() => {
    fetchUsers()
  }, [])

  const fetchUsers = async () => {
    try {
      setIsLoading(true)
      const [allUsers, pending] = await Promise.all([
        getAllUsers(),
        getPendingUsers()
      ])

      setUsers(allUsers.filter(u => u.status !== USER_STATUS.PENDING))
      setPendingUsers(pending)
    } catch (err) {
      console.error('Error fetching users:', err)
      setError('Failed to load users')
    } finally {
      setIsLoading(false)
    }
  }

  const handleApprove = async (uid, role) => {
    try {
      await approveUser(uid, role)
      setSuccess('User approved successfully')
      await fetchUsers()
      setTimeout(() => setSuccess(null), 3000)
    } catch (err) {
      console.error('Error approving user:', err)
      setError('Failed to approve user')
    }
  }

  const handleChangeRole = async (uid, newRole) => {
    try {
      await updateUserRole(uid, newRole)
      setSuccess('User role updated successfully')
      await fetchUsers()
      setTimeout(() => setSuccess(null), 3000)
    } catch (err) {
      console.error('Error updating role:', err)
      setError('Failed to update role')
    }
  }

  const handleDeactivate = async (uid) => {
    if (!confirm('Are you sure you want to deactivate this user?')) {
      return
    }

    try {
      await deactivateUser(uid)
      setSuccess('User deactivated successfully')
      await fetchUsers()
      setTimeout(() => setSuccess(null), 3000)
    } catch (err) {
      console.error('Error deactivating user:', err)
      setError('Failed to deactivate user')
    }
  }

  const handleReactivate = async (uid) => {
    try {
      await reactivateUser(uid)
      setSuccess('User reactivated successfully')
      await fetchUsers()
      setTimeout(() => setSuccess(null), 3000)
    } catch (err) {
      console.error('Error reactivating user:', err)
      setError('Failed to reactivate user')
    }
  }

  const getRoleBadgeColor = (role) => {
    switch (role) {
      case ROLES.SUPER_ADMIN:
        return 'bg-red-100 text-red-800'
      case ROLES.ADMIN:
        return 'bg-orange-100 text-orange-800'
      case ROLES.EDIT:
        return 'bg-ocean-seafoam bg-opacity-30 text-ocean-teal'
      case ROLES.VIEW:
        return 'bg-blue-100 text-blue-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const canManageThisUser = (targetUserRole) => {
    return canManageUser(userRole, targetUserRole)
  }

  if (isLoading) {
    return (
      <div>
        <h1 className="text-3xl font-bold text-gray-900 mb-6">User Management</h1>
        <p className="text-gray-600">Loading users...</p>
      </div>
    )
  }

  return (
    <div>
      <h1 className="text-3xl font-bold text-gray-900 mb-6">User Management</h1>
      <p className="text-gray-600 mb-6">Manage user accounts and permissions</p>

      {/* Success/Error Messages */}
      {success && (
        <div className="mb-4 p-4 bg-ocean-seafoam bg-opacity-20 border border-ocean-teal rounded-md">
          <p className="text-ocean-teal">{success}</p>
        </div>
      )}

      {error && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-md">
          <p className="text-red-800">{error}</p>
        </div>
      )}

      {/* Pending Users Section */}
      {pendingUsers.length > 0 && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 mb-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            Pending Approvals ({pendingUsers.length})
          </h2>
          <div className="space-y-4">
            {pendingUsers.map(user => (
              <div key={user.uid} className="bg-white rounded-lg p-4 flex items-center justify-between">
                <div>
                  <p className="font-medium text-gray-900">{user.email}</p>
                  <p className="text-sm text-gray-500">
                    Registered: {user.createdAt?.toDate?.().toLocaleDateString() || 'Recently'}
                  </p>
                </div>
                <div className="flex gap-2">
                  <select
                    onChange={(e) => handleApprove(user.uid, e.target.value)}
                    className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-ocean-teal"
                    defaultValue=""
                  >
                    <option value="" disabled>Approve as...</option>
                    <option value={ROLES.VIEW}>View</option>
                    <option value={ROLES.EDIT}>Edit</option>
                    {userRole === ROLES.SUPER_ADMIN && (
                      <option value={ROLES.ADMIN}>Admin</option>
                    )}
                  </select>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Active Users */}
      <div className="bg-white shadow rounded-lg overflow-hidden mb-6">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">Active Users</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Email
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Role
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Joined
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {users.filter(u => u.status === USER_STATUS.ACTIVE).map(user => {
                const isCurrentUser = user.uid === currentUser.uid
                const canManage = canManageThisUser(user.role) && !isCurrentUser

                return (
                  <tr key={user.uid} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {user.email}
                      {isCurrentUser && (
                        <span className="ml-2 text-xs text-gray-500">(You)</span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {canManage ? (
                        <select
                          value={user.role}
                          onChange={(e) => handleChangeRole(user.uid, e.target.value)}
                          className="px-2 py-1 text-xs font-semibold rounded-full border border-gray-300 focus:outline-none focus:ring-2 focus:ring-ocean-teal"
                        >
                          <option value={ROLES.VIEW}>View</option>
                          <option value={ROLES.EDIT}>Edit</option>
                          {userRole === ROLES.SUPER_ADMIN && (
                            <>
                              <option value={ROLES.ADMIN}>Admin</option>
                              <option value={ROLES.SUPER_ADMIN}>Super Admin</option>
                            </>
                          )}
                        </select>
                      ) : (
                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getRoleBadgeColor(user.role)}`}>
                          {ROLE_NAMES[user.role]}
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-ocean-seafoam bg-opacity-30 text-ocean-teal">
                        Active
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {user.createdAt?.toDate?.().toLocaleDateString() || 'N/A'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      {canManage && (
                        <button
                          onClick={() => handleDeactivate(user.uid)}
                          className="text-red-600 hover:text-red-900"
                        >
                          Deactivate
                        </button>
                      )}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Inactive Users */}
      {users.filter(u => u.status === USER_STATUS.INACTIVE).length > 0 && (
        <div className="bg-white shadow rounded-lg overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">Inactive Users</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Email
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Role
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {users.filter(u => u.status === USER_STATUS.INACTIVE).map(user => {
                  const canManage = canManageThisUser(user.role)

                  return (
                    <tr key={user.uid} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {user.email}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getRoleBadgeColor(user.role)}`}>
                          {ROLE_NAMES[user.role]}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        {canManage && (
                          <button
                            onClick={() => handleReactivate(user.uid)}
                            className="text-ocean-teal hover:text-ocean-navy"
                          >
                            Reactivate
                          </button>
                        )}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}

export default Users
