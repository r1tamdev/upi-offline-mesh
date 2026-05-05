import { Router } from 'express';
import jwt from 'jsonwebtoken';
import User from '../models/user.js';
import { getPublicKeyPem } from '../crypto/ServerKeyHolder.js';
import requireAuth from './requireAuth.js';

const router = Router();

router.get('/pubkey', (_req, res) => {
  res.json({ publicKey: getPublicKeyPem() });
});

router.post('/register', async (req, res) => {
  try {
    const { name, phone, upiId, pin } = req.body;

    if (!name || !phone || !upiId || !pin)
      return res.status(400).json({ error: 'All fields are required' });
    if (String(pin).length !== 4 || isNaN(pin))
      return res.status(400).json({ error: 'PIN must be exactly 4 digits' });

    // Check duplicates separately for better error messages
    const existingPhone = await User.findOne({ phone })
    if (existingPhone)
      return res.status(409).json({ error: 'Mobile number already registered' });

    const existingUpi = await User.findOne({ upiId: upiId.toLowerCase() })
    if (existingUpi)
      return res.status(409).json({ error: 'UPI ID already registered' });

    const user = await User.create({
      name,
      phone,
      upiId: upiId.toLowerCase(),
      pinHash: String(pin)
    });

    const token = jwt.sign(
      { id: user._id, upiId: user.upiId },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );
    res.status(201).json({ token, user: user.toPublic() });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/login', async (req, res) => {
  try {
    const { phone, pin } = req.body;

    if (!phone || !pin)
      return res.status(400).json({ error: 'Phone and PIN are required' });

    const last10 = String(phone).replace(/\D/g, '').slice(-10)
    const user = await User.findOne({
      $or: [
        { phone: phone },
        { phone: { $regex: `${last10}$` } }
      ]
    });

    if (!user)
      return res.status(404).json({ error: 'User not found. Please sign up first.' });

    const ok = await user.verifyPin(String(pin));
    if (!ok)
      return res.status(401).json({ error: 'Wrong PIN' });

    const token = jwt.sign(
      { id: user._id, upiId: user.upiId },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );
    res.json({ token, user: user.toPublic() });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/me', requireAuth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ error: 'User not found' });
    res.json(user.toPublic());
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;