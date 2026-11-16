import type { Json } from "@/integrations/supabase/types";

export interface ProfileContent {
  fullName: string;
  title: string;
  eyebrow: string;
  location: string;
  email: string;
  whatsapp: string;
  phone: string;
  intro: string;
  biography: string;
  portraitUrl: string;
  portraitPosition: [number, number];
  cvUrl: string;
  socialLinks: { label: string; url: string; icon: string }[];
}

export interface PortfolioEntry {
  [key: string]: string | boolean | string[] | PortfolioEntry[] | undefined;
}

export interface SkillEntry extends PortfolioEntry {
  name: string;
  icon: string;
  visible: boolean;
}

export interface SkillCategory extends PortfolioEntry {
  name: string;
  icon: string;
  visible: boolean;
  skills: SkillEntry[];
}

export interface ExperienceEntry extends PortfolioEntry {
  company: string;
  role: string;
  dates: string;
  location: string;
  responsibilities: string[];
}

export interface EducationEntry extends PortfolioEntry {
  institution: string;
  degree: string;
  dates: string;
  location: string;
  details: string[];
}

export interface ProjectEntry extends PortfolioEntry {
  title: string;
  slug?: string;
  category: string;
  description: string;
  fullDescription?: string;
  problem?: string;
  features?: string[];
  screenshots?: string[];
  technologies: string;
  learnings?: string;
  imageUrl: string;
  projectUrl: string;
  githubUrl: string;
  featured: boolean;
  published: boolean;
}

export interface AchievementEntry extends PortfolioEntry {
  title: string;
  detail: string;
  year: string;
}

export interface ToolEntry extends PortfolioEntry {
  name: string;
  icon: string;
  category: string;
}

export interface PortfolioContent {
  profile: ProfileContent;
  settings: {
    heroHeadline: string;
    aboutHeadline: string;
    contactHeadline: string;
    contactCopy: string;
    exploreLabel: string;
    cvLabel: string;
    navigation: string[];
    visibleSections: Record<string, boolean>;
    [key: string]: string | string[] | Record<string, boolean>;
  };
  capabilities: PortfolioEntry[];
  experiences: ExperienceEntry[];
  education: EducationEntry[];
  skillCategories: SkillCategory[];
  projects: ProjectEntry[];
  achievements: AchievementEntry[];
  tools: ToolEntry[];
}

export const portfolioCollectionNames = [
  "experiences",
  "education",
  "skillCategories",
  "projects",
  "achievements",
  "tools",
] as const;

export type PortfolioCollectionName = (typeof portfolioCollectionNames)[number];

export function parsePortfolioContent(value: Json): PortfolioContent | null {
  if (value === null || Array.isArray(value) || typeof value !== "object") return null;
  if (!("profile" in value) || !value.profile || !("settings" in value) || !value.settings) return null;
  return value as unknown as PortfolioContent;
}
