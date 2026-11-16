import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { ArrowDown, ArrowLeft, ArrowUp, BriefcaseBusiness, Check, ChevronRight, FileImage, FileText, FolderKanban, GraduationCap, ImagePlus, LayoutDashboard, LoaderCircle, LogOut, Plus, Save, Settings2, ShieldCheck, Sparkles, Trash2, UserPlus, UserRound, UsersRound, Wrench } from "lucide-react";
import { toast } from "sonner";

import { PortfolioIcon } from "@/components/portfolio/icons";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { portfolioQuery } from "@/routes/index";
import type { AchievementEntry, EducationEntry, ExperienceEntry, PortfolioCollectionName, PortfolioContent, PortfolioEntry, ProfileContent, ProjectEntry, SkillCategory, SkillEntry, ToolEntry } from "@/lib/portfolio-types";

export const Route = createFileRoute("/admin")({
  head: () => ({ meta: [
    { title: "Portfolio editor · Queen-Esther Ezinne Emeanua" },
    { name: "description", content: "Securely manage Queen-Esther's portfolio, skills, projects, and career details." },
    { property: "og:title", content: "Portfolio editor · Queen-Esther Ezinne Emeanua" },
    { property: "og:description", content: "Private website content management." },
    { property: "og:type", content: "website" },
    { name: "twitter:card", content: "summary" },
  ] }),
  component: AdminPage,
});

const navItems = [
  { key: "overview", label: "Overview", icon: LayoutDashboard },
  { key: "profile", label: "Profile", icon: UserRound },
  { key: "experiences", label: "Experience", icon: BriefcaseBusiness },
  { key: "education", label: "Education", icon: GraduationCap },
  { key: "skillCategories", label: "Skills", icon: Sparkles },
  { key: "projects", label: "Projects", icon: FolderKanban },
  { key: "achievements", label: "Achievements", icon: ShieldCheck },
  { key: "tools", label: "Tools", icon: Wrench },
  { key: "appearance", label: "Appearance", icon: Settings2 },
  { key: "editors", label: "Editors", icon: UsersRound },
] as const;
type SectionKey = (typeof navItems)[number]["key"];
type CollectionSectionKey = Exclude<SectionKey, "overview" | "profile" | "appearance" | "skillCategories" | "editors">;

function AdminPage() {
  const [email, setEmail] = useState<string | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [ready, setReady] = useState(false);
  const [section, setSection] = useState<SectionKey>("overview");
  const [mobileNav, setMobileNav] = useState(false);
  const [content, setContent] = useState<PortfolioContent | null>(null);
  const [saving, setSaving] = useState(false);

  async function loadContent() {
    const { data, error } = await supabase.from("portfolio_content").select("content").eq("singleton", true).single();
    if (error) throw error;
    const parsed = data.content as unknown as PortfolioContent;
    if (!parsed || !parsed.profile || !parsed.settings) throw new Error("Portfolio content could not be validated.");
    setContent(parsed);
  }

  useEffect(() => {
    let alive = true;
    async function checkUser() {
      const { data, error } = await supabase.auth.getUser();
      if (!alive) return;
      if (error || !data.user) { setReady(true); return; }
      setEmail(data.user.email ?? null);
      const { data: roles, error: roleError } = await supabase.from("user_roles").select("role").eq("user_id", data.user.id);
      if (!alive) return;
      const allowed = !roleError && roles?.some((r) => r.role === "admin");
      setIsAdmin(allowed);
      if (allowed) {
        try { await loadContent(); }
        catch { if (alive) toast.error("Your saved portfolio could not be opened."); }
      }
      if (alive) setReady(true);
    }
    void checkUser();
    const { data: listener } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "SIGNED_OUT") { setEmail(null); setIsAdmin(false); setContent(null); }
      if (event === "SIGNED_IN" && session?.user) void checkUser();
    });
    return () => { alive = false; listener.subscription.unsubscribe(); };
  }, []);

  async function persist(next: PortfolioContent, success = "Changes saved.") {
    if (!isAdmin) { toast.error("Only the verified portfolio owner can save changes."); return; }
    setSaving(true);
    try {
      const serialized = JSON.stringify(next);
      if (serialized.length > 1_900_000) throw new Error("The content is too large. Please choose smaller images.");
      const { error } = await supabase.from("portfolio_content").update({ content: next as unknown as never, updated_at: new Date().toISOString() }).eq("singleton", true);
      if (error) throw error;
      setContent(next);
      await queryClientInvalidate();
      toast.success(success);
    } catch (error) { toast.error(error instanceof Error ? error.message : "Changes could not be saved."); }
    finally { setSaving(false); }
  }

  async function signOut() { await supabase.auth.signOut(); }

  if (!ready) return <div className="grid min-h-screen place-items-center bg-background"><LoaderCircle className="size-7 animate-spin text-rose" /></div>;
  if (!isAdmin) return <main className="grid min-h-screen place-items-center bg-background px-5"><div className="w-full max-w-lg rounded-3xl border border-border bg-card p-8 text-center"><div className="mx-auto grid size-14 place-items-center rounded-full bg-blush text-rose"><ShieldCheck /></div><h1 className="mt-6 editorial-title text-5xl">{email ? "Editor access only." : "Your private workspace."}</h1><p className="mt-4 leading-7 text-muted-foreground">{email ? "This account does not have editor access yet. Ask a portfolio administrator to grant access to this email, then sign out and sign in again." : "Sign in with an invited email account to manage the portfolio."}</p><div className="mt-7 flex justify-center gap-3">{email && <Button variant="outline" className="rounded-full" onClick={() => void signOut()}><LogOut />Sign out</Button>}<Button asChild className="rounded-full"><Link to="/auth">Go to sign in<ChevronRight /></Link></Button></div><Link to="/" className="mt-6 inline-block text-sm text-muted-foreground underline underline-offset-4">Back to portfolio</Link></div></main>;

  if (!content) return <main className="grid min-h-screen place-items-center"><div className="text-center"><p>Portfolio content could not be loaded.</p><Button className="mt-3" onClick={() => void loadContent().catch(() => toast.error("Please try again."))}>Try again</Button></div></main>;

  const activeLabel = navItems.find((item) => item.key === section)?.label ?? "Overview";
  const counts = { projects: content.projects.length, skills: content.skillCategories.reduce((n, c) => n + c.skills.length, 0), experience: content.experiences.length, achievements: content.achievements.length };

  return <main className="min-h-screen bg-muted/30 lg:flex">
    <aside className={`${mobileNav ? "fixed inset-0 z-50 flex" : "hidden"} border-r border-border bg-card lg:sticky lg:top-0 lg:flex lg:h-screen lg:w-64 lg:shrink-0 lg:flex-col`}>
      <div className="flex items-center justify-between border-b border-border p-5"><Link to="/" className="flex items-center gap-3"><span className="editorial-title text-3xl text-rose">QE</span><span><span className="block text-sm font-semibold">Portfolio studio</span><span className="block text-xs text-muted-foreground">Private workspace</span></span></Link><Button variant="ghost" size="icon" aria-label="Close menu" className="lg:hidden" onClick={() => setMobileNav(false)}>×</Button></div>
      <nav className="flex-1 space-y-1 overflow-y-auto p-3" aria-label="Dashboard sections">{navItems.map((n) => <button key={n.key} type="button" onClick={() => { setSection(n.key); setMobileNav(false); }} className={`flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm transition ${section === n.key ? "bg-secondary text-secondary-foreground" : "text-muted-foreground hover:bg-muted hover:text-foreground"}`}><n.icon className="size-4" />{n.label}</button>)}</nav>
      <div className="border-t border-border p-4"><p className="truncate text-xs text-muted-foreground">{email}</p><Button variant="ghost" className="mt-2 w-full justify-start" onClick={() => void signOut()}><LogOut />Sign out</Button></div>
    </aside>

    <div className="min-w-0 flex-1">
      <header className="sticky top-0 z-30 flex items-center justify-between border-b border-border bg-background/90 px-4 py-3 backdrop-blur-lg sm:px-8"><div className="flex items-center gap-3"><Button variant="outline" size="icon" className="lg:hidden" aria-label="Open menu" onClick={() => setMobileNav(true)}>☰</Button><span className="font-mono text-[10px] uppercase tracking-[.2em] text-rose">Portfolio studio</span><span className="hidden text-muted-foreground sm:inline">/</span><span className="hidden text-sm font-medium sm:inline">{activeLabel}</span></div><Button asChild variant="outline" size="sm" className="rounded-full"><Link to="/">View website<ArrowRightSmall /></Link></Button></header>
      <div className="mx-auto max-w-6xl px-4 py-8 sm:px-8 sm:py-10">
        <div className="mb-8"><p className="font-mono text-xs uppercase tracking-[.2em] text-rose">Queen-Esther Ezinne Emeanua</p><h1 className="mt-2 editorial-title text-5xl">{section === "overview" ? "Your portfolio, thoughtfully." : `Edit ${activeLabel.toLowerCase()}.`}</h1><p className="mt-3 text-sm text-muted-foreground">Your changes appear on the public website when saved.</p></div>
        {section === "overview" ? <Overview counts={counts} onSelect={setSection} content={content} /> : section === "profile" ? <ProfileEditor profile={content.profile} saving={saving} onSave={(profile) => void persist({ ...content, profile })} /> : section === "appearance" ? <AppearanceEditor content={content} saving={saving} onSave={(next) => void persist(next)} /> : section === "editors" ? <EditorAccessForm /> : section === "skillCategories" ? <SkillsEditor categories={content.skillCategories} saving={saving} onSave={(skillCategories) => void persist({ ...content, skillCategories })} /> : <CollectionEditor key={section} collection={section} entries={content[section as PortfolioCollectionName] as PortfolioEntry[]} saving={saving} onSave={(entries) => void persist({ ...content, [section]: entries } as PortfolioContent)} />}
      </div>
    </div>
  </main>;
}

function EditorAccessForm() {
  const [email, setEmail] = useState("");
  const [busy, setBusy] = useState(false);

  async function grantAccess(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const normalizedEmail = email.trim().toLowerCase();
    if (!normalizedEmail) return;

    setBusy(true);
    try {
      const { error } = await supabase.rpc("invite_portfolio_admin", { target_email: normalizedEmail });
      if (error) throw error;
      toast.success("Editor access is set. They can sign in with this email or Google.");
      setEmail("");
    } catch {
      toast.error("Access could not be granted. Confirm you are an administrator and try again.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="max-w-2xl rounded-2xl border border-border bg-card p-6 sm:p-8">
      <div className="flex size-12 items-center justify-center rounded-2xl bg-primary/10 text-primary"><UserPlus /></div>
      <h2 className="mt-5 editorial-title text-3xl">Give a trusted editor access.</h2>
      <p className="mt-3 max-w-xl leading-7 text-muted-foreground">Add their email address to let them manage this portfolio. Existing confirmed accounts get access immediately; new accounts get access after confirming their email.</p>
      <form onSubmit={grantAccess} className="mt-7 flex flex-col gap-4 sm:flex-row sm:items-end">
        <div className="flex-1">
          <label className="mb-2 block text-sm font-medium" htmlFor="editor-email">Editor email</label>
          <Input id="editor-email" type="email" autoComplete="email" required maxLength={254} value={email} onChange={(event) => setEmail(event.target.value)} placeholder="editor@example.com" />
        </div>
        <Button type="submit" disabled={busy} className="rounded-full sm:min-w-40">
          {busy ? <LoaderCircle className="animate-spin" /> : <UserPlus />}
          {busy ? "Granting access…" : "Grant access"}
        </Button>
      </form>
      <p className="mt-4 text-xs leading-5 text-muted-foreground">Only an existing portfolio administrator can grant access. After access is granted, the editor should sign out and sign in again if they already had a session.</p>
    </section>
  );
}

function ArrowRightSmall() { return <ChevronRight className="size-4" />; }
async function queryClientInvalidate() { await import("@/integrations/supabase/client").then(() => undefined); }

function Overview({ counts, onSelect, content }: { counts: { projects: number; skills: number; experience: number; achievements: number }; onSelect: (key: SectionKey) => void; content: PortfolioContent }) {
  const cards = [{ key: "projects", label: "Projects", count: counts["projects"], icon: FolderKanban }, { key: "skillCategories", label: "Technologies", count: counts["skills"], icon: Sparkles }, { key: "experiences", label: "Experience", count: counts["experience"], icon: BriefcaseBusiness }, { key: "achievements", label: "Achievements", count: counts["achievements"], icon: ShieldCheck }] as const;
  const profile = content["profile"];
  return <div className="space-y-8"><div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">{cards.map((card) => <button key={card.key} type="button" onClick={() => onSelect(card.key)} className="rounded-2xl border border-border bg-card p-5 text-left transition hover:border-rose/40 hover:shadow-md"><card.icon className="size-5 text-rose" /><p className="mt-5 font-mono text-xs uppercase tracking-widest text-muted-foreground">{card.label}</p><p className="mt-2 editorial-title text-5xl">{card.count}</p><p className="mt-3 flex items-center gap-1 text-xs text-rose">Manage {card.label.toLowerCase()}<ChevronRight className="size-3" /></p></button>)}</div><div className="grid gap-5 lg:grid-cols-2"><div className="rounded-2xl border border-border bg-card p-6"><p className="font-mono text-xs uppercase tracking-widest text-rose">Portfolio status</p><div className="mt-5 flex items-center gap-3"><span className="grid size-10 place-items-center rounded-full bg-green-100 text-green-800"><Check className="size-5" /></span><div><p className="font-semibold">Live content is ready</p><p className="mt-1 text-xs text-muted-foreground">Your profile and project details are saved online.</p></div></div><Button variant="outline" className="mt-6 w-full rounded-full" onClick={() => onSelect("profile")}>Review your profile</Button></div><div className="rounded-2xl border border-border bg-card p-6"><p className="font-mono text-xs uppercase tracking-widest text-rose">Profile snapshot</p><div className="mt-5 flex items-center gap-4"><img src={profile.portraitUrl} alt="Your portfolio portrait" className="size-16 rounded-full object-cover" /><div><p className="font-semibold">{profile.fullName}</p><p className="text-sm text-muted-foreground">{profile.title}</p><p className="mt-1 text-xs text-muted-foreground">{profile.location}</p></div></div></div></div></div>;
}

function ProfileEditor({ profile, saving, onSave }: { profile: ProfileContent; saving: boolean; onSave: (profile: ProfileContent) => void }) {
  const [draft, setDraft] = useState(profile);
  const [uploading, setUploading] = useState(false);
  const [portraitPreview, setPortraitPreview] = useState<string | null>(null);
  const set = (key: keyof ProfileContent, value: string) => setDraft((prev) => ({ ...prev, [key]: value }));

  async function upload(file: File | undefined, type: "portrait" | "cv") {
    if (!file) return;
    const maxSize = type === "portrait" ? 8 * 1024 * 1024 : 15 * 1024 * 1024;
    if (file.size > maxSize) { toast.error(type === "portrait" ? "Choose a portrait under 8 MB." : "Choose a CV under 15 MB."); return; }
    if (type === "cv" && file.type !== "application/pdf") { toast.error("Choose a PDF file for your CV."); return; }
    if (type === "portrait" && !["image/jpeg", "image/png", "image/webp"].includes(file.type)) { toast.error("Use a JPG, PNG, or WebP portrait."); return; }
    setUploading(true);
    try {
      let finalFile = file;
      if (type === "portrait") {
        finalFile = await compressPortrait(file);
        setPortraitPreview(URL.createObjectURL(finalFile));
      }
      const ext = type === "cv" ? "pdf" : "webp";
      const path = `${type}/${crypto.randomUUID()}.${ext}`;
      const { error } = await supabase.storage.from("portfolio-media").upload(path, finalFile, { contentType: type === "cv" ? "application/pdf" : "image/webp", upsert: false });
      if (error) throw error;
      const { data } = supabase.storage.from("portfolio-media").getPublicUrl(path, type === "cv" ? { download: "Queen-Esther-Ezinne-Emeanua-CV.pdf" } : undefined);
      if (type === "cv") set("cvUrl", data.publicUrl); else set("portraitUrl", data.publicUrl);
      toast.success(type === "cv" ? "CV uploaded. Save your profile to publish it." : "Portrait uploaded. Save your profile to publish it.");
    } catch (error) { toast.error(error instanceof Error ? error.message : "The file could not be uploaded."); }
    finally { setUploading(false); }
  }

  return <form className="space-y-6" onSubmit={(e) => { e.preventDefault(); onSave(draft); }}>
    <div className="grid gap-6 lg:grid-cols-[1.15fr_.85fr]"><fieldset className="space-y-4 rounded-2xl border border-border bg-card p-5 sm:p-7"><legend className="px-2 font-semibold">Personal details</legend>{([["fullName","Full name"],["title","Professional title"],["location","Location"],["email","Email"],["phone","Phone"],["whatsapp","WhatsApp"]] as const).map(([key,label]) => <Field key={key} label={label}><Input required maxLength={180} value={draft[key]} onChange={(e) => set(key,e.target.value)} /></Field>)}<Field label="Short introduction"><Textarea required rows={4} maxLength={1500} value={draft.intro} onChange={(e) => set("intro",e.target.value)} /></Field><Field label="Biography"><Textarea required rows={6} maxLength={5000} value={draft.biography} onChange={(e) => set("biography",e.target.value)} /></Field><SocialLinksEditor links={draft.socialLinks} onChange={(socialLinks) => setDraft((p) => ({ ...p, socialLinks }))} /></fieldset>
      <div className="space-y-6"><fieldset className="rounded-2xl border border-border bg-card p-5 sm:p-7"><legend className="px-2 font-semibold">Portrait</legend><img src={portraitPreview ?? draft.portraitUrl} alt="Portrait preview" className="aspect-[4/5] w-full rounded-2xl object-cover" style={{ objectPosition: `${draft.portraitPosition?.[0] ?? 50}% ${draft.portraitPosition?.[1] ?? 45}%` }} /><div className="mt-5 flex items-center justify-between gap-3"><span className="text-sm font-medium">Vertical crop</span><span className="font-mono text-xs text-muted-foreground">{draft.portraitPosition?.[1] ?? 45}%</span></div><input aria-label="Portrait vertical crop position" type="range" min="0" max="100" value={draft.portraitPosition?.[1] ?? 45} onChange={(e) => setDraft((p) => ({ ...p, portraitPosition: [p.portraitPosition?.[0] ?? 50, Number(e.target.value)] }))} className="mt-3 w-full accent-rose" /><label className="mt-5 flex cursor-pointer items-center justify-center gap-2 rounded-full border border-border px-4 py-3 text-sm hover:bg-muted"><ImagePlus className="size-4" />{uploading ? "Uploading…" : "Replace portrait"}<input type="file" accept="image/jpeg,image/png,image/webp" className="sr-only" disabled={uploading} onChange={(e) => void upload(e.target.files?.[0], "portrait")} /></label><p className="mt-2 text-center text-xs text-muted-foreground">JPG, PNG, or WebP · up to 8 MB · resized for the web</p></fieldset>
      <fieldset className="rounded-2xl border border-border bg-card p-5 sm:p-7"><legend className="px-2 font-semibold">Downloadable CV</legend><p className="break-all text-xs text-muted-foreground">{draft.cvUrl}</p><label className="mt-4 flex cursor-pointer items-center justify-center gap-2 rounded-full border border-border px-4 py-3 text-sm hover:bg-muted"><FileText className="size-4" />{uploading ? "Uploading…" : "Replace CV PDF"}<input type="file" accept="application/pdf,.pdf" className="sr-only" disabled={uploading} onChange={(e) => void upload(e.target.files?.[0], "cv")} /></label><p className="mt-2 text-center text-xs text-muted-foreground">PDF only · up to 15 MB · takes effect when you save</p></fieldset></div>
    </div><SaveBar saving={saving || uploading} /></form>;
}

async function compressPortrait(file: File): Promise<File> {
  const image = await createImageBitmap(file);
  const scale = Math.min(1, 1500 / Math.max(image.width, image.height));
  const canvas = document.createElement("canvas");
  canvas.width = Math.round(image.width * scale); canvas.height = Math.round(image.height * scale);
  const ctx = canvas.getContext("2d"); if (!ctx) throw new Error("This photo could not be prepared.");
  ctx.drawImage(image, 0, 0, canvas.width, canvas.height); image.close();
  const blob = await new Promise<Blob>((resolve, reject) => canvas.toBlob((out) => out ? resolve(out) : reject(new Error("This photo could not be prepared.")), "image/webp", 0.84));
  return new File([blob], "portfolio-portrait.webp", { type: "image/webp" });
}

function SocialLinksEditor({ links, onChange }: { links: ProfileContent["socialLinks"]; onChange: (links: ProfileContent["socialLinks"]) => void }) {
  return <div className="border-t border-border pt-5"><div className="flex items-center justify-between"><p className="text-sm font-semibold">LinkedIn & GitHub profiles</p><Button type="button" variant="outline" size="sm" className="rounded-full" onClick={() => onChange([...links, { label: "LinkedIn", url: "", icon: "Linkedin" }])}><Plus />Add</Button></div><p className="mt-1 text-xs text-muted-foreground">Only real links are shown publicly; empty links stay hidden.</p>{links.map((l, i) => <div key={i} className="mt-3 grid gap-2 sm:grid-cols-[.65fr_1.3fr_auto]"><Input aria-label="Social platform" maxLength={40} value={l.label} onChange={(e) => onChange(links.map((v,j) => i === j ? { ...v,label:e.target.value,icon:e.target.value.toLowerCase().includes("github") ? "Github" : "Linkedin" } : v))} /><Input aria-label="Social profile URL" type="url" maxLength={500} placeholder="https://…" value={l.url} onChange={(e) => onChange(links.map((v,j) => i === j ? { ...v,url:e.target.value } : v))} /><Button type="button" size="icon" variant="ghost" aria-label={`Remove ${l.label}`} onClick={() => onChange(links.filter((_,j) => i !== j))}><Trash2 className="text-destructive" /></Button></div>)}</div>;
}

type FieldProps = { label: string; children: React.ReactNode };
function Field({ label, children }: FieldProps) { return <div className="space-y-2"><Label>{label}</Label>{children}</div>; }

const fieldsByCollection: Record<CollectionSectionKey, string[]> = {
  experiences: ["role","company","dates","location","responsibilities"],
  education: ["degree","institution","dates","location","details"],
  projects: ["title","slug","category","description","fullDescription","problem","features","screenshots","technologies","learnings","imageUrl","projectUrl","githubUrl","featured","published"],
  achievements: ["title","detail","year"],
  tools: ["name","category","icon"],
};
const templates: Partial<Record<PortfolioCollectionName, PortfolioEntry>> = {
  experiences: { role:"",company:"",dates:"",location:"",responsibilities:[] },
  education: { degree:"",institution:"",dates:"",location:"",details:[] },
  projects: { title:"",slug:"",category:"Project",description:"",fullDescription:"",problem:"",features:[],screenshots:[],technologies:"",learnings:"",imageUrl:"",projectUrl:"",githubUrl:"",featured:false,published:true },
  achievements: { title:"",detail:"",year:"" },
  tools: { name:"",category:"Development",icon:"Wrench" },
};

function CollectionEditor({ collection, entries, saving, onSave }: { collection: CollectionSectionKey; entries: PortfolioEntry[]; saving: boolean; onSave: (entries: PortfolioEntry[]) => void }) {
  const fields = fieldsByCollection[collection];
  const [draft, setDraft] = useState(() => structuredClone(entries));
  const [open, setOpen] = useState<number | null>(draft.length ? 0 : null);
  const [filter, setFilter] = useState("");
  const shown = useMemo(() => draft.map((row, index) => ({ row, index })).filter(({ row }) => JSON.stringify(row).toLowerCase().includes(filter.toLowerCase())), [draft,filter]);
  function patch(index: number, key: string, value: string | boolean | string[]) { setDraft((p) => p.map((v,i) => i === index ? { ...v,[key]:value } : v)); }
  function add() { setDraft((p) => [...p, structuredClone(templates[collection] ?? {})]); setOpen(draft.length); setFilter(""); }
  function move(index: number, direction: -1 | 1) { setDraft((p) => { const next = [...p]; const to = index + direction; if (to < 0 || to >= next.length) return p; const current = next[index]; const target = next[to]; if (!current || !target) return p; next[index] = target; next[to] = current; return next; }); setOpen(index + direction); }
  const heading = navItems.find((x) => x.key === collection)?.label ?? "Content";

  return <div className="space-y-5"><div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-border bg-card p-4"><div><p className="font-semibold">{draft.length} {heading.toLowerCase()} {draft.length === 1 ? "entry" : "entries"}</p><p className="mt-1 text-xs text-muted-foreground">Drag-free ordering with position controls.</p></div><div className="flex gap-2"><Input aria-label={`Search ${heading.toLowerCase()}`} value={filter} onChange={(e) => setFilter(e.target.value)} placeholder="Find an entry" className="max-w-40" /><Button onClick={add} className="rounded-full"><Plus />Add {heading.replace(/s$/, "")}</Button></div></div>
    {!shown.length && <div className="rounded-2xl border border-dashed border-border bg-card px-6 py-12 text-center"><FileImage className="mx-auto size-8 text-rose" /><p className="mt-4 font-medium">{filter ? "No matching entries." : `No ${heading.toLowerCase()} yet.`}</p><p className="mt-2 text-sm text-muted-foreground">{filter ? "Try a different search." : "Add your first entry when you are ready."}</p>{!filter && <Button className="mt-5 rounded-full" onClick={add}><Plus />Add an entry</Button>}</div>}
    {shown.map(({row,index}) => <article key={`${collection}-${index}`} className="overflow-hidden rounded-2xl border border-border bg-card"><div className="flex items-center gap-2 p-3 sm:p-4"><button type="button" className="flex min-w-0 flex-1 items-center gap-3 text-left" onClick={() => setOpen(open === index ? null : index)}><span className="grid size-9 shrink-0 place-items-center rounded-xl bg-blush font-mono text-xs text-rose">{String(index + 1).padStart(2,"0")}</span><span className="min-w-0"><span className="block truncate font-semibold">{firstString(row, fields[0] ?? "title") || `Untitled ${heading.replace(/s$/,"")}`}</span><span className="block truncate text-xs text-muted-foreground">{firstString(row, fields[1] ?? "description")}</span></span></button><Button size="icon" variant="ghost" aria-label="Move entry up" disabled={index === 0} onClick={() => move(index,-1)}><ArrowUp /></Button><Button size="icon" variant="ghost" aria-label="Move entry down" disabled={index === draft.length-1} onClick={() => move(index,1)}><ArrowDown /></Button><Button size="icon" variant="ghost" aria-label="Remove entry" onClick={() => { setDraft((p)=>p.filter((_,i)=>i!==index)); setOpen(null); }}><Trash2 className="text-destructive" /></Button></div>{open === index && <div className="grid gap-4 border-t border-border p-5 sm:grid-cols-2">{fields.map((key) => <EntryField key={key} field={key} value={row[key]} onChange={(v) => patch(index,key,v)} />)}</div>}</article>)}
    <SaveBar saving={saving} onSave={() => onSave(draft)} /></div>;
}

async function compressProjectScreenshot(file: File) {
  const image = await createImageBitmap(file);
  const scale = Math.min(1, 1800 / Math.max(image.width, image.height));
  const canvas = document.createElement("canvas");
  canvas.width = Math.round(image.width * scale);
  canvas.height = Math.round(image.height * scale);
  const context = canvas.getContext("2d");
  if (!context) throw new Error("This screenshot could not be prepared.");
  context.drawImage(image, 0, 0, canvas.width, canvas.height);
  image.close();
  const blob = await new Promise<Blob>((resolve, reject) => canvas.toBlob((result) => result ? resolve(result) : reject(new Error("This screenshot could not be prepared.")), "image/webp", 0.84));
  return new File([blob], "project-screenshot.webp", { type: "image/webp" });
}

function EntryField({ field, value, onChange }: { field: string; value: PortfolioEntry[string]; onChange: (value: string | boolean | string[]) => void }) {
  const [uploading, setUploading] = useState(false);
  const fieldId = `project-${field}`;

  async function uploadScreenshot(file: File | undefined) {
    if (!file) return;
    const allowedTypes = ["image/jpeg", "image/png", "image/webp"];
    if (!allowedTypes.includes(file.type)) { toast.error("Use a JPG, PNG, or WebP screenshot."); return; }
    if (file.size > 8 * 1024 * 1024) { toast.error("Choose a screenshot under 8 MB."); return; }
    const currentScreenshots = Array.isArray(value) ? value.filter((item): item is string => typeof item === "string") : [];
    if (currentScreenshots.length >= 40) { toast.error("A project can have up to 40 screenshots."); return; }

    setUploading(true);
    try {
      const optimizedFile = await compressProjectScreenshot(file);
      const path = `projects/${crypto.randomUUID()}.webp`;
      const { error } = await supabase.storage.from("portfolio-media").upload(path, optimizedFile, {
        contentType: "image/webp",
        cacheControl: "31536000",
        upsert: false,
      });
      if (error) throw error;
      const { data } = supabase.storage.from("portfolio-media").getPublicUrl(path);
      onChange([...currentScreenshots, data.publicUrl]);
      toast.success("Screenshot uploaded. Save changes to publish it.");
    } catch {
      toast.error("The screenshot could not be uploaded. Check that you are signed in as the portfolio owner.");
    } finally {
      setUploading(false);
    }
  }

  if (typeof value === "boolean") return <label className="flex items-center gap-3 rounded-xl border border-border p-3 text-sm"><input type="checkbox" checked={value} onChange={(e) => onChange(e.target.checked)} className="size-4 accent-rose" />{formatLabel(field)}</label>;
  if (Array.isArray(value)) return <div className="space-y-2 sm:col-span-2"><Label htmlFor={fieldId}>{field === "screenshots" ? "Screenshots · one image per line" : `${formatLabel(field)} · one item per line`}</Label><Textarea id={fieldId} rows={Math.min(10,Math.max(4,value.length))} maxLength={field === "screenshots" ? 24000 : 8000} value={value.join("\n")} disabled={field === "screenshots" && uploading} onChange={(e) => onChange(e.target.value.split("\n").map((item) => item.trim()).filter(Boolean).slice(0,40))} placeholder={field === "screenshots" ? "https://… or /images/project-screen.webp" : undefined} />{field === "screenshots" && <><div className="flex flex-wrap items-center justify-between gap-3"><p className="text-xs text-muted-foreground">Upload an image or paste a public URL. Up to 40 screenshots.</p><label className="inline-flex cursor-pointer items-center gap-2 rounded-full border border-border px-4 py-2 text-sm transition hover:bg-muted"><FileImage className="size-4" />{uploading ? "Uploading…" : "Upload screenshot"}<input className="sr-only" type="file" accept="image/jpeg,image/png,image/webp" aria-label="Upload project screenshot" disabled={uploading} onChange={(event) => { void uploadScreenshot(event.target.files?.[0]); event.currentTarget.value = ""; }} /></label></div><div className="grid gap-3 sm:grid-cols-3">{value.filter((url): url is string => typeof url === "string" && isSafeImageSource(url)).map((url, index) => <img key={`${url}-${index}`} src={url} alt={`Project screenshot ${index + 1}`} loading="lazy" className="aspect-video w-full rounded-xl border border-border object-cover" />)}</div></>}</div>;
  if (["description","fullDescription","problem","learnings"].includes(field)) return <div className="space-y-2 sm:col-span-2"><Label htmlFor={fieldId}>{field === "problem" ? "Problem solved" : field === "learnings" ? "What I learned" : formatLabel(field)}</Label><Textarea id={fieldId} required={field === "description"} rows={field === "description" ? 4 : 6} maxLength={field === "description" ? 3000 : 12000} value={String(value ?? "")} onChange={(e) => onChange(e.target.value)} /></div>;
  if (["imageUrl"].includes(field)) return <div className="space-y-2 sm:col-span-2"><Label htmlFor={fieldId}>{formatLabel(field)}</Label><Input id={fieldId} maxLength={1000} type="url" value={String(value ?? "")} onChange={(e) => onChange(e.target.value)} placeholder="Optional public image link" /><p className="text-xs text-muted-foreground">A URL you provide; this form does not invent project images.</p></div>;
  const type = field.toLowerCase().endsWith("url") ? "url" : "text";
  return <div className="space-y-2"><Label htmlFor={fieldId}>{formatLabel(field)}</Label><Input id={fieldId} maxLength={field.toLowerCase().includes("url") ? 1000 : 500} type={type} value={String(value ?? "")} onChange={(e) => onChange(e.target.value)} /></div>;
}

function isSafeImageSource(value: string) {
  if (value.startsWith("/")) return true;
  try { return new URL(value).protocol === "https:"; }
  catch { return false; }
}
function formatLabel(key: string) { return key.replace(/([A-Z])/g," $1").replace(/^./, (s)=>s.toUpperCase()); }
function firstString(row: PortfolioEntry,key:string):string { return typeof row[key] === "string" ? row[key] as string : ""; }

function SkillsEditor({ categories, saving, onSave }: { categories: SkillCategory[]; saving: boolean; onSave: (categories: SkillCategory[]) => void }) {
  const [draft, setDraft] = useState(() => structuredClone(categories));
  function updateCategory(index: number, patch: Partial<SkillCategory>) { setDraft((p)=>p.map((c,i)=>i===index?{...c,...patch}:c)); }
  function updateSkill(catIndex: number, skillIndex: number, patch: Partial<SkillEntry>) { setDraft((p)=>p.map((c,i)=>i===catIndex?{...c,skills:c.skills.map((s,j)=>j===skillIndex?{...s,...patch}:s)}:c)); }
  return <div className="space-y-5"><div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-border bg-card p-5"><div><p className="font-semibold">Technology showcase</p><p className="mt-1 text-xs text-muted-foreground">Organize your verified technologies and professional strengths.</p></div><Button className="rounded-full" onClick={() => setDraft((p)=>[...p,{name:"New category",icon:"Sparkles",visible:true,skills:[]}])}><Plus />Add category</Button></div>
    {draft.map((category, ci) => <details key={`${ci}-${category.name}`} open={ci===0} className="rounded-2xl border border-border bg-card"><summary className="flex cursor-pointer list-none items-center gap-3 p-4"><PortfolioIcon name={category.icon} className="size-5 text-rose"/><span className="flex-1 truncate font-semibold">{category.name}</span><span className="text-xs text-muted-foreground">{category.skills.length} technologies</span><button type="button" aria-label="Delete category" className="ml-2 rounded p-2 text-destructive hover:bg-muted" onClick={(e)=>{e.preventDefault();setDraft((p)=>p.filter((_,i)=>i!==ci));}}>×</button></summary><div className="space-y-4 border-t border-border p-5"><div className="grid gap-3 sm:grid-cols-[1fr_1fr_auto]"><Field label="Category"><Input value={category.name} maxLength={80} onChange={(e)=>updateCategory(ci,{name:e.target.value})}/></Field><Field label="Icon name"><Input value={category.icon} maxLength={40} onChange={(e)=>updateCategory(ci,{icon:e.target.value})}/></Field><label className="flex items-end gap-2 pb-2 text-sm"><input type="checkbox" checked={category.visible} onChange={(e)=>updateCategory(ci,{visible:e.target.checked})} className="size-4 accent-rose"/>Visible</label></div><div className="grid gap-2 sm:grid-cols-2">{category.skills.map((skill,si)=><div key={`${si}-${skill.name}`} className="grid gap-2 rounded-xl border border-border p-3 sm:grid-cols-[1fr_.8fr_auto_auto]"><Input aria-label="Technology name" maxLength={100} value={skill.name} onChange={(e)=>updateSkill(ci,si,{name:e.target.value})}/><Input aria-label="Icon name" maxLength={40} value={skill.icon} onChange={(e)=>updateSkill(ci,si,{icon:e.target.value})}/><label className="flex items-center gap-2 text-xs"><input type="checkbox" checked={skill.visible} onChange={(e)=>updateSkill(ci,si,{visible:e.target.checked})} className="accent-rose"/>Show</label><Button type="button" size="icon" variant="ghost" aria-label={`Delete ${skill.name}`} onClick={()=>updateCategory(ci,{skills:category.skills.filter((_,i)=>i!==si)})}><Trash2 className="text-destructive"/></Button></div>)}</div><Button type="button" variant="outline" size="sm" className="rounded-full" onClick={()=>updateCategory(ci,{skills:[...category.skills,{name:"New technology",icon:"Code",visible:true}]})}><Plus/>Add technology</Button></div></details>)}<SaveBar saving={saving} onSave={()=>onSave(draft)}/></div>;
}

function AppearanceEditor({ content, saving, onSave }: { content: PortfolioContent; saving: boolean; onSave: (content: PortfolioContent) => void }) {
  const [draft,setDraft]=useState(()=>structuredClone(content));
  const textFields: [string,string][]=[["heroHeadline","Hero headline"],["aboutHeadline","About heading"],["contactHeadline","Contact heading"],["contactCopy","Contact message"],["exploreLabel","Work button"],["cvLabel","CV button"]];
  return <form className="space-y-6" onSubmit={(e)=>{e.preventDefault();onSave(draft);}}><div className="rounded-2xl border border-border bg-card p-5 sm:p-7"><h2 className="font-semibold">Page text</h2><p className="mt-1 text-sm text-muted-foreground">Update the headlines and short messages used across your website.</p><div className="mt-6 grid gap-5 sm:grid-cols-2">{textFields.map(([key,label])=><Field key={key} label={label}>{key.endsWith("Copy")||key.endsWith("Headline")?<Textarea rows={key.endsWith("Copy")?4:2} maxLength={500} value={String(draft.settings[key]??"")} onChange={(e)=>setDraft((p)=>({...p,settings:{...p.settings,[key]:e.target.value}}))}/>:<Input maxLength={80} value={String(draft.settings[key]??"")} onChange={(e)=>setDraft((p)=>({...p,settings:{...p.settings,[key]:e.target.value}}))}/>}</Field>)}</div></div><div className="rounded-2xl border border-border bg-card p-5 sm:p-7"><h2 className="font-semibold">Visible sections</h2><p className="mt-1 text-sm text-muted-foreground">Turn an entire section on or off on the public website.</p><div className="mt-5 grid gap-3 sm:grid-cols-2">{Object.entries(draft.settings.visibleSections).map(([key,value])=><label key={key} className="flex items-center gap-3 rounded-xl border border-border p-3 text-sm"><input type="checkbox" checked={value} onChange={(e)=>setDraft((p)=>({...p,settings:{...p.settings,visibleSections:{...p.settings.visibleSections,[key]:e.target.checked}}}))} className="size-4 accent-rose"/>{formatLabel(key)}</label>)}</div></div><SaveBar saving={saving} onSave={()=>onSave(draft)}/></form>;
}

function SaveBar({ saving, onSave }: { saving: boolean; onSave?: () => void }) { return <div className="sticky bottom-3 z-20 flex items-center justify-between gap-3 rounded-2xl border border-border bg-background/95 p-3 shadow-lg backdrop-blur"><p className="hidden text-xs text-muted-foreground sm:block">Saved content appears on your public website.</p><Button type={onSave ? "button" : "submit"} className="ml-auto min-w-36 rounded-full" disabled={saving} onClick={onSave}>{saving?<LoaderCircle className="animate-spin"/>:<Save/>}{saving?"Saving…":"Save changes"}</Button></div>; }
