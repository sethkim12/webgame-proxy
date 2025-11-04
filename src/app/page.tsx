"use client";
import { useEffect, useRef, useState } from "react";

export default function Page() {
  const [userId, setUserId] = useState("");
  const [locked, setLocked] = useState(false);
  const [startedAt, setStartedAt] = useState<number | null>(null);
  const [elapsed, setElapsed] = useState(0);
  const [clicks, setClicks] = useState(0);

  const timerRef = useRef<number | null>(null);
  const iframeRef = useRef<HTMLIFrameElement | null>(null);

  // 게임 시작 후 경과시간 타이머
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [startedAt]);

  // iframe 내부(동일 출처일 때) 클릭도 카운트
  useEffect(() => {
    if (!locked) return;
    const el = iframeRef.current;
    if (!el) return;

    const attach = () => {
      try {
        const doc =
          el.contentDocument || el.contentWindow?.document;
        if (!doc) return;
        const handler = () => setClicks((c) => c + 1);
        doc.addEventListener("pointerdown", handler, { capture: true });
        // 정리
        const cleanup = () => doc.removeEventListener("pointerdown", handler, true);
        // iframe이 다른 페이지로 바뀌면 다시 붙이도록
        el.addEventListener("load", attach);
        return () => {
          cleanup();
          el.removeEventListener("load", attach);
        };
      } catch {
        // 교차 출처면 접근 불가: 그냥 무시(부모 영역 클릭만 집계)
      }
    };

    // 최초 load 혹은 이미 로드된 경우 처리
    const cleanup = attach();
    return () => {
      cleanup && cleanup();
    };
  }, [locked]);

  const startGame = () => {
    if (!userId.trim()) return alert("아이디를 입력하세요.");
    setLocked(true);
    setStartedAt(Date.now());
    setClicks(0); // 시작 시 초기화
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
          clicks,               // ← 클릭수 전송
          game: "unity-webgl",
        }),
      });
      if (!isUnload) alert(`저장 완료: ${playSeconds}s, 클릭 ${clicks}회`);
    } catch {
      if (!isUnload) alert("저장 실패");
    }
  };

  // 부모 컨테이너(placeholder/프레임) 클릭도 집계
  const handleContainerClick = () => setClicks((c) => c + 1);

  return (
    <main className="min-h-screen p-6 flex flex-col gap-4 items-center bg-white text-black">
      {/* 입력/컨트롤 영역 */}
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
          <div className="flex flex-col gap-2">
            <div className="text-sm text-gray-600">
              시작됨 · 경과 {elapsed}s · 클릭 {clicks}회
            </div>
            <button
              className="rounded px-4 py-2 border hover:bg-gray-100"
              onClick={() => submitPlaytime(false)}
            >
              플레이 종료/저장
            </button>
          </div>
        )}
      </section>

      {/* 게임 프레임 */}
      <section className="flex justify-center items-center w-full">
        <div
          className="relative w-full max-w-[540px] border rounded overflow-hidden shadow-md flex justify-center items-center"
          style={{ aspectRatio: "9 / 16", background: "#f5f7fb" }}
          onPointerDown={handleContainerClick}
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
                4. 게임이 끝난 후 반드시 <b>종료</b> 버튼을 눌러주세요.
              </p>
              <p className="mt-1 text-xs text-gray-500">
                세로 9:16 화면에 맞춰 표시됩니다.
              </p>
            </div>
          )}
        </div>
      </section>
    </main>
  );
}
