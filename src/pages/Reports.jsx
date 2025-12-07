import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { getMembersWithOutstandingBalance, getMemberStats, downloadMembersCSV, getAllMembers } from '../services/membersService'
import { getPaymentStats, getAllPayments } from '../services/paymentsService'
import { getAllCategories } from '../services/membershipCategories'
import { handleError } from '@/utils/errorHandler'
import jsPDF from 'jspdf'

const Reports = () => {
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear())
  const [reportType, setReportType] = useState('outstanding')
  const [exportFormat, setExportFormat] = useState('csv')
  const [isGenerating, setIsGenerating] = useState(false)

  // Fetch outstanding members
  const { data: outstandingMembers = [], isLoading: outstandingLoading } = useQuery({
    queryKey: ['members', 'outstanding'],
    queryFn: getMembersWithOutstandingBalance,
    staleTime: 5 * 60 * 1000,
  })

  // Fetch member stats
  const { data: memberStats, isLoading: statsLoading } = useQuery({
    queryKey: ['members', 'stats'],
    queryFn: getMemberStats,
    staleTime: 5 * 60 * 1000,
  })

  // Fetch payment stats (depends on selected year)
  const { data: paymentStats, isLoading: paymentStatsLoading } = useQuery({
    queryKey: ['payments', 'stats', selectedYear],
    queryFn: () => getPaymentStats(selectedYear),
    staleTime: 5 * 60 * 1000,
  })

  // Fetch categories
  const { data: categories = [] } = useQuery({
    queryKey: ['categories'],
    queryFn: getAllCategories,
    staleTime: 30 * 60 * 1000,
  })

  const isLoading = outstandingLoading || statsLoading || paymentStatsLoading

  const handleExportOutstanding = () => {
    downloadMembersCSV(outstandingMembers, `outstanding-payments-${new Date().toISOString().split('T')[0]}.csv`)
  }

  const handleExportAllMembers = async () => {
    try {
      const allMembers = await getAllMembers()
      downloadMembersCSV(allMembers, `all-members-${new Date().toISOString().split('T')[0]}.csv`)
    } catch (error) {
      handleError(error, 'Failed to export members')
    }
  }

  const generateReport = async () => {
    setIsGenerating(true)
    try {
      let data = []
      let filename = ''
      let title = ''

      switch (reportType) {
        case 'outstanding':
          data = outstandingMembers.map(m => ({
            'Member Name': m.fullName,
            'Email': m.email || '',
            'Phone': m.phone || '',
            'Category': categories.find(c => c.id === m.membershipCategory)?.name || '',
            'Amount Owed': `$${Math.abs(m.accountBalance).toFixed(2)}`
          }))
          filename = `outstanding-payments-${new Date().toISOString().split('T')[0]}`
          title = 'Outstanding Payments Report'
          break

        case 'all-members': {
          const allMembers = await getAllMembers()
          data = allMembers.map(m => ({
            'Member Name': m.fullName,
            'Email': m.email || '',
            'Phone': m.phone || '',
            'Category': categories.find(c => c.id === m.membershipCategory)?.name || '',
            'Status': m.status,
            'Balance': `$${(m.accountBalance || 0).toFixed(2)}`,
            'Date Joined': m.dateJoined || ''
          }))
          filename = `all-members-${new Date().toISOString().split('T')[0]}`
          title = 'All Members Report'
          break
        }

        case 'active-members': {
          const allActive = await getAllMembers()
          const activeMembers = allActive.filter(m => m.status === 'active')
          data = activeMembers.map(m => ({
            'Member Name': m.fullName,
            'Email': m.email || '',
            'Phone': m.phone || '',
            'Category': categories.find(c => c.id === m.membershipCategory)?.name || '',
            'Balance': `$${(m.accountBalance || 0).toFixed(2)}`,
            'Date Joined': m.dateJoined || ''
          }))
          filename = `active-members-${new Date().toISOString().split('T')[0]}`
          title = 'Active Members Report'
          break
        }

        case 'payments': {
          const payments = await getAllPayments()
          const yearPayments = payments.filter(p => p.paymentDate && p.paymentDate.startsWith(selectedYear.toString()))
          data = yearPayments.map(p => ({
            'Date': p.paymentDate,
            'Receipt #': p.receiptNumber,
            'Member': p.memberName,
            'Amount': `$${p.amount.toFixed(2)}`,
            'Method': p.paymentMethod === 'bank_transfer' ? 'Bank Transfer' : 'Cash',
            'Reference': p.reference || '',
            'Recorded By': p.recordedBy
          }))
          filename = `payments-${selectedYear}-${new Date().toISOString().split('T')[0]}`
          title = `Payment History ${selectedYear}`
          break
        }

        default:
          return
      }

      if (exportFormat === 'csv') {
        exportToCSV(data, filename)
      } else {
        exportToPDF(data, title, filename)
      }
    } catch (error) {
      handleError(error, 'Failed to generate report')
    } finally {
      setIsGenerating(false)
    }
  }

  const exportToCSV = (data, filename) => {
    if (data.length === 0) {
      alert('No data to export')
      return
    }

    const headers = Object.keys(data[0])
    let csvRows = [
      headers.join(','),
      ...data.map(row => headers.map(header => `"${row[header]}"`).join(','))
    ]

    // Add total row for outstanding payments report
    if (reportType === 'outstanding') {
      const totalOwed = outstandingMembers.reduce((sum, m) => sum + Math.abs(m.accountBalance || 0), 0)
      const totalRow = headers.map(header => {
        if (header === 'Member Name') return '"TOTAL"'
        if (header === 'Amount Owed') return `"$${totalOwed.toFixed(2)}"`
        return '""'
      }).join(',')
      csvRows.push(totalRow)
    }

    const csvContent = csvRows.join('\n')

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    const url = URL.createObjectURL(blob)
    link.setAttribute('href', url)
    link.setAttribute('download', `${filename}.csv`)
    link.style.visibility = 'hidden'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  const exportToPDF = (data, title, filename) => {
    if (data.length === 0) {
      alert('No data to export')
      return
    }

    const doc = new jsPDF()
    const pageWidth = doc.internal.pageSize.getWidth()
    const pageHeight = doc.internal.pageSize.getHeight()
    let yPosition = 20

    // Title
    doc.setFontSize(18)
    doc.setTextColor(41, 128, 185)
    doc.text(title, pageWidth / 2, yPosition, { align: 'center' })
    yPosition += 10

    // Date
    doc.setFontSize(10)
    doc.setTextColor(100, 100, 100)
    doc.text(`Generated: ${new Date().toLocaleDateString()}`, pageWidth / 2, yPosition, { align: 'center' })
    yPosition += 15

    // Data
    doc.setFontSize(9)
    doc.setTextColor(44, 62, 80)

    const headers = Object.keys(data[0])
    const columnWidth = (pageWidth - 20) / headers.length
    const rowHeight = 8

    // Headers
    doc.setFont(undefined, 'bold')
    headers.forEach((header, i) => {
      doc.text(header, 10 + (i * columnWidth), yPosition)
    })
    yPosition += rowHeight

    // Data rows
    doc.setFont(undefined, 'normal')
    data.forEach((row) => {
      if (yPosition > pageHeight - 20) {
        doc.addPage()
        yPosition = 20

        // Re-print headers on new page
        doc.setFont(undefined, 'bold')
        headers.forEach((header, i) => {
          doc.text(header, 10 + (i * columnWidth), yPosition)
        })
        yPosition += rowHeight
        doc.setFont(undefined, 'normal')
      }

      headers.forEach((header, i) => {
        const text = String(row[header])
        const maxWidth = columnWidth - 2
        doc.text(text.substring(0, 25), 10 + (i * columnWidth), yPosition, { maxWidth })
      })
      yPosition += rowHeight
    })

    // Add total row for outstanding payments report
    if (reportType === 'outstanding') {
      const totalOwed = outstandingMembers.reduce((sum, m) => sum + Math.abs(m.accountBalance || 0), 0)
      yPosition += 3 // Add some space

      // Draw separator line
      doc.setDrawColor(200, 200, 200)
      doc.line(10, yPosition - 2, pageWidth - 10, yPosition - 2)

      doc.setFont(undefined, 'bold')
      headers.forEach((header, i) => {
        let text = ''
        if (header === 'Member Name') text = 'TOTAL'
        if (header === 'Amount Owed') text = `$${totalOwed.toFixed(2)}`

        const maxWidth = columnWidth - 2
        doc.text(text, 10 + (i * columnWidth), yPosition, { maxWidth })
      })
      yPosition += rowHeight
    }

    // Footer
    const totalPages = doc.internal.pages.length - 1
    for (let i = 1; i <= totalPages; i++) {
      doc.setPage(i)
      doc.setFontSize(8)
      doc.setTextColor(150, 150, 150)
      doc.text(`Page ${i} of ${totalPages}`, pageWidth / 2, pageHeight - 10, { align: 'center' })
      doc.text('Tea Tree Golf Club', pageWidth - 15, pageHeight - 10, { align: 'right' })
    }

    doc.save(`${filename}.pdf`)
  }

  if (isLoading) {
    return (
      <div>
        <h1 className="text-3xl font-bold text-gray-900 mb-6">Reports</h1>
        <p className="text-gray-600">Loading reports...</p>
      </div>
    )
  }

  return (
    <div>
      <h1 className="text-3xl font-bold text-gray-900 mb-6">Reports</h1>
      <p className="text-gray-600 mb-6">Financial reports and member statistics</p>

      {/* Year Selector */}
      <div className="mb-6 flex items-center gap-4">
        <label htmlFor="year" className="text-sm font-medium text-gray-700">
          Report Year:
        </label>
        <select
          id="year"
          value={selectedYear}
          onChange={(e) => setSelectedYear(parseInt(e.target.value))}
          className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-ocean-teal"
        >
          {[2024, 2025, 2026].map(year => (
            <option key={year} value={year}>{year}</option>
          ))}
        </select>
      </div>

      {/* Financial Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
        <div className="bg-white shadow rounded-lg p-6">
          <p className="text-sm font-medium text-gray-600">Total Members</p>
          <p className="text-3xl font-bold text-gray-900 mt-2">{memberStats?.total || 0}</p>
          <p className="text-sm text-gray-500 mt-1">{memberStats?.active || 0} active</p>
        </div>

        <div className="bg-white shadow rounded-lg p-6">
          <p className="text-sm font-medium text-gray-600">Total Outstanding</p>
          <p className="text-3xl font-bold text-red-600 mt-2">
            ${(memberStats?.totalOutstanding || 0).toFixed(2)}
          </p>
          <p className="text-sm text-gray-500 mt-1">{outstandingMembers.length} members</p>
        </div>

        <div className="bg-white shadow rounded-lg p-6">
          <p className="text-sm font-medium text-gray-600">Payments Received ({selectedYear})</p>
          <p className="text-3xl font-bold text-ocean-teal mt-2">
            ${(paymentStats?.totalAmount || 0).toFixed(2)}
          </p>
          <p className="text-sm text-gray-500 mt-1">{paymentStats?.totalCount || 0} payments</p>
        </div>

        <div className="bg-white shadow rounded-lg p-6">
          <p className="text-sm font-medium text-gray-600">Payment Methods</p>
          <div className="mt-2 space-y-1">
            <p className="text-sm text-gray-700">
              Bank: ${(paymentStats?.byMethod.bank_transfer || 0).toFixed(2)}
            </p>
            <p className="text-sm text-gray-700">
              Cash: ${(paymentStats?.byMethod.cash || 0).toFixed(2)}
            </p>
          </div>
        </div>
      </div>

      {/* Report Builder */}
      <div className="bg-white shadow rounded-lg p-6 mb-6">
        <div className="mb-4">
          <h2 className="text-lg font-semibold text-gray-900">Report Builder</h2>
          <p className="text-sm text-gray-600">Generate custom reports and export to PDF or CSV</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          {/* Report Type Selection */}
          <div>
            <label htmlFor="reportType" className="block text-sm font-medium text-gray-700 mb-2">
              Report Type
            </label>
            <select
              id="reportType"
              value={reportType}
              onChange={(e) => setReportType(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-ocean-teal"
            >
              <option value="outstanding">Outstanding Payments</option>
              <option value="all-members">All Members</option>
              <option value="active-members">Active Members Only</option>
              <option value="payments">Payment History ({selectedYear})</option>
            </select>
          </div>

          {/* Export Format Selection */}
          <div>
            <label htmlFor="exportFormat" className="block text-sm font-medium text-gray-700 mb-2">
              Export Format
            </label>
            <select
              id="exportFormat"
              value={exportFormat}
              onChange={(e) => setExportFormat(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-ocean-teal"
            >
              <option value="csv">CSV (Excel Compatible)</option>
              <option value="pdf">PDF Document</option>
            </select>
          </div>

          {/* Generate Button */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Action
            </label>
            <button
              onClick={generateReport}
              disabled={isGenerating}
              className="w-full px-4 py-2 bg-ocean-teal text-white rounded-md hover:bg-ocean-navy disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
            >
              {isGenerating ? (
                <>
                  <svg className="animate-spin h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Generating...
                </>
              ) : (
                <>
                  <svg className="h-5 w-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  Generate Report
                </>
              )}
            </button>
          </div>
        </div>

        {/* Report Description */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h3 className="text-sm font-semibold text-blue-900 mb-2">
            {reportType === 'outstanding' && 'Outstanding Payments Report'}
            {reportType === 'all-members' && 'All Members Report'}
            {reportType === 'active-members' && 'Active Members Report'}
            {reportType === 'payments' && `Payment History Report (${selectedYear})`}
          </h3>
          <p className="text-sm text-blue-800">
            {reportType === 'outstanding' && `Includes ${outstandingMembers.length} members with outstanding balances totaling $${(memberStats?.totalOutstanding || 0).toFixed(2)}`}
            {reportType === 'all-members' && `Includes all ${memberStats?.total || 0} members (active and inactive) with complete contact and membership details`}
            {reportType === 'active-members' && `Includes ${memberStats?.active || 0} active members with current membership status and balance information`}
            {reportType === 'payments' && `Includes ${paymentStats?.totalCount || 0} payments totaling $${(paymentStats?.totalAmount || 0).toFixed(2)} for the year ${selectedYear}`}
          </p>
          <div className="mt-3 text-xs text-blue-700">
            <strong>Fields included:</strong>
            {reportType === 'outstanding' && ' Member Name, Email, Phone, Category, Amount Owed (with TOTAL row)'}
            {reportType === 'all-members' && ' Member Name, Email, Phone, Category, Status, Balance, Date Joined'}
            {reportType === 'active-members' && ' Member Name, Email, Phone, Category, Balance, Date Joined'}
            {reportType === 'payments' && ' Date, Receipt #, Member, Amount, Payment Method, Reference, Recorded By'}
          </div>
        </div>
      </div>

      {/* Monthly Payment Breakdown */}
      {paymentStats && Object.keys(paymentStats.byMonth).length > 0 && (
        <div className="bg-white shadow rounded-lg p-6 mb-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            Monthly Payment Collection ({selectedYear})
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {Object.entries(paymentStats.byMonth).sort().map(([month, amount]) => (
              <div key={month} className="border border-gray-200 rounded-lg p-3">
                <p className="text-xs font-medium text-gray-600">{month}</p>
                <p className="text-lg font-bold text-gray-900 mt-1">
                  ${amount.toFixed(2)}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Export Options */}
      <div className="bg-white shadow rounded-lg p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Export Options</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <button
            onClick={handleExportAllMembers}
            className="flex items-center justify-center px-4 py-3 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition"
          >
            <svg className="h-5 w-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            Export All Members (CSV)
          </button>
          <button
            onClick={handleExportOutstanding}
            disabled={outstandingMembers.length === 0}
            className="flex items-center justify-center px-4 py-3 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <svg className="h-5 w-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            Export Outstanding Payments (CSV)
          </button>
        </div>
      </div>
    </div>
  )
}

export default Reports
