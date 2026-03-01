import { cookies } from "next/headers";
import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";

const OWNER_COOKIE = "owner_session";
const SUPABASE_TABLE = "library_state";
const SUPABASE_ROW_ID = "main";

export async function POST(req: Request) {
  const cookieStore = await cookies();
  const owner = cookieStore.get(OWNER_COOKIE)?.value === "1";
  if (!owner) return NextResponse.json({ ok: false }, { status: 403 });

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRole = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !serviceRole) {
    return NextResponse.json({ ok: false, error: "db_not_configured" }, { status: 500 });
  }

  const body = (await req.json().catch(() => ({}))) as { payload?: unknown };
  if (!body.payload || typeof body.payload !== "object") {
    return NextResponse.json({ ok: false }, { status: 400 });
  }

  const db = createClient(url, serviceRole, { auth: { persistSession: false } });
  const { error } = await db.from(SUPABASE_TABLE).upsert({
    id: SUPABASE_ROW_ID,
    payload: body.payload,
    updated_at: new Date().toISOString(),
  });

  if (error) return NextResponse.json({ ok: false }, { status: 500 });
  return NextResponse.json({ ok: true });
}
