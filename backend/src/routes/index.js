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

const config = require('../config');
const router = express.Router();
const fs = require('fs');
const path = require('path');
const cloudinary = require('cloudinary').v2;

// Configure Cloudinary if credentials are provided in env
if (process.env.CLOUDINARY_CLOUD_NAME && process.env.CLOUDINARY_API_KEY && process.env.CLOUDINARY_API_SECRET) {
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
  });
}

// Base64 file upload endpoint
router.post('/upload', async (req, res, next) => {
  try {
    const { filename, base64, folder } = req.body;
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

    // Attempt to upload to Cloudinary first if configured
    if (process.env.CLOUDINARY_CLOUD_NAME && process.env.CLOUDINARY_API_KEY && process.env.CLOUDINARY_API_SECRET) {
      try {
        const dataUri = matches ? matches[0] : `data:image/jpeg;base64,${base64}`;
        const uploadResult = await new Promise((resolve, reject) => {
          cloudinary.uploader.upload(dataUri, {
            folder: folder || 'ratnamayuri_products',
            resource_type: 'auto'
          }, (error, result) => {
            if (error) reject(error);
            else resolve(result);
          });
        });
        return res.status(201).json({ url: uploadResult.secure_url });
      } catch (cloudinaryError) {
        console.error('[Cloudinary Upload Error] Falling back to local disk write:', cloudinaryError);
      }
    }

    // Fallback: Save file to local directory
    const uniqueFilename = `${Date.now()}_${Math.random().toString(36).substring(2, 7)}${extension}`;
    const uploadDir = path.join(__dirname, '../../uploads');

    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }

    const filePath = path.join(uploadDir, uniqueFilename);
    fs.writeFileSync(filePath, dataBuffer);

    // Dynamically resolve public URL from request context to avoid env configuration mismatch
    const protocol = req.secure || req.headers['x-forwarded-proto'] === 'https' ? 'https' : 'http';
    const host = req.get('host');
    const publicUrl = `${protocol}://${host}/uploads/${uniqueFilename}`;

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
