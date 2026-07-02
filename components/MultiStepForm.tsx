'use client'

import { useState, useEffect, useCallback } from 'react'

interface Question {
  id: string
  question_text: string
  question_type: string
  options: string[] | null
  sort_order: number
}

interface MultiStepFormProps {
  questions: Question[]
  answers: Record<string, string>
  onAnswer: (questionId: string, value: string) => void
  onSubmit: () => void
  submitting: boolean
}

export default function MultiStepForm({ questions, answers, onAnswer, onSubmit, submitting }: MultiStepFormProps) {
  const [currentStep, setCurrentStep] = useState(0)
  const totalSteps = questions.length
  const currentQ = questions[currentStep]
  const isLast = currentStep === totalSteps - 1
  const currentAnswer = answers[currentQ?.id] || ''

  // Auto-save to localStorage
  useEffect(() => {
    const key = 'survey-draft-' + currentQ?.id
    if (currentAnswer) {
      localStorage.setItem(key, currentAnswer)
    }
  }, [currentAnswer, currentQ?.id])

  // Load saved answers
  useEffect(() => {
    questions.forEach(q => {
      const saved = localStorage.getItem('survey-draft-' + q.id)
      if (saved && !answers[q.id]) {
        onAnswer(q.id, saved)
      }
    })
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  // Keyboard navigation
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight' || e.key === 'Enter') {
        if (currentAnswer.trim() && !isLast) {
          e.preventDefault()
          setCurrentStep(s => Math.min(s + 1, totalSteps - 1))
        }
      }
      if (e.key === 'ArrowLeft') {
        e.preventDefault()
        setCurrentStep(s => Math.max(s - 1, 0))
      }
    }
    window.addEventListener('keydown', handleKey)
    return () => window.removeEventListener('keydown', handleKey)
  }, [currentAnswer, isLast, totalSteps])

  const progress = ((currentStep + 1) / totalSteps) * 100

  const goNext = () => {
    if (!isLast) setCurrentStep(s => s + 1)
  }

  const goPrev = () => {
    if (currentStep > 0) setCurrentStep(s => s - 1)
  }

  const handleSubmitAll = () => {
    // Clear draft
    questions.forEach(q => localStorage.removeItem('survey-draft-' + q.id))
    onSubmit()
  }

  if (!currentQ) return null

  return (
    <div>
      {/* Progress Bar */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-medium text-slate-500 dark:text-slate-400">
            Pertanyaan {currentStep + 1} dari {totalSteps}
          </span>
          <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400">
            {Math.round(progress)}%
          </span>
        </div>
        <div className="w-full h-2 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-emerald-400 to-teal-500 rounded-full transition-all duration-500 ease-out"
            style={{ width: progress + '%' }}
          />
        </div>
        {/* Step dots */}
        <div className="flex gap-1 mt-3 justify-center">
          {questions.map((q, i) => (
            <button
              key={q.id}
              onClick={() => setCurrentStep(i)}
              className={'w-2.5 h-2.5 rounded-full transition-all duration-300 ' + (
                i === currentStep
                  ? 'bg-emerald-500 scale-125'
                  : answers[q.id]
                    ? 'bg-emerald-300 dark:bg-emerald-700'
                    : 'bg-slate-200 dark:bg-slate-600'
              )}
              aria-label={'Ke pertanyaan ' + (i + 1)}
            />
          ))}
        </div>
      </div>

      {/* Question Card */}
      <div className="glass rounded-2xl p-6 mb-6 animate-slide-up" key={currentQ.id}>
        <div className="flex items-start gap-3 mb-4">
          <span className="w-8 h-8 rounded-full bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 text-sm font-bold flex items-center justify-center flex-shrink-0">
            {currentStep + 1}
          </span>
          <h3 className="font-semibold text-slate-800 dark:text-slate-100 text-lg pt-0.5">
            {currentQ.question_text}
          </h3>
        </div>

        <div className="ml-11">
          {/* Text input */}
          {currentQ.question_type === 'text' && (
            <input
              type="text"
              placeholder="Jawaban Anda..."
              value={currentAnswer}
              onChange={(e) => onAnswer(currentQ.id, e.target.value)}
              className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-600 bg-white/60 dark:bg-slate-700/60 focus:border-emerald-400 transition-all text-base text-slate-800 dark:text-slate-100"
              style={{ fontSize: '16px' }}
              autoFocus
            />
          )}

          {/* Textarea */}
          {currentQ.question_type === 'textarea' && (
            <textarea
              placeholder="Jawaban Anda..."
              value={currentAnswer}
              onChange={(e) => onAnswer(currentQ.id, e.target.value)}
              rows={5}
              className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-600 bg-white/60 dark:bg-slate-700/60 focus:border-emerald-400 transition-all resize-none text-base text-slate-800 dark:text-slate-100"
              style={{ fontSize: '16px' }}
              autoFocus
            />
          )}

          {/* Radio */}
          {currentQ.question_type === 'radio' && currentQ.options && (
            <div className="space-y-2">
              {currentQ.options.map((opt: string, j: number) => (
                <label
                  key={j}
                  className={'flex items-center gap-3 p-3.5 rounded-xl cursor-pointer transition-all border-2 ' + (
                    currentAnswer === opt
                      ? 'bg-emerald-50 dark:bg-emerald-900/20 border-emerald-300 dark:border-emerald-600'
                      : 'hover:bg-slate-50 dark:hover:bg-slate-700 border-transparent'
                  )}
                >
                  <input
                    type="radio"
                    name={'q_' + currentQ.id}
                    value={opt}
                    checked={currentAnswer === opt}
                    onChange={() => onAnswer(currentQ.id, opt)}
                    className="w-4 h-4 text-emerald-500"
                  />
                  <span className="text-sm text-slate-700 dark:text-slate-200">{opt}</span>
                </label>
              ))}
            </div>
          )}

          {/* Rating */}
          {currentQ.question_type === 'rating' && (
            <div className="flex gap-3 items-center">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  onClick={() => onAnswer(currentQ.id, String(star))}
                  className="transition-transform hover:scale-110"
                >
                  <i className={'bi ' + (parseInt(currentAnswer || '0') >= star ? 'bi-star-fill text-amber-400' : 'bi-star text-slate-200 dark:text-slate-600') + ' text-3xl'} />
                </button>
              ))}
              {currentAnswer && (
                <span className="text-sm text-slate-500 dark:text-slate-400 ml-2 font-medium">
                  {currentAnswer}/5
                </span>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Navigation */}
      <div className="flex items-center justify-between gap-3">
        <button
          onClick={goPrev}
          disabled={currentStep === 0}
          className="px-5 py-3 rounded-xl bg-white dark:bg-slate-700 text-slate-600 dark:text-slate-300 font-medium border border-slate-200 dark:border-slate-600 hover:bg-slate-50 dark:hover:bg-slate-600 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
        >
          <i className="bi bi-arrow-left mr-1" /> Sebelumnya
        </button>

        <span className="text-xs text-slate-400">
          Tekan <kbd className="px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-700 text-[10px] font-mono">→</kbd> untuk lanjut
        </span>

        {!isLast ? (
          <button
            onClick={goNext}
            disabled={!currentAnswer.trim()}
            className="px-5 py-3 rounded-xl bg-emerald-500 text-white font-medium hover:bg-emerald-600 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
          >
            Selanjutnya <i className="bi bi-arrow-right ml-1" />
          </button>
        ) : (
          <button
            onClick={handleSubmitAll}
            disabled={!currentAnswer.trim() || submitting}
            className="px-6 py-3 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 text-white font-semibold shadow-lg shadow-emerald-500/25 hover:shadow-emerald-500/40 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {submitting ? (
              <><i className="bi bi-arrow-repeat animate-spin mr-1" />Mengirim...</>
            ) : (
              <><i className="bi bi-send mr-1" />Kirim Survey & Vote</>
            )}
          </button>
        )}
      </div>
    </div>
  )
}
