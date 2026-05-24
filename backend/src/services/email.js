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

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8"/>
  <style>
    body { font-family: Georgia, serif; background: #FAF6F0; margin: 0; padding: 0; }
    .container { max-width: 560px; margin: 40px auto; background: white; border: 1px solid #E8D5A3; }
    .header { background: #1A0E05; padding: 32px; text-align: center; }
    .header h1 { color: #C9A96E; font-size: 22px; letter-spacing: 4px; margin: 0; }
    .header p { color: #E8D5A3; font-size: 11px; letter-spacing: 2px; margin: 6px 0 0; }
    .body { padding: 40px; }
    .body h2 { color: #3D2314; font-size: 20px; margin-bottom: 16px; }
    .body p { color: #7A6355; line-height: 1.7; margin-bottom: 16px; }
    .otp-box { background: #FAF6F0; border: 2px solid #C9A96E; text-align: center;
               padding: 24px; margin: 28px 0; border-radius: 2px; }
    .otp-code { font-size: 40px; font-weight: bold; color: #1A0E05; letter-spacing: 12px;
                font-family: 'Courier New', monospace; }
    .otp-note { font-size: 12px; color: #7A6355; margin-top: 8px; }
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
      <h2>Hello, ${name} 🙏</h2>
      <p>You requested to ${purposeText}. Use the OTP below to proceed:</p>
      <div class="otp-box">
        <div class="otp-code">${otp}</div>
        <p class="otp-note">Valid for ${config.otpExpireMinutes} minutes. Do not share this with anyone.</p>
      </div>
      <p>If you did not request this, please ignore this email or contact our support team immediately.</p>
    </div>
    <div class="footer">
      <p>© 2026 Ratnamayuri · Made with ♡ in India</p>
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

module.exports = {
  sendEmail,
  sendOTPEmail,
  sendOrderConfirmationEmail
};
