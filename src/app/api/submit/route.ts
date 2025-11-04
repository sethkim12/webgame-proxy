export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const { userId, playSeconds, clicks, game = "unity-webgl" } = await req.json();

    if (!userId || !Number.isFinite(playSeconds)) {
      return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
    }

    const endpoint = process.env.GAS_ENDPOINT;
    const secret   = process.env.GAS_SECRET;
    if (!endpoint || !secret) {
      return NextResponse.json({ error: "Server misconfigured (env)" }, { status: 500 });
    }

    const res = await fetch(endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      cache: "no-store",
      body: JSON.stringify({
        secret,
        sheetName: "WebGame",
        values: {
          userId,
          playSeconds: Math.max(0, Math.round(playSeconds)),
          clicks: Number.isFinite(clicks) ? Math.max(0, Math.round(clicks)) : undefined,
          game,
          ts: new Date().toISOString(),
          ua: req.headers.get("user-agent") ?? "",
        },
      }),
    });

    const text = await res.text();
    let data: any;
    try { data = JSON.parse(text); } catch {}

    if (!data?.ok) {
      return NextResponse.json(
        { error: data?.error || `GAS error (status ${res.status})` },
        { status: 500 }
      );
    }

    return NextResponse.json({ ok: true, gas: data }, { status: 200 });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message ?? "Server error" }, { status: 500 });
  }
}
