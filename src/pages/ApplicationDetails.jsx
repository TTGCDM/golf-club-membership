import { useState } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useAuth } from '../contexts/AuthContext'
import {
  getApplicationById,
  approveApplication,
  rejectApplication,
  APPLICATION_STATUS
} from '../services/applicationsService'
import { generateApplicationPDF } from '../services/applicationPDFService'

const ApplicationDetails = () => {
  const { id } = useParams()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const { currentUser, checkPermission, ROLES } = useAuth()
  const [showApproveModal, setShowApproveModal] = useState(false)
  const [showRejectModal, setShowRejectModal] = useState(false)
  const [rejectionReason, setRejectionReason] = useState('')
  const [error, setError] = useState('')
  const [successMessage, setSuccessMessage] = useState('')

  // Check permission
  if (!checkPermission(ROLES.EDIT)) {
    return (
      <div>
        <h1 className="text-3xl font-bold text-gray-900 mb-6">Access Denied</h1>
        <p className="text-gray-600">You do not have permission to view applications.</p>
      </div>
    )
  }

  // Fetch application
  const { data: application, isLoading } = useQuery({
    queryKey: ['applications', id],
    queryFn: () => getApplicationById(id),
  })

  // Approve mutation
  const approveMutation = useMutation({
    mutationFn: () => approveApplication(id, currentUser.uid),
    onSuccess: (member) => {
      queryClient.invalidateQueries(['applications'])
      queryClient.invalidateQueries(['applications', id])
      queryClient.invalidateQueries(['members'])
      setSuccessMessage(`Application approved! Member created successfully.`)
      setShowApproveModal(false)
      // Navigate to member after short delay
      setTimeout(() => {
        navigate(`/members/${member.id}`)
      }, 2000)
    },
    onError: (err) => {
      setError(err.message || 'Failed to approve application')
      setShowApproveModal(false)
    }
  })

  // Reject mutation
  const rejectMutation = useMutation({
    mutationFn: () => rejectApplication(id, currentUser.uid, rejectionReason),
    onSuccess: () => {
      queryClient.invalidateQueries(['applications'])
      queryClient.invalidateQueries(['applications', id])
      setSuccessMessage('Application rejected successfully.')
      setShowRejectModal(false)
      setRejectionReason('')
    },
    onError: (err) => {
      setError(err.message || 'Failed to reject application')
      setShowRejectModal(false)
    }
  })

  const handleGeneratePDF = () => {
    try {
      generateApplicationPDF(application)
      setSuccessMessage('PDF generated successfully!')
      setTimeout(() => setSuccessMessage(''), 3000)
    } catch (err) {
      setError('Failed to generate PDF: ' + err.message)
      setTimeout(() => setError(''), 3000)
    }
  }

  const handleApprove = () => {
    setError('')
    approveMutation.mutate()
  }

  const handleReject = () => {
    if (!rejectionReason.trim()) {
      setError('Please provide a reason for rejection')
      return
    }
    setError('')
    rejectMutation.mutate()
  }

  const formatDate = (timestamp) => {
    if (!timestamp) return 'N/A'
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp)
    return date.toLocaleDateString()
  }

  const formatDateTime = (timestamp) => {
    if (!timestamp) return 'N/A'
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp)
    return `${date.toLocaleDateString()} ${date.toLocaleTimeString()}`
  }

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
      <span className={`px-3 py-1 inline-flex text-sm leading-5 font-semibold rounded-full ${config.bgColor} ${config.textColor}`}>
        {config.label}
      </span>
    )
  }

  if (isLoading) {
    return (
      <div>
        <h1 className="text-3xl font-bold text-gray-900 mb-6">Application Details</h1>
        <p className="text-gray-600">Loading application...</p>
      </div>
    )
  }

  if (!application) {
    return (
      <div>
        <h1 className="text-3xl font-bold text-gray-900 mb-6">Application Not Found</h1>
        <Link to="/applications" className="text-ocean-teal hover:text-ocean-navy">
          Back to Applications
        </Link>
      </div>
    )
  }

  const canApproveReject = application.status === APPLICATION_STATUS.EMAIL_VERIFIED

  return (
    <div>
      {/* Header */}
      <div className="mb-6">
        <Link to="/applications" className="text-ocean-teal hover:text-ocean-navy mb-4 inline-block">
          &larr; Back to Applications
        </Link>
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">{application.fullName}</h1>
            <p className="text-gray-600 mt-1">Application Details</p>
          </div>
          <div>
            {getStatusBadge(application.status)}
          </div>
        </div>
      </div>

      {/* Success/Error Messages */}
      {successMessage && (
        <div className="bg-green-50 border border-green-200 text-green-800 px-4 py-3 rounded mb-6">
          {successMessage}
        </div>
      )}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded mb-6">
          {error}
        </div>
      )}

      {/* Action Buttons */}
      <div className="bg-white shadow rounded-lg p-6 mb-6">
        <h2 className="text-xl font-bold text-gray-900 mb-4">Actions</h2>
        <div className="flex flex-wrap gap-3">
          <button
            onClick={handleGeneratePDF}
            className="px-4 py-2 bg-ocean-teal text-white rounded-md hover:bg-ocean-navy"
          >
            Generate PDF
          </button>
          {canApproveReject && (
            <>
              <button
                onClick={() => setShowApproveModal(true)}
                className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
              >
                Approve Application
              </button>
              <button
                onClick={() => setShowRejectModal(true)}
                className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
              >
                Reject Application
              </button>
            </>
          )}
          {application.status === APPLICATION_STATUS.APPROVED && application.memberId && (
            <Link
              to={`/members/${application.memberId}`}
              className="px-4 py-2 bg-ocean-navy text-white rounded-md hover:bg-ocean-teal"
            >
              View Member Profile
            </Link>
          )}
        </div>
      </div>

      {/* Timeline */}
      <div className="bg-white shadow rounded-lg p-6 mb-6">
        <h2 className="text-xl font-bold text-gray-900 mb-4">Application Timeline</h2>
        <div className="space-y-4">
          <div className="flex items-start">
            <div className="flex-shrink-0 w-2 h-2 mt-2 rounded-full bg-gray-400"></div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-900">Application Submitted</p>
              <p className="text-sm text-gray-600">{formatDateTime(application.submittedAt)}</p>
            </div>
          </div>
          {application.emailVerified && application.verifiedAt && (
            <div className="flex items-start">
              <div className="flex-shrink-0 w-2 h-2 mt-2 rounded-full bg-blue-400"></div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-900">Email Verified</p>
                <p className="text-sm text-gray-600">{formatDateTime(application.verifiedAt)}</p>
              </div>
            </div>
          )}
          {application.status === APPLICATION_STATUS.APPROVED && application.approvedAt && (
            <div className="flex items-start">
              <div className="flex-shrink-0 w-2 h-2 mt-2 rounded-full bg-green-400"></div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-900">Application Approved</p>
                <p className="text-sm text-gray-600">{formatDateTime(application.approvedAt)}</p>
              </div>
            </div>
          )}
          {application.status === APPLICATION_STATUS.REJECTED && application.rejectedAt && (
            <div className="flex items-start">
              <div className="flex-shrink-0 w-2 h-2 mt-2 rounded-full bg-red-400"></div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-900">Application Rejected</p>
                <p className="text-sm text-gray-600">{formatDateTime(application.rejectedAt)}</p>
                {application.rejectionReason && (
                  <p className="text-sm text-red-600 mt-1">Reason: {application.rejectionReason}</p>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Application Details */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Personal Information */}
        <div className="bg-white shadow rounded-lg p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Personal Information</h2>
          <dl className="space-y-3">
            <div>
              <dt className="text-sm font-medium text-gray-500">Title</dt>
              <dd className="text-sm text-gray-900">{application.title || 'N/A'}</dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-gray-500">Full Name</dt>
              <dd className="text-sm text-gray-900">{application.fullName}</dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-gray-500">Date of Birth</dt>
              <dd className="text-sm text-gray-900">{application.dateOfBirth}</dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-gray-500">Occupation</dt>
              <dd className="text-sm text-gray-900">{application.occupation || 'N/A'}</dd>
            </div>
          </dl>
        </div>

        {/* Contact Information */}
        <div className="bg-white shadow rounded-lg p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Contact Information</h2>
          <dl className="space-y-3">
            <div>
              <dt className="text-sm font-medium text-gray-500">Email</dt>
              <dd className="text-sm text-gray-900">{application.email}</dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-gray-500">Mobile Phone</dt>
              <dd className="text-sm text-gray-900">{application.phoneMobile}</dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-gray-500">Home Phone</dt>
              <dd className="text-sm text-gray-900">{application.phoneHome || 'N/A'}</dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-gray-500">Work Phone</dt>
              <dd className="text-sm text-gray-900">{application.phoneWork || 'N/A'}</dd>
            </div>
          </dl>
        </div>

        {/* Address */}
        <div className="bg-white shadow rounded-lg p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Address</h2>
          <dl className="space-y-3">
            <div>
              <dt className="text-sm font-medium text-gray-500">Street Address</dt>
              <dd className="text-sm text-gray-900">{application.streetAddress}</dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-gray-500">Suburb</dt>
              <dd className="text-sm text-gray-900">{application.suburb}</dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-gray-500">State</dt>
              <dd className="text-sm text-gray-900">{application.state}</dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-gray-500">Postcode</dt>
              <dd className="text-sm text-gray-900">{application.postcode}</dd>
            </div>
          </dl>
        </div>

        {/* Business Information */}
        <div className="bg-white shadow rounded-lg p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Business Information</h2>
          <dl className="space-y-3">
            <div>
              <dt className="text-sm font-medium text-gray-500">Business Name</dt>
              <dd className="text-sm text-gray-900">{application.businessName || 'N/A'}</dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-gray-500">Business Address</dt>
              <dd className="text-sm text-gray-900">{application.businessAddress || 'N/A'}</dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-gray-500">Business Postcode</dt>
              <dd className="text-sm text-gray-900">{application.businessPostcode || 'N/A'}</dd>
            </div>
          </dl>
        </div>

        {/* Golf History */}
        <div className="bg-white shadow rounded-lg p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Golf History</h2>
          <dl className="space-y-3">
            <div>
              <dt className="text-sm font-medium text-gray-500">Previous Clubs</dt>
              <dd className="text-sm text-gray-900">{application.previousClubs || 'N/A'}</dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-gray-500">Golf Link Number</dt>
              <dd className="text-sm text-gray-900">{application.golfLinkNumber || 'N/A'}</dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-gray-500">Last Handicap</dt>
              <dd className="text-sm text-gray-900">{application.lastHandicap || 'N/A'}</dd>
            </div>
          </dl>
        </div>

        {/* Membership Type */}
        <div className="bg-white shadow rounded-lg p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Membership</h2>
          <dl className="space-y-3">
            <div>
              <dt className="text-sm font-medium text-gray-500">Membership Type</dt>
              <dd className="text-sm text-gray-900 font-semibold">{application.membershipType}</dd>
            </div>
          </dl>
        </div>
      </div>

      {/* Approve Modal */}
      {showApproveModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <h3 className="text-lg font-bold text-gray-900 mb-4">Approve Application</h3>
            <p className="text-sm text-gray-600 mb-6">
              Are you sure you want to approve this application? This will create a new member record.
            </p>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setShowApproveModal(false)}
                disabled={approveMutation.isLoading}
                className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300"
              >
                Cancel
              </button>
              <button
                onClick={handleApprove}
                disabled={approveMutation.isLoading}
                className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50"
              >
                {approveMutation.isLoading ? 'Approving...' : 'Approve'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Reject Modal */}
      {showRejectModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <h3 className="text-lg font-bold text-gray-900 mb-4">Reject Application</h3>
            <p className="text-sm text-gray-600 mb-4">
              Please provide a reason for rejecting this application:
            </p>
            <textarea
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
              placeholder="Enter rejection reason..."
              rows={4}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-ocean-teal mb-4"
            />
            <div className="flex justify-end gap-3">
              <button
                onClick={() => {
                  setShowRejectModal(false)
                  setRejectionReason('')
                }}
                disabled={rejectMutation.isLoading}
                className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300"
              >
                Cancel
              </button>
              <button
                onClick={handleReject}
                disabled={rejectMutation.isLoading}
                className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 disabled:opacity-50"
              >
                {rejectMutation.isLoading ? 'Rejecting...' : 'Reject'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default ApplicationDetails
