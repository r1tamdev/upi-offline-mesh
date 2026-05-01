import crypto from 'crypto';

let _keyPair = null;

export function getKeyPair() {
  if (!_keyPair) {
    console.log('🔑 Generating RSA-2048 keypair...');
    _keyPair = crypto.generateKeyPairSync('rsa', {
      modulusLength: 2048,
      publicKeyEncoding: { type: 'spki', format: 'pem' },
      privateKeyEncoding: { type: 'pkcs8', format: 'pem' },
    });
    console.log('🔑 RSA keypair ready');
  }
  return _keyPair;
}

export function getPublicKeyPem() {
  return getKeyPair().publicKey;
}