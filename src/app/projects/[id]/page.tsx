import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import content from "@/lib/content";

export function generateStaticParams() {
  return content.projects.map((p) => ({ id: p.id }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const project = content.projects.find((p) => p.id === id);
  return {
    title: project?.title ?? "Project",
    description: project?.description,
  };
}

const statusStyles: Record<string, string> = {
  "In Progress": "text-accent-400 border-accent-500/30 bg-accent-500/5",
  Complete: "text-green-400 border-green-500/30 bg-green-500/5",
};

export default async function ProjectDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const idx = content.projects.findIndex((p) => p.id === id);
  if (idx === -1) notFound();
  const project = content.projects[idx];

  const hasBody = "body" in project && typeof (project as { body?: string }).body === "string";
  const hasHighlights =
    "highlights" in project && Array.isArray((project as { highlights?: string[] }).highlights);
  const body = hasBody ? (project as { body: string }).body : null;
  const highlights = hasHighlights
    ? (project as { highlights: string[] }).highlights
    : null;

  return (
    <div className="max-w-4xl mx-auto px-6 lg:px-8 pt-32 pb-24">
      {/* Back link */}
      <Link
        href="/projects"
        className="inline-flex items-center gap-2 font-mono text-[11px] text-neutral-600 hover:text-accent-400 tracking-widest transition-colors mb-12"
      >
        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16l-4-4m0 0l4-4m-4 4h18" />
        </svg>
        PROJECTS
      </Link>

      {/* Header */}
      <div className="mb-10">
        <div className="flex items-center gap-3 mb-4">
          <span className="font-mono text-[11px] text-neutral-600">{project.category}</span>
          <span
            className={`font-mono text-[9px] tracking-widest border px-2 py-0.5 ${
              statusStyles[project.status] ?? "text-neutral-500 border-neutral-700"
            }`}
          >
            {project.status.toUpperCase()}
          </span>
        </div>

        <h1
          className="font-mono text-4xl md:text-5xl font-bold text-neutral-100 leading-tight mb-4"
          data-editable="true"
          data-path={`projects.${idx}.title`}
        >
          {project.title}
        </h1>

        <p
          className="text-neutral-400 text-lg leading-relaxed"
          data-editable="true"
          data-path={`projects.${idx}.description`}
        >
          {project.description}
        </p>
      </div>

      {/* Cover image */}
      {project.image ? (
        <div className="mb-10 border border-neutral-800 overflow-hidden">
          <img
            src={project.image}
            alt={project.title}
            className="w-full object-cover"
          />
        </div>
      ) : (
        <div className="mb-10 border border-neutral-800 bg-[#0f0f0f] h-64 flex items-center justify-center relative overflow-hidden">
          <div className="absolute inset-0 bg-grid opacity-30" />
          <span className="font-mono text-[11px] text-neutral-700 relative z-10 tracking-widest">
            NO IMAGE YET
          </span>
        </div>
      )}

      {/* Image URL — only visible in edit mode */}
      <span
        className="edit-only font-mono text-[11px] text-neutral-600 block mb-8 -mt-6"
        data-editable="true"
        data-path={`projects.${idx}.image`}
      >
        {project.image || "paste image URL here"}
      </span>

      {/* Body + Highlights grid */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-10 mb-12">
        {/* Body text */}
        {body && (
          <div className="lg:col-span-3">
            <div className="font-mono text-[11px] text-neutral-700 tracking-[0.3em] mb-4">
              OVERVIEW
            </div>
            <div
              className="text-neutral-400 text-sm leading-relaxed whitespace-pre-line"
              data-editable="true"
              data-path={`projects.${idx}.body`}
            >
              {body}
            </div>
          </div>
        )}

        {/* Highlights */}
        {highlights && highlights.length > 0 && (
          <div className={body ? "lg:col-span-2" : "lg:col-span-5"}>
            <div className="font-mono text-[11px] text-neutral-700 tracking-[0.3em] mb-4">
              KEY HIGHLIGHTS
            </div>
            <ul className="space-y-3">
              {highlights.map((h, hi) => (
                <li key={hi} className="flex items-start gap-2">
                  <span className="text-accent-500/60 mt-[3px] text-xs shrink-0">▸</span>
                  <span
                    className="font-mono text-[13px] text-neutral-300 leading-snug"
                    data-editable="true"
                    data-path={`projects.${idx}.highlights.${hi}`}
                  >
                    {h}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>

      {/* Tech stack */}
      <div className="mb-12 pt-8 border-t border-neutral-900">
        <div className="font-mono text-[11px] text-neutral-700 tracking-[0.3em] mb-4">
          TECH STACK
        </div>
        <div className="flex flex-wrap gap-2">
          {project.tech.filter((t) => t.trim()).map((tag, k) => (
            <span
              key={tag}
              className="font-mono text-[11px] text-neutral-400 border border-neutral-800 hover:border-accent-500/40 px-3 py-1.5 transition-colors"
              data-editable="true"
              data-path={`projects.${idx}.tech.${k}`}
            >
              {tag}
            </span>
          ))}
        </div>
      </div>

      {/* Links */}
      {(project.links.github || project.links.demo || project.links.files) && (
        <div className="flex flex-wrap gap-4">
          {project.links.github && (
            <a
              href={project.links.github}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 border border-neutral-700 hover:border-accent-500/60 text-neutral-400 hover:text-accent-400 font-mono text-[12px] tracking-widest px-5 py-2.5 transition-colors"
            >
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
              </svg>
              VIEW ON GITHUB
            </a>
          )}
          {project.links.demo && (
            <a
              href={project.links.demo}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 bg-accent-500 hover:bg-accent-400 text-neutral-950 font-mono text-[12px] font-bold tracking-widest px-5 py-2.5 transition-colors"
            >
              LIVE DEMO →
            </a>
          )}
          {project.links.files && (
            <a
              href={project.links.files}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 border border-neutral-700 hover:border-accent-500/60 text-neutral-400 hover:text-accent-400 font-mono text-[12px] tracking-widest px-5 py-2.5 transition-colors"
            >
              FILES →
            </a>
          )}
        </div>
      )}
    </div>
  );
}
