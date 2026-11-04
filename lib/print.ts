/**
 * Two print layouts share the results page:
 *  - "kendaraya": the single-page traditional A4 Handahana (PrintableHandahana)
 *  - default: the full multi-page reading
 * The mode is a data attribute on <html> that the print CSS keys off, and is
 * cleared once the print dialog closes.
 */
type PrintMode = "kendaraya" | "report";

function printAs(mode: PrintMode): void {
  const root = document.documentElement;
  root.dataset.print = mode;
  window.addEventListener("afterprint", () => delete root.dataset.print, { once: true });
  window.print();
}

export const printKendaraya = () => printAs("kendaraya");
export const printFullReading = () => printAs("report");
