"use client";

import { usePathname, useRouter } from "next/navigation";
import { useCallback, useSyncExternalStore } from "react";

/**
 * The site's three sections, addressed by URL so the landing buttons, the navbar,
 * the mobile bottom bar and the browser's Back button all agree:
 *   daily    → /#daily
 *   chart    → /
 *   porondam → /porondam
 */
export type Section = "daily" | "chart" | "porondam";

export const SECTION_HREF: Record<Section, string> = {
  daily: "/#daily",
  chart: "/",
  porondam: "/porondam",
};

/**
 * Marks the landing-page section buttons the page scrolls to after a switch.
 * An attribute, not an id: Next keeps the previous page mounted (hidden), so
 * two copies can exist at once and the visible one is chosen at scroll time.
 */
export const SECTIONS_ANCHOR_ATTR = "data-sections-anchor";

const subscribeHash = (onChange: () => void) => {
  window.addEventListener("hashchange", onChange);
  return () => window.removeEventListener("hashchange", onChange);
};
const readHash = () => window.location.hash;

export function useCurrentSection(): Section {
  const pathname = usePathname();
  const hash = useSyncExternalStore(subscribeHash, readHash, () => "");
  if (pathname?.startsWith("/porondam")) return "porondam";
  return hash === "#daily" ? "daily" : "chart";
}

/**
 * Navigates between sections. On the home page, daily/chart switch in place
 * (no reload, form and chart state kept) and add a history entry for Back.
 */
export function useGoToSection() {
  const pathname = usePathname();
  const router = useRouter();

  return useCallback(
    (section: Section, { scroll = true }: { scroll?: boolean } = {}) => {
      if (section === "porondam") {
        router.push(SECTION_HREF.porondam);
        return;
      }
      if (pathname !== "/") {
        router.push(SECTION_HREF[section]);
        return;
      }
      const url = section === "daily" ? "/#daily" : "/";
      if (window.location.pathname + window.location.hash !== url) {
        window.history.pushState(null, "", url);
        window.dispatchEvent(new HashChangeEvent("hashchange"));
      }
      if (scroll) {
        requestAnimationFrame(() => {
          const visible = [...document.querySelectorAll<HTMLElement>(`[${SECTIONS_ANCHOR_ATTR}]`)].find((el) => el.offsetParent !== null);
          visible?.scrollIntoView({ behavior: "smooth", block: "start" });
        });
      }
    },
    [pathname, router],
  );
}
