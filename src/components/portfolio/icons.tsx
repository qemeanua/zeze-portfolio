import * as Icons from "lucide-react";
import type { LucideIcon } from "lucide-react";

export function PortfolioIcon({ name, className }: { name: string; className?: string }) {
  const Icon = (Icons as unknown as Record<string, LucideIcon>)[name] ?? Icons.Sparkles;
  return <Icon className={className} aria-hidden="true" />;
}