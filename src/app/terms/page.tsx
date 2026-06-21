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
            <p>Submitting a request is free. We contact private driving instructors at your chosen test centre and ask you to
            pay the SGD $19 fee (the &ldquo;Standard Fee&rdquo;) for the details of an instructor that responds.</p>
            <p className="mt-3">&ldquo;Delivery&rdquo; means we send you that instructor's contact details (name and phone
            number) via WhatsApp. The Standard Fee pays for this introduction, not for lessons or any outcome.</p>
          </Section>

          <Section title="3. Watch list">
            <p>If the initial search does not produce a responding instructor, we may offer to add you to our 30-day
            watch list (the &ldquo;Watch List&rdquo;) for a one-off fee of SGD $9 (the &ldquo;Watch List Fee&rdquo;).</p>
            <p className="mt-3">During the 30-day watch period, we will keep an eye out for instructor availability and
            re-check with instructors at our own discretion. If a slot opens up within the 30-day window, we will send you
            the matched instructor's contact details. <strong>No additional charges apply once the Watch List Fee has been paid</strong>
            &mdash; the $9 covers both the watch period and the contact reveal if a match is found.</p>
            <p className="mt-3">The Watch List Fee is <strong>non-refundable in all cases</strong>. The $9 covers the time
            spent watching for availability on your behalf, regardless of outcome. This includes:</p>
            <ul className="list-disc pl-6 mt-2 space-y-1">
              <li>No match is found within the 30-day window;</li>
              <li>You change your mind or decide not to proceed at any point during the watch period;</li>
              <li>A match is provided but you choose not to contact them;</li>
              <li>You do not like the matched instructor;</li>
              <li>The matched instructor becomes unresponsive or unavailable after we provide their contact details;</li>
              <li>You decide to go through a driving school instead;</li>
              <li>You do not pass your driving test.</li>
            </ul>
            <p className="mt-3">We will let you know when the watch period ends.</p>
            <p className="mt-3">The Watch List is optional. You are under no obligation to join. If you choose not to,
            no further charges apply.</p>
          </Section>

          <Section title="4. How payment works">
            <p>Payment is collected via PayNow or card payment (Stripe), at our discretion. You are only asked to pay
            after we have confirmed a responding instructor match for you. No payment is taken at the time of
            submitting your request.</p>
            <p className="mt-3">If we are unable to find a match within 7 days, you will not be charged.</p>
          </Section>

          <Section title="5. Non-refundable once delivered">
            Once we have delivered the match per Section 2, the Standard Fee is considered earned and is <strong>non-refundable</strong>.
            This includes cases where:
            <ul className="list-disc pl-6 mt-2 space-y-1">
              <li>You change your mind or decide not to proceed with lessons;</li>
              <li>You are unable to reach the instructor after we provide their contact details;</li>
              <li>The instructor becomes unresponsive or unavailable after we verify their response;</li>
              <li>You do not pass your driving test.</li>
            </ul>
            If you believe we have materially failed to deliver as promised, please contact us on the WhatsApp thread we used to coordinate your request within
            7 days of receiving your match and we will review your case individually.
          </Section>

          <Section title="6. No guarantee of lesson outcomes">
            We are a matchmaking service. We do not teach, schedule, or conduct driving lessons ourselves. All lessons are
            conducted directly between the learner and the instructor. We make no representation or warranty about
            instructor teaching quality, lesson availability, passing rates, or any other outcome once we have completed
            the match.
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
            Questions? Reach out on the WhatsApp thread we used to coordinate your request.
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
