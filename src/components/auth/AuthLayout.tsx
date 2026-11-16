"use client";

/* eslint-disable @next/next/no-img-element */
import Link from "next/link";
import { useState, type ComponentProps, type ReactNode } from "react";
import { Input } from "@/components/ui/Field";

/**
 * Split authentication layout (Figma 14:27–14:35): sage brand panel on the left,
 * form column on the right. The brand panel is hidden below `lg`; the logo moves
 * into the form column instead.
 */
export function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <div className="grid min-h-screen bg-canvas lg:grid-cols-[minmax(0,640fr)_minmax(0,800fr)]">
      <BrandPanel />
      <main id="main" className="flex flex-col px-4 pb-16 pt-8 sm:px-10 lg:pb-20 lg:pl-[152px] lg:pr-10 lg:pt-[51px] xl:pr-[160px]">
        <div className="mx-auto w-full max-w-[488px] lg:mx-0">
          <Link href="/" className="mb-8 flex items-center gap-[11px] lg:hidden" aria-label="Pawhaven home">
            <img src="/figma/auth/logo-paw.svg" alt="" width={34} height={30} className="h-[30px] w-[34px]" />
            <span className="text-[25px] font-bold leading-[1.5] text-ink">pawhaven</span>
          </Link>
          <Link href="/" className="inline-flex items-center gap-2 text-[14px] font-medium leading-[1.5] text-brand hover:underline">
            <span aria-hidden>←</span> Back to Pawhaven
          </Link>
          {children}
        </div>
      </main>
    </div>
  );
}

function BrandPanel() {
  return (
    <aside className="relative hidden flex-col bg-sage-150 px-[60px] pb-[49px] pt-[41px] lg:flex" aria-label="Pawhaven">
      <Link href="/" className="flex items-center gap-[11px] self-start" aria-label="Pawhaven home">
        <img src="/figma/auth/logo-paw.svg" alt="" width={34} height={30} className="-ml-[6px] h-[30px] w-[34px] rotate-[0.64deg]" />
        <span className="text-[25px] font-bold leading-[1.5] text-ink">pawhaven</span>
      </Link>
      <p className="mt-[92px] font-serif text-[44px] leading-[1.18] text-ink xl:text-[55px]">
        A little paw.
        <br />
        A big beginning.
      </p>
      <div className="flex flex-1 items-center justify-center py-12">
        <img src="/figma/auth/brand-paw.svg" alt="" width={246} height={218} className="h-[218px] w-[246px] max-w-full rotate-[0.64deg] object-contain" />
      </div>
      <p className="text-[19px] font-medium leading-[1.5] text-ink">Find your person. Find your purpose.</p>
      <p className="mt-2 text-[15px] leading-[1.5] text-muted">
        Thoughtful adoption and responsible rehoming.
        <br />
        Because every companion deserves a loving home.
      </p>
      <p className="mt-auto pt-24 text-[11px] font-semibold uppercase leading-[1.5] text-brand">Pet welfare first. Always.</p>
    </aside>
  );
}

/** Page title + subtitle for auth screens. */
export function AuthHeading({ title, subtitle, size = "lg", className = "" }: { title: ReactNode; subtitle?: ReactNode; size?: "lg" | "md"; className?: string }) {
  return (
    <div className={className}>
      <h1 className={`font-serif leading-[1.18] text-ink ${size === "lg" ? "text-[34px] sm:text-[42px]" : "text-[30px] sm:text-[36px]"}`}>{title}</h1>
      {subtitle && <p className="mt-2 text-[16px] leading-[1.5] text-muted">{subtitle}</p>}
    </div>
  );
}

/** Rounded emblem with the small paw, used on confirmation states. */
export function AuthEmblem() {
  return (
    <span className="grid size-[72px] place-items-center rounded-[22px] bg-sage-150">
      <img src="/figma/auth/emblem-paw.svg" alt="" width={36} height={32} className="h-[32px] w-[36px] rotate-[0.64deg]" />
    </span>
  );
}

const authInputClass = "!h-[54px] !rounded-[10px] !border-field aria-[invalid=true]:!border-danger";

/** Field input styled to the auth design (54px, 10px radius). */
export function AuthInput({ className = "", ...rest }: ComponentProps<"input">) {
  return <Input className={`${authInputClass} ${className}`} {...rest} />;
}

/** Password input with show/hide toggle. */
export function PasswordInput(props: Omit<ComponentProps<"input">, "type">) {
  const [show, setShow] = useState(false);
  return (
    <div className="relative">
      <AuthInput {...props} type={show ? "text" : "password"} className="pr-12" />
      <button
        type="button"
        onClick={() => setShow((s) => !s)}
        aria-label={show ? "Hide password" : "Show password"}
        aria-pressed={show}
        className="absolute right-[11px] top-1/2 grid size-8 -translate-y-1/2 place-items-center rounded-full hover:bg-sage-100"
      >
        <img src="/figma/auth/show-password.svg" alt="" width={20} height={20} className={`size-5 ${show ? "opacity-100" : "opacity-80"}`} />
      </button>
    </div>
  );
}

/** Small custom checkbox (18px, 4px radius) with label content. */
export function AuthCheckbox({
  id,
  checked,
  onChange,
  children,
  invalid,
  describedBy,
}: {
  id: string;
  checked: boolean;
  onChange: (v: boolean) => void;
  children: ReactNode;
  invalid?: boolean;
  describedBy?: string;
}) {
  return (
    <div className="flex items-start gap-3">
      <input
        id={id}
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        aria-invalid={invalid || undefined}
        aria-describedby={describedBy}
        className="mt-[1px] size-[18px] shrink-0 cursor-pointer rounded-[4px] border border-field accent-brand aria-[invalid=true]:outline aria-[invalid=true]:outline-danger"
      />
      <label htmlFor={id} className="cursor-pointer text-[12px] leading-[1.5] text-muted">
        {children}
      </label>
    </div>
  );
}

/** Password policy for new passwords (Figma 14:29 / 14:35). Login is not checked against it. */
export const PASSWORD_HINT = "Use 12+ characters, including a number and a symbol.";

/** Live checklist for password requirements. */
export const PASSWORD_RULES: { label: string; test: (v: string) => boolean }[] = [
  { label: "12+ characters", test: (v) => v.length >= 12 },
  { label: "A number", test: (v) => /\d/.test(v) },
  { label: "A symbol", test: (v) => /[^A-Za-z0-9\s]/.test(v) },
];

export const passwordError = (v: string) => {
  if (!v) return "Please create a password.";
  const missing = PASSWORD_RULES.filter((r) => !r.test(v)).map((r) => r.label.toLowerCase());
  return missing.length ? `Password still needs: ${missing.join(", ")}.` : "";
};

export function PasswordRules({ value, id }: { value: string; id?: string }) {
  return (
    <div id={id}>
      <p className="mt-2 text-[12px] leading-[1.5] text-muted">{PASSWORD_HINT}</p>
      <PasswordChecklist value={value} />
    </div>
  );
}

export function PasswordChecklist({ value, id }: { value: string; id?: string }) {
  return (
    <ul id={id} className="mt-1flex flex-wrap gap-x-4 gap-y-1 text-[12px] leading-[1.5]">
      {PASSWORD_RULES.map((r) => {
        const ok = r.test(value);
        return (
          <li key={r.label} className={`flex items-center gap-1.5 ${ok ? "text-brand" : "text-muted"}`}>
            <span aria-hidden className={`grid size-3.5 place-items-center rounded-full text-[9px] ${ok ? "bg-brand text-white" : "border border-field"}`}>
              {ok ? "✓" : ""}
            </span>
            {r.label}
            <span className="sr-only">{ok ? "(met)" : "(not met)"}</span>
          </li>
        );
      })}
    </ul>
  );
}

export const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

/** Inline form-level alert. */
export function AuthAlert({ children, tone = "error" }: { children: ReactNode; tone?: "error" | "info" }) {
  return (
    <div
      role={tone === "error" ? "alert" : "status"}
      className={`rounded-[12px] px-4 py-3 text-[14px] leading-[1.5] ${tone === "error" ? "bg-danger-50 text-danger" : "bg-sage-100 text-ink"}`}
    >
      {children}
    </div>
  );
}
