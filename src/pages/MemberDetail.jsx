import { useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { useQueryClient } from '@tanstack/react-query'
import { useAuth } from '../contexts/AuthContext'
import { useMember, memberKeys } from '@/hooks/useMember'
import { useMemberPayments, useRecordPayment } from '@/hooks/useMemberPayments'
import { useMemberFees, feeKeys } from '@/hooks/useMemberFees'
import { useQuery } from '@tanstack/react-query'
import { getAllCategories, calculateAge } from '../services/membershipCategories'
import { formatPaymentMethod, generatePDFReceipt } from '../services/paymentsService'
import { applyFeeToMember } from '../services/feeService'
import { generateWelcomeLetter, generatePaymentReminder } from '../services/welcomeLetterService'
import { addMemberComment, deleteMemberComment } from '../services/membersService'
import { handleError, showSuccess } from '@/utils/errorHandler'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import PageBreadcrumb from '../components/PageBreadcrumb'

const MemberDetail = () => {
  const { checkPermission, ROLES, currentUser } = useAuth()
  const { id } = useParams()
  const queryClient = useQueryClient()

  // React Query hooks
  const { data: member, isLoading: memberLoading, error: memberError } = useMember(id)
  const { data: payments = [], isLoading: paymentsLoading } = useMemberPayments(id)
  const { data: fees = [], isLoading: feesLoading } = useMemberFees(id)
  const { data: categories = [] } = useQuery({
    queryKey: ['categories'],
    queryFn: getAllCategories,
    staleTime: 10 * 60 * 1000, // 10 minutes
  })

  // Record payment mutation
  const recordPaymentMutation = useRecordPayment()

  // Modal states
  const [showFeeModal, setShowFeeModal] = useState(false)
  const [showPaymentModal, setShowPaymentModal] = useState(false)

  // Comment state
  const [newComment, setNewComment] = useState('')
  const [isSubmittingComment, setIsSubmittingComment] = useState(false)

  // Fee form state
  const [feeFormData, setFeeFormData] = useState({
    amount: '',
    feeYear: new Date().getFullYear(),
    notes: ''
  })
  const [isSubmittingFee, setIsSubmittingFee] = useState(false)

  // Payment form state
  const [paymentFormData, setPaymentFormData] = useState({
    amount: '',
    paymentDate: new Date().toISOString().split('T')[0],
    paymentMethod: 'bank_transfer',
    reference: '',
    notes: ''
  })

  const canEdit = checkPermission(ROLES.EDIT)

  // Find member's category
  const category = categories.find(c => c.id === member?.membershipCategory)

  const handlePrintReceipt = async (payment) => {
    try {
      await generatePDFReceipt(payment)
      showSuccess('Receipt generated successfully!')
    } catch (err) {
      handleError(err, 'Failed to generate receipt')
    }
  }

  const handleGenerateWelcomeLetter = async () => {
    try {
      await generateWelcomeLetter(id)
      showSuccess('Welcome letter generated successfully!')
    } catch (err) {
      handleError(err, 'Failed to generate welcome letter')
    }
  }

  const handleGeneratePaymentReminder = async () => {
    try {
      await generatePaymentReminder(id)
      showSuccess('Payment reminder generated successfully!')
    } catch (err) {
      handleError(err, 'Failed to generate payment reminder')
    }
  }

  const handleOpenFeeModal = () => {
    setFeeFormData({
      amount: category?.annualFee || '',
      feeYear: new Date().getFullYear(),
      notes: `${new Date().getFullYear()} Annual Membership Fee`
    })
    setShowFeeModal(true)
  }

  const handleRecordFee = async (e) => {
    e.preventDefault()
    setIsSubmittingFee(true)

    try {
      const feeData = {
        memberId: id,
        memberName: member.fullName,
        amount: parseFloat(feeFormData.amount),
        feeYear: parseInt(feeFormData.feeYear),
        notes: feeFormData.notes,
        categoryId: member.membershipCategory,
        categoryName: category?.name || member.membershipCategory
      }

      await applyFeeToMember(feeData, currentUser.uid)

      // Invalidate queries to refetch
      queryClient.invalidateQueries({ queryKey: memberKeys.detail(id) })
      queryClient.invalidateQueries({ queryKey: feeKeys.byMember(id) })

      showSuccess('Fee recorded successfully!')
      setShowFeeModal(false)
      setFeeFormData({ amount: '', feeYear: new Date().getFullYear(), notes: '' })
    } catch (err) {
      handleError(err, 'Failed to record fee')
    } finally {
      setIsSubmittingFee(false)
    }
  }

  const handleOpenPaymentModal = () => {
    const outstandingAmount = member.accountBalance < 0 ? Math.abs(member.accountBalance) : ''
    setPaymentFormData({
      amount: outstandingAmount,
      paymentDate: new Date().toISOString().split('T')[0],
      paymentMethod: 'bank_transfer',
      reference: '',
      notes: ''
    })
    setShowPaymentModal(true)
  }

  const handleAddComment = async (e) => {
    e.preventDefault()
    if (!newComment.trim()) return

    setIsSubmittingComment(true)
    try {
      await addMemberComment(
        id,
        newComment.trim(),
        currentUser.uid,
        currentUser.email
      )
      queryClient.invalidateQueries({ queryKey: memberKeys.detail(id) })
      setNewComment('')
      showSuccess('Comment added successfully!')
    } catch (err) {
      handleError(err, 'Failed to add comment')
    } finally {
      setIsSubmittingComment(false)
    }
  }

  const handleDeleteComment = async (commentId) => {
    if (!window.confirm('Are you sure you want to delete this comment?')) return

    try {
      await deleteMemberComment(id, commentId)
      queryClient.invalidateQueries({ queryKey: memberKeys.detail(id) })
      showSuccess('Comment deleted successfully!')
    } catch (err) {
      handleError(err, 'Failed to delete comment')
    }
  }

  const handleRecordPayment = async (e) => {
    e.preventDefault()

    const paymentData = {
      memberId: id,
      memberName: member.fullName,
      amount: parseFloat(paymentFormData.amount),
      paymentDate: paymentFormData.paymentDate,
      paymentMethod: paymentFormData.paymentMethod,
      reference: paymentFormData.reference,
      notes: paymentFormData.notes
    }

    recordPaymentMutation.mutate(
      { paymentData, userId: currentUser.uid },
      {
        onSuccess: () => {
          setShowPaymentModal(false)
          setPaymentFormData({
            amount: '',
            paymentDate: new Date().toISOString().split('T')[0],
            paymentMethod: 'bank_transfer',
            reference: '',
            notes: ''
          })
        }
      }
    )
  }

  const isLoading = memberLoading || paymentsLoading || feesLoading

  if (isLoading) {
    return (
      <div>
        <h1 className="text-3xl font-bold text-gray-900 mb-6">Member Detail</h1>
        <p className="text-gray-600">Loading member data...</p>
      </div>
    )
  }

  if (memberError || !member) {
    return (
      <div>
        <h1 className="text-3xl font-bold text-gray-900 mb-6">Member Detail</h1>
        <div className="bg-red-50 border border-red-200 rounded-md p-4">
          <p className="text-red-800">{memberError?.message || 'Member not found'}</p>
        </div>
        <Link to="/members" className="text-club-navy hover:text-club-navy-dark mt-4 inline-block">
          Back to Members
        </Link>
      </div>
    )
  }

  const age = member.dateOfBirth ? calculateAge(member.dateOfBirth) : null

  const getBalanceColor = (balance) => {
    if (balance > 0) return 'text-club-navy'
    if (balance < 0) return 'text-red-600'
    return 'text-gray-900'
  }

  return (
    <div>
      <PageBreadcrumb
        items={[
          { label: 'Members', href: '/members' },
          { label: member.fullName }
        ]}
      />

      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">{member.fullName}</h1>
          <p className="text-gray-600 mt-1">
            {category?.name || member.membershipCategory}
            {member.status === 'inactive' && ' (Inactive)'}
          </p>
        </div>
        <div className="flex gap-2">
          <Button onClick={handleGenerateWelcomeLetter} variant="ocean">
            Welcome Letter
          </Button>
          {member.accountBalance < 0 && (
            <Button onClick={handleGeneratePaymentReminder} variant="destructive">
              Payment Reminder
            </Button>
          )}
          {canEdit && (
            <Button variant="outline" asChild>
              <Link to={`/members/${id}/edit`}>Edit</Link>
            </Button>
          )}
          <Button variant="outline" asChild>
            <Link to="/members">Back to List</Link>
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Account Balance Card */}
        <div className="lg:col-span-3">
          <div className="bg-white shadow rounded-lg p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Account Balance</h3>
            <div className="flex items-center justify-between">
              <div>
                <p className={`text-4xl font-bold ${getBalanceColor(member.accountBalance || 0)}`}>
                  ${(member.accountBalance || 0).toFixed(2)}
                </p>
                <p className="text-gray-500 mt-1">
                  {member.accountBalance > 0 && 'Credit balance'}
                  {member.accountBalance < 0 && 'Outstanding balance'}
                  {member.accountBalance === 0 && 'Account fully paid'}
                </p>
              </div>
              {canEdit && (
                <div className="flex gap-2">
                  <Button onClick={handleOpenPaymentModal} variant="ocean">
                    Record Payment
                  </Button>
                  <Button onClick={handleOpenFeeModal} variant="destructive">
                    Record Fee
                  </Button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Personal Information */}
        <div className="lg:col-span-2">
          <div className="bg-white shadow rounded-lg p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Personal Information</h3>
            <dl className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <dt className="text-sm font-medium text-gray-500">Email</dt>
                <dd className="mt-1 text-sm text-gray-900">{member.email || 'N/A'}</dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-500">Mobile Phone</dt>
                <dd className="mt-1 text-sm text-gray-900">{member.phoneMobile || 'N/A'}</dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-500">Home Phone</dt>
                <dd className="mt-1 text-sm text-gray-900">{member.phoneHome || 'N/A'}</dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-500">Work Phone</dt>
                <dd className="mt-1 text-sm text-gray-900">{member.phoneWork || 'N/A'}</dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-500">Street Address</dt>
                <dd className="mt-1 text-sm text-gray-900">{member.streetAddress || 'N/A'}</dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-500">Suburb</dt>
                <dd className="mt-1 text-sm text-gray-900">{member.suburb || 'N/A'}</dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-500">State</dt>
                <dd className="mt-1 text-sm text-gray-900">{member.state || 'N/A'}</dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-500">Postcode</dt>
                <dd className="mt-1 text-sm text-gray-900">{member.postcode || 'N/A'}</dd>
              </div>
              <div className="md:col-span-2">
                <dt className="text-sm font-medium text-gray-500">Date of Birth</dt>
                <dd className="mt-1 text-sm text-gray-900">
                  {member.dateOfBirth || 'N/A'}
                  {age !== null && <span className="text-gray-500"> (Age: {age})</span>}
                </dd>
              </div>
            </dl>
          </div>
        </div>

        {/* Membership Information */}
        <div>
          <div className="bg-white shadow rounded-lg p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Membership</h3>
            <dl className="space-y-4">
              <div>
                <dt className="text-sm font-medium text-gray-500">Golf Australia ID</dt>
                <dd className="mt-1 text-sm text-gray-900">
                  {member.golfAustraliaId || 'Not provided'}
                </dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-500">Date Joined</dt>
                <dd className="mt-1 text-sm text-gray-900">{member.dateJoined}</dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-500">Category</dt>
                <dd className="mt-1 text-sm text-gray-900">{category?.name || member.membershipCategory}</dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-500">Annual Fee</dt>
                <dd className="mt-1 text-sm text-gray-900">${category?.annualFee || 0}</dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-500">Status</dt>
                <dd className="mt-1">
                  <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${member.status === 'active'
                    ? 'bg-club-tan-light bg-opacity-30 text-club-navy'
                    : 'bg-gray-100 text-gray-800'
                    }`}>
                    {member.status}
                  </span>
                </dd>
              </div>
            </dl>
          </div>
        </div>

        {/* Transaction History (Payments & Fees) */}
        <div className="lg:col-span-3">
          <div className="bg-white shadow rounded-lg p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Transaction History</h3>

            {payments.length === 0 && fees.length === 0 ? (
              <p className="text-gray-600">No transactions recorded yet</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Type
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Date
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Description
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Amount
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Reference
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {[
                      ...payments.map(p => ({ ...p, type: 'payment', date: p.paymentDate })),
                      ...fees.map(f => ({ ...f, type: 'fee', date: f.appliedDate }))
                    ]
                      .sort((a, b) => b.date.localeCompare(a.date))
                      .map((transaction, index) => (
                        <tr key={`${transaction.type}-${transaction.id || index}`}>
                          <td className="px-4 py-3 whitespace-nowrap text-sm">
                            {transaction.type === 'payment' ? (
                              <span className="px-2 py-1 bg-club-tan-light bg-opacity-30 text-club-navy rounded-full text-xs font-medium">
                                Payment
                              </span>
                            ) : (
                              <span className="px-2 py-1 bg-red-100 text-red-800 rounded-full text-xs font-medium">
                                Fee
                              </span>
                            )}
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
                            {transaction.date}
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-900">
                            {transaction.type === 'payment'
                              ? `${formatPaymentMethod(transaction.paymentMethod)} - ${transaction.receiptNumber}`
                              : transaction.notes}
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap text-sm font-medium">
                            {transaction.type === 'payment' ? (
                              <span className="text-club-navy">+${transaction.amount.toFixed(2)}</span>
                            ) : (
                              <span className="text-red-600">-${transaction.amount.toFixed(2)}</span>
                            )}
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-500">
                            {transaction.type === 'payment'
                              ? transaction.reference || '-'
                              : `${transaction.feeYear} Annual Fee`}
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">
                            {transaction.type === 'payment' && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handlePrintReceipt(transaction)}
                              >
                                Print
                              </Button>
                            )}
                          </td>
                        </tr>
                      ))}
                  </tbody>
                </table>

                <div className="mt-4 pt-4 border-t border-gray-200">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-gray-600">
                        Payments: <span className="font-medium">{payments.length}</span>
                      </p>
                      <p className="text-sm text-club-navy">
                        Total: <span className="font-medium">
                          +${payments.reduce((sum, p) => sum + p.amount, 0).toFixed(2)}
                        </span>
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">
                        Fees Applied: <span className="font-medium">{fees.length}</span>
                      </p>
                      <p className="text-sm text-red-600">
                        Total: <span className="font-medium">
                          -${fees.reduce((sum, f) => sum + f.amount, 0).toFixed(2)}
                        </span>
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Member Comments Section */}
        <div className="lg:col-span-3">
          <div className="bg-white shadow rounded-lg p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Notes & Comments</h3>

            {/* Add Comment Form */}
            {canEdit && (
              <form onSubmit={handleAddComment} className="mb-6">
                <div className="flex gap-2">
                  <textarea
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    placeholder="Add a note about this member..."
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-club-navy focus:border-club-navy text-sm resize-none"
                    rows={2}
                  />
                  <Button
                    type="submit"
                    variant="ocean"
                    disabled={isSubmittingComment || !newComment.trim()}
                    className="self-end"
                  >
                    {isSubmittingComment ? 'Adding...' : 'Add Note'}
                  </Button>
                </div>
              </form>
            )}

            {/* Comments List */}
            {(!member.comments || member.comments.length === 0) ? (
              <p className="text-gray-500 text-sm">No notes recorded yet</p>
            ) : (
              <div className="space-y-4">
                {member.comments.map((comment) => (
                  <div
                    key={comment.id}
                    className="border-l-4 border-club-navy pl-4 py-2 bg-gray-50 rounded-r"
                  >
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <p className="text-sm text-gray-900 whitespace-pre-wrap">{comment.text}</p>
                        <p className="text-xs text-gray-500 mt-2">
                          {new Date(comment.createdAt).toLocaleString('en-AU', {
                            day: '2-digit',
                            month: 'short',
                            year: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                          {' — '}
                          {comment.createdByName}
                        </p>
                      </div>
                      {canEdit && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDeleteComment(comment.id)}
                          className="text-red-600 hover:text-red-800 hover:bg-red-50"
                        >
                          Delete
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Record Fee Dialog */}
      <Dialog open={showFeeModal} onOpenChange={setShowFeeModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Record Fee</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-gray-600 mb-4">
            Recording fee for: <strong>{member.fullName}</strong>
          </p>

          <form onSubmit={handleRecordFee}>
            <div className="space-y-4">
              <div>
                <Label htmlFor="feeAmount">Amount ($)</Label>
                <Input
                  type="number"
                  id="feeAmount"
                  step="0.01"
                  min="0"
                  value={feeFormData.amount}
                  onChange={(e) => setFeeFormData({ ...feeFormData, amount: e.target.value })}
                  required
                />
              </div>

              <div>
                <Label htmlFor="feeYear">Fee Year</Label>
                <Input
                  type="number"
                  id="feeYear"
                  min="2020"
                  max="2030"
                  value={feeFormData.feeYear}
                  onChange={(e) => setFeeFormData({ ...feeFormData, feeYear: e.target.value })}
                  required
                />
              </div>

              <div>
                <Label htmlFor="feeNotes">Notes</Label>
                <Input
                  type="text"
                  id="feeNotes"
                  value={feeFormData.notes}
                  onChange={(e) => setFeeFormData({ ...feeFormData, notes: e.target.value })}
                  placeholder="e.g., 2025 Annual Membership Fee"
                />
              </div>
            </div>

            <DialogFooter className="mt-6">
              <Button
                type="button"
                variant="outline"
                onClick={() => setShowFeeModal(false)}
                disabled={isSubmittingFee}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                variant="destructive"
                disabled={isSubmittingFee}
              >
                {isSubmittingFee ? 'Recording...' : 'Record Fee'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Record Payment Dialog */}
      <Dialog open={showPaymentModal} onOpenChange={setShowPaymentModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Record Payment</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-gray-600 mb-4">
            Recording payment for: <strong>{member.fullName}</strong>
          </p>

          <form onSubmit={handleRecordPayment}>
            <div className="space-y-4">
              <div>
                <Label htmlFor="paymentAmount">Amount ($)</Label>
                <Input
                  type="number"
                  id="paymentAmount"
                  step="0.01"
                  min="0"
                  value={paymentFormData.amount}
                  onChange={(e) => setPaymentFormData({ ...paymentFormData, amount: e.target.value })}
                  required
                />
              </div>

              <div>
                <Label htmlFor="paymentDate">Payment Date</Label>
                <Input
                  type="date"
                  id="paymentDate"
                  value={paymentFormData.paymentDate}
                  onChange={(e) => setPaymentFormData({ ...paymentFormData, paymentDate: e.target.value })}
                  required
                />
              </div>

              <div>
                <Label htmlFor="paymentMethod">Payment Method</Label>
                <Select
                  value={paymentFormData.paymentMethod}
                  onValueChange={(value) => setPaymentFormData({ ...paymentFormData, paymentMethod: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select payment method" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="bank_transfer">Bank Transfer</SelectItem>
                    <SelectItem value="cash">Cash</SelectItem>
                    <SelectItem value="cheque">Cheque</SelectItem>
                    <SelectItem value="card">Card</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="paymentReference">Reference (optional)</Label>
                <Input
                  type="text"
                  id="paymentReference"
                  value={paymentFormData.reference}
                  onChange={(e) => setPaymentFormData({ ...paymentFormData, reference: e.target.value })}
                  placeholder="e.g., Transfer ID, Cheque number"
                />
              </div>

              <div>
                <Label htmlFor="paymentNotes">Notes (optional)</Label>
                <Input
                  type="text"
                  id="paymentNotes"
                  value={paymentFormData.notes}
                  onChange={(e) => setPaymentFormData({ ...paymentFormData, notes: e.target.value })}
                  placeholder="Any additional notes"
                />
              </div>
            </div>

            <DialogFooter className="mt-6">
              <Button
                type="button"
                variant="outline"
                onClick={() => setShowPaymentModal(false)}
                disabled={recordPaymentMutation.isPending}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                variant="ocean"
                disabled={recordPaymentMutation.isPending}
              >
                {recordPaymentMutation.isPending ? 'Recording...' : 'Record Payment'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}

export default MemberDetail
