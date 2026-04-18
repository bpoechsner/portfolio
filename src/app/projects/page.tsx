import type { Metadata } from "next";
import content from "@/lib/content";
import SectionHeader from "@/components/SectionHeader";
import ProjectsGrid from "@/components/ProjectsGrid";

export const metadata: Metadata = {
  title: "Projects",
};

export default function ProjectsPage() {
  return (
    <div className="max-w-7xl mx-auto px-6 lg:px-8 pt-32 pb-24">
      <SectionHeader
        label="Work"
        title="Projects"
        subtitle="Hardware and software projects — embedded systems, DSP, and precision CAD."
      />
      <ProjectsGrid projects={content.projects} />
    </div>
  );
}
