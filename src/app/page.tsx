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
    <main className="min-h-screen p-6 flex flex-col gap-4 items-center bg-white text-black">
      {/* 입력 영역 */}
      <section className="w-full max-w-xs flex flex-col gap-2">
        <label className="text-sm font-medium">아이디</label>
        <input
          className="border rounded p-2"
          value={userId}
          onChange={(e) => setUserId(e.target.value)}
          placeholder="예: USER123"
          disabled={locked}
        />
        {!locked ? (
          <button
            className="rounded px-4 py-2 border hover:bg-gray-100"
            onClick={startGame}
          >
            게임 시작
          </button>
        ) : (
          <div className="text-sm text-gray-500">
            시작됨 · 경과 {elapsed}s
          </div>
        )}
      </section>

      {/* 게임 프레임 */}
      <section className="flex justify-center items-center w-full">
        <div className="game-frame border rounded overflow-hidden shadow-md">
          <iframe
            src={locked ? "/game/index.html" : "about:blank"}
            title="game"
            allow="fullscreen; autoplay"
          />
        </div>
      </section>

      {/* 하단 저장 버튼 */}
      {locked && (
        <section className="flex gap-8 items-center mt-2">
          <div>
            현재 플레이타임: <b>{elapsed}s</b>
          </div>
          <button
            className="rounded px-4 py-2 border hover:bg-gray-100"
            onClick={() => submitPlaytime(false)}
          >
            플레이 종료/저장
          </button>
        </section>
      )}

      {/* 스타일 정의 */}
      <style jsx>{`
        .game-frame {
          width: 100%;
          max-width: 540px;       /* 세로 게임 프레임 폭 */
          aspect-ratio: 9 / 16;   /* 모바일 세로 비율 */
          background: transparent; /* 배경 투명 */
        }

        .game-frame iframe {
          width: 100%;
          height: 100%;
          border: none;
          display: block;
        }

        @media (min-width: 768px) and (orientation: landscape) {
          .game-frame {
            height: 90vh;
            aspect-ratio: 9 / 16;
          }
        }
      `}</style>
    </main>
  );
}
