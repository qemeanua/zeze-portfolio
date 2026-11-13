import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { ArrowLeft, ArrowRight, LoaderCircle, LockKeyhole, Mail } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable/index";

export const Route = createFileRoute("/auth")({
  head: () => ({ meta: [
    { title: "Secure sign in · Queen-Esther Ezinne Emeanua" },
    { name: "description", content: "Private sign-in for Queen-Esther Ezinne Emeanua's portfolio editor." },
    { property: "og:title", content: "Portfolio editor sign in · Queen-Esther Ezinne Emeanua" },
    { property: "og:description", content: "Private sign-in to manage Queen-Esther's portfolio." },
    { property: "og:type", content: "website" },
    { name: "twitter:card", content: "summary" },
  ] }),
  component: AuthPage,
});

function AuthPage() {
  const navigate = useNavigate();
  const [mode, setMode] = useState<"sign-in" | "sign-up">("sign-in");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [checkEmail, setCheckEmail] = useState(false);

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const trimmedEmail = email.trim().toLowerCase();
    if (trimmedEmail !== "ezinne.emm@gmail.com") {
      toast.error("This private portfolio is managed by its owner.");
      return;
    }
    if (password.length < 8 || password.length > 128) {
      toast.error("Use a password between 8 and 128 characters.");
      return;
    }
    setBusy(true);
    try {
      if (mode === "sign-up") {
        const { data, error } = await supabase.auth.signUp({
          email: trimmedEmail,
          password,
          options: { data: { full_name: "Queen-Esther Ezinne Emeanua" }, emailRedirectTo: window.location.origin + "/admin" },
        });
        if (error) throw error;
        if (data.session) {
          await navigate({ to: "/admin" });
          return;
        }
        setCheckEmail(true);
        return;
      }
      const { error } = await supabase.auth.signInWithPassword({ email: trimmedEmail, password });
      if (error) throw error;
      await navigate({ to: "/admin" });
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Sign-in could not be completed.");
    } finally {
      setBusy(false);
    }
  }

  async function social(provider: "google" | "lovable") {
    setBusy(true);
    try {
      const result = await lovable.auth.signInWithOAuth(provider, { redirect_uri: window.location.origin + "/admin" });
      if (result.error) throw result.error;
      if (!result.redirected) await navigate({ to: "/admin" });
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Sign-in could not be completed.");
      setBusy(false);
    }
  }

  return (
    <main className="relative grid min-h-screen overflow-hidden bg-background lg:grid-cols-[1fr_.92fr]">
      <div className="circuit-grid absolute inset-0 opacity-40 [mask-image:linear-gradient(to_bottom,black,transparent)]" />
      <section className="relative hidden min-h-screen flex-col justify-between bg-foreground p-12 text-background lg:flex">
        <Link to="/" className="inline-flex w-fit items-center gap-2 text-sm text-background/70 hover:text-background"><ArrowLeft className="size-4" /> Back to portfolio</Link>
        <div className="max-w-lg"><p className="font-mono text-xs uppercase tracking-[.25em] text-rose-soft">PRIVATE WORKSPACE</p><h1 className="mt-5 editorial-title text-7xl">A considered space for everything you’ve built.</h1><p className="mt-5 leading-8 text-background/70">Keep your experience, selected projects, skills, and personal details current.</p></div>
        <p className="font-mono text-xs text-background/50">QE · QUEEN-ESTHER EZINNE EMEANUA</p>
      </section>
      <section className="relative flex items-center justify-center px-5 py-20">
        <div className="w-full max-w-md">
          <Link to="/" className="inline-flex items-center gap-2 text-sm text-muted-foreground lg:hidden"><ArrowLeft className="size-4" /> Back to portfolio</Link>
          <div className="mb-8 mt-12 size-14 rounded-2xl bg-primary/10 p-4 text-primary lg:mt-0"><LockKeyhole className="size-6" /></div>
          {checkEmail ? <><p className="font-mono text-xs uppercase tracking-[.2em] text-rose">Registration</p><h2 className="mt-3 editorial-title text-5xl">Check your inbox.</h2><p className="mt-5 leading-7 text-muted-foreground">Use the confirmation link sent to your email address, then return here to manage the portfolio.</p><Button asChild variant="outline" className="mt-7 rounded-full"><Link to="/auth">Return to sign in</Link></Button></> : <>
            <p className="font-mono text-xs uppercase tracking-[.2em] text-rose">Owner access</p><h2 className="mt-3 editorial-title text-5xl">{mode === "sign-in" ? "Welcome back." : "Your private workspace."}</h2><p className="mt-4 leading-7 text-muted-foreground">Only the confirmed portfolio owner can edit this website.</p>
            <form onSubmit={submit} className="mt-8 space-y-4">
              <label className="block text-sm font-medium" htmlFor="owner-email">Owner email</label>
              <Input id="owner-email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="email" required maxLength={254} placeholder="Your email address" />
              <label className="block text-sm font-medium" htmlFor="owner-password">Password</label>
              <Input id="owner-password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} autoComplete={mode === "sign-in" ? "current-password" : "new-password"} required minLength={8} maxLength={128} placeholder="At least 8 characters" />
              <Button type="submit" className="h-11 w-full rounded-full" disabled={busy}>{busy ? <LoaderCircle className="animate-spin" /> : mode === "sign-in" ? <LockKeyhole /> : <Mail />}{mode === "sign-in" ? "Sign in securely" : "Create owner account"}</Button>
            </form>
            <div className="my-5 flex items-center gap-3"><span className="h-px flex-1 bg-border" /><span className="font-mono text-[10px] uppercase text-muted-foreground">or continue with</span><span className="h-px flex-1 bg-border" /></div>
            <div className="grid grid-cols-2 gap-3"><Button type="button" variant="outline" className="rounded-full" disabled={busy} onClick={() => void social("google")}>Continue with Google</Button><Button type="button" variant="outline" className="rounded-full" disabled={busy} onClick={() => void social("lovable")}>Continue with Lovable</Button></div>
            <p className="mt-5 text-center text-sm text-muted-foreground">{mode === "sign-in" ? "New owner?" : "Already registered?"} <button type="button" className="font-semibold text-rose underline underline-offset-4" onClick={() => setMode(mode === "sign-in" ? "sign-up" : "sign-in")}>{mode === "sign-in" ? "Create your account" : "Sign in"}</button></p>
          </>}
        </div>
      </section>
    </main>
  );
}