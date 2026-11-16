"use client";

import Link from "next/link";
import { useState } from "react";
import { AuthEmblem, AuthHeading, AuthInput, AuthLayout, EMAIL_RE } from "@/components/auth/AuthLayout";
import { FieldError, Label } from "@/components/ui/Field";
import { Button, ButtonLink } from "@/components/ui/Button";
import { useToast } from "@/components/ui/Toast";
import { useStore } from "@/lib/store";

export default function ForgotPasswordPage() {
  const { requestPasswordReset } = useStore();
  const toast = useToast();
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [sent, setSent] = useState<{ email: string; token: string } | null>(null);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const v = email.trim();
    if (!v) return setError("Please enter your email address.");
    if (!EMAIL_RE.test(v)) return setError("Please enter a valid email address.");
    setError("");
    const r = requestPasswordReset(v);
    if (r.ok) setSent({ email: v, token: r.data });
  };

  if (sent) {
    return (
      <AuthLayout>
        <div className="mt-16 lg:mt-[116px]">
          <AuthEmblem />
          <AuthHeading title="Check your inbox." className="mt-9" />
          <p className="mt-[19px] text-[16px] leading-[1.5] text-muted">If there’s a Pawhaven account for</p>
          <p className="mt-[7px] break-all text-[17px] font-semibold leading-[1.5] text-ink">{sent.email}</p>
          <p className="mt-[25px] text-[15px] leading-[1.5] text-muted">
            you’ll receive a link to reset your password shortly.
            <br className="hidden sm:block" /> The link expires in 60 minutes.
          </p>

          <div className="mt-7 rounded-[12px] border border-dashed border-field bg-white px-4 py-3 text-[13px] leading-[1.5] text-muted">
            Demo mode — no email is sent.{" "}
            <Link href={`/reset-password?token=${encodeURIComponent(sent.token)}`} className="font-semibold text-brand hover:underline">
              Demo: open reset link
            </Link>
          </div>

          <ButtonLink href="/login" size="lg" className="mt-7 w-full">
            Back to log in
          </ButtonLink>
          <Button
            variant="outline"
            size="lg"
            className="mt-[18px] w-full !border-field !text-brand"
            onClick={() => {
              const r = requestPasswordReset(sent.email);
              if (r.ok) setSent({ email: sent.email, token: r.data });
              toast("We’ve sent another reset link.");
            }}
          >
            Resend reset link
          </Button>
          <p className="mt-[30px] text-[13px] leading-[1.5] text-muted">
            Didn’t receive it? Check your spam folder, or{" "}
            <button type="button" onClick={() => setSent(null)} className="font-semibold text-brand hover:underline">
              try a different email
            </button>
            .
          </p>
        </div>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout>
      <AuthHeading
        title="Forgot your password?"
        subtitle="No worries. Enter your email and we’ll send you a link to reset it."
        className="mt-16 lg:mt-[90px]"
      />
      <form noValidate onSubmit={submit} className="mt-[31px]">
        <Label htmlFor="email">Email address</Label>
        <AuthInput
          id="email"
          type="email"
          autoComplete="email"
          placeholder="you@example.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          aria-invalid={!!error}
          aria-describedby={error ? "email-error" : undefined}
        />
        <FieldError id="email-error">{error}</FieldError>
        <Button type="submit" size="lg" className="mt-[30px] w-full">
          Send reset link
        </Button>
      </form>
      <p className="mt-[30px] text-center text-[14px] font-medium leading-[1.5] text-brand">
        Remembered it?{" "}
        <Link href="/login" className="ml-1 hover:underline">
          Back to log in
        </Link>
      </p>
    </AuthLayout>
  );
}
