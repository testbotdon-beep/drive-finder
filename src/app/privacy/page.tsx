import Link from 'next/link'

export default function PrivacyPage() {
  return (
    <main className="min-h-screen bg-white">
      <div className="container-narrow max-w-3xl py-16">
        <Link href="/" className="text-sm text-slate-500 hover:text-slate-900">← Back</Link>
        <h1 className="text-3xl font-bold text-slate-900 mt-6 mb-2">Privacy Policy</h1>
        <p className="text-sm text-slate-500 mb-10">Last updated: {new Date().toLocaleDateString('en-SG')}</p>

        <div className="space-y-6 text-slate-700">
          <Section title="1. Who we are">
            Drive Finder SG is operated by Uniq Labs Pte. Ltd., Singapore. This Privacy Policy describes how we
            collect, use, and share your personal data in accordance with the Singapore Personal Data Protection Act
            (PDPA).
          </Section>

          <Section title="2. What we collect">
            <ul className="list-disc pl-6 space-y-1">
              <li><strong>Request data:</strong> your name, WhatsApp number, email address, test centre, transmission
              preference, start date, budget, language preference, and any notes you provide.</li>
              <li><strong>Payment data:</strong> processed and stored by Stripe, not us. We only store a reference to
              the payment intent (not card numbers).</li>
              <li><strong>Technical data:</strong> IP address, browser, and device info via standard server logs.</li>
            </ul>
          </Section>

          <Section title="3. How we use your data">
            <ul className="list-disc pl-6 space-y-1">
              <li>To match you with private driving instructors.</li>
              <li>To share your first name and phone number with matched instructors so they can contact you.</li>
              <li>To send you emails about your request and delivery status.</li>
              <li>To process payment via Stripe.</li>
              <li>To improve our service (anonymized analytics only).</li>
            </ul>
          </Section>

          <Section title="4. Who we share it with">
            <ul className="list-disc pl-6 space-y-1">
              <li><strong>Matched instructors</strong>:your first name and phone number only, after you request a match.</li>
              <li><strong>Stripe</strong>:for payment processing.</li>
              <li><strong>Resend</strong>:for sending transactional emails.</li>
              <li><strong>No one else.</strong> We do not sell, rent, or trade your data to third parties.</li>
            </ul>
          </Section>

          <Section title="5. How long we keep it">
            We keep your request data for 12 months for service delivery, dispute resolution, and improvement.
            After that, we anonymize or delete it. You can request deletion at any time (see Section 7).
          </Section>

          <Section title="6. Security">
            We use industry-standard security (HTTPS, encrypted storage, access controls). Payment card data never
            touches our servers:it is handled directly by Stripe, which is PCI DSS Level 1 compliant.
          </Section>

          <Section title="7. Your rights">
            Under the PDPA you have the right to access, correct, or request deletion of your personal data. To exercise
            these rights, email us at <a href="mailto:hello@uqlabs.co" className="text-blue-600 underline">hello@uqlabs.co</a>
            {' '}with your request. We will respond within 30 days.
          </Section>

          <Section title="8. Cookies">
            We use minimal cookies for session management (e.g. the admin session). We do not use advertising or
            tracking cookies.
          </Section>

          <Section title="9. Changes">
            We may update this Privacy Policy occasionally. Material changes will be announced on this page. Continued
            use of the service after changes constitutes acceptance.
          </Section>

          <Section title="10. Contact">
            Questions about privacy? Email us at <a href="mailto:hello@uqlabs.co" className="text-blue-600 underline">hello@uqlabs.co</a>.
          </Section>
        </div>
      </div>
    </main>
  )
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <h2 className="text-lg font-bold text-slate-900 mb-2">{title}</h2>
      <div className="leading-relaxed">{children}</div>
    </div>
  )
}
