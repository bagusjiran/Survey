'use client'

import { useEffect, useState } from 'react'

interface StatCardProps {
  label: string
  value: number
  icon: string
  color: 'emerald' | 'blue' | 'amber' | 'red' | 'violet'
  suffix?: string
}

const colorMap = {
  emerald: { bg: 'bg-emerald-100', text: 'text-emerald-600', dark: 'dark:bg-emerald-900/30 dark:text-emerald-400' },
  blue: { bg: 'bg-blue-100', text: 'text-blue-600', dark: 'dark:bg-blue-900/30 dark:text-blue-400' },
  amber: { bg: 'bg-amber-100', text: 'text-amber-600', dark: 'dark:bg-amber-900/30 dark:text-amber-400' },
  red: { bg: 'bg-red-100', text: 'text-red-600', dark: 'dark:bg-red-900/30 dark:text-red-400' },
  violet: { bg: 'bg-violet-100', text: 'text-violet-600', dark: 'dark:bg-violet-900/30 dark:text-violet-400' },
}

export default function StatCard({ label, value, icon, color, suffix }: StatCardProps) {
  const [displayValue, setDisplayValue] = useState(0)
  const c = colorMap[color]

  useEffect(() => {
    if (value === 0) return
    const duration = 800
    const steps = 30
    const increment = value / steps
    let current = 0
    const timer = setInterval(() => {
      current += increment
      if (current >= value) {
        setDisplayValue(value)
        clearInterval(timer)
      } else {
        setDisplayValue(Math.floor(current))
      }
    }, duration / steps)
    return () => clearInterval(timer)
  }, [value])

  return (
    <div className="glass rounded-2xl p-5 text-center hover-lift">
      <div className={'w-10 h-10 mx-auto mb-2 rounded-xl flex items-center justify-center ' + c.bg + ' ' + c.dark}>
        <i className={'bi ' + icon + ' text-lg ' + c.text} />
      </div>
      <p className="text-2xl font-bold text-slate-800 dark:text-slate-100">
        {displayValue}{suffix || ''}
      </p>
      <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{label}</p>
    </div>
  )
}
