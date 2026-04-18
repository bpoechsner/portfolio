import type { Metadata } from "next";
import content from "@/lib/content";
import SectionHeader from "@/components/SectionHeader";

export const metadata: Metadata = {
  title: "3D Files",
};

export default function ThreeDFilesPage() {
  const { models } = content;

  return (
    <div className="max-w-7xl mx-auto px-6 lg:px-8 pt-32 pb-24">
      <SectionHeader
        label="CAD / Fabrication"
        title="3D Files"
        subtitle={models.description}
      />

      {/* External gallery links */}
      {(models.printables_url || models.thangs_url) && (
        <div className="flex flex-wrap gap-3 mb-10">
          {models.printables_url && (
            <a
              href={models.printables_url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 border border-neutral-800 hover:border-amber-500/50 text-neutral-500 hover:text-amber-400 font-mono text-xs tracking-widest px-4 py-2 transition-colors"
            >
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
              </svg>
              PRINTABLES
            </a>
          )}
          {models.thangs_url && (
            <a
              href={models.thangs_url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 border border-neutral-800 hover:border-amber-500/50 text-neutral-500 hover:text-amber-400 font-mono text-xs tracking-widest px-4 py-2 transition-colors"
            >
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
              </svg>
              THANGS
            </a>
          )}
        </div>
      )}

      {/* File grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {models.files.map((file, i) => (
          <div
            key={file.id}
            className="group border border-neutral-800 bg-neutral-900/30 hover:border-amber-500/40 card-glow transition-all flex flex-col"
          >
            {/* Visual placeholder */}
            <div className="aspect-square bg-[#0f0f0f] border-b border-neutral-800 flex items-center justify-center relative overflow-hidden">
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

              <p
                className="font-mono text-[11px] text-neutral-700 mb-3"
                data-editable="true"
                data-path={`models.files.${i}.project`}
              >
                {file.project}
              </p>

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

      <div className="mt-8 p-4 border border-neutral-800/50 bg-neutral-900/20">
        <p className="font-mono text-[11px] text-neutral-700 tracking-wide">
          // Designed in Onshape · Sliced for Bambu Lab P1S · Free for personal use
        </p>
      </div>
    </div>
  );
}
