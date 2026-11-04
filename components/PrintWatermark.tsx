import { LotusMark } from "@/components/LanguageModal";

/**
 * Diagonal brand watermark for the printed / PDF Handahana.
 *
 * Only rendered in print (`print-only`). Being `position: fixed`, Chromium and
 * Firefox repeat it on every printed page. It sits above the content at low
 * opacity, as the white print cards would otherwise hide anything placed behind.
 */
export function PrintWatermark({ name }: { name: string }) {
  return (
    <div className="print-only" aria-hidden>
      <div className="print-watermark">
        <div className="print-watermark__inner">
          <LotusMark className="print-watermark__logo" />
          <p className="print-watermark__title">හඳහන</p>
          <p className="print-watermark__subtitle">Handahana</p>
          <p className="print-watermark__name">{name}</p>
        </div>
      </div>
    </div>
  );
}
