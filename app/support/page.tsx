export const metadata = { title: "Support — Recess Forum" };

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mb-8">
      <h2 className="text-[16px] font-semibold text-[#1C1B19] mb-2">{title}</h2>
      <div className="text-[14px] text-[#5B584F] leading-relaxed flex flex-col gap-3">{children}</div>
    </section>
  );
}

export default function SupportPage() {
  return (
    <div className="max-w-2xl mx-auto px-6 py-16">
      <h1 className="text-[24px] font-semibold text-[#1C1B19] mb-1">Support</h1>
      <p className="text-[13px] text-[#9A968A] mb-10">Questions, feedback, or trouble with the app? We&apos;re here to help.</p>

      <Section title="Contact us">
        <p>
          Email{" "}
          <a href="mailto:recessforum@gmail.com" className="text-[#26364A] font-medium hover:underline">
            recessforum@gmail.com
          </a>{" "}
          and we&apos;ll get back to you. This is the fastest way to reach us for account issues, bug reports, or general feedback.
        </p>
      </Section>

      <Section title="Reporting content or a user">
        <p>
          Every post, comment, and profile has a Report option built in — that&apos;s the
          quickest way to flag something for our moderators. You can also Block
          any user from their profile to stop seeing their content.
        </p>
      </Section>

      <Section title="Account and data">
        <p>
          You can update your profile or delete your account at any time from{" "}
          <a href="/settings" className="text-[#26364A] font-medium hover:underline">Settings</a>.
          See our{" "}
          <a href="/privacy" className="text-[#26364A] font-medium hover:underline">Privacy Policy</a>{" "}
          for details on what we collect and how it&apos;s used.
        </p>
      </Section>
    </div>
  );
}
