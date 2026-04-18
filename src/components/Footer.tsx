import Link from "next/link";
import content from "@/lib/content";

export default function Footer() {
  const { meta } = content;

  return (
    <footer className="border-t border-neutral-900 py-10 mt-24">
      <div className="max-w-7xl mx-auto px-6 lg:px-8 flex flex-col sm:flex-row justify-between items-center gap-5">
        <Link
          href="/"
          className="font-mono text-amber-400 tracking-[0.22em] text-sm hover:text-amber-300 transition-colors"
        >
          B.OECHSNER
        </Link>

        <p className="font-mono text-[11px] text-neutral-700 tracking-widest">
          © {new Date().getFullYear()} {meta.name}
        </p>

        <div className="flex gap-6">
          <a
            href={meta.linkedin}
            target="_blank"
            rel="noopener noreferrer"
            className="font-mono text-[11px] text-neutral-600 hover:text-amber-400 transition-colors tracking-widest"
          >
            LINKEDIN
          </a>
          <a
            href={meta.github}
            target="_blank"
            rel="noopener noreferrer"
            className="font-mono text-[11px] text-neutral-600 hover:text-amber-400 transition-colors tracking-widest"
          >
            GITHUB
          </a>
          <a
            href={meta.resume}
            className="font-mono text-[11px] text-neutral-600 hover:text-amber-400 transition-colors tracking-widest"
          >
            RESUME
          </a>
        </div>
      </div>
    </footer>
  );
}
