const express = require('express');
const authRouter = require('./auth');
const addressesRouter = require('./addresses');
const productsRouter = require('./products');
const merchantRouter = require('./merchant');
const ordersRouter = require('./orders');
const supportRouter = require('./support');
const adminRouter = require('./admin');
const wishlistRouter = require('./wishlist');
const promoterRouter = require('./promoter');

const router = express.Router();
const fs = require('fs');
const path = require('path');

// Base64 file upload endpoint
router.post('/upload', async (req, res, next) => {
  try {
    const { filename, base64 } = req.body;
    if (!base64 || !filename) {
      return res.status(400).json({ detail: 'Missing base64 data or filename' });
    }

    // Strip out base64 prefixes if present
    const matches = base64.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/);
    let dataBuffer;
    let extension = path.extname(filename) || '.jpg';

    if (matches && matches.length === 3) {
      dataBuffer = Buffer.from(matches[2], 'base64');
      if (!path.extname(filename)) {
        const mime = matches[1];
        if (mime === 'image/png') extension = '.png';
        else if (mime === 'image/gif') extension = '.gif';
        else if (mime === 'image/webp') extension = '.webp';
        else extension = '.jpg';
      }
    } else {
      dataBuffer = Buffer.from(base64, 'base64');
    }

    const uniqueFilename = `${Date.now()}_${Math.random().toString(36).substring(2, 7)}${extension}`;
    const uploadDir = path.join(__dirname, '../../uploads');

    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }

    const filePath = path.join(uploadDir, uniqueFilename);
    fs.writeFileSync(filePath, dataBuffer);

    const isLocal = req.get('host').includes('localhost') || req.get('host').includes('127.0.0.1');
    const protocol = isLocal ? 'http' : 'https';
    const publicUrl = `${protocol}://${req.get('host')}/uploads/${uniqueFilename}`;
    res.status(201).json({ url: publicUrl });
  } catch (error) {
    next(error);
  }
});

router.use('/auth', authRouter);
router.use('/addresses', addressesRouter);
router.use('/products', productsRouter);
router.use('/merchant', merchantRouter);
router.use('/support', supportRouter);
router.use('/admin', adminRouter);
router.use('/wishlist', wishlistRouter);
router.use('/promoter', promoterRouter);

// Cart and Orders share the same underlying routers but have different base paths
router.use('/cart', ordersRouter.cartRouter);
router.use('/orders', ordersRouter.orderRouter);

module.exports = router;
