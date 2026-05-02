import crypto from 'crypto';
import { getKeyPair } from './ServerKeyHolder.js';

export function encrypt(instructionObj, publicKeyPem) {
  const plaintext = Buffer.from(JSON.stringify(instructionObj), 'utf8');
  const aesKey = crypto.randomBytes(32);
  const iv = crypto.randomBytes(12);

  const cipher = crypto.createCipheriv('aes-256-gcm', aesKey, iv);
  const ciphertext = Buffer.concat([cipher.update(plaintext), cipher.final()]);
  const tag = cipher.getAuthTag();

  const encryptedKey = crypto.publicEncrypt(
    { key: publicKeyPem, padding: crypto.constants.RSA_PKCS1_OAEP_PADDING, oaepHash: 'sha256' },
    aesKey
  );

  return Buffer.concat([encryptedKey, iv, tag, ciphertext]).toString('base64');
}

export function decrypt(packetB64) {
  const buf = Buffer.from(packetB64, 'base64');
  const encryptedKey = buf.subarray(0, 256);
  const iv           = buf.subarray(256, 268);
  const tag          = buf.subarray(268, 284);
  const ciphertext   = buf.subarray(284);

  const { privateKey } = getKeyPair();
  const aesKey = crypto.privateDecrypt(
    { key: privateKey, padding: crypto.constants.RSA_PKCS1_OAEP_PADDING, oaepHash: 'sha256' },
    encryptedKey
  );

  const decipher = crypto.createDecipheriv('aes-256-gcm', aesKey, iv);
  decipher.setAuthTag(tag);
  const plain = Buffer.concat([decipher.update(ciphertext), decipher.final()]);
  return JSON.parse(plain.toString('utf8'));
}

export function fingerprint(packetB64) {
  return crypto.createHash('sha256').update(packetB64).digest('hex');
}