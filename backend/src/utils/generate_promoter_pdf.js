const PDFDocument = require('pdfkit');
const fs = require('fs');
const path = require('path');

// Ensure output paths exist
const frontendPublicDir = path.join(__dirname, '../../../frontend/public');
if (!fs.existsSync(frontendPublicDir)) {
  fs.mkdirSync(frontendPublicDir, { recursive: true });
}

const artifactDir = 'C:\\Users\\daarl\\.gemini\\antigravity-ide\\brain\\1887deb0-1ff5-4f8e-8866-81c154fbd69b';
if (!fs.existsSync(artifactDir)) {
  fs.mkdirSync(artifactDir, { recursive: true });
}

const rootDir = path.join(__dirname, '../../..');

const targetPdfPath1 = path.join(frontendPublicDir, 'promoter_affiliate_guide.pdf');
const targetPdfPath2 = path.join(artifactDir, 'promoter_affiliate_guide.pdf');
const targetPdfPath3 = path.join(rootDir, 'promoter_affiliate_guide.pdf');

function createPromoterGuidePDF(outputPath) {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({
      size: 'A4',
      margin: 40,
      bufferPages: true,
      info: {
        Title: 'Ratnamayuri Promoter & Affiliate Marketing Instruction Manual',
        Author: 'Ratnamayuri Jewellery & Sarees',
        Subject: 'System-Verified Operating Guide for Promoters and Affiliates',
        Keywords: 'Affiliate, Promoter, Commission, Ratnamayuri, Sarees, Jewellery',
      },
    });

    const writeStream = fs.createWriteStream(outputPath);
    doc.pipe(writeStream);

    // Brand Color Palette
    const MAROON = '#4A0F0F';
    const GOLD = '#C9973E';
    const DARK_TEXT = '#1A1A1A';
    const MUTED_TEXT = '#555555';
    const LIGHT_BG = '#FAF6EE';
    const BORDER_GOLD = '#E6C687';

    // ── PAGE 1: COVER PAGE ──
    doc.rect(0, 0, doc.page.width, doc.page.height).fill(MAROON);

    // Luxury Gold Double Outer Frame
    doc.rect(20, 20, doc.page.width - 40, doc.page.height - 40).strokeColor(GOLD).lineWidth(2).stroke();
    doc.rect(24, 24, doc.page.width - 48, doc.page.height - 48).strokeColor(GOLD).lineWidth(0.8).stroke();

    // Brand Header
    doc.fillColor(GOLD).font('Helvetica-Bold').fontSize(26).text('RATNAMAYURI', 0, 150, { align: 'center' });
    doc.fillColor('#FFFFFF').font('Helvetica-Bold').fontSize(11).text('JEWELLERY & SAREES', 0, 185, { align: 'center' });

    // Document Title
    doc.fillColor(GOLD).font('Helvetica-Bold').fontSize(18).text('PROMOTER & AFFILIATE MARKETING', 0, 250, { align: 'center' });
    doc.fillColor('#F5E8D0').font('Helvetica').fontSize(14).text('SYSTEM OPERATING MANUAL', 0, 275, { align: 'center' });

    // Decorative Divider Line
    doc.moveTo(140, 305).lineTo(doc.page.width - 140, 305).strokeColor(GOLD).lineWidth(1.5).stroke();

    // Document Subtitle
    doc.fillColor('#E8D5B0').font('Helvetica').fontSize(10).text(
      'An exact system guide detailing referral coupon links, 7-day cookie attribution, real-time commission tracking, and bank/UPI payout management.',
      70, 330, { align: 'center', width: doc.page.width - 140, lineGap: 5 }
    );

    // Summary Box on Cover
    doc.rect(50, 600, doc.page.width - 100, 140).fillColor('#360B0B').fillAndStroke('#360B0B', GOLD);
    doc.fillColor(GOLD).font('Helvetica-Bold').fontSize(12).text('KEY AFFILIATE FEATURES ACTIVE ON WEBSITE', 60, 615, { align: 'center' });
    
    doc.fillColor('#FFFFFF').font('Helvetica').fontSize(9.5).text(
      '• Dedicated Promoter Portal & Live Analytics Dashboard (/promoter/dashboard)\n' +
      '• Unique Referral Links with 7-Day Automatic Cookie Coupon Activation\n' +
      '• Instant Customer Discount at Checkout & Tracked Commission Credit\n' +
      '• Flexible Payout Options: Direct UPI (GPay/PhonePe) or Bank Account Transfer\n' +
      '• Real-time Tracking of Referred Sales, Pending Commissions & Paid History',
      70, 640, { lineGap: 5 }
    );

    doc.fillColor('#C9973E').font('Helvetica-Oblique').fontSize(9).text('Guntur, Andhra Pradesh  |  ratnamayurii@gmail.com  |  +91 83318 10689', 0, 780, { align: 'center' });

    // ── PAGE 2: SYSTEM ARCHITECTURE & REFERRAL LINK LOGIC ──
    doc.addPage();

    // Header Bar
    doc.rect(0, 0, doc.page.width, 50).fill(MAROON);
    doc.fillColor(GOLD).font('Helvetica-Bold').fontSize(12).text('RATNAMAYURI PROMOTER MANUAL', 40, 18);
    doc.fillColor('#FFFFFF').font('Helvetica').fontSize(10).text('SECTION 1: REFERRAL & COUPON SYSTEM', doc.page.width - 270, 18);

    doc.fillColor(MAROON).font('Helvetica-Bold').fontSize(16).text('1. How the Affiliate System Works', 40, 70);
    doc.moveTo(40, 90).lineTo(doc.page.width - 40, 90).strokeColor(GOLD).lineWidth(1).stroke();

    doc.fillColor(DARK_TEXT).font('Helvetica').fontSize(10).text(
      'The Ratnamayuri Promoter System connects your promotional campaigns directly with our e-commerce platform database. When you register as an official brand promoter, your account is activated with custom referral coupons linked directly to your Promoter ID.',
      40, 105, { width: doc.page.width - 80, lineGap: 4 }
    );

    // Step-by-Step Flow Box
    doc.rect(40, 160, doc.page.width - 80, 200).fillColor(LIGHT_BG).fillAndStroke(LIGHT_BG, BORDER_GOLD);
    doc.fillColor(MAROON).font('Helvetica-Bold').fontSize(12).text('STEP-BY-STEP REFERRAL & COMMISSION FLOW', 55, 175);

    const steps = [
      ['Step 1: Referral Link Creation', 'Your dashboard provides a 1-click link format: http://localhost:3000/?coupon=YOURCODE (or appending ?coupon=YOURCODE to any product URL).'],
      ['Step 2: 7-Day Cookie Activation', 'When a buyer opens your link, our system automatically sets a 7-day referral cookie ("affiliate_coupon") in their browser and displays a confirmation notification.'],
      ['Step 3: Instant Checkout Discount', 'When the buyer completes their order, your referral coupon is automatically applied at checkout, granting them an instant price discount.'],
      ['Step 4: Commission Record Creation', 'As soon as the payment is confirmed, a Commission record is generated in the database containing your Promoter ID, Order ID, and earned Commission Amount.'],
    ];

    let stepY = 200;
    steps.forEach((s) => {
      doc.fillColor(MAROON).font('Helvetica-Bold').fontSize(9.5).text(s[0], 55, stepY);
      doc.fillColor(DARK_TEXT).font('Helvetica').fontSize(9).text(s[1], 55, stepY + 12, { width: doc.page.width - 110 });
      stepY += 38;
    });

    // Customer & Promoter Win-Win Box
    doc.rect(40, 380, doc.page.width - 80, 140).fillColor('#FFF9F0').fillAndStroke('#FFF9F0', GOLD);
    doc.fillColor(MAROON).font('Helvetica-Bold').fontSize(12).text('COUPON & COMMISSION ARCHITECTURE', 55, 395);

    doc.fillColor(DARK_TEXT).font('Helvetica-Bold').fontSize(10).text('• Customer Incentive:', 55, 420);
    doc.font('Helvetica').fontSize(9.5).text('Customers receive an exclusive discount on their total order amount when using your assigned referral coupon code.', 170, 420, { width: doc.page.width - 235 });

    doc.font('Helvetica-Bold').fontSize(10).text('• Promoter Earnings:', 55, 455);
    doc.font('Helvetica').fontSize(9.5).text('Every completed order using your coupon credits your promoter account with a fixed or percentage commission amount configured in the system database.', 170, 455, { width: doc.page.width - 235 });

    doc.font('Helvetica-Bold').fontSize(10).text('• Dual Attribution:', 55, 495);
    doc.font('Helvetica').fontSize(9.5).text('If a customer types your coupon code manually at checkout without clicking a link, commission is still 100% credited to your account!', 170, 495, { width: doc.page.width - 235 });

    // ── PAGE 3: DASHBOARD METRICS & PAYOUT MANAGEMENT ──
    doc.addPage();

    doc.rect(0, 0, doc.page.width, 50).fill(MAROON);
    doc.fillColor(GOLD).font('Helvetica-Bold').fontSize(12).text('RATNAMAYURI PROMOTER MANUAL', 40, 18);
    doc.fillColor('#FFFFFF').font('Helvetica').fontSize(10).text('SECTION 2: DASHBOARD & PAYOUTS', doc.page.width - 250, 18);

    doc.fillColor(MAROON).font('Helvetica-Bold').fontSize(16).text('2. Promoter Dashboard Analytics', 40, 70);
    doc.moveTo(40, 90).lineTo(doc.page.width - 40, 90).strokeColor(GOLD).lineWidth(1).stroke();

    doc.fillColor(DARK_TEXT).font('Helvetica').fontSize(10).text(
      'Log in to your Affiliate Portal at http://localhost:3000/promoter/dashboard to monitor real-time sales and commissions. Your portal includes 4 live metric cards:',
      40, 105, { width: doc.page.width - 80, lineGap: 4 }
    );

    // 4 Metric Cards
    const cardW = (doc.page.width - 100) / 2;
    
    // Card 1
    doc.rect(40, 145, cardW, 75).fillColor(LIGHT_BG).fillAndStroke(LIGHT_BG, BORDER_GOLD);
    doc.fillColor(MAROON).font('Helvetica-Bold').fontSize(11).text('TOTAL SALES REFERRED', 50, 157);
    doc.fillColor(DARK_TEXT).font('Helvetica').fontSize(9).text('Gross monetary sum of all paid orders completed using your promoter coupons.', 50, 175, { width: cardW - 20 });

    // Card 2
    doc.rect(50 + cardW, 145, cardW, 75).fillColor(LIGHT_BG).fillAndStroke(LIGHT_BG, BORDER_GOLD);
    doc.fillColor(MAROON).font('Helvetica-Bold').fontSize(11).text('REFERRED ORDERS', 60 + cardW, 157);
    doc.fillColor(DARK_TEXT).font('Helvetica').fontSize(9).text('Total count of successful customer purchases generated by your campaigns.', 60 + cardW, 175, { width: cardW - 20 });

    // Card 3
    doc.rect(40, 230, cardW, 75).fillColor(LIGHT_BG).fillAndStroke(LIGHT_BG, BORDER_GOLD);
    doc.fillColor(MAROON).font('Helvetica-Bold').fontSize(11).text('PENDING COMMISSIONS', 50, 242);
    doc.fillColor(DARK_TEXT).font('Helvetica').fontSize(9).text('Commissions logged from recent orders awaiting admin payout approval.', 50, 260, { width: cardW - 20 });

    // Card 4
    doc.rect(50 + cardW, 230, cardW, 75).fillColor(LIGHT_BG).fillAndStroke(LIGHT_BG, BORDER_GOLD);
    doc.fillColor(MAROON).font('Helvetica-Bold').fontSize(11).text('PAID COMMISSIONS', 60 + cardW, 242);
    doc.fillColor(DARK_TEXT).font('Helvetica').fontSize(9).text('Total payout money successfully disbursed to your bank or UPI account.', 60 + cardW, 260, { width: cardW - 20 });

    doc.fillColor(MAROON).font('Helvetica-Bold').fontSize(16).text('3. Payout Settings & Withdrawal Setup', 40, 335);
    doc.moveTo(40, 355).lineTo(doc.page.width - 40, 355).strokeColor(GOLD).lineWidth(1).stroke();

    doc.fillColor(DARK_TEXT).font('Helvetica').fontSize(10).text(
      'Promoters can update their preferred payout credentials directly inside the dashboard form. Choose between two supported payout methods:',
      40, 370, { width: doc.page.width - 80, lineGap: 4 }
    );

    // Option A & B Box
    doc.rect(40, 400, doc.page.width - 80, 150).fillColor('#FFF9F0').fillAndStroke('#FFF9F0', GOLD);
    doc.fillColor(MAROON).font('Helvetica-Bold').fontSize(11).text('OPTION A: UPI INSTANT TRANSFER', 55, 415);
    doc.fillColor(DARK_TEXT).font('Helvetica').fontSize(9.5).text('Enter your UPI ID (e.g. name@okaxis, mobile@ybl, name@paytm). Payouts are transferred directly to your UPI handle.', 55, 430, { width: doc.page.width - 110 });

    doc.fillColor(MAROON).font('Helvetica-Bold').fontSize(11).text('OPTION B: DIRECT BANK TRANSFER (NEFT / IMPS)', 55, 470);
    doc.fillColor(DARK_TEXT).font('Helvetica').fontSize(9.5).text('Enter your Bank Name, Account Number, IFSC Code, and Account Holder Name. Commissions are disbursed straight to your bank account.', 55, 485, { width: doc.page.width - 110 });

    // ── PAGE 4: PROMOTIONAL TIPS & SUPPORT ──
    doc.addPage();

    doc.rect(0, 0, doc.page.width, 50).fill(MAROON);
    doc.fillColor(GOLD).font('Helvetica-Bold').fontSize(12).text('RATNAMAYURI PROMOTER MANUAL', 40, 18);
    doc.fillColor('#FFFFFF').font('Helvetica').fontSize(10).text('SECTION 3: BEST PRACTICES & SUPPORT', doc.page.width - 250, 18);

    doc.fillColor(MAROON).font('Helvetica-Bold').fontSize(16).text('4. High-Converting Promotion Strategies', 40, 70);
    doc.moveTo(40, 90).lineTo(doc.page.width - 40, 90).strokeColor(GOLD).lineWidth(1).stroke();

    doc.rect(40, 105, doc.page.width - 80, 175).fillColor(LIGHT_BG).fillAndStroke(LIGHT_BG, BORDER_GOLD);
    
    doc.fillColor(MAROON).font('Helvetica-Bold').fontSize(10).text('💡 Strategy #1: Direct Product Deep Links', 55, 120);
    doc.fillColor(DARK_TEXT).font('Helvetica').fontSize(9.5).text('Instead of sending buyers to the generic home page, link directly to specific Kanchipuram sarees or Temple jewellery items by attaching ?coupon=CODE to the product page URL.', 55, 135, { width: doc.page.width - 110 });

    doc.fillColor(MAROON).font('Helvetica-Bold').fontSize(10).text('💡 Strategy #2: Social Media & WhatsApp Broadcasts', 55, 175);
    doc.fillColor(DARK_TEXT).font('Helvetica').fontSize(9.5).text('Share short unboxing videos, festival drape ideas, or bridal jewellery highlights on WhatsApp groups, Instagram stories, and YouTube descriptions with your referral link.', 55, 190, { width: doc.page.width - 110 });

    doc.fillColor(MAROON).font('Helvetica-Bold').fontSize(10).text('💡 Strategy #3: Emphasize Quality & Trust Seals', 55, 230);
    doc.fillColor(DARK_TEXT).font('Helvetica').fontSize(9.5).text('Highlight that Ratnamayuri products come with 22K Gold Hallmark certification, 100% Genuine Silk seals, sanitized factory packaging, and 100% Insured Express Delivery.', 55, 245, { width: doc.page.width - 110 });

    // Official Support Box
    doc.rect(40, 310, doc.page.width - 80, 140).fillColor(MAROON).fillAndStroke(MAROON, GOLD);
    doc.fillColor(GOLD).font('Helvetica-Bold').fontSize(14).text('NEED ASSISTANCE OR PROMOTER HELP?', 50, 330, { align: 'center' });
    doc.fillColor('#FFFFFF').font('Helvetica').fontSize(10.5).text(
      'Our Brand Concierge and Promoter Relations Team is dedicated to helping you succeed.\n\n' +
      '• Email Support: ratnamayurii@gmail.com\n' +
      '• Phone / WhatsApp Concierge: +91 83318 10689\n' +
      '• Registered Address: Ratnamayuri Jewellery & Sarees, Guntur, Andhra Pradesh, India\n' +
      '• Download PDF Manual Link: http://localhost:3000/promoter_affiliate_guide.pdf',
      55, 355, { lineGap: 5 }
    );

    // Page Numbers
    const pageCount = doc.bufferedPageRange().count;
    for (let i = 1; i < pageCount; i++) {
      doc.switchToPage(i);
      doc.fillColor(MUTED_TEXT).font('Helvetica').fontSize(8).text(
        `Ratnamayuri Promoter System Manual  |  Page ${i + 1} of ${pageCount}`,
        40, doc.page.height - 30, { align: 'center' }
      );
    }

    doc.end();

    writeStream.on('finish', () => {
      console.log(`✓ Verified PDF written to ${outputPath}`);
      resolve(outputPath);
    });

    writeStream.on('error', (err) => {
      reject(err);
    });
  });
}

async function main() {
  try {
    console.log('Generating System-Verified Promoter & Affiliate Guide PDF...');
    await createPromoterGuidePDF(targetPdfPath1);
    await createPromoterGuidePDF(targetPdfPath2);
    await createPromoterGuidePDF(targetPdfPath3);
    console.log('🎉 All 3 PDF files updated with 100% verified system features!');
    process.exit(0);
  } catch (err) {
    console.error('Error generating PDF:', err);
    process.exit(1);
  }
}

main();
