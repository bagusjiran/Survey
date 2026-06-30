'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function LoginPage() {
  const [fullName, setFullName] = useState('')
  const [nim, setNim] = useState('')
  const [adminCode, setAdminCode] = useState('')
  const [isAdminLogin, setIsAdminLogin] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fullName: fullName.trim(),
          nim: nim.trim(),
          adminCode: isAdminLogin ? adminCode.trim() : undefined,
        }),
      })

      const data = await res.json()

      if (!res.ok) {
        setError(data.error || 'Terjadi kesalahan')
        return
      }

      router.push(data.isAdmin ? '/admin' : '/survey')
      router.refresh()
    } catch {
      setError('Gagal terhubung ke server')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen animated-bg islamic-pattern flex items-center justify-center p-4">
      {/* Decorative circles */}
      <div className="absolute top-20 left-10 w-72 h-72 bg-emerald-300/20 rounded-full blur-3xl animate-pulse-soft" />
      <div className="absolute bottom-20 right-10 w-96 h-96 bg-teal-300/20 rounded-full blur-3xl animate-pulse-soft stagger-2" />

      <div className="w-full max-w-md animate-fade-in">
        {/* Logo & Title */}
        <div className="text-center mb-8 animate-slide-up">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 shadow-lg shadow-emerald-500/30 mb-4">
            <svg className="w-10 h-10 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 21v-8.25M15.75 21v-8.25M8.25 21v-8.25M3 9l9-6 9 6m-1.5 12V10.332A48.36 48.36 0 0012 9.75c-2.551 0-5.056.2-7.5.582V21M3 21h18M12 6.75h.008v.008H12V6.75z" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold gradient-text">
            Survey UKM Kerohanian Islam
          </h1>
          <p className="text-slate-500 text-sm mt-1">
            Universitas Teknologi Ronggolawe
          </p>
        </div>

        {/* Login Card */}
        <div className="glass rounded-2xl shadow-xl shadow-black/5 p-8 animate-scale-in">
          <form onSubmit={handleLogin} className="space-y-5">
            {/* Nama Lengkap */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">
                Nama Lengkap
              </label>
              <input
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="Masukkan nama lengkap"
                required
                className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-white/60 transition-all duration-300 focus:border-emerald-400 focus:bg-white placeholder:text-slate-400"
              />
            </div>

            {/* NIM */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">
                NIM (Sandi)
              </label>
              <input
                type="text"
                value={nim}
                onChange={(e) => setNim(e.target.value)}
                placeholder="Masukkan NIM"
                required
                className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-white/60 transition-all duration-300 focus:border-emerald-400 focus:bg-white placeholder:text-slate-400"
              />
            </div>

            {/* Admin Toggle */}
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setIsAdminLogin(!isAdminLogin)}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors duration-300 ${
                  isAdminLogin ? 'bg-emerald-500' : 'bg-slate-300'
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white shadow-sm transition-transform duration-300 ${
                    isAdminLogin ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
              <span className="text-sm text-slate-600">Login sebagai Admin</span>
            </div>

            {/* Admin Code */}
            {isAdminLogin && (
              <div className="animate-slide-up">
                <label className="block text-sm font-medium text-slate-700 mb-1.5">
                  Kode Proteksi Admin
                </label>
                <input
                  type="password"
                  value={adminCode}
                  onChange={(e) => setAdminCode(e.target.value)}
                  placeholder="Masukkan kode admin"
                  required={isAdminLogin}
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-white/60 transition-all duration-300 focus:border-emerald-400 focus:bg-white placeholder:text-slate-400"
                />
              </div>
            )}

            {/* Error */}
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-600 text-sm rounded-xl px-4 py-3 animate-slide-up">
                {error}
              </div>
            )}

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 px-6 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 text-white font-semibold shadow-lg shadow-emerald-500/25 hover:shadow-emerald-500/40 transition-all duration-300 hover:-translate-y-0.5 disabled:opacity-60 disabled:cursor-not-allowed disabled:transform-none flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <div className="spinner !border-white/30 !border-t-white !w-5 !h-5" />
                  <span>Memproses...</span>
                </>
              ) : (
                'Masuk'
              )}
            </button>
          </form>
        </div>

        {/* Footer */}
        <p className="text-center text-xs text-slate-400 mt-6 animate-fade-in stagger-3">
          UKM Kerohanian Islam &copy; {new Date().getFullYear()} UNIROW Tuban
        </p>
      </div>
    </div>
  )
}
