"use client";

import { useState } from "react";
import { PASSWORD_HINT, PasswordChecklist, passwordError } from "@/components/auth/AuthLayout";
import { Dialog } from "@/components/states/Dialog";
import { Button } from "@/components/ui/Button";
import { Field, Input } from "@/components/ui/Field";
import { useToast } from "@/components/ui/Toast";
import { useStore } from "@/lib/store";

type Errors = { current?: string; next?: string; confirm?: string };

export function ChangePasswordDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { changePassword } = useStore();
  const toast = useToast();
  const [current, setCurrent] = useState("");
  const [next, setNext] = useState("");
  const [confirm, setConfirm] = useState("");
  const [errors, setErrors] = useState<Errors>({});

  const close = () => {
    setCurrent("");
    setNext("");
    setConfirm("");
    setErrors({});
    onClose();
  };

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const er: Errors = {};
    if (!current) er.current = "Enter your current password.";
    const policy = passwordError(next);
    if (policy) er.next = policy;
    else if (next === current) er.next = "Choose a password you haven’t used here.";
    if (confirm !== next) er.confirm = "Passwords don’t match.";
    setErrors(er);
    if (Object.keys(er).length) return;
    const r = changePassword(current, next);
    if (!r.ok) {
      setErrors({ current: r.error });
      return;
    }
    toast("Your password has been updated.");
    close();
  };

  const err = (k: keyof Errors, id: string) => ({ "aria-invalid": !!errors[k], "aria-describedby": errors[k] ? `${id}-error` : undefined });

  return (
    <Dialog open={open} onClose={close} title="Change password" description={PASSWORD_HINT}>
      <form onSubmit={submit} noValidate className="space-y-5">
        <Field id="pw-current" label="Current password" error={errors.current}>
          <Input id="pw-current" type="password" autoComplete="current-password" value={current} onChange={(e) => setCurrent(e.target.value)} {...err("current", "pw-current")} />
        </Field>
        <Field id="pw-next" label="New password" error={errors.next}>
          <Input
            id="pw-next"
            type="password"
            autoComplete="new-password"
            value={next}
            onChange={(e) => setNext(e.target.value)}
            aria-invalid={!!errors.next}
            aria-describedby={errors.next ? "pw-next-rules pw-next-error" : "pw-next-rules"}
          />
          <PasswordChecklist id="pw-next-rules" value={next} />
        </Field>
        <Field id="pw-confirm" label="Confirm new password" error={errors.confirm}>
          <Input id="pw-confirm" type="password" autoComplete="new-password" value={confirm} onChange={(e) => setConfirm(e.target.value)} {...err("confirm", "pw-confirm")} />
        </Field>
        <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
          <Button variant="outline" onClick={close}>Cancel</Button>
          <Button type="submit">Update password</Button>
        </div>
      </form>
    </Dialog>
  );
}
