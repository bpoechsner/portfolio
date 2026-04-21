import type { Metadata } from "next";
import content from "@/lib/content";
import SectionHeader from "@/components/SectionHeader";
import FadeIn from "@/components/FadeIn";

export const metadata: Metadata = {
  title: "Skills",
};

export default function SkillsPage() {
  const { skills, pages } = content;
  const pg = pages.skills;

  return (
    <div className="max-w-7xl mx-auto px-6 lg:px-8 pt-32 pb-24">
      <SectionHeader
        label={pg.label}
        title={pg.title}
        subtitle={pg.subtitle}
        labelPath="pages.skills.label"
        titlePath="pages.skills.title"
        subtitlePath="pages.skills.subtitle"
      />

      {/* Category grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {skills.map((group, gi) => (
          <FadeIn key={group.category} delay={gi * 80}>
            <div className="border border-neutral-800 bg-neutral-900/20 p-5 h-full">
              <h2
                className="font-mono text-xs font-bold text-accent-400 tracking-widest mb-4"
                data-editable="true"
                data-path={`skills.${gi}.category`}
              >
                {group.category.toUpperCase()}
              </h2>
              <ul className="space-y-2.5">
                {group.items.filter((i) => i.trim()).map((item, ii) => (
                  <li key={item} className="flex items-start gap-2">
                    <span className="text-accent-500/60 mt-[3px] text-xs shrink-0">▸</span>
                    <span
                      className="font-mono text-[13px] text-neutral-300 leading-snug"
                      data-editable="true"
                      data-path={`skills.${gi}.items.${ii}`}
                    >
                      {item}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          </FadeIn>
        ))}
      </div>

      {/* All items as flat chip cloud */}
      <FadeIn delay={320}>
        <div className="mt-12 pt-12 border-t border-neutral-900">
          <div className="font-mono text-[11px] text-neutral-700 tracking-[0.3em] mb-5">
            FULL SKILL SET
          </div>
          <div className="flex flex-wrap gap-2">
            {skills.flatMap((g) => g.items).map((item) => (
              <span
                key={item}
                className="font-mono text-[11px] text-neutral-500 border border-neutral-800 px-3 py-1 hover:border-accent-500/40 hover:text-neutral-200 transition-colors cursor-default"
              >
                {item}
              </span>
            ))}
          </div>
        </div>
      </FadeIn>
    </div>
  );
}
