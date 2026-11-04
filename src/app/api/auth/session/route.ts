import { NextResponse, type NextRequest } from "next/server";
import { verifySessionToken, AUTH_COOKIE_NAME } from "@/lib/auth";

export async function GET(req: NextRequest) {
  const token = req.cookies.get(AUTH_COOKIE_NAME)?.value;
  const session = await verifySessionToken(token);
  const authenticated = Boolean(session?.authenticated);

  return NextResponse.json({ authenticated });
}

