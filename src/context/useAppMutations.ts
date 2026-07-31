"use client";

import {
  useCallback,
  useMemo,
  type Dispatch,
  type MutableRefObject,
  type SetStateAction,
} from "react";
import {
  adjustCooling,
  appendReflectionSession,
  completePostPurchaseReview,
  createRecord,
  decidePurchased,
  decideSkipped,
  editRecord,
  extendWaiting,
  requestDelete,
  startReview,
  undoDecision,
  undoDelete,
  updateReflectionItem,
} from "@/src/domain/actions";
import { DECISION_UNDO_WINDOW_MS } from "@/src/domain/constants";
import type {
  AiSession,
  LocalChecklistSession,
  NeedOutcome,
  PurchaseRecord,
  RecordDraft,
  ReflectionItemStatus,
  StorageEnvelope,
} from "@/src/domain/types";
import type { LocalRepository } from "@/src/storage/repository";
import {
  findRecord,
  replaceRecord,
} from "./app-record-utils";
import type {
  AppMutations,
  Notice,
} from "./app-context";

export type Commit = (
  transform: (items: PurchaseRecord[]) => PurchaseRecord[],
) => boolean;

interface MutationDependencies {
  commit: Commit;
  notice: Notice | null;
  setNotice: Dispatch<SetStateAction<Notice | null>>;
  repositoryRef: MutableRefObject<LocalRepository | null>;
  setCurrentEnvelope(next: StorageEnvelope): void;
  setLoadError: Dispatch<SetStateAction<string | null>>;
  setRecoveredFromBackup: Dispatch<SetStateAction<boolean>>;
  setSaveError: Dispatch<SetStateAction<string | null>>;
}

export function useAppMutations({
  commit,
  notice,
  setNotice,
  repositoryRef,
  setCurrentEnvelope,
  setLoadError,
  setRecoveredFromBackup,
  setSaveError,
}: MutationDependencies): AppMutations {
  const createItem = useCallback(
    (draft: RecordDraft): string | null => {
      const record = createRecord(draft, Date.now());
      return commit((items) => [record, ...items]) ? record.id : null;
    },
    [commit],
  );

  const updateItem = useCallback(
    (recordId: string, draft: RecordDraft) =>
      commit((items) =>
        replaceRecord(
          items,
          editRecord(findRecord(items, recordId), draft, Date.now()),
        ),
      ),
    [commit],
  );

  const adjustItemCooling = useCallback(
    (recordId: string, days: number) =>
      commit((items) =>
        replaceRecord(
          items,
          adjustCooling(findRecord(items, recordId), days, Date.now()),
        ),
      ),
    [commit],
  );

  const beginReview = useCallback(
    (recordId: string) =>
      commit((items) =>
        replaceRecord(
          items,
          startReview(findRecord(items, recordId), Date.now()),
        ),
      ),
    [commit],
  );

  const continueWaiting = useCallback(
    (recordId: string, days: number, reason?: string) =>
      commit((items) =>
        replaceRecord(
          items,
          extendWaiting(findRecord(items, recordId), days, reason, Date.now()),
        ),
      ),
    [commit],
  );

  const skipItem = useCallback(
    (recordId: string, reason?: string) => {
      const nowMs = Date.now();
      const ok = commit((items) =>
        replaceRecord(
          items,
          decideSkipped(findRecord(items, recordId), reason, nowMs),
        ),
      );
      if (ok) {
        setNotice({
          kind: "decision",
          recordId,
          message: "已记录为先不买",
          expiresAt: nowMs + DECISION_UNDO_WINDOW_MS,
        });
      }
      return ok;
    },
    [commit, setNotice],
  );

  const purchaseItem = useCallback(
    (
      recordId: string,
      input: {
        actualPriceYuan?: string;
        purchasedAt?: string;
        reason?: string;
      },
    ) => {
      const nowMs = Date.now();
      const ok = commit((items) =>
        replaceRecord(
          items,
          decidePurchased(findRecord(items, recordId), input, nowMs),
        ),
      );
      if (ok) {
        setNotice({
          kind: "decision",
          recordId,
          message: "已记录为买了",
          expiresAt: nowMs + DECISION_UNDO_WINDOW_MS,
        });
      }
      return ok;
    },
    [commit, setNotice],
  );

  const deleteItem = useCallback(
    (recordId: string) => {
      const nowMs = Date.now();
      let title = "这条记录";
      let expiresAt = nowMs + 8_000;
      const ok = commit((items) => {
        const current = findRecord(items, recordId);
        title = current.title;
        const next = requestDelete(current, nowMs);
        expiresAt = Date.parse(next.deleteExpiresAt ?? "");
        return replaceRecord(items, next);
      });
      if (ok) {
        setNotice({
          kind: "delete",
          recordId,
          message: `已删除“${title}”`,
          expiresAt,
        });
      }
      return ok;
    },
    [commit, setNotice],
  );

  const undoLatestNotice = useCallback(() => {
    if (!notice || Date.now() >= notice.expiresAt) return false;
    const nowMs = Date.now();
    const ok = commit((items) =>
      replaceRecord(
        items,
        notice.kind === "delete"
          ? undoDelete(findRecord(items, notice.recordId), nowMs)
          : undoDecision(findRecord(items, notice.recordId), nowMs),
      ),
    );
    if (ok) setNotice(null);
    return ok;
  }, [commit, notice, setNotice]);

  const completeReview = useCallback(
    (
      recordId: string,
      input: {
        actualUseCount: number;
        needOutcome: NeedOutcome;
        satisfaction: 1 | 2 | 3 | 4 | 5;
        hadUnexpectedCost: boolean;
        unexpectedCostYuan?: string;
        note?: string;
      },
    ) =>
      commit((items) =>
        replaceRecord(
          items,
          completePostPurchaseReview(
            findRecord(items, recordId),
            input,
            Date.now(),
          ),
        ),
      ),
    [commit],
  );

  const addReflection = useCallback(
    (recordId: string, session: AiSession | LocalChecklistSession) =>
      commit((items) =>
        replaceRecord(
          items,
          appendReflectionSession(
            findRecord(items, recordId),
            session,
            Date.now(),
          ),
        ),
      ),
    [commit],
  );

  const changeReflectionItem = useCallback(
    (
      recordId: string,
      sessionId: string,
      itemId: string,
      status: ReflectionItemStatus,
      userEditedText?: string,
    ) =>
      commit((items) =>
        replaceRecord(
          items,
          updateReflectionItem(
            findRecord(items, recordId),
            sessionId,
            itemId,
            status,
            userEditedText,
            Date.now(),
          ),
        ),
      ),
    [commit],
  );

  const resetLocalData = useCallback(() => {
    const repository = repositoryRef.current;
    if (!repository) return;
    try {
      const next = repository.reset();
      setCurrentEnvelope(next);
      setLoadError(null);
      setRecoveredFromBackup(false);
      setSaveError(null);
      setNotice(null);
    } catch (error) {
      setSaveError(
        error instanceof Error ? error.message : "这次更改还没有保存。",
      );
    }
  }, [
    repositoryRef,
    setCurrentEnvelope,
    setLoadError,
    setNotice,
    setRecoveredFromBackup,
    setSaveError,
  ]);

  return useMemo(
    () => ({
      createItem,
      updateItem,
      adjustItemCooling,
      beginReview,
      continueWaiting,
      skipItem,
      purchaseItem,
      undoLatestNotice,
      deleteItem,
      completeReview,
      addReflection,
      changeReflectionItem,
      resetLocalData,
    }),
    [
      addReflection,
      adjustItemCooling,
      beginReview,
      changeReflectionItem,
      completeReview,
      continueWaiting,
      createItem,
      deleteItem,
      purchaseItem,
      resetLocalData,
      skipItem,
      undoLatestNotice,
      updateItem,
    ],
  );
}
