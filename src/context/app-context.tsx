"use client";

import {
  createContext,
  useContext,
} from "react";
import type {
  AiSession,
  LocalChecklistSession,
  NeedOutcome,
  PurchaseRecord,
  RecordDraft,
  ReflectionItemStatus,
  StorageEnvelope,
} from "@/src/domain/types";

export type Notice =
  | {
      kind: "delete";
      recordId: string;
      message: string;
      expiresAt: number;
    }
  | {
      kind: "decision";
      recordId: string;
      message: string;
      expiresAt: number;
    };

export interface AppContextValue {
  ready: boolean;
  envelope: StorageEnvelope | null;
  records: PurchaseRecord[];
  loadError: string | null;
  recoveredFromBackup: boolean;
  saveError: string | null;
  multiTabWarning: boolean;
  notice: Notice | null;
  noticeRemainingMs: number;
  createItem(draft: RecordDraft): string | null;
  updateItem(id: string, draft: RecordDraft): boolean;
  adjustItemCooling(id: string, days: number): boolean;
  beginReview(id: string): boolean;
  continueWaiting(id: string, days: number, reason?: string): boolean;
  skipItem(id: string, reason?: string): boolean;
  purchaseItem(
    id: string,
    input: {
      actualPriceYuan?: string;
      purchasedAt?: string;
      reason?: string;
    },
  ): boolean;
  undoLatestNotice(): boolean;
  deleteItem(id: string): boolean;
  completeReview(
    id: string,
    input: {
      actualUseCount: number;
      needOutcome: NeedOutcome;
      satisfaction: 1 | 2 | 3 | 4 | 5;
      hadUnexpectedCost: boolean;
      unexpectedCostYuan?: string;
      note?: string;
    },
  ): boolean;
  addReflection(id: string, session: AiSession | LocalChecklistSession): boolean;
  changeReflectionItem(
    id: string,
    sessionId: string,
    itemId: string,
    status: ReflectionItemStatus,
    userEditedText?: string,
  ): boolean;
  resetLocalData(): void;
  clearSaveError(): void;
}

export type AppMutations = Pick<
  AppContextValue,
  | "createItem"
  | "updateItem"
  | "adjustItemCooling"
  | "beginReview"
  | "continueWaiting"
  | "skipItem"
  | "purchaseItem"
  | "undoLatestNotice"
  | "deleteItem"
  | "completeReview"
  | "addReflection"
  | "changeReflectionItem"
  | "resetLocalData"
>;

export const AppContext = createContext<AppContextValue | null>(null);

export function useApp(): AppContextValue {
  const value = useContext(AppContext);
  if (!value) throw new Error("useApp 必须在 AppProvider 内使用。");
  return value;
}
