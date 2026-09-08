import { NextResponse } from "next/server";
import { isAdmin } from "@/lib/db";
import { createClient } from "@/lib/supabase/server";

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "log in" }, { status: 401 });
  if (!(await isAdmin(supabase, user.id))) return NextResponse.json({ error: "admins only" }, { status: 403 });

  const { data: application, error } = await supabase
    .from("expert_applications")
    .select("file_path")
    .eq("id", id)
    .single();
  if (error || !application?.file_path) {
    return NextResponse.json({ error: "no file attached" }, { status: 404 });
  }

  const { data: signed, error: signError } = await supabase.storage
    .from("expert-credentials")
    .createSignedUrl(application.file_path, 300);
  if (signError || !signed) {
    return NextResponse.json({ error: signError?.message || "couldn't sign url" }, { status: 500 });
  }

  return NextResponse.redirect(signed.signedUrl);
}
