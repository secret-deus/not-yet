import assert from "node:assert/strict";
import test from "node:test";
import {
  completePostPurchaseReview,
  createRecord,
  decidePurchased,
  decideSkipped,
  extendWaiting,
  requestDelete,
  startReview,
  undoDecision,
  undoDelete,
} from "../src/domain/actions";
import { yuanToMinor } from "../src/domain/money";
import {
  coolingDurationMs,
  reconcileRecordAt,
} from "../src/domain/time";
import type { RecordDraft } from "../src/domain/types";

const START = Date.parse("2026-07-31T08:00:00.000Z");

const draft: RecordDraft = {
  title: "一台新的降噪耳机",
  priceYuan: "1299.00",
  reason: "通勤时想安静一点",
  intendedUse: "地铁通勤",
  expectedUsesPerWeek: "5",
  existingAlternative: "现在的有线耳机",
  desireLevel: 4,
  productUrl: "https://example.com/headphones",
  coolingPreset: "3d",
};

test("creates a valid cooling record using minor currency units", () => {
  const record = createRecord(draft, START, "record-1");
  assert.equal(record.status, "cooling");
  assert.equal(record.priceMinor, 129_900);
  assert.equal(record.coolingRound, 1);
  assert.equal(
    Date.parse(record.coolingEndsAt) - Date.parse(record.coolingStartedAt),
    72 * 60 * 60 * 1_000,
  );
});

test("reconciles at the exact cooling boundary", () => {
  const record = createRecord(draft, START, "record-1");
  assert.equal(
    reconcileRecordAt(record, Date.parse(record.coolingEndsAt) - 1).status,
    "cooling",
  );
  assert.equal(
    reconcileRecordAt(record, Date.parse(record.coolingEndsAt)).status,
    "review_ready",
  );
});

test("only review-ready records can make a final decision", () => {
  const record = createRecord(draft, START, "record-1");
  assert.throws(
    () => decideSkipped(record, undefined, START + 1_000),
    /只有待复盘/,
  );

  const ready = startReview(record, START + 1_000);
  const skipped = decideSkipped(ready, "先用现有设备", START + 2_000);
  assert.equal(skipped.status, "skipped");
  assert.equal(skipped.decision?.type, "skipped");
});

test("extending waiting starts a new cooling round", () => {
  const ready = startReview(createRecord(draft, START, "record-1"), START + 1);
  const extended = extendWaiting(ready, 7, "再观察一周", START + 2);
  assert.equal(extended.status, "cooling");
  assert.equal(extended.coolingRound, 2);
  assert.equal(
    Date.parse(extended.coolingEndsAt) - (START + 2),
    7 * 24 * 60 * 60 * 1_000,
  );
});

test("decision undo is allowed before 8 seconds and rejected at 8 seconds", () => {
  const ready = startReview(createRecord(draft, START, "record-1"), START + 1);
  const skipped = decideSkipped(ready, undefined, START + 2_000);
  assert.equal(undoDecision(skipped, START + 9_999).status, "review_ready");
  assert.throws(
    () => undoDecision(skipped, START + 10_000),
    /撤销时间已经结束/,
  );
});

test("delete undo follows its persisted expiry boundary", () => {
  const record = createRecord(draft, START, "record-1");
  const deleted = requestDelete(record, START + 1_000);
  assert.ok(deleted.deleteExpiresAt);
  assert.equal(undoDelete(deleted, START + 8_999).deletedAt, undefined);
  assert.throws(
    () => undoDelete(deleted, START + 9_000),
    /撤销时间已经结束/,
  );
});

test("purchased records become due at seven days and can be completed", () => {
  const ready = startReview(createRecord(draft, START, "record-1"), START + 1);
  const purchased = decidePurchased(
    ready,
    { actualPriceYuan: "1199", purchasedAt: "2026-07-31T08:00" },
    START + 2,
  );
  assert.equal(purchased.postPurchaseReview?.status, "not_due");

  const dueAt = Date.parse(
    purchased.decision?.type === "purchased"
      ? purchased.decision.verificationDueAt
      : "",
  );
  const due = reconcileRecordAt(purchased, dueAt);
  assert.equal(due.postPurchaseReview?.status, "due");

  const completed = completePostPurchaseReview(
    due,
    {
      actualUseCount: 6,
      needOutcome: "partly_met",
      satisfaction: 4,
      hadUnexpectedCost: false,
      note: "地铁里很有用，在家不太用。",
    },
    dueAt + 1,
  );
  assert.equal(completed.postPurchaseReview?.status, "completed");
  assert.equal(completed.status, "purchased");
});

test("money parsing rejects excess precision and invalid cooling days", () => {
  assert.equal(yuanToMinor("0.01"), 1);
  assert.equal(yuanToMinor("99.9"), 9_990);
  assert.throws(() => yuanToMinor("1.001"), /两位小数/);
  assert.throws(() => coolingDurationMs("custom", 0), /1～30 天/);
  assert.throws(() => coolingDurationMs("custom", 31), /1～30 天/);
});
