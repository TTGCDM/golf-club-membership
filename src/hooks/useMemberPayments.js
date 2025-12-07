import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  getPaymentsByMember,
  recordPayment,
  updatePayment,
  deletePayment
} from '@/services/paymentsService'
import { memberKeys } from './useMember'
import { handleError, showSuccess } from '@/utils/errorHandler'

/**
 * Query key factory for payment-related queries
 */
export const paymentKeys = {
  all: ['payments'],
  lists: () => [...paymentKeys.all, 'list'],
  list: (filters) => [...paymentKeys.lists(), filters],
  byMember: (memberId) => [...paymentKeys.all, 'member', memberId],
  details: () => [...paymentKeys.all, 'detail'],
  detail: (id) => [...paymentKeys.details(), id],
}

/**
 * Hook to fetch payments for a specific member
 * @param {string} memberId - The member ID
 * @param {object} options - Additional React Query options
 */
export const useMemberPayments = (memberId, options = {}) => {
  return useQuery({
    queryKey: paymentKeys.byMember(memberId),
    queryFn: () => getPaymentsByMember(memberId),
    enabled: !!memberId,
    staleTime: 2 * 60 * 1000, // 2 minutes
    ...options,
  })
}

/**
 * Hook to record a new payment
 */
export const useRecordPayment = (options = {}) => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ paymentData, userId }) => recordPayment(paymentData, userId),
    onSuccess: (data, variables) => {
      // Invalidate member's payments list
      queryClient.invalidateQueries({
        queryKey: paymentKeys.byMember(variables.paymentData.memberId)
      })
      // Invalidate all payments lists
      queryClient.invalidateQueries({ queryKey: paymentKeys.lists() })
      // Invalidate the member to update their balance
      queryClient.invalidateQueries({
        queryKey: memberKeys.detail(variables.paymentData.memberId)
      })
      // Invalidate member lists (for balance updates in list view)
      queryClient.invalidateQueries({ queryKey: memberKeys.lists() })

      showSuccess(`Payment recorded! Receipt: ${data.receiptNumber}`)
      options.onSuccess?.(data, variables)
    },
    onError: (error) => {
      handleError(error, 'Failed to record payment')
      options.onError?.(error)
    },
    ...options,
  })
}

/**
 * Hook to update a payment
 */
export const useUpdatePayment = (options = {}) => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ paymentId, paymentData, userId }) =>
      updatePayment(paymentId, paymentData, userId),
    onSuccess: (data, variables) => {
      // Invalidate payment lists
      queryClient.invalidateQueries({ queryKey: paymentKeys.lists() })
      // Invalidate member-specific payments if we know the member
      if (variables.paymentData.memberId) {
        queryClient.invalidateQueries({
          queryKey: paymentKeys.byMember(variables.paymentData.memberId)
        })
        queryClient.invalidateQueries({
          queryKey: memberKeys.detail(variables.paymentData.memberId)
        })
      }
      queryClient.invalidateQueries({ queryKey: memberKeys.lists() })

      showSuccess('Payment updated successfully')
      options.onSuccess?.(data, variables)
    },
    onError: (error) => {
      handleError(error, 'Failed to update payment')
      options.onError?.(error)
    },
    ...options,
  })
}

/**
 * Hook to delete a payment
 */
export const useDeletePayment = (options = {}) => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: deletePayment,
    onSuccess: (_, paymentId) => {
      // Invalidate all payment-related queries
      queryClient.invalidateQueries({ queryKey: paymentKeys.all })
      // Invalidate all member-related queries (balances may have changed)
      queryClient.invalidateQueries({ queryKey: memberKeys.all })

      showSuccess('Payment deleted successfully')
      options.onSuccess?.(paymentId)
    },
    onError: (error) => {
      handleError(error, 'Failed to delete payment')
      options.onError?.(error)
    },
    ...options,
  })
}

export default useMemberPayments
