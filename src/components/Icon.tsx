/* eslint-disable @next/next/no-img-element */
/**
 * Renders a Figma-exported SVG from /public/icons at its design size.
 * Names map to files in public/icons (downloaded from the PawHaven Figma file).
 */
export type IconName =
  | "paw-logo" | "paw-small" | "paw-search" | "paw-hero" | "paw-cta" | "paw-footer"
  | "paw-card-green" | "paw-card-peach" | "paw-card-lilac"
  | "arrow-right" | "arrow-right-2" | "arrow-right-white"
  | "heart" | "heart-outline" | "chevron-down" | "chevron-right"
  | "pin" | "pin-small" | "search" | "search-white"
  | "dog" | "cat" | "rabbit" | "bird" | "chat" | "home" | "shield"
  | (string & {});

export function Icon({ name, size = 20, className = "", alt = "" }: { name: IconName; size?: number; className?: string; alt?: string }) {
  return <img src={`/icons/${name}.svg`} alt={alt} width={size} height={size} className={`shrink-0 ${className}`} style={{ width: size, height: size }} />;
}
