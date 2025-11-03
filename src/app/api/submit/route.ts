// ✅ Node 런타임 강제 (Next 15 Edge 런타임에서 env 미노출 이슈 예방)
export const runtime = "nodejs";

import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const { userId, playSeconds, game = "unity-webgl" } = await req.json();

    // 유효성 검사
    if (!userId || !Number.isFinite(playSeconds)) {
      console.error("[API] Invalid payload", { userId, playSeconds, game });
      return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
    }

    // ✅ 환경변수 로드 상태 확인
    const endpoint = process.env.GAS_ENDPOINT;
    const secret = process.env.GAS_SECRET; // ← 이름 통일
    console.log("[API] ENV check:", { endpoint, hasSecret: !!secret });

    if (!endpoint || !secret) {
      return NextResponse.json({ error: "Server misconfigured (env)" }, { status: 500 });
    }

    // ✅ GAS가 기대하는 스키마(values 객체)에 맞춰 전송
    const res = await fetch(endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      cache: "no-store",
      body: JSON.stringify({
        secret,                    // ← 스크립트 속성의 SECRET과 동일
        sheetName: "WebGame",      // ← 실제 탭명과 동일하게
        values: {
          userId,
          playSeconds: Math.max(0, Math.round(playSeconds)),
          game,
          ts: new Date().toISOString(),
          ua: req.headers.get("user-agent") ?? "",
        },
      }),
    });

    const text = await res.text();
    console.log("[API] GAS status:", res.status, "body:", text?.slice(0, 1000));

    let data: any;
    try { data = JSON.parse(text); } catch { /* HTML일 가능성 방지 */ }

    if (!data?.ok) {
      return NextResponse.json(
        { error: data?.error || `GAS error (status ${res.status})` },
        { status: 500 }
      );
    }

    return NextResponse.json({ ok: true, gas: data }, { status: 200 });
  } catch (e: any) {
    console.error("[API] Exception:", e);
    return NextResponse.json({ error: e?.message ?? "Server error" }, { status: 500 });
  }
}
