import {
  DEFAULT_COOLING_DAYS,
  DEFAULT_CURRENCY,
  DEFAULT_LOCALE,
  SCHEMA_VERSION,
  STORAGE_BACKUP_KEY,
  STORAGE_KEY,
} from "@/src/domain/constants";
import { storageEnvelopeSchema } from "@/src/domain/schema";
import { toIso } from "@/src/domain/time";
import type {
  PurchaseRecord,
  StorageEnvelope,
} from "@/src/domain/types";

export interface StorageLike {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
  removeItem(key: string): void;
}

export type LoadResult =
  | {
      kind: "ok";
      envelope: StorageEnvelope;
      recoveredFromBackup: boolean;
    }
  | {
      kind: "error";
      reason: "corrupt" | "future_version";
      message: string;
    };

export class StorageWriteError extends Error {
  constructor(message = "这次更改还没有保存。") {
    super(message);
    this.name = "StorageWriteError";
  }
}

export function createEmptyEnvelope(nowMs = Date.now()): StorageEnvelope {
  return {
    schemaVersion: SCHEMA_VERSION,
    revision: 0,
    updatedAt: toIso(nowMs),
    items: [],
    settings: {
      defaultCoolingDays: DEFAULT_COOLING_DAYS,
      locale: DEFAULT_LOCALE,
      currency: DEFAULT_CURRENCY,
    },
  };
}

function parseEnvelope(raw: string | null):
  | { kind: "ok"; envelope: StorageEnvelope }
  | { kind: "empty" }
  | { kind: "invalid" }
  | { kind: "future" } {
  if (raw === null) return { kind: "empty" };
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    return { kind: "invalid" };
  }

  if (
    typeof parsed === "object" &&
    parsed !== null &&
    "schemaVersion" in parsed &&
    typeof parsed.schemaVersion === "number" &&
    parsed.schemaVersion > SCHEMA_VERSION
  ) {
    return { kind: "future" };
  }

  const result = storageEnvelopeSchema.safeParse(parsed);
  return result.success
    ? { kind: "ok", envelope: result.data }
    : { kind: "invalid" };
}

export class LocalRepository {
  constructor(private readonly storage: StorageLike) {}

  load(nowMs = Date.now()): LoadResult {
    const primaryRaw = this.storage.getItem(STORAGE_KEY);
    const primary = parseEnvelope(primaryRaw);

    if (primary.kind === "ok") {
      return {
        kind: "ok",
        envelope: primary.envelope,
        recoveredFromBackup: false,
      };
    }
    if (primary.kind === "future") {
      return {
        kind: "error",
        reason: "future_version",
        message: "本地数据来自更新版本，请不要在这里覆盖它。",
      };
    }
    if (primary.kind === "empty") {
      const backupWhenPrimaryEmpty = parseEnvelope(
        this.storage.getItem(STORAGE_BACKUP_KEY),
      );
      if (backupWhenPrimaryEmpty.kind === "empty") {
        return {
          kind: "ok",
          envelope: createEmptyEnvelope(nowMs),
          recoveredFromBackup: false,
        };
      }
    }

    const backup = parseEnvelope(this.storage.getItem(STORAGE_BACKUP_KEY));
    if (backup.kind === "ok") {
      try {
        this.storage.setItem(STORAGE_KEY, JSON.stringify(backup.envelope));
      } catch {
        // The valid backup can still be used in memory even if primary restore fails.
      }
      return {
        kind: "ok",
        envelope: backup.envelope,
        recoveredFromBackup: true,
      };
    }
    if (backup.kind === "future") {
      return {
        kind: "error",
        reason: "future_version",
        message: "备份数据来自更新版本，请不要在这里覆盖它。",
      };
    }

    return {
      kind: "error",
      reason: "corrupt",
      message: "本地数据无法正常读取。",
    };
  }

  save(
    current: StorageEnvelope,
    items: PurchaseRecord[],
    nowMs = Date.now(),
  ): StorageEnvelope {
    const next: StorageEnvelope = storageEnvelopeSchema.parse({
      ...current,
      revision: current.revision + 1,
      updatedAt: toIso(nowMs),
      items,
    });

    try {
      this.storage.setItem(STORAGE_BACKUP_KEY, JSON.stringify(current));
      this.storage.setItem(STORAGE_KEY, JSON.stringify(next));
    } catch {
      throw new StorageWriteError();
    }
    return next;
  }

  reset(nowMs = Date.now()): StorageEnvelope {
    const next = createEmptyEnvelope(nowMs);
    try {
      this.storage.removeItem(STORAGE_KEY);
      this.storage.removeItem(STORAGE_BACKUP_KEY);
      this.storage.setItem(STORAGE_KEY, JSON.stringify(next));
    } catch {
      throw new StorageWriteError();
    }
    return next;
  }
}
