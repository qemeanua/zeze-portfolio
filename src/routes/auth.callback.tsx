import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { ArrowLeft, LoaderCircle, ShieldCheck } from "lucide-react";

import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/auth/callback")({
  head: () => ({
    meta: [
      { title: "Confirming owner access · Queen-Esther Ezinne Emeanua" },
      { name: "description", content: "Confirming secure access to the private portfolio editor." },
    ],
  }),
  component: AuthCallbackPage,
});

function AuthCallbackPage() {
  const navigate = useNavigate();
  const [error, setError] = useState(false);

  useEffect(() => {
    let active = true;

    async function finishConfirmation() {
      const params = new URLSearchParams(window.location.search);
      const code = params.get("code");
      if (!code || params.has("error")) {
        if (active) setError(true);
        return;
      }

      const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);
      if (!active) return;
      if (exchangeError) {
        setError(true);
        return;
      }
      await navigate({ to: "/admin", replace: true });
    }

    void finishConfirmation().catch(() => {
      if (active) setError(true);
    });
    return () => {
      active = false;
    };
  }, [navigate]);

  return (
    <main className="grid min-h-screen place-items-center bg-background px-5">
      <div className="w-full max-w-lg rounded-3xl border border-border bg-card p-8 text-center sm:p-10">
        <div className="mx-auto grid size-14 place-items-center rounded-full bg-blush text-rose">
          {error ? (
            <ShieldCheck className="size-6" />
          ) : (
            <LoaderCircle className="size-6 animate-spin" />
          )}
        </div>
        <p className="mt-6 font-mono text-xs uppercase tracking-[.2em] text-rose">Owner access</p>
        <h1 className="mt-3 editorial-title text-4xl">
          {error ? "This link needs a fresh start." : "Confirming your account."}
        </h1>
        <p className="mt-4 leading-7 text-muted-foreground">
          {error
            ? "This confirmation link is invalid or has expired. Return to sign in and create a new account if needed."
            : "Your secure sign-in is being verified. You’ll be taken to the portfolio studio in a moment."}
        </p>
        {error && (
          <Button asChild className="mt-7 rounded-full">
            <Link to="/auth">
              <ArrowLeft />
              Return to sign in
            </Link>
          </Button>
        )}
      </div>
    </main>
  );
}
