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
    const fetchMembers = async () => {
      try {
        const res = await fetch('/api/auth/members')
        const data = await res.json()
        setMembers(data.members || [])
      } catch {
        console.error('Gagal memuat daftar anggota')
      } finally {
        setMembersLoading(false)
      }
    }
    fetchMembers()
  }, [])

  const selectedMember = members.find((m) => m.id === selectedId)

  const handleNameChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const value = e.target.value
    setSelectedId(value)
    setError('')
    if (value) {
      setTimeout(() => nimRef.current?.focus(), 100)
    }
  }

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
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
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fullName: selectedMember.full_name,
          nim: nim.trim(),
        }),
      })

      const data = await res.json()

      if (!res.ok) {
        setError(data.error || 'Terjadi kesalahan')
        return
      }

      router.push('/survey')
      router.refresh()
    } catch {
      setError('Gagal terhubung ke server')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen animated-bg islamic-pattern flex items-center justify-center p-4">
      <div className="absolute top-20 left-10 w-72 h-72 bg-emerald-300/20 rounded-full blur-3xl animate-pulse-soft" />
      <div className="absolute bottom-20 right-10 w-96 h-96 bg-teal-300/20 rounded-full blur-3xl animate-pulse-soft stagger-2" />

      <div className="w-full max-w-md animate-fade-in">
        {/* Logo */}
        <div className="text-center mb-6 sm:mb-8 animate-slide-up">
          <div className="inline-flex items-center justify-center w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 shadow-lg shadow-emerald-500/30 mb-3 sm:mb-4">
            <svg className="w-8 h-8 sm:w-10 sm:h-10 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 21v-8.25M15.75 21v-8.25M8.25 21v-8.25M3 9l9-6 9 6m-1.5 12V10.332A48.36 48.36 0 0012 9.75c-2.551 0-5.056.2-7.5.582V21M3 21h18M12 6.75h.008v.008H12V6.75z" />
            </svg>
          </div>
          <h1 className="text-xl sm:text-2xl font-bold gradient-text">
            Survey UKM Kerohanian Islam
          </h1>
          <p className="text-slate-500 text-xs sm:text-sm mt-1">
            Universitas Teknologi Ronggolawe — Cepu
          </p>
        </div>

        {/* Login Card */}
        <div className="glass rounded-2xl shadow-xl shadow-black/5 p-5 sm:p-8 animate-scale-in">
          <form onSubmit={handleLogin} className="space-y-4 sm:space-y-5" autoComplete="off">
            {/* Dropdown Nama */}
            <div>
              <label htmlFor="member-select" className="block text-sm font-medium text-slate-700 mb-1.5">
                Nama Anggota
              </label>
              {membersLoading ? (
                <div className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-white/60 flex items-center gap-2">
                  <div className="spinner !w-4 !h-4" />
                  <span className="text-sm text-slate-400">Memuat...</span>
                </div>
              ) : (
                <select
                  id="member-select"
                  value={selectedId}
                  onChange={handleNameChange}
                  required
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-white/60 transition-all duration-300 focus:border-emerald-400 focus:bg-white text-slate-700"
                  style={{ fontSize: '16px' }}
                >
                  <option value="">-- Pilih Nama --</option>
                  {members.map((m) => (
                    <option key={m.id} value={m.id}>{m.full_name}</option>
                  ))}
                </select>
              )}
            </div>

            {/* NIM */}
            <div>
              <label htmlFor="nim-input" className="block text-sm font-medium text-slate-700 mb-1.5">
                NIM (Sandi)
              </label>
              <input
                ref={nimRef}
                id="nim-input"
                type="password"
                inputMode="numeric"
                pattern="[0-9]*"
                value={nim}
                onChange={(e) => setNim(e.target.value.replace(/[^0-9]/g, ''))}
                placeholder="Masukkan NIM Anda"
                autoComplete="new-password"
                autoCorrect="off"
                autoCapitalize="off"
                spellCheck={false}
                required
                className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-white/60 transition-all duration-300 focus:border-emerald-400 focus:bg-white placeholder:text-slate-400"
                style={{ fontSize: '16px' }}
              />
              {!selectedId && (
                <p className="text-xs text-amber-500 mt-1.5 ml-1">↑ Pilih nama terlebih dahulu</p>
              )}
            </div>

            {/* Error */}
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-600 text-sm rounded-xl px-4 py-3 animate-slide-up">
                {error}
              </div>
            )}

            {/* Submit */}
            <button
              type="submit"
              disabled={loading || !selectedId}
              className="w-full py-3.5 px-6 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 text-white font-semibold shadow-lg shadow-emerald-500/25 hover:shadow-emerald-500/40 transition-all duration-300 hover:-translate-y-0.5 disabled:opacity-60 disabled:cursor-not-allowed disabled:transform-none flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <div className="spinner !border-white/30 !border-t-white !w-5 !h-5" />
                  <span>Memproses...</span>
                </>
              ) : 'Masuk'}
            </button>
          </form>
        </div>

        <p className="text-center text-xs text-slate-400 mt-4 sm:mt-6 animate-fade-in stagger-3">
          UKM Kerohanian Islam &copy; {new Date().getFullYear()} UTR Cepu
        </p>
      </div>
    </div>
  )
}
