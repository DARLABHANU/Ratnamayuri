const nodemailer = require('nodemailer');
require('dotenv').config({ path: require('path').resolve(__dirname, '../../.env') });

const testConnection = async () => {
  console.log('--- SMTP Diagnostic Test ---');
  console.log('Host:', process.env.SMTP_HOST);
  console.log('Port:', process.env.SMTP_PORT);
  console.log('User:', process.env.SMTP_USER);
  console.log('From:', process.env.EMAIL_FROM);

  const port = parseInt(process.env.SMTP_PORT || '587', 10);
  const isSecure = port === 465;

  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: port,
    secure: isSecure,
    requireTLS: !isSecure,
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASSWORD
    },
    tls: {
      ciphers: 'SSLv3',
      rejectUnauthorized: false
    }
  });

  try {
    console.log('\nChecking SMTP connection...');
    await transporter.verify();
    console.log('✅ Connection verification SUCCESSFUL! The SMTP configuration is correct and ready.');

    console.log('\nAttempting to send a test email...');
    const info = await transporter.sendMail({
      from: `"${process.env.EMAIL_FROM_NAME || 'Ratnamayuri'}" <${process.env.EMAIL_FROM}>`,
      to: 'darlabhanumurthy@gmail.com', // Send to the requested address
      subject: 'Ratnamayuri SMTP Test',
      text: 'If you are reading this, your email integration works perfectly!',
      html: '<h2 style="color: #3D2314;">Ratnamayuri Email Integration Works! 🎉</h2><p>This is a successful SMTP diagnostic test email sent directly to your inbox.</p>'
    });

    console.log('✅ Test email sent successfully! Message ID:', info.messageId);
  } catch (error) {
    console.error('\n❌ SMTP test FAILED. Here is the diagnostic error detail:');
    console.error(error);
  }
};

testConnection();
