import type { PurchaseRecord } from "./types";

export type ListFilter = "waiting" | "ready" | "decided";

export function filterRecords(
  records: PurchaseRecord[],
  filter: ListFilter,
): PurchaseRecord[] {
  if (filter === "waiting") {
    return records.filter((record) => record.status === "cooling");
  }
  if (filter === "ready") {
    return records.filter((record) => record.status === "review_ready");
  }
  return records.filter(
    (record) => record.status === "skipped" || record.status === "purchased",
  );
}

function decidedAt(record: PurchaseRecord): number {
  return record.decision ? Date.parse(record.decision.decidedAt) : 0;
}

export function sortRecords(
  records: PurchaseRecord[],
  nowMs: number,
): PurchaseRecord[] {
  return [...records].sort((a, b) => {
    if (a.status === "review_ready" && b.status !== "review_ready") return -1;
    if (b.status === "review_ready" && a.status !== "review_ready") return 1;

    if (a.status === "cooling" && b.status === "cooling") {
      return (
        Math.max(0, Date.parse(a.coolingEndsAt) - nowMs) -
        Math.max(0, Date.parse(b.coolingEndsAt) - nowMs)
      );
    }
    if (a.status === "cooling" && b.status !== "cooling") return -1;
    if (b.status === "cooling" && a.status !== "cooling") return 1;

    return decidedAt(b) - decidedAt(a);
  });
}

export function recordCounts(records: PurchaseRecord[]) {
  return {
    waiting: records.filter((record) => record.status === "cooling").length,
    ready: records.filter((record) => record.status === "review_ready").length,
    decided: records.filter(
      (record) => record.status === "skipped" || record.status === "purchased",
    ).length,
  };
}
