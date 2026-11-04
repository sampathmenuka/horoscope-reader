import type { Metadata } from "next";
import { PorondamMatcher } from "@/components/PorondamMatcher";

export const metadata: Metadata = {
  title: "විවාහ පොරොන්දම් · Porondam Check",
  description: "Traditional Sri Lankan marriage porondam check from the bride's and groom's birth stars, with Kuja Dosha and a harmony summary.",
};

export default function PorondamPage() {
  return <PorondamMatcher />;
}
