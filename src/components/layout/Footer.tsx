import Link from "next/link";
import { Icon } from "@/components/Icon";

/** Full marketing footer (homepage). */
export function Footer() {
  const cols = [
    { title: "Explore", links: [["Find a pet", "/pets"], ["Adoption & rehoming", "/pets?type=adoption"], ["Pet care resources", "/safety#resources"]] },
    { title: "For pet parents", links: [["Post a pet", "/post"], ["Manage your listings", "/my-listings"], ["Rehoming guide", "/safety#rehoming"]] },
    { title: "We’re here to help", links: [["About Pawhaven", "/#our-mission"], ["Safety & community", "/safety"], ["Contact us", "/safety#contact"]] },
  ] as const;
  return (
    <footer className="container-page pb-10 pt-5">
      <div className="grid gap-10 md:grid-cols-[1fr_auto]">
        <div>
          <Link href="/" className="flex items-center gap-2.5">
            <Icon name="paw-footer" size={34} />
            <span className="text-[26px] font-bold text-ink">pawhaven</span>
          </Link>
          <p className="mt-4 text-[14px] leading-[1.55] text-muted">More than a match. A new beginning.</p>
        </div>
        <div className="grid grid-cols-2 gap-8 sm:grid-cols-3 lg:gap-0">
          {cols.map((c) => (
            <div key={c.title} className="lg:w-[235px]">
              <p className="text-[13px] font-semibold text-ink">{c.title}</p>
              <ul className="mt-6 space-y-2.5">
                {c.links.map(([label, href]) => (
                  <li key={label}>
                    <Link href={href} className="text-[12px] text-muted hover:text-brand">
                      {label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>
      <div className="mt-10 flex flex-col gap-3 border-t border-line pt-6 text-[11px] text-muted sm:flex-row sm:items-center sm:justify-between">
        <p>© 2026 Pawhaven. Made for the love of pets.</p>
        <div className="flex gap-8">
          <Link href="/safety#privacy" className="hover:text-brand">Privacy policy</Link>
          <Link href="/safety#terms" className="hover:text-brand">Terms of use</Link>
          <Link href="/safety#accessibility" className="hover:text-brand">Accessibility</Link>
        </div>
      </div>
    </footer>
  );
}

/** Compact footer used on app screens (see Messages frame). */
export function AppFooter() {
  return (
    <footer className="container-page mt-12">
      <div className="flex flex-col gap-1 border-t border-line py-4 text-[11px] text-muted sm:flex-row sm:items-center sm:justify-between">
        <p>© 2026 Pawhaven · Pet welfare first.</p>
        <div className="flex gap-6">
          <Link href="/safety" className="inline-flex min-h-10 items-center hover:text-brand">Safety &amp; support</Link>
          <Link href="/safety#privacy" className="inline-flex min-h-10 items-center hover:text-brand">Privacy</Link>
          <Link href="/safety#terms" className="inline-flex min-h-10 items-center hover:text-brand">Terms</Link>
        </div>
      </div>
    </footer>
  );
}
