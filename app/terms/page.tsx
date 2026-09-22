export const metadata = { title: "Terms of Use" };

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mb-8">
      <h2 className="text-[16px] font-semibold text-[#1C1B19] mb-2">{title}</h2>
      <div className="text-[14px] text-[#5B584F] leading-relaxed flex flex-col gap-3">{children}</div>
    </section>
  );
}

export default function TermsPage() {
  return (
    <div className="max-w-2xl mx-auto px-6 py-16">
      <h1 className="text-[24px] font-semibold text-[#1C1B19] mb-1">Terms of Use</h1>
      <p className="text-[13px] text-[#9A968A] mb-10">Last updated September 2026</p>

      <Section title="Agreement">
        <p>
          By creating an account or using Recess Forum, you agree to these Terms
          of Use and to our{" "}
          <a href="/privacy" className="text-[#26364A] font-medium hover:underline">Privacy Policy</a>.
          If you don&apos;t agree, please don&apos;t use the site.
        </p>
      </Section>

      <Section title="Who can use Recess Forum">
        <p>
          Recess Forum is for parents and other adults navigating their kids&apos;
          education. You must be at least 18 years old to create an account.
        </p>
      </Section>

      <Section title="Your content">
        <p>
          You own what you post. By posting, you grant Recess Forum a
          non-exclusive, worldwide license to host, display, and distribute
          that content on the site so other users can see it. You&apos;re
          responsible for what you post and for making sure you have the right
          to post it.
        </p>
      </Section>

      <Section title="Community standards">
        <p>We don&apos;t allow content that:</p>
        <ul className="list-disc pl-5 flex flex-col gap-1.5">
          <li>Is violent, threatens harm, or promotes self-harm</li>
          <li>Harasses, bullies, or targets another person or their child</li>
          <li>Is defamatory, discriminatory, or hateful</li>
          <li>Impersonates someone else or misrepresents your identity</li>
          <li>Shares another person&apos;s private information without consent</li>
          <li>Is spam, or promotes an unrelated commercial product or service</li>
          <li>Is illegal, or facilitates illegal activity</li>
        </ul>
        <p>
          Every post, comment, and profile has a Report option, and you can
          Block any user to stop seeing their content. Reports are reviewed by
          admins, and we may remove content or suspend accounts that violate
          these standards.
        </p>
      </Section>

      <Section title="Account termination">
        <p>
          You can delete your own account at any time from{" "}
          <a href="/settings" className="text-[#26364A] font-medium hover:underline">Settings</a>,
          which permanently removes your posts, comments, and votes. We may
          suspend or terminate accounts that violate these Terms, at our
          discretion.
        </p>
      </Section>

      <Section title="No warranty">
        <p>
          Recess Forum is provided &quot;as is.&quot; Content posted by other
          users reflects their own views and experiences, not medical, legal,
          or educational advice from Recess Forum. Use your own judgment,
          especially for anything involving your child&apos;s health, safety,
          or education.
        </p>
      </Section>

      <Section title="Changes to these terms">
        <p>
          If we make material changes to these Terms, we&apos;ll update the
          date at the top of this page.
        </p>
      </Section>

      <Section title="Contact us">
        <p>
          Questions about these Terms? Email us at{" "}
          <a href="mailto:recessforum@gmail.com" className="text-[#26364A] font-medium hover:underline">
            recessforum@gmail.com
          </a>.
        </p>
      </Section>
    </div>
  );
}
