import assert from "node:assert/strict";
import test from "node:test";
import {
  STORAGE_BACKUP_KEY,
  STORAGE_KEY,
} from "../src/domain/constants";
import { createRecord } from "../src/domain/actions";
import {
  createEmptyEnvelope,
  LocalRepository,
  StorageWriteError,
  type StorageLike,
} from "../src/storage/repository";

class MemoryStorage implements StorageLike {
  data = new Map<string, string>();
  failOnKey?: string;

  getItem(key: string): string | null {
    return this.data.get(key) ?? null;
  }

  setItem(key: string, value: string): void {
    if (this.failOnKey === key) throw new Error("quota");
    this.data.set(key, value);
  }

  removeItem(key: string): void {
    this.data.delete(key);
  }
}

const draft = {
  title: "测试商品",
  coolingPreset: "24h" as const,
};

test("empty storage produces a versioned empty envelope", () => {
  const storage = new MemoryStorage();
  const result = new LocalRepository(storage).load(0);
  assert.equal(result.kind, "ok");
  if (result.kind === "ok") {
    assert.equal(result.envelope.schemaVersion, 1);
    assert.deepEqual(result.envelope.items, []);
  }
});

test("save backs up the previous valid envelope before writing main", () => {
  const storage = new MemoryStorage();
  const repository = new LocalRepository(storage);
  const current = createEmptyEnvelope(0);
  storage.setItem(STORAGE_KEY, JSON.stringify(current));
  const item = createRecord(draft, 1_000, "record-1");

  const next = repository.save(current, [item], 2_000);
  assert.equal(next.revision, 1);
  assert.equal(
    JSON.parse(storage.getItem(STORAGE_BACKUP_KEY) ?? "").revision,
    0,
  );
  assert.equal(JSON.parse(storage.getItem(STORAGE_KEY) ?? "").revision, 1);
});

test("corrupt primary recovers from valid backup", () => {
  const storage = new MemoryStorage();
  const backup = createEmptyEnvelope(0);
  storage.setItem(STORAGE_KEY, "{not-json");
  storage.setItem(STORAGE_BACKUP_KEY, JSON.stringify(backup));

  const result = new LocalRepository(storage).load();
  assert.equal(result.kind, "ok");
  if (result.kind === "ok") {
    assert.equal(result.recoveredFromBackup, true);
    assert.equal(result.envelope.revision, 0);
  }
});

test("unknown future schema is refused without overwriting it", () => {
  const storage = new MemoryStorage();
  storage.setItem(
    STORAGE_KEY,
    JSON.stringify({ schemaVersion: 99, revision: 1 }),
  );
  const rawBefore = storage.getItem(STORAGE_KEY);

  const result = new LocalRepository(storage).load();
  assert.equal(result.kind, "error");
  if (result.kind === "error") assert.equal(result.reason, "future_version");
  assert.equal(storage.getItem(STORAGE_KEY), rawBefore);
});

test("two corrupt copies return a recovery error", () => {
  const storage = new MemoryStorage();
  storage.setItem(STORAGE_KEY, "bad");
  storage.setItem(STORAGE_BACKUP_KEY, "also bad");
  const result = new LocalRepository(storage).load();
  assert.deepEqual(result, {
    kind: "error",
    reason: "corrupt",
    message: "本地数据无法正常读取。",
  });
});

test("failed primary write does not report a new envelope", () => {
  const storage = new MemoryStorage();
  const repository = new LocalRepository(storage);
  const current = createEmptyEnvelope(0);
  storage.setItem(STORAGE_KEY, JSON.stringify(current));
  storage.failOnKey = STORAGE_KEY;

  assert.throws(
    () => repository.save(current, [createRecord(draft, 1_000, "record-1")]),
    StorageWriteError,
  );
  assert.equal(JSON.parse(storage.getItem(STORAGE_BACKUP_KEY) ?? "").revision, 0);
});
