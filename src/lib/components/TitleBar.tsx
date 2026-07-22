import { useEffect, useState } from "react";
import { getCurrentWindow } from "@tauri-apps/api/window";

const appWindow = getCurrentWindow();

export default function TitleBar() {
  const [isMaximized, setIsMaximized] = useState(false);

  useEffect(() => {
    let unlisten: (() => void) | undefined;

    void appWindow.isMaximized().then(setIsMaximized);

    void appWindow
      .onResized(() => {
        void appWindow.isMaximized().then(setIsMaximized);
      })
      .then((fn) => {
        unlisten = fn;
      });

    return () => {
      unlisten?.();
    };
  }, []);

  return (
    <div
      data-tauri-drag-region
      className="flex h-9 select-none items-center justify-between border-b border-border bg-card px-3 text-sm text-foreground"
    >
      <div data-tauri-drag-region className="flex items-center gap-2">
        <img src="/app-icon.png" alt="" className="h-4 w-4" draggable={false} />
        <span className="text-xs font-medium text-muted-foreground">Crystal Launcher </span>
      </div>

      <div className="flex items-center gap-1">
        <button
          type="button"
          aria-label="Minimize"
          onClick={() => void appWindow.minimize()}
          className="flex h-7 w-9 items-center justify-center rounded hover:bg-secondary"
        >
          <svg width="10" height="10" viewBox="0 0 10 10">
            <rect width="10" height="1" y="4.5" fill="currentColor" />
          </svg>
        </button>
        <button
          type="button"
          aria-label={isMaximized ? "Restore" : "Maximize"}
          onClick={() => void appWindow.toggleMaximize()}
          className="flex h-7 w-9 items-center justify-center rounded hover:bg-secondary"
        >
          {isMaximized ? (
            <svg width="10" height="10" viewBox="0 0 10 10">
              <rect
                x="2"
                y="0.5"
                width="7.5"
                height="7.5"
                fill="none"
                stroke="currentColor"
              />
              <rect
                x="0.5"
                y="2"
                width="7.5"
                height="7.5"
                fill="var(--card)"
                stroke="currentColor"
              />
            </svg>
          ) : (
            <svg width="10" height="10" viewBox="0 0 10 10">
              <rect x="0.5" y="0.5" width="9" height="9" fill="none" stroke="currentColor" />
            </svg>
          )}
        </button>
        <button
          type="button"
          aria-label="Close"
          onClick={() => void appWindow.close()}
          className="flex h-7 w-9 items-center justify-center rounded hover:bg-red-600 hover:text-white"
        >
          <svg width="10" height="10" viewBox="0 0 10 10">
            <line x1="0" y1="0" x2="10" y2="10" stroke="currentColor" />
            <line x1="10" y1="0" x2="0" y2="10" stroke="currentColor" />
          </svg>
        </button>
      </div>
    </div>
  );
}
