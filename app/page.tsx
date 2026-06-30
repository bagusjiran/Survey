'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'

interface Member {
  id: string
  full_name: string
}

export default function LoginPage() {
  const [members, setMembers] = useState<Member[]>([])
  const [selectedId, setSelectedId] = useState('')
  const [nim, setNim] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [membersLoading, setMembersLoading] = useState(true)
  const nimRef = useRef<HTMLInputElement>(null)
  const router = useRouter()

  useEffect(() => {
    fetch('/api/auth/members')
      .then(function (r) { return r.json() })
      .then(function (data) { setMembers(data.members || []) })
      .catch(function () { console.error('Gagal memuat') })
      .finally(function () { setMembersLoading(false) })
  }, [])

  var selectedMember = members.find(function (m) { return m.id === selectedId })

  function handleNameChange(e: React.ChangeEvent<HTMLSelectElement>) {
    var value = e.target.value
    setSelectedId(value)
    setError('')
    if (value && nimRef.current) {
      setTimeout(function () { nimRef.current!.focus() }, 150)
    }
  }

  function handleNimChange(e: React.ChangeEvent<HTMLInputElement>) {
    var val = e.target.value.replace(/[^0-9]/g, '')
    setNim(val)
  }

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    if (loading) return
    setLoading(true)
    setError('')

    if (!selectedMember) {
      setError('Pilih nama anggota terlebih dahulu')
      setLoading(false)
      return
    }
    if (!nim.trim()) {
      setError('Masukkan NIM (sandi)')
      setLoading(false)
      return
    }

    try {
      var res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fullName: selectedMember.full_name,
          nim: nim.trim(),
        }),
      })
      var data = await res.json()

      if (!res.ok) {
        setError(data.error || 'Terjadi kesalahan')
        setLoading(false)
        return
      }

      window.location.href = data.isAdmin ? '/admin' : '/survey'
    } catch (err) {
      setError('Gagal terhubung ke server')
      setLoading(false)
    }
  }

  return (
    <div className="login-page">
      <div className="login-container">
        {/* Logo */}
        <div className="login-logo-wrap">
          <div className="login-logo-icon">
            <svg width="32" height="32" fill="none" viewBox="0 0 24 24" stroke="white" strokeWidth="1.5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 21v-8.25M15.75 21v-8.25M8.25 21v-8.25M3 9l9-6 9 6m-1.5 12V10.332A48.36 48.36 0 0012 9.75c-2.551 0-5.056.2-7.5.582V21M3 21h18M12 6.75h.008v.008H12V6.75z" />
            </svg>
          </div>
          <h1 className="login-title">Survey UKM Kerohanian Islam</h1>
          <p className="login-subtitle">Universitas Teknologi Ronggolawe — Cepu</p>
        </div>

        {/* Login Card */}
        <div className="login-card">
          <form onSubmit={handleLogin} autoComplete="off">
            {/* Dropdown Nama */}
            <div className="login-field">
              <label htmlFor="member-select" className="login-label">Nama Anggota</label>
              {membersLoading ? (
                <div className="login-loading">
                  <div className="spinner"></div>
                  <span>Memuat...</span>
                </div>
              ) : (
                <select
                  id="member-select"
                  value={selectedId}
                  onChange={handleNameChange}
                  required
                  className="login-select"
                >
                  <option value="">-- Pilih Nama --</option>
                  {members.map(function (m) {
                    return <option key={m.id} value={m.id}>{m.full_name}</option>
                  })}
                </select>
              )}
            </div>

            {/* NIM */}
            <div className="login-field">
              <label htmlFor="nim-input" className="login-label">NIM (Sandi)</label>
              <input
                ref={nimRef}
                id="nim-input"
                type="tel"
                value={nim}
                onChange={handleNimChange}
                placeholder="Masukkan NIM Anda"
                autoComplete="off"
                autoCorrect="off"
                autoCapitalize="off"
                spellCheck={false}
                required
                className="login-input"
              />
              {!selectedId && (
                <p className="login-hint">Pilih nama terlebih dahulu</p>
              )}
            </div>

            {/* Error */}
            {error && (
              <div className="login-error">{error}</div>
            )}

            {/* Submit */}
            <button
              type="submit"
              className="login-btn"
              disabled={loading}
            >
              {loading ? 'Memproses...' : 'Masuk'}
            </button>
          </form>
        </div>

        <p className="login-footer">
          UKM Kerohanian Islam &copy; {new Date().getFullYear()} UTR Cepu
        </p>
      </div>
    </div>
  )
}
