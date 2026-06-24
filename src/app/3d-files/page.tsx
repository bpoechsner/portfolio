import type { Metadata } from "next";
import { getContent } from "@/lib/content";
import type { ModelFile } from "@/lib/content";
import SectionHeader from "@/components/SectionHeader";
import ModelPreview from "@/components/ModelPreview";
import { isPreviewable } from "@/lib/modelFormats";

export const metadata: Metadata = {
  title: "3D Files",
};

// Folders are an explicit list (models.folders) so an empty folder can
// exist before anything's filed into it. Files are grouped by their
// "project" field matching a folder name; anything with no match (or no
// project set) falls into a synthetic "Ungrouped" bucket.
function groupFiles(folders: string[], files: ModelFile[]) {
  const names = [...folders];
  files.forEach((f) => {
    if (f.project && !names.includes(f.project)) names.push(f.project);
  });

  const groups = names.map((name) => ({ name, items: [] as { file: ModelFile; i: number }[] }));
  const ungrouped: { name: string; items: { file: ModelFile; i: number }[] } = { name: "", items: [] };

  files.forEach((file, i) => {
    const group = groups.find((g) => g.name === file.project);
    if (group) group.items.push({ file, i });
    else ungrouped.items.push({ file, i });
  });

  if (ungrouped.items.length) groups.push(ungrouped);
  return { groups, allFolderNames: names };
}

export default async function ThreeDFilesPage() {
  const content = await getContent();
  const { models, pages } = content;
  const pg = pages.files;
  const { groups, allFolderNames } = groupFiles(models.folders, models.files);

  return (
    <div className="max-w-7xl mx-auto px-6 lg:px-8 pt-32 pb-24">
      <SectionHeader
        label={pg.label}
        title={pg.title}
        subtitle={models.description}
        labelPath="pages.files.label"
        titlePath="pages.files.title"
        subtitlePath="models.description"
      />

      {/* Canonical folder name list — hidden, just here for Save to pick up */}
      <div className="hidden" data-folders-list="true">
        {models.folders.map((name, fi) => (
          <span key={fi} data-editable="true" data-path={`models.folders.${fi}`}>
            {name}
          </span>
        ))}
      </div>

      <div className="edit-only mb-6">
        <button
          data-create-folder="true"
          className="font-mono text-[11px] text-amber-400 border border-amber-500/30 px-3 py-1.5 hover:border-amber-500/60"
        >
          + Create folder
        </button>
      </div>

      {/* Files grouped into folders by their "project" field */}
      <div data-folders-container="true">
      {groups.map((group) => (
        <details key={group.name || "ungrouped"} open className="mb-8 group/folder">
          <summary className="flex items-center gap-2 mb-4 cursor-pointer select-none list-none [&::-webkit-details-marker]:hidden">
            <svg
              className="w-4 h-4 text-amber-500/70 shrink-0 transition-transform group-open/folder:rotate-90"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              strokeWidth={1.5}
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
            </svg>
            <svg className="w-4 h-4 text-amber-500/70 shrink-0" fill="currentColor" viewBox="0 0 24 24">
              <path d="M10 4H4c-1.11 0-2 .89-2 2v12a2 2 0 002 2h16a2 2 0 002-2V8a2 2 0 00-2-2h-8l-2-2z" />
            </svg>
            <span className="font-mono text-sm font-bold text-neutral-300 tracking-wide">
              {group.name || "Ungrouped"}
            </span>
            <span className="font-mono text-[11px] text-neutral-700">({group.items.length})</span>
          </summary>

          <div
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4"
            data-folder-grid={group.name}
          >
            {group.items.map(({ file, i }) => (
              <div
                key={file.id}
                className="group relative border border-neutral-800 bg-neutral-900/30 hover:border-amber-500/40 card-glow transition-all flex flex-col"
                data-array-item="true"
                data-array-path="models.files"
                data-array-index={i}
                data-id-field="id"
              >
            {/* Visual placeholder / live 3D preview */}
            <div className="aspect-square bg-[#0f0f0f] border-b border-neutral-800 flex items-center justify-center relative overflow-hidden">
              {file.download_url && isPreviewable(file.format) ? (
                <ModelPreview itemId={file.id} url={file.download_url} format={file.format} />
              ) : (
                <>
                  <div className="absolute inset-0 bg-grid opacity-50" />
                  <div className="relative z-10 flex flex-col items-center gap-3">
                    <svg
                      className="w-12 h-12 text-neutral-800 group-hover:text-neutral-700 transition-colors"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                      strokeWidth={0.7}
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M21 7.5l-9-5.25L3 7.5m18 0l-9 5.25m9-5.25v9l-9 5.25M3 7.5l9 5.25M3 7.5v9l9 5.25m0-9v9"
                      />
                    </svg>
                    <span className="font-mono text-[10px] text-neutral-700 border border-neutral-800 px-2 py-0.5 tracking-widest">
                      {file.format}
                    </span>
                  </div>
                </>
              )}
            </div>

            {/* Info */}
            <div className="p-4 flex flex-col flex-1">
              <h3
                className="font-mono text-sm font-bold text-neutral-200 group-hover:text-amber-400 transition-colors leading-tight mb-1"
                data-editable="true"
                data-path={`models.files.${i}.name`}
              >
                {file.name}
              </h3>

              <p className="font-mono text-[11px] text-neutral-700 mb-3" data-project-display="true">
                {file.project || "Ungrouped"}
              </p>
              <span className="hidden" data-editable="true" data-path={`models.files.${i}.project`}>
                {file.project}
              </span>

              <div className="edit-only flex flex-col gap-1.5 mb-2">
                <div className="flex items-center gap-2">
                  <span className="font-mono text-[9px] text-neutral-700 tracking-widest w-12 shrink-0">
                    FOLDER
                  </span>
                  <select
                    className="font-mono text-[10px] text-neutral-300 bg-neutral-900 border border-neutral-800 px-1.5 py-0.5"
                    data-folder-move-target={`models.files.${i}.project`}
                    defaultValue={file.project}
                  >
                    {allFolderNames.map((name) => (
                      <option key={name} value={name}>
                        {name}
                      </option>
                    ))}
                    {!allFolderNames.includes(file.project) && (
                      <option value={file.project}>{file.project || "(no folder)"}</option>
                    )}
                  </select>
                </div>
                <div className="flex items-center gap-2">
                  <span className="font-mono text-[9px] text-neutral-700 tracking-widest w-12 shrink-0">
                    VERSION
                  </span>
                  <span
                    className="font-mono text-[10px] text-neutral-600"
                    data-editable="true"
                    data-path={`models.files.${i}.version`}
                    {...(!file.version ? { "data-placeholder": "true" } : {})}
                  >
                    {file.version || "version"}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="font-mono text-[9px] text-neutral-700 tracking-widest w-12 shrink-0">
                    FORMAT
                  </span>
                  <span
                    className="font-mono text-[10px] text-neutral-600"
                    data-editable="true"
                    data-path={`models.files.${i}.format`}
                    {...(!file.format ? { "data-placeholder": "true" } : {})}
                  >
                    {file.format || "STL"}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="font-mono text-[9px] text-neutral-700 tracking-widest w-12 shrink-0">
                    FILE
                  </span>
                  <span
                    className="font-mono text-[10px] text-neutral-600 truncate"
                    data-editable="true"
                    data-path={`models.files.${i}.download_url`}
                    {...(!file.download_url ? { "data-placeholder": "true" } : {})}
                  >
                    {file.download_url || "paste a URL, or upload below"}
                  </span>
                </div>
                <button
                  data-model-upload-target={`models.files.${i}.download_url`}
                  data-model-upload-format-target={`models.files.${i}.format`}
                  data-model-upload-item={file.id}
                  className="self-start font-mono text-[9px] text-amber-400 border border-amber-500/30 px-2 py-0.5 hover:border-amber-500/60"
                >
                  Upload model (STL/GLB/OBJ/3MF)
                </button>
              </div>

              <div className="flex items-center justify-between mt-auto pt-3 border-t border-neutral-800/50">
                <span className="font-mono text-[10px] text-neutral-700">{file.version}</span>
                {file.download_url ? (
                  <a
                    href={file.download_url}
                    className="inline-flex items-center gap-1.5 font-mono text-[11px] text-neutral-500 hover:text-amber-400 transition-colors tracking-wider"
                  >
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                    </svg>
                    DOWNLOAD
                  </a>
                ) : (
                  <span className="font-mono text-[10px] text-neutral-800 tracking-wider">
                    COMING SOON
                  </span>
                )}
              </div>
            </div>
          </div>
            ))}
          </div>
        </details>
      ))}
      </div>

      <div className="mt-8 p-4 border border-neutral-800/50 bg-neutral-900/20">
        <p className="font-mono text-[11px] text-neutral-700 tracking-wide">
          // Designed in Onshape · Sliced for Bambu Lab P1S · Free for personal use
        </p>
      </div>
    </div>
  );
}
