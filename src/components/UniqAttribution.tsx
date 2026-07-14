import Image from 'next/image'

export function UniqAttribution({
  variant = 'inline',
  className = '',
}: {
  variant?: 'inline' | 'card'
  className?: string
}) {
  if (variant === 'card') {
    return (
      <a
        href="https://uqlabs.co"
        target="_blank"
        rel="noopener"
        className={`flex items-center gap-3 px-4 py-3 rounded-xl bg-slate-900 hover:bg-slate-800 transition-colors group ${className}`}
      >
        <div className="h-10 w-10 rounded-lg overflow-hidden shrink-0">
          <Image
            src="/uniq-labs-logo.png"
            alt="Uniq Labs"
            width={40}
            height={40}
            className="h-full w-full object-cover"
          />
        </div>
        <div className="flex flex-col leading-tight">
          <span className="text-[11px] font-semibold tracking-[0.18em] uppercase text-slate-400">
            A project by
          </span>
          <span className="text-base font-bold text-white tracking-tight group-hover:text-emerald-400 transition-colors">
            Uniq Labs
          </span>
        </div>
      </a>
    )
  }

  return (
    <a
      href="https://uqlabs.co"
      target="_blank"
      rel="noopener"
      className={`inline-flex items-center gap-2 text-slate-500 hover:text-slate-900 transition-colors ${className}`}
    >
      <Image
        src="/uniq-labs-logo.png"
        alt="Uniq Labs"
        width={20}
        height={20}
        className="rounded"
      />
      <span className="text-xs font-medium">A project by Uniq Labs</span>
    </a>
  )
}
