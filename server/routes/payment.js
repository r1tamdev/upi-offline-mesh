import { Router } from 'express';
import Payment from '../models/payment.js';
import { ingest } from '../services/Ingest.js';
import requireAuth from './requireAuth.js';

const router = Router();

router.post('/relay', async (req, res) => {
  try {
    const { packet, relayedBy } = req.body;
    if (!packet || typeof packet !== 'string')
      return res.status(400).json({ error: '"packet" (base64 string) is required' });

    const result = await ingest(packet, relayedBy || 'anonymous');
    console.log('[Relay]', result.outcome, result.packetHash?.slice(0, 12));
    const statusCode = ['SETTLED', 'DUPLICATE_DROPPED'].includes(result.outcome) ? 200 : 422;
    res.status(statusCode).json(result);
  } catch (err) {
    console.error('[Relay] Unhandled error:', err);
    res.status(500).json({ error: err.message });
  }
});

router.get('/status/:packetHash', async (req, res) => {
  try {
    const payment = await Payment.findOne({ packetHash: req.params.packetHash });
    if (!payment) return res.status(404).json({ status: 'PENDING' });
    res.json({
      status: payment.status,
      amount: payment.amount,
      sender: payment.sender,
      receiver: payment.receiver,
      settledAt: payment.settledAt,
      relayedBy: payment.relayedBy,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/history', requireAuth, async (req, res) => {
  try {
    const { upiId } = req.user;
    const payments = await Payment.find({ $or: [{ sender: upiId }, { receiver: upiId }] })
      .sort({ settledAt: -1 }).limit(30);
    res.json(payments);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/all', async (_req, res) => {
  try {
    const payments = await Payment.find({}).sort({ settledAt: -1 }).limit(50);
    res.json(payments);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;