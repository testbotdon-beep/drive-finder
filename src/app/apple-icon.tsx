import { ImageResponse } from 'next/og'

export const size = { width: 180, height: 180 }
export const contentType = 'image/png'

export default function AppleIcon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          background: '#0a1628',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          position: 'relative',
          borderRadius: 40,
        }}
      >
        <svg width="140" height="140" viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
          <circle cx="20" cy="20" r="11" stroke="white" strokeWidth="2.5" fill="none" />
          <circle cx="20" cy="20" r="3.5" stroke="white" strokeWidth="2" fill="none" />
          <line x1="20" y1="9" x2="20" y2="16.5" stroke="white" strokeWidth="2" strokeLinecap="round" />
          <line x1="10.5" y1="25.5" x2="17" y2="22" stroke="white" strokeWidth="2" strokeLinecap="round" />
          <line x1="29.5" y1="25.5" x2="23" y2="22" stroke="white" strokeWidth="2" strokeLinecap="round" />
          <circle cx="32" cy="8" r="6" fill="#10b981" />
          <path d="M29 8L31 10L35 6" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </div>
    ),
    { ...size }
  )
}
