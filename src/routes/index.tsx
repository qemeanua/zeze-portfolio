import { createFileRoute, Link } from "@tanstack/react-router";
import { queryOptions, useSuspenseQuery } from "@tanstack/react-query";
import { ArrowDownToLine, ArrowRight, Mail, MapPin, Menu, MessageCircle, Phone, X } from "lucide-react";
import { useState } from "react";

import { PortfolioIcon } from "@/components/portfolio/icons";
import { Button } from "@/components/ui/button";
import { getTelephoneUrl, getWhatsAppUrl } from "@/lib/contact-links";
import { getPublishedPortfolio } from "@/lib/portfolio.functions";
import type { PortfolioContent } from "@/lib/portfolio-types";

export const portfolioQuery = queryOptions({ queryKey: ["portfolio"], queryFn: () => getPublishedPortfolio() });

const title = "Queen-Esther Ezinne Emeanua | Software Engineer";
const description =
  "Explore the portfolio of Queen-Esther Ezinne Emeanua, a software engineering undergraduate passionate about software development, product design, and building impactful digital experiences.";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title },
      { name: "description", content: description },
      { property: "og:title", content: title },
      { property: "og:description", content: description },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  loader: ({ context }) => context.queryClient.ensureQueryData(portfolioQuery),
  component: Index,
});

const sectionIds: Record<string, string> = {
  About: "about", Experience: "experience", Education: "education", Skills: "skills",
  Projects: "projects", Achievements: "achievements", Tools: "tools", Contact: "contact",
};

function Index() {
  const { data } = useSuspenseQuery(portfolioQuery);
  if (!data) return <main className="grid min-h-screen place-items-center">Portfolio coming soon.</main>;
  return <Portfolio content={data} />;
}

function Portfolio({ content }: { content: PortfolioContent }) {
  const { profile: p, settings: s } = content;
  const show = (k: string) => s.visibleSections?.[k] !== false;
  const [open, setOpen] = useState(false);
  const [first, ...rest] = p.fullName.split(" ");
  const nav = s.navigation.filter((n) => show(sectionIds[n] ?? ""));

  return (
    <div className="overflow-x-hidden bg-background">
      <header className="fixed inset-x-0 top-0 z-50 border-b border-border/70 bg-background/80 backdrop-blur-xl">
        <nav className="mx-auto flex h-18 max-w-7xl items-center justify-between px-5 py-4 lg:px-8" aria-label="Main">
          <a href="#top" className="flex items-center gap-3" aria-label="Back to top">
            <span className="editorial-title text-3xl text-rose">QE</span>
            <span className="hidden font-mono text-[10px] uppercase tracking-[0.25em] sm:block">Queen-Esther</span>
          </a>
          <div className="hidden items-center gap-6 lg:flex">
            {nav.map((n) => <a key={n} href={`#${sectionIds[n]}`} className="text-sm text-muted-foreground transition hover:text-rose">{n}</a>)}
          </div>
          <div className="flex items-center gap-2">
            <Button asChild variant="outline" className="hidden rounded-full sm:inline-flex"><a href="#contact">Let’s connect</a></Button>
            <Button variant="ghost" size="icon" className="lg:hidden" aria-label={open ? "Close menu" : "Open menu"} onClick={() => setOpen(!open)}>{open ? <X /> : <Menu />}</Button>
          </div>
        </nav>
        {open && <div className="grid gap-1 border-t border-border bg-background px-5 py-4 lg:hidden">{nav.map((n) => <a key={n} onClick={() => setOpen(false)} href={`#${sectionIds[n]}`} className="rounded-md px-3 py-3 hover:bg-accent">{n}</a>)}</div>}
      </header>

      <main id="top">
        <section className="relative isolate min-h-screen pt-24">
          <div className="circuit-grid absolute inset-0 -z-20 opacity-60 [mask-image:linear-gradient(to_bottom,black,transparent)]" />
          <CircuitBloom className="absolute -right-24 top-20 -z-10 h-[560px] w-[560px] text-rose/25" />
          <div className="mx-auto grid max-w-7xl items-center gap-12 px-5 py-12 lg:grid-cols-[1.08fr_.92fr] lg:px-8 lg:py-20">
            <div className="enter-up">
              <p className="mb-6 inline-flex rounded-full border border-rose/25 bg-card/70 px-4 py-2 font-mono text-[11px] uppercase tracking-[0.2em] text-rose">{p.title}</p>
              <h1 className="editorial-title text-6xl tracking-tight sm:text-7xl xl:text-8xl">
                <span className="block">{first}</span><span className="block text-rose italic">{rest.join(" ")}</span>
              </h1>
              <p className="mt-8 max-w-2xl editorial-title text-3xl leading-tight sm:text-4xl">{s.heroHeadline}</p>
              <p className="mt-6 max-w-xl leading-8 text-muted-foreground">{p.intro}</p>
              <div className="mt-9 flex flex-wrap gap-3">
                <Button asChild size="lg" className="h-12 rounded-full px-7"><a href="#projects">{s.exploreLabel}<ArrowRight /></a></Button>
                <Button asChild size="lg" variant="outline" className="h-12 rounded-full bg-card/70 px-7"><a href={p.cvUrl} download>{s.cvLabel}<ArrowDownToLine /></a></Button>
              </div>
              <div className="mt-7 flex flex-wrap items-center gap-2">
                <IconLink href={getWhatsAppUrl(p.whatsapp)} label="WhatsApp"><MessageCircle /></IconLink>
                <IconLink href={`mailto:${p.email}`} label="Email"><Mail /></IconLink>
                {p.socialLinks.filter((l) => l.url).map((l) => <IconLink key={l.url} href={l.url} label={l.label}><PortfolioIcon name={l.icon || "Link"} /></IconLink>)}
                <span className="ml-2 flex items-center gap-1 text-sm text-muted-foreground"><MapPin className="size-4" />{p.location}</span>
              </div>
            </div>
            <div className="relative mx-auto w-full max-w-[500px] enter-up [animation-delay:120ms]">
              <div className="absolute -inset-5 rounded-[48%_48%_2rem_2rem] border border-rose/25" />
              <div className="absolute -left-8 bottom-16 z-10 hidden rounded-2xl border border-card/70 bg-card/75 p-4 shadow-xl backdrop-blur sm:block">
                <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground">Currently</p>
                <p className="mt-1 text-sm font-semibold">Software Engineering · PAU</p>
              </div>
              <img src={p.portraitUrl} alt={`Portrait of ${p.fullName}`} className="aspect-[4/5] w-full rounded-[48%_48%_2rem_2rem] object-cover shadow-2xl" style={{ objectPosition: `${p.portraitPosition?.[0] ?? 50}% ${p.portraitPosition?.[1] ?? 45}%` }} fetchPriority="high" />
            </div>
          </div>
          <div className="mx-auto max-w-7xl px-5 pb-10 lg:px-8">
            <div className="flex flex-wrap gap-2 rounded-2xl border border-border bg-card/70 p-3 backdrop-blur">
              {content.skillCategories.flatMap((c) => c.skills).filter((x) => x.visible).slice(0, 9).map((x) => <span key={x.name} className="flex items-center gap-2 rounded-full bg-muted px-3 py-2 text-xs"><PortfolioIcon name={x.icon} className="size-3.5 text-rose" />{x.name}</span>)}
            </div>
          </div>
        </section>

        {show("about") && <Section id="about" eyebrow="01 · About" title={s.aboutHeadline}>
          <div className="grid gap-10 lg:grid-cols-[1fr_1.2fr]"><p className="text-lg leading-9 text-muted-foreground">{p.biography}</p>
            <div className="grid gap-4 sm:grid-cols-3 lg:grid-cols-1">{content.capabilities.map((c) => <article key={String(c.title)} className="rounded-2xl border border-border bg-card p-6 transition hover:-translate-y-1 hover:shadow-lg"><span className="font-mono text-xs text-rose">{String(c.number)}</span><h3 className="mt-3 editorial-title text-3xl">{String(c.title)}</h3><p className="mt-3 text-sm leading-6 text-muted-foreground">{String(c.description)}</p></article>)}</div></div>
        </Section>}

        {show("experience") && <Section id="experience" eyebrow="02 · Experience" title="Experience shaped by curiosity and craft.">
          <div className="relative space-y-5 border-l border-rose/25 pl-6 sm:pl-10">{content.experiences.map((e) => <article key={`${e.company}${e.role}`} className="relative rounded-2xl border border-border bg-card p-6"><span className="absolute -left-[31px] top-8 size-3 rounded-full bg-rose ring-8 ring-blush sm:-left-[47px]" /><div className="flex flex-wrap justify-between gap-2"><div><h3 className="text-xl font-semibold">{e.role}</h3><p className="text-rose">{e.company}</p></div><p className="font-mono text-xs text-muted-foreground">{e.dates}<br />{e.location}</p></div><ul className="mt-5 grid gap-2 text-sm leading-6 text-muted-foreground">{e.responsibilities.map((r) => <li key={r}>— {r}</li>)}</ul></article>)}</div>
        </Section>}

        {show("education") && <Section id="education" eyebrow="03 · Education" title="An academic foundation for thoughtful systems.">
          <div className="grid gap-5 md:grid-cols-2">{content.education.map((e) => <article key={e.institution} className="rounded-2xl bg-lavender p-7"><p className="font-mono text-xs text-muted-foreground">{e.dates} · {e.location}</p><h3 className="mt-4 editorial-title text-4xl">{e.institution}</h3><p className="mt-1 font-semibold text-rose">{e.degree}</p><ul className="mt-5 space-y-2 text-sm leading-6">{e.details.map((d) => <li key={d}>{d}</li>)}</ul></article>)}</div>
        </Section>}

        {show("skills") && <Section id="skills" eyebrow="04 · Skills" title="Technical range, grounded in practice.">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">{content.skillCategories.filter((c) => c.visible).map((c) => <article key={c.name} className="rounded-2xl border border-border bg-card p-6"><h3 className="flex items-center gap-3 font-semibold"><PortfolioIcon name={c.icon} className="size-5 text-rose" />{c.name}</h3><div className="mt-5 flex flex-wrap gap-2">{c.skills.filter((x) => x.visible).map((x) => <span key={x.name} className="flex items-center gap-2 rounded-full border border-border px-3 py-2 text-sm"><PortfolioIcon name={x.icon} className="size-4 text-rose" />{x.name}</span>)}</div></article>)}</div>
        </Section>}

        {show("projects") && <Section id="projects" eyebrow="05 · Projects" title="Selected work and contributions.">
          <div className="grid gap-5 lg:grid-cols-3">{content.projects.filter((x) => x.published).map((x, i) => <article key={x.title} className="group overflow-hidden rounded-3xl border border-border bg-card transition hover:-translate-y-1 hover:shadow-xl"><div className="relative aspect-[4/3] overflow-hidden bg-blush">{x.imageUrl ? <img src={x.imageUrl} alt={x.title} loading="lazy" className="size-full object-cover transition duration-500 group-hover:scale-105" /> : <div className="circuit-grid flex size-full items-center justify-center"><span className="editorial-title text-8xl text-rose/30">0{i + 1}</span></div>}</div><div className="p-6"><p className="font-mono text-[10px] uppercase tracking-widest text-rose">{x.category}</p><h3 className="mt-3 text-xl font-semibold">{x.title}</h3><p className="mt-3 text-sm leading-6 text-muted-foreground">{x.description}</p>{x.technologies && <p className="mt-4 text-xs font-medium">{x.technologies}</p>}<div className="mt-5 flex gap-2">{x.projectUrl && <Button asChild size="sm" className="rounded-full"><a href={x.projectUrl} target="_blank" rel="noreferrer">View project</a></Button>}{x.githubUrl && <Button asChild size="sm" variant="outline" className="rounded-full"><a href={x.githubUrl} target="_blank" rel="noreferrer">GitHub</a></Button>}</div></div></article>)}</div>
        </Section>}

        {show("achievements") && <Section id="achievements" eyebrow="06 · Achievements" title="Recognition along the way.">
          <div className="grid gap-px overflow-hidden rounded-3xl border border-border bg-border sm:grid-cols-2">{content.achievements.map((a, i) => <article key={a.title} className="bg-card p-8"><span className="editorial-title text-5xl text-rose/40">0{i + 1}</span><h3 className="mt-4 editorial-title text-3xl">{a.title}</h3><p className="mt-2 text-sm text-muted-foreground">{[a.detail, a.year].filter(Boolean).join(" · ")}</p></article>)}</div>
        </Section>}

        {show("tools") && <Section id="tools" eyebrow="07 · Tools" title="Tools and software I use.">
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">{content.tools.map((t) => <div key={t.name} className="rounded-2xl border border-border bg-card p-5 text-center transition hover:border-rose/50"><PortfolioIcon name={t.icon} className="mx-auto size-7 text-rose" /><p className="mt-3 text-sm font-medium">{t.name}</p><p className="mt-1 font-mono text-[10px] uppercase text-muted-foreground">{t.category}</p></div>)}</div>
        </Section>}

        {show("contact") && <section id="contact" className="px-5 py-24 lg:px-8"><div className="circuit-grid mx-auto max-w-7xl overflow-hidden rounded-[2rem] bg-foreground p-8 text-background sm:p-14"><p className="font-mono text-xs uppercase tracking-[0.25em] text-rose-soft">08 · Contact</p><h2 className="mt-5 max-w-3xl editorial-title text-5xl sm:text-7xl">{s.contactHeadline}</h2><p className="mt-6 max-w-2xl leading-8 text-background/70">{s.contactCopy}</p><div className="mt-10 grid gap-3 md:grid-cols-3">
          <ContactCard href={getWhatsAppUrl(p.whatsapp)} label="WhatsApp" value={p.whatsapp}><MessageCircle /></ContactCard><ContactCard href={getTelephoneUrl(p.phone)} label="Call" value={p.phone}><Phone /></ContactCard><ContactCard href={`mailto:${p.email}`} label="Email" value={p.email}><Mail /></ContactCard></div></div></section>}
      </main>
      <footer className="mx-auto flex max-w-7xl flex-col justify-between gap-4 px-5 py-10 text-sm text-muted-foreground sm:flex-row lg:px-8"><p>© {new Date().getFullYear()} {p.fullName}</p><div className="flex gap-4"><a href="#about">About</a><a href="#projects">Projects</a><a href={p.cvUrl} download>CV</a><Link to="/admin">Admin</Link></div></footer>
    </div>
  );
}

function Section({ id, eyebrow, title, children }: { id: string; eyebrow: string; title: string; children: React.ReactNode }) {
  return <section id={id} className="mx-auto max-w-7xl px-5 py-20 lg:px-8 lg:py-28"><p className="font-mono text-xs uppercase tracking-[0.25em] text-rose">{eyebrow}</p><h2 className="mb-12 mt-4 max-w-3xl editorial-title text-5xl sm:text-6xl">{title}</h2>{children}</section>;
}
function IconLink({ href, label, children }: { href: string; label: string; children: React.ReactNode }) {
  return <Button asChild variant="outline" size="icon" className="rounded-full bg-card/70"><a href={href} aria-label={label} target={href.startsWith("http") ? "_blank" : undefined} rel="noreferrer">{children}</a></Button>;
}
function ContactCard({ href, label, value, children }: { href: string; label: string; value: string; children: React.ReactNode }) {
  return <a href={href} target={href.startsWith("http") ? "_blank" : undefined} rel="noreferrer" className="flex items-center gap-4 rounded-2xl border border-background/15 bg-background/5 p-5 transition hover:bg-background/10 [&_svg]:size-5 [&_svg]:text-rose-soft">{children}<span><span className="block text-xs text-background/60">{label}</span><span className="font-medium">{value}</span></span></a>;
}
function CircuitBloom({ className }: { className?: string }) {
  return <svg viewBox="0 0 500 500" fill="none" className={className} aria-hidden="true"><g stroke="currentColor" strokeWidth="1.5">{Array.from({ length: 8 }).map((_, i) => <g key={i} transform={`rotate(${i * 45} 250 250)`}><path d="M250 250C220 190 220 120 250 70C280 120 280 190 250 250Z" /><path d="M250 70V25H315M250 130H190V95" /><circle cx="315" cy="25" r="5" /><circle cx="190" cy="95" r="4" /></g>)}<circle cx="250" cy="250" r="34" /><circle cx="250" cy="250" r="7" fill="currentColor" /></g></svg>;
}