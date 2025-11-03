"use client";
import { useEffect, useRef, useState } from "react";

export default function Page() {
  const [userId, setUserId] = useState("");
  const [locked, setLocked] = useState(false);
  const [startedAt, setStartedAt] = useState<number | null>(null);
  const [elapsed, setElapsed] = useState(0);
  const timerRef = useRef<number | null>(null);

  useEffect(() => {
    if (!startedAt) return;
    timerRef.current = window.setInterval(() => {
      setElapsed(Math.floor((Date.now() - startedAt) / 1000));
    }, 1000) as unknown as number;

    const handleBeforeUnload = () => submitPlaytime(true);
    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => {
      if (timerRef.current) window.clearInterval(timerRef.current);
      window.removeEventListener("beforeunload", handleBeforeUnload);
    };
  }, [startedAt]);

  const startGame = () => {
    if (!userId.trim()) return alert("아이디를 입력하세요.");
    setLocked(true);
    setStartedAt(Date.now());
  };

  const submitPlaytime = async (isUnload = false) => {
    if (!startedAt) return;
    const playSeconds = Math.floor((Date.now() - startedAt) / 1000);
    try {
      await fetch("/api/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        keepalive: isUnload,
        body: JSON.stringify({ userId, playSeconds, game: "unity-webgl" }),
      });
      if (!isUnload) alert(`저장 완료: ${playSeconds}s`);
    } catch {
      if (!isUnload) alert("저장 실패");
    }
  };

  return (
    <main className="min-h-screen p-6 flex flex-col gap-4">
      <section className="max-w-md flex flex-col gap-2">
        <label className="text-sm font-medium">아이디</label>
        <input
          className="border rounded p-2"
          value={userId}
          onChange={(e) => setUserId(e.target.value)}
          placeholder="예: USER123"
          disabled={locked}
        />
        {!locked ? (
          <button className="rounded px-4 py-2 border" onClick={startGame}>
            게임 시작
          </button>
        ) : (
          <div className="text-sm text-gray-600">시작됨 · 경과 {elapsed}s</div>
        )}
      </section>

      <section className="flex-1">
        <div className="aspect-video border rounded overflow-hidden">
          {/* Unity WebGL 빌드가 있으면 /public/game/index.html로 두고 iframe으로 띄웁니다 */}
          <iframe
            src={locked ? "/game/index.html" : "about:blank"}
            title="game"
            className="w-full h-full"
            allow="fullscreen; autoplay"
          />
        </div>
      </section>

      {locked && (
        <section className="flex gap-8 items-center">
          <div>현재 플레이타임: <b>{elapsed}s</b></div>
          <button className="rounded px-4 py-2 border" onClick={() => submitPlaytime(false)}>
            플레이 종료/저장
          </button>
        </section>
      )}
    </main>
  );
}
