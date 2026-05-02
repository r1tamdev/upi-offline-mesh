/**
 * BLE utility for UPI Mesh Bluetooth packet transfer.
 *
 * Architecture:
 *   Payer phone (no internet)  →  BLE Peripheral (GATT server)
 *   Relay phone (has internet) →  BLE Central   (GATT client)
 *
 * The relay uses the standard Web Bluetooth requestDevice() API (well
 * supported on Chrome Android / Desktop) to discover and connect to
 * the payer's device, then reads the encrypted packet from a custom
 * GATT characteristic.
 *
 * The payer uses the EXPERIMENTAL Web Bluetooth peripheral API
 * (available in Chrome Android with the
 * "Experimental Web Platform features" flag enabled).
 *
 * When the experimental API is unavailable on the payer's device,
 * the UI gracefully falls back to QR code sharing.
 */

// ── Custom 128-bit UUIDs unique to UPI Mesh ──
export const SERVICE_UUID = '0000ff01-0000-1000-8000-00805f9b34fb'
export const PACKET_CHAR_UUID = '0000ff02-0000-1000-8000-00805f9b34fb'
export const STATUS_CHAR_UUID = '0000ff03-0000-1000-8000-00805f9b34fb'

// ── Feature detection helpers ──

/** Can this browser scan & connect to BLE devices? (Central / GATT client) */
export function canScanBLE() {
  return typeof navigator !== 'undefined' &&
    !!navigator.bluetooth &&
    typeof navigator.bluetooth.requestDevice === 'function'
}

// ────────────────────────────────────────────────────────────────────────────
//  RELAY SIDE — BLE Central (standard Web Bluetooth)
// ────────────────────────────────────────────────────────────────────────────

/**
 * Scan for a nearby UPI-Mesh payer, connect, read the encrypted packet.
 *
 * @param {(msg:string)=>void} onStatus  real-time status updates for UI
 * @returns {Promise<string>}  base64 packet string
 */
export async function bleReceivePacket(onStatus = () => {}) {
  if (!canScanBLE()) {
    throw new Error(
      'Web Bluetooth is not supported in this browser. Use Chrome on Android or Desktop.'
    )
  }

  // 1. Let the user pick a nearby device advertising our service
  onStatus('Looking for nearby UPI Mesh payers…')
  const device = await navigator.bluetooth.requestDevice({
    filters: [{ services: [SERVICE_UUID] }],
    optionalServices: [SERVICE_UUID],
  })

  if (!device) throw new Error('No device selected.')

  onStatus(`Connecting to ${device.name || 'UPI Mesh payer'}…`)
  const server = await device.gatt.connect()

  onStatus('Discovering payment service…')
  const service = await server.getPrimaryService(SERVICE_UUID)

  onStatus('Reading encrypted packet…')
  const packetChar = await service.getCharacteristic(PACKET_CHAR_UUID)

  // Read the full packet — may need multiple reads if large
  // BLE GATT reads max ~512 bytes.  Our packets are typically 400-600 bytes
  // base64, so a single read should suffice.  If not, we concatenate.
  const value = await packetChar.readValue()
  let packetB64 = new TextDecoder().decode(value.buffer)

  // If packet seems truncated (no valid base64 ending), try subscribing to
  // notifications and receiving the rest
  if (packetB64.length > 0 && packetB64.length % 4 !== 0) {
    onStatus('Reading remaining chunks…')
    // Try to read again — some GATT servers send in chunks via notify
    try {
      await packetChar.startNotifications()
      const extra = await new Promise((resolve, reject) => {
        const timeout = setTimeout(() => resolve(''), 3000)
        packetChar.addEventListener('characteristicvaluechanged', (e) => {
          clearTimeout(timeout)
          resolve(new TextDecoder().decode(e.target.value.buffer))
        }, { once: true })
      })
      packetB64 += extra
      await packetChar.stopNotifications()
    } catch { /* single-read was enough */ }
  }

  // 2. Send an ACK so the payer knows someone picked it up
  onStatus('Confirming receipt…')
  try {
    const statusChar = await service.getCharacteristic(STATUS_CHAR_UUID)
    await statusChar.writeValue(new TextEncoder().encode('ACK'))
  } catch { /* status char is optional */ }

  // 3. Disconnect cleanly
  device.gatt.disconnect()
  onStatus('Packet received via Bluetooth!')

  if (!packetB64 || packetB64.length < 10) {
    throw new Error('Received empty or invalid packet from BLE device.')
  }

  return packetB64
}
