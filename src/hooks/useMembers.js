import { useQuery } from '@tanstack/react-query'
import { getAllMembers } from '@/services/membersService'
import { memberKeys } from './useMember'

/**
 * Hook to fetch all members (for command palette search)
 * Uses the existing memberKeys factory for cache consistency
 * @param {object} options - Additional React Query options
 */
export const useMembers = (options = {}) => {
  return useQuery({
    queryKey: memberKeys.lists(),
    queryFn: getAllMembers,
    staleTime: 5 * 60 * 1000, // 5 minutes
    ...options,
  })
}

export default useMembers
