import Link from 'next/link'

export const metadata = {
  title: 'Contact',
  description: 'Get in touch with Drive Finder SG.',
}

export default function ContactPage() {
  return (
    <main className="min-h-screen bg-white">
      <div className="container-page max-w-xl py-16">
        <Link href="/" className="text-sm text-slate-500 hover:text-slate-900">Back</Link>
        <h1 className="text-3xl font-bold text-slate-900 mt-6 mb-2">Contact us</h1>
        <p className="text-slate-500 mb-10">
          Questions, feedback, data requests, or a concern about your match? Send us a message and we will get back to
          you within 2 business days.
        </p>

        <form
          action="https://formsubmit.co/kevan@uqlabs.co"
          method="POST"
          className="space-y-4 bg-white border border-slate-200/80 rounded-2xl p-6 md:p-8"
          style={{ boxShadow: '0 1px 3px rgba(0,0,0,0.04), 0 20px 60px -12px rgba(10,22,40,0.08)' }}
        >
          <input type="hidden" name="_subject" value="Drive Finder SG — contact form" />
          <input type="hidden" name="_captcha" value="true" />
          <input type="hidden" name="_template" value="table" />
          <input type="text" name="_honey" style={{ display: 'none' }} tabIndex={-1} autoComplete="off" />

          <Field label="Your name" required>
            <input
              type="text"
              name="name"
              required
              className="input-field"
              placeholder="Jane Tan"
            />
          </Field>

          <Field label="Email" required>
            <input
              type="email"
              name="email"
              required
              className="input-field"
              placeholder="jane@example.com"
            />
          </Field>

          <Field label="Message" required>
            <textarea
              name="message"
              required
              rows={6}
              className="input-field"
              placeholder="What's on your mind?"
            />
          </Field>

          <button type="submit" className="btn-primary btn-cta w-full">
            Send message
          </button>

          <p className="text-[11px] text-slate-400 text-center">
            We will never share your email. Responses from kevan@uqlabs.co (Uniq Labs Pte. Ltd.).
          </p>
        </form>
      </div>
    </main>
  )
}

function Field({ label, required, children }: { label: string; required?: boolean; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="block text-sm font-medium text-slate-700 mb-1.5">
        {label}
        {required && <span className="text-red-500 ml-0.5">*</span>}
      </span>
      {children}
    </label>
  )
}
