// Custom BLE service and characteristic UUIDs
// Must match exactly what the payer's peripheral advertises
const SERVICE_UUID        = '12345678-1234-1234-1234-123456789abc'
const CHARACTERISTIC_UUID = 'abcdef12-1234-1234-1234-123456789abc'

/**
 * Check if Web Bluetooth is available in this browser.
 * @returns {boolean}
 */
export function canScanBLE() {
  return (
    typeof navigator !== 'undefined' &&
    'bluetooth' in navigator
  )
}

/**
 * Scan for a nearby UPI Mesh payer device and read their payment packet.
 *
 * Flow:
 *   1. Show browser's BLE device picker (lists nearby devices)
 *   2. User selects "UPI-Mesh-Pay" device
 *   3. Connect to GATT server
 *   4. Read the payment packet from the characteristic
 *   5. Disconnect and return the base64 packet
 *
 * @param {Function} setStatus - callback to show status messages in UI
 * @returns {Promise<string>} base64 encoded payment packet
 */
export async function bleReceivePacket(setStatus) {
  if (!canScanBLE()) {
    throw new Error('Web Bluetooth not supported. Use Chrome on Android or Desktop.')
  }

  try {
    // Step 1 — Show device picker
    setStatus('🔍 Searching for nearby UPI Mesh device…')
    const device = await navigator.bluetooth.requestDevice({
      filters: [
        { name: 'UPI-Mesh-Pay' },           // exact device name match
      ],
      optionalServices: [SERVICE_UUID],      // must declare to access later
    })

    setStatus(`📱 Found: ${device.name}. Connecting…`)

    // Step 2 — Connect to GATT server on payer's device
    const server = await device.gatt.connect()
    setStatus('🔗 Connected. Reading payment packet…')

    // Step 3 — Get the payment service
    const service = await server.getPrimaryService(SERVICE_UUID)

    // Step 4 — Get the packet characteristic
    const characteristic = await service.getCharacteristic(CHARACTERISTIC_UUID)

    // Step 5 — Read the packet value
    const value = await characteristic.readValue()
    const packet = new TextDecoder('utf-8').decode(value)

    // Step 6 — Disconnect cleanly
    device.gatt.disconnect()
    setStatus('✅ Packet received successfully!')

    if (!packet || packet.trim() === '') {
      throw new Error('Received empty packet from device')
    }

    return packet.trim()

  } catch (err) {
    // User cancelled the device picker
    if (err.name === 'NotFoundError') {
      throw err // let the caller handle this silently
    }
    // Device not found nearby
    if (err.name === 'NotSupportedError') {
      throw new Error('BLE service not found on device. Make sure payer has started Bluetooth mode.')
    }
    throw err
  }
}