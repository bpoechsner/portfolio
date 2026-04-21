import type { Metadata } from "next";
import content from "@/lib/content";
import SectionHeader from "@/components/SectionHeader";

export const metadata: Metadata = {
  title: "Experience",
};

export default function ExperiencePage() {
  const { experience, pages } = content;
  const pg = pages.experience;

  // Separate academic entry (MSU) from professional entries
  const professional = experience.filter((e) => e.id !== "msu");
  const academic = experience.find((e) => e.id === "msu");
  const academicIdx = experience.findIndex((e) => e.id === "msu");

  return (
    <div className="max-w-4xl mx-auto px-6 lg:px-8 pt-32 pb-24">
      <SectionHeader
        label={pg.label}
        title={pg.title}
        subtitle={pg.subtitle}
        labelPath="pages.experience.label"
        titlePath="pages.experience.title"
        subtitlePath="pages.experience.subtitle"
      />

      {/* Professional timeline */}
      <div className="relative mb-20">
        <div
          className="absolute top-2 bottom-2 w-px bg-neutral-800 hidden md:block"
          style={{ left: "11px" }}
        />

        <div className="space-y-8">
          {professional.map((job) => {
            const idx = experience.findIndex((e) => e.id === job.id);
            return (
              <div key={job.id} className="md:pl-12 relative">
                {/* Dot */}
                <div className="absolute hidden md:flex items-center justify-center w-[23px] h-[23px] border border-amber-500 bg-[#0a0a0a] top-1.5 left-0">
                  <div className="w-[7px] h-[7px] bg-amber-500" />
                </div>

                <div className="border border-neutral-800 bg-neutral-900/30 p-6 hover:border-neutral-700 card-glow transition-all">
                  <div className="flex flex-wrap justify-between items-start gap-4 mb-4">
                    <div>
                      <h2
                        className="font-mono text-lg font-bold text-neutral-100"
                        data-editable="true"
                        data-path={`experience.${idx}.role`}
                      >
                        {job.role}
                      </h2>
                      <p
                        className="font-mono text-sm text-amber-400/70 mt-0.5"
                        data-editable="true"
                        data-path={`experience.${idx}.company`}
                      >
                        {job.company}
                      </p>
                    </div>
                    <span
                      className="font-mono text-xs text-neutral-500 shrink-0"
                      data-editable="true"
                      data-path={`experience.${idx}.period`}
                    >
                      {job.period}
                    </span>
                  </div>

                  <p
                    className="text-neutral-400 text-sm leading-relaxed"
                    data-editable="true"
                    data-path={`experience.${idx}.description`}
                  >
                    {job.description}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Education */}
      {academic && (
        <div className="pt-20 border-t border-neutral-900">
          <SectionHeader label="Academic" title="Education" />

          <div className="border border-neutral-800 bg-neutral-900/30 p-6 card-glow transition-all">
            <div className="flex flex-wrap justify-between items-start gap-4 mb-4">
              <div>
                <h2
                  className="font-mono text-lg font-bold text-neutral-100"
                  data-editable="true"
                  data-path={`experience.${academicIdx}.role`}
                >
                  {academic.role}
                </h2>
                <p
                  className="font-mono text-sm text-amber-400/70 mt-0.5"
                  data-editable="true"
                  data-path={`experience.${academicIdx}.company`}
                >
                  {academic.company}
                </p>
              </div>
              <span
                className="font-mono text-xs text-neutral-500 shrink-0"
                data-editable="true"
                data-path={`experience.${academicIdx}.period`}
              >
                {academic.period}
              </span>
            </div>
            <p
              className="text-neutral-400 text-sm leading-relaxed"
              data-editable="true"
              data-path={`experience.${academicIdx}.description`}
            >
              {academic.description}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
