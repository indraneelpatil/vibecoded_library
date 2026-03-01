import { NextResponse } from "next/server";

const OWNER_COOKIE = "owner_session";

export async function POST(req: Request) {
  const { passcode } = (await req.json().catch(() => ({ passcode: "" }))) as {
    passcode?: string;
  };

  const expected = process.env.OWNER_PASSCODE;
  if (!expected || !passcode || passcode !== expected) {
    return NextResponse.json({ ok: false }, { status: 401 });
  }

  const res = NextResponse.json({ ok: true });
  res.cookies.set(OWNER_COOKIE, "1", {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 30,
  });
  return res;
}
