import type { ReportReason } from "@/lib/types";

export const REPORT_REASON_LABEL: Record<ReportReason, string> = {
  scam: "Possible scam or fraud",
  animal_welfare: "Animal welfare concern",
  inappropriate: "Inappropriate or abusive behavior",
  selling_for_profit: "Selling animals for profit",
  other: "Something else",
};

export const REPORT_REASONS = Object.keys(REPORT_REASON_LABEL) as ReportReason[];
