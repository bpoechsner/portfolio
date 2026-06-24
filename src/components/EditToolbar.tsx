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
    const folderGrid = item.closest<HTMLElement>("[data-folder-grid]");
    item.remove();
    if (folderGrid) updateFolderCount(folderGrid);
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

// Walks up from `item` to find the direct child of `container` that
// contains it — i.e. the actual node to relocate when reordering, even if
// the array-item itself is nested inside another wrapper (e.g. FadeIn).
function getTopLevelWrapper(item: HTMLElement, container: HTMLElement): HTMLElement {
  let node = item;
  while (node.parentElement && node.parentElement !== container) {
    node = node.parentElement;
  }
  return node;
}

function swapArrayItems(a: HTMLElement, b: HTMLElement, arrayPath: string, container: HTMLElement) {
  const idxA = Number(a.dataset.arrayIndex);
  const idxB = Number(b.dataset.arrayIndex);
  reindexItem(a, arrayPath, idxA, idxB);
  reindexItem(b, arrayPath, idxB, idxA);

  const wrapA = getTopLevelWrapper(a, container);
  const wrapB = getTopLevelWrapper(b, container);
  if (wrapA === wrapB || !wrapA.parentNode || !wrapB.parentNode) return;
  const marker = document.createComment("swap-marker");
  wrapA.parentNode.insertBefore(marker, wrapA);
  wrapB.parentNode.insertBefore(wrapA, wrapB);
  marker.parentNode!.insertBefore(wrapB, marker);
  marker.remove();
}

function attachMoveButtons(item: HTMLElement, arrayPath: string, container: HTMLElement) {
  if (item.querySelector('[data-role="move-up"]')) return;
  if (getComputedStyle(item).position === "static") item.style.position = "relative";

  const makeBtn = (role: string, label: string, title: string, rightOffset: number) => {
    const btn = document.createElement("button");
    btn.dataset.editInjected = "true";
    btn.dataset.role = role;
    btn.title = title;
    btn.textContent = label;
    btn.style.cssText =
      `position:absolute;top:6px;right:${rightOffset}px;z-index:20;width:20px;height:20px;line-height:18px;` +
      "font-size:11px;font-family:monospace;color:rgb(var(--accent-400));border:1px solid rgb(var(--accent-500)/0.4);" +
      "background:rgba(10,10,10,0.9);cursor:pointer;";
    return btn;
  };

  const currentSorted = () =>
    Array.from(
      document.querySelectorAll<HTMLElement>(`[data-array-item][data-array-path="${escapeAttr(arrayPath)}"]`)
    ).sort((a, b) => Number(a.dataset.arrayIndex) - Number(b.dataset.arrayIndex));

  const up = makeBtn("move-up", "↑", "Move up", 54);
  up.onmousedown = (e) => {
    e.preventDefault();
    e.stopPropagation();
    const current = currentSorted();
    const idx = current.indexOf(item);
    if (idx <= 0) return;
    swapArrayItems(item, current[idx - 1], arrayPath, container);
  };

  const down = makeBtn("move-down", "↓", "Move down", 30);
  down.onmousedown = (e) => {
    e.preventDefault();
    e.stopPropagation();
    const current = currentSorted();
    const idx = current.indexOf(item);
    if (idx === -1 || idx >= current.length - 1) return;
    swapArrayItems(item, current[idx + 1], arrayPath, container);
  };

  item.appendChild(up);
  item.appendChild(down);
}

// Finds the lowest common ancestor of every item in the group. Items are
// sometimes nested inside other wrappers (e.g. FadeIn's animation div), so
// inserting the "+ add" button as a sibling of the last item can bury it
// inside a wrapper that's still mid-animation (opacity:0) or, in a CSS grid,
// stretch it to fill an entire (huge) auto-sized row. Appending it to the
// shared container instead makes it a normal, always-visible grid/flex item.
function findCommonContainer(items: HTMLElement[]): HTMLElement {
  let common: HTMLElement = items[0].parentElement ?? document.body;
  for (const item of items) {
    while (!common.contains(item)) {
      common = common.parentElement ?? document.body;
    }
  }
  return common;
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
    const container = findCommonContainer(els);
    els.forEach((el) => {
      attachRemoveButton(el, arrayPath);
      attachMoveButtons(el, arrayPath, container);
    });

    const last = els[els.length - 1];
    if (!last) return;
    if (container.querySelector(`[data-role="add-item"][data-for-path="${escapeAttr(arrayPath)}"]`)) return;

    const add = document.createElement("button");
    add.dataset.editInjected = "true";
    add.dataset.role = "add-item";
    add.dataset.forPath = arrayPath;
    add.title = "Duplicate the last entry — then edit the copy";
    add.textContent = "+ add entry";
    add.style.cssText =
      "display:block;align-self:start;justify-self:start;height:fit-content;width:fit-content;flex-shrink:0;" +
      "margin:10px 0;padding:6px 12px;font-size:10px;font-family:monospace;letter-spacing:.1em;" +
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
      // cloneNode copies "already bound" markers but not the actual
      // listeners, so these need to be re-attached fresh below.
      clone.querySelectorAll<HTMLElement>("[data-placeholder-bound]").forEach((n) => {
        delete n.dataset.placeholderBound;
      });
      clone.querySelectorAll<HTMLElement>("[data-folder-move-bound]").forEach((n) => {
        delete n.dataset.folderMoveBound;
      });
      clone.querySelectorAll<HTMLElement>("[data-upload-bound]").forEach((n) => {
        delete n.dataset.uploadBound;
      });

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

      // If the duplicated entry belongs to a folder (3D files), keep the
      // copy in that same folder's grid instead of dropping it outside
      // every folder.
      const templateFolderGrid = template.closest<HTMLElement>("[data-folder-grid]");
      if (templateFolderGrid) {
        templateFolderGrid.appendChild(clone);
        updateFolderCount(templateFolderGrid);
      } else {
        add.insertAdjacentElement("beforebegin", clone);
      }
      attachRemoveButton(clone, arrayPath);
      attachMoveButtons(clone, arrayPath, container);
      injectArrayControls();
      injectPlaceholderTracking();
      injectFolderMoveControls();
      injectUploadControls();
      injectModelUploadControls();
      injectResumeUploadControls();
    };

    container.appendChild(add);
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
          if (span) {
            span.textContent = data.url;
            span.removeAttribute("data-placeholder");
          }
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

// ── Folders (3D files) ───────────────────────────────────────────────────

function updateFolderCount(grid: HTMLElement) {
  const details = grid.closest("details");
  const countEl = details?.querySelector("summary span:last-child");
  if (countEl) countEl.textContent = `(${grid.querySelectorAll("[data-array-item]").length})`;
}

function buildFolderSection(name: string): HTMLElement {
  const details = document.createElement("details");
  details.open = true;
  details.className = "mb-8 group/folder";

  const summary = document.createElement("summary");
  summary.className =
    "flex items-center gap-2 mb-4 cursor-pointer select-none list-none [&::-webkit-details-marker]:hidden";

  const chevron = document.createElementNS("http://www.w3.org/2000/svg", "svg");
  chevron.setAttribute("class", "w-4 h-4 text-amber-500/70 shrink-0 transition-transform group-open/folder:rotate-90");
  chevron.setAttribute("fill", "none");
  chevron.setAttribute("stroke", "currentColor");
  chevron.setAttribute("viewBox", "0 0 24 24");
  chevron.setAttribute("stroke-width", "1.5");
  chevron.innerHTML = '<path stroke-linecap="round" stroke-linejoin="round" d="M9 5l7 7-7 7" />';

  const folderIcon = document.createElementNS("http://www.w3.org/2000/svg", "svg");
  folderIcon.setAttribute("class", "w-4 h-4 text-amber-500/70 shrink-0");
  folderIcon.setAttribute("fill", "currentColor");
  folderIcon.setAttribute("viewBox", "0 0 24 24");
  folderIcon.innerHTML = '<path d="M10 4H4c-1.11 0-2 .89-2 2v12a2 2 0 002 2h16a2 2 0 002-2V8a2 2 0 00-2-2h-8l-2-2z" />';

  const nameSpan = document.createElement("span");
  nameSpan.className = "font-mono text-sm font-bold text-neutral-300 tracking-wide";
  nameSpan.textContent = name;

  const countSpan = document.createElement("span");
  countSpan.className = "font-mono text-[11px] text-neutral-700";
  countSpan.textContent = "(0)";

  summary.append(chevron, folderIcon, nameSpan, countSpan);

  const grid = document.createElement("div");
  grid.className = "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4";
  grid.setAttribute("data-folder-grid", name);

  details.append(summary, grid);
  return details;
}

function injectFolderMoveControls() {
  document.querySelectorAll<HTMLSelectElement>("[data-folder-move-target]").forEach((sel) => {
    if (sel.dataset.folderMoveBound) return;
    sel.dataset.folderMoveBound = "true";
    sel.addEventListener("change", () => {
      const target = sel.getAttribute("data-folder-move-target")!;
      const span = document.querySelector<HTMLElement>(`[data-editable][data-path="${escapeAttr(target)}"]`);
      if (span) span.textContent = sel.value;

      const card = sel.closest<HTMLElement>("[data-array-item]");
      if (!card) return;
      const display = card.querySelector<HTMLElement>("[data-project-display]");
      if (display) display.textContent = sel.value || "Ungrouped";

      const oldGrid = card.closest<HTMLElement>("[data-folder-grid]");
      let targetGrid = document.querySelector<HTMLElement>(
        `[data-folder-grid="${escapeAttr(sel.value)}"]`
      );
      if (!targetGrid) {
        const section = buildFolderSection(sel.value);
        document.querySelector('[data-folders-container]')?.appendChild(section);
        targetGrid = section.querySelector<HTMLElement>("[data-folder-grid]");
      }
      if (targetGrid && targetGrid !== oldGrid) {
        targetGrid.appendChild(card);
        updateFolderCount(targetGrid);
        if (oldGrid) updateFolderCount(oldGrid);
      }
    });
  });
}

function injectCreateFolderControls() {
  document.querySelectorAll<HTMLButtonElement>("[data-create-folder]").forEach((btn) => {
    if (btn.dataset.bound) return;
    btn.dataset.bound = "true";
    btn.addEventListener("click", (e) => {
      e.preventDefault();
      const name = window.prompt("New folder name:")?.trim();
      if (!name) return;

      const list = document.querySelector('[data-folders-list]');
      if (!list) return;
      const existingSpans = Array.from(list.querySelectorAll<HTMLElement>("[data-path]"));
      if (existingSpans.some((el) => el.textContent?.trim() === name)) {
        window.alert("A folder with that name already exists.");
        return;
      }

      const idx = existingSpans.length;
      const span = document.createElement("span");
      span.setAttribute("data-editable", "true");
      span.setAttribute("data-path", `models.folders.${idx}`);
      span.textContent = name;
      list.appendChild(span);

      document.querySelectorAll<HTMLSelectElement>("[data-folder-move-target]").forEach((sel) => {
        const opt = document.createElement("option");
        opt.value = name;
        opt.textContent = name;
        sel.appendChild(opt);
      });

      if (!document.querySelector(`[data-folder-grid="${escapeAttr(name)}"]`)) {
        const section = buildFolderSection(name);
        document.querySelector('[data-folders-container]')?.appendChild(section);
      }
    });
  });
}

// ── Resume PDF upload ────────────────────────────────────────────────────

function injectResumeUploadControls() {
  document.querySelectorAll<HTMLButtonElement>("[data-resume-upload-target]").forEach((btn) => {
    if (btn.dataset.uploadBound) return;
    btn.dataset.uploadBound = "true";

    const input = document.createElement("input");
    input.type = "file";
    input.accept = "application/pdf";
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
        const res = await fetch("/api/upload-resume", {
          method: "POST",
          headers: { "x-edit-token": sessionStorage.getItem("editToken") ?? "" },
          body: fd,
        });
        const data = (await res.json()) as { ok?: boolean; url?: string; error?: string };
        if (res.ok && data.url) {
          const target = btn.getAttribute("data-resume-upload-target")!;
          const span = document.querySelector<HTMLElement>(`[data-editable][data-path="${escapeAttr(target)}"]`);
          if (span) {
            span.textContent = data.url;
            span.removeAttribute("data-placeholder");
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

// ── Placeholder fields (e.g. "paste URL here") ──────────────────────────────

// The moment a placeholder field is actually touched, drop its marker so
// collectEdits treats it as real content from then on (even if cleared back
// to empty — that's a deliberate empty value, not an untouched placeholder).
function injectPlaceholderTracking() {
  document.querySelectorAll<HTMLElement>("[data-editable][data-placeholder]").forEach((el) => {
    if (el.dataset.placeholderBound) return;
    el.dataset.placeholderBound = "true";
    el.addEventListener(
      "input",
      () => {
        el.removeAttribute("data-placeholder");
      },
      { once: true }
    );
  });
}

// ── Collect edits from DOM ─────────────────────────────────────────────────

function collectEdits(): { scalars: Record<string, string>; arrays: Record<string, string[]> } {
  const scalars: Record<string, string> = {};
  const arrayItems = new Map<string, string[]>();

  document.querySelectorAll<HTMLElement>("[data-editable][data-path]").forEach((el) => {
    // Still showing its placeholder text (e.g. "paste URL here") and never
    // touched — skip it rather than saving the placeholder as real data.
    if (el.hasAttribute("data-placeholder")) return;

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
  const maxIndex: Record<string, number> = {};

  document.querySelectorAll<HTMLElement>("[data-array-item][data-array-path]").forEach((el) => {
    const p = el.getAttribute("data-array-path")!;
    const idx = Number(el.getAttribute("data-array-index"));
    if (!(p in maxIndex) || idx > maxIndex[p]) maxIndex[p] = idx;
  });

  // Some entries (e.g. the single academic/education card) intentionally
  // sit outside the add/remove/reorder controls but still have their own
  // indexed fields — account for those too so Save doesn't truncate the
  // array down to just the wrapped items and delete them.
  const arrayPaths = Object.keys(maxIndex);
  if (arrayPaths.length) {
    document.querySelectorAll<HTMLElement>("[data-editable][data-path]").forEach((el) => {
      const path = el.getAttribute("data-path")!;
      for (const p of arrayPaths) {
        const prefix = `${p}.`;
        if (path.startsWith(prefix)) {
          const idx = Number(path.slice(prefix.length).split(".")[0]);
          if (!isNaN(idx) && idx > maxIndex[p]) maxIndex[p] = idx;
        }
      }
    });
  }

  const lengths: Record<string, number> = {};
  for (const p of arrayPaths) lengths[p] = maxIndex[p] + 1;
  return lengths;
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
          if (urlSpan) {
            urlSpan.textContent = data.url;
            urlSpan.removeAttribute("data-placeholder");
          }
          if (formatTarget) {
            const formatSpan = document.querySelector<HTMLElement>(`[data-editable][data-path="${escapeAttr(formatTarget)}"]`);
            if (formatSpan) {
              formatSpan.textContent = data.format;
              formatSpan.removeAttribute("data-placeholder");
            }
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
  const [showHistory, setShowHistory] = useState(false);
  const [versions, setVersions] = useState<{ pathname: string; uploadedAt: string }[]>([]);
  const [historyBusy, setHistoryBusy] = useState(false);
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
      injectResumeUploadControls();
      injectFolderMoveControls();
      injectCreateFolderControls();
      injectPlaceholderTracking();
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
      setStatus(res.ok ? { text: "Saved — live now ✓", ok: true } : { text: "Save failed", ok: false });
    } catch {
      setStatus({ text: "Network error", ok: false });
    }
    setMode("editing");
  };

  const handlePublish = async () => {
    setStatus({ text: "Backing up to GitHub…", ok: true });
    setMode("publishing");
    try {
      const res = await fetch("/api/publish", {
        method: "POST",
        headers: { "x-edit-token": token() },
      });
      const data = (await res.json()) as { ok?: boolean; error?: string };
      setStatus(
        res.ok
          ? { text: "Snapshot committed ✓", ok: true }
          : { text: `Git error (needs local git access): ${data.error ?? "unknown"}`, ok: false }
      );
    } catch {
      setStatus({ text: "Network error", ok: false });
    }
    setMode("editing");
  };

  const handleToggleHistory = async () => {
    if (showHistory) {
      setShowHistory(false);
      return;
    }
    setHistoryBusy(true);
    try {
      const res = await fetch("/api/content-versions", {
        headers: { "x-edit-token": token() },
      });
      const data = (await res.json()) as {
        ok?: boolean;
        versions?: { pathname: string; uploadedAt: string }[];
        error?: string;
      };
      if (res.ok && data.versions) {
        setVersions(data.versions);
        setShowHistory(true);
      } else {
        setStatus({ text: `Could not load history: ${data.error ?? "unknown"}`, ok: false });
      }
    } catch {
      setStatus({ text: "Network error", ok: false });
    }
    setHistoryBusy(false);
  };

  const handleRestore = async (pathname: string) => {
    if (!window.confirm("Restore this version? Current content will be saved as a new history entry first, so this can be undone too.")) {
      return;
    }
    setHistoryBusy(true);
    try {
      const res = await fetch("/api/restore-version", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-edit-token": token(),
        },
        body: JSON.stringify({ pathname }),
      });
      if (res.ok) {
        window.location.reload();
        return;
      }
      const data = (await res.json()) as { error?: string };
      setStatus({ text: `Restore failed: ${data.error ?? "unknown"}`, ok: false });
    } catch {
      setStatus({ text: "Network error", ok: false });
    }
    setHistoryBusy(false);
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
              title="Saves already go live instantly — this just backs up content.json to git (requires running locally)"
              className="flex items-center gap-1.5 border border-neutral-700 hover:border-accent-500/60 disabled:border-neutral-800 text-neutral-400 hover:text-accent-400 disabled:text-neutral-700 font-mono text-[11px] tracking-widest px-4 py-2 transition-colors"
            >
              {mode === "publishing" ? (
                <><Spinner /> BACKING UP</>
              ) : (
                <>
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                      d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                  </svg>
                  BACK UP
                </>
              )}
            </button>

            <button
              onClick={handleToggleHistory}
              disabled={busy || historyBusy}
              title="View and restore previous saved versions"
              className="flex items-center gap-1.5 border border-neutral-700 hover:border-accent-500/60 disabled:border-neutral-800 text-neutral-400 hover:text-accent-400 disabled:text-neutral-700 font-mono text-[11px] tracking-widest px-4 py-2 transition-colors"
            >
              {historyBusy ? <Spinner /> : "HISTORY"}
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

          {showHistory && (
            <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-3 w-80 max-h-80 overflow-y-auto bg-neutral-950 border border-accent-500/25 shadow-2xl p-3">
              <div className="font-mono text-[10px] text-neutral-600 tracking-widest mb-2">
                RECENT VERSIONS
              </div>
              {versions.length === 0 ? (
                <p className="font-mono text-[11px] text-neutral-600">No saved history yet.</p>
              ) : (
                <ul className="flex flex-col gap-1.5">
                  {versions.map((v) => (
                    <li key={v.pathname} className="flex items-center justify-between gap-3">
                      <span className="font-mono text-[11px] text-neutral-400">
                        {new Date(v.uploadedAt).toLocaleString()}
                      </span>
                      <button
                        onClick={() => handleRestore(v.pathname)}
                        disabled={historyBusy}
                        className="shrink-0 font-mono text-[10px] text-accent-400 border border-accent-500/30 px-2 py-0.5 hover:border-accent-500/60 disabled:opacity-40"
                      >
                        Restore
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}
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
