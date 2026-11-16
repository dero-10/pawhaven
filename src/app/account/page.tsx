"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { AccountNav } from "@/components/account/AccountNav";
import { ChangePasswordDialog } from "@/components/account/ChangePasswordDialog";
import { downloadUserData } from "@/components/account/exportData";
import { PageShell, RequireAuth } from "@/components/layout/PageShell";
import { Dialog } from "@/components/states/Dialog";
import { ProfileSavedNotice } from "@/components/states/states";
import { Button } from "@/components/ui/Button";
import { Field, FieldError, Input, Toggle } from "@/components/ui/Field";
import { useToast } from "@/components/ui/Toast";
import { useStore } from "@/lib/store";
import type { User } from "@/lib/types";

type Prefs = User["preferences"];
type Errors = { name?: string; email?: string; city?: string; form?: string };

const PREF_ROWS: { key: keyof Prefs; title: string; body: string }[] = [
  { key: "messageNotifications", title: "Messages and adoption updates", body: "Email me when someone replies or updates a request." },
  { key: "emailNotifications", title: "Pet discovery emails", body: "Send me occasional pet recommendations." },
  { key: "showCity", title: "Show my city on my profile", body: "Help people nearby find your listings. Your exact address is never shared." },
  { key: "profileVisible", title: "Public profile", body: "Let adopters and pet parents see your first name and listings." },
];

const card = "rounded-[16px] border border-field bg-white px-5 py-5 sm:px-[25px] sm:py-[21px]";

function AccountSettings({ user }: { user: User }) {
  const { updateProfile, logout, deleteAccount, db } = useStore();
  const toast = useToast();
  const router = useRouter();

  const [name, setName] = useState(user.name);
  const [email, setEmail] = useState(user.email);
  const [city, setCity] = useState(user.city);
  const [prefs, setPrefs] = useState<Prefs>({ ...user.preferences });
  const [errors, setErrors] = useState<Errors>({});
  const [saved, setSaved] = useState(false);
  const [pwOpen, setPwOpen] = useState(false);
  const [logoutOpen, setLogoutOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleteText, setDeleteText] = useState("");
  const [deleteError, setDeleteError] = useState("");

  const dirty =
    name !== user.name ||
    email !== user.email ||
    city !== user.city ||
    (Object.keys(prefs) as (keyof Prefs)[]).some((k) => prefs[k] !== user.preferences[k]);

  const touch = () => setSaved(false);

  const save = (e: React.FormEvent) => {
    e.preventDefault();
    const er: Errors = {};
    if (name.trim().length < 2) er.name = "Enter your full name.";
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) er.email = "Enter a valid email address.";
    if (!city.trim()) er.city = "Enter your city or ZIP code.";
    setErrors(er);
    if (Object.keys(er).length) {
      toast("Please check the highlighted fields.", "error");
      return;
    }
    const r = updateProfile({ name: name.trim(), email: email.trim().toLowerCase(), city: city.trim(), preferences: prefs });
    if (!r.ok) {
      setErrors({ email: r.error });
      toast(r.error, "error");
      return;
    }
    setSaved(true);
    toast("Your profile changes have been saved.");
  };

  const exportData = () => {
    if (downloadUserData(db, user.id)) toast("Your data download has started.");
    else toast("We couldn’t prepare your data. Please try again.", "error");
  };

  const confirmDelete = () => {
    if (deleteText.trim() !== "DELETE") {
      setDeleteError("Type DELETE in capital letters to confirm.");
      return;
    }
    router.push("/");
    deleteAccount();
    toast("Your account has been deleted. Take care.", "info");
  };

  const signOutEverywhere = () => {
    router.push("/");
    logout();
    toast("You’ve been logged out of all sessions.", "info");
  };

  const fieldErr = (k: keyof Errors, id: string) => ({ "aria-invalid": !!errors[k], "aria-describedby": errors[k] ? `${id}-error` : undefined });

  return (
    <div className="grid gap-6 md:grid-cols-[220px_minmax(0,1fr)] lg:grid-cols-[260px_minmax(0,1fr)] lg:gap-8">
      <div className="md:self-start">
        <AccountNav />
      </div>

      <form onSubmit={save} noValidate className="flex min-w-0 flex-col gap-6">
        {/* Profile details */}
        <section aria-labelledby="profile-heading" className={card}>
          <h2 id="profile-heading" className="text-[22px] font-semibold leading-[1.5] text-ink sm:text-[24px]">Profile details</h2>
          <div className="mt-5 grid gap-x-[26px] gap-y-6 md:grid-cols-2">
            <Field id="acc-name" label="Full name" error={errors.name}>
              <Input id="acc-name" autoComplete="name" value={name} onChange={(e) => { setName(e.target.value); touch(); }} className="!h-[50px] !rounded-[16px] !px-[13px] text-[14px]" {...fieldErr("name", "acc-name")} />
            </Field>
            <Field id="acc-email" label="Email address" error={errors.email}>
              <Input id="acc-email" type="email" autoComplete="email" value={email} onChange={(e) => { setEmail(e.target.value); touch(); }} className="!h-[50px] !rounded-[16px] !px-[13px] text-[14px]" {...fieldErr("email", "acc-email")} />
            </Field>
            <Field id="acc-city" label="City / ZIP code" error={errors.city}>
              <Input id="acc-city" autoComplete="address-level2" value={city} onChange={(e) => { setCity(e.target.value); touch(); }} className="!h-[50px] !rounded-[16px] !px-[13px] text-[14px]" {...fieldErr("city", "acc-city")} />
            </Field>
            <div className="md:pt-[8px]">
              {user.emailVerified ? (
                <p className="text-[13px] font-semibold leading-[1.5] text-brand">✓&nbsp;&nbsp;Email verified</p>
              ) : (
                <p className="text-[13px] font-semibold leading-[1.5] text-warning">Email not verified yet</p>
              )}
              <p className="mt-4 text-[12px] leading-[1.5] text-muted">Your public profile shows your first name and city only.</p>
            </div>
          </div>
        </section>

        {/* Notifications & privacy */}
        <section aria-labelledby="prefs-heading" className={card}>
          <h2 id="prefs-heading" className="text-[22px] font-semibold leading-[1.5] text-ink sm:text-[23px]">Notifications &amp; privacy</h2>
          <ul className="mt-4 divide-y divide-line">
            {PREF_ROWS.map((row) => (
              <li key={row.key} className="flex items-center justify-between gap-6 py-4">
                <div>
                  <p id={`pref-${row.key}-label`} className="text-[14px] font-medium leading-[1.5] text-ink">{row.title}</p>
                  <p className="mt-1 text-[12px] leading-[1.5] text-muted">{row.body}</p>
                </div>
                <Toggle
                  id={`pref-${row.key}`}
                  label={row.title}
                  checked={prefs[row.key]}
                  onChange={(v) => { setPrefs((p) => ({ ...p, [row.key]: v })); touch(); }}
                />
              </li>
            ))}
          </ul>
        </section>

        {/* Security */}
        <section aria-labelledby="security-heading" className={card}>
          <h2 id="security-heading" className="text-[22px] font-semibold leading-[1.5] text-ink sm:text-[23px]">Security</h2>
          <div className="mt-6 flex flex-col gap-4 sm:flex-row sm:flex-wrap sm:items-center sm:gap-5">
            <Button variant="outline" onClick={() => setPwOpen(true)} className="border-field !text-[14px] !text-brand sm:w-[258px]">
              Change password
            </Button>
            <Button variant="outline" onClick={() => setLogoutOpen(true)} className="border-field !text-[14px] !text-brand sm:w-[258px]">
              Log out all sessions
            </Button>
            <Button variant="ghost" onClick={exportData} className="!text-[14px]">
              Download my data
            </Button>
            <button
              type="button"
              onClick={() => setDeleteOpen(true)}
              className="self-start rounded-full px-2 py-1 text-[13px] font-medium text-danger-ink hover:bg-danger-50 sm:ml-auto sm:mr-6 sm:self-center"
            >
              Delete account
            </button>
          </div>
          <p className="mt-5 text-[12px] leading-[1.5] text-muted">
            Account deletion requires confirmation. You can{" "}
            <button type="button" onClick={exportData} className="font-medium text-brand underline-offset-2 hover:underline">export your data</button>{" "}
            before deleting.
          </p>
        </section>

        {saved && <ProfileSavedNotice />}

        <div className="flex flex-col items-stretch gap-3 sm:flex-row sm:items-center sm:justify-end">
          {dirty && <p className="text-[12px] text-muted sm:mr-4">You have unsaved changes.</p>}
          <Button type="submit" disabled={!dirty} className="!text-[14px] sm:w-[278px]">
            Save changes
          </Button>
        </div>
      </form>

      <ChangePasswordDialog open={pwOpen} onClose={() => setPwOpen(false)} />

      <Dialog
        open={logoutOpen}
        onClose={() => setLogoutOpen(false)}
        title="Log out of all sessions?"
        description="You’ll be signed out on this and every other device. You can log back in any time."
        footer={
          <>
            <Button variant="outline" onClick={() => setLogoutOpen(false)}>Cancel</Button>
            <Button onClick={signOutEverywhere}>Log out everywhere</Button>
          </>
        }
      />

      <Dialog
        open={deleteOpen}
        onClose={() => { setDeleteOpen(false); setDeleteText(""); setDeleteError(""); }}
        title="Delete your account?"
        description="This removes your profile and listings. Export your data first. This can’t be undone."
        footer={
          <>
            <Button variant="outline" onClick={() => { setDeleteOpen(false); setDeleteText(""); setDeleteError(""); }}>Cancel</Button>
            <Button variant="danger" onClick={confirmDelete} disabled={deleteText.trim() !== "DELETE"}>Delete account</Button>
          </>
        }
      >
        <label htmlFor="delete-confirm" className="mb-2 block text-[13px] font-semibold text-ink">Type DELETE to confirm</label>
        <Input
          id="delete-confirm"
          value={deleteText}
          autoComplete="off"
          onChange={(e) => { setDeleteText(e.target.value); setDeleteError(""); }}
          onKeyDown={(e) => { if (e.key === "Enter") confirmDelete(); }}
          placeholder="DELETE"
          aria-invalid={!!deleteError}
          aria-describedby={deleteError ? "delete-confirm-error" : undefined}
        />
        <FieldError id="delete-confirm-error">{deleteError}</FieldError>
        <button type="button" onClick={exportData} className="mt-4 text-[13px] font-semibold text-brand hover:underline">
          Download my data first
        </button>
      </Dialog>
    </div>
  );
}

function AccountContent() {
  const { currentUser } = useStore();
  if (!currentUser) return null;
  return <AccountSettings key={currentUser.id} user={currentUser} />;
}

export default function AccountPage() {
  return (
    <PageShell>
      <RequireAuth>
        <div className="container-page">
          <div className="pb-8 pt-8 md:pb-[33px] md:pt-[49px]">
            <h1 className="font-serif text-[32px] leading-[1.2] text-ink md:text-[41px]">Your account. Your peace of mind.</h1>
            <p className="mt-4 text-[15px] leading-[1.5] text-muted">Keep your profile current and choose what you share.</p>
          </div>
          <AccountContent />
        </div>
      </RequireAuth>
    </PageShell>
  );
}
