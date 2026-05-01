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
      return res.status(400).json({ error: 'name, phone, upiId, pin are required' });
    if (String(pin).length !== 4 || isNaN(pin))
      return res.status(400).json({ error: 'PIN must be exactly 4 digits' });

    const existing = await User.findOne({ $or: [{ phone }, { upiId: upiId.toLowerCase() }] });
    if (existing)
      return res.status(409).json({ error: 'Phone or UPI ID already registered' });

    const user = await User.create({ name, phone, upiId: upiId.toLowerCase(), pinHash: String(pin) });
    const token = jwt.sign({ id: user._id, upiId: user.upiId }, process.env.JWT_SECRET, { expiresIn: '7d' });
    res.status(201).json({ token, user: user.toPublic() });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/login', async (req, res) => {
  try {
    const { phone, pin } = req.body;
    if (!phone || !pin)
      return res.status(400).json({ error: 'phone and pin are required' });

    const user = await User.findOne({ phone });
    if (!user) return res.status(404).json({ error: 'User not found' });

    const ok = await user.verifyPin(String(pin));
    if (!ok) return res.status(401).json({ error: 'Wrong PIN' });

    const token = jwt.sign({ id: user._id, upiId: user.upiId }, process.env.JWT_SECRET, { expiresIn: '7d' });
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