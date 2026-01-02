import { useState, useMemo } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { getAllMembers } from '../services/membersService'
import { recordBulkPayments } from '../services/paymentsService'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog'
import {
  Command,
  CommandInput,
  CommandList,
  CommandEmpty,
  CommandGroup,
  CommandItem,
} from '@/components/ui/command'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Checkbox } from '@/components/ui/checkbox'
import { Progress } from '@/components/ui/progress'

const BulkPaymentEntry = ({ open, onOpenChange, userId }) => {
  const queryClient = useQueryClient()
  const [rows, setRows] = useState([createEmptyRow()])
  const [selectedRows, setSelectedRows] = useState(new Set())
  const [searchingRowIndex, setSearchingRowIndex] = useState(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [isProcessing, setIsProcessing] = useState(false)
  const [processProgress, setProcessProgress] = useState(0)
  const [error, setError] = useState(null)
  const [results, setResults] = useState(null)

  // Fetch members for search
  const { data: members = [] } = useQuery({
    queryKey: ['members'],
    queryFn: getAllMembers,
    staleTime: 5 * 60 * 1000,
  })

  // Filter active members for search
  const activeMembers = useMemo(() => {
    return members.filter(m => m.status === 'active')
  }, [members])

  // Filter members based on search query
  const filteredMembers = useMemo(() => {
    if (!searchQuery.trim()) return activeMembers.slice(0, 10)
    const query = searchQuery.toLowerCase()
    return activeMembers
      .filter(m =>
        m.fullName.toLowerCase().includes(query) ||
        m.email?.toLowerCase().includes(query) ||
        m.golfAustraliaId?.toLowerCase().includes(query)
      )
      .slice(0, 10)
  }, [activeMembers, searchQuery])

  function createEmptyRow() {
    return {
      id: Date.now() + Math.random(),
      member: null,
      amount: '',
      paymentDate: new Date().toISOString().split('T')[0],
      paymentMethod: 'bank_transfer',
      reference: '',
      isValid: false,
      error: null,
    }
  }

  const validateRow = (row) => {
    if (!row.member) return { isValid: false, error: 'Select a member' }
    if (!row.amount || parseFloat(row.amount) <= 0) return { isValid: false, error: 'Enter amount' }
    if (!row.paymentDate) return { isValid: false, error: 'Select date' }
    return { isValid: true, error: null }
  }

  const updateRow = (index, updates) => {
    setRows(prev => {
      const newRows = [...prev]
      newRows[index] = { ...newRows[index], ...updates }
      const validation = validateRow(newRows[index])
      newRows[index].isValid = validation.isValid
      newRows[index].error = validation.error
      return newRows
    })
  }

  const addRow = () => {
    setRows(prev => [...prev, createEmptyRow()])
  }

  const removeRow = (index) => {
    if (rows.length === 1) {
      setRows([createEmptyRow()])
    } else {
      setRows(prev => prev.filter((_, i) => i !== index))
    }
    setSelectedRows(prev => {
      const newSelected = new Set(prev)
      newSelected.delete(index)
      return newSelected
    })
  }

  const selectMember = (index, member) => {
    updateRow(index, {
      member,
      // Suggest amount based on outstanding balance
      amount: member.accountBalance < 0 ? Math.abs(member.accountBalance).toFixed(2) : '',
    })
    setSearchingRowIndex(null)
    setSearchQuery('')
  }

  const handleSelectAll = (checked) => {
    if (checked) {
      const validIndices = rows
        .map((row, index) => row.isValid ? index : null)
        .filter(i => i !== null)
      setSelectedRows(new Set(validIndices))
    } else {
      setSelectedRows(new Set())
    }
  }

  const handleSelectRow = (index, checked) => {
    const newSelected = new Set(selectedRows)
    if (checked) {
      newSelected.add(index)
    } else {
      newSelected.delete(index)
    }
    setSelectedRows(newSelected)
  }

  const validRows = rows.filter(r => r.isValid)
  const selectedValidRows = rows.filter((r, i) => r.isValid && selectedRows.has(i))
  const totalAmount = selectedValidRows.reduce((sum, r) => sum + parseFloat(r.amount || 0), 0)

  const handleProcess = async () => {
    if (selectedValidRows.length === 0) return

    setIsProcessing(true)
    setError(null)
    setProcessProgress(0)

    try {
      const paymentsToProcess = selectedValidRows.map(row => ({
        memberId: row.member.id,
        memberName: row.member.fullName,
        amount: row.amount,
        paymentDate: row.paymentDate,
        paymentMethod: row.paymentMethod,
        reference: row.reference,
      }))

      const result = await recordBulkPayments(paymentsToProcess, userId, (progress) => {
        setProcessProgress(progress)
      })

      setResults(result)

      // Invalidate queries to refresh data
      queryClient.invalidateQueries({ queryKey: ['payments'] })
      queryClient.invalidateQueries({ queryKey: ['members'] })

      // Remove successful rows
      const successIds = new Set(result.successful.map(r => r.memberId))
      setRows(prev => {
        const remaining = prev.filter(row => !row.member || !successIds.has(row.member.id))
        return remaining.length > 0 ? remaining : [createEmptyRow()]
      })
      setSelectedRows(new Set())

    } catch (err) {
      console.error('Bulk payment error:', err)
      setError(err.message || 'Failed to process payments')
    } finally {
      setIsProcessing(false)
    }
  }

  const handleClose = () => {
    if (!isProcessing) {
      setRows([createEmptyRow()])
      setSelectedRows(new Set())
      setSearchingRowIndex(null)
      setSearchQuery('')
      setError(null)
      setResults(null)
      onOpenChange(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle>Bulk Payment Entry</DialogTitle>
          <DialogDescription>
            Enter multiple payments at once. Search for members and enter payment details.
          </DialogDescription>
        </DialogHeader>

        {/* Results summary */}
        {results && (
          <div className="p-3 rounded-lg bg-success/10 border border-success/30">
            <p className="text-success font-medium">
              {results.successful.length} payments processed successfully
            </p>
            {results.failed.length > 0 && (
              <p className="text-red-600 text-sm mt-1">
                {results.failed.length} payments failed
              </p>
            )}
          </div>
        )}

        {/* Error message */}
        {error && (
          <div className="p-3 rounded-lg bg-red-50 border border-red-200">
            <p className="text-red-800">{error}</p>
          </div>
        )}

        {/* Progress bar */}
        {isProcessing && (
          <div className="space-y-2">
            <Progress value={processProgress} />
            <p className="text-sm text-gray-600 text-center">
              Processing payments... {Math.round(processProgress)}%
            </p>
          </div>
        )}

        {/* Payment rows table */}
        <div className="flex-1 overflow-auto min-h-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-10">
                  <Checkbox
                    checked={selectedRows.size === validRows.length && validRows.length > 0}
                    onCheckedChange={handleSelectAll}
                    disabled={isProcessing}
                  />
                </TableHead>
                <TableHead className="w-48">Member</TableHead>
                <TableHead className="w-28">Amount</TableHead>
                <TableHead className="w-32">Date</TableHead>
                <TableHead className="w-32">Method</TableHead>
                <TableHead>Reference</TableHead>
                <TableHead className="w-10"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((row, index) => (
                <TableRow key={row.id}>
                  <TableCell>
                    <Checkbox
                      checked={selectedRows.has(index)}
                      onCheckedChange={(checked) => handleSelectRow(index, checked)}
                      disabled={!row.isValid || isProcessing}
                    />
                  </TableCell>
                  <TableCell>
                    {searchingRowIndex === index ? (
                      <div className="relative">
                        <Command className="border rounded-md" shouldFilter={false}>
                          <CommandInput
                            placeholder="Search member..."
                            value={searchQuery}
                            onValueChange={setSearchQuery}
                            autoFocus
                          />
                          <CommandList>
                            <CommandEmpty>No members found</CommandEmpty>
                            <CommandGroup>
                              {filteredMembers.map(member => (
                                <CommandItem
                                  key={member.id}
                                  value={member.id}
                                  onSelect={() => selectMember(index, member)}
                                  onClick={() => selectMember(index, member)}
                                  className="cursor-pointer"
                                >
                                  <div className="flex flex-col">
                                    <span className="font-medium">{member.fullName}</span>
                                    <span className="text-xs text-gray-500">
                                      {member.email}
                                      {member.accountBalance < 0 && (
                                        <span className="text-red-600 ml-2">
                                          Owes ${Math.abs(member.accountBalance).toFixed(2)}
                                        </span>
                                      )}
                                    </span>
                                  </div>
                                </CommandItem>
                              ))}
                            </CommandGroup>
                          </CommandList>
                        </Command>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="absolute -top-1 -right-1"
                          onClick={() => {
                            setSearchingRowIndex(null)
                            setSearchQuery('')
                          }}
                        >
                          X
                        </Button>
                      </div>
                    ) : row.member ? (
                      <button
                        onClick={() => !isProcessing && setSearchingRowIndex(index)}
                        className="text-left hover:bg-gray-50 p-1 rounded w-full"
                        disabled={isProcessing}
                      >
                        <div className="font-medium text-sm">{row.member.fullName}</div>
                        {row.member.accountBalance < 0 && (
                          <Badge variant="destructive" className="text-xs">
                            Owes ${Math.abs(row.member.accountBalance).toFixed(2)}
                          </Badge>
                        )}
                      </button>
                    ) : (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setSearchingRowIndex(index)}
                        disabled={isProcessing}
                        className="w-full justify-start text-gray-500"
                      >
                        Search member...
                      </Button>
                    )}
                  </TableCell>
                  <TableCell>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      placeholder="0.00"
                      value={row.amount}
                      onChange={(e) => updateRow(index, { amount: e.target.value })}
                      disabled={isProcessing}
                      className="w-full px-2 py-1 border rounded text-sm"
                    />
                  </TableCell>
                  <TableCell>
                    <input
                      type="date"
                      value={row.paymentDate}
                      onChange={(e) => updateRow(index, { paymentDate: e.target.value })}
                      disabled={isProcessing}
                      className="w-full px-2 py-1 border rounded text-sm"
                    />
                  </TableCell>
                  <TableCell>
                    <select
                      value={row.paymentMethod}
                      onChange={(e) => updateRow(index, { paymentMethod: e.target.value })}
                      disabled={isProcessing}
                      className="w-full px-2 py-1 border rounded text-sm"
                    >
                      <option value="bank_transfer">Bank Transfer</option>
                      <option value="cash">Cash</option>
                    </select>
                  </TableCell>
                  <TableCell>
                    <input
                      type="text"
                      placeholder="Reference"
                      value={row.reference}
                      onChange={(e) => updateRow(index, { reference: e.target.value })}
                      disabled={isProcessing}
                      className="w-full px-2 py-1 border rounded text-sm"
                    />
                  </TableCell>
                  <TableCell>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => removeRow(index)}
                      disabled={isProcessing}
                      className="text-red-600 hover:text-red-800"
                    >
                      X
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>

        {/* Add row button */}
        <div className="flex justify-center py-2 border-t">
          <Button
            variant="outline"
            size="sm"
            onClick={addRow}
            disabled={isProcessing}
          >
            + Add Row
          </Button>
        </div>

        {/* Summary and actions */}
        <DialogFooter className="flex-col sm:flex-row gap-2 border-t pt-4">
          <div className="flex-1 text-sm text-gray-600">
            {selectedValidRows.length > 0 ? (
              <span>
                <span className="font-medium">{selectedValidRows.length}</span> payments selected |
                Total: <span className="font-medium text-club-navy">${totalAmount.toFixed(2)}</span>
              </span>
            ) : (
              <span>Select valid payments to process</span>
            )}
          </div>
          <Button variant="outline" onClick={handleClose} disabled={isProcessing}>
            Cancel
          </Button>
          <Button
            onClick={handleProcess}
            disabled={selectedValidRows.length === 0 || isProcessing}
          >
            {isProcessing ? 'Processing...' : `Process ${selectedValidRows.length} Payments`}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

export default BulkPaymentEntry
