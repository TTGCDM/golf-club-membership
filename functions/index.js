const {onCall, HttpsError} = require('firebase-functions/v2/https');
const {setGlobalOptions} = require('firebase-functions/v2');
const sgMail = require('@sendgrid/mail');

// Set global options for all functions
setGlobalOptions({region: 'us-central1'});

// Initialize SendGrid
const SENDGRID_API_KEY = process.env.SENDGRID_API_KEY;
const SENDER_EMAIL = process.env.SENDER_EMAIL;

if (SENDGRID_API_KEY) {
  sgMail.setApiKey(SENDGRID_API_KEY);
}

/**
 * Send verification email to applicant
 * This is a callable function that can be invoked from the client
 */
exports.sendVerificationEmail = onCall(async (request) => {
  // Validate SendGrid configuration
  if (!SENDGRID_API_KEY || !SENDER_EMAIL) {
    console.error('SendGrid not configured. Missing API key or sender email.');
    throw new HttpsError(
        'failed-precondition',
        'Email service is not configured properly.',
    );
  }

  // Get parameters from request
  const {email, fullName, token, applicationId} = request.data;

  // Validate required parameters
  if (!email || !fullName || !token || !applicationId) {
    throw new HttpsError(
        'invalid-argument',
        'Missing required parameters: email, fullName, token, or applicationId',
    );
  }

  // Build verification link
  // Use the origin from the request or default to production URL
  const origin = request.rawRequest?.headers?.origin || 'https://tea-tree-golf-club.web.app';
  const verificationLink = `${origin}/verify-email?token=${token}&id=${applicationId}`;

  // Email content
  const msg = {
    to: email,
    from: {
      email: SENDER_EMAIL,
      name: 'Tea Tree Golf Club',
    },
    subject: 'Verify your Tea Tree Golf Club membership application',
    text: `
Hello ${fullName},

Thank you for your interest in joining Tea Tree Golf Club!

To complete your application, please verify your email address by clicking the link below:

${verificationLink}

This link will expire in 48 hours.

Once verified, your application will be reviewed by our membership team. You will be contacted regarding next steps.

If you did not submit this application, please ignore this email.

Kind regards,
Tea Tree Golf Club
10A Volcanic Drive, Brighton, Tasmania, 7030
Tel: 03 6268 1692
Email: teatreegolf@bigpond.com
    `.trim(),
    html: `
<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background-color: #0d9488; color: white; padding: 20px; text-align: center; }
    .content { padding: 20px; background-color: #f9f9f9; }
    .button { display: inline-block; padding: 12px 24px; background-color: #0d9488; color: white; text-decoration: none; border-radius: 4px; margin: 20px 0; }
    .footer { padding: 20px; text-align: center; font-size: 12px; color: #666; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>Tea Tree Golf Club</h1>
    </div>
    <div class="content">
      <p>Hello ${fullName},</p>

      <p>Thank you for your interest in joining Tea Tree Golf Club!</p>

      <p>To complete your application, please verify your email address by clicking the button below:</p>

      <p style="text-align: center;">
        <a href="${verificationLink}" class="button">Verify Email Address</a>
      </p>

      <p style="font-size: 12px; color: #666;">
        Or copy and paste this link into your browser:<br>
        <a href="${verificationLink}">${verificationLink}</a>
      </p>

      <p style="border-top: 1px solid #ddd; padding-top: 15px; margin-top: 20px;">
        <strong>This link will expire in 48 hours.</strong>
      </p>

      <p>Once verified, your application will be reviewed by our membership team. You will be contacted regarding next steps.</p>

      <p style="font-size: 12px; color: #666; font-style: italic;">
        If you did not submit this application, please ignore this email.
      </p>
    </div>
    <div class="footer">
      <p>
        <strong>Tea Tree Golf Club</strong><br>
        10A Volcanic Drive, Brighton, Tasmania, 7030<br>
        Tel: 03 6268 1692<br>
        Email: teatreegolf@bigpond.com
      </p>
    </div>
  </div>
</body>
</html>
    `.trim(),
  };

  // Send email
  try {
    await sgMail.send(msg);
    console.log('Verification email sent to', email, 'for application', applicationId);
    return {success: true, message: 'Verification email sent successfully'};
  } catch (error) {
    console.error('Error sending verification email:', error);
    if (error.response) {
      console.error('SendGrid response:', error.response.body);
    }
    throw new HttpsError(
        'internal',
        'Failed to send verification email. Please try again later.',
    );
  }
});

/**
 * Send approval notification email to applicant
 */
exports.sendApprovalEmail = onCall(async (request) => {
  // Validate SendGrid configuration
  if (!SENDGRID_API_KEY || !SENDER_EMAIL) {
    console.error('SendGrid not configured.');
    throw new HttpsError(
        'failed-precondition',
        'Email service is not configured properly.',
    );
  }

  const {email, fullName} = request.data;

  if (!email || !fullName) {
    throw new HttpsError('invalid-argument', 'Missing required parameters');
  }

  const msg = {
    to: email,
    from: {
      email: SENDER_EMAIL,
      name: 'Tea Tree Golf Club',
    },
    subject: 'Welcome to Tea Tree Golf Club!',
    text: `
Hello ${fullName},

Congratulations! Your membership application for Tea Tree Golf Club has been approved.

Welcome to our club! You will receive further information about your membership, including:
- Membership card
- Club rules and regulations
- Tee time booking procedures
- Payment details for annual fees

If you have any questions, please don't hesitate to contact us:

Tea Tree Golf Club
10A Volcanic Drive, Brighton, Tasmania, 7030
Tel: 03 6268 1692
Email: teatreegolf@bigpond.com

We look forward to seeing you on the course!

Kind regards,
Tea Tree Golf Club
    `.trim(),
    html: `
<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background-color: #0d9488; color: white; padding: 20px; text-align: center; }
    .content { padding: 20px; background-color: #f9f9f9; }
    .footer { padding: 20px; text-align: center; font-size: 12px; color: #666; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>Welcome to Tea Tree Golf Club!</h1>
    </div>
    <div class="content">
      <p>Hello ${fullName},</p>

      <p><strong>Congratulations!</strong> Your membership application for Tea Tree Golf Club has been approved.</p>

      <p>Welcome to our club! You will receive further information about your membership, including:</p>
      <ul>
        <li>Membership card</li>
        <li>Club rules and regulations</li>
        <li>Tee time booking procedures</li>
        <li>Payment details for annual fees</li>
      </ul>

      <p>If you have any questions, please don't hesitate to contact us.</p>

      <p><strong>We look forward to seeing you on the course!</strong></p>
    </div>
    <div class="footer">
      <p>
        <strong>Tea Tree Golf Club</strong><br>
        10A Volcanic Drive, Brighton, Tasmania, 7030<br>
        Tel: 03 6268 1692<br>
        Email: teatreegolf@bigpond.com
      </p>
    </div>
  </div>
</body>
</html>
    `.trim(),
  };

  try {
    await sgMail.send(msg);
    console.log('Approval email sent to', email);
    return {success: true, message: 'Approval email sent successfully'};
  } catch (error) {
    console.error('Error sending approval email:', error);
    throw new HttpsError('internal', 'Failed to send approval email');
  }
});

/**
 * Send rejection notification email to applicant
 */
exports.sendRejectionEmail = onCall(async (request) => {
  // Validate SendGrid configuration
  if (!SENDGRID_API_KEY || !SENDER_EMAIL) {
    console.error('SendGrid not configured.');
    throw new HttpsError(
        'failed-precondition',
        'Email service is not configured properly.',
    );
  }

  const {email, fullName, rejectionReason} = request.data;

  if (!email || !fullName || !rejectionReason) {
    throw new HttpsError('invalid-argument', 'Missing required parameters');
  }

  const msg = {
    to: email,
    from: {
      email: SENDER_EMAIL,
      name: 'Tea Tree Golf Club',
    },
    subject: 'Tea Tree Golf Club membership application update',
    text: `
Hello ${fullName},

Thank you for your interest in joining Tea Tree Golf Club.

After careful review, we regret to inform you that your membership application has not been approved at this time.

Reason: ${rejectionReason}

If you have any questions or would like to discuss this decision, please contact the club directly:

Tea Tree Golf Club
10A Volcanic Drive, Brighton, Tasmania, 7030
Tel: 03 6268 1692
Email: teatreegolf@bigpond.com

Thank you for your understanding.

Kind regards,
Tea Tree Golf Club
    `.trim(),
    html: `
<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background-color: #0d9488; color: white; padding: 20px; text-align: center; }
    .content { padding: 20px; background-color: #f9f9f9; }
    .footer { padding: 20px; text-align: center; font-size: 12px; color: #666; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>Tea Tree Golf Club</h1>
    </div>
    <div class="content">
      <p>Hello ${fullName},</p>

      <p>Thank you for your interest in joining Tea Tree Golf Club.</p>

      <p>After careful review, we regret to inform you that your membership application has not been approved at this time.</p>

      <p><strong>Reason:</strong> ${rejectionReason}</p>

      <p>If you have any questions or would like to discuss this decision, please contact the club directly.</p>

      <p>Thank you for your understanding.</p>
    </div>
    <div class="footer">
      <p>
        <strong>Tea Tree Golf Club</strong><br>
        10A Volcanic Drive, Brighton, Tasmania, 7030<br>
        Tel: 03 6268 1692<br>
        Email: teatreegolf@bigpond.com
      </p>
    </div>
  </div>
</body>
</html>
    `.trim(),
  };

  try {
    await sgMail.send(msg);
    console.log('Rejection email sent to', email);
    return {success: true, message: 'Rejection email sent successfully'};
  } catch (error) {
    console.error('Error sending rejection email:', error);
    throw new HttpsError('internal', 'Failed to send rejection email');
  }
});
