import { DECISION_UNDO_WINDOW_MS } from "@/src/domain/constants";
import type { PurchaseRecord } from "@/src/domain/types";
import type { Notice } from "./app-context";

export function findRecord(
  items: PurchaseRecord[],
  id: string,
): PurchaseRecord {
  const record = items.find((item) => item.id === id);
  if (!record) throw new Error("这条记录不存在，可能已经被删除。");
  return record;
}

export function replaceRecord(
  items: PurchaseRecord[],
  nextRecord: PurchaseRecord,
): PurchaseRecord[] {
  return items.map((item) => (item.id === nextRecord.id ? nextRecord : item));
}

export function pendingNotice(
  items: PurchaseRecord[],
  nowMs: number,
): Notice | null {
  const candidates: Notice[] = [];
  for (const record of items) {
    if (
      record.deleteExpiresAt &&
      Date.parse(record.deleteExpiresAt) > nowMs
    ) {
      candidates.push({
        kind: "delete",
        recordId: record.id,
        message: `已删除“${record.title}”`,
        expiresAt: Date.parse(record.deleteExpiresAt),
      });
    }
    if (
      record.decision &&
      Date.parse(record.decision.decidedAt) + DECISION_UNDO_WINDOW_MS > nowMs
    ) {
      candidates.push({
        kind: "decision",
        recordId: record.id,
        message:
          record.decision.type === "purchased"
            ? "已记录为买了"
            : "已记录为先不买",
        expiresAt:
          Date.parse(record.decision.decidedAt) + DECISION_UNDO_WINDOW_MS,
      });
    }
  }
  return candidates.sort((a, b) => b.expiresAt - a.expiresAt)[0] ?? null;
}
