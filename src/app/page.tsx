"use client";
import { useEffect, useRef, useState } from "react";

export default function Page() {
  const [userId, setUserId] = useState("");
  const [locked, setLocked] = useState(false);
  const [startedAt, setStartedAt] = useState<number | null>(null);
  const [clicks, setClicks] = useState(0);

  const timerRef = useRef<number | null>(null);
  const iframeRef = useRef<HTMLIFrameElement | null>(null);

  // 게임 시작 후 타이머 (시간은 표시 안 하지만 기록용)
  useEffect(() => {
    if (!startedAt) return;
    timerRef.current = window.setInterval(() => {
      /* 단순 경과시간 갱신용 (보이지 않음) */
    }, 1000) as unknown as number;

    const handleBeforeUnload = () => submitPlaytime(true);
    window.addEventListener("beforeunload", handleBeforeUnload);

    return () => {
      if (timerRef.current) window.clearInterval(timerRef.current);
      window.removeEventListener("beforeunload", handleBeforeUnload);
    };
  }, [startedAt]);

  // iframe 내부 클릭도 집계 (동일 출처일 때만)
  useEffect(() => {
    if (!locked) return;
    const el = iframeRef.current;
    if (!el) return;

    const attach = () => {
      try {
        const doc = el.contentDocument || el.contentWindow?.document;
        if (!doc) return;
        const handler = () => setClicks((c) => c + 1);
        doc.addEventListener("pointerdown", handler, { capture: true });
        const cleanup = () => doc.removeEventListener("pointerdown", handler, true);
        el.addEventListener("load", attach);
        return () => {
          cleanup();
          el.removeEventListener("load", attach);
        };
      } catch {
        /* cross-origin이면 무시 */
      }
    };
    const cleanup = attach();
    return () => {
      cleanup && cleanup();
    };
  }, [locked]);

  const startGame = () => {
    if (!userId.trim()) return alert("아이디를 입력하세요.");
    setLocked(true);
    setStartedAt(Date.now());
    setClicks(0);
  };

  const submitPlaytime = async (isUnload = false) => {
    if (!startedAt) return;
    const playSeconds = Math.floor((Date.now() - startedAt) / 1000);

    try {
      await fetch("/api/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        keepalive: isUnload,
        body: JSON.stringify({
          userId,
          playSeconds,
          clicks,
          game: "unity-webgl",
        }),
      });
      if (!isUnload) alert("저장 완료");
    } catch {
      if (!isUnload) alert("저장 실패");
    }
  };

  // 프레임 클릭도 집계
  const handleContainerClick = () => setClicks((c) => c + 1);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") startGame();
  };

  return (
    <main className="min-h-screen p-3 sm:p-6 flex flex-col items-center bg-white text-black gap-3">
      {/* 상단: 시작 전엔 입력폼, 시작 후엔 아이디 + 종료 버튼만 */}
      {!locked ? (
        <section className="w-full max-w-xs flex flex-col gap-2">
          <label className="text-sm font-medium">아이디</label>
          <input
            className="border rounded p-2"
            value={userId}
            onChange={(e) => setUserId(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="예: USER123"
          />
          <button
            className="rounded px-4 py-2 border hover:bg-gray-100"
            onClick={startGame}
          >
            게임 시작
          </button>
        </section>
      ) : (
        <section className="w-full max-w-[540px] px-1 sm:px-0">
          <div className="w-full flex items-center justify-between gap-2 text-sm text-gray-700">
            <div className="truncate font-semibold">{userId}</div>
            <button
              className="shrink-0 rounded px-3 py-1 border hover:bg-gray-100"
              onClick={() => submitPlaytime(false)}
            >
              종료/저장
            </button>
          </div>
        </section>
      )}

      {/* 게임 프레임 */}
      <section className="flex justify-center items-center w-full" onPointerDown={handleContainerClick}>
        <div
          className="relative w-full max-w-[540px] border rounded overflow-hidden shadow-sm flex justify-center items-center"
          style={{ aspectRatio: "9 / 16", background: "#f5f7fb" }}
        >
          {locked ? (
            <iframe
              ref={iframeRef}
              src="/game/index.html"
              title="game"
              className="block w-[98%] h-[98%] object-contain"
              allow="autoplay"
              allowFullScreen
              style={{ border: "none", background: "transparent" }}
            />
          ) : (
            <div className="text-center text-gray-700 px-6 select-none">
              <h3 className="mb-2 text-lg font-bold">게임 준비 완료</h3>
              <p className="mb-1 text-sm">
                아이디를 입력한 뒤 <b>게임 시작</b>을 눌러 주세요.
              </p>
              <p className="mt-2 text-sm text-red-600 font-semibold">
                게임이 끝난 후 반드시 <b>종료</b> 버튼을 눌러주세요.
              </p>
              <p className="mt-1 text-xs text-gray-500">
              </p>
            </div>
          )}
        </div>
      </section>
    </main>
  );
}
