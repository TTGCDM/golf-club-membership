import jsPDF from 'jspdf'
import { getMemberById } from './membersService'
import { getAllCategories } from './membershipCategories'

/**
 * Generate Welcome Letter and Information Pack PDF
 * Matches the original Tea Tree Golf Club templates
 * @param {string} memberId - Member ID
 * @returns {Promise<boolean>} True if successful
 */
export const generateWelcomeLetter = async (memberId) => {
  try {
    // Get member details
    const member = await getMemberById(memberId)
    const categories = await getAllCategories()
    const category = categories.find(c => c.id === member.membershipCategory)

    // Calculate amount owing (negative balance = owes money)
    const amountOwing = member.accountBalance < 0 ? Math.abs(member.accountBalance) : 0
    const amountPaid = member.accountBalance >= 0 ? member.accountBalance : 0

    // Parse name - handle "Last name, First name" format
    let displayName = member.fullName
    let firstName = member.fullName
    if (member.fullName && member.fullName.includes(',')) {
      const parts = member.fullName.split(',').map(p => p.trim())
      const lastName = parts[0]
      firstName = parts[1] || lastName
      displayName = `${firstName} ${lastName}`
    } else if (member.fullName && member.fullName.includes(' ')) {
      // If no comma, assume "First Last" format - first name is first word
      firstName = member.fullName.split(' ')[0]
    }

    // Create new PDF document
    const doc = new jsPDF()

    // Colors
    const blueColor = [0, 0, 255] // Blue for logo text
    const blackColor = [0, 0, 0]

    // ===== PAGE 1: MEMBERSHIP ACCEPTANCE LETTER =====

    // Header - Club Name
    doc.setFontSize(24)
    doc.setTextColor(...blueColor)
    doc.setFont('helvetica', 'bold')
    doc.text('Tea Tree Golf Club', 105, 25, { align: 'center' })

    // Club address
    doc.setFontSize(10)
    doc.setTextColor(...blackColor)
    doc.setFont('helvetica', 'normal')
    doc.text('10A Volcanic Drive, Brighton, Tasmania 7030', 105, 38, { align: 'center' })
    doc.text('Tel: 03 62681692 or Email: teatreegolf@bigpond.com', 105, 44, { align: 'center' })

    // Date
    const today = new Date().toLocaleDateString('en-AU', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    })

    let yPos = 60
    doc.setFontSize(11)
    doc.text(today, 20, yPos)

    // Member Name and Address
    yPos += 10
    doc.text(displayName, 20, yPos)
    yPos += 5
    if (member.address) {
      doc.text(member.address, 20, yPos)
      yPos += 5
    }

    // Greeting
    yPos += 8
    doc.text(`Dear ${firstName},`, 20, yPos)

    // Main body - approval message
    yPos += 10
    const categoryName = category?.name || member.membershipCategory || 'Full'

    let approvalText = `I am pleased to advise that your application for ${categoryName} Membership at Tea Tree Golf Club has been approved, subject to payment of your subscription fees.`

    if (amountPaid > 0 && amountOwing > 0) {
      approvalText += ` We have already received a $${amountPaid.toFixed(2)} payment toward your subscription, bringing your total amount owing to $${amountOwing.toFixed(2)}.`
    } else if (amountOwing > 0) {
      approvalText += ` Your total amount owing is $${amountOwing.toFixed(2)}.`
    } else {
      approvalText += ` Your subscription has been paid in full. Thank you!`
    }

    const approvalLines = doc.splitTextToSize(approvalText, 170)
    doc.text(approvalLines, 20, yPos)
    yPos += approvalLines.length * 5 + 8

    // Competition schedule
    doc.text('Organized competitions are held on the following days:', 20, yPos)
    yPos += 8

    const dayLabelX = 20
    const dayTextX = 50 // Aligned start position for all day descriptions

    // Saturdays
    doc.setFont('helvetica', 'bold')
    doc.text('Saturdays:', dayLabelX, yPos)
    doc.setFont('helvetica', 'normal')
    const satText = 'There is a draw for starting times from 7:30 AM – 8:30 AM with a break until 10:30 AM - 12:00 noon'
    const satLines = doc.splitTextToSize(satText, 140)
    doc.text(satLines, dayTextX, yPos)
    yPos += satLines.length * 5 + 3

    // Tuesdays
    doc.setFont('helvetica', 'bold')
    doc.text('Tuesdays:', dayLabelX, yPos)
    doc.setFont('helvetica', 'normal')
    doc.text('8:00 AM – 9:00 AM rolling start', dayTextX, yPos)
    yPos += 7

    // Wednesdays
    doc.setFont('helvetica', 'bold')
    doc.text('Wednesdays:', dayLabelX, yPos)
    doc.setFont('helvetica', 'normal')
    doc.text("Lady members' competitions are held at 9:30 AM for a 10:00 AM start.", dayTextX, yPos)
    yPos += 7

    // Thursdays
    doc.setFont('helvetica', 'bold')
    doc.text('Thursdays:', dayLabelX, yPos)
    doc.setFont('helvetica', 'normal')
    const thursText = 'During daylight saving periods, a twilight competition is held. This is a nine-hole Stableford event commencing from 3:00 PM and is open to all members and visitors.'
    const thursLines = doc.splitTextToSize(thursText, 140)
    doc.text(thursLines, dayTextX, yPos)
    yPos += thursLines.length * 5 + 5

    // Website info
    const websiteText = 'Information about Tea Tree Golf Club, including fixtures and results, can be found on our website: www.teatreegolfclub.com.au. We also have a Facebook page; please send a request to join.'
    const websiteLines = doc.splitTextToSize(websiteText, 170)
    doc.text(websiteLines, 20, yPos)
    yPos += websiteLines.length * 5 + 5

    // GolfLink info
    doc.text('To obtain a GolfLink handicap, players are required to return three (3) competition cards.', 20, yPos)
    yPos += 10

    // Payment request if amount owing
    if (amountOwing > 0) {
      const paymentRequestText = `To finalise your membership, please arrange payment of $${amountOwing.toFixed(2)} at your earliest convenience using the bank details below.`
      const paymentRequestLines = doc.splitTextToSize(paymentRequestText, 170)
      doc.text(paymentRequestLines, 20, yPos)
      yPos += paymentRequestLines.length * 5 + 5
    }

    // Closing
    doc.text('I trust you will enjoy your membership at Tea Tree Golf Club.', 20, yPos)
    yPos += 12

    // Signature
    doc.text('Yours sincerely,', 20, yPos)
    yPos += 12
    doc.text('David Moore', 20, yPos)
    yPos += 5
    doc.text('Secretary', 20, yPos)

    // Payment footer - always show but highlight amount if owing
    yPos = 265
    doc.setFontSize(10)
    if (amountOwing > 0) {
      doc.setFont('helvetica', 'bold')
      doc.text(`Amount to pay: $${amountOwing.toFixed(2)}`, 105, yPos, { align: 'center' })
      yPos += 6
    }
    doc.setFont('helvetica', 'bold')
    doc.text('Payment to be made via EFT:', 20, yPos)
    doc.setFont('helvetica', 'normal')
    doc.text('NAME: Tea Tree Golf Club Inc  BSB: 067 101  NUMBER: 2802 5959', 75, yPos)
    yPos += 5
    doc.setFont('helvetica', 'bold')
    doc.text('REFERENCE:', 85, yPos)
    doc.setFont('helvetica', 'normal')
    doc.text(` ${displayName}`, 110, yPos)

    // ===== PAGE 2: INFORMATION PACK =====
    doc.addPage()

    // Header - Club Name
    doc.setFontSize(24)
    doc.setTextColor(...blueColor)
    doc.setFont('helvetica', 'bold')
    doc.text('Tea Tree Golf Club', 105, 25, { align: 'center' })

    // Club address
    doc.setFontSize(10)
    doc.setTextColor(...blackColor)
    doc.setFont('helvetica', 'normal')
    doc.text('10A Volcanic Drive, Brighton, Tasmania 7030', 105, 38, { align: 'center' })
    doc.text('Tel: 03 62681692 or Email: teatreegolf@bigpond.com', 105, 44, { align: 'center' })

    // Title
    yPos = 65
    doc.setFontSize(14)
    doc.setFont('helvetica', 'bold')
    doc.text('Membership accepted', 105, yPos, { align: 'center' })
    // Underline
    doc.setLineWidth(0.5)
    doc.setDrawColor(...blackColor)
    const titleWidth = doc.getTextWidth('Membership accepted')
    doc.line(105 - titleWidth/2, yPos + 1, 105 + titleWidth/2, yPos + 1)

    // Intro paragraph
    yPos += 12
    doc.setFontSize(11)
    doc.setFont('helvetica', 'normal')
    const introText = 'Congratulations and thank you for choosing to become a member of the Tea Tree Golf Club. Now that you are a member, we need to share a few key points so you can take full advantage of our facilities.'
    const introLines = doc.splitTextToSize(introText, 170)
    doc.text(introLines, 20, yPos)
    yPos += introLines.length * 5 + 8

    // Use of the course
    doc.setFont('helvetica', 'bold')
    doc.text('Use of the course:', 20, yPos)
    yPos += 6
    doc.setFont('helvetica', 'normal')
    const courseText = 'You can use the course for social play at any time outside of organised competitions free of charge. We would ask that you ensure any non-members who play with you pay the required green fees before commencing play.'
    const courseLines = doc.splitTextToSize(courseText, 170)
    doc.text(courseLines, 20, yPos)
    yPos += courseLines.length * 5 + 6

    // Competitions
    doc.setFont('helvetica', 'bold')
    doc.text('Competitions:', 20, yPos)
    yPos += 6
    doc.setFont('helvetica', 'normal')
    doc.text("Official competitions are held across the week and the schedule can be viewed online on the club's website.", 20, yPos)
    yPos += 6
    doc.setTextColor(...blueColor)
    doc.text('https://www.teatreegolfclub.com.au/', 20, yPos)
    doc.setTextColor(...blackColor)
    yPos += 6
    const compText = 'For Saturday competitions we recommend you book your tee time online, for other competitions you can just turn up to the club and the captain will assign you to a group.'
    const compLines = doc.splitTextToSize(compText, 170)
    doc.text(compLines, 20, yPos)
    yPos += compLines.length * 5 + 6

    // Handicaps
    doc.setFont('helvetica', 'bold')
    doc.text('Handicaps:', 20, yPos)
    yPos += 6
    doc.setFont('helvetica', 'normal')
    const handicapText = 'If you possess a current GA handicap, you will be eligible to participate in all club competitions. If you do not, please contact the club captain (David Manning 0407495664) to commence the process for submitting the required number of cards to facilitate this. You will need to complete rounds within organised club competitions to receive a GA handicap, but while undertaking this process you will be ineligible to win any events.'
    const handicapLines = doc.splitTextToSize(handicapText, 170)
    doc.text(handicapLines, 20, yPos)
    yPos += handicapLines.length * 5 + 6

    // Code of conduct
    doc.setFont('helvetica', 'bold')
    doc.text('Code of conduct:', 20, yPos)
    yPos += 6
    doc.setFont('helvetica', 'normal')
    const conductText = "As a member of the Tea Tree Golf Club, we are all required to act and behave as per the guidelines within the club's code of conduct, please take the time to review these."
    const conductLines = doc.splitTextToSize(conductText, 170)
    doc.text(conductLines, 20, yPos)
    yPos += conductLines.length * 5 + 2
    doc.setTextColor(...blueColor)
    doc.text('Tea Tree Golf Club Code of Conduct 2015', 20, yPos)
    doc.setTextColor(...blackColor)
    yPos += 8

    // Outstanding payments
    doc.setFont('helvetica', 'bold')
    doc.text('Outstanding payments:', 20, yPos)
    yPos += 6
    doc.setFont('helvetica', 'normal')
    const paymentIntro = 'If you have any outstanding owing on your club membership, we ask that you contact the treasurer to organise a plan to finalise this at your earliest convenience. Payments may be made via direct deposit as follows:'
    const paymentIntroLines = doc.splitTextToSize(paymentIntro, 170)
    doc.text(paymentIntroLines, 20, yPos)
    yPos += paymentIntroLines.length * 5 + 4

    doc.setFont('helvetica', 'bold')
    doc.text('Account Name:', 20, yPos)
    doc.setFont('helvetica', 'normal')
    doc.text(' Tea Tree Golf Club', 52, yPos)
    yPos += 5
    doc.setFont('helvetica', 'bold')
    doc.text('BSB:', 20, yPos)
    doc.setFont('helvetica', 'normal')
    doc.text(' 067101  Account : 2802 5959', 30, yPos)
    yPos += 5
    doc.setFont('helvetica', 'bold')
    doc.text('Reference:', 20, yPos)
    doc.setFont('helvetica', 'normal')
    doc.text(' Full name', 42, yPos)
    yPos += 5
    doc.setFont('helvetica', 'bold')
    doc.text("Treasurers contact details", 20, yPos)
    doc.setFont('helvetica', 'normal')
    doc.text(' - Kathy Manning 0408 521 963 katmanning4@yahoo.com', 65, yPos)
    yPos += 8

    // Facebook
    const fbText = 'We invite you to join our club group on Facebook, Tea Tree Golf Club, where club updates and competition results are shared.'
    const fbLines = doc.splitTextToSize(fbText, 170)
    doc.text(fbLines, 20, yPos)
    yPos += fbLines.length * 5 + 12

    // Welcome message
    doc.setFont('helvetica', 'bold')
    doc.text('Welcome to the club!', 105, yPos, { align: 'center' })

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
    // Get member details
    const member = await getMemberById(memberId)
    const categories = await getAllCategories()
    const category = categories.find(c => c.id === member.membershipCategory)

    // Calculate amount owing (negative balance = owes money)
    const amountOwing = member.accountBalance < 0 ? Math.abs(member.accountBalance) : 0

    // Parse name - handle "Last name, First name" format
    let displayName = member.fullName
    let firstName = member.fullName
    if (member.fullName && member.fullName.includes(',')) {
      const parts = member.fullName.split(',').map(p => p.trim())
      const lastName = parts[0]
      firstName = parts[1] || lastName
      displayName = `${firstName} ${lastName}`
    } else if (member.fullName && member.fullName.includes(' ')) {
      firstName = member.fullName.split(' ')[0]
    }

    // Create new PDF document
    const doc = new jsPDF()

    // Colors
    const blueColor = [0, 0, 255]
    const blackColor = [0, 0, 0]

    // Header - Club Name
    doc.setFontSize(24)
    doc.setTextColor(...blueColor)
    doc.setFont('helvetica', 'bold')
    doc.text('Tea Tree Golf Club', 105, 25, { align: 'center' })

    // Club address
    doc.setFontSize(10)
    doc.setTextColor(...blackColor)
    doc.setFont('helvetica', 'normal')
    doc.text('10A Volcanic Drive, Brighton, Tasmania 7030', 105, 38, { align: 'center' })
    doc.text('Tel: 03 62681692 or Email: teatreegolf@bigpond.com', 105, 44, { align: 'center' })

    // Date
    const today = new Date().toLocaleDateString('en-AU', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    })

    let yPos = 60
    doc.setFontSize(11)
    doc.text(today, 20, yPos)

    // Member Name and Address
    yPos += 10
    doc.text(displayName, 20, yPos)
    yPos += 5
    if (member.address) {
      doc.text(member.address, 20, yPos)
      yPos += 5
    }

    // Greeting
    yPos += 8
    doc.text(`Dear ${firstName},`, 20, yPos)

    // Main body
    yPos += 10
    const categoryName = category?.name || member.membershipCategory || 'Full'

    const openingText = `We hope you are enjoying your membership at Tea Tree Golf Club. We are writing to advise that your ${categoryName} Membership account currently has an outstanding balance of $${amountOwing.toFixed(2)}.`

    const openingLines = doc.splitTextToSize(openingText, 170)
    doc.text(openingLines, 20, yPos)
    yPos += openingLines.length * 5 + 8

    // Payment request
    const paymentRequestText = `We kindly request that you arrange payment of $${amountOwing.toFixed(2)} at your earliest convenience using the bank details provided below.`
    const paymentRequestLines = doc.splitTextToSize(paymentRequestText, 170)
    doc.text(paymentRequestLines, 20, yPos)
    yPos += paymentRequestLines.length * 5 + 8

    // If already paid notice
    const noticeText = 'If you have already made this payment, please accept our apologies and disregard this reminder.'
    const noticeLines = doc.splitTextToSize(noticeText, 170)
    doc.text(noticeLines, 20, yPos)
    yPos += noticeLines.length * 5 + 8

    // Contact info
    const contactText = 'Should you have any questions about your account or wish to discuss payment arrangements, please do not hesitate to contact the treasurer:'
    const contactLines = doc.splitTextToSize(contactText, 170)
    doc.text(contactLines, 20, yPos)
    yPos += contactLines.length * 5 + 5

    doc.text('Kathy Manning - 0408 521 963 - katmanning4@yahoo.com', 20, yPos)
    yPos += 10

    // Closing
    doc.text('Thank you for your continued membership and support of Tea Tree Golf Club.', 20, yPos)
    yPos += 12

    // Signature
    doc.text('Yours sincerely,', 20, yPos)
    yPos += 12
    doc.text('Kathy Manning', 20, yPos)
    yPos += 5
    doc.text('Treasurer', 20, yPos)

    // Payment footer - same as welcome letter
    yPos = 265
    doc.setFontSize(10)
    doc.setFont('helvetica', 'bold')
    doc.text(`Amount to pay: $${amountOwing.toFixed(2)}`, 105, yPos, { align: 'center' })
    yPos += 6
    doc.text('Payment to be made via EFT:', 20, yPos)
    doc.setFont('helvetica', 'normal')
    doc.text('NAME: Tea Tree Golf Club Inc  BSB: 067 101  NUMBER: 2802 5959', 75, yPos)
    yPos += 5
    doc.setFont('helvetica', 'bold')
    doc.text('REFERENCE:', 85, yPos)
    doc.setFont('helvetica', 'normal')
    doc.text(` ${displayName}`, 110, yPos)

    // Save the PDF
    const fileName = `Payment-Reminder-${displayName.replace(/\s+/g, '-')}.pdf`
    doc.save(fileName)

    return true
  } catch (error) {
    console.error('Error generating payment reminder:', error)
    throw error
  }
}

/**
 * Get all members with outstanding balances (negative account balance)
 * @returns {Promise<Array>} Array of members with outstanding balances
 */
export const getMembersWithOutstandingBalance = async () => {
  const { getAllMembers } = await import('./membersService')
  const members = await getAllMembers()

  // Filter active members with negative balance (owing money)
  return members
    .filter(m => m.status === 'active' && m.accountBalance < 0)
    .sort((a, b) => a.accountBalance - b.accountBalance) // Most owing first
}

/**
 * Generate bulk payment reminder PDFs for all members with outstanding balances
 * Downloads each PDF individually with a short delay to prevent browser issues
 * @param {Function} onProgress - Callback function called with progress updates { current, total, memberName }
 * @returns {Promise<Object>} Results { successful, failed, total, details }
 */
export const generateBulkPaymentReminders = async (onProgress = null) => {
  try {
    const members = await getMembersWithOutstandingBalance()

    const results = {
      successful: 0,
      failed: 0,
      total: members.length,
      details: []
    }

    for (let i = 0; i < members.length; i++) {
      const member = members[i]

      if (onProgress) {
        onProgress({
          current: i + 1,
          total: members.length,
          memberName: member.fullName
        })
      }

      try {
        await generatePaymentReminder(member.id)
        results.successful++
        results.details.push({
          memberId: member.id,
          memberName: member.fullName,
          amountOwing: Math.abs(member.accountBalance),
          status: 'success'
        })
      } catch (error) {
        results.failed++
        results.details.push({
          memberId: member.id,
          memberName: member.fullName,
          amountOwing: Math.abs(member.accountBalance),
          status: 'failed',
          error: error.message
        })
      }

      // Small delay between downloads to prevent browser issues
      if (i < members.length - 1) {
        await new Promise(resolve => setTimeout(resolve, 500))
      }
    }

    return results
  } catch (error) {
    console.error('Error generating bulk payment reminders:', error)
    throw error
  }
}
