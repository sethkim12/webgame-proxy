"use client";
import { useEffect, useRef, useState } from "react";

export default function Page() {
  const [userId, setUserId] = useState("");
  const [locked, setLocked] = useState(false);
  const [startedAt, setStartedAt] = useState<number | null>(null);
  const [clicks, setClicks] = useState(0);

  const timerRef = useRef<number | null>(null);
  const iframeRef = useRef<HTMLIFrameElement | null>(null);

  useEffect(() => {
    if (!startedAt) return;
    timerRef.current = window.setInterval(() => {}, 1000) as unknown as number;
    const handleBeforeUnload = () => submitPlaytime(true);
    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => {
      if (timerRef.current) window.clearInterval(timerRef.current);
      window.removeEventListener("beforeunload", handleBeforeUnload);
    };
  }, [startedAt]);

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
      } catch {}
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

  const handleContainerClick = () => setClicks((c) => c + 1);
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") startGame();
  };

  return (
    <main className="min-h-screen p-3 sm:p-6 flex flex-col items-center bg-white text-black gap-3">
      {/* 상단 영역 */}
      {!locked ? (
        <section className="w-full max-w-xs flex flex-col gap-3 items-center">
          <label className="text-sm font-medium self-start text-gray-700">아이디</label>
          <input
            className="border rounded p-2 w-full shadow-sm"
            value={userId}
            onChange={(e) => setUserId(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="예: USER123"
          />
          <button
            className="rounded px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold text-lg translate-y-[-4px] shadow-md"
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
              className="shrink-0 rounded px-4 py-2 bg-blue-700 hover:bg-blue-800 text-white font-semibold shadow-lg"
              onClick={() => submitPlaytime(false)}
            >
              종료 / 저장
            </button>
          </div>
        </section>
      )}

      {/* 게임 프레임 */}
      <section
        className="flex justify-center items-center w-full"
        onPointerDown={handleContainerClick}
      >
        <div
          className="relative w-full max-w-[540px] border rounded overflow-hidden shadow-md flex justify-center items-start pt-10"
          style={{
            aspectRatio: "9 / 16",
            background: locked ? "#f5f7fb" : "#bae6fd", // 🔵 게임 전 하늘색, 게임 중 밝은 회색톤
          }}
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
            <div className="text-center text-gray-800 px-6 select-none">
              <h3 className="mb-2 text-lg font-bold">게임 준비 완료</h3>
              <p className="mb-1 text-sm">
                아이디를 입력한 뒤 <b>게임 시작</b>을 눌러 주세요.
              </p>
              <p className="mt-2 text-sm text-red-600 font-semibold">
                게임이 끝난 후 반드시 <b>종료</b> 버튼을 눌러주세요.
              </p>
            </div>
          )}
        </div>
      </section>
    </main>
  );
}
