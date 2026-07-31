import type {
  AiReflectRequest,
  PurchaseRecord,
} from "@/src/domain/types";

export const AI_PROMPT_VERSION = "reflect-v1";

export const AI_RESULT_JSON_SCHEMA = {
  type: "object",
  properties: {
    underlyingNeed: {
      type: "object",
      properties: {
        text: { type: "string" },
        basedOn: {
          type: "array",
          items: { type: "string" },
          maxItems: 6,
        },
      },
      required: ["text", "basedOn"],
      additionalProperties: false,
    },
    missingEvidence: {
      type: "array",
      minItems: 1,
      maxItems: 3,
      items: {
        type: "object",
        properties: {
          id: { type: "string" },
          question: { type: "string" },
          whyItMatters: { type: "string" },
        },
        required: ["id", "question", "whyItMatters"],
        additionalProperties: false,
      },
    },
    alternatives: {
      type: "array",
      minItems: 2,
      maxItems: 3,
      items: {
        type: "object",
        properties: {
          id: { type: "string" },
          idea: { type: "string" },
          tradeoff: { type: "string" },
        },
        required: ["id", "idea", "tradeoff"],
        additionalProperties: false,
      },
    },
    coolingExperiment: {
      type: "object",
      properties: {
        id: { type: "string" },
        title: { type: "string" },
        steps: {
          type: "array",
          minItems: 1,
          maxItems: 4,
          items: { type: "string" },
        },
        duration: { type: "string" },
        completionSignal: { type: "string" },
      },
      required: ["id", "title", "steps", "duration", "completionSignal"],
      additionalProperties: false,
    },
    reflectionQuestions: {
      type: "array",
      minItems: 2,
      maxItems: 3,
      items: { type: "string" },
    },
    informationCompleteness: {
      type: "string",
      enum: ["low", "medium", "high"],
    },
  },
  required: [
    "underlyingNeed",
    "missingEvidence",
    "alternatives",
    "coolingExperiment",
    "reflectionQuestions",
    "informationCompleteness",
  ],
  additionalProperties: false,
} as const;

export function buildReflectRequest(record: PurchaseRecord): AiReflectRequest {
  return {
    contractVersion: "1",
    locale: "zh-CN",
    productName: record.title,
    ...(record.priceMinor !== undefined
      ? { priceMinor: record.priceMinor }
      : {}),
    currency: "CNY",
    ...(record.reason ? { reason: record.reason } : {}),
    ...(record.intendedUse ? { intendedUse: record.intendedUse } : {}),
    ...(record.expectedUsesPerWeek !== undefined
      ? { expectedUsesPerWeek: record.expectedUsesPerWeek }
      : {}),
    ...(record.existingAlternative
      ? { existingAlternative: record.existingAlternative }
      : {}),
    ...(record.desireLevel ? { desireLevel: record.desireLevel } : {}),
  };
}

export async function inputHash(value: AiReflectRequest): Promise<string> {
  const bytes = new TextEncoder().encode(JSON.stringify(value));
  const digest = await crypto.subtle.digest("SHA-256", bytes);
  return Array.from(new Uint8Array(digest))
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");
}
