"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { useStore } from "@/lib/store";
import { ButtonLink } from "@/components/ui/Button";
import { Icon } from "@/components/Icon";

export function Logo({ size = "md" }: { size?: "md" | "sm" }) {
  return (
    <Link href="/" className="flex items-center gap-2.5" aria-label="Pawhaven home">
      <Icon name="paw-logo" size={size === "md" ? 36 : 32} />
      <span className={`font-bold leading-none text-ink ${size === "md" ? "text-[27px]" : "text-[24px]"}`}>pawhaven</span>
    </Link>
  );
}

export function Header() {
  const { currentUser, logout, unreadCount, ready } = useStore();
  const pathname = usePathname();
  const router = useRouter();
  const [menuOpen, setMenuOpen] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setMenuOpen(false);
    setMobileOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (!menuOpen) return;
    const onDown = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setMenuOpen(false);
    };
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setMenuOpen(false);
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [menuOpen]);

  // Mobile menu: close on Escape like the desktop account menu.
  useEffect(() => {
    if (!mobileOpen) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setMobileOpen(false);
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [mobileOpen]);

  const unread = unreadCount();
  const links = currentUser
    ? [
        { href: "/pets", label: "Find a pet" },
        { href: "/saved", label: "Saved pets" },
        { href: "/messages", label: "Messages", badge: unread },
      ]
    : [
        { href: "/pets", label: "Find a pet" },
        { href: "/#how-it-works", label: "How it works" },
        { href: "/#our-mission", label: "Our mission" },
      ];

  const isActive = (href: string) => (href.startsWith("/#") ? false : pathname === href || pathname.startsWith(href + "/"));

  const accountLinks = [
    { href: "/my-listings", label: "My listings" },
    { href: "/applications", label: "My adoption requests" },
    { href: "/account", label: "Account & privacy" },
    { href: "/safety", label: "Safety & support" },
    ...(currentUser?.role === "admin" ? [{ href: "/admin/moderation", label: "Moderation workspace" }] : []),
  ];

  const onLogout = () => {
    logout();
    router.push("/");
  };

  return (
    <header className="relative z-40">
      <div className="container-page">
        <div className="flex h-[96px] items-center justify-between border-b border-line">
          <Logo />

          <nav aria-label="Main" className="hidden items-center gap-10 lg:flex">
            {links.map((l) => (
              <Link
                key={l.href}
                href={l.href}
                aria-current={isActive(l.href) ? "page" : undefined}
                className={`relative text-[15px] ${isActive(l.href) || (l.href === "/pets" && pathname === "/") ? "font-semibold text-brand" : "text-ink hover:text-brand"}`}
              >
                {l.label}
                {"badge" in l && l.badge ? (
                  <span className="absolute -right-5 -top-2 grid size-[18px] place-items-center rounded-full bg-peach-500 text-[10px] font-bold text-ink">
                    {l.badge}
                    <span className="sr-only"> unread</span>
                  </span>
                ) : null}
              </Link>
            ))}
          </nav>

          <div className="hidden items-center gap-7 lg:flex">
            {!ready ? (
              <span className="h-5 w-12" />
            ) : currentUser ? (
              <div className="relative" ref={menuRef}>
                <button
                  type="button"
                  aria-haspopup="menu"
                  aria-expanded={menuOpen}
                  onClick={() => setMenuOpen((v) => !v)}
                  className="flex items-center gap-1.5 text-[15px] font-medium text-ink hover:text-brand"
                >
                  {currentUser.name.split(" ")[0]}
                  <Icon name="chevron-down" size={16} />
                </button>
                {menuOpen && (
                  <div role="menu" className="absolute right-0 top-9 w-60 overflow-hidden rounded-[16px] border border-line bg-white py-2 shadow-float">
                    <div className="border-b border-line px-4 pb-3 pt-1">
                      <p className="text-[14px] font-semibold text-ink">{currentUser.name}</p>
                      <p className="truncate text-[12px] text-muted">{currentUser.email}</p>
                    </div>
                    {accountLinks.map((l) => (
                      <Link key={l.href} role="menuitem" href={l.href} className="block px-4 py-2.5 text-[14px] text-ink hover:bg-sage-50">
                        {l.label}
                      </Link>
                    ))}
                    <button role="menuitem" type="button" onClick={onLogout} className="block w-full border-t border-line px-4 py-2.5 text-left text-[14px] text-danger hover:bg-sage-50">
                      Log out
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <Link href="/login" className="text-[15px] font-medium text-ink hover:text-brand">
                Log in
              </Link>
            )}
            <ButtonLink href="/post" className="w-[198px] !justify-start">
              <span aria-hidden>+</span> Post a pet
            </ButtonLink>
          </div>

          <button
            type="button"
            className="grid size-11 place-items-center rounded-full border border-line lg:hidden"
            aria-label={mobileOpen ? "Close menu" : "Open menu"}
            aria-expanded={mobileOpen}
            onClick={() => setMobileOpen((v) => !v)}
          >
            <span className="relative block h-3 w-5">
              <span className={`absolute left-0 h-0.5 w-5 bg-ink transition ${mobileOpen ? "top-1.5 rotate-45" : "top-0"}`} />
              <span className={`absolute left-0 top-1.5 h-0.5 w-5 bg-ink transition ${mobileOpen ? "opacity-0" : ""}`} />
              <span className={`absolute left-0 h-0.5 w-5 bg-ink transition ${mobileOpen ? "top-1.5 -rotate-45" : "top-3"}`} />
            </span>
          </button>
        </div>
      </div>

      {mobileOpen && (
        <div className="absolute inset-x-0 top-[96px] border-b border-line bg-canvas shadow-float lg:hidden">
          <nav aria-label="Mobile" className="container-page flex flex-col py-4">
            {links.map((l) => (
              <Link key={l.href} href={l.href} className="py-3 text-[16px] text-ink">
                {l.label}
                {"badge" in l && l.badge ? <span className="ml-2 rounded-full bg-peach-500 px-2 text-[11px] font-bold">{l.badge}<span className="sr-only"> unread</span></span> : null}
              </Link>
            ))}
            <div className="my-2 h-px bg-line" />
            {currentUser ? (
              <>
                {accountLinks.map((l) => (
                  <Link key={l.href} href={l.href} className="py-3 text-[16px] text-ink">
                    {l.label}
                  </Link>
                ))}
                <button type="button" onClick={onLogout} className="py-3 text-left text-[16px] text-danger">
                  Log out
                </button>
              </>
            ) : (
              <Link href="/login" className="py-3 text-[16px] font-medium text-ink">
                Log in
              </Link>
            )}
            <ButtonLink href="/post" className="mt-3">
              + Post a pet
            </ButtonLink>
          </nav>
        </div>
      )}
    </header>
  );
}
