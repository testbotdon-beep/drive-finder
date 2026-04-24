import { ImageResponse } from 'next/og'

export const dynamic = 'force-dynamic'

const slides = [
  { big: 'POV:', sub: "you've been hunting for a private driving instructor in SG for 4 months", tag: '01' },
  { big: '18 numbers called', sub: '2 picked up. Both fully booked.', tag: '02' },
  { big: 'School waitlist?', sub: '6 months. If you are lucky.', tag: '03' },
  { big: 'Then a friend sent me this:', sub: '', tag: '04' },
  { big: 'drivefindersg.uqlabs.co', sub: '', tag: '05', accent: true },
  { big: 'Tell them your test centre.', sub: 'They find you an available PDI.', tag: '06' },
  { big: '$19.', sub: 'No match, no charge.', tag: '07' },
  { big: 'Back to learning 🎉', sub: 'drivefindersg.uqlabs.co', tag: '08', accent: true },
]

export async function GET(_req: Request, { params }: { params: Promise<{ n: string }> }) {
  const { n } = await params
  const idx = Math.max(0, Math.min(slides.length - 1, parseInt(n, 10) - 1))
  const s = slides[idx]

  return new ImageResponse(
    (
      <div
        style={{
          width: 1080,
          height: 1920,
          background: '#0a1628',
          display: 'flex',
          flexDirection: 'column',
          padding: 80,
          position: 'relative',
        }}
      >
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background: 'radial-gradient(ellipse 80% 50% at 50% 30%, rgba(16,185,129,0.18), transparent 70%)',
            display: 'flex',
          }}
        />

        <div style={{ display: 'flex', alignItems: 'center', gap: 16, zIndex: 1 }}>
          <svg width="52" height="52" viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
            <rect width="40" height="40" rx="10" fill="#111d32" />
            <circle cx="20" cy="20" r="11" stroke="white" strokeWidth="2.5" fill="none" />
            <circle cx="20" cy="20" r="3.5" stroke="white" strokeWidth="2" fill="none" />
            <line x1="20" y1="9" x2="20" y2="16.5" stroke="white" strokeWidth="2" strokeLinecap="round" />
            <line x1="10.5" y1="25.5" x2="17" y2="22" stroke="white" strokeWidth="2" strokeLinecap="round" />
            <line x1="29.5" y1="25.5" x2="23" y2="22" stroke="white" strokeWidth="2" strokeLinecap="round" />
            <circle cx="32" cy="8" r="6" fill="#10b981" />
            <path d="M29 8L31 10L35 6" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          <div style={{ display: 'flex', flexDirection: 'column', lineHeight: 1 }}>
            <div style={{ fontSize: 26, fontWeight: 800, color: 'white', letterSpacing: -0.5 }}>Drive Finder</div>
            <div style={{ fontSize: 12, fontWeight: 700, letterSpacing: 3, color: '#94a3b8', marginTop: 4, textTransform: 'uppercase' }}>Singapore</div>
          </div>
        </div>

        <div
          style={{
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            zIndex: 1,
            marginTop: -80,
          }}
        >
          <div
            style={{
              fontSize: s.accent ? 88 : 120,
              fontWeight: 800,
              color: s.accent ? '#10b981' : 'white',
              letterSpacing: -3,
              lineHeight: 1.02,
              marginBottom: s.sub ? 40 : 0,
              display: 'flex',
              flexWrap: 'wrap',
            }}
          >
            {s.big}
          </div>
          {s.sub && (
            <div style={{ fontSize: 52, color: '#cbd5e1', lineHeight: 1.2, fontWeight: 500, display: 'flex', flexWrap: 'wrap' }}>
              {s.sub}
            </div>
          )}
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', zIndex: 1 }}>
          <div style={{ fontSize: 22, color: '#64748b', fontWeight: 600, letterSpacing: 2, display: 'flex' }}>
            drivefindersg.uqlabs.co
          </div>
          <div
            style={{
              fontSize: 24,
              color: '#64748b',
              fontWeight: 700,
              padding: '8px 20px',
              border: '2px solid #334155',
              borderRadius: 20,
              display: 'flex',
            }}
          >
            {s.tag} / 08
          </div>
        </div>
      </div>
    ),
    { width: 1080, height: 1920 }
  )
}
