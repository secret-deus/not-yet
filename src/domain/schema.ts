import { z } from "zod";
import { AI_DISCLAIMER } from "./constants";
import type {
  AiReflectionResult,
  PurchaseRecord,
  StorageEnvelope,
} from "./types";

const isoString = z.string().datetime({ offset: true });
const minorAmount = z.number().int().min(0).max(9_999_999_999);
const optionalTrimmed = (max: number) =>
  z.string().trim().max(max).optional().or(z.literal(""));

const timelineEventSchema = z.object({
  id: z.string().min(1),
  type: z.enum([
    "created",
    "edited",
    "cooling_adjusted",
    "review_started",
    "waiting_extended",
    "skipped",
    "purchased",
    "decision_undone",
    "ai_generated",
    "ai_item_adopted",
    "delete_requested",
    "delete_undone",
    "post_purchase_review_completed",
  ]),
  at: isoString,
  summary: z.string().max(300).optional(),
});

const reflectionStateSchema = z.object({
  status: z.enum(["pending", "adopted", "later", "ignored"]),
  userEditedText: z.string().max(500).optional(),
});

export const aiReflectionResultSchema = z
  .object({
    underlyingNeed: z.object({
      text: z.string().trim().min(1).max(400),
      basedOn: z.array(z.string().trim().min(1).max(100)).max(6),
    }),
    missingEvidence: z
      .array(
        z.object({
          id: z.string().min(1).max(80),
          question: z.string().trim().min(1).max(300),
          whyItMatters: z.string().trim().min(1).max(300),
        }),
      )
      .min(1)
      .max(3),
    alternatives: z
      .array(
        z.object({
          id: z.string().min(1).max(80),
          idea: z.string().trim().min(1).max(300),
          tradeoff: z.string().trim().min(1).max(300),
        }),
      )
      .min(2)
      .max(3),
    coolingExperiment: z.object({
      id: z.string().min(1).max(80),
      title: z.string().trim().min(1).max(200),
      steps: z.array(z.string().trim().min(1).max(260)).min(1).max(4),
      duration: z.string().trim().min(1).max(100),
      completionSignal: z.string().trim().min(1).max(220),
    }),
    reflectionQuestions: z
      .array(z.string().trim().min(1).max(300))
      .min(2)
      .max(3),
    informationCompleteness: z.enum(["low", "medium", "high"]),
    disclaimer: z.string().max(200).optional().default(AI_DISCLAIMER),
  })
  .strict();

const aiSessionSchema = z.object({
  id: z.string().min(1),
  source: z.literal("remote_ai"),
  inputHash: z.string().min(1),
  schemaVersion: z.literal("1"),
  promptVersion: z.string().min(1),
  generatedAt: isoString,
  result: aiReflectionResultSchema,
  itemStates: z.record(z.string(), reflectionStateSchema),
});

const localChecklistSessionSchema = z.object({
  id: z.string().min(1),
  source: z.literal("local_checklist"),
  generatedAt: isoString,
  items: z.array(
    z.object({
      id: z.string().min(1),
      question: z.string().min(1).max(500),
      status: z.enum(["pending", "adopted", "later", "ignored"]),
      userEditedText: z.string().max(500).optional(),
    }),
  ),
});

const decisionSchema = z.discriminatedUnion("type", [
  z.object({
    type: z.literal("skipped"),
    decidedAt: isoString,
    reason: optionalTrimmed(500),
  }),
  z.object({
    type: z.literal("purchased"),
    decidedAt: isoString,
    actualPriceMinor: minorAmount.optional(),
    purchasedAt: isoString,
    reason: optionalTrimmed(500),
    verificationDueAt: isoString,
  }),
]);

const postPurchaseReviewSchema = z
  .object({
    status: z.enum(["not_due", "due", "completed"]),
    reviewWindowDays: z.literal(7),
    actualUseCount: z.number().int().min(0).max(99).optional(),
    needOutcome: z.enum(["met", "partly_met", "not_met"]).optional(),
    satisfaction: z.union([
      z.literal(1),
      z.literal(2),
      z.literal(3),
      z.literal(4),
      z.literal(5),
    ]).optional(),
    hadUnexpectedCost: z.boolean().optional(),
    unexpectedCostMinor: minorAmount.optional(),
    note: z.string().trim().max(280).optional(),
    completedAt: isoString.optional(),
  })
  .superRefine((value, ctx) => {
    if (value.hadUnexpectedCost === false && value.unexpectedCostMinor !== undefined) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "没有额外成本时不应记录额外金额。",
        path: ["unexpectedCostMinor"],
      });
    }
  });

export const purchaseRecordSchema = z
  .object({
    id: z.string().min(1),
    title: z.string().trim().min(1).max(100),
    priceMinor: minorAmount.optional(),
    currency: z.literal("CNY"),
    reason: optionalTrimmed(500),
    intendedUse: optionalTrimmed(300),
    expectedUsesPerWeek: z.number().int().min(0).max(99).optional(),
    existingAlternative: optionalTrimmed(300),
    desireLevel: z.union([
      z.literal(1),
      z.literal(2),
      z.literal(3),
      z.literal(4),
      z.literal(5),
    ]).optional(),
    productUrl: z
      .string()
      .trim()
      .max(2_000)
      .url()
      .refine((url) => /^https?:\/\//i.test(url), "链接必须使用 http 或 https。")
      .optional()
      .or(z.literal("")),
    status: z.enum(["cooling", "review_ready", "skipped", "purchased"]),
    coolingStartedAt: isoString,
    coolingEndsAt: isoString,
    coolingRound: z.number().int().min(1),
    decision: decisionSchema.optional(),
    postPurchaseReview: postPurchaseReviewSchema.optional(),
    reflectionSessions: z.array(
      z.discriminatedUnion("source", [
        aiSessionSchema,
        localChecklistSessionSchema,
      ]),
    ),
    timeline: z.array(timelineEventSchema),
    createdAt: isoString,
    updatedAt: isoString,
    deletedAt: isoString.optional(),
    deleteExpiresAt: isoString.optional(),
  })
  .strict()
  .superRefine((record, ctx) => {
    const terminal = record.status === "skipped" || record.status === "purchased";
    if (terminal && record.decision?.type !== record.status) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "最终状态与决定不一致。",
        path: ["decision"],
      });
    }
    if (!terminal && record.decision) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "等待状态不能保留最终决定。",
        path: ["decision"],
      });
    }
    if (
      (record.deletedAt && !record.deleteExpiresAt) ||
      (!record.deletedAt && record.deleteExpiresAt)
    ) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "删除时间信息不完整。",
        path: ["deletedAt"],
      });
    }
  });

export const storageEnvelopeSchema = z
  .object({
    schemaVersion: z.literal(1),
    revision: z.number().int().min(0),
    updatedAt: isoString,
    items: z.array(purchaseRecordSchema),
    settings: z.object({
      defaultCoolingDays: z.literal(3),
      locale: z.literal("zh-CN"),
      currency: z.literal("CNY"),
    }),
  })
  .strict();

export const aiReflectRequestSchema = z
  .object({
    contractVersion: z.literal("1"),
    locale: z.literal("zh-CN"),
    productName: z.string().trim().min(1).max(100),
    priceMinor: minorAmount.optional(),
    currency: z.literal("CNY"),
    reason: optionalTrimmed(500),
    intendedUse: optionalTrimmed(300),
    expectedUsesPerWeek: z.number().int().min(0).max(99).optional(),
    existingAlternative: optionalTrimmed(300),
    desireLevel: z.union([
      z.literal(1),
      z.literal(2),
      z.literal(3),
      z.literal(4),
      z.literal(5),
    ]).optional(),
  })
  .strict();

export function validateEnvelope(value: unknown): StorageEnvelope {
  return storageEnvelopeSchema.parse(value) as StorageEnvelope;
}

export function validateRecord(value: unknown): PurchaseRecord {
  return purchaseRecordSchema.parse(value) as PurchaseRecord;
}

export function validateAiResult(value: unknown): AiReflectionResult {
  return aiReflectionResultSchema.parse(value);
}
