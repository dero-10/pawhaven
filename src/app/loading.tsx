import { LoadingBlock } from "@/components/layout/PageShell";

/** Route-level loading fallback. Kept chrome-free so it never flashes a second header. */
export default function Loading() {
  return (
    <div className="min-h-[60vh] bg-canvas">
      <LoadingBlock label="Fetching a few good friends…" />
    </div>
  );
}
