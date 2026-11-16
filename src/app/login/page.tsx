"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useRef, useState } from "react";
import { AuthAlert, AuthCheckbox, AuthHeading, AuthInput, AuthLayout, EMAIL_RE, PasswordInput } from "@/components/auth/AuthLayout";
import { Label, FieldError } from "@/components/ui/Field";
import { Button } from "@/components/ui/Button";
import { LoadingBlock } from "@/components/layout/PageShell";
import { useToast } from "@/components/ui/Toast";
import { useStore } from "@/lib/store";

const DEMO = { email: "demo@pawhaven.app", password: "pawhaven123" };

/** Only allow same-site relative redirects. */
const safeNext = (n: string | null) => (n && n.startsWith("/") && !n.startsWith("//") ? n : "/pets");

function LoginForm() {
  const { login, currentUser, ready } = useStore();
  const router = useRouter();
  const params = useSearchParams();
  const toast = useToast();
  const next = safeNext(params.get("next"));
  const submitting = useRef(false);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [remember, setRemember] = useState(true);
  const [errors, setErrors] = useState<{ email?: string; password?: string }>({});
  const [formError, setFormError] = useState("");

  // Already signed in → skip the form.
  useEffect(() => {
    if (ready && currentUser && !submitting.current) router.replace(next);
  }, [ready, currentUser, router, next]);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const errs: typeof errors = {};
    if (!email.trim()) errs.email = "Please enter your email address.";
    else if (!EMAIL_RE.test(email.trim())) errs.email = "Please enter a valid email address.";
    if (!password) errs.password = "Please enter your password.";
    setErrors(errs);
    setFormError("");
    if (Object.keys(errs).length) return;

    submitting.current = true;
    const r = login(email, password);
    if (!r.ok) {
      submitting.current = false;
      if (/verify your email/i.test(r.error)) {
        toast("Please verify your email to continue.", "info");
        router.push("/verify-email");
        return;
      }
      setFormError(r.error);
      return;
    }
    toast(`Welcome back, ${r.data.name.split(" ")[0]}!`);
    router.push(next);
  };

  if (!ready || currentUser) return <LoadingBlock />;

  return (
    <>
      <AuthHeading title="Welcome back." subtitle="Your next chapter is just a paw away." className="mt-16 lg:mt-[90px]" />

      <form noValidate onSubmit={submit} className="mt-[31px]">
        {formError && (
          <div className="mb-5">
            <AuthAlert>{formError}</AuthAlert>
          </div>
        )}
        <div>
          <Label htmlFor="email">Email address</Label>
          <AuthInput
            id="email"
            type="email"
            autoComplete="email"
            placeholder="you@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            aria-invalid={!!errors.email}
            aria-describedby={errors.email ? "email-error" : undefined}
          />
          <FieldError id="email-error">{errors.email}</FieldError>
        </div>
        <div className="mt-5">
          <Label htmlFor="password">Password</Label>
          <PasswordInput
            id="password"
            autoComplete="current-password"
            placeholder="Enter your password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            aria-invalid={!!errors.password}
            aria-describedby={errors.password ? "password-error" : undefined}
          />
          <FieldError id="password-error">{errors.password}</FieldError>
        </div>

        <div className="mt-6 flex items-center justify-between gap-4">
          <AuthCheckbox id="remember" checked={remember} onChange={setRemember}>
            Remember me
          </AuthCheckbox>
          <Link href="/forgot-password" className="text-[13px] font-semibold leading-[1.5] text-brand hover:underline">
            Forgot password?
          </Link>
        </div>

        <Button type="submit" size="lg" className="mt-[30px] w-full">
          Log in
        </Button>
      </form>

      <p className="mt-[30px] text-center text-[14px] font-medium leading-[1.5] text-brand">
        New around here?{" "}
        <Link href="/signup" className="ml-1 hover:underline">
          Create an account
        </Link>
      </p>

      <div className="mt-8 rounded-[12px] border border-dashed border-field px-4 py-3 text-center text-[12px] leading-[1.5] text-muted">
        Demo account: <span className="font-medium text-ink">{DEMO.email}</span> / <span className="font-medium text-ink">{DEMO.password}</span>
        <button
          type="button"
          onClick={() => {
            setEmail(DEMO.email);
            setPassword(DEMO.password);
            setErrors({});
            setFormError("");
          }}
          className="ml-2 font-semibold text-brand hover:underline"
        >
          Use demo
        </button>
      </div>

      <p className="mt-10 text-center text-[12px] leading-[1.5] text-muted">
        By continuing, you agree to our{" "}
        <Link href="/safety#terms" className="hover:text-brand hover:underline">Terms</Link> and{" "}
        <Link href="/safety#privacy" className="hover:text-brand hover:underline">Privacy Policy</Link>.
      </p>
    </>
  );
}

export default function LoginPage() {
  return (
    <AuthLayout>
      <Suspense fallback={<LoadingBlock />}>
        <LoginForm />
      </Suspense>
    </AuthLayout>
  );
}
