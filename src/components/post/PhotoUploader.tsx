"use client";

/* eslint-disable @next/next/no-img-element */
import { useRef, useState } from "react";
import { PawArtwork } from "./PostWizard";

export const MAX_PHOTOS = 6;
const MAX_BYTES = 10 * 1024 * 1024; // 10 MB per original file
const MAX_EDGE = 900;
const ACCEPTED = ["image/jpeg", "image/png", "image/webp", "image/gif"];

/** Decodes an image file and re-encodes it as a JPEG data URL no larger than 900px on its longest edge. */
async function resizeToDataUrl(file: File): Promise<string> {
  const url = URL.createObjectURL(file);
  try {
    const img = await new Promise<HTMLImageElement>((resolve, reject) => {
      const el = new Image();
      el.onload = () => resolve(el);
      el.onerror = () => reject(new Error("decode"));
      el.src = url;
    });
    const scale = Math.min(1, MAX_EDGE / Math.max(img.naturalWidth, img.naturalHeight));
    const w = Math.max(1, Math.round(img.naturalWidth * scale));
    const h = Math.max(1, Math.round(img.naturalHeight * scale));
    const canvas = document.createElement("canvas");
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("canvas");
    ctx.fillStyle = "white"; // flatten transparency for JPEG
    ctx.fillRect(0, 0, w, h);
    ctx.drawImage(img, 0, 0, w, h);
    return canvas.toDataURL("image/jpeg", 0.82);
  } finally {
    URL.revokeObjectURL(url);
  }
}

/** "Listing artwork" + photo upload (file input & drag-drop, resize, max 6, reorder, cover = first). */
export function PhotoUploader({ photos, onChange, petName }: { photos: string[]; onChange: (photos: string[]) => void; petName: string }) {
  const input = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const name = petName.trim() || "your pet";

  const addFiles = async (list: FileList | File[]) => {
    const files = Array.from(list);
    if (!files.length) return;
    const problems: string[] = [];
    const room = MAX_PHOTOS - photos.length;
    if (room <= 0) {
      setError(`You can add up to ${MAX_PHOTOS} photos. Remove one to add another.`);
      return;
    }
    const valid = files.filter((f) => {
      if (!ACCEPTED.includes(f.type)) {
        problems.push(`“${f.name}” isn’t a JPG, PNG, WebP or GIF image.`);
        return false;
      }
      if (f.size > MAX_BYTES) {
        problems.push(`“${f.name}” is larger than 10 MB.`);
        return false;
      }
      return true;
    });
    if (valid.length > room) problems.push(`Only ${room} more photo${room === 1 ? "" : "s"} can be added (max ${MAX_PHOTOS}).`);
    setBusy(true);
    const added: string[] = [];
    for (const f of valid.slice(0, room)) {
      try {
        added.push(await resizeToDataUrl(f));
      } catch {
        problems.push(`We couldn’t read “${f.name}”. Try a different image.`);
      }
    }
    setBusy(false);
    setError(problems.length ? problems.join(" ") : null);
    if (added.length) onChange([...photos, ...added]);
  };

  const move = (i: number, to: number) => {
    if (to < 0 || to >= photos.length) return;
    const next = [...photos];
    const [p] = next.splice(i, 1);
    next.splice(to, 0, p);
    onChange(next);
  };

  return (
    <div>
      <h3 className="text-[13px] font-medium leading-[1.5] text-ink">Listing artwork</h3>

      <div className="mt-4 flex flex-col gap-5 sm:flex-row sm:items-start sm:gap-[26px]">
        <div
          className={`flex h-[142px] w-[170px] shrink-0 flex-col items-center justify-end overflow-hidden rounded-[14px] pb-[13px] ${
            photos.length === 0 ? "bg-sage-150 ring-2 ring-brand" : "bg-sand-100"
          }`}
        >
          {photos.length === 0 ? (
            <>
              <PawArtwork width={65} className="mb-auto mt-[29px]" />
              <span className="text-[12px] font-semibold leading-[1.4] text-brand">✓&nbsp;&nbsp;Paw artwork</span>
            </>
          ) : (
            <>
              <img src={photos[0]} alt="" className="mb-auto h-[100px] w-full object-cover" />
              <span className="text-[12px] font-semibold leading-[1.4] text-brand">✓&nbsp;&nbsp;Cover photo</span>
            </>
          )}
        </div>
        <div className="pt-2">
          <p className="text-[16px] font-semibold leading-[1.5] text-ink">
            {photos.length === 0 ? "Your Pawhaven artwork is selected." : `${photos.length} photo${photos.length === 1 ? "" : "s"} added. The first one is the cover.`}
          </p>
          <p className="mt-4 text-[13px] leading-[1.55] text-muted">
            Add up to {MAX_PHOTOS} real photos, or keep the artwork. Pet details and a thoughtful story help people get to know {name}.
          </p>
        </div>
      </div>

      {/* Drop zone */}
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragging(false);
          void addFiles(e.dataTransfer.files);
        }}
        className={`mt-6 flex flex-col items-center justify-center gap-2 rounded-[14px] border-2 border-dashed px-5 py-7 text-center transition ${
          dragging ? "border-brand bg-sage-50" : "border-line bg-canvas"
        }`}
      >
        <p className="text-[14px] font-semibold text-ink">{busy ? "Preparing photos…" : "Drag photos here"}</p>
        <p className="text-[12px] text-muted">JPG, PNG, WebP or GIF · up to 10 MB each · {photos.length}/{MAX_PHOTOS} added</p>
        <button
          type="button"
          disabled={busy || photos.length >= MAX_PHOTOS}
          onClick={() => input.current?.click()}
          className="mt-2 inline-flex h-10 items-center rounded-full border border-line bg-white px-5 text-[13px] font-semibold text-brand transition hover:border-brand disabled:cursor-not-allowed disabled:opacity-50"
        >
          Choose photos
        </button>
        <input
          ref={input}
          type="file"
          accept={ACCEPTED.join(",")}
          multiple
          className="sr-only"
          tabIndex={-1}
          aria-label="Upload pet photos"
          onChange={(e) => {
            if (e.target.files) void addFiles(e.target.files);
            e.target.value = "";
          }}
        />
      </div>
      {error && (
        <p role="alert" className="mt-2 text-[13px] text-danger">
          {error}
        </p>
      )}

      {photos.length > 0 && (
        <ul className="mt-5 grid grid-cols-2 gap-4 sm:grid-cols-3">
          {photos.map((src, i) => (
            <li key={`${i}-${src.slice(-24)}`} className="overflow-hidden rounded-[14px] border border-line bg-white">
              <div className="relative aspect-[4/3] bg-sand-100">
                <img src={src} alt={`Photo ${i + 1} of ${name}`} className="size-full object-cover" />
                {i === 0 && <span className="absolute left-2 top-2 rounded-full bg-brand px-2.5 py-1 text-[11px] font-semibold text-white">Cover</span>}
              </div>
              <div className="flex flex-wrap items-center gap-1 p-2 text-[12px] font-semibold">
                {i > 0 && (
                  <button type="button" onClick={() => move(i, 0)} aria-label={`Make photo ${i + 1} the cover`} className="rounded-full px-2 py-1 text-brand hover:bg-sage-100">
                    Make cover
                  </button>
                )}
                <button type="button" onClick={() => move(i, i - 1)} disabled={i === 0} aria-label={`Move photo ${i + 1} earlier`} className="rounded-full px-2 py-1 text-ink hover:bg-sage-100 disabled:opacity-30">
                  ←
                </button>
                <button
                  type="button"
                  onClick={() => move(i, i + 1)}
                  disabled={i === photos.length - 1}
                  aria-label={`Move photo ${i + 1} later`}
                  className="rounded-full px-2 py-1 text-ink hover:bg-sage-100 disabled:opacity-30"
                >
                  →
                </button>
                <button type="button" onClick={() => onChange(photos.filter((_, j) => j !== i))} aria-label={`Remove photo ${i + 1}`} className="ml-auto rounded-full px-2 py-1 text-danger hover:bg-danger-50">
                  Remove
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
