import { cookies } from "next/headers";
import { NextResponse } from "next/server";

const OWNER_COOKIE = "owner_session";

export async function GET() {
  const store = await cookies();
  const owner = store.get(OWNER_COOKIE)?.value === "1";
  return NextResponse.json({ owner });
}
