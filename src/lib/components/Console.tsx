import { useEffect, useRef, useState } from "react";
import { setupGameListeners } from "../helpers/events";
import type { GameLogStream } from "../types";

interface LogLine {
  id: number;
  instanceName: string;
  stream: GameLogStream;
  line: string;
}

const MAX_LINES = 2000;

export default function GameConsole() {
  const [isOpen, setIsOpen] = useState(false);
  const [lines, setLines] = useState<LogLine[]>([]);
  const [runningInstance, setRunningInstance] = useState<string | null>(null);
  const nextId = useRef(0);
  const scrollRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    let isMounted = true;

    const cleanupPromise = setupGameListeners(
      (event) => {
        if (!isMounted) return;
        setRunningInstance(event.instance_name);
        setLines((prev) => {
          const next = [
            ...prev,
            {
              id: nextId.current++,
              instanceName: event.instance_name,
              stream: event.stream,
              line: event.line,
            },
          ];
          return next.length > MAX_LINES ? next.slice(next.length - MAX_LINES) : next;
        });
      },
      (event) => {
        if (!isMounted) return;
        setRunningInstance(null);
        setLines((prev) => [
          ...prev,
          {
            id: nextId.current++,
            instanceName: event.instance_name,
            stream: "stdout",
            line: `--- process exited with code ${event.code ?? "unknown"} ---`,
          },
        ]);
      },
    );

    return () => {
      isMounted = false;
      void cleanupPromise.then((cleanup) => cleanup());
    };
  }, []);

  useEffect(() => {
    if (!scrollRef.current) return;
    scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [lines, isOpen]);

  return (
    <div className="border-t border-border bg-card">
      <button
        type="button"
        onClick={() => setIsOpen((open) => !open)}
        className="flex w-full items-center justify-between px-3 py-1.5 text-xs text-muted-foreground hover:bg-secondary/50"
      >
        <span>
          console{runningInstance ? ` — running ${runningInstance}` : ""}
          {lines.length > 0 ? ` (${lines.length} lines)` : ""}
        </span>
        <span>{isOpen ? "hide ▲" : "show ▼"}</span>
      </button>

      {isOpen ? (
        <div
          ref={scrollRef}
          className="h-56 overflow-y-auto bg-black/90 px-3 py-2 font-mono text-[11px] leading-5"
        >
          {lines.length === 0 ? (
            <p className="text-muted-foreground">no output yet — launch an instance</p>
          ) : (
            lines.map((entry) => (
              <div
                key={entry.id}
                className={entry.stream === "stderr" ? "text-red-400" : "text-zinc-200"}
              >
                {entry.line}
              </div>
            ))
          )}
        </div>
      ) : null}
    </div>
  );
}
