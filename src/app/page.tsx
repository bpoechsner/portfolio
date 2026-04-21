import Link from "next/link";
import content from "@/lib/content";

export default function Home() {
  const { meta, hero, projects, experience } = content;

  const stats = [
    { label: "Projects", value: `${projects.length}` },
    { label: "Internships", value: `${experience.filter((e) => e.id !== "msu").length}` },
    { label: "University", value: "MSU" },
    { label: "GPA", value: meta.gpa },
  ];

  return (
    <section className="relative min-h-screen flex items-center bg-grid overflow-hidden">
      {/* Ambient bloom */}
      <div className="absolute top-[40%] left-[30%] w-[700px] h-[500px] bg-accent-500/4 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-0 right-0 w-[400px] h-[300px] bg-accent-600/3 rounded-full blur-[80px] pointer-events-none" />

      <div className="relative z-10 max-w-7xl mx-auto px-6 lg:px-8 pt-28 pb-24 w-full">
        {/* Overline */}
        <div className="flex items-center gap-3 mb-8">
          <div className="h-px w-10 bg-accent-500" />
          <span
            className="font-mono text-accent-400 text-[11px] tracking-[0.3em]"
            data-editable="true"
            data-path="hero.subheadline"
          >
            {hero.subheadline}
          </span>
          {hero.availability.visible && (
            <span
              className="font-mono text-[10px] text-green-400 border border-green-500/30 bg-green-500/5 px-2 py-0.5 tracking-wide"
              data-editable="true"
              data-path="hero.availability.text"
            >
              {hero.availability.text}
            </span>
          )}
        </div>

        {/* Headline */}
        <h1
          className="font-mono font-bold leading-[0.88] tracking-tight mb-8 text-gradient-accent"
          style={{ fontSize: "clamp(3.2rem, 9.5vw, 8.5rem)" }}
          data-editable="true"
          data-path="hero.headline"
        >
          {hero.headline}
        </h1>

        {/* Description */}
        <p
          className="text-neutral-400 text-lg max-w-[560px] leading-relaxed mb-8"
          data-editable="true"
          data-path="hero.description"
        >
          {hero.description}
        </p>

        {/* Tag chips */}
        <div className="flex flex-wrap gap-2 mb-12">
          {hero.tags.filter((t) => t.trim()).map((tag, i) => (
            <span
              key={tag}
              className="font-mono text-[11px] text-accent-400/70 border border-accent-500/20 bg-accent-500/5 px-3 py-1 tracking-wide"
              data-editable="true"
              data-path={`hero.tags.${i}`}
            >
              {tag}
            </span>
          ))}
        </div>

        {/* CTAs */}
        <div className="flex flex-wrap gap-4 mb-20">
          <Link
            href="/projects"
            className="inline-flex items-center gap-2 bg-accent-500 hover:bg-accent-400 text-neutral-950 font-mono text-[13px] font-bold tracking-widest px-7 py-3.5 transition-colors"
          >
            VIEW WORK
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
            </svg>
          </Link>

          <a
            href={meta.resume}
            className="inline-flex items-center gap-2 border border-neutral-700 hover:border-accent-500 text-neutral-400 hover:text-accent-400 font-mono text-[13px] tracking-widest px-7 py-3.5 transition-colors"
          >
            RESUME
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
            </svg>
          </a>

          <Link
            href="/contact"
            className="inline-flex items-center gap-2 border border-neutral-800 hover:border-neutral-600 text-neutral-600 hover:text-neutral-300 font-mono text-[13px] tracking-widest px-7 py-3.5 transition-colors"
          >
            CONTACT
          </Link>
        </div>

        {/* Stats bar */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-8 border-t border-neutral-800/60 pt-8">
          {stats.map((stat) => (
            <div key={stat.label}>
              <div className="font-mono text-2xl font-bold text-accent-400 mb-1">{stat.value}</div>
              <div className="font-mono text-[10px] text-neutral-700 tracking-[0.2em]">
                {stat.label.toUpperCase()}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Scroll cue */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 opacity-40">
        <span className="font-mono text-[10px] text-neutral-600 tracking-[0.3em]">SCROLL</span>
        <div className="w-px h-8 bg-gradient-to-b from-neutral-600 to-transparent" />
      </div>
    </section>
  );
}
