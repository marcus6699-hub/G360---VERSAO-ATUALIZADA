import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs) {
  return twMerge(clsx(inputs));
}

export function parseSafeReviewCount(val, fallback = 0) {
  if (val === undefined || val === null || val === "") return fallback;
  if (typeof val === "number") {
    if (!Number.isInteger(val) && val > 0 && val < 100) {
      const strVal = String(val);
      if (strVal.includes(".")) {
        const parts = strVal.split(".");
        if (parts[1] && parts[1].length === 3) {
          return parseInt(parts[0] + parts[1], 10);
        }
      }
    }
    return Math.round(val);
  }
  const cleanStr = String(val).trim();
  const digitsOnly = cleanStr.replace(/[^0-9]/g, "");
  const parsed = parseInt(digitsOnly, 10);
  return Number.isFinite(parsed) ? parsed : fallback;
}

