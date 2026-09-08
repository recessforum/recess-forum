import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "log in to apply" }, { status: 401 });

  const data = (await req.json()) as { expertType: string; credentialInfo: string; fileName: string };
  if (!data.credentialInfo?.trim()) {
    return NextResponse.json({ error: "credentialInfo is required" }, { status: 400 });
  }

  // Real per-user table now (schema.sql's expert_applications), not the
  // file-backed dev store — RLS enforces applicant_id = auth.uid().
  const { data: application, error } = await supabase
    .from("expert_applications")
    .insert({
      applicant_id: user.id,
      expert_type: data.expertType,
      credential_info: data.credentialInfo.trim(),
      file_path: data.fileName || null,
    })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ application });
}
