async function importPublicKey(pem) {
  const b64 = pem
    .replace('-----BEGIN PUBLIC KEY-----', '')
    .replace('-----END PUBLIC KEY-----', '')
    .replace(/\s/g, '')
  const der = Uint8Array.from(atob(b64), (c) => c.charCodeAt(0))
  return crypto.subtle.importKey(
    'spki',
    der.buffer,
    { name: 'RSA-OAEP', hash: 'SHA-256' },
    false,
    ['wrapKey']
  )
}

export async function encryptPacket(instruction, publicKeyPem) {
  const rsaKey = await importPublicKey(publicKeyPem)

  const aesKey = await crypto.subtle.generateKey(
    { name: 'AES-GCM', length: 256 },
    true,
    ['encrypt']
  )

  const iv = crypto.getRandomValues(new Uint8Array(12))
  const plaintext = new TextEncoder().encode(JSON.stringify(instruction))

  const ciphertextWithTag = await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv },
    aesKey,
    plaintext
  )

  const ctArray    = new Uint8Array(ciphertextWithTag)
  const ciphertext = ctArray.slice(0, ctArray.length - 16)
  const tag        = ctArray.slice(ctArray.length - 16)

  const wrappedKey = await crypto.subtle.wrapKey('raw', aesKey, rsaKey, {
    name: 'RSA-OAEP',
  })

  const packet = new Uint8Array(256 + 12 + 16 + ciphertext.length)
  packet.set(new Uint8Array(wrappedKey), 0)
  packet.set(iv, 256)
  packet.set(tag, 268)
  packet.set(ciphertext, 284)

  return btoa(String.fromCharCode(...packet))
}

/**
 * Compute the SHA-256 fingerprint of a base64 packet string.
 * Must produce the exact same hex digest as the server's
 * crypto.createHash('sha256').update(packetB64).digest('hex')
 */
export async function fingerprint(packetB64) {
  const data = new TextEncoder().encode(packetB64)
  const hashBuffer = await crypto.subtle.digest('SHA-256', data)
  const hashArray = Array.from(new Uint8Array(hashBuffer))
  return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('')
}