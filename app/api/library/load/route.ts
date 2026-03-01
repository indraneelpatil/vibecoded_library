import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";

const SUPABASE_TABLE = "library_state";
const SUPABASE_ROW_ID = "main";

export async function GET() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !anon) {
    return NextResponse.json({ payload: null, configured: false });
  }

  const db = createClient(url, anon, { auth: { persistSession: false } });
  const { data, error } = await db
    .from(SUPABASE_TABLE)
    .select("payload")
    .eq("id", SUPABASE_ROW_ID)
    .maybeSingle();

  if (error) {
    return NextResponse.json({ payload: null, configured: true });
  }

  return NextResponse.json({ payload: data?.payload ?? null, configured: true });
}
