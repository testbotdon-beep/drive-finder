import { ImageResponse } from 'next/og'

export const dynamic = 'force-dynamic'

const slides = [
  { big: 'SG Driving Hack 🚗', sub: 'How I got a PDI in 3 days', tag: '01', cover: true },
  { big: 'School waitlists in SG?', sub: '4 to 6 months rn 🙃', tag: '02' },
  { big: 'I called 18 PDIs myself.', sub: '2 picked up. Both fully booked.', tag: '03' },
  { big: 'Was about to give up.', sub: 'Then Reddit saved me.', tag: '04' },
  { big: 'drivefindersg.uqlabs.co', sub: 'Someone kept mentioning it', tag: '05', accent: true },
  { big: 'You tell them your test centre.', sub: 'Auto or manual. They do the calling for you.', tag: '06' },
  { big: '$19 only if they find a match.', sub: 'No match = $0. Fair deal 🙌', tag: '07' },
  { big: 'Uncle Tan called me 3 days later.', sub: 'Lessons started that week. Link in bio 🚗', tag: '08', cta: true },
]

export async function GET(_req: Request, { params }: { params: Promise<{ n: string }> }) {
  const { n } = await params
  const idx = Math.max(0, Math.min(slides.length - 1, parseInt(n, 10) - 1))
  const s = slides[idx]

  const bg = s.cover || s.cta
    ? 'linear-gradient(160deg, #fef7ee 0%, #ffeedf 40%, #ffe0e0 100%)'
    : 'linear-gradient(160deg, #fefcf7 0%, #fef5ea 100%)'

  return new ImageResponse(
    (
      <div
        style={{
          width: 1080,
          height: 1350,
          background: bg,
          display: 'flex',
          flexDirection: 'column',
          padding: 70,
          position: 'relative',
        }}
      >
        <div
          style={{
            position: 'absolute',
            top: 40,
            right: 40,
            width: 140,
            height: 140,
            borderRadius: 70,
            background: 'rgba(16,185,129,0.12)',
            display: 'flex',
          }}
        />
        <div
          style={{
            position: 'absolute',
            bottom: 60,
            left: 50,
            width: 80,
            height: 80,
            borderRadius: 40,
            background: 'rgba(236,72,153,0.12)',
            display: 'flex',
          }}
        />

        <div style={{ display: 'flex', alignItems: 'center', gap: 12, zIndex: 1 }}>
          <svg width="40" height="40" viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
            <rect width="40" height="40" rx="10" fill="#0a1628" />
            <circle cx="20" cy="20" r="11" stroke="white" strokeWidth="2.5" fill="none" />
            <circle cx="20" cy="20" r="3.5" stroke="white" strokeWidth="2" fill="none" />
            <line x1="20" y1="9" x2="20" y2="16.5" stroke="white" strokeWidth="2" strokeLinecap="round" />
            <line x1="10.5" y1="25.5" x2="17" y2="22" stroke="white" strokeWidth="2" strokeLinecap="round" />
            <line x1="29.5" y1="25.5" x2="23" y2="22" stroke="white" strokeWidth="2" strokeLinecap="round" />
            <circle cx="32" cy="8" r="6" fill="#10b981" />
            <path d="M29 8L31 10L35 6" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          <div style={{ fontSize: 22, color: '#0a1628', fontWeight: 700, display: 'flex' }}>Drive Finder SG</div>
        </div>

        <div
          style={{
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            zIndex: 1,
          }}
        >
          <div
            style={{
              fontSize: s.accent ? 76 : s.cover ? 96 : 86,
              fontWeight: 800,
              color: s.accent ? '#059669' : '#0a1628',
              letterSpacing: -2,
              lineHeight: 1.05,
              marginBottom: s.sub ? 30 : 0,
              display: 'flex',
              flexWrap: 'wrap',
            }}
          >
            {s.big}
          </div>
          {s.sub && (
            <div
              style={{
                fontSize: 40,
                color: '#475569',
                lineHeight: 1.3,
                fontWeight: 500,
                display: 'flex',
                flexWrap: 'wrap',
              }}
            >
              {s.sub}
            </div>
          )}
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', zIndex: 1 }}>
          <div style={{ fontSize: 20, color: '#94a3b8', fontWeight: 600, display: 'flex' }}>drivefindersg.uqlabs.co</div>
          <div style={{ fontSize: 20, color: '#94a3b8', fontWeight: 700, display: 'flex' }}>{s.tag} / 08</div>
        </div>
      </div>
    ),
    { width: 1080, height: 1350 }
  )
}
