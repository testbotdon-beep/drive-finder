import { RequestForm } from '@/components/RequestForm'
import { LogoFull } from '@/components/Logo'
import { UniqAttribution } from '@/components/UniqAttribution'
import Link from 'next/link'

export default function LandingPage() {
  return (
    <main className="min-h-screen bg-white">
      <Header />
      <Hero />
      <DataBadge />
      <HowItWorks />
      <ProblemSection />
      <FormSection />
      <TrustStrip />
      <FAQSection />
      <FinalCTA />
      <Footer />
    </main>
  )
}

function Header() {
  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-lg border-b border-slate-100/80">
      <div className="container-page flex items-center justify-between h-16">
        <Link href="/">
          <LogoFull />
        </Link>
        <nav className="hidden md:flex items-center gap-8 text-[13px] font-medium text-slate-500">
          <a href="#how-it-works" className="hover:text-slate-900 transition-colors">How it works</a>
          <a href="#faq" className="hover:text-slate-900 transition-colors">FAQ</a>
          <a href="#get-started" className="btn-primary text-[13px] py-2.5 px-5">
            Get Matched
          </a>
        </nav>
      </div>
    </header>
  )
}

function Hero() {
  return (
    <section className="pt-32 pb-20 md:pt-44 md:pb-28 relative overflow-hidden bg-[#0a1628]">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_60%_50%_at_50%_0%,rgba(16,185,129,0.1),transparent_70%)]" />

      <div className="container-page relative">
        <div className="max-w-3xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-white/10 text-emerald-400 text-xs font-semibold mb-8">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
            </span>
            Matching learners with instructors right now
          </div>

          <h1 className="heading-display text-[2.5rem] md:text-[3.5rem] lg:text-[4rem] text-white mb-6 text-balance leading-[1.08]">
            Your next driving instructor
            <br className="hidden sm:block" />
            is ready for your call.
          </h1>

          <p className="text-lg md:text-xl text-slate-400 max-w-lg mx-auto mb-10 leading-relaxed">
            Tell us your test centre. We contact the best private instructors,
            confirm who has capacity, and send you their details.
          </p>

          <a href="#get-started" className="btn-cta text-base inline-flex">
            Find My Instructor
          </a>

          <div className="flex items-center justify-center gap-6 mt-8 text-[13px] text-slate-500 font-medium">
            <span>Free to submit</span>
            <span className="h-1 w-1 rounded-full bg-slate-600" />
            <span>Pay only when confirmed</span>
          </div>
        </div>
      </div>
    </section>
  )
}

function DataBadge() {
  return (
    <section className="py-5 border-b border-slate-100">
      <div className="container-page flex flex-col sm:flex-row items-center justify-center gap-4 sm:gap-8 text-xs text-slate-400 font-medium">
        <div className="flex items-center gap-2">
          <svg className="w-4 h-4 text-slate-300" fill="currentColor" viewBox="0 0 24 24"><path d="M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4z"/></svg>
          <span>Official data</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
          <span>100+ verified instructors</span>
        </div>
      </div>
    </section>
  )
}

function HowItWorks() {
  return (
    <section id="how-it-works" className="py-24">
      <div className="container-page">
        <div className="max-w-2xl mx-auto text-center mb-16">
          <div className="section-label justify-center mb-4">How it works</div>
          <h2 className="heading-section text-3xl md:text-[2.5rem] text-slate-900 text-balance">
            Three steps. No risk.
          </h2>
        </div>

        <div className="max-w-4xl mx-auto grid md:grid-cols-3 gap-5 mb-16">
          <StepCard
            n="01"
            title="You tell us what you need"
            desc="Pick your test centre and whether you want auto or manual. Add any other preferences in the notes. Takes 30 seconds. Completely free."
            accent="from-emerald-500/10 to-emerald-500/0"
          />
          <StepCard
            n="02"
            title="We check who's available"
            desc="We go through our network of 100+ verified instructors, WhatsApp the best matches, and confirm who's actually taking students. We get back to you within a week."
            accent="from-blue-500/10 to-blue-500/0"
          />
          <StepCard
            n="03"
            title="You pay, we introduce"
            desc="If we found you a good match, we send you a $19 payment link. Once you pay, we send you their name and number so you can contact them directly."
            accent="from-violet-500/10 to-violet-500/0"
          />
        </div>

        <div className="max-w-2xl mx-auto relative p-6 md:p-8 rounded-2xl bg-white border border-emerald-100 overflow-hidden">
          <div className="absolute top-0 left-0 w-1 h-full bg-emerald-500 rounded-l-2xl" />
          <div className="flex items-start gap-5 pl-3">
            <div className="h-12 w-12 rounded-xl bg-emerald-50 grid place-items-center shrink-0">
              <svg className="w-6 h-6 text-emerald-600" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" />
              </svg>
            </div>
            <div>
              <h3 className="font-bold text-slate-900 mb-1.5">What if you can't find anyone?</h3>
              <p className="text-sm text-slate-500 leading-relaxed">
                Then you don't pay. The $19 payment link is only sent once we've confirmed available
                instructors. If we can't match you, we let you know and <strong className="text-slate-700">you spend nothing</strong>.
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

function StepCard({ n, title, desc, accent }: { n: string; title: string; desc: string; accent: string }) {
  return (
    <div className="relative">
      <div className={`absolute inset-0 rounded-2xl bg-gradient-to-b ${accent}`} />
      <div className="relative p-7 rounded-2xl bg-white border border-slate-200/60 h-full">
        <span className="text-xs font-mono font-bold text-emerald-600 tracking-wider">{n}</span>
        <h3 className="font-bold text-slate-900 mt-3 mb-2">{title}</h3>
        <p className="text-sm text-slate-500 leading-relaxed">{desc}</p>
      </div>
    </div>
  )
}

function ProblemSection() {
  const problems = [
    {
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 6.75c0 8.284 6.716 15 15 15h2.25a2.25 2.25 0 002.25-2.25v-1.372c0-.516-.351-.966-.852-1.091l-4.423-1.106c-.44-.11-.902.055-1.173.417l-.97 1.293c-.282.376-.769.542-1.21.38a12.035 12.035 0 01-7.143-7.143c-.162-.441.004-.928.38-1.21l1.293-.97c.363-.271.527-.734.417-1.173L6.963 3.102a1.125 1.125 0 00-1.091-.852H4.5A2.25 2.25 0 002.25 4.5v2.25z" />
          <line x1="4" y1="4" x2="20" y2="20" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
        </svg>
      ),
      title: 'They don\'t pick up',
      desc: 'Most private instructors are in their 60s and 70s. Many don\'t check their phones or respond to cold calls.',
    },
    {
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0100+ 0z" />
        </svg>
      ),
      title: 'Good ones are fully booked',
      desc: 'The well-known instructors are usually full. Most learners spend weeks messaging contacts who never reply.',
    },
    {
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
        </svg>
      ),
      title: 'Supply only shrinks',
      desc: 'The private driving instructor pool in Singapore has been flat for years. Every year more retire than join.',
    },
  ]
  return (
    <section className="py-24 bg-slate-50/50">
      <div className="container-page">
        <div className="max-w-2xl mx-auto text-center mb-16">
          <div className="section-label justify-center mb-4">Why it's hard</div>
          <h2 className="heading-section text-3xl md:text-[2.5rem] text-slate-900 mb-5 text-balance">
            This is why you haven't found one yet.
          </h2>
        </div>
        <div className="grid md:grid-cols-3 gap-5 max-w-4xl mx-auto">
          {problems.map((p) => (
            <div
              key={p.title}
              className="group p-7 rounded-2xl bg-white border border-slate-100 hover:border-slate-200 transition-all duration-300 hover:shadow-lg hover:shadow-slate-100"
            >
              <div className="h-12 w-12 rounded-xl bg-slate-50 text-slate-400 grid place-items-center mb-5 group-hover:bg-emerald-50 group-hover:text-emerald-600 transition-colors duration-300">
                {p.icon}
              </div>
              <h3 className="font-bold text-slate-900 mb-2">{p.title}</h3>
              <p className="text-sm text-slate-500 leading-relaxed">{p.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

function FormSection() {
  return (
    <section id="get-started" className="py-24">
      <div className="container-page">
        <div className="max-w-xl mx-auto text-center mb-12">
          <div className="section-label justify-center mb-4">Get matched</div>
          <h2 className="heading-section text-3xl md:text-[2.5rem] text-slate-900 mb-4">
            Tell us what you need
          </h2>
          <p className="text-slate-500 text-lg">
            30 seconds. Completely free. We'll get back to you within 7 days.
          </p>
        </div>
        <RequestForm />
      </div>
    </section>
  )
}

function TrustStrip() {
  return (
    <section className="py-16 bg-slate-900">
      <div className="container-page">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 md:gap-12">
          <TrustStat value="100+" label="Verified instructors" color="emerald" />
          <TrustStat value="$19" label="Only after we confirm" color="white" />
          <TrustStat value="7 days" label="Response time" color="white" />
          <TrustStat value="$0" label="If we can't match you" color="emerald" />
        </div>
      </div>
    </section>
  )
}

function TrustStat({ value, label, color }: { value: string; label: string; color: 'emerald' | 'white' }) {
  return (
    <div className="text-center">
      <div className={`text-3xl md:text-4xl font-extrabold tracking-tight ${color === 'emerald' ? 'text-emerald-400' : 'text-white'}`}>
        {value}
      </div>
      <div className="text-sm text-slate-400 mt-1.5 font-medium">{label}</div>
    </div>
  )
}

function FAQSection() {
  const faqs = [
{
      q: "When exactly do I pay?",
      a: "You don't pay anything when you submit the form. We first check if we have an instructor that matches what you need. If we do, we send you a $19 PayNow request via WhatsApp. If we can't find anyone, you never pay.",
    },
    {
      q: "How do I receive my match?",
      a: "Once you pay the $19, we send you the matched instructor's details (name and phone number) so you can contact them directly.",
    },
    {
      q: "What if the instructor doesn't work out?",
      a: "Once we deliver the verified contact, our matchmaking is complete on our end. If you want a fresh search for a different instructor, we can put you on our watch list for $9 with a 30-day window.",
    },
    {
      q: 'Which driving centres do you cover?',
      a: 'All three: BBDC (Bukit Batok), CDC (Ubi), and SSDC (Woodlands). Both Class 3 (manual) and Class 3A (auto).',
    },
    {
      q: 'What about motorcycles (Class 2B)?',
      a: 'There are no private instructors for motorcycle classes in Singapore. You have to enrol through one of the three driving schools. We match for cars only.',
    },
  ]
  return (
    <section id="faq" className="py-24 bg-slate-50/50">
      <div className="container-page max-w-3xl">
        <div className="text-center mb-14">
          <div className="section-label justify-center mb-4">FAQ</div>
          <h2 className="heading-section text-3xl md:text-[2.5rem] text-slate-900">
            Questions, answered
          </h2>
        </div>
        <div className="space-y-2">
          {faqs.map((f, i) => (
            <details key={i} className="group rounded-xl bg-white border border-slate-100 overflow-hidden">
              <summary className="flex items-center justify-between p-5 cursor-pointer select-none hover:bg-slate-50 transition-colors">
                <span className="font-semibold text-slate-900 text-[15px] pr-4">{f.q}</span>
                <span className="shrink-0 h-6 w-6 rounded-full border border-slate-200 grid place-items-center text-slate-400 group-open:bg-slate-900 group-open:border-slate-900 group-open:text-white transition-all duration-200">
                  <svg className="w-3 h-3 group-open:rotate-45 transition-transform duration-200" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 12 12">
                    <line x1="6" y1="2" x2="6" y2="10" />
                    <line x1="2" y1="6" x2="10" y2="6" />
                  </svg>
                </span>
              </summary>
              <div className="px-5 pb-5 -mt-1">
                <p className="text-sm text-slate-500 leading-relaxed">{f.a}</p>
              </div>
            </details>
          ))}
        </div>
      </div>
    </section>
  )
}

function FinalCTA() {
  return (
    <section className="py-24">
      <div className="container-page">
        <div className="max-w-2xl mx-auto text-center">
          <h2 className="heading-section text-3xl md:text-[2.5rem] text-slate-900 mb-5 text-balance">
            Stop scrolling Reddit for recommendations.
          </h2>
          <p className="text-lg text-slate-500 mb-8 max-w-lg mx-auto">
            Let us do the work. 30 second form, free to submit, and you only pay if we find you a match.
          </p>
          <a href="#get-started" className="btn-primary btn-cta text-base">
            Find My Instructor
          </a>
        </div>
      </div>
    </section>
  )
}

function Footer() {
  return (
    <footer className="border-t border-slate-100 bg-slate-50/50">
      <div className="container-page py-12">
        <div className="flex flex-col md:flex-row items-start justify-between gap-8">
          <div>
            <LogoFull />
            <p className="text-sm text-slate-400 mt-3 max-w-xs">
              Concierge matching for Singapore private driving instructors.
              Sourced from the official SPF register.
            </p>
          </div>
          <div className="flex gap-12 text-sm">
            <div>
              <div className="font-semibold text-slate-900 mb-3">Product</div>
              <div className="space-y-2 text-slate-500">
                <a href="#how-it-works" className="block hover:text-slate-900 transition-colors">How it works</a>
                <a href="#faq" className="block hover:text-slate-900 transition-colors">FAQ</a>
                <a href="#get-started" className="block hover:text-slate-900 transition-colors">Get matched</a>
              </div>
            </div>
            <div>
              <div className="font-semibold text-slate-900 mb-3">Legal</div>
              <div className="space-y-2 text-slate-500">
                <Link href="/terms" className="block hover:text-slate-900 transition-colors">Terms of Service</Link>
                <Link href="/privacy" className="block hover:text-slate-900 transition-colors">Privacy Policy</Link>
{/* no refund policy link */}
              </div>
            </div>
          </div>
        </div>
        <div className="mt-10 pt-6 border-t border-slate-200/60 flex flex-col md:flex-row items-center justify-between gap-3 text-xs text-slate-400">
          <div className="flex items-center gap-3">
            <span>&copy; {new Date().getFullYear()} Drive Finder SG.</span>
            <UniqAttribution />
          </div>
          <div>Not affiliated with any driving centre or regulatory body.</div>
        </div>
      </div>
    </footer>
  )
}
