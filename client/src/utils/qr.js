import QRCode from 'qrcode'

export async function generateQR(packetB64) {
  return QRCode.toDataURL(`upi-mesh:${packetB64}`, {
    errorCorrectionLevel: 'M',
    width: 280,
    margin: 2,
    color: { dark: '#1a1a18', light: '#ffffff' },
  })
}

export function parseQR(scannedText) {
  if (!scannedText.startsWith('upi-mesh:')) return null
  return scannedText.slice('upi-mesh:'.length)
}