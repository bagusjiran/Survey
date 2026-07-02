'use client'

import { useState, useRef, useEffect } from 'react'
import DarkModeToggle from '@/components/DarkModeToggle'

interface Member {
  id: string
  full_name: string
}

export default function LoginClient({ members }: { members: Member[] }) {
  const [selectedName, setSelectedName] = useState('')
  const [nim, setNim] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const nimRef = useRef<HTMLInputElement>(null)

  useEffect(function () {
    var params = new URLSearchParams(window.location.search)
    var err = params.get('error')
    if (err) {
      setError(decodeURIComponent(err))
      window.history.replaceState({}, '', '/')
    }
  }, [])

  function handleNameChange(e: React.ChangeEvent<HTMLSelectElement>) {
    setSelectedName(e.target.value)
    setError('')
    if (e.target.value && nimRef.current) {
      setTimeout(function () { nimRef.current!.focus() }, 150)
    }
  }

  function handleNimChange(e: React.ChangeEvent<HTMLInputElement>) {
    setNim(e.target.value.replace(/[^0-9]/g, ''))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (loading) return

    if (!selectedName) { setError('Pilih nama anggota terlebih dahulu'); return }
    if (!nim.trim()) { setError('Masukkan NIM (sandi)'); return }

    setLoading(true)
    setError('')

    try {
      var res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fullName: selectedName, nim: nim.trim() }),
      })
      var data = await res.json()

      if (!res.ok) { setError(data.error || 'Terjadi kesalahan'); setLoading(false); return }

      await new Promise(function (r) { setTimeout(r, 300) })
      window.location.href = '/survey'
    } catch (err) {
      var form = document.getElementById('login-form') as HTMLFormElement
      if (form) { form.submit() } else { setError('Gagal terhubung ke server'); setLoading(false) }
    }
  }

  return (
    <div className="login-page">
      <div className="login-container">
        {/* Dark mode toggle */}
        <div className="absolute top-4 right-4">
          <DarkModeToggle />
        </div>

        <div className="login-logo-wrap">
          <div className="login-logo-icon" aria-hidden="true">
            <i className="bi bi-building text-white text-2xl" />
          </div>
          <h1 className="login-title">Survey UKM Kerohanian Islam</h1>
          <p className="login-subtitle">Universitas Teknologi Ronggolawe — Cepu</p>
        </div>

        <div className="login-card">
          <form id="login-form" method="POST" action="/api/auth/login" onSubmit={handleSubmit} autoComplete="off" aria-label="Form Login">
            <input type="hidden" name="fullName" value={selectedName} />
            <input type="hidden" name="nim" value={nim} />

            <div className="login-field">
              <label htmlFor="member-select" className="login-label">Nama Anggota</label>
              <select id="member-select" value={selectedName} onChange={handleNameChange} required className="login-select" aria-required="true">
                <option value="">-- Pilih Nama --</option>
                {members.map(function (m) {
                  return <option key={m.id} value={m.full_name}>{m.full_name}</option>
                })}
              </select>
            </div>

            <div className="login-field">
              <label htmlFor="nim-input" className="login-label">NIM (Sandi)</label>
              <input
                ref={nimRef} id="nim-input" type="tel" value={nim} onChange={handleNimChange}
                placeholder="Masukkan NIM Anda" autoComplete="off" autoCorrect="off" autoCapitalize="off"
                spellCheck={false} required className="login-input" aria-required="true"
                aria-describedby={error ? 'login-error' : 'nim-hint'}
              />
              {!selectedName && <p id="nim-hint" className="login-hint" role="status">Pilih nama terlebih dahulu</p>}
            </div>

            {error && <div id="login-error" className="login-error" role="alert" aria-live="assertive">{error}</div>}

            <button type="submit" className="login-btn" disabled={loading} aria-busy={loading}>
              {loading ? <><i className="bi bi-arrow-repeat animate-spin mr-2" />Memproses...</> : <><i className="bi bi-box-arrow-in-right mr-2" />Masuk</>}
            </button>
          </form>
        </div>

        <p className="login-footer">UKM Kerohanian Islam &copy; {new Date().getFullYear()} UTR Cepu</p>
      </div>
    </div>
  )
}
