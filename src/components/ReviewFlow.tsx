"use client";

import {
  Clock3,
  PauseCircle,
  ShoppingBag,
} from "lucide-react";
import { useState, type FormEvent } from "react";
import { useApp } from "@/src/context/AppProvider";
import { formatMoney } from "@/src/domain/money";
import { localDateTimeInputValue } from "@/src/domain/time";
import type { PurchaseRecord } from "@/src/domain/types";

type Choice = "wait" | "skip" | "purchase" | null;

export function ReviewFlow({ record }: { record: PurchaseRecord }) {
  const { continueWaiting, skipItem, purchaseItem } = useApp();
  const [choice, setChoice] = useState<Choice>(null);
  const [error, setError] = useState<string | null>(null);
  const [waitDays, setWaitDays] = useState(3);
  const [waitReason, setWaitReason] = useState("");
  const [skipReason, setSkipReason] = useState("");
  const [actualPrice, setActualPrice] = useState(
    record.priceMinor === undefined ? "" : (record.priceMinor / 100).toFixed(2),
  );
  const [purchasedAt, setPurchasedAt] = useState(() =>
    localDateTimeInputValue(),
  );
  const [purchaseReason, setPurchaseReason] = useState("");

  const finish = (action: () => boolean) => {
    setError(null);
    try {
      if (action()) window.location.assign(`/items/${record.id}`);
      else setError("这次更改还没有保存。");
    } catch (actionError) {
      setError(
        actionError instanceof Error ? actionError.message : "请检查填写内容。",
      );
    }
  };

  const submit = (event: FormEvent) => {
    event.preventDefault();
    if (choice === "wait") {
      finish(() =>
        continueWaiting(record.id, waitDays, waitReason || undefined),
      );
    } else if (choice === "skip") {
      finish(() => skipItem(record.id, skipReason || undefined));
    } else if (choice === "purchase") {
      finish(() =>
        purchaseItem(record.id, {
          actualPriceYuan: actualPrice || undefined,
          purchasedAt,
          reason: purchaseReason || undefined,
        }),
      );
    }
  };

  return (
    <div className="review-flow">
      <section className="review-context">
        <span className="eyebrow">先对照当时</span>
        <dl>
          <div>
            <dt>当时的价格</dt>
            <dd>{formatMoney(record.priceMinor)}</dd>
          </div>
          <div>
            <dt>当时的理由</dt>
            <dd>{record.reason || "未记录"}</dd>
          </div>
          <div>
            <dt>打算怎么用</dt>
            <dd>{record.intendedUse || "未记录"}</dd>
          </div>
          <div>
            <dt>已有替代</dt>
            <dd>{record.existingAlternative || "未记录"}</dd>
          </div>
        </dl>
      </section>

      <section className="decision-section" aria-labelledby="decision-title">
        <span className="eyebrow">现在的决定</span>
        <h2 id="decision-title">等了一段时间，现在更接近哪一个决定？</h2>
        <p>没有“正确答案”。选择此刻最真实的一项就好。</p>

        <div className="decision-options" role="radiogroup">
          <DecisionOption
            active={choice === "wait"}
            icon={<Clock3 size={22} />}
            title="我想再等一等"
            description="再给自己一轮冷静期"
            onClick={() => setChoice("wait")}
          />
          <DecisionOption
            active={choice === "skip"}
            icon={<PauseCircle size={22} />}
            title="我先不买"
            description="把这次决定记录下来"
            onClick={() => setChoice("skip")}
          />
          <DecisionOption
            active={choice === "purchase"}
            icon={<ShoppingBag size={22} />}
            title="我已经买了"
            description="一周后回来验证使用感受"
            onClick={() => setChoice("purchase")}
          />
        </div>
      </section>

      {choice ? (
        <form className="decision-form" onSubmit={submit}>
          {choice === "wait" ? (
            <>
              <div className="field">
                <label htmlFor="wait-days">再等几天</label>
                <input
                  id="wait-days"
                  type="number"
                  min={1}
                  max={30}
                  step={1}
                  value={waitDays}
                  onChange={(event) => setWaitDays(Number(event.target.value))}
                />
                <span className="field-hint">1～30 天，新一轮从现在开始</span>
              </div>
              <div className="field">
                <label htmlFor="wait-reason">为什么想再等等（可选）</label>
                <textarea
                  id="wait-reason"
                  rows={3}
                  maxLength={500}
                  value={waitReason}
                  onChange={(event) => setWaitReason(event.target.value)}
                  placeholder="例如：还没实际试过替代方案"
                />
              </div>
            </>
          ) : null}

          {choice === "skip" ? (
            <div className="field">
              <label htmlFor="skip-reason">现在不买的主要原因（可选）</label>
              <textarea
                id="skip-reason"
                rows={4}
                maxLength={500}
                value={skipReason}
                onChange={(event) => setSkipReason(event.target.value)}
                placeholder="例如：已有物品已经能满足需要"
              />
            </div>
          ) : null}

          {choice === "purchase" ? (
            <>
              <div className="field-grid">
                <div className="field">
                  <label htmlFor="actual-price">实际花了多少钱</label>
                  <div className="input-prefix">
                    <span>¥</span>
                    <input
                      id="actual-price"
                      inputMode="decimal"
                      value={actualPrice}
                      onChange={(event) => setActualPrice(event.target.value)}
                      placeholder="0.00"
                    />
                  </div>
                </div>
                <div className="field">
                  <label htmlFor="purchased-at">购买时间</label>
                  <input
                    id="purchased-at"
                    type="datetime-local"
                    value={purchasedAt}
                    onChange={(event) => setPurchasedAt(event.target.value)}
                  />
                </div>
              </div>
              <div className="field">
                <label htmlFor="purchase-reason">最后决定买的主要原因（可选）</label>
                <textarea
                  id="purchase-reason"
                  rows={3}
                  maxLength={500}
                  value={purchaseReason}
                  onChange={(event) => setPurchaseReason(event.target.value)}
                />
              </div>
            </>
          ) : null}

          {error ? (
            <p className="form-error" role="alert">
              {error}
            </p>
          ) : null}

          <div className="form-actions sticky-actions">
            <button
              className="button button-ghost"
              type="button"
              onClick={() => setChoice(null)}
            >
              重新选择
            </button>
            <button className="button button-primary" type="submit">
              确认这个决定
            </button>
          </div>
        </form>
      ) : null}
    </div>
  );
}

function DecisionOption({
  active,
  icon,
  title,
  description,
  onClick,
}: {
  active: boolean;
  icon: React.ReactNode;
  title: string;
  description: string;
  onClick(): void;
}) {
  return (
    <button
      className={active ? "is-active" : ""}
      type="button"
      role="radio"
      aria-checked={active}
      onClick={onClick}
    >
      <span aria-hidden="true">{icon}</span>
      <div>
        <strong>{title}</strong>
        <small>{description}</small>
      </div>
    </button>
  );
}
