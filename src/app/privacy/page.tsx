import Link from 'next/link'

export default function PrivacyPage() {
  return (
    <main className="min-h-screen bg-white">
      <div className="container-page max-w-3xl py-16">
        <Link href="/" className="text-sm text-slate-500 hover:text-slate-900">Back</Link>
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
              <li><strong>Request data:</strong> your name, WhatsApp number, email address, test centre preference,
              transmission preference, and any notes you provide.</li>
              <li><strong>Payment data:</strong> processed via PayNow or Stripe. We do not store card numbers or
              bank account details.</li>
              <li><strong>Technical data:</strong> IP address, browser, and device info via standard server logs
              and Vercel Analytics.</li>
            </ul>
          </Section>

          <Section title="3. How we use your data">
            <ul className="list-disc pl-6 space-y-1">
              <li>To match you with private driving instructors.</li>
              <li>To share your first name and phone number with matched instructors so they can contact you.</li>
              <li>To communicate with you about your request via WhatsApp.</li>
              <li>To process payment.</li>
              <li>To improve our service (anonymized analytics only).</li>
            </ul>
          </Section>

          <Section title="4. Who we share it with">
            <ul className="list-disc pl-6 space-y-1">
              <li><strong>Matched instructors:</strong> your first name and phone number only, after we confirm a match.</li>
              <li><strong>Payment providers:</strong> PayNow or Stripe, for payment processing only.</li>
              <li><strong>No one else.</strong> We do not sell, rent, or trade your data to third parties.</li>
            </ul>
          </Section>

          <Section title="5. How long we keep it">
            We keep your request data for 12 months for service delivery, dispute resolution, and improvement.
            After that, we anonymize or delete it. You can request deletion at any time (see Section 7).
          </Section>

          <Section title="6. Security">
            We use industry-standard security including HTTPS, encrypted storage, and access controls.
          </Section>

          <Section title="7. Your rights">
            Under the PDPA you have the right to access, correct, or request deletion of your personal data. To exercise
            these rights, reach out via the contact form on our website.
            We will respond within 30 days.
          </Section>

          <Section title="8. Cookies">
            We use minimal cookies for session management. We use Vercel Analytics for anonymized traffic data.
            We do not use advertising or tracking cookies.
          </Section>

          <Section title="9. Changes">
            We may update this Privacy Policy occasionally. Material changes will be announced on this page. Continued
            use of the service after changes constitutes acceptance.
          </Section>

          <Section title="10. Contact">
            Questions about privacy? Reach out via the contact form on our website.
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
