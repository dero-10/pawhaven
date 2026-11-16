"use client";

import Link from "next/link";
import { useEffect, useId, useState, type ReactNode } from "react";
import { Button, ButtonLink } from "@/components/ui/Button";
import { FieldError, Input } from "@/components/ui/Field";
import { InlineNotice, StateCard } from "./StateCard";

/**
 * Ready-made states from Figma frame 14:69 "22 · Essential states".
 * Each accepts an optional `action` override so pages can wire their own behaviour;
 * the defaults link to the obvious next step.
 */

type Override = { action?: ReactNode; className?: string; headingLevel?: 1 | 2 | 3 };
const full = "w-full";

export function NoMatchesState({ onClear, action, ...rest }: Override & { onClear?: () => void }) {
  return (
    <StateCard
      {...rest}
      title="No matches just yet."
      body="Try a wider distance or remove a filter. Your companion could be a little further away."
      action={action ?? (onClear ? <Button onClick={onClear} className={full}>Clear filters</Button> : <ButtonLink href="/pets" className={full}>Clear filters</ButtonLink>)}
    />
  );
}

export function NoSavedState({ action, ...rest }: Override) {
  return (
    <StateCard
      {...rest}
      title="Your favorites start here."
      body="Save a pet while you explore. You’ll find all your saved companions in this space."
      action={action ?? <ButtonLink href="/pets" className={full}>Find a pet</ButtonLink>}
    />
  );
}

export function NoMessagesState({ action, ...rest }: Override) {
  return (
    <StateCard
      {...rest}
      title="A conversation starts with hello."
      body="When you contact a shelter or pet parent, your conversations will appear here."
      action={action ?? <ButtonLink href="/pets" className={full}>Explore companions</ButtonLink>}
    />
  );
}

export function CheckEmailState({ action, ...rest }: Override) {
  return (
    <StateCard
      {...rest}
      title="Check your email."
      body="If an account exists for this email, you’ll receive a password reset link. Check your spam folder too."
      action={action ?? <ButtonLink href="/login" className={full}>Back to log in</ButtonLink>}
    />
  );
}

export function PasswordResetState({ action, ...rest }: Override) {
  return (
    <StateCard
      {...rest}
      title="A fresh start, secured."
      body="Your password has been reset. Log in with your new password to continue."
      action={action ?? <ButtonLink href="/login" className={full}>Log in</ButtonLink>}
    />
  );
}

export function PetUnavailableState({ action, ...rest }: Override) {
  return (
    <StateCard
      {...rest}
      tone="peach"
      title="This chapter has moved on."
      body="This pet is no longer available. There are more companions waiting for a loving home."
      action={action ?? <ButtonLink href="/pets" className={full}>Find other pets</ButtonLink>}
    />
  );
}

export function LoginErrorState({ action, ...rest }: Override) {
  return (
    <StateCard
      {...rest}
      tone="danger"
      title="Let’s try that again."
      body="The email or password is incorrect. Check your details or reset your password."
      action={action ?? <ButtonLink href="/forgot-password" className={full}>Reset password</ButtonLink>}
    >
      <p className="text-[12px] text-muted">
        You can also{" "}
        <Link href="/login" className="font-semibold text-brand hover:underline">return to log in</Link>.
      </p>
    </StateCard>
  );
}

/** Typed-confirmation delete card. `onConfirm` runs only once "DELETE" is typed. */
export function DeleteAccountState({ onConfirm, onCancel, className, headingLevel }: { onConfirm: () => void; onCancel?: () => void; className?: string; headingLevel?: 1 | 2 | 3 }) {
  const [value, setValue] = useState("");
  const [error, setError] = useState("");
  const id = useId();
  const matches = value.trim() === "DELETE";
  return (
    <StateCard
      className={className}
      headingLevel={headingLevel}
      tone="danger"
      title="Delete your account?"
      body="This removes your profile and listings. Export your data first. This can’t be undone."
      action={
        <>
          <Button
            variant="danger"
            className="w-full sm:w-[228px]"
            onClick={() => (matches ? onConfirm() : setError("Type DELETE in capital letters to confirm."))}
            aria-disabled={!matches}
          >
            Delete account
          </Button>
          {onCancel && (
            <button type="button" onClick={onCancel} className="text-[13px] font-semibold text-brand hover:underline">
              Cancel
            </button>
          )}
        </>
      }
    >
      <label htmlFor={id} className="sr-only">Type DELETE to confirm</label>
      <Input
        id={id}
        value={value}
        onChange={(e) => { setValue(e.target.value); setError(""); }}
        placeholder="Type DELETE to confirm"
        autoComplete="off"
        aria-invalid={!!error}
        aria-describedby={error ? `${id}-error` : undefined}
        className="!h-[39px] !rounded-[10px] text-[13px]"
      />
      <FieldError id={`${id}-error`}>{error}</FieldError>
    </StateCard>
  );
}

export function ReportThanksState({ action, ...rest }: Override) {
  return (
    <StateCard
      {...rest}
      title="Thank you for speaking up."
      body="Your report has been received. Our moderation team will review it. For immediate danger, contact local authorities."
      action={action ?? <ButtonLink href="/" className={full}>Return to Pawhaven</ButtonLink>}
    />
  );
}

export function MarkRehomedState({ petName = "Teddy", pronoun = "he", onConfirm, action, ...rest }: Override & { petName?: string; pronoun?: string; onConfirm?: () => void }) {
  return (
    <StateCard
      {...rest}
      title={`A happy ending for ${petName}?`}
      body={`Marking ${petName} as rehomed closes the listing and stops new requests. Current applicants will see that ${pronoun} is no longer available.`}
      action={action ?? <Button onClick={onConfirm} className={full}>Confirm rehomed</Button>}
    />
  );
}

export function NeedsChangesState({ note, href = "/my-listings", action, ...rest }: Override & { note?: string; href?: string }) {
  return (
    <StateCard
      {...rest}
      tone="peach"
      title="A few details need your care."
      body={note || "Your listing needs changes before publication. Please clarify the care requirements, then resubmit for review."}
      action={action ?? <ButtonLink href={href} className={full}>Edit listing</ButtonLink>}
    />
  );
}

export function SessionExpiredState({ next = "/", action, ...rest }: Override & { next?: string }) {
  return (
    <StateCard
      {...rest}
      title="Your session has expired."
      body="Log in again to continue securely. Any unsaved changes may be lost."
      action={action ?? <ButtonLink href={`/login?next=${encodeURIComponent(next)}`} className={full}>Log in again</ButtonLink>}
    />
  );
}

export function NotFoundState({ ...rest }: Omit<Override, "action">) {
  return (
    <StateCard
      {...rest}
      tone="peach"
      title="This page has wandered off."
      body="We couldn’t find the page you were looking for. It may have moved, or the link may be out of date."
      action={
        <>
          <ButtonLink href="/pets" className="w-full sm:flex-1">Find a pet</ButtonLink>
          <ButtonLink href="/" variant="outline" className="w-full sm:flex-1">Back to home</ButtonLink>
        </>
      }
    />
  );
}

export function ErrorState({ onRetry, ...rest }: Omit<Override, "action"> & { onRetry?: () => void }) {
  return (
    <StateCard
      {...rest}
      tone="danger"
      title="Let’s try that again."
      body="Something went wrong on our side. Your information is safe — please try again in a moment."
      action={
        <>
          {onRetry && <Button onClick={onRetry} className="w-full sm:flex-1">Try again</Button>}
          <ButtonLink href="/" variant="outline" className="w-full sm:flex-1">Back to home</ButtonLink>
        </>
      }
    />
  );
}

/** Message composer failure banner. */
export function MessageFailedNotice({ onRetry, className }: { onRetry: () => void; className?: string }) {
  return (
    <InlineNotice
      tone="error"
      className={className}
      action={<button type="button" onClick={onRetry} className="shrink-0 text-[14px] font-semibold text-danger-ink underline-offset-2 hover:underline">Retry</button>}
    >
      Message couldn’t send. Your text is still here.
    </InlineNotice>
  );
}

export function ProfileSavedNotice({ className }: { className?: string }) {
  return (
    <InlineNotice tone="success" className={className}>
      ✓&nbsp;&nbsp;Your profile changes have been saved.
    </InlineNotice>
  );
}

/** Shows a banner while the browser reports it is offline. `force` renders it regardless (showcase). */
export function OfflineNotice({ force = false, className }: { force?: boolean; className?: string }) {
  const [offline, setOffline] = useState(false);
  useEffect(() => {
    const sync = () => setOffline(!navigator.onLine);
    sync();
    window.addEventListener("online", sync);
    window.addEventListener("offline", sync);
    return () => {
      window.removeEventListener("online", sync);
      window.removeEventListener("offline", sync);
    };
  }, []);
  if (!force && !offline) return null;
  return (
    <InlineNotice tone="info" className={className}>
      You’re offline. We’ll keep your changes here and reconnect when you’re back.
    </InlineNotice>
  );
}
