import {
  AI_DISCLAIMER,
  DECISION_UNDO_WINDOW_MS,
  DELETE_UNDO_WINDOW_MS,
  LOCAL_CHECKLIST,
} from "./constants";
import { yuanToMinor } from "./money";
import { validateRecord } from "./schema";
import {
  coolingDurationMs,
  postPurchaseDueAt,
  reconcileRecordAt,
  toIso,
} from "./time";
import type {
  AiSession,
  LocalChecklistSession,
  NeedOutcome,
  PurchaseRecord,
  RecordDraft,
  ReflectionItemStatus,
  TimelineEvent,
  TimelineEventType,
} from "./types";

export class DomainActionError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "DomainActionError";
  }
}

function id(): string {
  return crypto.randomUUID();
}

function event(
  type: TimelineEventType,
  at: string,
  summary?: string,
): TimelineEvent {
  return { id: id(), type, at, ...(summary ? { summary } : {}) };
}

function optionalText(value?: string): string | undefined {
  const trimmed = value?.trim();
  return trimmed ? trimmed : undefined;
}

function parseExpectedUses(value?: string): number | undefined {
  const trimmed = value?.trim();
  if (!trimmed) return undefined;
  const parsed = Number(trimmed);
  if (!Number.isInteger(parsed) || parsed < 0 || parsed > 99) {
    throw new DomainActionError("每周预计使用次数需为 0～99 的整数。");
  }
  return parsed;
}

function recordFields(draft: RecordDraft) {
  return {
    title: draft.title.trim(),
    priceMinor: yuanToMinor(draft.priceYuan),
    reason: optionalText(draft.reason),
    intendedUse: optionalText(draft.intendedUse),
    expectedUsesPerWeek: parseExpectedUses(draft.expectedUsesPerWeek),
    existingAlternative: optionalText(draft.existingAlternative),
    desireLevel: draft.desireLevel,
    productUrl: optionalText(draft.productUrl),
  };
}

export function createRecord(
  draft: RecordDraft,
  nowMs: number,
  recordId = id(),
): PurchaseRecord {
  const at = toIso(nowMs);
  const duration = coolingDurationMs(
    draft.coolingPreset,
    draft.customCoolingDays,
  );
  const record: PurchaseRecord = {
    id: recordId,
    ...recordFields(draft),
    currency: "CNY",
    status: "cooling",
    coolingStartedAt: at,
    coolingEndsAt: toIso(nowMs + duration),
    coolingRound: 1,
    reflectionSessions: [],
    timeline: [event("created", at)],
    createdAt: at,
    updatedAt: at,
  };
  return validateRecord(record);
}

export function editRecord(
  record: PurchaseRecord,
  draft: RecordDraft,
  nowMs: number,
): PurchaseRecord {
  const at = toIso(nowMs);
  const next = {
    ...record,
    ...recordFields(draft),
    updatedAt: at,
    timeline: [...record.timeline, event("edited", at)],
  };
  return validateRecord(next);
}

export function adjustCooling(
  record: PurchaseRecord,
  days: number,
  nowMs: number,
): PurchaseRecord {
  if (record.status !== "cooling") {
    throw new DomainActionError("只有冷静期中的记录可以调整时间。");
  }
  const duration = coolingDurationMs("custom", days);
  const at = toIso(nowMs);
  return validateRecord({
    ...record,
    coolingStartedAt: at,
    coolingEndsAt: toIso(nowMs + duration),
    coolingRound: record.coolingRound + 1,
    updatedAt: at,
    timeline: [
      ...record.timeline,
      event("cooling_adjusted", at, `调整为 ${days} 天`),
    ],
  });
}

export function startReview(
  record: PurchaseRecord,
  nowMs: number,
): PurchaseRecord {
  const reconciled = reconcileRecordAt(record, nowMs);
  if (reconciled.status !== "cooling" && reconciled.status !== "review_ready") {
    throw new DomainActionError("这条记录已经做出决定。");
  }
  if (reconciled.status === "review_ready") return reconciled;
  const at = toIso(nowMs);
  return validateRecord({
    ...reconciled,
    status: "review_ready",
    updatedAt: at,
    timeline: [...reconciled.timeline, event("review_started", at)],
  });
}

export function extendWaiting(
  record: PurchaseRecord,
  days: number,
  reason: string | undefined,
  nowMs: number,
): PurchaseRecord {
  if (record.status !== "review_ready") {
    throw new DomainActionError("请先进入复盘，再决定继续等待。");
  }
  const duration = coolingDurationMs("custom", days);
  const at = toIso(nowMs);
  return validateRecord({
    ...record,
    status: "cooling",
    coolingStartedAt: at,
    coolingEndsAt: toIso(nowMs + duration),
    coolingRound: record.coolingRound + 1,
    updatedAt: at,
    timeline: [
      ...record.timeline,
      event(
        "waiting_extended",
        at,
        optionalText(reason) ?? `继续等待 ${days} 天`,
      ),
    ],
  });
}

export function decideSkipped(
  record: PurchaseRecord,
  reason: string | undefined,
  nowMs: number,
): PurchaseRecord {
  if (record.status !== "review_ready") {
    throw new DomainActionError("只有待复盘的记录才能做最终决定。");
  }
  const at = toIso(nowMs);
  return validateRecord({
    ...record,
    status: "skipped",
    decision: {
      type: "skipped",
      decidedAt: at,
      reason: optionalText(reason),
    },
    updatedAt: at,
    timeline: [...record.timeline, event("skipped", at)],
  });
}

export function decidePurchased(
  record: PurchaseRecord,
  input: {
    actualPriceYuan?: string;
    purchasedAt?: string;
    reason?: string;
  },
  nowMs: number,
): PurchaseRecord {
  if (record.status !== "review_ready") {
    throw new DomainActionError("只有待复盘的记录才能做最终决定。");
  }
  const decidedAt = toIso(nowMs);
  const purchasedAt = input.purchasedAt
    ? new Date(input.purchasedAt).toISOString()
    : decidedAt;
  return validateRecord({
    ...record,
    status: "purchased",
    decision: {
      type: "purchased",
      decidedAt,
      actualPriceMinor: yuanToMinor(input.actualPriceYuan),
      purchasedAt,
      reason: optionalText(input.reason),
      verificationDueAt: postPurchaseDueAt(purchasedAt),
    },
    postPurchaseReview: {
      status: "not_due",
      reviewWindowDays: 7,
    },
    updatedAt: decidedAt,
    timeline: [...record.timeline, event("purchased", decidedAt)],
  });
}

export function undoDecision(
  record: PurchaseRecord,
  nowMs: number,
): PurchaseRecord {
  if (!record.decision) {
    throw new DomainActionError("这条记录没有可撤销的决定。");
  }
  if (
    nowMs - Date.parse(record.decision.decidedAt) >=
    DECISION_UNDO_WINDOW_MS
  ) {
    throw new DomainActionError("决定的撤销时间已经结束。");
  }
  const at = toIso(nowMs);
  return validateRecord({
    ...record,
    status: "review_ready",
    decision: undefined,
    postPurchaseReview: undefined,
    updatedAt: at,
    timeline: [...record.timeline, event("decision_undone", at)],
  });
}

export function requestDelete(
  record: PurchaseRecord,
  nowMs: number,
): PurchaseRecord {
  if (record.deletedAt) return record;
  const at = toIso(nowMs);
  return validateRecord({
    ...record,
    deletedAt: at,
    deleteExpiresAt: toIso(nowMs + DELETE_UNDO_WINDOW_MS),
    updatedAt: at,
    timeline: [...record.timeline, event("delete_requested", at)],
  });
}

export function undoDelete(
  record: PurchaseRecord,
  nowMs: number,
): PurchaseRecord {
  if (!record.deletedAt || !record.deleteExpiresAt) {
    throw new DomainActionError("这条记录没有待撤销的删除。");
  }
  if (nowMs >= Date.parse(record.deleteExpiresAt)) {
    throw new DomainActionError("删除的撤销时间已经结束。");
  }
  const at = toIso(nowMs);
  return validateRecord({
    ...record,
    deletedAt: undefined,
    deleteExpiresAt: undefined,
    updatedAt: at,
    timeline: [...record.timeline, event("delete_undone", at)],
  });
}

export function finalizeDeleted(
  records: PurchaseRecord[],
  nowMs: number,
): PurchaseRecord[] {
  return records.filter(
    (record) =>
      !record.deleteExpiresAt || Date.parse(record.deleteExpiresAt) > nowMs,
  );
}

export function completePostPurchaseReview(
  record: PurchaseRecord,
  input: {
    actualUseCount: number;
    needOutcome: NeedOutcome;
    satisfaction: 1 | 2 | 3 | 4 | 5;
    hadUnexpectedCost: boolean;
    unexpectedCostYuan?: string;
    note?: string;
  },
  nowMs: number,
): PurchaseRecord {
  if (
    record.status !== "purchased" ||
    record.decision?.type !== "purchased" ||
    !record.postPurchaseReview
  ) {
    throw new DomainActionError("只有已购买的记录才能填写使用验证。");
  }
  if (
    !Number.isInteger(input.actualUseCount) ||
    input.actualUseCount < 0 ||
    input.actualUseCount > 99
  ) {
    throw new DomainActionError("最近 7 天使用次数需为 0～99 的整数。");
  }
  const at = toIso(nowMs);
  return validateRecord({
    ...record,
    postPurchaseReview: {
      status: "completed",
      reviewWindowDays: 7,
      actualUseCount: input.actualUseCount,
      needOutcome: input.needOutcome,
      satisfaction: input.satisfaction,
      hadUnexpectedCost: input.hadUnexpectedCost,
      unexpectedCostMinor: input.hadUnexpectedCost
        ? yuanToMinor(input.unexpectedCostYuan)
        : undefined,
      note: optionalText(input.note),
      completedAt: at,
    },
    updatedAt: at,
    timeline: [
      ...record.timeline,
      event("post_purchase_review_completed", at),
    ],
  });
}

export function makeLocalChecklistSession(
  nowMs: number,
): LocalChecklistSession {
  return {
    id: id(),
    source: "local_checklist",
    generatedAt: toIso(nowMs),
    items: LOCAL_CHECKLIST.map((question, index) => ({
      id: `local-${index + 1}`,
      question,
      status: "pending",
    })),
  };
}

export function appendReflectionSession(
  record: PurchaseRecord,
  session: AiSession | LocalChecklistSession,
  nowMs: number,
): PurchaseRecord {
  const at = toIso(nowMs);
  return validateRecord({
    ...record,
    reflectionSessions: [...record.reflectionSessions, session],
    updatedAt: at,
    timeline: [
      ...record.timeline,
      event(
        "ai_generated",
        at,
        session.source === "remote_ai" ? "生成 AI 反思" : "打开本地检查清单",
      ),
    ],
  });
}

export function updateReflectionItem(
  record: PurchaseRecord,
  sessionId: string,
  itemId: string,
  status: ReflectionItemStatus,
  userEditedText: string | undefined,
  nowMs: number,
): PurchaseRecord {
  const sessionIndex = record.reflectionSessions.findIndex(
    (session) => session.id === sessionId,
  );
  if (sessionIndex < 0) {
    throw new DomainActionError("找不到这次反思记录。");
  }
  const currentSession = record.reflectionSessions[sessionIndex];
  let updatedSession: AiSession | LocalChecklistSession;
  if (currentSession.source === "remote_ai") {
    updatedSession = {
      ...currentSession,
      itemStates: {
        ...currentSession.itemStates,
        [itemId]: {
          status,
          ...(optionalText(userEditedText)
            ? { userEditedText: optionalText(userEditedText) }
            : {}),
        },
      },
    };
  } else {
    updatedSession = {
      ...currentSession,
      items: currentSession.items.map((item) =>
        item.id === itemId
          ? {
              ...item,
              status,
              ...(optionalText(userEditedText)
                ? { userEditedText: optionalText(userEditedText) }
                : {}),
            }
          : item,
      ),
    };
  }
  const sessions = [...record.reflectionSessions];
  sessions[sessionIndex] = updatedSession;
  const at = toIso(nowMs);
  return validateRecord({
    ...record,
    reflectionSessions: sessions,
    updatedAt: at,
    timeline:
      status === "adopted"
        ? [
            ...record.timeline,
            event("ai_item_adopted", at, userEditedText ?? itemId),
          ]
        : record.timeline,
  });
}

export function withFixedDisclaimer(
  result: AiSession["result"],
): AiSession["result"] {
  return { ...result, disclaimer: AI_DISCLAIMER };
}
