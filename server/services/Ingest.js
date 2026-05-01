import { decrypt, fingerprint } from '../crypto/HybridCrypto.js';
import { claim, release } from './Idempotency.js';
import { settle } from './Settlement.js';
import Payment from '../models/payment.js';

const FRESHNESS_MS = 24 * 60 * 60 * 1000;

export async function ingest(packetB64, relayedBy = 'anonymous') {
  const hash = fingerprint(packetB64);

  if (!claim(hash)) {
    const existing = await Payment.findOne({ packetHash: hash });
    return {
      outcome: 'DUPLICATE_DROPPED',
      packetHash: hash,
      message: existing ? `Already settled at ${existing.settledAt}` : 'Duplicate in progress',
    };
  }

  let instruction;
  try {
    instruction = decrypt(packetB64);
  } catch (e) {
    return { outcome: 'TAMPERED', packetHash: hash, message: 'Decryption failed' };
  }

  const age = Date.now() - (instruction.signedAt || 0);
  if (age > FRESHNESS_MS || age < 0) {
    release(hash);
    return { outcome: 'EXPIRED', packetHash: hash, message: 'Packet expired' };
  }

  try {
    const payment = await settle(instruction, hash, relayedBy);
    return {
      outcome: 'SETTLED',
      packetHash: hash,
      paymentId: payment._id,
      sender: instruction.sender,
      receiver: instruction.receiver,
      amount: instruction.amount,
      settledAt: payment.settledAt,
    };
  } catch (err) {
    if (err.message === 'INSUFFICIENT_FUNDS') release(hash);
    return { outcome: 'FAILED', packetHash: hash, message: err.message };
  }
}