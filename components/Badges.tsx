import { BadgeCheck, Crown, Rocket, ShieldCheck, Sparkles, Sprout, Star } from "lucide-react";
import type { Role, Tier } from "@/lib/types";

const TIER_ICONS = { crown: Crown, star: Star, sprout: Sprout, rocket: Rocket } as const;

export function TierBadge({ tier }: { tier: (Tier & { icon: keyof typeof TIER_ICONS; text: string; bg: string }) | null }) {
  if (!tier) return null;
  const Icon = TIER_ICONS[tier.icon];
  return (
    <span style={{ backgroundColor: tier.bg, color: tier.text }}
      className="inline-flex items-center gap-1 text-[11px] font-semibold px-1.5 py-0.5 rounded-sm">
      <Icon size={11} /> {tier.label}
    </span>
  );
}

export function RoleBadge({ role }: { role: Role | null }) {
  if (!role) return null;
  if (role.role === "admin") {
    return (
      <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-1.5 py-0.5 rounded-sm bg-[#FBEAEA] text-[#B23B3B]">
        <ShieldCheck size={11} /> Administrator
      </span>
    );
  }
  return (
    <span title={role.expertType}
      className="inline-flex items-center gap-1 max-w-[220px] text-[11px] font-semibold px-1.5 py-0.5 rounded-sm bg-[#E4F2F1] text-[#217A78]">
      <BadgeCheck size={11} className="shrink-0" />
      <span className="truncate">Verified Expert{role.expertType ? ` · ${role.expertType}` : ""}</span>
    </span>
  );
}

export function FoundingBadge({ number }: { number?: number | null }) {
  return (
    <span title="One of the first 500 parents to join Recess Forum"
      className="inline-flex items-center gap-1 text-[11px] font-semibold px-1.5 py-0.5 rounded-sm bg-[#F5EFDD] text-[#B08D45]">
      <Sparkles size={11} /> Founding Parent{number ? ` #${number}` : ""}
    </span>
  );
}

export function AuthorBadges({
  tier,
  role,
  founding,
}: {
  tier: Parameters<typeof TierBadge>[0]["tier"];
  role: Role | null;
  /** The profile's founding number (1..500), or null/undefined if not a Founding Parent. */
  founding?: number | null;
}) {
  if (!tier && !role && !founding) return null;
  return (
    <span className="inline-flex items-center gap-1">
      <RoleBadge role={role} />
      {founding ? <FoundingBadge number={founding} /> : null}
      <TierBadge tier={tier} />
    </span>
  );
}
