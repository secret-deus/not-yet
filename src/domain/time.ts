import {
  POST_PURCHASE_REVIEW_DAYS,
} from "./constants";
import type { PurchaseRecord } from "./types";

export function toIso(epochMs: number): string {
  return new Date(epochMs).toISOString();
}

export function addHours(isoOrEpoch: string | number, hours: number): string {
  const start =
    typeof isoOrEpoch === "number" ? isoOrEpoch : Date.parse(isoOrEpoch);
  return toIso(start + hours * 60 * 60 * 1_000);
}

export function addDays(isoOrEpoch: string | number, days: number): string {
  return addHours(isoOrEpoch, days * 24);
}

export function coolingDurationMs(
  preset: "24h" | "3d" | "7d" | "custom",
  customDays?: number,
): number {
  if (preset === "24h") return 24 * 60 * 60 * 1_000;
  if (preset === "3d") return 3 * 24 * 60 * 60 * 1_000;
  if (preset === "7d") return 7 * 24 * 60 * 60 * 1_000;
  if (
    customDays === undefined ||
    !Number.isInteger(customDays) ||
    customDays < 1 ||
    customDays > 30
  ) {
    throw new Error("自定义冷静期必须是 1～30 天的整数。");
  }
  return customDays * 24 * 60 * 60 * 1_000;
}

export function reconcileRecordAt(
  record: PurchaseRecord,
  nowMs: number,
): PurchaseRecord {
  let changed = false;
  let next = record;

  if (
    record.status === "cooling" &&
    Date.parse(record.coolingEndsAt) <= nowMs
  ) {
    next = {
      ...next,
      status: "review_ready",
      updatedAt: toIso(nowMs),
    };
    changed = true;
  }

  if (
    next.status === "purchased" &&
    next.decision?.type === "purchased" &&
    next.postPurchaseReview?.status === "not_due" &&
    Date.parse(next.decision.verificationDueAt) <= nowMs
  ) {
    next = {
      ...next,
      postPurchaseReview: {
        ...next.postPurchaseReview,
        status: "due",
      },
      updatedAt: toIso(nowMs),
    };
    changed = true;
  }

  return changed ? next : record;
}

export function postPurchaseDueAt(purchasedAt: string): string {
  return addDays(purchasedAt, POST_PURCHASE_REVIEW_DAYS);
}

export function millisecondsUntil(iso: string, nowMs: number): number {
  return Date.parse(iso) - nowMs;
}

export function formatRemaining(iso: string, nowMs: number): string {
  const remaining = millisecondsUntil(iso, nowMs);
  if (remaining <= 0) return "可以复盘了";

  const totalMinutes = Math.ceil(remaining / 60_000);
  const days = Math.floor(totalMinutes / (24 * 60));
  const hours = Math.floor((totalMinutes % (24 * 60)) / 60);
  const minutes = totalMinutes % 60;

  if (days > 0) return `还剩 ${days} 天 ${hours} 小时`;
  if (hours > 0) return `还剩 ${hours} 小时 ${minutes} 分钟`;
  return `还剩 ${minutes} 分钟`;
}

export function formatDateTime(iso: string): string {
  return new Intl.DateTimeFormat("zh-CN", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(iso));
}

export function localDateTimeInputValue(date = new Date()): string {
  const pad = (value: number) => String(value).padStart(2, "0");
  return [
    date.getFullYear(),
    "-",
    pad(date.getMonth() + 1),
    "-",
    pad(date.getDate()),
    "T",
    pad(date.getHours()),
    ":",
    pad(date.getMinutes()),
  ].join("");
}
