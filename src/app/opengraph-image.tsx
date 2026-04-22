import { ImageResponse } from 'next/og'

export const alt = 'Drive Finder SG - Verified private driving instructors in Singapore'
export const size = { width: 1200, height: 630 }
export const contentType = 'image/png'

export default function OgImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          background: '#0a1628',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: 80,
          position: 'relative',
        }}
      >
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'radial-gradient(ellipse 60% 50% at 50% 30%, rgba(16,185,129,0.2), transparent 70%)',
            display: 'flex',
          }}
        />
        <div style={{ display: 'flex', alignItems: 'center', gap: 20, marginBottom: 40 }}>
          <svg width="100" height="100" viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
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
            <div style={{ fontSize: 44, fontWeight: 800, color: 'white', letterSpacing: -1 }}>Drive Finder</div>
            <div style={{ fontSize: 18, fontWeight: 700, letterSpacing: 4, color: '#94a3b8', marginTop: 6, textTransform: 'uppercase' }}>Singapore</div>
          </div>
        </div>
        <div
          style={{
            fontSize: 72,
            fontWeight: 800,
            color: 'white',
            textAlign: 'center',
            letterSpacing: -2,
            lineHeight: 1.05,
            marginBottom: 24,
          }}
        >
          Your next driving instructor is ready for your call.
        </div>
        <div
          style={{
            fontSize: 28,
            color: '#94a3b8',
            textAlign: 'center',
            display: 'flex',
            gap: 24,
          }}
        >
          <span>100+ verified instructors</span>
          <span style={{ color: '#475569' }}>|</span>
          <span>$19 flat</span>
          <span style={{ color: '#475569' }}>|</span>
          <span>No match, no charge</span>
        </div>
      </div>
    ),
    { ...size }
  )
}
