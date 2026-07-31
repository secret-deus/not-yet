export type PurchaseStatus =
  | "cooling"
  | "review_ready"
  | "skipped"
  | "purchased";

export type PurchaseDecision =
  | {
      type: "skipped";
      decidedAt: string;
      reason?: string;
    }
  | {
      type: "purchased";
      decidedAt: string;
      actualPriceMinor?: number;
      purchasedAt: string;
      reason?: string;
      verificationDueAt: string;
    };

export type NeedOutcome = "met" | "partly_met" | "not_met";
export type PostPurchaseReviewStatus = "not_due" | "due" | "completed";

export interface PostPurchaseReview {
  status: PostPurchaseReviewStatus;
  reviewWindowDays: 7;
  actualUseCount?: number;
  needOutcome?: NeedOutcome;
  satisfaction?: 1 | 2 | 3 | 4 | 5;
  hadUnexpectedCost?: boolean;
  unexpectedCostMinor?: number;
  note?: string;
  completedAt?: string;
}

export type ReflectionItemStatus =
  | "pending"
  | "adopted"
  | "later"
  | "ignored";

export interface AiReflectionResult {
  underlyingNeed: {
    text: string;
    basedOn: string[];
  };
  missingEvidence: Array<{
    id: string;
    question: string;
    whyItMatters: string;
  }>;
  alternatives: Array<{
    id: string;
    idea: string;
    tradeoff: string;
  }>;
  coolingExperiment: {
    id: string;
    title: string;
    steps: string[];
    duration: string;
    completionSignal: string;
  };
  reflectionQuestions: string[];
  informationCompleteness: "low" | "medium" | "high";
  disclaimer: string;
}

export interface AiSession {
  id: string;
  source: "remote_ai";
  inputHash: string;
  schemaVersion: "1";
  promptVersion: string;
  generatedAt: string;
  result: AiReflectionResult;
  itemStates: Record<
    string,
    {
      status: ReflectionItemStatus;
      userEditedText?: string;
    }
  >;
}

export interface LocalChecklistSession {
  id: string;
  source: "local_checklist";
  generatedAt: string;
  items: Array<{
    id: string;
    question: string;
    status: ReflectionItemStatus;
    userEditedText?: string;
  }>;
}

export type ReflectionSession = AiSession | LocalChecklistSession;

export type TimelineEventType =
  | "created"
  | "edited"
  | "cooling_adjusted"
  | "review_started"
  | "waiting_extended"
  | "skipped"
  | "purchased"
  | "decision_undone"
  | "ai_generated"
  | "ai_item_adopted"
  | "delete_requested"
  | "delete_undone"
  | "post_purchase_review_completed";

export interface TimelineEvent {
  id: string;
  type: TimelineEventType;
  at: string;
  summary?: string;
}

export interface PurchaseRecord {
  id: string;
  title: string;
  priceMinor?: number;
  currency: "CNY";
  reason?: string;
  intendedUse?: string;
  expectedUsesPerWeek?: number;
  existingAlternative?: string;
  desireLevel?: 1 | 2 | 3 | 4 | 5;
  productUrl?: string;
  status: PurchaseStatus;
  coolingStartedAt: string;
  coolingEndsAt: string;
  coolingRound: number;
  decision?: PurchaseDecision;
  postPurchaseReview?: PostPurchaseReview;
  reflectionSessions: ReflectionSession[];
  timeline: TimelineEvent[];
  createdAt: string;
  updatedAt: string;
  deletedAt?: string;
  deleteExpiresAt?: string;
}

export interface AppSettings {
  defaultCoolingDays: 3;
  locale: "zh-CN";
  currency: "CNY";
}

export interface StorageEnvelope {
  schemaVersion: 1;
  revision: number;
  updatedAt: string;
  items: PurchaseRecord[];
  settings: AppSettings;
}

export interface RecordDraft {
  title: string;
  priceYuan?: string;
  reason?: string;
  intendedUse?: string;
  expectedUsesPerWeek?: string;
  existingAlternative?: string;
  desireLevel?: 1 | 2 | 3 | 4 | 5;
  productUrl?: string;
  coolingPreset: "24h" | "3d" | "7d" | "custom";
  customCoolingDays?: number;
}

export interface AiReflectRequest {
  contractVersion: "1";
  locale: "zh-CN";
  productName: string;
  priceMinor?: number;
  currency: "CNY";
  reason?: string;
  intendedUse?: string;
  expectedUsesPerWeek?: number;
  existingAlternative?: string;
  desireLevel?: 1 | 2 | 3 | 4 | 5;
}

export type AiReflectResponse =
  | {
      ok: true;
      source: "remote_ai";
      schemaVersion: "1";
      promptVersion: string;
      generatedAt: string;
      result: AiReflectionResult;
    }
  | {
      ok: false;
      kind:
        | "disabled"
        | "invalid_request"
        | "offline"
        | "timeout"
        | "quota"
        | "upstream"
        | "invalid_output";
      message: string;
    };
