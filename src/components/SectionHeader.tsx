interface SectionHeaderProps {
  label: string;
  title: string;
  subtitle?: string;
  labelPath?: string;
  titlePath?: string;
  subtitlePath?: string;
}

export default function SectionHeader({
  label,
  title,
  subtitle,
  labelPath,
  titlePath,
  subtitlePath,
}: SectionHeaderProps) {
  return (
    <div className="mb-14">
      <div className="flex items-center gap-3 mb-5">
        <div className="h-px w-10 bg-amber-500" />
        <span
          className="font-mono text-amber-400 text-[11px] tracking-[0.3em]"
          {...(labelPath ? { "data-editable": "true", "data-path": labelPath } : {})}
        >
          {label.toUpperCase()}
        </span>
      </div>
      <h1
        className="font-mono text-4xl md:text-5xl font-bold text-neutral-100 leading-tight mb-3"
        {...(titlePath ? { "data-editable": "true", "data-path": titlePath } : {})}
      >
        {title}
      </h1>
      {subtitle && (
        <p
          className="text-neutral-500 text-base max-w-xl leading-relaxed"
          {...(subtitlePath ? { "data-editable": "true", "data-path": subtitlePath } : {})}
        >
          {subtitle}
        </p>
      )}
    </div>
  );
}
