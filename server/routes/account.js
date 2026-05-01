import { Router } from 'express';
import User from '../models/user.js';
import requireAuth from './requireAuth.js';

const router = Router();

router.get('/balance', requireAuth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ error: 'Not found' });
    res.json({ upiId: user.upiId, balance: user.balance });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/users', requireAuth, async (req, res) => {
  try {
    const users = await User.find({}, 'name upiId -_id').sort({ name: 1 });
    res.json(users);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;