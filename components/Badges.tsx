import { BadgeCheck, Crown, Rocket, ShieldCheck, Sprout, Star } from "lucide-react";
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
      className="inline-flex items-center gap-1 text-[11px] font-semibold px-1.5 py-0.5 rounded-sm bg-[#E4F2F1] text-[#217A78]">
      <BadgeCheck size={11} /> Verified Expert
    </span>
  );
}

export function AuthorBadges({ tier, role }: { tier: Parameters<typeof TierBadge>[0]["tier"]; role: Role | null }) {
  if (!tier && !role) return null;
  return (
    <span className="inline-flex items-center gap-1">
      <RoleBadge role={role} />
      <TierBadge tier={tier} />
    </span>
  );
}
