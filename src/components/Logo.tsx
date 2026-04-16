export function Logo({ size = 32, className = '' }: { size?: number; className?: string }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 40 40"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      <rect width="40" height="40" rx="10" fill="#0a1628" />
      {/* Steering wheel */}
      <circle cx="20" cy="20" r="11" stroke="white" strokeWidth="2.5" fill="none" />
      <circle cx="20" cy="20" r="3.5" stroke="white" strokeWidth="2" fill="none" />
      {/* Spokes */}
      <line x1="20" y1="9" x2="20" y2="16.5" stroke="white" strokeWidth="2" strokeLinecap="round" />
      <line x1="10.5" y1="25.5" x2="17" y2="22" stroke="white" strokeWidth="2" strokeLinecap="round" />
      <line x1="29.5" y1="25.5" x2="23" y2="22" stroke="white" strokeWidth="2" strokeLinecap="round" />
      {/* Checkmark accent */}
      <circle cx="32" cy="8" r="6" fill="#10b981" />
      <path d="M29 8L31 10L35 6" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

export function LogoFull({ className = '' }: { className?: string }) {
  return (
    <div className={`flex items-center gap-2.5 ${className}`}>
      <Logo size={36} />
      <div className="flex flex-col leading-none">
        <span className="font-bold text-[15px] tracking-tight text-slate-900">Drive Finder</span>
        <span className="text-[10px] font-semibold tracking-[0.15em] uppercase text-slate-400">Singapore</span>
      </div>
    </div>
  )
}
