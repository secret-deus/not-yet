"use client";

import { ChevronDown, Save } from "lucide-react";
import {
  useEffect,
  useMemo,
  useState,
  type FormEvent,
} from "react";
import { Button } from "@/src/components/ui/button";
import { Input } from "@/src/components/ui/input";
import { Label } from "@/src/components/ui/label";
import { Textarea } from "@/src/components/ui/textarea";
import { minorToYuan } from "@/src/domain/money";
import type { PurchaseRecord, RecordDraft } from "@/src/domain/types";

const emptyDraft: RecordDraft = {
  title: "",
  priceYuan: "",
  reason: "",
  intendedUse: "",
  expectedUsesPerWeek: "",
  existingAlternative: "",
  desireLevel: undefined,
  productUrl: "",
  coolingPreset: "3d",
};

export function draftFromRecord(record?: PurchaseRecord): RecordDraft {
  if (!record) return emptyDraft;
  return {
    title: record.title,
    priceYuan: minorToYuan(record.priceMinor),
    reason: record.reason ?? "",
    intendedUse: record.intendedUse ?? "",
    expectedUsesPerWeek:
      record.expectedUsesPerWeek === undefined
        ? ""
        : String(record.expectedUsesPerWeek),
    existingAlternative: record.existingAlternative ?? "",
    desireLevel: record.desireLevel,
    productUrl: record.productUrl ?? "",
    coolingPreset: "3d",
  };
}

export function RecordForm({
  record,
  submitLabel,
  onSubmit,
  onCancel,
}: {
  record?: PurchaseRecord;
  submitLabel: string;
  onSubmit(draft: RecordDraft): boolean;
  onCancel(): void;
}) {
  const initial = useMemo(() => draftFromRecord(record), [record]);
  const [draft, setDraft] = useState<RecordDraft>(initial);
  const [detailsOpen, setDetailsOpen] = useState(
    Boolean(
      record?.intendedUse ||
        record?.expectedUsesPerWeek !== undefined ||
        record?.existingAlternative ||
        record?.desireLevel ||
        record?.productUrl,
    ),
  );
  const [error, setError] = useState<string | null>(null);
  const dirty = JSON.stringify(draft) !== JSON.stringify(initial);

  useEffect(() => {
    const warn = (event: BeforeUnloadEvent) => {
      if (!dirty) return;
      event.preventDefault();
      event.returnValue = "";
    };
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [dirty]);

  const update = <K extends keyof RecordDraft>(
    key: K,
    value: RecordDraft[K],
  ) => setDraft((current) => ({ ...current, [key]: value }));

  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    if (!draft.title.trim()) {
      setError("先写下你想买的东西。");
      return;
    }
    try {
      if (!onSubmit(draft)) {
        setError("这次更改还没有保存。");
      }
    } catch (submitError) {
      setError(
        submitError instanceof Error
          ? submitError.message
          : "请检查填写的内容。",
      );
    }
  };

  const cancel = () => {
    if (dirty && !window.confirm("还没有保存，确定离开吗？")) return;
    onCancel();
  };

  return (
    <form className="record-form" onSubmit={submit} noValidate>
      {error ? (
        <div className="form-error" role="alert">
          {error}
        </div>
      ) : null}

      <section className="form-section">
        <div className="field">
          <Label htmlFor="title">
            想买什么 <span aria-hidden="true">*</span>
          </Label>
          <Input
            id="title"
            autoFocus
            required
            maxLength={100}
            value={draft.title}
            onChange={(event) => update("title", event.target.value)}
            placeholder="例如：一副降噪耳机"
          />
          <span className="field-hint">{draft.title.length}/100</span>
        </div>

        <div className="field-grid">
          <div className="field">
            <Label htmlFor="price">大概多少钱</Label>
            <div className="input-prefix">
              <span>¥</span>
              <Input
                id="price"
                inputMode="decimal"
                value={draft.priceYuan}
                onChange={(event) => update("priceYuan", event.target.value)}
                placeholder="0.00"
                aria-describedby="price-hint"
              />
            </div>
            <span className="field-hint" id="price-hint">
              最多两位小数
            </span>
          </div>

          {!record ? (
            <div className="field">
              <Label htmlFor="cooling">先等多久</Label>
              <select
                id="cooling"
                value={draft.coolingPreset}
                onChange={(event) =>
                  update(
                    "coolingPreset",
                    event.target.value as RecordDraft["coolingPreset"],
                  )
                }
              >
                <option value="24h">24 小时</option>
                <option value="3d">3 天（推荐）</option>
                <option value="7d">7 天</option>
                <option value="custom">自定义</option>
              </select>
            </div>
          ) : null}
        </div>

        {!record && draft.coolingPreset === "custom" ? (
          <div className="field">
            <Label htmlFor="custom-days">自定义天数</Label>
            <Input
              id="custom-days"
              type="number"
              min={1}
              max={30}
              step={1}
              value={draft.customCoolingDays ?? ""}
              onChange={(event) =>
                update(
                  "customCoolingDays",
                  event.target.value ? Number(event.target.value) : undefined,
                )
              }
            />
            <span className="field-hint">1～30 天</span>
          </div>
        ) : null}

        <div className="field">
          <Label htmlFor="reason">为什么现在想买</Label>
          <Textarea
            id="reason"
            maxLength={500}
            rows={4}
            value={draft.reason}
            onChange={(event) => update("reason", event.target.value)}
            placeholder="写下当下的原因，几天后再回来对照。"
          />
          <span className="field-hint">{draft.reason?.length ?? 0}/500</span>
        </div>
      </section>

      <Button
        className="disclosure-button"
        variant="ghost"
        type="button"
        aria-expanded={detailsOpen}
        aria-controls="more-fields"
        onClick={() => setDetailsOpen((open) => !open)}
      >
        <span>
          <strong>补充一些判断线索</strong>
          <small>可选，但能让几天后的复盘更具体</small>
        </span>
        <ChevronDown
          size={20}
          className={detailsOpen ? "is-open" : ""}
          aria-hidden="true"
        />
      </Button>

      {detailsOpen ? (
        <section className="form-section" id="more-fields">
          <div className="field">
            <Label htmlFor="intended-use">打算怎么用</Label>
            <Textarea
              id="intended-use"
              maxLength={300}
              rows={3}
              value={draft.intendedUse}
              onChange={(event) => update("intendedUse", event.target.value)}
              placeholder="例如：每天通勤约 1 小时"
            />
          </div>

          <div className="field-grid">
            <div className="field">
              <Label htmlFor="expected-uses">每周预计用几次</Label>
              <Input
                id="expected-uses"
                type="number"
                inputMode="numeric"
                min={0}
                max={99}
                step={1}
                value={draft.expectedUsesPerWeek}
                onChange={(event) =>
                  update("expectedUsesPerWeek", event.target.value)
                }
                placeholder="0～99"
              />
            </div>
            <div className="field">
              <Label htmlFor="desire-level">现在有多想要</Label>
              <select
                id="desire-level"
                value={draft.desireLevel ?? ""}
                onChange={(event) =>
                  update(
                    "desireLevel",
                    event.target.value
                      ? (Number(event.target.value) as 1 | 2 | 3 | 4 | 5)
                      : undefined,
                  )
                }
              >
                <option value="">不记录</option>
                <option value="1">1 · 有点想</option>
                <option value="2">2</option>
                <option value="3">3 · 一半一半</option>
                <option value="4">4</option>
                <option value="5">5 · 非常想</option>
              </select>
            </div>
          </div>

          <div className="field">
            <Label htmlFor="alternative">手上已有的替代方案</Label>
            <Textarea
              id="alternative"
              maxLength={300}
              rows={3}
              value={draft.existingAlternative}
              onChange={(event) =>
                update("existingAlternative", event.target.value)
              }
              placeholder="已有物品、借用、租用或维修都可以"
            />
          </div>

          <div className="field">
            <Label htmlFor="product-url">商品链接</Label>
            <Input
              id="product-url"
              type="url"
              maxLength={2_000}
              value={draft.productUrl}
              onChange={(event) => update("productUrl", event.target.value)}
              placeholder="https://..."
            />
            <span className="field-hint">
              链接只保存在本机，不会发送给 AI。
            </span>
          </div>
        </section>
      ) : null}

      <div className="form-actions sticky-actions">
        <Button variant="ghost" type="button" onClick={cancel}>
          取消
        </Button>
        <Button type="submit">
          <Save size={18} aria-hidden="true" />
          {submitLabel}
        </Button>
      </div>
    </form>
  );
}
