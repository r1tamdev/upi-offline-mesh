/**
 * Check if Web Share API is available.
 * @returns {boolean}
 */
export function canShareViaBLE() {
  return typeof navigator !== 'undefined' && 'bluetooth' in navigator
}

/**
 * Share the payment packet with a nearby relay using the best available method.
 *
 * Priority:
 *   1. Web Share API (Android Chrome) — opens native share sheet
 *   2. Clipboard API — copies to clipboard, user pastes manually
 *
 * @param {string} packetB64 - base64 encoded payment packet
 * @param {Function} setStatus - callback to show status in UI
 */
export async function sharePacketViaNearby(packetB64, setStatus) {
  const shareText = `upi-mesh:${packetB64}`

  // ── Option 1: Web Share API ──────────────────────────────────────────────
  // Opens the native Android share sheet — user can send via WhatsApp,
  // Telegram, Bluetooth share, NFC, etc.
  if (navigator.share) {
    try {
      setStatus('📲 Opening share options…')
      await navigator.share({
        title: 'UPI Offline Mesh — Payment Packet',
        text: shareText,
      })
      setStatus('✅ Shared! Ask the relay to paste it in the Relay screen.')
      return
    } catch (err) {
      // User cancelled the share sheet — fall through to clipboard
      if (err.name === 'AbortError') {
        setStatus('Share cancelled.')
        return
      }
      // Share failed — fall through to clipboard
      console.warn('Web Share failed, falling back to clipboard:', err.message)
    }
  }

  // ── Option 2: Clipboard API ──────────────────────────────────────────────
  // Copies the full packet string to clipboard.
  // User manually pastes it into the relay's "paste packet" field.
  try {
    await navigator.clipboard.writeText(shareText)
    setStatus('✅ Packet copied to clipboard! Send it to the relay person via WhatsApp or any messaging app. They should paste it in the "paste packet" box.')
  } catch (err) {
    // Clipboard also failed (non-HTTPS or permissions denied)
    setStatus('⚠️ Could not copy automatically. Please manually copy the packet text and send it to the relay.')
    console.error('Clipboard write failed:', err.message)
  }
}

/**
 * Check if the current browser/device supports sharing.
 * @returns {'share' | 'clipboard' | 'manual'}
 */
export function getShareMethod() {
  if (navigator.share) return 'share'       // Android Chrome — native share sheet
  if (navigator.clipboard) return 'clipboard' // Desktop Chrome — clipboard copy
  return 'manual'                            // Fallback — show packet text for manual copy
}