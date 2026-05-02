import crypto from 'crypto'
import { readFileSync, writeFileSync, existsSync } from 'fs'

const KEY_FILE = './keypair.json'
let _keyPair = null

export function getKeyPair() {
  if (_keyPair) return _keyPair

  // Load from file if exists
  if (existsSync(KEY_FILE)) {
    const saved = JSON.parse(readFileSync(KEY_FILE, 'utf8'))
    _keyPair = saved
    console.log('🔑 RSA keypair loaded from file')
    return _keyPair
  }

  // Generate new keypair and save to file
  console.log('🔑 Generating new RSA-2048 keypair...')
  _keyPair = crypto.generateKeyPairSync('rsa', {
    modulusLength: 2048,
    publicKeyEncoding:  { type: 'spki',  format: 'pem' },
    privateKeyEncoding: { type: 'pkcs8', format: 'pem' },
  })

  writeFileSync(KEY_FILE, JSON.stringify(_keyPair))
  console.log('🔑 RSA keypair saved to keypair.json')
  return _keyPair
}

export function getPublicKeyPem() {
  return getKeyPair().publicKey
}