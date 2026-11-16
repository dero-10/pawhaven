"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { AuthEmblem, AuthHeading, AuthLayout } from "@/components/auth/AuthLayout";
import { FieldError } from "@/components/ui/Field";
import { Button, ButtonLink } from "@/components/ui/Button";
import { LoadingBlock } from "@/components/layout/PageShell";
import { useToast } from "@/components/ui/Toast";
import { useStore } from "@/lib/store";

const COOLDOWN = 60;
const LENGTH = 6;

function CodeInput({ value, onChange, invalid, onComplete }: { value: string[]; onChange: (v: string[]) => void; invalid: boolean; onComplete: (digits: string[]) => void }) {
  const refs = useRef<(HTMLInputElement | null)[]>([]);

  const setAt = (i: number, digits: string) => {
    const next = [...value];
    let j = i;
    for (const d of digits) {
      if (j >= LENGTH) break;
      next[j++] = d;
    }
    onChange(next);
    refs.current[Math.min(j, LENGTH - 1)]?.focus();
    if (next.every((d) => d !== "") && j >= LENGTH) onComplete(next);
  };

  return (
    <div className="grid grid-cols-6 gap-2 sm:gap-3" role="group" aria-labelledby="code-label" aria-describedby={invalid ? "code-error" : "code-note"}>
      {value.map((d, i) => (
        <input
          key={i}
          ref={(el) => { refs.current[i] = el; }}
          value={d}
          inputMode="numeric"
          autoComplete={i === 0 ? "one-time-code" : "off"}
          maxLength={LENGTH}
          aria-label={`Digit ${i + 1}`}
          aria-invalid={invalid}
          onChange={(e) => {
            const digits = e.target.value.replace(/\D/g, "");
            if (!digits) {
              const next = [...value];
              next[i] = "";
              onChange(next);
              return;
            }
            // If the box already had a digit, the new one is the last char typed.
            setAt(i, d && digits.length === 2 ? digits.slice(-1) : digits);
          }}
          onKeyDown={(e) => {
            if (e.key === "Backspace" && !d && i > 0) {
              const next = [...value];
              next[i - 1] = "";
              onChange(next);
              refs.current[i - 1]?.focus();
              e.preventDefault();
            } else if (e.key === "ArrowLeft" && i > 0) refs.current[i - 1]?.focus();
            else if (e.key === "ArrowRight" && i < LENGTH - 1) refs.current[i + 1]?.focus();
          }}
          onFocus={(e) => e.target.select()}
          className="h-[54px] w-full min-w-0 rounded-[10px] border border-field bg-white text-center text-[20px] font-semibold text-ink outline-none transition focus:border-brand focus:ring-2 focus:ring-brand/15 aria-[invalid=true]:border-danger"
        />
      ))}
    </div>
  );
}

export default function VerifyEmailPage() {
  const { db, ready, verifyEmail, resendVerification } = useStore();
  const router = useRouter();
  const toast = useToast();
  const email = db.pendingVerificationEmail;

  const [code, setCode] = useState<string[]>(Array(LENGTH).fill(""));
  const [error, setError] = useState("");
  const [cooldown, setCooldown] = useState(COOLDOWN);
  const [done, setDone] = useState(false);

  useEffect(() => {
    if (cooldown <= 0) return;
    const t = setTimeout(() => setCooldown((c) => c - 1), 1000);
    return () => clearTimeout(t);
  }, [cooldown]);

  const submit = (digits = code) => {
    const joined = digits.join("");
    if (joined.length !== LENGTH) {
      setError("Enter the 6-digit code from your email.");
      return;
    }
    const r = verifyEmail(joined);
    if (!r.ok) {
      setError(r.error);
      return;
    }
    setDone(true);
    toast("Email verified — welcome to Pawhaven!");
    router.push("/pets");
  };

  const resend = () => {
    if (cooldown > 0) {
      toast(`You can request another email in ${cooldown} seconds.`, "info");
      return;
    }
    resendVerification();
    setCooldown(COOLDOWN);
    toast(`We’ve sent a new code to ${email}.`);
  };

  if (!ready || done) {
    return (
      <AuthLayout>
        <LoadingBlock />
      </AuthLayout>
    );
  }

  if (!email) {
    return (
      <AuthLayout>
        <div className="mt-16 lg:mt-[116px]">
          <AuthEmblem />
          <AuthHeading
            className="mt-9"
            title="Nothing to verify."
            subtitle="There’s no email address waiting to be verified right now. If you’ve already verified, just log in."
          />
          <ButtonLink href="/login" size="lg" className="mt-8 w-full">
            Log in
          </ButtonLink>
          <ButtonLink href="/signup" variant="outline" size="lg" className="mt-[18px] w-full !border-field !text-brand">
            Create an account
          </ButtonLink>
        </div>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout>
      <div className="mt-16 lg:mt-[116px]">
        <AuthEmblem />
        <AuthHeading title="Check your inbox." className="mt-9" />
        <p className="mt-[19px] text-[16px] leading-[1.5] text-muted">We’ve sent a verification code to</p>
        <p className="mt-[7px] break-all text-[17px] font-semibold leading-[1.5] text-ink">{email}</p>
        <p className="mt-[25px] text-[15px] leading-[1.5] text-muted">
          Open the email and verify your address to save pets,
          <br className="hidden sm:block" /> send messages, and publish listings.
        </p>

        <form
          noValidate
          className="mt-7"
          onSubmit={(e) => {
            e.preventDefault();
            submit();
          }}
        >
          <p id="code-label" className="mb-2 text-[13px] font-medium leading-[1.5] text-ink">
            Verification code
          </p>
          <CodeInput
            value={code}
            invalid={!!error}
            onChange={(v) => {
              setCode(v);
              if (error) setError("");
            }}
            onComplete={(d) => submit(d)}
          />
          <FieldError id="code-error">{error}</FieldError>
          <p id="code-note" className="mt-2 text-[12px] leading-[1.5] text-muted">
            Demo mode: any 6 digits will verify your account.
          </p>

          <Button type="submit" size="lg" className="mt-6 w-full">
            Verify email
          </Button>
        </form>

        <Button
          variant="outline"
          size="lg"
          onClick={resend}
          aria-disabled={cooldown > 0}
          className={`mt-[18px] w-full !border-field !text-brand ${cooldown > 0 ? "opacity-60" : ""}`}
        >
          {cooldown > 0 ? `Resend verification email (${cooldown}s)` : "Resend verification email"}
        </Button>
        <ButtonLink href="/signup" variant="ghost" size="lg" className="mt-2 w-full">
          Use a different email
        </ButtonLink>

        <p className="mt-[30px] text-[13px] leading-[1.5] text-muted">
          Didn’t receive it? Check your spam folder.
          <br />
          You can request another email after 60 seconds.
        </p>
        <p className="mt-4 text-[13px] leading-[1.5] text-muted">
          Already verified?{" "}
          <Link href="/login" className="font-semibold text-brand hover:underline">
            Log in
          </Link>
        </p>
      </div>
    </AuthLayout>
  );
}
