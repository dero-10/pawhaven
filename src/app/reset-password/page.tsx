"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useState } from "react";
import {
  AuthAlert,
  AuthEmblem,
  AuthHeading,
  AuthLayout,
  PasswordInput,
  PasswordRules,
  passwordError,
} from "@/components/auth/AuthLayout";
import { FieldError, Label } from "@/components/ui/Field";
import { Button, ButtonLink } from "@/components/ui/Button";
import { LoadingBlock } from "@/components/layout/PageShell";
import { useToast } from "@/components/ui/Toast";
import { useStore } from "@/lib/store";

function InvalidToken() {
  return (
    <div className="mt-16 lg:mt-[116px]">
      <AuthEmblem />
      <AuthHeading
        className="mt-9"
        title="This link has expired."
        subtitle="Password reset links can only be used once and expire after a while. Request a new one and we’ll send it right over."
      />
      <ButtonLink href="/forgot-password" size="lg" className="mt-8 w-full">
        Request a new link
      </ButtonLink>
      <p className="mt-[30px] text-center text-[14px] font-medium leading-[1.5] text-brand">
        <Link href="/login" className="hover:underline">
          Back to log in
        </Link>
      </p>
    </div>
  );
}

function ResetForm() {
  const { db, ready, resetPassword } = useStore();
  const router = useRouter();
  const toast = useToast();
  const token = useSearchParams().get("token") ?? "";

  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [errors, setErrors] = useState<{ password?: string; confirm?: string }>({});
  const [formError, setFormError] = useState("");
  const [done, setDone] = useState(false);

  if (!ready || done) return <LoadingBlock />;
  if (!token || !db.resetTokens[token]) return <InvalidToken />;

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const errs: typeof errors = {};
    const pw = passwordError(password);
    if (pw) errs.password = pw;
    if (!confirm) errs.confirm = "Please confirm your new password.";
    else if (confirm !== password) errs.confirm = "Passwords don’t match.";
    setErrors(errs);
    setFormError("");
    if (Object.keys(errs).length) return;
    const r = resetPassword(token, password);
    if (!r.ok) return setFormError(r.error);
    setDone(true);
    toast("Password updated — please log in with your new password.");
    router.push("/login");
  };

  return (
    <>
      <AuthHeading title="Choose a new password." subtitle="Make it something you’ll remember — and no one else will guess." className="mt-16 lg:mt-[90px]" />
      <form noValidate onSubmit={submit} className="mt-[31px]">
        {formError && (
          <div className="mb-5">
            <AuthAlert>
              {formError}{" "}
              <Link href="/forgot-password" className="font-semibold underline">
                Request a new link
              </Link>
            </AuthAlert>
          </div>
        )}
        <div>
          <Label htmlFor="password">New password</Label>
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
        <div className="mt-5">
          <Label htmlFor="confirm">Confirm new password</Label>
          <PasswordInput
            id="confirm"
            autoComplete="new-password"
            placeholder="Re-enter your new password"
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            aria-invalid={!!errors.confirm}
            aria-describedby={errors.confirm ? "confirm-error" : undefined}
          />
          <FieldError id="confirm-error">{errors.confirm}</FieldError>
        </div>
        <Button type="submit" size="lg" className="mt-[30px] w-full">
          Reset password
        </Button>
      </form>
      <p className="mt-[30px] text-center text-[14px] font-medium leading-[1.5] text-brand">
        <Link href="/login" className="hover:underline">
          Back to log in
        </Link>
      </p>
    </>
  );
}

export default function ResetPasswordPage() {
  return (
    <AuthLayout>
      <Suspense fallback={<LoadingBlock />}>
        <ResetForm />
      </Suspense>
    </AuthLayout>
  );
}
