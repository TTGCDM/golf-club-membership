import { useState, useMemo } from 'react'
import { Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { Search } from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'
import { downloadMembersCSV, getAllMembers } from '../services/membersService'
import { getAllCategories } from '../services/membershipCategories'
import { Card, CardContent } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'

// SortIcon component moved outside to avoid re-creation during render
const SortIcon = ({ column, sortColumn, sortDirection }) => {
  if (sortColumn !== column) {
    return (
      <svg className="w-4 h-4 text-gray-400 ml-1 inline" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4" />
      </svg>
    )
  }
  if (sortDirection === 'asc') {
    return (
      <svg className="w-4 h-4 text-club-navy ml-1 inline" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
      </svg>
    )
  }
  return (
    <svg className="w-4 h-4 text-club-navy ml-1 inline" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
    </svg>
  )
}

const Members = () => {
  const { checkPermission, ROLES } = useAuth()
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [categoryFilter, setCategoryFilter] = useState('all')
  const [balanceFilter, setBalanceFilter] = useState('all')
  const [sortColumn, setSortColumn] = useState('fullName')
  const [sortDirection, setSortDirection] = useState('asc')

  const canEdit = checkPermission(ROLES.EDIT)

  // Fetch members with React Query (cached)
  const { data: members = [], isLoading: membersLoading } = useQuery({
    queryKey: ['members'],
    queryFn: getAllMembers,
    staleTime: 5 * 60 * 1000,    // Consider data fresh for 5 minutes
    cacheTime: 10 * 60 * 1000,   // Keep in cache for 10 minutes
  })

  // Fetch categories with React Query (cached)
  const { data: categories = [], isLoading: categoriesLoading } = useQuery({
    queryKey: ['categories'],
    queryFn: getAllCategories,
    staleTime: 10 * 60 * 1000,   // Categories change rarely, fresh for 10 minutes
    cacheTime: 30 * 60 * 1000,   // Keep in cache for 30 minutes
  })

  const isLoading = membersLoading || categoriesLoading

  // Derive filtered members using useMemo (not useEffect + useState)
  // This avoids infinite loops from array reference changes
  const filteredMembers = useMemo(() => {
    let filtered = [...members]

    // Apply search filter
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase()
      filtered = filtered.filter(member =>
        member.fullName?.toLowerCase().includes(searchLower) ||
        member.email?.toLowerCase().includes(searchLower) ||
        member.golfAustraliaId?.toLowerCase().includes(searchLower)
      )
    }

    // Apply status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter(member => member.status === statusFilter)
    }

    // Apply category filter
    if (categoryFilter !== 'all') {
      filtered = filtered.filter(member => member.membershipCategory === categoryFilter)
    }

    // Apply balance filter
    if (balanceFilter === 'positive') {
      filtered = filtered.filter(member => (member.accountBalance || 0) > 0)
    } else if (balanceFilter === 'negative') {
      filtered = filtered.filter(member => (member.accountBalance || 0) < 0)
    } else if (balanceFilter === 'zero') {
      filtered = filtered.filter(member => (member.accountBalance || 0) === 0)
    }

    return filtered
  }, [members, searchTerm, statusFilter, categoryFilter, balanceFilter])

  const handleExportCSV = () => {
    downloadMembersCSV(filteredMembers, `members-${new Date().toISOString().split('T')[0]}.csv`)
  }

  const getBalanceColor = (balance) => {
    if (balance > 0) return 'text-club-navy' // Positive = credit
    if (balance < 0) return 'text-red-600'   // Negative = owes money
    return 'text-gray-900'
  }

  const handleSort = (column) => {
    if (sortColumn === column) {
      // Toggle direction if clicking the same column
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc')
    } else {
      // Set new column and default to ascending
      setSortColumn(column)
      setSortDirection('asc')
    }
  }

  // Sort filtered members based on current sort settings
  const sortedMembers = [...filteredMembers].sort((a, b) => {
    let aValue = a[sortColumn]
    let bValue = b[sortColumn]

    // Handle different data types
    if (sortColumn === 'accountBalance') {
      aValue = parseFloat(aValue) || 0
      bValue = parseFloat(bValue) || 0
    } else if (typeof aValue === 'string') {
      aValue = aValue.toLowerCase()
      bValue = (bValue || '').toLowerCase()
    }

    if (aValue < bValue) return sortDirection === 'asc' ? -1 : 1
    if (aValue > bValue) return sortDirection === 'asc' ? 1 : -1
    return 0
  })

  if (isLoading) {
    return (
      <div>
        <h1 className="text-3xl font-bold text-gray-900 mb-6">Members</h1>
        <p className="text-gray-600">Loading members...</p>
      </div>
    )
  }

  return (
    <div>
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Members</h1>
          <p className="text-gray-600 mt-1">
            {filteredMembers.length} {filteredMembers.length === 1 ? 'member' : 'members'}
            {searchTerm || statusFilter !== 'all' || categoryFilter !== 'all' || balanceFilter !== 'all' ? ' (filtered)' : ''}
          </p>
        </div>
        {canEdit && (
          <Link
            to="/members/add"
            className="px-4 py-2 bg-club-navy text-white rounded-md hover:bg-club-navy-dark"
          >
            Add Member
          </Link>
        )}
      </div>

      {/* Filters */}
      <Card className="mb-6">
        <CardContent className="pt-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            <div className="md:col-span-2">
              <label htmlFor="search" className="block text-sm font-medium text-gray-700 mb-1">
                Search
              </label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="search"
                  placeholder="Search by name, email, or Golf Australia ID..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Status
              </label>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="All Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="inactive">Inactive</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Category
              </label>
              <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="All Categories" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  {categories.map(cat => (
                    <SelectItem key={cat.id} value={cat.id}>{cat.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Balance
              </label>
              <Select value={balanceFilter} onValueChange={setBalanceFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="All Balances" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Balances</SelectItem>
                  <SelectItem value="positive">Positive (Credit)</SelectItem>
                  <SelectItem value="negative">Negative (Owing)</SelectItem>
                  <SelectItem value="zero">Zero Balance</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="mt-4 flex justify-end">
            <button
              onClick={handleExportCSV}
              className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
            >
              Export to CSV
            </button>
          </div>
        </CardContent>
      </Card>

      {/* Members Table */}
      {filteredMembers.length === 0 ? (
        <Card>
          <CardContent className="py-6 text-center">
            <p className="text-gray-600">No members found</p>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead
                  onClick={() => handleSort('fullName')}
                  className="cursor-pointer hover:bg-muted/50"
                >
                  Name <SortIcon column="fullName" sortColumn={sortColumn} sortDirection={sortDirection} />
                </TableHead>
                <TableHead
                  onClick={() => handleSort('email')}
                  className="cursor-pointer hover:bg-muted/50"
                >
                  Email <SortIcon column="email" sortColumn={sortColumn} sortDirection={sortDirection} />
                </TableHead>
                <TableHead
                  onClick={() => handleSort('membershipCategory')}
                  className="cursor-pointer hover:bg-muted/50"
                >
                  Category <SortIcon column="membershipCategory" sortColumn={sortColumn} sortDirection={sortDirection} />
                </TableHead>
                <TableHead
                  onClick={() => handleSort('status')}
                  className="cursor-pointer hover:bg-muted/50"
                >
                  Status <SortIcon column="status" sortColumn={sortColumn} sortDirection={sortDirection} />
                </TableHead>
                <TableHead
                  onClick={() => handleSort('accountBalance')}
                  className="cursor-pointer hover:bg-muted/50"
                >
                  Balance <SortIcon column="accountBalance" sortColumn={sortColumn} sortDirection={sortDirection} />
                </TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sortedMembers.map(member => {
                const category = categories.find(c => c.id === member.membershipCategory)
                return (
                  <TableRow key={member.id}>
                    <TableCell>
                      <div className="font-medium">{member.fullName}</div>
                      {member.golfAustraliaId && (
                        <div className="text-sm text-muted-foreground">GA: {member.golfAustraliaId}</div>
                      )}
                    </TableCell>
                    <TableCell>{member.email}</TableCell>
                    <TableCell>{category?.name || member.membershipCategory}</TableCell>
                    <TableCell>
                      <Badge variant={member.status === 'active' ? 'default' : 'secondary'}>
                        {member.status}
                      </Badge>
                    </TableCell>
                    <TableCell className={`font-medium ${getBalanceColor(member.accountBalance || 0)}`}>
                      ${(member.accountBalance || 0).toFixed(2)}
                    </TableCell>
                    <TableCell>
                      <Link
                        to={`/members/${member.id}`}
                        className="text-club-navy hover:text-club-navy-dark mr-3"
                      >
                        View
                      </Link>
                      {canEdit && (
                        <Link
                          to={`/members/${member.id}/edit`}
                          className="text-club-navy hover:text-club-navy-dark"
                        >
                          Edit
                        </Link>
                      )}
                    </TableCell>
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>
        </Card>
      )}
    </div>
  )
}

export default Members
