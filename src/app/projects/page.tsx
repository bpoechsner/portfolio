import type { Metadata } from "next";
import content from "@/lib/content";
import SectionHeader from "@/components/SectionHeader";
import ProjectsGrid from "@/components/ProjectsGrid";

export const metadata: Metadata = {
  title: "Projects",
};

export default function ProjectsPage() {
  const { pages } = content;
  const pg = pages.projects;

  return (
    <div className="max-w-7xl mx-auto px-6 lg:px-8 pt-32 pb-24">
      <SectionHeader
        label={pg.label}
        title={pg.title}
        subtitle={pg.subtitle}
        labelPath="pages.projects.label"
        titlePath="pages.projects.title"
        subtitlePath="pages.projects.subtitle"
      />
      <ProjectsGrid projects={content.projects} />
    </div>
  );
}
