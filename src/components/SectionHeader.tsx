interface SectionHeaderProps {
  label: string;
  title: string;
  subtitle?: string;
}

export default function SectionHeader({ label, title, subtitle }: SectionHeaderProps) {
  return (
    <div className="mb-14">
      <div className="flex items-center gap-3 mb-5">
        <div className="h-px w-10 bg-amber-500" />
        <span className="font-mono text-amber-400 text-[11px] tracking-[0.3em]">
          {label.toUpperCase()}
        </span>
      </div>
      <h1 className="font-mono text-4xl md:text-5xl font-bold text-neutral-100 leading-tight mb-3">
        {title}
      </h1>
      {subtitle && (
        <p className="text-neutral-500 text-base max-w-xl leading-relaxed">{subtitle}</p>
      )}
    </div>
  );
}
