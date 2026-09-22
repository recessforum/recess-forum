export const metadata = { title: "Child Safety Standards" };

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mb-8">
      <h2 className="text-[16px] font-semibold text-[#1C1B19] mb-2">{title}</h2>
      <div className="text-[14px] text-[#5B584F] leading-relaxed flex flex-col gap-3">{children}</div>
    </section>
  );
}

export default function ChildSafetyPage() {
  return (
    <div className="max-w-2xl mx-auto px-6 py-16">
      <h1 className="text-[24px] font-semibold text-[#1C1B19] mb-1">Child Safety Standards</h1>
      <p className="text-[13px] text-[#9A968A] mb-10">Last updated September 2026</p>

      <Section title="Our commitment">
        <p>
          Recess Forum has zero tolerance for child sexual abuse and
          exploitation (CSAE), including child sexual abuse material (CSAM).
          These standards apply to everything posted on Recess Forum: posts,
          comments, photos, and profiles.
        </p>
      </Section>

      <Section title="Who can use Recess Forum">
        <p>
          Recess Forum is for parents and other adults. You must be at least 18
          years old to create an account, and accounts are not offered to
          children.
        </p>
      </Section>

      <Section title="What is not allowed">
        <ul className="list-disc pl-5 flex flex-col gap-1.5">
          <li>Any sexual content involving a minor, including images, text, or links</li>
          <li>Sexualizing, grooming, or attempting to contact a minor for sexual purposes</li>
          <li>Soliciting, trading, or requesting child sexual abuse material</li>
          <li>Sharing a child&apos;s private information in a way that puts them at risk</li>
        </ul>
        <p>
          Accounts that violate these standards are removed. See our{" "}
          <a href="/terms" className="text-[#26364A] font-medium hover:underline">Terms of Use</a>{" "}
          for our full community standards.
        </p>
      </Section>

      <Section title="How to report a concern">
        <p>
          Every post, comment, and profile has a Report option built into the
          app and website. Reports are reviewed by our admins, who can remove
          content and suspend or terminate accounts. You can also Block any user
          from their profile to stop seeing their content.
        </p>
        <p>
          You can also email us directly at{" "}
          <a href="mailto:recessforum@gmail.com" className="text-[#26364A] font-medium hover:underline">
            recessforum@gmail.com
          </a>
          .
        </p>
      </Section>

      <Section title="How we respond">
        <p>
          When we identify child sexual abuse material or exploitation, we
          remove the content, terminate the account, and report it to the
          National Center for Missing &amp; Exploited Children (NCMEC) and to
          law enforcement as required by law.
        </p>
      </Section>

      <Section title="Point of contact">
        <p>
          Our designated contact for questions about our child safety and CSAM
          prevention practices is{" "}
          <a href="mailto:recessforum@gmail.com" className="text-[#26364A] font-medium hover:underline">
            recessforum@gmail.com
          </a>
          .
        </p>
      </Section>
    </div>
  );
}
