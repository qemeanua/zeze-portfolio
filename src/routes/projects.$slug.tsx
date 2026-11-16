import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { ArrowLeft, ArrowRight, ExternalLink, Github, Lightbulb, Sparkles } from "lucide-react";

import { Button } from "@/components/ui/button";
import { getPublishedPortfolio } from "@/lib/portfolio.functions";
import { getProjectSlug } from "@/lib/project-slug";
import type { ProjectEntry } from "@/lib/portfolio-types";

export const Route = createFileRoute("/projects/$slug")({
  head: ({ loaderData }) => {
    const title = loaderData?.project.title ?? "Project details";
    const description =
      loaderData?.project.description ??
      "A closer look at a selected project by Queen-Esther Ezinne Emeanua.";
    return {
      meta: [
        { title: `${title} · Queen-Esther Ezinne Emeanua` },
        { name: "description", content: description },
        { property: "og:title", content: `${title} · Queen-Esther Ezinne Emeanua` },
        { property: "og:description", content: description },
        { property: "og:type", content: "article" },
        { name: "twitter:card", content: "summary_large_image" },
      ],
    };
  },
  loader: async ({ params }) => {
    const content = await getPublishedPortfolio();
    if (!content) throw notFound();
    const index = content.projects.findIndex(
      (project, projectIndex) =>
        project.published &&
        getProjectSlug(project, projectIndex, content.projects) === params.slug,
    );
    const project = content.projects[index];
    if (!project) throw notFound();
    return { project };
  },
  component: ProjectDetailsPage,
});

function ProjectDetailsPage() {
  const { project } = Route.useLoaderData();
  const technologies = (project.technologies ?? "")
    .split(/[,|·]/)
    .map((item) => item.trim())
    .filter(Boolean);
  const screenshots = (project.screenshots ?? []).filter(isSafeImageSource);
  const fullDescription = project.fullDescription?.trim() || project.description;

  return (
    <main className="min-h-screen bg-background">
      <header className="border-b border-border/70 bg-background/90">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-5 py-5 lg:px-8">
          <Link
            to="/"
            hash="projects"
            className="inline-flex items-center gap-2 text-sm text-muted-foreground transition hover:text-rose"
          >
            <ArrowLeft className="size-4" /> Back to selected work
          </Link>
          <Link
            to="/"
            className="editorial-title text-3xl text-rose"
            aria-label="Queen-Esther Ezinne Emeanua home"
          >
            QE
          </Link>
        </div>
      </header>

      <section className="mx-auto grid max-w-7xl gap-10 px-5 py-12 sm:py-16 lg:grid-cols-[1.08fr_.92fr] lg:items-center lg:px-8 lg:py-20">
        <div>
          <p className="font-mono text-xs uppercase tracking-[.22em] text-rose">
            Selected work <span className="px-2 text-border">/</span> {project.category}
          </p>
          <h1 className="mt-5 editorial-title text-5xl leading-[1.05] sm:text-7xl">
            {project.title}
          </h1>
          <p className="mt-6 max-w-2xl text-base leading-8 text-muted-foreground sm:text-lg">
            {project.description}
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            {project.projectUrl && (
              <Button asChild className="rounded-full">
                <a href={project.projectUrl} target="_blank" rel="noreferrer">
                  View live project
                  <ExternalLink />
                </a>
              </Button>
            )}
            {project.githubUrl && (
              <Button asChild variant="outline" className="rounded-full">
                <a href={project.githubUrl} target="_blank" rel="noreferrer">
                  <Github />
                  View source
                </a>
              </Button>
            )}
          </div>
        </div>
        <div className="relative overflow-hidden rounded-[2rem] border border-border bg-blush p-3 shadow-sm">
          {isSafeImageSource(project.imageUrl) ? (
            <img
              src={project.imageUrl}
              alt={`${project.title} project preview`}
              className="aspect-[4/3] w-full rounded-[1.5rem] object-cover"
              fetchPriority="high"
            />
          ) : (
            <div className="circuit-grid flex aspect-[4/3] items-center justify-center rounded-[1.5rem]">
              <span className="editorial-title text-9xl text-rose/30">QE</span>
            </div>
          )}
        </div>
      </section>

      <div className="mx-auto grid max-w-7xl gap-14 px-5 pb-16 lg:grid-cols-[1fr_21rem] lg:gap-20 lg:px-8 lg:pb-24">
        <div className="flex flex-col gap-14">
          <ProjectSection eyebrow="The story" title="Full description">
            <p className="whitespace-pre-line text-base leading-8 text-muted-foreground">
              {fullDescription || "The full project story is being prepared."}
            </p>
          </ProjectSection>

          <ProjectSection eyebrow="The challenge" title="Problem solved">
            <p className="whitespace-pre-line text-base leading-8 text-muted-foreground">
              {project.problem?.trim() || "The problem this project addresses will be shared soon."}
            </p>
          </ProjectSection>

          <ProjectSection eyebrow="What it can do" title="Features">
            {project.features?.length ? (
              <ul className="grid gap-3 sm:grid-cols-2">
                {project.features.filter(Boolean).map((feature, index) => (
                  <li
                    key={`${feature}-${index}`}
                    className="flex gap-3 rounded-2xl border border-border bg-card p-5 text-sm leading-6"
                  >
                    <Sparkles className="mt-0.5 size-4 shrink-0 text-rose" />
                    {feature}
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-base leading-8 text-muted-foreground">
                Project features will be added soon.
              </p>
            )}
          </ProjectSection>

          <ProjectSection eyebrow="A closer look" title="Screenshots">
            {screenshots.length ? (
              <div className="grid gap-4 sm:grid-cols-2">
                {screenshots.map((screenshot, index) => (
                  <figure
                    key={`${screenshot}-${index}`}
                    className="overflow-hidden rounded-2xl border border-border bg-card p-2"
                  >
                    <img
                      src={screenshot}
                      alt={`${project.title} screenshot ${index + 1}`}
                      loading="lazy"
                      className="aspect-video w-full rounded-xl object-cover"
                    />
                  </figure>
                ))}
              </div>
            ) : (
              <p className="text-base leading-8 text-muted-foreground">
                Project screenshots will be added soon.
              </p>
            )}
          </ProjectSection>
        </div>

        <aside className="flex flex-col gap-8 lg:pt-2">
          <section className="rounded-3xl border border-border bg-card p-6 sm:p-8">
            <p className="font-mono text-[10px] uppercase tracking-[.2em] text-rose">Built with</p>
            <h2 className="mt-3 editorial-title text-3xl">Technologies used</h2>
            {technologies.length ? (
              <ul className="mt-5 flex flex-wrap gap-2">
                {technologies.map((technology) => (
                  <li
                    key={technology}
                    className="rounded-full border border-border bg-background px-3 py-2 text-xs font-medium"
                  >
                    {technology}
                  </li>
                ))}
              </ul>
            ) : (
              <p className="mt-4 text-sm leading-6 text-muted-foreground">
                The technology stack will be shared soon.
              </p>
            )}
          </section>
          <section className="rounded-3xl bg-lavender p-6 sm:p-8">
            <Lightbulb className="size-5 text-rose" />
            <p className="mt-5 font-mono text-[10px] uppercase tracking-[.2em] text-muted-foreground">
              Reflection
            </p>
            <h2 className="mt-2 editorial-title text-3xl">What I learned</h2>
            <p className="mt-4 whitespace-pre-line text-sm leading-7 text-muted-foreground">
              {project.learnings?.trim() ||
                "The lessons from building this project will be shared soon."}
            </p>
          </section>
          <Link
            to="/"
            hash="projects"
            className="inline-flex items-center gap-2 text-sm font-semibold text-rose hover:underline"
          >
            Explore more projects
            <ArrowRight className="size-4" />
          </Link>
        </aside>
      </div>
    </main>
  );
}

function ProjectSection({
  eyebrow,
  title,
  children,
}: {
  eyebrow: string;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section>
      <p className="font-mono text-[10px] uppercase tracking-[.2em] text-rose">{eyebrow}</p>
      <h2 className="mt-2 editorial-title text-4xl sm:text-5xl">{title}</h2>
      <div className="mt-6">{children}</div>
    </section>
  );
}

function isSafeImageSource(value: string | undefined) {
  if (!value) return false;
  if (value.startsWith("/")) return true;
  try {
    return new URL(value).protocol === "https:";
  } catch {
    return false;
  }
}
