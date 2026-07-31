"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { finalizeDeleted } from "@/src/domain/actions";
import { STORAGE_KEY } from "@/src/domain/constants";
import { reconcileRecordAt } from "@/src/domain/time";
import type { StorageEnvelope } from "@/src/domain/types";
import {
  LocalRepository,
  StorageWriteError,
} from "@/src/storage/repository";
import {
  AppContext,
  type AppContextValue,
  type Notice,
} from "./app-context";
import { pendingNotice } from "./app-record-utils";
import {
  useAppMutations,
  type Commit,
} from "./useAppMutations";

export { useApp } from "./app-context";

export function AppProvider({ children }: { children: ReactNode }) {
  const repositoryRef = useRef<LocalRepository | null>(null);
  const envelopeRef = useRef<StorageEnvelope | null>(null);
  const [envelope, setEnvelope] = useState<StorageEnvelope | null>(null);
  const [ready, setReady] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [recoveredFromBackup, setRecoveredFromBackup] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [multiTabWarning, setMultiTabWarning] = useState(false);
  const [notice, setNotice] = useState<Notice | null>(null);
  const [noticeRemainingMs, setNoticeRemainingMs] = useState(0);

  const setCurrentEnvelope = useCallback((next: StorageEnvelope) => {
    envelopeRef.current = next;
    setEnvelope(next);
  }, []);

  const commit = useCallback<Commit>(
    (transform) => {
      const current = envelopeRef.current;
      const repository = repositoryRef.current;
      if (!current || !repository) return false;

      try {
        const nextItems = transform(current.items);
        setCurrentEnvelope(repository.save(current, nextItems));
        setSaveError(null);
        return true;
      } catch (error) {
        setSaveError(
          error instanceof StorageWriteError
            ? error.message
            : error instanceof Error
              ? error.message
              : "这次更改还没有保存。",
        );
        return false;
      }
    },
    [setCurrentEnvelope],
  );

  const reconcile = useCallback(() => {
    const nowMs = Date.now();
    const current = envelopeRef.current;
    if (!current) return;
    const nextItems = finalizeDeleted(
      current.items.map((item) => reconcileRecordAt(item, nowMs)),
      nowMs,
    );
    const changed =
      nextItems.length !== current.items.length ||
      nextItems.some((item, index) => item !== current.items[index]);
    if (changed) commit(() => nextItems);
  }, [commit]);

  useEffect(() => {
    let cancelled = false;
    const hydrate = () => {
      if (cancelled) return;
      const repository = new LocalRepository(window.localStorage);
      repositoryRef.current = repository;
      const result = repository.load();
      if (result.kind === "error") {
        setLoadError(result.message);
        setReady(true);
        return;
      }

      const nowMs = Date.now();
      const cleaned = finalizeDeleted(
        result.envelope.items.map((item) => reconcileRecordAt(item, nowMs)),
        nowMs,
      );
      let loaded = result.envelope;
      if (
        cleaned.length !== result.envelope.items.length ||
        cleaned.some((item, index) => item !== result.envelope.items[index])
      ) {
        try {
          loaded = repository.save(result.envelope, cleaned, nowMs);
        } catch {
          setSaveError("到期状态暂时没有写回本地，但原始记录仍然保留。");
        }
      }
      setCurrentEnvelope(loaded);
      setRecoveredFromBackup(result.recoveredFromBackup);
      setNotice(pendingNotice(loaded.items, nowMs));
      setReady(true);
    };

    const hydrationTimer = window.setTimeout(hydrate, 0);
    return () => {
      cancelled = true;
      window.clearTimeout(hydrationTimer);
    };
  }, [setCurrentEnvelope]);

  useEffect(() => {
    if (!ready || loadError) return;
    const interval = window.setInterval(reconcile, 60_000);
    const onFocus = () => reconcile();
    const onVisibility = () => {
      if (document.visibilityState === "visible") reconcile();
    };
    window.addEventListener("focus", onFocus);
    document.addEventListener("visibilitychange", onVisibility);
    return () => {
      window.clearInterval(interval);
      window.removeEventListener("focus", onFocus);
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, [loadError, ready, reconcile]);

  useEffect(() => {
    const onStorage = (event: StorageEvent) => {
      if (event.key === STORAGE_KEY) setMultiTabWarning(true);
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  useEffect(() => {
    if (!notice) return;
    const tick = () => {
      const remaining = Math.max(0, notice.expiresAt - Date.now());
      setNoticeRemainingMs(remaining);
      if (remaining === 0) {
        if (notice.kind === "delete") reconcile();
        setNotice(null);
      }
    };
    const kickoff = window.setTimeout(tick, 0);
    const timer = window.setInterval(tick, 100);
    return () => {
      window.clearTimeout(kickoff);
      window.clearInterval(timer);
    };
  }, [notice, reconcile]);

  const mutations = useAppMutations({
    commit,
    notice,
    setNotice,
    repositoryRef,
    setCurrentEnvelope,
    setLoadError,
    setRecoveredFromBackup,
    setSaveError,
  });

  const value = useMemo<AppContextValue>(
    () => ({
      ready,
      envelope,
      records: (envelope?.items ?? []).filter((item) => !item.deletedAt),
      loadError,
      recoveredFromBackup,
      saveError,
      multiTabWarning,
      notice,
      noticeRemainingMs: notice ? noticeRemainingMs : 0,
      ...mutations,
      clearSaveError: () => setSaveError(null),
    }),
    [
      envelope,
      loadError,
      multiTabWarning,
      mutations,
      notice,
      noticeRemainingMs,
      ready,
      recoveredFromBackup,
      saveError,
    ],
  );

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}
