import React, { useState, useRef, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { parseQR } from '../utils/qr'
import { useAuth } from '../context/AuthContext'
import api from '../utils/api'

export default function RelayPage() {
  const { user } = useAuth()
  const navigate = useNavigate()

  const [step, setStep]         = useState('idle')
  const [packet, setPacket]     = useState('')
  const [result, setResult]     = useState(null)
  const [error, setError]       = useState('')
  const [camError, setCamError] = useState('')
  const [manualText, setManualText] = useState('')

  const videoRef   = useRef(null)
  const streamRef  = useRef(null)
  const scannerRef = useRef(null)

  async function startCamera() {
    setCamError(''); setStep('scanning')
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment', width: { ideal: 1280 } },
      })
      streamRef.current = stream
      if (videoRef.current) {
        videoRef.current.srcObject = stream
        await videoRef.current.play()
        startFrameScan()
      }
    } catch (err) {
      setCamError(`Camera error: ${err.message}. Use manual paste instead.`)
      setStep('idle')
    }
  }

  function stopCamera() {
    streamRef.current?.getTracks().forEach((t) => t.stop())
    clearInterval(scannerRef.current)
  }

  function startFrameScan() {
    if ('BarcodeDetector' in window) {
      const detector = new BarcodeDetector({ formats: ['qr_code'] })
      scannerRef.current = setInterval(async () => {
        if (!videoRef.current) return
        try {
          const codes = await detector.detect(videoRef.current)
          if (codes.length > 0) handleScannedText(codes[0].rawValue)
        } catch { }
      }, 500)
    } else {
      setCamError('BarcodeDetector not supported. Use paste below.')
      stopCamera(); setStep('idle')
    }
  }

  function handleScannedText(text) {
    stopCamera()
    const p = parseQR(text)
    if (!p) { setCamError('Not a valid UPI Mesh QR. Try again.'); setStep('idle'); return }
    setPacket(p); setStep('preview')
  }

  useEffect(() => () => stopCamera(), [])

  async function handleUpload() {
    setStep('uploading'); setError('')
    try {
      const res = await api.post('/payment/relay', {
        packet, relayedBy: user?.upiId || 'anonymous',
      })
      setResult(res.data)
      if (['SETTLED', 'DUPLICATE_DROPPED'].includes(res.data.outcome)) {
        sessionStorage.setItem('settledHash', res.data.packetHash)
      }
      setStep('result')
    } catch (err) {
      setError(err.response?.data?.error || err.message)
      setStep('preview')
    }
  }

  function handleManualPaste() {
    const p = parseQR(manualText.trim()) || manualText.trim()
    if (!p) return setError('Paste the full packet starting with "upi-mesh:"')
    setPacket(p); setStep('preview'); setError('')
  }

  if (step === 'result') return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4 text-center gap-4">
      <div className="text-6xl">
        {result?.outcome === 'SETTLED' ? '✅' : result?.outcome === 'DUPLICATE_DROPPED' ? '🟡' : '❌'}
      </div>
      <h1 className={`text-2xl font-bold ${result?.outcome === 'SETTLED' ? 'text-green-600' : result?.outcome === 'DUPLICATE_DROPPED' ? 'text-yellow-600' : 'text-red-500'}`}>
        {result?.outcome === 'SETTLED' ? 'Payment relayed!' : result?.outcome === 'DUPLICATE_DROPPED' ? 'Already settled' : 'Upload failed'}
      </h1>
      {result?.outcome === 'SETTLED' && (
        <p className="text-gray-600">₹{result.amount} · {result.sender} → {result.receiver}</p>
      )}
      {result?.message && <p className="text-sm text-gray-400">{result.message}</p>}
      <p className="text-xs text-gray-300">Hash: {result?.packetHash?.slice(0, 16)}…</p>
      <button
        onClick={() => { setStep('idle'); setPacket(''); setResult(null) }}
        className="bg-green-600 text-white font-semibold px-6 py-3 rounded-xl"
      >
        Relay another
      </button>
      <button onClick={() => navigate('/')} className="border border-gray-200 px-6 py-3 rounded-xl text-sm">
        Home
      </button>
    </div>
  )

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-sm mx-auto p-4 space-y-4">
        <div className="flex items-center gap-3 pt-4">
          <button onClick={() => navigate('/')} className="text-sm border border-gray-200 px-3 py-1.5 rounded-lg">← Back</button>
          <h2 className="font-bold text-gray-900">Relay a payment</h2>
        </div>

        {/* Camera */}
        {step === 'scanning' && (
          <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
            <video ref={videoRef} className="w-full" muted playsInline />
            <div className="p-3 text-center">
              <button onClick={() => { stopCamera(); setStep('idle') }} className="text-sm border border-gray-200 px-4 py-2 rounded-lg">
                Cancel
              </button>
            </div>
          </div>
        )}

        {step !== 'scanning' && (
          <>
            <div className="bg-white rounded-2xl border border-gray-200 p-6 text-center">
              <div className="text-4xl mb-3">📷</div>
              <p className="text-sm text-gray-500 mb-4">Scan the payer's QR code with your camera</p>
              <button
                onClick={startCamera}
                disabled={step === 'uploading'}
                className="bg-green-600 hover:bg-green-700 disabled:opacity-50 text-white font-semibold px-6 py-3 rounded-xl transition-colors"
              >
                📷 Scan QR code
              </button>
            </div>

            {camError && (
              <div className="bg-yellow-50 text-yellow-700 text-sm px-4 py-3 rounded-xl">{camError}</div>
            )}

            {/* Manual paste */}
            <div className="bg-white rounded-2xl border border-gray-200 p-5">
              <div className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">Or paste packet manually</div>
              <textarea
                rows={3}
                placeholder="upi-mesh:AAAA...base64..."
                value={manualText}
                onChange={(e) => setManualText(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-gray-200 font-mono text-xs resize-none focus:outline-none focus:border-green-500"
              />
              {error && <div className="bg-red-50 text-red-700 text-sm px-3 py-2 rounded-lg mt-2">{error}</div>}
              <button
                onClick={handleManualPaste}
                className="mt-3 w-full border border-gray-200 font-semibold py-2.5 rounded-xl text-sm hover:bg-gray-50 transition-colors"
              >
                Use pasted packet
              </button>
            </div>
          </>
        )}

        {/* Preview */}
        {step === 'preview' && (
          <div className="bg-white rounded-2xl border border-gray-200 p-5 space-y-4">
            <h2 className="font-bold text-gray-900">Packet ready to upload</h2>
            <div className="bg-gray-50 rounded-xl p-3 font-mono text-xs text-gray-400 break-all max-h-16 overflow-hidden">
              {packet.slice(0, 120)}…
            </div>
            <div className="bg-blue-50 text-blue-700 text-xs px-4 py-3 rounded-xl">
              This packet is encrypted — you cannot read its contents. Uploading it helps the payer send money.
            </div>
            {error && <div className="bg-red-50 text-red-700 text-sm px-4 py-3 rounded-xl">{error}</div>}
            <div className="flex gap-3">
              <button onClick={() => setStep('idle')} className="border border-gray-200 px-4 py-2.5 rounded-xl text-sm font-semibold">
                Cancel
              </button>
              <button
                onClick={handleUpload}
                className="flex-1 bg-green-600 hover:bg-green-700 text-white font-semibold py-2.5 rounded-xl transition-colors"
              >
                📡 Upload to bank server
              </button>
            </div>
          </div>
        )}

        {step === 'uploading' && (
          <div className="bg-white rounded-2xl border border-gray-200 p-6 text-center">
            <div className="w-8 h-8 border-2 border-green-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
            <p className="text-sm text-gray-500">Uploading to server…</p>
          </div>
        )}

        {step === 'idle' && (
          <div className="bg-blue-50 text-blue-700 text-sm px-4 py-3 rounded-xl">
            💡 You are acting as a relay. The payer has no internet — you're carrying their encrypted payment to the bank.
          </div>
        )}

      </div>
    </div>
  )
}