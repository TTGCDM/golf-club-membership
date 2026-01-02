import { useState, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { getAllMembers } from '../services/membersService'
import { getAllPayments } from '../services/paymentsService'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'

// Sort indicator component - defined outside to prevent recreation on render
const SortIndicator = ({ column, sortColumn, sortDirection }) => {
  if (sortColumn !== column) return null
  return (
    <span className="ml-1">
      {sortDirection === 'asc' ? '↑' : '↓'}
    </span>
  )
}

const OutstandingBalances = ({ onRecordPayment }) => {
  const navigate = useNavigate()
  const [selectedMembers, setSelectedMembers] = useState(new Set())
  const [sortColumn, setSortColumn] = useState('balance')
  const [sortDirection, setSortDirection] = useState('asc')
  const [minAmount, setMinAmount] = useState(0)
  const [minDaysOverdue, setMinDaysOverdue] = useState(0)

  // Fetch members
  const { data: members = [] } = useQuery({
    queryKey: ['members'],
    queryFn: getAllMembers,
    staleTime: 5 * 60 * 1000,
  })

  // Fetch payments to calculate days since last payment
  const { data: payments = [] } = useQuery({
    queryKey: ['payments'],
    queryFn: getAllPayments,
    staleTime: 5 * 60 * 1000,
  })

  // Calculate members with outstanding balances
  const outstandingMembers = useMemo(() => {
    // Create a map of member ID to last payment date
    const lastPaymentMap = {}
    payments.forEach(payment => {
      const existing = lastPaymentMap[payment.memberId]
      if (!existing || new Date(payment.paymentDate) > new Date(existing)) {
        lastPaymentMap[payment.memberId] = payment.paymentDate
      }
    })

    const today = new Date()

    return members
      .filter(member => member.status === 'active' && member.accountBalance < 0)
      .map(member => {
        const lastPaymentDate = lastPaymentMap[member.id]
        let daysSincePayment = null

        if (lastPaymentDate) {
          const lastDate = new Date(lastPaymentDate)
          daysSincePayment = Math.floor((today - lastDate) / (1000 * 60 * 60 * 24))
        }

        return {
          ...member,
          balance: member.accountBalance,
          lastPaymentDate,
          daysSincePayment,
        }
      })
      .filter(member => {
        // Apply filters
        if (Math.abs(member.balance) < minAmount) return false
        if (minDaysOverdue > 0 && (member.daysSincePayment === null || member.daysSincePayment < minDaysOverdue)) return false
        return true
      })
  }, [members, payments, minAmount, minDaysOverdue])

  // Sort members
  const sortedMembers = useMemo(() => {
    return [...outstandingMembers].sort((a, b) => {
      let aValue, bValue

      switch (sortColumn) {
        case 'balance':
          aValue = Math.abs(a.balance)
          bValue = Math.abs(b.balance)
          break
        case 'name':
          aValue = a.fullName.toLowerCase()
          bValue = b.fullName.toLowerCase()
          break
        case 'days':
          aValue = a.daysSincePayment ?? Infinity
          bValue = b.daysSincePayment ?? Infinity
          break
        default:
          return 0
      }

      if (aValue < bValue) return sortDirection === 'asc' ? -1 : 1
      if (aValue > bValue) return sortDirection === 'asc' ? 1 : -1
      return 0
    })
  }, [outstandingMembers, sortColumn, sortDirection])

  const handleSort = (column) => {
    if (sortColumn === column) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc')
    } else {
      setSortColumn(column)
      setSortDirection('asc')
    }
  }

  const handleSelectAll = (checked) => {
    if (checked) {
      setSelectedMembers(new Set(sortedMembers.map(m => m.id)))
    } else {
      setSelectedMembers(new Set())
    }
  }

  const handleSelectMember = (memberId, checked) => {
    const newSelected = new Set(selectedMembers)
    if (checked) {
      newSelected.add(memberId)
    } else {
      newSelected.delete(memberId)
    }
    setSelectedMembers(newSelected)
  }

  const handleRecordPayment = (member) => {
    if (onRecordPayment) {
      onRecordPayment(member)
    } else {
      navigate(`/payments?member=${member.id}`)
    }
  }

  const totalOutstanding = sortedMembers.reduce((sum, m) => sum + Math.abs(m.balance), 0)
  const selectedTotal = sortedMembers
    .filter(m => selectedMembers.has(m.id))
    .reduce((sum, m) => sum + Math.abs(m.balance), 0)

  const formatDaysAgo = (days) => {
    if (days === null) return 'Never'
    if (days === 0) return 'Today'
    if (days === 1) return '1 day ago'
    return `${days} days ago`
  }

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex flex-wrap gap-4 items-center bg-white p-4 rounded-lg shadow-sm">
        <div className="flex items-center gap-2">
          <label className="text-sm text-gray-600">Min Amount:</label>
          <select
            value={minAmount}
            onChange={(e) => setMinAmount(Number(e.target.value))}
            className="rounded-md border border-gray-300 px-3 py-1.5 text-sm"
          >
            <option value={0}>Any</option>
            <option value={50}>{'>'} $50</option>
            <option value={100}>{'>'} $100</option>
            <option value={200}>{'>'} $200</option>
            <option value={500}>{'>'} $500</option>
          </select>
        </div>
        <div className="flex items-center gap-2">
          <label className="text-sm text-gray-600">Days Overdue:</label>
          <select
            value={minDaysOverdue}
            onChange={(e) => setMinDaysOverdue(Number(e.target.value))}
            className="rounded-md border border-gray-300 px-3 py-1.5 text-sm"
          >
            <option value={0}>Any</option>
            <option value={30}>{'>'} 30 days</option>
            <option value={60}>{'>'} 60 days</option>
            <option value={90}>{'>'} 90 days</option>
          </select>
        </div>
        <div className="flex-1" />
        <div className="text-sm text-gray-600">
          <span className="font-medium">{sortedMembers.length}</span> members owe{' '}
          <span className="font-medium text-red-600">${totalOutstanding.toFixed(2)}</span>
        </div>
      </div>

      {/* Summary when items selected */}
      {selectedMembers.size > 0 && (
        <div className="flex items-center gap-4 bg-club-tan-light bg-opacity-20 p-3 rounded-lg">
          <span className="text-sm">
            <span className="font-medium">{selectedMembers.size}</span> selected
          </span>
          <span className="text-sm">
            Total: <span className="font-medium text-red-600">${selectedTotal.toFixed(2)}</span>
          </span>
          <div className="flex-1" />
          <Button
            variant="outline"
            size="sm"
            onClick={() => setSelectedMembers(new Set())}
          >
            Clear Selection
          </Button>
        </div>
      )}

      {/* Table */}
      {sortedMembers.length === 0 ? (
        <div className="bg-white rounded-lg shadow-sm p-8 text-center">
          <p className="text-gray-600">No outstanding balances found</p>
          <p className="text-sm text-gray-400 mt-1">All active members are up to date!</p>
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow-sm overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-12">
                  <Checkbox
                    checked={selectedMembers.size === sortedMembers.length && sortedMembers.length > 0}
                    onCheckedChange={handleSelectAll}
                  />
                </TableHead>
                <TableHead
                  className="cursor-pointer hover:bg-gray-50"
                  onClick={() => handleSort('name')}
                >
                  Member <SortIndicator column="name" sortColumn={sortColumn} sortDirection={sortDirection} />
                </TableHead>
                <TableHead>Category</TableHead>
                <TableHead
                  className="cursor-pointer hover:bg-gray-50 text-right"
                  onClick={() => handleSort('balance')}
                >
                  Balance <SortIndicator column="balance" sortColumn={sortColumn} sortDirection={sortDirection} />
                </TableHead>
                <TableHead
                  className="cursor-pointer hover:bg-gray-50"
                  onClick={() => handleSort('days')}
                >
                  Last Payment <SortIndicator column="days" sortColumn={sortColumn} sortDirection={sortDirection} />
                </TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sortedMembers.map(member => (
                <TableRow key={member.id}>
                  <TableCell>
                    <Checkbox
                      checked={selectedMembers.has(member.id)}
                      onCheckedChange={(checked) => handleSelectMember(member.id, checked)}
                    />
                  </TableCell>
                  <TableCell>
                    <button
                      onClick={() => navigate(`/members/${member.id}`)}
                      className="text-club-navy hover:text-club-navy-dark font-medium"
                    >
                      {member.fullName}
                    </button>
                    {member.email && (
                      <div className="text-xs text-gray-500">{member.email}</div>
                    )}
                  </TableCell>
                  <TableCell>
                    <span className="text-sm text-gray-600">
                      {member.membershipCategory}
                    </span>
                  </TableCell>
                  <TableCell className="text-right">
                    <Badge variant="destructive">
                      -${Math.abs(member.balance).toFixed(2)}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <span className={`text-sm ${member.daysSincePayment > 60 ? 'text-red-600 font-medium' : 'text-gray-600'}`}>
                      {formatDaysAgo(member.daysSincePayment)}
                    </span>
                  </TableCell>
                  <TableCell className="text-right">
                    <Button
                      size="sm"
                      onClick={() => handleRecordPayment(member)}
                    >
                      Record Payment
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  )
}

export default OutstandingBalances
