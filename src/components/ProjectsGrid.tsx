"use client";

import type { Project } from "@/lib/content";

interface ProjectsGridProps {
  projects: Project[];
}

const statusStyles: Record<string, string> = {
  "In Progress": "text-amber-400 border-amber-500/30 bg-amber-500/5",
  Complete: "text-green-400 border-green-500/30 bg-green-500/5",
};

export default function ProjectsGrid({ projects }: ProjectsGridProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
      {projects.map((project, idx) => (
        <div
          key={project.id}
          className="group relative border border-neutral-800 bg-neutral-900/40 p-6 card-glow transition-all flex flex-col"
        >
          {/* Status badge */}
          <span
            className={`absolute top-4 right-4 font-mono text-[9px] tracking-widest border px-2 py-0.5 ${
              statusStyles[project.status] ?? "text-neutral-500 border-neutral-700"
            }`}
          >
            {project.status.toUpperCase()}
          </span>

          {/* Category */}
          <div className="font-mono text-[11px] text-neutral-700 mb-3">{project.category}</div>

          {/* Title */}
          <h3
            className="font-mono text-base font-bold text-neutral-100 mb-3 group-hover:text-amber-400 transition-colors leading-tight pr-20"
            data-editable="true"
            data-path={`projects.${idx}.title`}
          >
            {project.title}
          </h3>

          {/* Description */}
          <p
            className="text-neutral-500 text-sm leading-relaxed mb-5 flex-1"
            data-editable="true"
            data-path={`projects.${idx}.description`}
          >
            {project.description}
          </p>

          {/* Tech chips */}
          <div className="flex flex-wrap gap-1.5 mb-5">
            {project.tech.filter((t) => t.trim()).map((tag, k) => (
              <span
                key={tag}
                className="font-mono text-[10px] text-neutral-700 border border-neutral-800 px-2 py-0.5"
                data-editable="true"
                data-path={`projects.${idx}.tech.${k}`}
              >
                {tag}
              </span>
            ))}
          </div>

          {/* Links */}
          <div className="flex gap-5 mt-auto">
            {project.links.github && (
              <a
                href={project.links.github}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1.5 font-mono text-[11px] text-neutral-600 hover:text-amber-400 transition-colors tracking-wider"
              >
                <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
                </svg>
                GITHUB
              </a>
            )}
            {project.links.demo && (
              <a
                href={project.links.demo}
                target="_blank"
                rel="noopener noreferrer"
                className="font-mono text-[11px] text-neutral-600 hover:text-amber-400 transition-colors tracking-wider"
              >
                DEMO →
              </a>
            )}
            {project.links.files && (
              <a
                href={project.links.files}
                target="_blank"
                rel="noopener noreferrer"
                className="font-mono text-[11px] text-neutral-600 hover:text-amber-400 transition-colors tracking-wider"
              >
                FILES →
              </a>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
