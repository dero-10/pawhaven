"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState, type ReactNode } from "react";
import { useStore } from "@/lib/store";
import { Header } from "./Header";
import { AppFooter, Footer } from "./Footer";
import { ButtonLink } from "@/components/ui/Button";
import { Icon } from "@/components/Icon";

/** Standard page chrome: header + main + footer. */
export function PageShell({ children, footer = "app" }: { children: ReactNode; footer?: "app" | "full" | "none" }) {
  return (
    <div className="flex min-h-screen flex-col bg-canvas">
      <Header />
      <main id="main" className="flex-1">
        {children}
      </main>
      {footer === "full" ? <Footer /> : footer === "app" ? <AppFooter /> : null}
    </div>
  );
}

/** Serif page heading block used across app screens. */
export function PageHeading({ title, subtitle, eyebrow, actions }: { title: ReactNode; subtitle?: ReactNode; eyebrow?: ReactNode; actions?: ReactNode }) {
  return (
    <div className="flex flex-col gap-6 pb-10 pt-10 md:flex-row md:items-end md:justify-between md:pt-12">
      <div>
        {eyebrow && <p className="mb-3 text-[11px] font-semibold uppercase tracking-wide text-brand">{eyebrow}</p>}
        <h1 className="font-serif text-[34px] leading-[1.14] text-ink md:text-[40px]">{title}</h1>
        {subtitle && <p className="mt-3 text-[15px] leading-[1.5] text-muted">{subtitle}</p>}
      </div>
      {actions && <div className="flex flex-wrap gap-3">{actions}</div>}
    </div>
  );
}

/** Gate for pages that need a signed-in user (or admin). */
export function RequireAuth({ children, admin = false }: { children: ReactNode; admin?: boolean }) {
  const { currentUser, ready } = useStore();
  const pathname = usePathname();
  // Keep the query string (e.g. /messages?pet=…) in `next`; read it client-side so pages don't need a Suspense boundary.
  const [search, setSearch] = useState("");
  useEffect(() => {
    setSearch(window.location.search);
  }, [pathname]);
  if (!ready) return <LoadingBlock />;
  if (!currentUser) {
    return (
      <EmptyState
        as="h1"
        title="Please log in to continue"
        body="You’ll need a Pawhaven account to see this page."
        action={<ButtonLink href={`/login?next=${encodeURIComponent(pathname + search)}`}>Log in</ButtonLink>}
        secondary={<Link href="/signup" className="text-[14px] font-semibold text-brand">Create an account</Link>}
      />
    );
  }
  if (admin && currentUser.role !== "admin") {
    return <EmptyState as="h1" title="Moderators only" body="This workspace is only available to the Pawhaven trust & safety team." action={<ButtonLink href="/">Back to home</ButtonLink>} />;
  }
  return <>{children}</>;
}

export function EmptyState({
  title,
  body,
  action,
  secondary,
  icon = "paw-search",
  as: Heading = "h2",
}: {
  title: string;
  body?: ReactNode;
  action?: ReactNode;
  secondary?: ReactNode;
  icon?: string;
  /** Use "h1" when the empty state replaces the whole page (e.g. the login gate). */
  as?: "h1" | "h2";
}) {
  return (
    <div className="container-page py-20">
      <div className="mx-auto flex max-w-[520px] flex-col items-center rounded-[24px] border border-line bg-white px-8 py-14 text-center">
        <div className="grid size-[72px] place-items-center rounded-full bg-sage-100">
          <Icon name={icon} size={34} />
        </div>
        <Heading className="mt-6 font-serif text-[26px] leading-[1.2] text-ink">{title}</Heading>
        {body && <p className="mt-3 text-[15px] leading-[1.55] text-muted">{body}</p>}
        {action && <div className="mt-7">{action}</div>}
        {secondary && <div className="mt-4">{secondary}</div>}
      </div>
    </div>
  );
}

export function LoadingBlock({ label = "Loading…" }: { label?: string }) {
  return (
    <div className="container-page py-20" role="status" aria-live="polite">
      <div className="mx-auto flex max-w-[520px] flex-col items-center gap-4 text-muted">
        <span className="size-8 animate-spin rounded-full border-[3px] border-sage-200 border-t-brand" />
        <span className="text-[14px]">{label}</span>
      </div>
    </div>
  );
}
