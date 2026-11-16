import { describe, expect, it } from "vitest";

import { getProjectSlug } from "@/lib/project-slug";
import type { ProjectEntry } from "@/lib/portfolio-types";

const projects = [
  { title: "North Star App", slug: "", published: true },
  { title: "North Star App", slug: "", published: true },
] as ProjectEntry[];

describe("project detail URLs", () => {
  it("creates a readable URL from a project title", () => {
    expect(getProjectSlug({ title: "North Star App" })).toBe("north-star-app");
  });

  it("uses an admin-provided slug", () => {
    expect(getProjectSlug({ title: "North Star App", slug: "north-star-v2" })).toBe("north-star-v2");
  });

  it("keeps matching project titles on distinct routes", () => {
    expect(getProjectSlug(projects[0], 0, projects)).toBe("north-star-app-1");
    expect(getProjectSlug(projects[1], 1, projects)).toBe("north-star-app-2");
  });
});
