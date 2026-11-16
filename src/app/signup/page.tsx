"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import {
  AuthAlert,
  AuthCheckbox,
  AuthHeading,
  AuthInput,
  AuthLayout,
  EMAIL_RE,
  PasswordInput,
  PasswordRules,
  passwordError,
} from "@/components/auth/AuthLayout";
import { FieldError, Label } from "@/components/ui/Field";
import { Button } from "@/components/ui/Button";
import { LoadingBlock } from "@/components/layout/PageShell";
import { useToast } from "@/components/ui/Toast";
import { useStore } from "@/lib/store";

type AccountType = "private" | "shelter";
type Errors = Partial<Record<"name" | "email" | "password" | "city" | "terms", string>>;

const ACCOUNT_TYPES: { value: AccountType; label: string }[] = [
  { value: "private", label: "Pet parent" },
  { value: "shelter", label: "Shelter / rescue" },
];

export default function SignupPage() {
  const { signup, currentUser, ready } = useStore();
  const router = useRouter();
  const toast = useToast();
  const submitting = useRef(false);

  const [accountType, setAccountType] = useState<AccountType>("private");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [city, setCity] = useState("");
  const [terms, setTerms] = useState(false);
  const [errors, setErrors] = useState<Errors>({});
  const [formError, setFormError] = useState("");

  useEffect(() => {
    if (ready && currentUser && !submitting.current) router.replace("/pets");
  }, [ready, currentUser, router]);

  const validate = (): Errors => {
    const e: Errors = {};
    if (name.trim().length < 2) e.name = "Please enter your name.";
    if (!email.trim()) e.email = "Please enter your email address.";
    else if (!EMAIL_RE.test(email.trim())) e.email = "Please enter a valid email address.";
    const pw = passwordError(password);
    if (pw) e.password = pw;
    if (!city.trim()) e.city = "Please enter your city or ZIP code.";
    if (!terms) e.terms = "Please confirm you’re 18 or older and agree to our terms.";
    return e;
  };

  const submit = (ev: React.FormEvent) => {
    ev.preventDefault();
    const e = validate();
    setErrors(e);
    setFormError("");
    if (Object.keys(e).length) {
      const first = Object.keys(e)[0];
      document.getElementById(first)?.focus();
      return;
    }
    submitting.current = true;
    const r = signup({ name, email, password, city, accountType });
    if (!r.ok) {
      submitting.current = false;
      if (/already exists/i.test(r.error)) setErrors({ email: r.error });
      else setFormError(r.error);
      return;
    }
    toast("Account created — check your inbox to verify your email.");
    router.push("/verify-email");
  };

  const err = (k: keyof Errors) => ({
    "aria-invalid": !!errors[k],
    "aria-describedby": errors[k] ? `${k}-error` : undefined,
  });

  if (!ready || currentUser) return <AuthLayout><LoadingBlock /></AuthLayout>;

  return (
    <AuthLayout>
      <AuthHeading title="A fresh start begins here." subtitle="Create your free Pawhaven account." size="md" className="mt-12 lg:mt-[57px]" />

      <form noValidate onSubmit={submit} className="mt-[28px]">
        {formError && (
          <div className="mb-5">
            <AuthAlert>{formError}</AuthAlert>
          </div>
        )}

        <fieldset>
          <legend className="text-[13px] font-medium leading-[1.5] text-ink">I’m joining as</legend>
          <div className="mt-3 grid grid-cols-2 gap-3 sm:gap-4" role="radiogroup" aria-label="I’m joining as">
            {ACCOUNT_TYPES.map((t) => {
              const selected = accountType === t.value;
              return (
                <button
                  key={t.value}
                  type="button"
                  role="radio"
                  aria-checked={selected}
                  onClick={() => setAccountType(t.value)}
                  className={`h-[52px] rounded-full px-3 text-[15px] font-semibold transition-colors ${
                    selected ? "bg-brand text-white" : "border border-field bg-white text-brand hover:border-brand"
                  }`}
                >
                  {t.label}
                </button>
              );
            })}
          </div>
        </fieldset>

        <div className="mt-[25px]">
          <Label htmlFor="name">Full name</Label>
          <AuthInput id="name" autoComplete="name" placeholder="Your name" value={name} onChange={(e) => setName(e.target.value)} {...err("name")} />
          <FieldError id="name-error">{errors.name}</FieldError>
        </div>

        <div className="mt-[18px]">
          <Label htmlFor="email">Email address</Label>
          <AuthInput id="email" type="email" autoComplete="email" placeholder="you@example.com" value={email} onChange={(e) => setEmail(e.target.value)} {...err("email")} />
          <FieldError id="email-error">{errors.email}</FieldError>
        </div>

        <div className="mt-[18px]">
          <Label htmlFor="password">Password</Label>
          <PasswordInput
            id="password"
            autoComplete="new-password"
            placeholder="Create a strong password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            aria-invalid={!!errors.password}
            aria-describedby={errors.password ? "password-rules password-error" : "password-rules"}
          />
          <PasswordRules id="password-rules" value={password} />
          <FieldError id="password-error">{errors.password}</FieldError>
        </div>

        <div className="mt-[18px]">
          <Label htmlFor="city">City or ZIP code</Label>
          <AuthInput id="city" autoComplete="address-level2" placeholder="Austin, TX" value={city} onChange={(e) => setCity(e.target.value)} {...err("city")} />
          <FieldError id="city-error">{errors.city}</FieldError>
        </div>

        <div className="mt-[27px]">
          <AuthCheckbox id="terms" checked={terms} onChange={setTerms} invalid={!!errors.terms} describedBy={errors.terms ? "terms-error" : undefined}>
            I’m 18 or older and agree to the{" "}
            <Link href="/safety#terms" className="underline-offset-2 hover:text-brand hover:underline">Terms of Use</Link>,
            <br className="hidden sm:block" />{" "}
            <Link href="/safety#privacy" className="underline-offset-2 hover:text-brand hover:underline">Privacy Policy</Link>, and{" "}
            <Link href="/safety#rehoming" className="underline-offset-2 hover:text-brand hover:underline">responsible rehoming guidelines</Link>.
          </AuthCheckbox>
          <FieldError id="terms-error">{errors.terms}</FieldError>
        </div>

        <Button type="submit" size="lg" className="mt-[34px] w-full">
          Create account
        </Button>
      </form>

      <p className="mt-[31px] text-center text-[14px] font-medium leading-[1.5] text-brand">
        Already have an account?{" "}
        <Link href="/login" className="ml-1 hover:underline">
          Log in
        </Link>
      </p>
    </AuthLayout>
  );
}
