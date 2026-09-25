import { NextResponse } from "next/server";
import { isAdmin } from "@/lib/db";
import { createClient } from "@/lib/supabase/server";

const SCOPES = ["founding", "parents", "providers", "experts", "unset", "all"] as const;
type Scope = (typeof SCOPES)[number];

const csvCell = (v: unknown) => {
  const s = v == null ? "" : String(v);
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
};

/** CSV of member emails for announcement mail (e.g. to Founding Parents).
 *  Emails live in auth.users; the admin_member_emails Postgres function
 *  re-checks that the caller is an admin before returning them. */
export async function GET(req: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "log in" }, { status: 401 });
  if (!(await isAdmin(supabase, user.id))) return NextResponse.json({ error: "admins only" }, { status: 403 });

  const requested = new URL(req.url).searchParams.get("scope") ?? "founding";
  const scope: Scope = (SCOPES as readonly string[]).includes(requested) ? (requested as Scope) : "founding";

  const { data, error } = await supabase.rpc("admin_member_emails", { p_scope: scope });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const rows = (data ?? []) as { founding_number: number | null; display_name: string; email: string; account_type: string | null; joined_at: string }[];
  const lines = [
    ["founding_number", "nickname", "email", "account_type", "joined_at"].join(","),
    ...rows.map((r) => [r.founding_number, r.display_name, r.email, r.account_type, r.joined_at].map(csvCell).join(",")),
  ];
  const date = new Date().toISOString().slice(0, 10);
  return new NextResponse(lines.join("\n") + "\n", {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="recess-${scope}-emails-${date}.csv"`,
      "Cache-Control": "no-store",
    },
  });
}
