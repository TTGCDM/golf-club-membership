import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  getMemberById,
  createMember,
  updateMember,
  deleteMember
} from '@/services/membersService'
import { handleError, showSuccess } from '@/utils/errorHandler'

/**
 * Query key factory for member-related queries
 */
export const memberKeys = {
  all: ['members'],
  lists: () => [...memberKeys.all, 'list'],
  list: (filters) => [...memberKeys.lists(), filters],
  details: () => [...memberKeys.all, 'detail'],
  detail: (id) => [...memberKeys.details(), id],
}

/**
 * Hook to fetch a single member by ID
 * @param {string} memberId - The member ID
 * @param {object} options - Additional React Query options
 */
export const useMember = (memberId, options = {}) => {
  return useQuery({
    queryKey: memberKeys.detail(memberId),
    queryFn: () => getMemberById(memberId),
    enabled: !!memberId,
    staleTime: 5 * 60 * 1000, // 5 minutes
    ...options,
  })
}

/**
 * Hook to create a new member
 */
export const useCreateMember = (options = {}) => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: createMember,
    onSuccess: (data) => {
      // Invalidate member lists to refetch
      queryClient.invalidateQueries({ queryKey: memberKeys.lists() })
      showSuccess('Member created successfully')
      options.onSuccess?.(data)
    },
    onError: (error) => {
      handleError(error, 'Failed to create member')
      options.onError?.(error)
    },
    ...options,
  })
}

/**
 * Hook to update a member
 */
export const useUpdateMember = (options = {}) => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ memberId, data }) => updateMember(memberId, data),
    onSuccess: (data, variables) => {
      // Update the specific member in cache
      queryClient.setQueryData(memberKeys.detail(variables.memberId), data)
      // Invalidate lists to update any list views
      queryClient.invalidateQueries({ queryKey: memberKeys.lists() })
      showSuccess('Member updated successfully')
      options.onSuccess?.(data, variables)
    },
    onError: (error) => {
      handleError(error, 'Failed to update member')
      options.onError?.(error)
    },
    ...options,
  })
}

/**
 * Hook to delete (soft) a member
 */
export const useDeleteMember = (options = {}) => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: deleteMember,
    onSuccess: (_, memberId) => {
      // Invalidate the specific member
      queryClient.invalidateQueries({ queryKey: memberKeys.detail(memberId) })
      // Invalidate lists
      queryClient.invalidateQueries({ queryKey: memberKeys.lists() })
      showSuccess('Member deleted successfully')
      options.onSuccess?.(memberId)
    },
    onError: (error) => {
      handleError(error, 'Failed to delete member')
      options.onError?.(error)
    },
    ...options,
  })
}

export default useMember
