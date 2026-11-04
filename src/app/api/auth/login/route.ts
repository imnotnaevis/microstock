import { NextResponse } from "next/server";
import {
  verifyAccessKey,
  createSessionToken,
  AUTH_COOKIE_NAME,
  AUTH_MAX_AGE_SECONDS,
} from "@/lib/auth";

export async function POST(req: Request) {
  try {
    const { key } = await req.json();

    if (!key || typeof key !== "string") {
      return NextResponse.json(
        { ok: false, error: "Access key harus diisi." },
        { status: 400 }
      );
    }

    if (!verifyAccessKey(key)) {
      return NextResponse.json(
        { ok: false, error: "Access key salah. Pastikan format kapital sesuai." },
        { status: 401 }
      );
    }

    const token = await createSessionToken();
    const response = NextResponse.json({ ok: true });

    response.cookies.set({
      name: AUTH_COOKIE_NAME,
      value: token,
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: AUTH_MAX_AGE_SECONDS,
    });

    return response;
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Terjadi kesalahan internal";
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}

