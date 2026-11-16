"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense, type ReactNode } from "react";
import { PageShell } from "@/components/layout/PageShell";
import { Accordion } from "@/components/states/Accordion";
import { ContactForm, ReportForm } from "@/components/states/SafetyForms";
import type { Report } from "@/lib/types";

const PRINCIPLES = [
  { n: "01", title: "Meet thoughtfully", body: "Arrange a safe meet-and-greet. Never send a deposit before meeting." },
  { n: "02", title: "Ask the right questions", body: "Discuss health, care, and behavior. Request veterinary records privately." },
  { n: "03", title: "Keep welfare first", body: "No wildlife, illegal sales, or pet shipping. Rehome responsibly, never in a rush." },
];

const FAQ = [
  { q: "How does adoption work?", a: "Start with a request, chat, and a safe meeting. The shelter or pet parent handles the final adoption." },
  { q: "How do I spot a scam?", a: "Be wary of urgent deposits, shipping offers, and anyone refusing an in-person meeting." },
  { q: "What can I post?", a: "Only pets you own or are authorized to represent. No wildlife, endangered animals, or prohibited trade." },
  { q: "What if an animal is in danger?", a: "For immediate danger, contact local animal welfare authorities or emergency services." },
];

const card = "rounded-[16px] border border-field bg-white p-6 sm:p-7";
const h2 = "font-serif text-[26px] leading-[1.25] text-ink sm:text-[29px]";

function InfoSection({ id, title, children }: { id: string; title: string; children: ReactNode }) {
  return (
    <section id={id} aria-labelledby={`${id}-heading`} className={`${card} scroll-mt-28`}>
      <h2 id={`${id}-heading`} className="font-serif text-[24px] leading-[1.25] text-ink">{title}</h2>
      <div className="mt-4 space-y-3 text-[14px] leading-[1.55] text-muted [&_a]:font-semibold [&_a]:text-brand [&_a:hover]:underline [&_li]:pl-1 [&_ul]:list-disc [&_ul]:space-y-2 [&_ul]:pl-5">
        {children}
      </div>
    </section>
  );
}

function ReportFromParams() {
  const params = useSearchParams();
  const t = params.get("report");
  const target = params.get("target") ?? "";
  const type: Report["targetType"] = t === "user" || t === "message" ? t : "pet";
  const link = target ? (type === "pet" ? `/pets/${target}` : type === "message" ? `/messages?c=${target}` : target) : "";
  return <ReportForm key={`${type}-${target}`} initialType={type} initialLink={link} />;
}

export default function SafetyPage() {
  return (
    <PageShell>
      <div className="container-page">
        <div className="pb-8 pt-8 md:pb-[38px] md:pt-[49px]">
          <h1 className="font-serif text-[32px] leading-[1.2] text-ink md:text-[41px]">A safer place for every paw.</h1>
          <p className="mt-4 text-[15px] leading-[1.5] text-muted">
            Practical guidance, clear rules, and help when something doesn’t feel right.
          </p>
        </div>

        {/* Community safety principles */}
        <section aria-label="Community safety principles" className="grid gap-8 rounded-[18px] bg-sage-50 px-6 py-6 md:grid-cols-3 md:gap-12 md:px-7 md:pb-[45px] md:pt-6">
          {PRINCIPLES.map((p) => (
            <div key={p.n}>
              <p className="font-serif text-[24px] leading-[1.2] text-numeral">{p.n}</p>
              <h2 className="mt-4 text-[20px] font-semibold leading-[1.45] text-ink">{p.title}</h2>
              <p className="mt-3 text-[14px] leading-[1.45] text-muted">{p.body}</p>
            </div>
          ))}
        </section>

        <div className="mt-8 grid gap-7 lg:grid-cols-[620fr_648fr]">
          {/* FAQ */}
          <section aria-labelledby="faq-heading" className={card}>
            <h2 id="faq-heading" className={h2}>Here when you need us.</h2>
            <div className="mt-8">
              <Accordion items={FAQ} defaultOpen={[0, 1, 2, 3]} />
            </div>
            <p className="mt-6 text-[13px] text-muted">
              Still need help? <a href="#contact" className="font-semibold text-brand hover:underline">Contact our team</a>.
            </p>
          </section>

          {/* Report a concern */}
          <section id="report" aria-labelledby="report-heading" className={`${card} scroll-mt-28`}>
            <h2 id="report-heading" className={h2}>Something doesn’t feel right?</h2>
            <p className="mb-7 mt-5 text-[13px] leading-[1.5] text-muted">Reports are private and reviewed by our moderation team.</p>
            <Suspense fallback={<ReportForm />}>
              <ReportFromParams />
            </Suspense>
          </section>
        </div>

        {/* Contact */}
        <section id="contact" aria-labelledby="contact-heading" className={`${card} mt-8 grid scroll-mt-28 gap-8 lg:grid-cols-[1fr_1.6fr]`}>
          <div>
            <h2 id="contact-heading" className={h2}>Contact our team.</h2>
            <p className="mt-4 text-[14px] leading-[1.55] text-muted">
              Questions about an adoption, a listing, or your account? Send us a note and a real person will get back to you, usually within one business day.
            </p>
            <p className="mt-4 text-[13px] leading-[1.55] text-muted">
              For immediate danger to a person or animal, contact local authorities or emergency services first.
            </p>
          </div>
          <ContactForm />
        </section>

        {/* Resources & policies (footer anchors) */}
        <div className="mt-8 grid gap-7 md:grid-cols-2">
          <InfoSection id="resources" title="Pet care resources">
            <ul>
              <li>Book a vet check within the first two weeks of bringing a pet home.</li>
              <li>Keep vaccination, microchip, and spay/neuter records together and up to date.</li>
              <li>Give a new companion a quiet space and a predictable routine for the first few days.</li>
              <li>Ask the previous carer about food, favorite toys, and anything that makes them nervous.</li>
            </ul>
            <p>Looking for your next friend? <Link href="/pets">Browse pets near you</Link>.</p>
          </InfoSection>

          <InfoSection id="rehoming" title="Responsible rehoming guide">
            <ul>
              <li>Write an honest listing: health, behavior, and the reason you’re rehoming.</li>
              <li>Take your time reviewing requests and chat before agreeing to meet.</li>
              <li>Meet in a safe, public place or at home with someone you trust present.</li>
              <li>Hand over medical records, and keep the adoption fee modest — never profit from rehoming.</li>
            </ul>
            <p>Ready to start? <Link href="/post">Post a pet</Link> or <Link href="/my-listings">manage your listings</Link>.</p>
          </InfoSection>

          <InfoSection id="privacy" title="Privacy policy">
            <p>
              We collect only what we need to connect pets with people: your profile, listings, requests, and messages. Your public profile shows your first name and city only. We never sell your data.
            </p>
            <p>
              You can update what you share, download a copy of your data, or delete your account at any time from <Link href="/account">Account &amp; privacy</Link>.
            </p>
          </InfoSection>

          <InfoSection id="terms" title="Terms of use">
            <ul>
              <li>Only post pets you own or are authorized to represent.</li>
              <li>No wildlife, endangered animals, breeding for sale, or pet shipping.</li>
              <li>Pawhaven doesn’t collect adoption payments. Never send a deposit before meeting.</li>
              <li>Be kind. Harassment, discrimination, and scams lead to account removal.</li>
            </ul>
          </InfoSection>

          <InfoSection id="accessibility" title="Accessibility">
            <p>
              We aim to meet WCAG 2.1 AA. Pawhaven supports keyboard navigation, screen readers, visible focus states, and text resizing.
            </p>
            <p>
              Found a barrier? <a href="#contact">Tell us</a> and choose “Accessibility” as the topic — we’ll prioritise a fix.
            </p>
          </InfoSection>
        </div>
      </div>
    </PageShell>
  );
}
