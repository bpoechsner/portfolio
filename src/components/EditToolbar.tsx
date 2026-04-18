"use client";

import { useState, useEffect, useRef } from "react";
import { usePathname } from "next/navigation";

type Mode = "idle" | "auth" | "editing" | "saving" | "publishing";

export default function EditToolbar() {
  const [mode, setMode] = useState<Mode>("idle");
  const [password, setPassword] = useState("");
  const [authError, setAuthError] = useState("");
  const [status, setStatus] = useState<{ text: string; ok: boolean } | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const pathname = usePathname();

  const isActive = mode === "editing" || mode === "saving" || mode === "publishing";

  // Toggle edit-mode body class + apply/remove contentEditable on data-editable elements.
  // Re-runs on pathname change so navigating while editing keeps elements editable.
  useEffect(() => {
    document.body.classList.toggle("edit-mode", isActive);

    if (mode === "editing") {
      document.querySelectorAll<HTMLElement>("[data-editable]").forEach((el) => {
        el.contentEditable = "true";
      });
    }
    if (mode === "idle") {
      document.querySelectorAll<HTMLElement>("[data-editable]").forEach((el) => {
        el.contentEditable = "false";
      });
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode, pathname]);

  useEffect(() => {
    if (mode === "auth") {
      const t = setTimeout(() => inputRef.current?.focus(), 60);
      return () => clearTimeout(t);
    }
  }, [mode]);

  const authenticate = async () => {
    const res = await fetch("/api/auth", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ password }),
    });
    if (res.ok) {
      sessionStorage.setItem("editToken", password);
      setPassword("");
      setAuthError("");
      setMode("editing");
    } else {
      setAuthError("Wrong password.");
    }
  };

  const collectEdits = (): Record<string, string> => {
    const edits: Record<string, string> = {};
    document.querySelectorAll<HTMLElement>("[data-editable][data-path]").forEach((el) => {
      const p = el.getAttribute("data-path");
      if (p) edits[p] = el.innerText.trim();
    });
    return edits;
  };

  const token = () => sessionStorage.getItem("editToken") ?? "";

  const handleSave = async () => {
    setStatus(null);
    setMode("saving");
    try {
      const res = await fetch("/api/save-content", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-edit-token": token(),
        },
        body: JSON.stringify({ edits: collectEdits() }),
      });
      setStatus(res.ok ? { text: "Saved ✓", ok: true } : { text: "Save failed", ok: false });
    } catch {
      setStatus({ text: "Network error", ok: false });
    }
    setMode("editing");
  };

  const handlePublish = async () => {
    setStatus({ text: "Pushing to GitHub…", ok: true });
    setMode("publishing");
    try {
      const res = await fetch("/api/publish", {
        method: "POST",
        headers: { "x-edit-token": token() },
      });
      const data = (await res.json()) as { ok?: boolean; error?: string };
      setStatus(
        res.ok
          ? { text: "Pushed — Vercel deploying ✓", ok: true }
          : { text: `Git error: ${data.error ?? "unknown"}`, ok: false }
      );
    } catch {
      setStatus({ text: "Network error", ok: false });
    }
    setMode("editing");
  };

  const handleExit = () => {
    sessionStorage.removeItem("editToken");
    setMode("idle");
    setStatus(null);
  };

  const busy = mode === "saving" || mode === "publishing";

  return (
    <>
      {/* ── Pencil trigger (idle only) ────────────────────────────────── */}
      {mode === "idle" && (
        <button
          onClick={() => setMode("auth")}
          title="Edit content"
          className="fixed bottom-6 right-6 z-[100] w-10 h-10 bg-neutral-950 border border-neutral-800 hover:border-amber-500/60 text-neutral-600 hover:text-amber-400 flex items-center justify-center transition-colors shadow-lg"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
            />
          </svg>
        </button>
      )}

      {/* ── Password modal ────────────────────────────────────────────── */}
      {mode === "auth" && (
        <div className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-neutral-950 border border-neutral-800 p-8 w-full max-w-sm shadow-2xl">
            <div className="flex items-center gap-2 mb-5">
              <div className="h-px w-6 bg-amber-500" />
              <span className="font-mono text-[11px] text-amber-400 tracking-widest">
                EDIT MODE
              </span>
            </div>
            <p className="font-mono text-sm text-neutral-500 mb-6">
              Enter password to unlock inline editing.
            </p>

            <input
              ref={inputRef}
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && authenticate()}
              className="w-full bg-[#111] border border-neutral-800 focus:border-amber-500 text-neutral-100 font-mono text-sm px-4 py-3 outline-none transition-colors"
              placeholder="Password"
            />

            {authError && (
              <p className="font-mono text-xs text-red-400 mt-2">{authError}</p>
            )}

            <div className="flex gap-3 mt-5">
              <button
                onClick={authenticate}
                className="flex-1 bg-amber-500 hover:bg-amber-400 text-neutral-950 font-mono text-xs font-bold tracking-widest py-2.5 transition-colors"
              >
                UNLOCK
              </button>
              <button
                onClick={() => {
                  setMode("idle");
                  setPassword("");
                  setAuthError("");
                }}
                className="px-5 border border-neutral-800 hover:border-neutral-600 text-neutral-600 hover:text-neutral-300 font-mono text-xs transition-colors"
              >
                CANCEL
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Active editing toolbar ────────────────────────────────────── */}
      {isActive && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[100] flex items-center gap-3 bg-neutral-950 border border-amber-500/25 px-5 py-3 shadow-2xl whitespace-nowrap">
          {/* Pulse indicator */}
          <div className="flex items-center gap-1.5 mr-1 shrink-0">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
            <span className="font-mono text-[10px] text-amber-400 tracking-widest">EDITING</span>
          </div>

          {/* Status message */}
          {status && (
            <span
              className={`font-mono text-[10px] tracking-wide border px-2 py-0.5 ${
                status.ok
                  ? "text-green-400 border-green-500/30"
                  : "text-red-400 border-red-500/30"
              }`}
            >
              {status.text}
            </span>
          )}

          <div className="flex gap-2">
            {/* Save */}
            <button
              onClick={handleSave}
              disabled={busy}
              className="flex items-center gap-1.5 bg-amber-500 hover:bg-amber-400 disabled:bg-neutral-800 disabled:text-neutral-600 text-neutral-950 font-mono text-[11px] font-bold tracking-widest px-4 py-2 transition-colors"
            >
              {mode === "saving" ? <><Spinner /> SAVING</> : "SAVE"}
            </button>

            {/* Publish */}
            <button
              onClick={handlePublish}
              disabled={busy}
              className="flex items-center gap-1.5 border border-neutral-700 hover:border-amber-500/60 disabled:border-neutral-800 text-neutral-400 hover:text-amber-400 disabled:text-neutral-700 font-mono text-[11px] tracking-widest px-4 py-2 transition-colors"
            >
              {mode === "publishing" ? (
                <><Spinner /> PUSHING</>
              ) : (
                <>
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                    />
                  </svg>
                  PUBLISH
                </>
              )}
            </button>

            {/* Exit */}
            <button
              onClick={handleExit}
              disabled={busy}
              title="Exit edit mode"
              className="border border-neutral-800 hover:border-red-500/40 text-neutral-700 hover:text-red-400 disabled:opacity-40 font-mono text-[11px] px-3 py-2 transition-colors"
            >
              ✕
            </button>
          </div>
        </div>
      )}
    </>
  );
}

function Spinner() {
  return (
    <svg className="w-3 h-3 animate-spin shrink-0" fill="none" viewBox="0 0 24 24">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path
        className="opacity-75"
        fill="currentColor"
        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
      />
    </svg>
  );
}
