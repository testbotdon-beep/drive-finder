import Link from 'next/link'

export default function TermsPage() {
  return (
    <main className="min-h-screen bg-white">
      <div className="container-page max-w-3xl py-16">
        <Link href="/" className="text-sm text-slate-500 hover:text-slate-900">Back</Link>
        <h1 className="text-3xl font-bold text-slate-900 mt-6 mb-2">Terms of Service</h1>
        <p className="text-sm text-slate-500 mb-10">Last updated: {new Date().toLocaleDateString('en-SG')}</p>

        <div className="prose prose-slate max-w-none space-y-6 text-slate-700">
          <Section title="1. Who we are">
            Drive Finder SG (the &ldquo;Service&rdquo;) is a concierge matchmaking service operated by Uniq Labs Pte. Ltd.,
            a company registered in Singapore (&ldquo;we&rdquo;, &ldquo;us&rdquo;). We help learners in Singapore find
            private driving instructors for Class 3 and 3A vehicle licences.
          </Section>

          <Section title="2. What we deliver">
            <p>For the initial fee of SGD $19 (the &ldquo;Standard Fee&rdquo;), we will contact up to 5 top rated private
            driving instructors at your chosen test centre and endeavour to match you with a verified, available
            instructor within 7 days of your request.</p>
            <p className="mt-3">&ldquo;Delivery&rdquo; means we send you at least one instructor's contact details (name and
            phone number) via WhatsApp, with confirmation that we have personally verified their availability.</p>
          </Section>

          <Section title="3. Extended search">
            <p>If the initial 5 instructors are unavailable, we will inform you and offer an extended search for an
            additional SGD $10 (the &ldquo;Extended Search Fee&rdquo;). The extended search covers either:</p>
            <ul className="list-disc pl-6 mt-2 space-y-1">
              <li>Additional instructors at the same test centre (which may have lower pass rates); or</li>
              <li>Instructors at a different test centre of your choice.</li>
            </ul>
            <p className="mt-3"><strong>Pricing:</strong> The $10 Extended Search Fee is charged upfront for the additional search
            effort. If the extended search successfully finds you a verified, available instructor, the $19 Standard Fee
            in Section 2 applies to unlock the matched contact details. If no match is found, only the $10 Extended
            Search Fee is charged.</p>
            <p className="mt-3">The extended search is optional. You are under no obligation to proceed. If you choose
            not to, no further charges apply.</p>
          </Section>

          <Section title="4. How payment works">
            <p>Payment is collected via PayNow or card payment (Stripe), at our discretion. You are only asked to pay
            after we have confirmed an available instructor match for you. No payment is taken at the time of
            submitting your request.</p>
            <p className="mt-3">If we are unable to find a match within 7 days, you will not be charged.</p>
          </Section>

          <Section title="5. Non-refundable once delivered">
            Once we have delivered the match per Section 2, the Fee is considered earned and is <strong>non-refundable</strong>.
            This includes cases where:
            <ul className="list-disc pl-6 mt-2 space-y-1">
              <li>You change your mind or decide not to proceed with lessons;</li>
              <li>You are unable to reach the instructor after we provide their contact details;</li>
              <li>The instructor becomes unavailable after we verify them;</li>
              <li>You do not pass your driving test.</li>
            </ul>
            If you believe we have materially failed to deliver as promised, please contact us via the <a className="text-emerald-600 hover:underline" href="/contact">contact form</a> within
            7 days of receiving your match and we will review your case individually.
          </Section>

          <Section title="6. No guarantee of lesson outcomes">
            We are a matchmaking service. We do not teach, schedule, or conduct driving lessons ourselves. All lessons are
            conducted directly between the learner and the instructor. We make no representation or warranty about
            instructor teaching quality, lesson availability, passing rates, or any other outcome once we have completed
            the match. Pass rates displayed are sourced from publicly available data and are provided for information only.
          </Section>

          <Section title="7. Instructor relationship">
            Instructors matched through our service are independent professionals. They are not our employees,
            agents, or contractors. We do not receive commissions from instructors. Any dispute regarding lessons,
            payment to instructors, or instructor conduct should be raised directly with the instructor.
          </Section>

          <Section title="8. Your obligations">
            You agree to provide accurate information in your request. You agree not to use our service to harass
            instructors or submit fraudulent requests. We reserve the right to refuse service at our discretion.
          </Section>

          <Section title="9. Limitation of liability">
            To the maximum extent permitted by Singapore law, our total liability to you for any claim arising out of or
            related to the Service shall not exceed the total fees you have paid us. We are not liable for any indirect,
            consequential, or incidental damages.
          </Section>

          <Section title="10. Governing law">
            These Terms are governed by the laws of Singapore. Any dispute shall be resolved in the courts of Singapore.
          </Section>

          <Section title="11. Contact">
            Questions? Reach out via the <a className="text-emerald-600 hover:underline" href="/contact">contact form</a>.
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
