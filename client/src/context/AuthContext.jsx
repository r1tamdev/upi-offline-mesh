import React, { createContext, useContext, useState, useEffect, useCallback } from 'react'
import api from '../utils/api'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser]   = useState(null)
  const [ready, setReady] = useState(false)

  useEffect(() => {
    const token = localStorage.getItem('token')
    if (!token) { setReady(true); return }
    api.get('/auth/me')
      .then((r) => setUser(r.data))
      .catch(() => localStorage.removeItem('token'))
      .finally(() => setReady(true))
  }, [])

  const login = useCallback(async (phone, pin) => {
    const res = await api.post('/auth/login', { phone, pin })
    localStorage.setItem('token', res.data.token)
    setUser(res.data.user)
    return res.data.user
  }, [])

  const register = useCallback(async (name, phone, upiId, pin) => {
    const res = await api.post('/auth/register', { name, phone, upiId, pin })
    localStorage.setItem('token', res.data.token)
    setUser(res.data.user)
    return res.data.user
  }, [])

  const logout = useCallback(() => {
    localStorage.removeItem('token')
    setUser(null)
  }, [])

  const refreshUser = useCallback(async () => {
    const res = await api.get('/auth/me')
    setUser(res.data)
    return res.data
  }, [])

  return (
    <AuthContext.Provider value={{ user, ready, login, register, logout, refreshUser }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() { return useContext(AuthContext) }