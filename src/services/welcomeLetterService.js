import jsPDF from 'jspdf'
import { getMemberById } from './membersService'
import { getAllCategories } from './membershipCategories'
import { getPaymentsByMember } from './paymentsService'
import { getFeesByMember } from './feeService'

/**
 * Generate Welcome Letter and Information Pack PDF
 * @param {string} memberId - Member ID
 * @returns {Promise<boolean>} True if successful
 */
export const generateWelcomeLetter = async (memberId) => {
  try {
    // Get member details
    const member = await getMemberById(memberId)
    const categories = await getAllCategories()
    const category = categories.find(c => c.id === member.membershipCategory)

    // Create new PDF document
    const doc = new jsPDF()

    // Set up colors
    const primaryColor = [41, 128, 185] // Blue
    const textColor = [44, 62, 80] // Dark gray
    const lightGray = [128, 128, 128]

    // ===== PAGE 1: WELCOME LETTER =====

    // Club Logo Area / Header
    doc.setFillColor(41, 128, 185)
    doc.rect(0, 0, 210, 40, 'F')

    doc.setFontSize(28)
    doc.setTextColor(255, 255, 255)
    doc.setFont(undefined, 'bold')
    doc.text('Tea Tree Golf Club', 105, 20, { align: 'center' })

    doc.setFontSize(11)
    doc.setFont(undefined, 'normal')
    doc.text('10A Volcanic Drive, Brighton, Tasmania, 7030', 105, 28, { align: 'center' })
    doc.text('Tel: 03 6268 1692 | Email: teatreegolf@bigpond.com', 105, 34, { align: 'center' })

    // Date
    const today = new Date().toLocaleDateString('en-AU', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    })

    doc.setFontSize(10)
    doc.setTextColor(...textColor)
    doc.text(today, 20, 55)

    // Member Address
    let yPos = 65
    doc.text(member.fullName, 20, yPos)
    yPos += 5
    doc.text(member.address, 20, yPos)

    // Greeting
    yPos += 15
    doc.setFontSize(12)
    doc.setFont(undefined, 'bold')
    doc.text('WELCOME TO TEA TREE GOLF CLUB', 20, yPos)

    // Welcome Message
    yPos += 12
    doc.setFontSize(11)
    doc.setFont(undefined, 'normal')

    const welcomeText = `Dear ${member.fullName},

On behalf of the Committee and Members of Tea Tree Golf Club, I am delighted to welcome you as a new member of our club.

Tea Tree Golf Club has a proud history and a wonderful community of members who share a passion for golf. We are confident that you will enjoy the facilities, the course, and the friendly atmosphere that makes our club special.

Your membership details are as follows:`

    const welcomeLines = doc.splitTextToSize(welcomeText, 170)
    doc.text(welcomeLines, 20, yPos)
    yPos += welcomeLines.length * 5 + 5

    // Membership Details Box
    doc.setFillColor(240, 248, 255)
    doc.roundedRect(20, yPos, 170, 45, 2, 2, 'F')
    doc.setDrawColor(...primaryColor)
    doc.setLineWidth(0.5)
    doc.roundedRect(20, yPos, 170, 45, 2, 2, 'S')

    yPos += 8
    const lineHeight = 6

    doc.setFont(undefined, 'bold')
    doc.setTextColor(...primaryColor)
    doc.text('MEMBERSHIP DETAILS', 25, yPos)
    yPos += 8

    doc.setFontSize(10)
    doc.setTextColor(...textColor)

    // Member Name
    doc.setFont(undefined, 'bold')
    doc.text('Member Name:', 25, yPos)
    doc.setFont(undefined, 'normal')
    doc.text(member.fullName, 80, yPos)
    yPos += lineHeight

    // Membership Category
    doc.setFont(undefined, 'bold')
    doc.text('Membership Type:', 25, yPos)
    doc.setFont(undefined, 'normal')
    doc.text(category?.name || member.membershipCategory, 80, yPos)
    yPos += lineHeight

    // Playing Rights
    doc.setFont(undefined, 'bold')
    doc.text('Playing Rights:', 25, yPos)
    doc.setFont(undefined, 'normal')
    doc.text(category?.playingRights || 'Full playing rights', 80, yPos)
    yPos += lineHeight

    // Date Joined
    doc.setFont(undefined, 'bold')
    doc.text('Date Joined:', 25, yPos)
    doc.setFont(undefined, 'normal')
    doc.text(member.dateJoined, 80, yPos)
    yPos += lineHeight

    // Golf Australia ID
    if (member.golfAustraliaId) {
      doc.setFont(undefined, 'bold')
      doc.text('Golf Australia ID:', 25, yPos)
      doc.setFont(undefined, 'normal')
      doc.text(member.golfAustraliaId, 80, yPos)
    }

    // Continue with welcome message
    yPos += 15
    doc.setFontSize(11)
    doc.setFont(undefined, 'normal')

    const continueText = `We encourage you to get involved in club activities, competitions, and social events. Our club thrives on member participation, and we look forward to seeing you on the course.

If you have any questions or require assistance, please do not hesitate to contact the club office.

Once again, welcome to Tea Tree Golf Club. We wish you many enjoyable rounds of golf!`

    const continueLines = doc.splitTextToSize(continueText, 170)
    doc.text(continueLines, 20, yPos)
    yPos += continueLines.length * 5 + 10

    // Signature
    doc.setFont(undefined, 'normal')
    doc.text('Yours sincerely,', 20, yPos)
    yPos += 15
    doc.setFont(undefined, 'bold')
    doc.text('The Committee', 20, yPos)
    doc.setFont(undefined, 'normal')
    doc.text('Tea Tree Golf Club', 20, yPos + 5)

    // ===== PAGE 2: INFORMATION PACK =====
    doc.addPage()

    // Header for Page 2
    doc.setFillColor(41, 128, 185)
    doc.rect(0, 0, 210, 30, 'F')

    doc.setFontSize(20)
    doc.setTextColor(255, 255, 255)
    doc.setFont(undefined, 'bold')
    doc.text('Member Information Pack', 105, 20, { align: 'center' })

    yPos = 45
    doc.setFontSize(11)
    doc.setTextColor(...textColor)
    doc.setFont(undefined, 'normal')

    // Section 1: Contact Information
    doc.setFontSize(14)
    doc.setFont(undefined, 'bold')
    doc.setTextColor(...primaryColor)
    doc.text('Club Contact Information', 20, yPos)
    yPos += 8

    doc.setFontSize(10)
    doc.setFont(undefined, 'normal')
    doc.setTextColor(...textColor)

    doc.text('Address: 10A Volcanic Drive, Brighton, Tasmania, 7030', 20, yPos)
    yPos += 5
    doc.text('Telephone: 03 6268 1692', 20, yPos)
    yPos += 5
    doc.text('Email: teatreegolf@bigpond.com', 20, yPos)
    yPos += 5
    doc.text('Website: www.teatreegolfclub.com.au', 20, yPos)
    yPos += 12

    // Section 2: Playing Rights
    doc.setFontSize(14)
    doc.setFont(undefined, 'bold')
    doc.setTextColor(...primaryColor)
    doc.text('Your Playing Rights', 20, yPos)
    yPos += 8

    doc.setFontSize(10)
    doc.setFont(undefined, 'normal')
    doc.setTextColor(...textColor)

    doc.text(`As a ${category?.name || member.membershipCategory} member, you have:`, 20, yPos)
    yPos += 6
    doc.text(`• ${category?.playingRights || 'Full playing rights'}`, 25, yPos)
    yPos += 5
    doc.text('• Access to club facilities and amenities', 25, yPos)
    yPos += 5
    doc.text('• Participation in club competitions and events', 25, yPos)
    yPos += 5
    doc.text('• Voting rights at club meetings (full members)', 25, yPos)
    yPos += 12

    // Section 3: Course Etiquette
    doc.setFontSize(14)
    doc.setFont(undefined, 'bold')
    doc.setTextColor(...primaryColor)
    doc.text('Important Information', 20, yPos)
    yPos += 8

    doc.setFontSize(10)
    doc.setFont(undefined, 'normal')
    doc.setTextColor(...textColor)

    const etiquettePoints = [
      'Please observe all club rules and course etiquette',
      'Repair divots and pitch marks on greens',
      'Maintain pace of play - a round should take no more than 4 hours',
      'Observe dress code: collared shirts, tailored shorts/trousers',
      'Mobile phones should be on silent mode on the course',
      'Respect other members and guests at all times'
    ]

    etiquettePoints.forEach(point => {
      doc.text(`• ${point}`, 25, yPos)
      yPos += 6
    })

    yPos += 8

    // Section 4: Competitions
    doc.setFontSize(14)
    doc.setFont(undefined, 'bold')
    doc.setTextColor(...primaryColor)
    doc.text('Club Competitions', 20, yPos)
    yPos += 8

    doc.setFontSize(10)
    doc.setFont(undefined, 'normal')
    doc.setTextColor(...textColor)

    const compText = `Tea Tree Golf Club runs regular competitions throughout the year, including:

• Weekly competitions (check the notice board for details)
• Monthly medal events
• Club championships
• Social events and twilight golf

Competition sheets are available in the clubhouse. Please ensure you familiarize yourself with local rules and competition formats.`

    const compLines = doc.splitTextToSize(compText, 170)
    doc.text(compLines, 20, yPos)
    yPos += compLines.length * 5 + 10

    // Section 5: Fees & Payments
    doc.setFontSize(14)
    doc.setFont(undefined, 'bold')
    doc.setTextColor(...primaryColor)
    doc.text('Membership Fees & Payments', 20, yPos)
    yPos += 8

    doc.setFontSize(10)
    doc.setFont(undefined, 'normal')
    doc.setTextColor(...textColor)

    doc.text(`Annual Membership Fee: $${category?.annualFee || 'TBC'}`, 20, yPos)
    yPos += 6
    doc.text(`Current Account Balance: $${(member.accountBalance || 0).toFixed(2)}`, 20, yPos)
    yPos += 8

    const paymentText = `Membership fees are due annually. Payment can be made by:
• Bank transfer (please use your name as reference)
• Cash or cheque at the club office

Please contact the club office if you have any questions about your account.`

    const paymentLines = doc.splitTextToSize(paymentText, 170)
    doc.text(paymentLines, 20, yPos)

    // Footer
    const footerY = 280
    doc.setDrawColor(...primaryColor)
    doc.setLineWidth(0.5)
    doc.line(20, footerY, 190, footerY)

    doc.setFontSize(9)
    doc.setTextColor(...lightGray)
    doc.text('Tea Tree Golf Club - Member Information Pack', 105, footerY + 5, { align: 'center' })
    doc.setFontSize(8)
    doc.text(`Generated: ${new Date().toLocaleDateString()} ${new Date().toLocaleTimeString()}`, 105, footerY + 10, { align: 'center' })

    // Save the PDF
    const fileName = `Welcome-Letter-${member.fullName.replace(/\s+/g, '-')}.pdf`
    doc.save(fileName)

    return true
  } catch (error) {
    console.error('Error generating welcome letter:', error)
    throw error
  }
}

/**
 * Generate Payment Reminder Letter PDF
 * @param {string} memberId - Member ID
 * @returns {Promise<boolean>} True if successful
 */
export const generatePaymentReminder = async (memberId) => {
  try {
    // Get member details, payments, and fees
    const member = await getMemberById(memberId)
    const categories = await getAllCategories()
    const category = categories.find(c => c.id === member.membershipCategory)
    const payments = await getPaymentsByMember(memberId)
    const fees = await getFeesByMember(memberId)

    // Calculate totals
    const totalPayments = payments.reduce((sum, p) => sum + p.amount, 0)
    const totalFees = fees.reduce((sum, f) => sum + f.amount, 0)
    const balance = member.accountBalance || 0

    // Create new PDF document
    const doc = new jsPDF()

    // Set up colors
    const primaryColor = [41, 128, 185] // Blue
    const textColor = [44, 62, 80] // Dark gray
    const lightGray = [128, 128, 128]
    const redColor = [211, 47, 47]

    // ===== HEADER =====
    doc.setFillColor(41, 128, 185)
    doc.rect(0, 0, 210, 40, 'F')

    doc.setFontSize(28)
    doc.setTextColor(255, 255, 255)
    doc.setFont(undefined, 'bold')
    doc.text('Tea Tree Golf Club', 105, 20, { align: 'center' })

    doc.setFontSize(11)
    doc.setFont(undefined, 'normal')
    doc.text('10A Volcanic Drive, Brighton, Tasmania, 7030', 105, 28, { align: 'center' })
    doc.text('Tel: 03 6268 1692 | Email: teatreegolf@bigpond.com', 105, 34, { align: 'center' })

    // Date
    const today = new Date().toLocaleDateString('en-AU', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    })

    doc.setFontSize(10)
    doc.setTextColor(...textColor)
    doc.text(today, 20, 55)

    // Member Address
    let yPos = 65
    doc.text(member.fullName, 20, yPos)
    yPos += 5
    doc.text(member.address, 20, yPos)

    // Subject line
    yPos += 15
    doc.setFontSize(12)
    doc.setFont(undefined, 'bold')
    doc.text('RE: Outstanding Membership Account', 20, yPos)

    // Greeting
    yPos += 12
    doc.setFontSize(11)
    doc.setFont(undefined, 'normal')
    doc.text(`Dear ${member.fullName},`, 20, yPos)

    // Opening paragraph
    yPos += 10
    const openingText = `We hope you are enjoying your membership at Tea Tree Golf Club.

We are writing to you regarding your membership account, which currently has an outstanding balance. We kindly request that you attend to this matter at your earliest convenience.`

    const openingLines = doc.splitTextToSize(openingText, 170)
    doc.text(openingLines, 20, yPos)
    yPos += openingLines.length * 5 + 8

    // Account Summary Box
    doc.setFillColor(255, 245, 245) // Light red background
    doc.roundedRect(20, yPos, 170, 35, 2, 2, 'F')
    doc.setDrawColor(...redColor)
    doc.setLineWidth(0.5)
    doc.roundedRect(20, yPos, 170, 35, 2, 2, 'S')

    yPos += 8
    const lineHeight = 6

    doc.setFont(undefined, 'bold')
    doc.setTextColor(...redColor)
    doc.setFontSize(12)
    doc.text('ACCOUNT SUMMARY', 25, yPos)
    yPos += 8

    doc.setFontSize(10)
    doc.setTextColor(...textColor)

    // Outstanding Balance
    doc.setFont(undefined, 'bold')
    doc.text('Outstanding Balance:', 25, yPos)
    doc.setFont(undefined, 'bold')
    doc.setTextColor(...redColor)
    doc.setFontSize(14)
    doc.text(`$${Math.abs(balance).toFixed(2)}`, 80, yPos)
    yPos += 8

    doc.setFontSize(10)
    doc.setTextColor(...textColor)
    doc.setFont(undefined, 'normal')

    // Membership Type
    doc.setFont(undefined, 'bold')
    doc.text('Membership Type:', 25, yPos)
    doc.setFont(undefined, 'normal')
    doc.text(category?.name || member.membershipCategory, 80, yPos)

    yPos += 18

    // Transaction Details
    doc.setFontSize(12)
    doc.setFont(undefined, 'bold')
    doc.setTextColor(...primaryColor)
    doc.text('Account Details', 20, yPos)
    yPos += 8

    doc.setFontSize(10)
    doc.setTextColor(...textColor)
    doc.setFont(undefined, 'normal')

    // Table header
    doc.setFillColor(240, 248, 255)
    doc.rect(20, yPos - 2, 170, 8, 'F')
    doc.setFont(undefined, 'bold')
    doc.text('Description', 25, yPos + 3)
    doc.text('Amount', 165, yPos + 3, { align: 'right' })
    yPos += 10

    doc.setFont(undefined, 'normal')

    // Fees Applied
    if (fees.length > 0) {
      doc.setFont(undefined, 'bold')
      doc.text('Fees Applied:', 25, yPos)
      yPos += lineHeight

      doc.setFont(undefined, 'normal')
      fees.forEach(fee => {
        const description = `${fee.feeYear} ${fee.categoryName} Fee`
        doc.text(description, 30, yPos)
        doc.setTextColor(...redColor)
        doc.text(`-$${fee.amount.toFixed(2)}`, 165, yPos, { align: 'right' })
        doc.setTextColor(...textColor)
        yPos += lineHeight
      })
      yPos += 3
    }

    // Total Fees
    doc.setFont(undefined, 'bold')
    doc.text('Total Fees:', 25, yPos)
    doc.setTextColor(...redColor)
    doc.text(`-$${totalFees.toFixed(2)}`, 165, yPos, { align: 'right' })
    doc.setTextColor(...textColor)
    yPos += 8

    // Payments Received
    if (payments.length > 0) {
      doc.setFont(undefined, 'bold')
      doc.text('Payments Received:', 25, yPos)
      yPos += lineHeight

      doc.setFont(undefined, 'normal')
      payments.slice(0, 5).forEach(payment => {
        const description = `Payment - ${payment.paymentDate}`
        doc.text(description, 30, yPos)
        doc.setTextColor(46, 125, 50) // Green
        doc.text(`+$${payment.amount.toFixed(2)}`, 165, yPos, { align: 'right' })
        doc.setTextColor(...textColor)
        yPos += lineHeight
      })

      if (payments.length > 5) {
        doc.setFont(undefined, 'italic')
        doc.text(`... and ${payments.length - 5} more payment(s)`, 30, yPos)
        yPos += lineHeight
      }
      yPos += 3
    }

    // Total Payments
    doc.setFont(undefined, 'bold')
    doc.text('Total Payments:', 25, yPos)
    doc.setTextColor(46, 125, 50)
    doc.text(`+$${totalPayments.toFixed(2)}`, 165, yPos, { align: 'right' })
    doc.setTextColor(...textColor)
    yPos += 10

    // Balance line
    doc.setDrawColor(...primaryColor)
    doc.setLineWidth(0.5)
    doc.line(25, yPos, 185, yPos)
    yPos += 8

    // Current Balance
    doc.setFontSize(12)
    doc.setFont(undefined, 'bold')
    doc.text('Current Balance:', 25, yPos)
    doc.setTextColor(...redColor)
    doc.setFontSize(14)
    doc.text(`$${balance.toFixed(2)}`, 165, yPos, { align: 'right' })
    yPos += 15

    // Payment Instructions
    doc.setFontSize(12)
    doc.setFont(undefined, 'bold')
    doc.setTextColor(...primaryColor)
    doc.text('Payment Options', 20, yPos)
    yPos += 8

    doc.setFontSize(10)
    doc.setFont(undefined, 'normal')
    doc.setTextColor(...textColor)

    const paymentText = `To settle your outstanding balance of $${Math.abs(balance).toFixed(2)}, please use one of the following payment methods:

1. Bank Transfer
   Account Name: Tea Tree Golf Club
   BSB: [Your BSB]
   Account Number: [Your Account Number]
   Reference: ${member.fullName}

2. In Person
   Visit the club office during business hours with cash or cheque

3. Credit Card
   Contact the club office on 03 6268 1692

Please ensure you include your name as the payment reference to help us identify your payment promptly.`

    const paymentLines = doc.splitTextToSize(paymentText, 170)
    doc.text(paymentLines, 20, yPos)
    yPos += paymentLines.length * 5 + 10

    // Closing
    const closingText = `If you have already made payment, please accept our apologies for this reminder and disregard this letter.

Should you have any questions about your account or wish to discuss payment arrangements, please do not hesitate to contact us.

Thank you for your continued membership and support of Tea Tree Golf Club.`

    const closingLines = doc.splitTextToSize(closingText, 170)
    doc.text(closingLines, 20, yPos)
    yPos += closingLines.length * 5 + 8

    // Signature
    doc.setFont(undefined, 'normal')
    doc.text('Yours sincerely,', 20, yPos)
    yPos += 10
    doc.setFont(undefined, 'bold')
    doc.text('The Treasurer', 20, yPos)
    doc.setFont(undefined, 'normal')
    doc.text('Tea Tree Golf Club', 20, yPos + 5)

    // Footer
    const footerY = 280
    doc.setDrawColor(...primaryColor)
    doc.setLineWidth(0.5)
    doc.line(20, footerY, 190, footerY)

    doc.setFontSize(9)
    doc.setTextColor(...lightGray)
    doc.text('Tea Tree Golf Club - Payment Reminder', 105, footerY + 5, { align: 'center' })
    doc.setFontSize(8)
    doc.text(`Generated: ${new Date().toLocaleDateString()} ${new Date().toLocaleTimeString()}`, 105, footerY + 10, { align: 'center' })

    // Save the PDF
    const fileName = `Payment-Reminder-${member.fullName.replace(/\s+/g, '-')}.pdf`
    doc.save(fileName)

    return true
  } catch (error) {
    console.error('Error generating payment reminder:', error)
    throw error
  }
}
