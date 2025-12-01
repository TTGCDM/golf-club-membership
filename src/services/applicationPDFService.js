import jsPDF from 'jspdf'

/**
 * Generate PDF matching the paper membership application form
 * Pre-fills applicant data, leaves signature lines blank
 * @param {Object} application - Application data
 */
export const generateApplicationPDF = (application) => {
  try {
    // Create new PDF document (A4 portrait)
    const doc = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4'
    })

    // Colors
    const primaryColor = [41, 128, 185] // Blue
    const textColor = [0, 0, 0] // Black

    // Page margins
    const marginLeft = 20
    const marginRight = 20
    const pageWidth = 210 // A4 width in mm
    const contentWidth = pageWidth - marginLeft - marginRight

    let yPos = 20

    // Header - Club Name and Logo
    doc.setFontSize(24)
    doc.setFont('helvetica', 'bold')
    doc.setTextColor(...textColor)
    doc.text('Tea Tree Golf Club', pageWidth / 2, yPos, { align: 'center' })

    yPos += 10

    // Club Address
    doc.setFontSize(10)
    doc.setFont('helvetica', 'normal')
    doc.text('10A Volcanic Drive, Brighton, Tasmania, 7030', pageWidth / 2, yPos, { align: 'center' })
    yPos += 5
    doc.text('Tel: 03 6268 1692 or Email: teatreegolf@bigpond.com', pageWidth / 2, yPos, { align: 'center' })

    yPos += 15

    // Title
    doc.setFontSize(16)
    doc.setFont('helvetica', 'bold')
    doc.text('Nomination for Membership', pageWidth / 2, yPos, { align: 'center' })

    yPos += 15

    // Helper function to draw field with value
    const drawField = (label, value, y) => {
      doc.setFontSize(11)
      doc.setFont('helvetica', 'bold')
      doc.text(label, marginLeft, y)

      doc.setFont('helvetica', 'normal')
      const valueX = marginLeft + doc.getTextWidth(label) + 2
      doc.text(value || '', valueX, y)

      // Draw underline
      const lineY = y + 1
      const lineEndX = marginLeft + contentWidth
      doc.setDrawColor(0, 0, 0)
      doc.setLineWidth(0.2)
      doc.line(valueX - 1, lineY, lineEndX, lineY)
    }

    // Name with title
    const fullNameWithTitle = application.title
      ? `(${application.title}) ${application.fullName}`
      : application.fullName
    drawField('Name:', fullNameWithTitle, yPos)
    yPos += 10

    // Address
    const fullAddress = `${application.streetAddress}, ${application.suburb}, ${application.state}`
    doc.setFontSize(11)
    doc.setFont('helvetica', 'bold')
    doc.text('Address:', marginLeft, yPos)
    doc.setFont('helvetica', 'normal')
    const addressX = marginLeft + doc.getTextWidth('Address:') + 2
    doc.text(fullAddress, addressX, yPos)

    // Postcode on same line
    const postcodeLabel = 'Post Code:'
    const postcodeX = marginLeft + contentWidth - doc.getTextWidth(postcodeLabel) - doc.getTextWidth(application.postcode) - 5
    doc.setFont('helvetica', 'bold')
    doc.text(postcodeLabel, postcodeX, yPos)
    doc.setFont('helvetica', 'normal')
    doc.text(application.postcode, postcodeX + doc.getTextWidth(postcodeLabel) + 2, yPos)

    // Underline
    doc.line(addressX - 1, yPos + 1, marginLeft + contentWidth, yPos + 1)
    yPos += 10

    // Occupation
    drawField('Occupation:', application.occupation || '', yPos)
    yPos += 10

    // Business Name & Address
    doc.setFont('helvetica', 'bold')
    doc.text('Business Name & Address:', marginLeft, yPos)
    doc.setFont('helvetica', 'normal')
    const businessX = marginLeft + doc.getTextWidth('Business Name & Address:') + 2
    const businessText = application.businessName
      ? `${application.businessName}, ${application.businessAddress || ''}`
      : ''
    doc.text(businessText, businessX, yPos)
    doc.line(businessX - 1, yPos + 1, marginLeft + contentWidth, yPos + 1)
    yPos += 7

    // Business postcode line
    if (application.businessPostcode) {
      const bPostcodeLabel = 'Post Code:'
      const bPostcodeX = marginLeft + contentWidth - doc.getTextWidth(bPostcodeLabel) - doc.getTextWidth(application.businessPostcode) - 5
      doc.setFont('helvetica', 'bold')
      doc.text(bPostcodeLabel, bPostcodeX, yPos)
      doc.setFont('helvetica', 'normal')
      doc.text(application.businessPostcode, bPostcodeX + doc.getTextWidth(bPostcodeLabel) + 2, yPos)
    }
    doc.line(marginLeft, yPos + 1, marginLeft + contentWidth, yPos + 1)
    yPos += 10

    // Telephone
    doc.setFontSize(11)
    doc.setFont('helvetica', 'bold')
    doc.text('Telephone - ', marginLeft, yPos)
    let phoneX = marginLeft + doc.getTextWidth('Telephone - ')

    doc.text('Home:', phoneX, yPos)
    doc.setFont('helvetica', 'normal')
    phoneX += doc.getTextWidth('Home:') + 1
    doc.text(application.phoneHome || '', phoneX, yPos)
    phoneX += doc.getTextWidth(application.phoneHome || '') + 5

    doc.setFont('helvetica', 'bold')
    doc.text('Work:', phoneX, yPos)
    doc.setFont('helvetica', 'normal')
    phoneX += doc.getTextWidth('Work:') + 1
    doc.text(application.phoneWork || '', phoneX, yPos)
    phoneX += doc.getTextWidth(application.phoneWork || '') + 5

    doc.setFont('helvetica', 'bold')
    doc.text('Mobile:', phoneX, yPos)
    doc.setFont('helvetica', 'normal')
    phoneX += doc.getTextWidth('Mobile:') + 1
    doc.text(application.phoneMobile || '', phoneX, yPos)

    doc.line(marginLeft + doc.getTextWidth('Telephone - '), yPos + 1, marginLeft + contentWidth, yPos + 1)
    yPos += 10

    // Email
    drawField('E-mail Address:', application.email, yPos)
    yPos += 15

    // Previous clubs
    doc.setFontSize(11)
    doc.setFont('helvetica', 'bold')
    doc.text('Club/s which nominee has been a member & dates of membership', marginLeft, yPos)
    yPos += 6
    doc.setFont('helvetica', 'normal')
    doc.text(application.previousClubs || '', marginLeft, yPos)
    doc.line(marginLeft, yPos + 1, marginLeft + contentWidth, yPos + 1)
    yPos += 10

    // Golf Link Number
    drawField('Golf Link Member Number:', application.golfLinkNumber || '', yPos)
    yPos += 10

    // Last Handicap
    drawField('Last Handicap & date:', application.lastHandicap || '', yPos)
    yPos += 10

    // Date of Birth
    drawField('Date of Birth:', application.dateOfBirth, yPos)
    yPos += 15

    // Membership Type
    doc.setFontSize(11)
    doc.setFont('helvetica', 'bold')
    doc.text('Membership Required - please circle', marginLeft, yPos)

    const typeX = marginLeft + 80
    doc.setFont('helvetica', 'normal')
    doc.text('Full', typeX, yPos)
    doc.text('Restricted', typeX + 25, yPos)
    doc.text('Junior', typeX + 60, yPos)

    // Circle the selected membership type
    if (application.membershipType === 'Full') {
      doc.circle(typeX + 7, yPos - 2, 5, 'S')
    } else if (application.membershipType === 'Restricted') {
      doc.circle(typeX + 37, yPos - 2, 7, 'S')
    } else if (application.membershipType === 'Junior') {
      doc.circle(typeX + 69, yPos - 2, 6, 'S')
    }

    yPos += 15

    // Consent statement
    doc.setFontSize(10)
    doc.setFont('helvetica', 'normal')
    const consentText = 'I hereby consent to the above nomination and in the event of being accepted as a Member agree to abide by the rules of Tea Tree Golf Club.'
    const consentLines = doc.splitTextToSize(consentText, contentWidth)
    consentLines.forEach(line => {
      doc.text(line, marginLeft, yPos)
      yPos += 5
    })
    yPos += 5

    // Signature sections - BLANK (to be filled manually)
    const drawSignatureLine = (label, y) => {
      doc.setFontSize(11)
      doc.setFont('helvetica', 'bold')
      doc.text(label, marginLeft, y)
      doc.setFont('helvetica', 'normal')
      const lineY = y + 1
      const lineStartX = marginLeft + doc.getTextWidth(label) + 2
      doc.line(lineStartX, lineY, marginLeft + contentWidth, lineY)
    }

    drawSignatureLine('Signature of nominee:', yPos)
    yPos += 10

    drawSignatureLine('Name of proposer:', yPos)
    yPos += 10

    drawSignatureLine('Signature of proposer:', yPos)
    yPos += 10

    drawSignatureLine('Name of seconder:', yPos)
    yPos += 10

    drawSignatureLine('Signature of seconder:', yPos)
    yPos += 15

    // Admin fields - BLANK
    drawSignatureLine('Date application lodged:', yPos)
    yPos += 10

    drawSignatureLine('Secretary:', yPos)
    yPos += 10

    drawSignatureLine('Date:', yPos)
    yPos += 15

    // Notes at bottom
    doc.setFontSize(9)
    doc.setFont('helvetica', 'bold')
    doc.text('Note:', marginLeft, yPos)
    doc.setFont('helvetica', 'normal')
    doc.text(' The proposer & seconder must be a member for atleast 12 months prior to the proposal', marginLeft + 10, yPos)
    yPos += 5
    doc.text('date.', marginLeft, yPos)
    yPos += 7
    doc.setFont('helvetica', 'bold')
    doc.text('Joining Fee must accompany this form.', marginLeft, yPos)

    // Footer
    const footerY = 280
    doc.setFontSize(8)
    doc.setFont('helvetica', 'italic')
    doc.setTextColor(128, 128, 128)
    doc.text('Generated from online application', pageWidth / 2, footerY, { align: 'center' })

    const now = new Date()
    const timestamp = `Generated: ${now.toLocaleDateString()} ${now.toLocaleTimeString()}`
    doc.text(timestamp, pageWidth / 2, footerY + 4, { align: 'center' })

    // Save the PDF
    const fileName = `membership-application-${application.fullName.replace(/\s+/g, '-')}-${new Date().toISOString().split('T')[0]}.pdf`
    doc.save(fileName)

    return true
  } catch (error) {
    console.error('Error generating application PDF:', error)
    throw error
  }
}
