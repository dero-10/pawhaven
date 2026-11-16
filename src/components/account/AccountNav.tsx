"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const ITEMS = [
  { href: "/account", label: "Profile & privacy" },
  { href: "/my-listings", label: "My listings" },
  { href: "/applications", label: "Adoption requests" },
  { href: "/saved", label: "Saved pets" },
  { href: "/messages", label: "Messages" },
  { href: "/safety", label: "Safety & support" },
] as const;

/** Left-hand account navigation card (frame 14:63 "Account navigation"). */
export function AccountNav() {
  const pathname = usePathname();
  return (
    <nav aria-label="Account" className="rounded-[16px] border border-field bg-white p-[11px] md:pb-[38px] md:pt-4">
      <ul className="grid grid-cols-2 gap-1 md:grid-cols-1 md:gap-[11px]">
        {ITEMS.map((it) => {
          const active = pathname === it.href;
          return (
            <li key={it.href}>
              <Link
                href={it.href}
                aria-current={active ? "page" : undefined}
                className={`flex h-[46px] items-center rounded-[10px] px-[17px] text-[14px] leading-[1.5] text-ink transition ${
                  active ? "bg-sage-150 font-semibold" : "hover:bg-sage-50"
                }`}
              >
                {it.label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
