const express = require('express');
const Address = require('../models/Address');
const { getCurrentUser } = require('../middleware/auth');

const router = express.Router();

router.use(getCurrentUser);

// List addresses
router.get('/', async (req, res, next) => {
  try {
    const addresses = await Address.find({ user_id: req.user.id })
      .sort({ is_default: -1, created_at: -1 });
    res.json(addresses);
  } catch (error) {
    next(error);
  }
});

const { validatePhone, validatePincode } = require('../utils/validators');

// Create address
router.post('/', async (req, res, next) => {
  try {
    const payload = req.body;

    if (payload.phone && !validatePhone(payload.phone.trim().replace(/\D/g, ''))) {
      return res.status(400).json({ detail: 'Please enter a valid 10-digit Indian mobile number (starting with 6, 7, 8, or 9).' });
    }

    if (payload.pincode && !validatePincode(payload.pincode.trim())) {
      return res.status(400).json({ detail: 'Please enter a valid 6-digit Indian PIN code.' });
    }

    if (payload.is_default) {
      // Unset other defaults for this user
      await Address.updateMany({ user_id: req.user.id }, { is_default: false });
    }

    const address = new Address({
      user_id: req.user.id,
      ...payload
    });

    await address.save();
    res.status(201).json(address);
  } catch (error) {
    next(error);
  }
});

// Update address
router.put('/:address_id', async (req, res, next) => {
  try {
    const addressId = Number(req.params.address_id);
    const payload = req.body;

    const address = await Address.findOne({ id: addressId, user_id: req.user.id });
    if (!address) {
      return res.status(404).json({ detail: 'Address not found' });
    }

    if (payload.is_default) {
      // Unset other defaults for this user
      await Address.updateMany({ user_id: req.user.id, id: { $ne: addressId } }, { is_default: false });
    }

    Object.assign(address, payload);
    await address.save();

    res.json(address);
  } catch (error) {
    next(error);
  }
});

// Delete address
router.delete('/:address_id', async (req, res, next) => {
  try {
    const addressId = Number(req.params.address_id);
    const address = await Address.findOne({ id: addressId, user_id: req.user.id });
    if (!address) {
      return res.status(404).json({ detail: 'Address not found' });
    }

    await Address.deleteOne({ id: addressId, user_id: req.user.id });
    res.status(204).end();
  } catch (error) {
    next(error);
  }
});

module.exports = router;
