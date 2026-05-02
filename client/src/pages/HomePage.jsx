import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import api from '../utils/api'

export default function HomePage() {
  const { user, logout, refreshUser } = useAuth()
  const navigate = useNavigate()
  const [history, setHistory]           = useState([])
  const [loadingHistory, setLoadingHistory] = useState(true)

  useEffect(() => {
    refreshUser().catch(() => {})
    api.get('/payment/history')
      .then((r) => setHistory(r.data))
      .catch(() => {})
      .finally(() => setLoadingHistory(false))
  }, [])

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-sm mx-auto p-4 space-y-4">

        {/* Header */}
        <div className="flex items-center gap-3 pt-4">
          <div className="w-10 h-10 rounded-2xl bg-green-600 flex items-center justify-center text-lg shrink-0">
            📡
          </div>
          <div className="flex-1 min-w-0">
            <div className="font-bold text-gray-900">{user?.name}</div>
            <div className="text-xs text-gray-400 truncate">{user?.upiId}</div>
          </div>
          <button
            onClick={logout}
            className="text-xs text-gray-500 border border-gray-200 px-3 py-1.5 rounded-lg"
          >
            Sign out
          </button>
        </div>

        {/* Balance card */}
        <div className="bg-green-600 rounded-2xl p-6 text-white">
          <div className="text-sm opacity-75 mb-1">Available balance</div>
          <div className="text-4xl font-bold tracking-tight">
            ₹{user?.balance?.toLocaleString('en-IN') ?? '—'}
          </div>
        </div>

        {/* Action cards */}
        <div className="grid grid-cols-2 gap-3">
          <button
            onClick={() => navigate('/pay')}
            className="bg-white border border-gray-200 rounded-2xl p-4 text-left hover:border-green-400 transition-colors"
          >
            <div className="text-3xl mb-2">💸</div>
            <div className="font-bold text-gray-900">Pay</div>
            <div className="text-xs text-gray-400 mt-0.5">Send via QR / Bluetooth</div>
          </button>
          <button
            onClick={() => navigate('/relay')}
            className="bg-white border border-gray-200 rounded-2xl p-4 text-left hover:border-blue-400 transition-colors"
          >
            <div className="text-3xl mb-2">📡</div>
            <div className="font-bold text-gray-900">Relay</div>
            <div className="text-xs text-gray-400 mt-0.5">Help someone pay · QR / BLE</div>
          </button>
        </div>

        {/* Transaction history */}
        <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
          <div className="px-4 py-3 border-b border-gray-100 font-semibold text-gray-900">
            Recent transactions
          </div>
          {loadingHistory ? (
            <div className="px-4 py-6 text-center text-sm text-gray-400">Loading…</div>
          ) : history.length === 0 ? (
            <div className="px-4 py-6 text-center text-sm text-gray-400">No transactions yet</div>
          ) : (
            history.map((tx) => {
              const isSent = tx.sender === user?.upiId
              return (
                <div key={tx._id} className="flex items-center px-4 py-3 border-b border-gray-50 last:border-0">
                  <div className={`w-9 h-9 rounded-xl flex items-center justify-center text-sm mr-3 shrink-0 ${isSent ? 'bg-red-50' : 'bg-green-50'}`}>
                    {isSent ? '↑' : '↓'}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-semibold text-gray-900 truncate">
                      {isSent ? tx.receiver : tx.sender}
                    </div>
                    <div className="text-xs text-gray-400">
                      {new Date(tx.settledAt).toLocaleString()}
                    </div>
                  </div>
                  <div className={`font-bold text-sm shrink-0 ${isSent ? 'text-red-500' : 'text-green-600'}`}>
                    {isSent ? '-' : '+'}₹{tx.amount}
                  </div>
                </div>
              )
            })
          )}
        </div>

      </div>
    </div>
  )
}