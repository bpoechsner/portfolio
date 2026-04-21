import Link from "next/link";
import content from "@/lib/content";

export default function Footer() {
  const { meta, footer, socials } = content;

  return (
    <footer className="border-t border-neutral-900 py-10 mt-24">
      <div className="max-w-7xl mx-auto px-6 lg:px-8 flex flex-col sm:flex-row justify-between items-center gap-5">
        <div className="flex flex-col items-center sm:items-start gap-1">
          <Link
            href="/"
            className="font-mono text-accent-400 tracking-[0.22em] text-sm hover:text-accent-300 transition-colors"
            data-editable="true"
            data-path="footer.logo"
          >
            {footer.logo}
          </Link>
          {footer.tagline && (
            <span
              className="font-mono text-[10px] text-neutral-700 tracking-wide"
              data-editable="true"
              data-path="footer.tagline"
            >
              {footer.tagline}
            </span>
          )}
        </div>

        <p className="font-mono text-[11px] text-neutral-700 tracking-widest">
          © {new Date().getFullYear()} {meta.name}
        </p>

        <div className="flex gap-6">
          {socials.map((social, i) => (
            <a
              key={social.label}
              href={social.url}
              target={social.url.startsWith("http") ? "_blank" : undefined}
              rel={social.url.startsWith("http") ? "noopener noreferrer" : undefined}
              className="font-mono text-[11px] text-neutral-600 hover:text-accent-400 transition-colors tracking-widest"
              data-editable="true"
              data-path={`socials.${i}.label`}
            >
              {social.label.toUpperCase()}
            </a>
          ))}
        </div>
      </div>
    </footer>
  );
}
