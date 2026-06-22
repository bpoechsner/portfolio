"use client";

import { useState, useEffect, useRef } from "react";
import { usePathname } from "next/navigation";

type Mode = "idle" | "auth" | "editing" | "saving" | "publishing";

const PRESETS = [
  { id: "amber",  hex: "#f59e0b" },
  { id: "cyan",   hex: "#06b6d4" },
  { id: "violet", hex: "#8b5cf6" },
  { id: "green",  hex: "#22c55e" },
  { id: "rose",   hex: "#f43f5e" },
] as const;

// ── Array controls injected into the DOM in edit mode ─────────────────────

function injectArrayControls() {
  const groups = new Map<string, HTMLElement[]>();

  document.querySelectorAll<HTMLElement>("[data-editable][data-path]").forEach((el) => {
    const path = el.getAttribute("data-path")!;
    const parts = path.split(".");
    const last = parts[parts.length - 1];
    if (/^\d+$/.test(last)) {
      const parent = parts.slice(0, -1).join(".");
      if (!groups.has(parent)) groups.set(parent, []);
      groups.get(parent)!.push(el);
    }
  });

  groups.forEach((els, parentPath) => {
    els.forEach((el) => {
      const del = document.createElement("button");
      del.dataset.editInjected = "true";
      del.title = "Remove item";
      del.textContent = "×";
      del.style.cssText =
        "display:none;margin-left:4px;padding:0 4px;font-size:9px;font-family:monospace;" +
        "color:rgb(248,113,113);border:1px solid rgba(239,68,68,0.35);" +
        "background:rgba(239,68,68,0.08);cursor:pointer;vertical-align:middle;line-height:1.4;";

      del.onmousedown = (e) => {
        e.preventDefault();
        el.remove();
        del.remove();
      };

      el.addEventListener("mouseenter", () => (del.style.display = "inline-block"));
      el.addEventListener("mouseleave", () => {
        if (document.activeElement !== el) del.style.display = "none";
      });
      el.addEventListener("focus", () => (del.style.display = "inline-block"));
      el.addEventListener("blur", () => (del.style.display = "none"));

      el.insertAdjacentElement("afterend", del);
    });

    const lastEl = els[els.length - 1];
    const add = document.createElement("button");
    add.dataset.editInjected = "true";
    add.textContent = "+ add";
    add.style.cssText =
      "margin-left:6px;padding:1px 7px;font-size:9px;font-family:monospace;letter-spacing:.1em;" +
      "color:rgb(var(--accent-400));border:1px dashed rgb(var(--accent-500)/0.4);" +
      "background:transparent;cursor:pointer;vertical-align:middle;line-height:1.4;";

    add.onmousedown = (e) => {
      e.preventDefault();
      const existingPaths = Array.from(
        document.querySelectorAll<HTMLElement>(`[data-path^="${parentPath}."]`)
      )
        .map((n) => parseInt(n.getAttribute("data-path")!.split(".").pop()!))
        .filter((n) => !isNaN(n));
      const nextIdx = existingPaths.length ? Math.max(...existingPaths) + 1 : 0;

      const newEl = document.createElement("span");
      newEl.className = lastEl.className;
      newEl.setAttribute("data-editable", "true");
      newEl.setAttribute("data-path", `${parentPath}.${nextIdx}`);
      newEl.contentEditable = "true";
      newEl.textContent = "New item";

      add.insertAdjacentElement("beforebegin", newEl);

      const newDel = document.createElement("button");
      newDel.dataset.editInjected = "true";
      newDel.title = "Remove item";
      newDel.textContent = "×";
      newDel.style.cssText =
        "display:none;margin-left:4px;padding:0 4px;font-size:9px;font-family:monospace;" +
        "color:rgb(248,113,113);border:1px solid rgba(239,68,68,0.35);" +
        "background:rgba(239,68,68,0.08);cursor:pointer;vertical-align:middle;line-height:1.4;";
      newDel.onmousedown = (e) => { e.preventDefault(); newEl.remove(); newDel.remove(); };
      newEl.addEventListener("mouseenter", () => (newDel.style.display = "inline-block"));
      newEl.addEventListener("mouseleave", () => { if (document.activeElement !== newEl) newDel.style.display = "none"; });
      newEl.addEventListener("focus", () => (newDel.style.display = "inline-block"));
      newEl.addEventListener("blur", () => (newDel.style.display = "none"));
      newEl.insertAdjacentElement("afterend", newDel);

      newEl.focus();
      const range = document.createRange();
      range.selectNodeContents(newEl);
      window.getSelection()?.removeAllRanges();
      window.getSelection()?.addRange(range);
    };

    lastEl.insertAdjacentElement("afterend", add);
  });
}

function cleanupArrayControls() {
  document.querySelectorAll("[data-edit-injected]").forEach((el) => el.remove());
}

// ── Whole-entry add/remove for object arrays (projects, experience, etc.) ──

function escapeAttr(v: string) {
  return v.replace(/"/g, '\\"');
}

function reindexItem(container: HTMLElement, arrayPath: string, oldIndex: number, newIndex: number) {
  if (oldIndex === newIndex) return;
  container.setAttribute("data-array-index", String(newIndex));
  const prefix = `${arrayPath}.${oldIndex}.`;
  const nextPrefix = `${arrayPath}.${newIndex}.`;
  container.querySelectorAll<HTMLElement>("[data-path]").forEach((el) => {
    const p = el.getAttribute("data-path")!;
    if (p.startsWith(prefix)) {
      el.setAttribute("data-path", nextPrefix + p.slice(prefix.length));
    }
  });
}

function attachRemoveButton(item: HTMLElement, arrayPath: string) {
  if (item.querySelector('[data-role="remove-item"]')) return;
  if (getComputedStyle(item).position === "static") item.style.position = "relative";

  const del = document.createElement("button");
  del.dataset.editInjected = "true";
  del.dataset.role = "remove-item";
  del.title = "Remove this entry";
  del.textContent = "✕";
  del.style.cssText =
    "position:absolute;top:6px;right:6px;z-index:20;width:20px;height:20px;line-height:18px;" +
    "font-size:11px;font-family:monospace;color:rgb(248,113,113);border:1px solid rgba(239,68,68,0.4);" +
    "background:rgba(10,10,10,0.9);cursor:pointer;";

  del.onmousedown = (e) => {
    e.preventDefault();
    e.stopPropagation();
    const removedIndex = Number(item.getAttribute("data-array-index"));
    item.remove();
    const remaining = Array.from(
      document.querySelectorAll<HTMLElement>(`[data-array-item][data-array-path="${escapeAttr(arrayPath)}"]`)
    ).sort((a, b) => Number(a.dataset.arrayIndex) - Number(b.dataset.arrayIndex));
    remaining.forEach((r, idx) => {
      const oldIdx = Number(r.dataset.arrayIndex);
      if (oldIdx !== idx) reindexItem(r, arrayPath, oldIdx, idx);
    });
    void removedIndex;
  };

  item.appendChild(del);
}

function injectObjectArrayControls() {
  const groups = new Map<string, HTMLElement[]>();
  document.querySelectorAll<HTMLElement>("[data-array-item][data-array-path]").forEach((el) => {
    const p = el.getAttribute("data-array-path")!;
    if (!groups.has(p)) groups.set(p, []);
    groups.get(p)!.push(el);
  });

  groups.forEach((els, arrayPath) => {
    els.sort((a, b) => Number(a.dataset.arrayIndex) - Number(b.dataset.arrayIndex));
    els.forEach((el) => attachRemoveButton(el, arrayPath));

    const last = els[els.length - 1];
    if (!last || last.parentElement?.querySelector('[data-role="add-item"]')) return;

    const add = document.createElement("button");
    add.dataset.editInjected = "true";
    add.dataset.role = "add-item";
    add.title = "Duplicate the last entry — then edit the copy";
    add.textContent = "+ add entry";
    add.style.cssText =
      "display:block;margin:10px 0;padding:6px 12px;font-size:10px;font-family:monospace;letter-spacing:.1em;" +
      "color:rgb(var(--accent-400));border:1px dashed rgb(var(--accent-500)/0.4);" +
      "background:transparent;cursor:pointer;";

    add.onmousedown = (e) => {
      e.preventDefault();
      const current = Array.from(
        document.querySelectorAll<HTMLElement>(`[data-array-item][data-array-path="${escapeAttr(arrayPath)}"]`)
      ).sort((a, b) => Number(a.dataset.arrayIndex) - Number(b.dataset.arrayIndex));
      const template = current[current.length - 1];
      if (!template) return;
      const newIndex = current.length;

      const clone = template.cloneNode(true) as HTMLElement;
      clone.querySelectorAll("[data-edit-injected]").forEach((n) => n.remove());

      const oldIdx = Number(template.dataset.arrayIndex);
      reindexItem(clone, arrayPath, oldIdx, newIndex);

      const idField = template.getAttribute("data-id-field");
      if (idField) {
        const idPath = `${arrayPath}.${newIndex}.${idField}`;
        let idSpan = clone.querySelector<HTMLElement>(`[data-path="${escapeAttr(idPath)}"]`);
        if (!idSpan) {
          idSpan = document.createElement("span");
          idSpan.style.display = "none";
          idSpan.setAttribute("data-editable", "true");
          idSpan.setAttribute("data-path", idPath);
          clone.appendChild(idSpan);
        }
        idSpan.textContent = `item-${Date.now()}`;
      }

      clone.querySelectorAll<HTMLElement>("[data-editable]").forEach((n) => {
        n.contentEditable = "true";
      });

      template.insertAdjacentElement("afterend", clone);
      attachRemoveButton(clone, arrayPath);
      injectArrayControls();
    };

    last.insertAdjacentElement("afterend", add);
  });
}

// ── Boolean toggles (e.g. nav link visibility) ──────────────────────────────

function injectToggleControls() {
  document.querySelectorAll<HTMLButtonElement>("[data-toggle-target]").forEach((btn) => {
    if (btn.dataset.toggleBound) return;
    btn.dataset.toggleBound = "true";
    btn.addEventListener("click", (e) => {
      e.preventDefault();
      e.stopPropagation();
      const target = btn.getAttribute("data-toggle-target")!;
      const span = document.querySelector<HTMLElement>(`[data-editable][data-path="${escapeAttr(target)}"]`);
      if (!span) return;
      const next = span.textContent?.trim() !== "true";
      span.textContent = String(next);
      btn.setAttribute("data-on", String(next));
      const rowSelector = btn.getAttribute("data-toggle-row");
      if (rowSelector) {
        const row = btn.closest(rowSelector);
        row?.classList.toggle("cms-hidden", !next);
      }
    });
  });
}

// ── Cycling values (e.g. project status) ────────────────────────────────────

function injectCycleControls() {
  document.querySelectorAll<HTMLElement>("[data-cycle-target]").forEach((badge) => {
    if (badge.dataset.cycleBound) return;
    badge.dataset.cycleBound = "true";
    badge.style.cursor = "pointer";
    badge.addEventListener("click", (e) => {
      e.preventDefault();
      const target = badge.getAttribute("data-cycle-target")!;
      const values = (badge.getAttribute("data-cycle-values") ?? "").split("|").filter(Boolean);
      if (values.length === 0) return;
      const span = document.querySelector<HTMLElement>(`[data-editable][data-path="${escapeAttr(target)}"]`);
      const current = span?.textContent?.trim() ?? values[0];
      const idx = values.indexOf(current);
      const next = values[(idx + 1 + values.length) % values.length];
      if (span) span.textContent = next;
      badge.textContent = next.toUpperCase();
    });
  });
}

// ── Image upload (replaces pasting a URL) ───────────────────────────────────

function injectUploadControls() {
  document.querySelectorAll<HTMLButtonElement>("[data-upload-target]").forEach((btn) => {
    if (btn.dataset.uploadBound) return;
    btn.dataset.uploadBound = "true";

    const input = document.createElement("input");
    input.type = "file";
    input.accept = "image/*";
    input.style.display = "none";
    input.dataset.editInjected = "true";
    btn.insertAdjacentElement("afterend", input);

    btn.addEventListener("click", (e) => {
      e.preventDefault();
      input.click();
    });

    input.addEventListener("change", async () => {
      const file = input.files?.[0];
      if (!file) return;
      const originalLabel = btn.textContent;
      btn.textContent = "Uploading…";
      try {
        const fd = new FormData();
        fd.append("file", file);
        const res = await fetch("/api/upload-image", {
          method: "POST",
          headers: { "x-edit-token": sessionStorage.getItem("editToken") ?? "" },
          body: fd,
        });
        const data = (await res.json()) as { ok?: boolean; url?: string };
        if (res.ok && data.url) {
          const target = btn.getAttribute("data-upload-target")!;
          const span = document.querySelector<HTMLElement>(`[data-editable][data-path="${escapeAttr(target)}"]`);
          if (span) span.textContent = data.url;
          const scope = btn.closest<HTMLElement>("[data-array-item]") ?? btn.closest<HTMLElement>(".project-cover-block") ?? document.body;
          const img = scope.querySelector<HTMLImageElement>("img");
          if (img) img.src = data.url;
          btn.textContent = originalLabel;
        } else {
          btn.textContent = "Upload failed";
        }
      } catch {
        btn.textContent = "Upload failed";
      }
      input.value = "";
    });
  });
}

// ── Collect edits from DOM ─────────────────────────────────────────────────

function collectEdits(): { scalars: Record<string, string>; arrays: Record<string, string[]> } {
  const scalars: Record<string, string> = {};
  const arrayItems = new Map<string, string[]>();

  document.querySelectorAll<HTMLElement>("[data-editable][data-path]").forEach((el) => {
    const path = el.getAttribute("data-path")!;
    const parts = path.split(".");
    const last = parts[parts.length - 1];

    if (/^\d+$/.test(last)) {
      const parent = parts.slice(0, -1).join(".");
      if (!arrayItems.has(parent)) arrayItems.set(parent, []);
      const val = el.innerText.trim();
      if (val) arrayItems.get(parent)!.push(val);
    } else {
      scalars[path] = el.innerText.trim();
    }
  });

  const arrays: Record<string, string[]> = {};
  arrayItems.forEach((vals, parent) => { arrays[parent] = vals; });

  return { scalars, arrays };
}

function collectArrayLengths(): Record<string, number> {
  const counts: Record<string, number> = {};
  document.querySelectorAll<HTMLElement>("[data-array-item][data-array-path]").forEach((el) => {
    const p = el.getAttribute("data-array-path")!;
    counts[p] = (counts[p] ?? 0) + 1;
  });
  return counts;
}

// ── 3D model upload (replaces pasting a download URL) ───────────────────────

function injectModelUploadControls() {
  document.querySelectorAll<HTMLButtonElement>("[data-model-upload-target]").forEach((btn) => {
    if (btn.dataset.uploadBound) return;
    btn.dataset.uploadBound = "true";

    const input = document.createElement("input");
    input.type = "file";
    input.accept = ".stl,.glb,.gltf,.3mf,.obj";
    input.style.display = "none";
    input.dataset.editInjected = "true";
    btn.insertAdjacentElement("afterend", input);

    btn.addEventListener("click", (e) => {
      e.preventDefault();
      input.click();
    });

    input.addEventListener("change", async () => {
      const file = input.files?.[0];
      if (!file) return;
      const originalLabel = btn.textContent;
      btn.textContent = "Uploading…";
      try {
        const fd = new FormData();
        fd.append("file", file);
        const res = await fetch("/api/upload-model", {
          method: "POST",
          headers: { "x-edit-token": sessionStorage.getItem("editToken") ?? "" },
          body: fd,
        });
        const data = (await res.json()) as { ok?: boolean; url?: string; format?: string; error?: string };
        if (res.ok && data.url && data.format) {
          const urlTarget = btn.getAttribute("data-model-upload-target")!;
          const formatTarget = btn.getAttribute("data-model-upload-format-target");
          const urlSpan = document.querySelector<HTMLElement>(`[data-editable][data-path="${escapeAttr(urlTarget)}"]`);
          if (urlSpan) urlSpan.textContent = data.url;
          if (formatTarget) {
            const formatSpan = document.querySelector<HTMLElement>(`[data-editable][data-path="${escapeAttr(formatTarget)}"]`);
            if (formatSpan) formatSpan.textContent = data.format;
          }
          const itemId = btn.getAttribute("data-model-upload-item");
          if (itemId) {
            const preview = document.querySelector(`[data-model-item="${escapeAttr(itemId)}"]`);
            preview?.dispatchEvent(
              new CustomEvent("model-src-changed", { detail: { url: data.url, format: data.format } })
            );
          }
          btn.textContent = originalLabel;
        } else {
          btn.textContent = data.error ?? "Upload failed";
        }
      } catch {
        btn.textContent = "Upload failed";
      }
      input.value = "";
    });
  });
}

// ── Component ──────────────────────────────────────────────────────────────

export default function EditToolbar() {
  const [mode, setMode] = useState<Mode>("idle");
  const [password, setPassword] = useState("");
  const [authError, setAuthError] = useState("");
  const [status, setStatus] = useState<{ text: string; ok: boolean } | null>(null);
  const [theme, setTheme] = useState("amber");
  const [columns, setColumns] = useState(3);
  const inputRef = useRef<HTMLInputElement>(null);
  const pathname = usePathname();

  const isActive = mode === "editing" || mode === "saving" || mode === "publishing";

  useEffect(() => {
    document.body.classList.toggle("edit-mode", isActive);

    if (mode === "editing") {
      // Read current theme + columns from DOM (set by ThemeApplier)
      setTheme(document.documentElement.getAttribute("data-theme") ?? "amber");
      setColumns(Number(document.documentElement.getAttribute("data-columns") ?? "3") || 3);

      document.querySelectorAll<HTMLElement>("[data-editable]").forEach((el) => {
        el.contentEditable = "true";
      });
      injectArrayControls();
      injectObjectArrayControls();
      injectToggleControls();
      injectCycleControls();
      injectUploadControls();
      injectModelUploadControls();
    }
    if (mode === "idle") {
      cleanupArrayControls();
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

  // E key shortcut to open edit mode
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (mode !== "idle") return;
      const tag = (e.target as HTMLElement).tagName;
      if (["INPUT", "TEXTAREA", "SELECT"].includes(tag)) return;
      if ((e.target as HTMLElement).isContentEditable) return;
      if (e.key === "e" || e.key === "E") setMode("auth");
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [mode]);

  const applyTheme = (preset: string) => {
    setTheme(preset);
    document.documentElement.setAttribute("data-theme", preset);
  };

  const applyColumns = (n: number) => {
    setColumns(n);
    document.documentElement.setAttribute("data-columns", String(n));
  };

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

  const token = () => sessionStorage.getItem("editToken") ?? "";

  const handleSave = async () => {
    setStatus(null);
    setMode("saving");
    try {
      const { scalars, arrays } = collectEdits();
      // Include theme settings in the save
      scalars["theme.accent"] = theme;
      scalars["theme.projectColumns"] = String(columns);
      const arrayLengths = collectArrayLengths();

      const res = await fetch("/api/save-content", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-edit-token": token(),
        },
        body: JSON.stringify({ scalars, arrays, arrayLengths }),
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
    cleanupArrayControls();
    sessionStorage.removeItem("editToken");
    setMode("idle");
    setStatus(null);
  };

  const busy = mode === "saving" || mode === "publishing";

  return (
    <>
      {/* ── Pencil trigger ─────────────────────────────────────────── */}
      {mode === "idle" && (
        <button
          onClick={() => setMode("auth")}
          title="Edit content"
          className="fixed bottom-6 right-6 z-[100] w-10 h-10 bg-neutral-950 border border-neutral-800 hover:border-accent-500/60 text-neutral-600 hover:text-accent-400 flex items-center justify-center transition-colors shadow-lg"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
              d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
          </svg>
        </button>
      )}

      {/* ── Password modal ──────────────────────────────────────────── */}
      {mode === "auth" && (
        <div className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-neutral-950 border border-neutral-800 p-8 w-full max-w-sm shadow-2xl">
            <div className="flex items-center gap-2 mb-5">
              <div className="h-px w-6 bg-accent-500" />
              <span className="font-mono text-[11px] text-accent-400 tracking-widest">EDIT MODE</span>
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
              className="w-full bg-[#111] border border-neutral-800 focus:border-accent-500 text-neutral-100 font-mono text-sm px-4 py-3 outline-none transition-colors"
              placeholder="Password"
            />
            {authError && <p className="font-mono text-xs text-red-400 mt-2">{authError}</p>}
            <div className="flex gap-3 mt-5">
              <button
                onClick={authenticate}
                className="flex-1 bg-accent-500 hover:bg-accent-400 text-neutral-950 font-mono text-xs font-bold tracking-widest py-2.5 transition-colors"
              >
                UNLOCK
              </button>
              <button
                onClick={() => { setMode("idle"); setPassword(""); setAuthError(""); }}
                className="px-5 border border-neutral-800 hover:border-neutral-600 text-neutral-600 hover:text-neutral-300 font-mono text-xs transition-colors"
              >
                CANCEL
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Active toolbar ──────────────────────────────────────────── */}
      {isActive && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[100] flex items-center gap-3 bg-neutral-950 border border-accent-500/25 px-5 py-3 shadow-2xl whitespace-nowrap">
          {/* Status indicator */}
          <div className="flex items-center gap-1.5 shrink-0">
            <span className="w-1.5 h-1.5 rounded-full bg-accent-500 animate-pulse" />
            <span className="font-mono text-[10px] text-accent-400 tracking-widest">EDITING</span>
          </div>

          <div className="w-px h-5 bg-neutral-800 shrink-0" />

          {/* Color presets */}
          <div className="flex items-center gap-1.5 shrink-0">
            {PRESETS.map((p) => (
              <button
                key={p.id}
                title={p.id}
                onClick={() => applyTheme(p.id)}
                style={{ background: p.hex }}
                className={`w-4 h-4 rounded-full transition-all ${
                  theme === p.id
                    ? "ring-2 ring-white/50 ring-offset-1 ring-offset-neutral-950 scale-110"
                    : "opacity-50 hover:opacity-100"
                }`}
              />
            ))}
          </div>

          <div className="w-px h-5 bg-neutral-800 shrink-0" />

          {/* Project columns toggle */}
          <div className="flex items-center gap-1 shrink-0">
            <span className="font-mono text-[9px] text-neutral-700 tracking-widest mr-1">COLS</span>
            {[2, 3].map((n) => (
              <button
                key={n}
                onClick={() => applyColumns(n)}
                className={`font-mono text-[10px] w-6 h-5 transition-colors ${
                  columns === n
                    ? "bg-accent-500/20 text-accent-400 border border-accent-500/40"
                    : "text-neutral-600 hover:text-neutral-400 border border-neutral-800"
                }`}
              >
                {n}
              </button>
            ))}
          </div>

          <div className="w-px h-5 bg-neutral-800 shrink-0" />

          {status && (
            <span className={`font-mono text-[10px] tracking-wide border px-2 py-0.5 ${
              status.ok ? "text-green-400 border-green-500/30" : "text-red-400 border-red-500/30"
            }`}>
              {status.text}
            </span>
          )}

          <div className="flex gap-2">
            <button
              onClick={handleSave}
              disabled={busy}
              className="flex items-center gap-1.5 bg-accent-500 hover:bg-accent-400 disabled:bg-neutral-800 disabled:text-neutral-600 text-neutral-950 font-mono text-[11px] font-bold tracking-widest px-4 py-2 transition-colors"
            >
              {mode === "saving" ? <><Spinner /> SAVING</> : "SAVE"}
            </button>

            <button
              onClick={handlePublish}
              disabled={busy}
              className="flex items-center gap-1.5 border border-neutral-700 hover:border-accent-500/60 disabled:border-neutral-800 text-neutral-400 hover:text-accent-400 disabled:text-neutral-700 font-mono text-[11px] tracking-widest px-4 py-2 transition-colors"
            >
              {mode === "publishing" ? (
                <><Spinner /> PUSHING</>
              ) : (
                <>
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                      d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                  </svg>
                  PUBLISH
                </>
              )}
            </button>

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
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
    </svg>
  );
}
