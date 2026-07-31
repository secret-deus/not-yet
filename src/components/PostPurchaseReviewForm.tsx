"use client";

import { Save } from "lucide-react";
import { useState, type FormEvent } from "react";
import { Button } from "@/src/components/ui/button";
import { Checkbox } from "@/src/components/ui/checkbox";
import { Input } from "@/src/components/ui/input";
import { Label } from "@/src/components/ui/label";
import {
  RadioGroup,
  RadioGroupItem,
} from "@/src/components/ui/radio-group";
import { Textarea } from "@/src/components/ui/textarea";
import { useApp } from "@/src/context/AppProvider";
import { formatMoney } from "@/src/domain/money";
import type {
  NeedOutcome,
  PurchaseRecord,
} from "@/src/domain/types";

export function PostPurchaseReviewForm({
  record,
}: {
  record: PurchaseRecord;
}) {
  const { completeReview } = useApp();
  const [actualUseCount, setActualUseCount] = useState("");
  const [needOutcome, setNeedOutcome] = useState<NeedOutcome | "">("");
  const [satisfaction, setSatisfaction] = useState<
    1 | 2 | 3 | 4 | 5 | undefined
  >();
  const [hadUnexpectedCost, setHadUnexpectedCost] = useState(false);
  const [unexpectedCost, setUnexpectedCost] = useState("");
  const [note, setNote] = useState("");
  const [error, setError] = useState<string | null>(null);

  const purchasedDecision =
    record.decision?.type === "purchased" ? record.decision : null;

  const submit = (event: FormEvent) => {
    event.preventDefault();
    setError(null);
    if (actualUseCount === "" || !needOutcome || !satisfaction) {
      setError("请填写使用次数、需要是否满足和满意度。");
      return;
    }
    const parsedUseCount = Number(actualUseCount);
    if (
      !Number.isInteger(parsedUseCount) ||
      parsedUseCount < 0 ||
      parsedUseCount > 99
    ) {
      setError("使用次数请填写 0～99 的整数。");
      return;
    }
    try {
      const ok = completeReview(record.id, {
        actualUseCount: parsedUseCount,
        needOutcome,
        satisfaction,
        hadUnexpectedCost,
        unexpectedCostYuan: hadUnexpectedCost
          ? unexpectedCost || undefined
          : undefined,
        note: note || undefined,
      });
      if (ok) window.location.assign(`/items/${record.id}`);
      else setError("这次更改还没有保存。");
    } catch (submitError) {
      setError(
        submitError instanceof Error
          ? submitError.message
          : "请检查填写内容。",
      );
    }
  };

  return (
    <form className="post-review-form" onSubmit={submit}>
      <section className="expectation-card">
        <span className="eyebrow">购买前的预期</span>
        <dl>
          <div>
            <dt>预计每周使用</dt>
            <dd>
              {record.expectedUsesPerWeek === undefined
                ? "未记录"
                : `${record.expectedUsesPerWeek} 次`}
            </dd>
          </div>
          <div>
            <dt>希望解决</dt>
            <dd>{record.intendedUse || record.reason || "未记录"}</dd>
          </div>
          <div>
            <dt>预计 / 实际价格</dt>
            <dd>
              {formatMoney(record.priceMinor)} /{" "}
              {formatMoney(purchasedDecision?.actualPriceMinor)}
            </dd>
          </div>
        </dl>
      </section>

      <section className="form-section">
        <div className="field">
          <Label htmlFor="actual-use-count">
            最近 7 天实际用了几次 <span aria-hidden="true">*</span>
          </Label>
          <Input
            id="actual-use-count"
            type="number"
            inputMode="numeric"
            min={0}
            max={99}
            step={1}
            required
            value={actualUseCount}
            onChange={(event) => setActualUseCount(event.target.value)}
          />
          <span className="field-hint">请记录真实次数，不用估算“应该”用了几次。</span>
        </div>

        <fieldset className="choice-fieldset">
          <legend>
            当时的需要，现在满足了吗 <span aria-hidden="true">*</span>
          </legend>
          <RadioGroup
            className="segmented-options"
            name="need-outcome"
            value={needOutcome}
            onValueChange={(value) => setNeedOutcome(value as NeedOutcome)}
          >
            {[
              ["met", "符合"],
              ["partly_met", "部分符合"],
              ["not_met", "不太符合"],
            ].map(([value, label]) => (
              <div className="segmented-option" key={value}>
                <RadioGroupItem
                  id={`need-outcome-${value}`}
                  value={value}
                />
                <Label htmlFor={`need-outcome-${value}`}>{label}</Label>
              </div>
            ))}
          </RadioGroup>
        </fieldset>

        <fieldset className="choice-fieldset">
          <legend>
            现在的满意度 <span aria-hidden="true">*</span>
          </legend>
          <RadioGroup
            className="rating-options"
            name="satisfaction"
            value={satisfaction ? String(satisfaction) : ""}
            onValueChange={(value) =>
              setSatisfaction(Number(value) as 1 | 2 | 3 | 4 | 5)
            }
          >
            {[1, 2, 3, 4, 5].map((value) => (
              <div className="rating-option" key={value}>
                <RadioGroupItem
                  id={`satisfaction-${value}`}
                  value={String(value)}
                />
                <Label htmlFor={`satisfaction-${value}`}>{value}</Label>
              </div>
            ))}
          </RadioGroup>
          <div className="rating-labels">
            <span>不太满意</span>
            <span>很满意</span>
          </div>
        </fieldset>

        <div className="field checkbox-field">
          <div className="checkbox-option">
            <Checkbox
              id="had-unexpected-cost"
              checked={hadUnexpectedCost}
              onCheckedChange={(checked) => setHadUnexpectedCost(checked === true)}
            />
            <Label htmlFor="had-unexpected-cost">
            <span>
              <strong>还有预料之外的成本</strong>
              <small>例如配件、维修、订阅或额外时间</small>
            </span>
            </Label>
          </div>
        </div>

        {hadUnexpectedCost ? (
          <div className="field">
            <Label htmlFor="unexpected-cost">额外成本金额（可选）</Label>
            <div className="input-prefix">
              <span>¥</span>
              <Input
                id="unexpected-cost"
                inputMode="decimal"
                value={unexpectedCost}
                onChange={(event) => setUnexpectedCost(event.target.value)}
                placeholder="0.00"
              />
            </div>
          </div>
        ) : null}

        <div className="field">
          <Label htmlFor="review-note">还有什么想记下来</Label>
          <Textarea
            id="review-note"
            rows={4}
            maxLength={280}
            value={note}
            onChange={(event) => setNote(event.target.value)}
            placeholder="哪些地方和预期一样，哪些不一样？"
          />
          <span className="field-hint">{note.length}/280</span>
        </div>
      </section>

      {error ? (
        <p className="form-error" role="alert">
          {error}
        </p>
      ) : null}

      <div className="form-actions sticky-actions">
        <Button
          variant="ghost"
          type="button"
          onClick={() => window.location.assign(`/items/${record.id}`)}
        >
          暂不填写
        </Button>
        <Button type="submit">
          <Save size={18} aria-hidden="true" />
          保存使用感受
        </Button>
      </div>
    </form>
  );
}
