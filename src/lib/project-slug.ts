import type { ProjectEntry } from "@/lib/portfolio-types";

function normalizeSlug(value: string) {
  return value
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

export function getProjectSlug(
  project: Pick<ProjectEntry, "title" | "slug">,
  index = 0,
  projects?: readonly ProjectEntry[],
) {
  const rawSlug = project.slug?.trim() || project.title;
  const base = normalizeSlug(rawSlug) || `project-${index + 1}`;
  if (!projects) return base;

  const matchingSlugs = projects.filter((candidate) => {
    const candidateSlug = normalizeSlug(candidate.slug?.trim() || candidate.title);
    return (candidateSlug || "project") === base;
  }).length;

  return matchingSlugs > 1 ? `${base}-${index + 1}` : base;
}
