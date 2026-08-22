'use client'

import { useEffect, useState } from 'react'

const HREF = 'https://drivelabsg.uqlabs.co/?src=drivefinder-float'

/**
 * Permanent Drive Lab plug. Always on screen, never dismissible.
 *
 * It collapses to a compact pill while the request form is in view. The full
 * card is wide enough to sit on top of the form inputs at ~960px, and covering
 * the fields someone is filling in would cost more than the plug is worth. The
 * pill keeps it present the whole way down the page without blocking anything.
 */
export function DriveLabFloat() {
  const [overForm, setOverForm] = useState(false)

  useEffect(() => {
    const form = document.getElementById('get-started')
    if (!form) return
    const io = new IntersectionObserver(
      ([entry]) => setOverForm(entry.isIntersecting),
      { threshold: 0 }
    )
    io.observe(form)
    return () => io.disconnect()
  }, [])

  if (overForm) {
    return (
      <div className="fixed z-40 bottom-4 right-4 print:hidden">
        <a
          href={HREF}
          target="_blank"
          rel="noopener"
          className="inline-flex items-center gap-2 rounded-full bg-[#0a1628] pl-3.5 pr-4 py-2.5 ring-1 ring-white/15 shadow-[0_12px_32px_-8px_rgba(0,0,0,0.5)] hover:ring-emerald-400/40 transition-all"
        >
          <span className="relative flex h-2 w-2 shrink-0">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
          </span>
          <span className="text-[13px] font-semibold text-white whitespace-nowrap">
            Try Drive Lab free
          </span>
        </a>
      </div>
    )
  }

  return (
    <div className="fixed z-40 bottom-4 right-4 left-4 sm:left-auto sm:w-[330px] print:hidden animate-[fadeUp_240ms_ease-out]">
      <div className="relative rounded-2xl bg-[#0a1628] overflow-hidden ring-1 ring-white/10 shadow-[0_20px_60px_-12px_rgba(0,0,0,0.5)]">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_70%_at_80%_0%,rgba(16,185,129,0.18),transparent_70%)]" />

        <div className="relative p-5">
          <div className="inline-flex items-center gap-1.5 text-[10.5px] font-bold tracking-[0.1em] uppercase text-emerald-400 mb-2">
            <span className="block w-4 h-0.5 rounded-sm bg-emerald-400" />
            Free to try
          </div>
          <div className="text-[15px] font-bold text-white leading-snug mb-1.5">
            Practise the circuit online before your first test.
          </div>
          <p className="text-[13px] text-slate-400 leading-relaxed mb-4">
            Drive Lab is our browser sim of the Singapore test circuit. The crank course is
            free and unlimited. No account, no card.
          </p>
          <a
            href={HREF}
            target="_blank"
            rel="noopener"
            className="btn-primary btn-cta w-full text-[14px] py-3"
          >
            Try Drive Lab free
          </a>
        </div>
      </div>
    </div>
  )
}
