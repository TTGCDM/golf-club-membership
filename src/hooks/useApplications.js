import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  getAllApplications,
  getApplicationById,
  getApplicationsByStatus,
  submitApplication,
  verifyEmail,
  updateApplicationAdminFields,
  approveApplication,
  rejectApplication,
  resendVerificationEmail,
  searchApplications,
  getApplicationStats
} from '../services/applicationsService'

/**
 * React Query hooks for applications
 *
 * These hooks provide a clean interface for fetching and mutating application data
 * with automatic caching, background refetching, and optimistic updates.
 *
 * Naming convention:
 * - useApplications: Fetch multiple applications
 * - useApplication: Fetch single application
 * - useSubmitApplication: Mutation to create application
 * - etc.
 */

// Query keys
export const applicationKeys = {
  all: ['applications'],
  lists: () => [...applicationKeys.all, 'list'],
  list: (filters) => [...applicationKeys.lists(), filters],
  details: () => [...applicationKeys.all, 'detail'],
  detail: (id) => [...applicationKeys.details(), id],
  stats: () => [...applicationKeys.all, 'stats']
}

/**
 * Fetch all applications
 * @returns {Object} React Query result with applications array
 */
export const useApplications = () => {
  return useQuery({
    queryKey: applicationKeys.lists(),
    queryFn: getAllApplications,
    staleTime: 2 * 60 * 1000,    // Data fresh for 2 minutes (applications change frequently)
    cacheTime: 5 * 60 * 1000,    // Keep in cache for 5 minutes
  })
}

/**
 * Fetch single application by ID
 * @param {string} applicationId - Application document ID
 * @returns {Object} React Query result with application object
 */
export const useApplication = (applicationId) => {
  return useQuery({
    queryKey: applicationKeys.detail(applicationId),
    queryFn: () => getApplicationById(applicationId),
    enabled: !!applicationId, // Only fetch if ID is provided
    staleTime: 2 * 60 * 1000,
    cacheTime: 5 * 60 * 1000,
  })
}

/**
 * Fetch applications by status
 * @param {string} status - Application status (submitted, email_verified, approved, rejected)
 * @returns {Object} React Query result with filtered applications array
 */
export const useApplicationsByStatus = (status) => {
  return useQuery({
    queryKey: applicationKeys.list({ status }),
    queryFn: () => getApplicationsByStatus(status),
    enabled: !!status, // Only fetch if status is provided
    staleTime: 2 * 60 * 1000,
    cacheTime: 5 * 60 * 1000,
  })
}

/**
 * Fetch application statistics
 * @returns {Object} React Query result with stats object
 */
export const useApplicationStats = () => {
  return useQuery({
    queryKey: applicationKeys.stats(),
    queryFn: getApplicationStats,
    staleTime: 5 * 60 * 1000,    // Stats change less frequently
    cacheTime: 10 * 60 * 1000,
  })
}

/**
 * Search applications by name or email
 * @param {string} searchTerm - Search term
 * @param {boolean} enabled - Whether to enable the query
 * @returns {Object} React Query result with filtered applications array
 */
export const useSearchApplications = (searchTerm, enabled = true) => {
  return useQuery({
    queryKey: applicationKeys.list({ search: searchTerm }),
    queryFn: () => searchApplications(searchTerm),
    enabled: enabled && !!searchTerm && searchTerm.length >= 2, // Only search if term is 2+ chars
    staleTime: 1 * 60 * 1000, // Search results fresh for 1 minute
    cacheTime: 5 * 60 * 1000,
  })
}

/**
 * Submit new application (PUBLIC mutation - no auth required)
 * @returns {Object} Mutation object with mutate function
 */
export const useSubmitApplication = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ applicationData, verificationToken, tokenExpiry }) =>
      submitApplication(applicationData, verificationToken, tokenExpiry),
    onSuccess: () => {
      // Invalidate applications list to refetch after submission
      queryClient.invalidateQueries({ queryKey: applicationKeys.lists() })
      queryClient.invalidateQueries({ queryKey: applicationKeys.stats() })
    },
    onError: (error) => {
      console.error('Error submitting application:', error)
    }
  })
}

/**
 * Verify email (PUBLIC mutation - no auth required)
 * @returns {Object} Mutation object with mutate function
 */
export const useVerifyEmail = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ applicationId, token }) => verifyEmail(applicationId, token),
    onSuccess: (_, variables) => {
      // Invalidate specific application and lists
      queryClient.invalidateQueries({ queryKey: applicationKeys.detail(variables.applicationId) })
      queryClient.invalidateQueries({ queryKey: applicationKeys.lists() })
      queryClient.invalidateQueries({ queryKey: applicationKeys.stats() })
    },
    onError: (error) => {
      console.error('Error verifying email:', error)
    }
  })
}

/**
 * Update application admin fields (proposer, seconder, notes)
 * @returns {Object} Mutation object with mutate function
 */
export const useUpdateApplicationAdminFields = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ applicationId, updates }) =>
      updateApplicationAdminFields(applicationId, updates),
    onSuccess: (data, variables) => {
      // Invalidate specific application to refetch
      queryClient.invalidateQueries({ queryKey: applicationKeys.detail(variables.applicationId) })
      queryClient.invalidateQueries({ queryKey: applicationKeys.lists() })
    },
    onError: (error) => {
      console.error('Error updating application admin fields:', error)
    }
  })
}

/**
 * Approve application and create member
 * @returns {Object} Mutation object with mutate function
 */
export const useApproveApplication = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ applicationId, adminUserId }) =>
      approveApplication(applicationId, adminUserId),
    onSuccess: (member, variables) => {
      // Invalidate applications queries
      queryClient.invalidateQueries({ queryKey: applicationKeys.detail(variables.applicationId) })
      queryClient.invalidateQueries({ queryKey: applicationKeys.lists() })
      queryClient.invalidateQueries({ queryKey: applicationKeys.stats() })

      // Also invalidate members queries since a new member was created
      queryClient.invalidateQueries({ queryKey: ['members'] })
    },
    onError: (error) => {
      console.error('Error approving application:', error)
    }
  })
}

/**
 * Reject application
 * @returns {Object} Mutation object with mutate function
 */
export const useRejectApplication = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ applicationId, adminUserId, rejectionReason }) =>
      rejectApplication(applicationId, adminUserId, rejectionReason),
    onSuccess: (_, variables) => {
      // Invalidate applications queries
      queryClient.invalidateQueries({ queryKey: applicationKeys.detail(variables.applicationId) })
      queryClient.invalidateQueries({ queryKey: applicationKeys.lists() })
      queryClient.invalidateQueries({ queryKey: applicationKeys.stats() })
    },
    onError: (error) => {
      console.error('Error rejecting application:', error)
    }
  })
}

/**
 * Resend verification email (PUBLIC mutation - no auth required)
 * @returns {Object} Mutation object with mutate function
 */
export const useResendVerificationEmail = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ applicationId, newToken, newExpiry }) =>
      resendVerificationEmail(applicationId, newToken, newExpiry),
    onSuccess: (_, variables) => {
      // Invalidate specific application to refetch
      queryClient.invalidateQueries({ queryKey: applicationKeys.detail(variables.applicationId) })
    },
    onError: (error) => {
      console.error('Error resending verification email:', error)
    }
  })
}

/**
 * Example usage in components:
 *
 * // Fetch all applications
 * const { data: applications, isLoading, error } = useApplications()
 *
 * // Fetch single application
 * const { data: application, isLoading } = useApplication(applicationId)
 *
 * // Submit application
 * const submitMutation = useSubmitApplication()
 * submitMutation.mutate({ applicationData, verificationToken, tokenExpiry })
 *
 * // Approve application
 * const approveMutation = useApproveApplication()
 * approveMutation.mutate({ applicationId, adminUserId })
 */
