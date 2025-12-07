import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  getAllUsers,
  getUserDocument,
  getPendingUsers,
  approveUser,
  updateUserRole,
  updateUserStatus,
  deactivateUser,
  reactivateUser
} from '@/services/usersService'
import { handleError, showSuccess } from '@/utils/errorHandler'

/**
 * Query key factory for user-related queries
 */
export const userKeys = {
  all: ['users'],
  lists: () => [...userKeys.all, 'list'],
  list: (filters) => [...userKeys.lists(), filters],
  pending: () => [...userKeys.all, 'pending'],
  details: () => [...userKeys.all, 'detail'],
  detail: (id) => [...userKeys.details(), id],
}

/**
 * Hook to fetch all users
 * @param {object} options - Additional React Query options
 */
export const useUsers = (options = {}) => {
  return useQuery({
    queryKey: userKeys.lists(),
    queryFn: getAllUsers,
    staleTime: 2 * 60 * 1000, // 2 minutes
    ...options,
  })
}

/**
 * Hook to fetch a single user by ID
 * @param {string} userId - The user ID
 * @param {object} options - Additional React Query options
 */
export const useUser = (userId, options = {}) => {
  return useQuery({
    queryKey: userKeys.detail(userId),
    queryFn: () => getUserDocument(userId),
    enabled: !!userId,
    staleTime: 5 * 60 * 1000, // 5 minutes
    ...options,
  })
}

/**
 * Hook to approve a user
 */
export const useApproveUser = (options = {}) => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ userId, role }) => approveUser(userId, role),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: userKeys.detail(variables.userId) })
      queryClient.invalidateQueries({ queryKey: userKeys.lists() })
      queryClient.invalidateQueries({ queryKey: userKeys.pending() })
      showSuccess('User approved successfully')
      options.onSuccess?.(variables)
    },
    onError: (error) => {
      handleError(error, 'Failed to approve user')
      options.onError?.(error)
    },
    ...options,
  })
}

/**
 * Hook to update a user's role
 */
export const useUpdateUserRole = (options = {}) => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ userId, newRole }) => updateUserRole(userId, newRole),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: userKeys.detail(variables.userId) })
      queryClient.invalidateQueries({ queryKey: userKeys.lists() })
      showSuccess('User role updated successfully')
      options.onSuccess?.(variables)
    },
    onError: (error) => {
      handleError(error, 'Failed to update user role')
      options.onError?.(error)
    },
    ...options,
  })
}

/**
 * Hook to update a user's status
 */
export const useUpdateUserStatus = (options = {}) => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ userId, newStatus }) => updateUserStatus(userId, newStatus),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: userKeys.detail(variables.userId) })
      queryClient.invalidateQueries({ queryKey: userKeys.lists() })
      showSuccess('User status updated successfully')
      options.onSuccess?.(variables)
    },
    onError: (error) => {
      handleError(error, 'Failed to update user status')
      options.onError?.(error)
    },
    ...options,
  })
}

/**
 * Hook to fetch pending users
 * @param {object} options - Additional React Query options
 */
export const usePendingUsers = (options = {}) => {
  return useQuery({
    queryKey: userKeys.pending(),
    queryFn: getPendingUsers,
    staleTime: 1 * 60 * 1000, // 1 minute
    ...options,
  })
}

/**
 * Hook to deactivate a user
 */
export const useDeactivateUser = (options = {}) => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: deactivateUser,
    onSuccess: (_, userId) => {
      queryClient.invalidateQueries({ queryKey: userKeys.all })
      showSuccess('User deactivated successfully')
      options.onSuccess?.(userId)
    },
    onError: (error) => {
      handleError(error, 'Failed to deactivate user')
      options.onError?.(error)
    },
    ...options,
  })
}

/**
 * Hook to reactivate a user
 */
export const useReactivateUser = (options = {}) => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: reactivateUser,
    onSuccess: (_, userId) => {
      queryClient.invalidateQueries({ queryKey: userKeys.all })
      showSuccess('User reactivated successfully')
      options.onSuccess?.(userId)
    },
    onError: (error) => {
      handleError(error, 'Failed to reactivate user')
      options.onError?.(error)
    },
    ...options,
  })
}

export default useUsers
