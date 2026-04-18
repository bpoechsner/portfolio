import content from "../../content.json";

export default content;

export type Content = typeof content;
export type Experience = Content["experience"][number];
export type Project = Content["projects"][number];
export type ModelFile = Content["models"]["files"][number];
export type SkillCategory = Content["skills"][number];
