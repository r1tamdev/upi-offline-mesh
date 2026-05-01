import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export default function AuthPage() {
  const { login, register } = useAuth()
  const navigate = useNavigate()
  const [mode, setMode]       = useState('login')
  const [loading, setLoading] = useState(false)
  const [error, setError]     = useState('')
  const [form, setForm]       = useState({ name: '', phone: '', upiId: '', pin: '' })
  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }))

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      if (mode === 'login') await login(form.phone, form.pin)
      else await register(form.name, form.phone, form.upiId, form.pin)
      navigate('/')
    } catch (err) {
      setError(err.response?.data?.error || err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="text-5xl mb-3">📡</div>
          <h1 className="text-2xl font-bold text-gray-900">
            {import.meta.env.VITE_APP_NAME || 'UPI Offline Mesh'}
          </h1>
          <p className="text-sm text-gray-500 mt-1">Pay without internet via trusted relays</p>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
          {/* Tab switcher */}
          <div className="flex bg-gray-100 rounded-xl p-1 mb-6">
            {['login', 'register'].map((m) => (
              <button
                key={m}
                onClick={() => { setMode(m); setError('') }}
                className={`flex-1 py-2 rounded-lg text-sm font-semibold transition-all ${
                  mode === m ? 'bg-white shadow text-gray-900' : 'text-gray-500'
                }`}
              >
                {m === 'login' ? 'Sign in' : 'Register'}
              </button>
            ))}
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {mode === 'register' && (
              <>
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">Full name</label>
                  <input
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-green-500"
                    placeholder=""
                    value={form.name}
                    onChange={set('name')}
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">UPI ID</label>
                  <input
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-green-500"
                    placeholder=""
                    value={form.upiId}
                    onChange={set('upiId')}
                    required
                  />
                </div>
              </>
            )}
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Phone number</label>
              <input
                className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-green-500"
                placeholder=""
                value={form.phone}
                onChange={set('phone')}
                type="tel"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">4-digit UPI PIN</label>
              <input
                className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-green-500 tracking-widest"
                placeholder=""
                value={form.pin}
                onChange={set('pin')}
                type="password"
                maxLength={4}
                inputMode="numeric"
                required
              />
            </div>

            {error && (
              <div className="bg-red-50 text-red-700 text-sm px-4 py-3 rounded-xl">{error}</div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-green-600 hover:bg-green-700 disabled:opacity-50 text-white font-semibold py-3 rounded-xl transition-colors"
            >
              {loading ? 'Please wait…' : mode === 'login' ? 'Sign in' : 'Create account'}
            </button>
          </form>
        </div>

        <p className="text-center text-xs text-gray-400 mt-4">
          Works on LAN · No cloud needed · Chrome recommended
        </p>
      </div>
    </div>
  )
}