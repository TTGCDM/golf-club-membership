import { useQuery } from '@tanstack/react-query'
import { getFeesByMember } from '@/services/feeService'

/**
 * Query key factory for fee-related queries
 */
export const feeKeys = {
  all: ['fees'],
  lists: () => [...feeKeys.all, 'list'],
  list: (filters) => [...feeKeys.lists(), filters],
  byMember: (memberId) => [...feeKeys.all, 'member', memberId],
  byYear: (year) => [...feeKeys.all, 'year', year],
}

/**
 * Hook to fetch fees for a specific member
 * @param {string} memberId - The member ID
 * @param {object} options - Additional React Query options
 */
export const useMemberFees = (memberId, options = {}) => {
  return useQuery({
    queryKey: feeKeys.byMember(memberId),
    queryFn: () => getFeesByMember(memberId),
    enabled: !!memberId,
    staleTime: 5 * 60 * 1000, // 5 minutes
    ...options,
  })
}

export default useMemberFees
