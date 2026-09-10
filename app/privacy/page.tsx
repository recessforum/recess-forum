export const metadata = { title: "Privacy Policy — Recess Forum" };

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mb-8">
      <h2 className="text-[16px] font-semibold text-[#1C1B19] mb-2">{title}</h2>
      <div className="text-[14px] text-[#5B584F] leading-relaxed flex flex-col gap-3">{children}</div>
    </section>
  );
}

export default function PrivacyPage() {
  return (
    <div className="max-w-2xl mx-auto px-6 py-16">
      <h1 className="text-[24px] font-semibold text-[#1C1B19] mb-1">Privacy Policy</h1>
      <p className="text-[13px] text-[#9A968A] mb-10">Last updated September 2026</p>

      <Section title="Overview">
        <p>
          Recess Forum is a discussion forum for parents navigating their kids&apos;
          education. This page explains what information we collect, how we use it,
          and the choices you have.
        </p>
      </Section>

      <Section title="Information we collect">
        <p>
          <strong>Account information.</strong> When you sign up with email and
          password, we store your email address and the nickname you choose. Your
          nickname — not your real name or email — is what other users see.
        </p>
        <p>
          <strong>Google Sign-In.</strong> If you choose to sign in with Google
          instead, Google shares your name and email address with us, consistent
          with the permissions you approve on Google&apos;s consent screen. We use
          this the same way as an email/password account: to create your profile
          and let you choose a nickname.
        </p>
        <p>
          <strong>Content you post.</strong> Posts, comments, and votes are stored
          and attributed to your nickname. An optional state (never a precise zip
          code — we deliberately never store that) can be attached to a post.
        </p>
        <p>
          <strong>Verified Expert applications.</strong> If you apply to be listed
          as a Verified Expert, the credential file you upload is stored in a
          private location accessible only to you and site administrators
          reviewing your application.
        </p>
      </Section>

      <Section title="How we use information">
        <p>
          We use your information to operate the forum: creating your account,
          displaying your posts and nickname, tallying votes and karma, reviewing
          Verified Expert applications, and sending transactional emails (like
          confirming your email address when you sign up).
        </p>
      </Section>

      <Section title="What we don't do">
        <p>
          We don&apos;t sell your personal information. We don&apos;t run targeted
          advertising or share data for advertising purposes on sensitive
          categories — Special Education, Mental Health, or Bullying — and we
          never will, regardless of how the site grows.
        </p>
      </Section>

      <Section title="Cookies and sessions">
        <p>
          We use a session cookie, managed by our authentication provider
          (Supabase), to keep you signed in. We don&apos;t use third-party
          advertising or tracking cookies.
        </p>
      </Section>

      <Section title="Children's privacy">
        <p>
          Recess Forum is intended for parents and other adults, not for children.
          We don&apos;t knowingly collect information from children under 13.
        </p>
      </Section>

      <Section title="Your choices">
        <p>
          You can edit or delete your posts and comments at any time. To delete
          your account or request a copy of your data, contact us using the
          address below and we&apos;ll take care of it.
        </p>
      </Section>

      <Section title="Changes to this policy">
        <p>
          If we make material changes to this policy, we&apos;ll update the date
          at the top of this page.
        </p>
      </Section>

      <Section title="Contact us">
        <p>
          Questions about this policy? Email us at{" "}
          <a href="mailto:recessforum@gmail.com" className="text-[#26364A] font-medium hover:underline">
            recessforum@gmail.com
          </a>.
        </p>
      </Section>
    </div>
  );
}
