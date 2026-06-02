const nodemailer = require('nodemailer');
const config = require('../config');

const smtpPort = parseInt(config.smtpPort, 10);
const isSecure = smtpPort === 465;

// Create transporter
const transporter = nodemailer.createTransport({
  host: config.smtpHost,
  port: smtpPort,
  secure: isSecure,                    // true for port 465, false for port 587
  requireTLS: !isSecure,               // Forces STARTTLS only if not using direct SSL port 465
  auth: {
    user: config.smtpUser,
    pass: config.smtpPassword
  },
  tls: {
    ciphers: 'SSLv3',                  // Helps negotiate a secure handshake cleanly
    rejectUnauthorized: false
  }
});

const sendEmail = async (to, subject, htmlBody, textBody = '') => {
  try {
    const info = await transporter.sendMail({
      from: `"${config.emailFromName}" <${config.emailFrom}>`,
      to,
      subject,
      text: textBody,
      html: htmlBody
    });
    console.log(`Email sent to ${to}: ${subject} [ID: ${info.messageId}]`);
    return true;
  } catch (error) {
    console.error(`Failed to send email to ${to}:`, error);
    return false;
  }
};

const getOTPEmailHtml = (name, otp, purpose) => {
  const purposeText = {
    email_verification: 'verify your email address',
    password_reset: 'reset your password'
  }[purpose] || 'complete your request';

  const titleText = {
    email_verification: 'Verify Your Email Address',
    password_reset: 'Reset Your Password'
  }[purpose] || 'Security Verification';

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8"/>
  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
  <style>
    body { font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; background-color: #FAF6EE; margin: 0; padding: 0; -webkit-font-smoothing: antialiased; }
    .wrapper { background-color: #FAF6EE; width: 100%; padding: 40px 0; }
    .container { max-width: 500px; margin: 0 auto; background-color: #ffffff; border: 1px solid #E8D5B0; border-radius: 24px; padding: 40px 32px; box-shadow: 0 4px 20px rgba(92, 19, 24, 0.04); text-align: center; position: relative; }
    .close-btn { position: absolute; top: 20px; right: 24px; color: #D1D5DB; font-size: 22px; font-family: Arial, sans-serif; line-height: 1; cursor: default; }
    .illustration { text-align: center; margin-bottom: 24px; margin-top: 10px; }
    .title { color: #5C1318; font-family: Georgia, serif; font-size: 24px; font-weight: bold; margin: 0 0 12px 0; }
    .desc { color: #7A6355; font-family: Georgia, serif; font-size: 13px; line-height: 1.6; margin: 0 auto 28px auto; max-width: 380px; }
    .digit-table { margin: 24px auto; border-collapse: collapse; }
    .digit-box { width: 44px; height: 48px; background-color: #F9FAFB; border: 1.5px solid #E5E7EB; border-radius: 8px; text-align: center; font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; font-size: 22px; font-weight: bold; color: #5C1318; }
    .digit-box-active { width: 44px; height: 48px; background-color: #F9FAFB; border: 1.5px solid #C9973E; border-radius: 8px; text-align: center; font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; font-size: 22px; font-weight: bold; color: #5C1318; box-shadow: 0 0 5px rgba(201, 151, 62, 0.2); }
    .note { font-family: Georgia, serif; font-size: 12px; color: #9CA3AF; margin: 20px 0; }
    .btn-container { margin: 28px 0 12px 0; }
    .btn { display: inline-block; background-color: #C9973E; color: #ffffff !important; font-family: Georgia, serif; font-size: 14px; font-weight: bold; text-decoration: none; padding: 12px 40px; border-radius: 24px; letter-spacing: 0.5px; box-shadow: 0 4px 12px rgba(201, 151, 62, 0.25); border: none; }
    .footer { font-family: Georgia, serif; font-size: 10px; color: #9CA3AF; margin-top: 32px; border-top: 1px solid #FAF6EE; padding-top: 16px; letter-spacing: 1px; }
  </style>
</head>
<body>
  <div class="wrapper">
    <div class="container">
      <!-- Decorative Close Sign from reference image -->
      <div class="close-btn">×</div>

      <!-- Envelope & Key Illustration -->
      <div class="illustration">
        <svg width="120" height="90" viewBox="0 0 120 90" fill="none" xmlns="http://www.w3.org/2000/svg" style="display: inline-block;">
          <!-- Envelope base (amber/orange from image) -->
          <rect x="15" y="24" width="90" height="54" rx="8" fill="#FBA632" />
          
          <!-- Masked password pill inside envelope -->
          <rect x="42" y="44" width="36" height="15" rx="3" fill="#FFFFFF" />
          <text x="60" y="55" font-family="'Courier New', monospace" font-size="10" font-weight="bold" fill="#5C1318" text-anchor="middle" letter-spacing="1">******</text>
          
          <!-- Envelope flap creases -->
          <path d="M15 24 L60 55 L105 24" stroke="#E28F1B" stroke-width="2" fill="none" />
          <path d="M15 78 L48 50" stroke="#E28F1B" stroke-width="1.5" />
          <path d="M105 78 L72 50" stroke="#E28F1B" stroke-width="1.5" />

          <!-- Overlapping Key (burgundy/gold) -->
          <circle cx="32" cy="48" r="9" stroke="#5C1318" stroke-width="3" fill="#FAF6EE" />
          <path d="M32 57 L32 75" stroke="#5C1318" stroke-width="3" stroke-linecap="round" />
          <path d="M32 64 L39 64" stroke="#5C1318" stroke-width="3" stroke-linecap="round" />
          <path d="M32 70 L37 70" stroke="#5C1318" stroke-width="3" stroke-linecap="round" />
        </svg>
      </div>

      <!-- Content -->
      <h2 class="title">${titleText}</h2>
      <p class="desc">
        Hello ${name || 'User'}, we have generated a secure verification code to ${purposeText}. Please enter the 6-digit code below in your browser.
      </p>

      <!-- 6 Individual Digit Blocks (mimicking image typing state) -->
      <table align="center" border="0" cellpadding="0" cellspacing="8" class="digit-table">
        <tr>
          <td class="digit-box">${otp[0] || ''}</td>
          <td class="digit-box">${otp[1] || ''}</td>
          <td class="digit-box">${otp[2] || ''}</td>
          <td class="digit-box-active">${otp[3] || ''}</td>
          <td class="digit-box">${otp[4] || ''}</td>
          <td class="digit-box">${otp[5] || ''}</td>
        </tr>
      </table>

      <p class="note">
        Valid for ${config.otpExpireMinutes} minutes · Keep this OTP private
      </p>

      <!-- Bottom verification seal CTA -->
      <div class="btn-container">
        <span class="btn">VERIFY SECURELY</span>
      </div>

      <!-- Brand Footer -->
      <div class="footer">
        RATNAMAYURI LUXURY SERVICES · © 2026
      </div>
    </div>
  </div>
</body>
</html>
`;
};

const getOrderConfirmationHtml = (orderNumber, name, items, total) => {
  const itemsHtml = items.map(i => `
    <tr>
      <td style="padding:8px;border-bottom:1px solid #E8D5A3">${i.name}</td>
      <td style="padding:8px;border-bottom:1px solid #E8D5A3;text-align:center">${i.qty}</td>
      <td style="padding:8px;border-bottom:1px solid #E8D5A3;text-align:right">₹${Number(i.price).toLocaleString('en-IN', { maximumFractionDigits: 0 })}</td>
    </tr>
  `).join('');

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8"/>
  <style>
    body { font-family: Georgia, serif; background: #FAF6F0; margin: 0; padding: 0; }
    .container { max-width: 600px; margin: 40px auto; background: white; border: 1px solid #E8D5A3; }
    .header { background: #1A0E05; padding: 32px; text-align: center; }
    .header h1 { color: #C9A96E; font-size: 22px; letter-spacing: 4px; margin: 0; }
    .body { padding: 40px; }
    .order-num { color: #C9A96E; font-size: 13px; letter-spacing: 2px; }
    table { width: 100%; border-collapse: collapse; margin: 20px 0; }
    th { background: #FAF6F0; padding: 10px 8px; text-align: left; color: #3D2314;
          font-size: 11px; letter-spacing: 2px; border-bottom: 2px solid #C9A96E; }
    .total-row { font-weight: bold; color: #1A0E05; font-size: 16px; }
    .footer { background: #FAF6F0; padding: 20px; text-align: center; border-top: 1px solid #E8D5A3; }
    .footer p { font-size: 11px; color: #7A6355; margin: 4px 0; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>RATNAMAYURI</h1>
    </div>
    <div class="body">
      <h2 style="color:#3D2314">Order Confirmed! 🎉</h2>
      <p class="order-num">ORDER #${orderNumber}</p>
      <p style="color:#7A6355">Dear ${name}, thank you for your order. We will process it shortly.</p>
      <table>
        <thead><tr><th>Product</th><th>Qty</th><th>Price</th></tr></thead>
        <tbody>${itemsHtml}</tbody>
        <tfoot>
          <tr class="total-row">
            <td colspan="2" style="padding:12px 8px">Total</td>
            <td style="padding:12px 8px;text-align:right">₹${Number(total).toLocaleString('en-IN', { maximumFractionDigits: 0 })}</td>
          </tr>
        </tfoot>
      </table>
      <p style="color:#7A6355">You can track your order from your account dashboard.</p>
    </div>
    <div class="footer">
      <p>© 2026 Ratnamayuri · Made with ♡ in India</p>
      <p>Questions? Reply to this email or contact support@ratnamayuri.live</p>
    </div>
  </div>
</body>
</html>
`;
};

const sendOTPEmail = async (email, name, otp, purpose = 'email_verification') => {
  const subjectMap = {
    email_verification: 'Verify your Ratnamayuri account',
    password_reset: 'Reset your Ratnamayuri password'
  };
  const subject = subjectMap[purpose] || 'Your Ratnamayuri OTP';
  const html = getOTPEmailHtml(name, otp, purpose);
  const text = `Your OTP is: ${otp}. Valid for ${config.otpExpireMinutes} minutes.`;
  return sendEmail(email, subject, html, text);
};

const sendOrderConfirmationEmail = async (email, name, orderNumber, items, total) => {
  const subject = `Order Confirmed — #${orderNumber} | Ratnamayuri`;
  const html = getOrderConfirmationHtml(orderNumber, name, items, total);
  const text = `Your order #${orderNumber} has been confirmed. Total: ₹${Number(total).toLocaleString('en-IN', { maximumFractionDigits: 0 })}`;
  return sendEmail(email, subject, html, text);
};

const sendPasswordlessLoginLink = async (email, link) => {
  const subject = 'Secure Sign-In to Ratnamayuri';
  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8"/>
  <style>
    body { font-family: Georgia, serif; background: #FAF6F0; margin: 0; padding: 0; }
    .container { max-width: 560px; margin: 40px auto; background: white; border: 1px solid #E8D5A3; }
    .header { background: #5C1318; padding: 32px; text-align: center; }
    .header h1 { color: #D4AF37; font-size: 22px; letter-spacing: 4px; margin: 0; }
    .header p { color: #E8D5A3; font-size: 11px; letter-spacing: 2px; margin: 6px 0 0; }
    .body { padding: 40px; text-align: center; }
    .body h2 { color: #5C1318; font-size: 20px; margin-bottom: 16px; font-family: Georgia, serif; }
    .body p { color: #7A6355; line-height: 1.7; margin-bottom: 24px; font-size: 15px; }
    .btn { display: inline-block; background: #5C1318; color: #D4AF37 !important; text-decoration: none;
                 padding: 14px 28px; font-size: 14px; font-weight: bold; border-radius: 4px;
                 letter-spacing: 2px; border: 1px solid #D4AF37; transition: all 0.3s ease; }
    .btn:hover { background: #3d0c0f; }
    .link-note { font-size: 12px; color: #7A6355; margin-top: 24px; word-break: break-all; }
    .footer { background: #FAF6F0; padding: 20px; text-align: center; border-top: 1px solid #E8D5A3; }
    .footer p { font-size: 11px; color: #7A6355; margin: 0; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>RATNAMAYURI</h1>
      <p>LUXURY JEWELLERY &amp; SILK SAREES</p>
    </div>
    <div class="body">
      <h2>Secure Sign-In 🙏</h2>
      <p>Click the button below to sign in to your Ratnamayuri account instantly. This link is secure and will expire in 15 minutes.</p>
      <a href="${link}" class="btn">SIGN IN INSTANTLY</a>
      <p class="link-note">If the button doesn't work, copy and paste this URL into your browser:<br/><br/>${link}</p>
    </div>
    <div class="footer">
      <p>© 2026 Ratnamayuri · Made with ♡ in India</p>
    </div>
  </div>
</body>
</html>
`;
  const text = `Secure Sign-In to Ratnamayuri. Use this link to sign in: ${link}`;
  return sendEmail(email, subject, html, text);
};

module.exports = {
  sendEmail,
  sendOTPEmail,
  sendOrderConfirmationEmail,
  sendPasswordlessLoginLink
};

