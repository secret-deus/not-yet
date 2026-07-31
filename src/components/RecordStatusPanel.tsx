"use client";

import Link from "next/link";
import {
  CalendarClock,
  CheckCircle2,
  RotateCcw,
  ShoppingBag,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { Button } from "@/src/components/ui/button";
import { Input } from "@/src/components/ui/input";
import { Label } from "@/src/components/ui/label";
import { useApp } from "@/src/context/AppProvider";
import {
  formatDateTime,
  formatRemaining,
} from "@/src/domain/time";
import type { PurchaseRecord } from "@/src/domain/types";
import { Modal } from "./Modal";

export function RecordStatusPanel({ record }: { record: PurchaseRecord }) {
  const { adjustItemCooling, beginReview } = useApp();
  const [nowMs, setNowMs] = useState(() => Date.now());
  const [adjustOpen, setAdjustOpen] = useState(false);
  const [days, setDays] = useState("3");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const timer = window.setInterval(() => setNowMs(Date.now()), 60_000);
    return () => window.clearInterval(timer);
  }, []);

  const progress = useMemo(() => {
    const start = Date.parse(record.coolingStartedAt);
    const end = Date.parse(record.coolingEndsAt);
    if (end <= start) return 100;
    return Math.max(0, Math.min(100, ((nowMs - start) / (end - start)) * 100));
  }, [nowMs, record.coolingEndsAt, record.coolingStartedAt]);

  if (record.status === "cooling") {
    return (
      <section className="status-panel status-panel-cooling">
        <div className="status-panel-top">
          <span className="status-symbol">
            <CalendarClock size={22} aria-hidden="true" />
          </span>
          <div>
            <span className="eyebrow">第 {record.coolingRound} 轮冷静期</span>
            <h2>{formatRemaining(record.coolingEndsAt, nowMs)}</h2>
            <p>预计 {formatDateTime(record.coolingEndsAt)} 可以复盘</p>
          </div>
        </div>
        <div
          className="progress-track"
          role="progressbar"
          aria-label="冷静期进度"
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={Math.round(progress)}
        >
          <span style={{ width: `${progress}%` }} />
        </div>
        <div className="status-panel-actions">
          <Button
            variant="outline"
            type="button"
            onClick={() => {
              if (beginReview(record.id)) {
                window.location.href = `/items/${record.id}/review`;
              }
            }}
          >
            提前开始复盘
          </Button>
          <Button
            variant="ghost"
            type="button"
            onClick={() => setAdjustOpen(true)}
          >
            调整等待时间
          </Button>
        </div>

        <Modal
          open={adjustOpen}
          title="重新设置等待时间"
          description="新一轮会从现在开始计算，并在时间线留下记录。"
          onClose={() => setAdjustOpen(false)}
        >
          <div className="field">
            <Label htmlFor="adjust-days">继续等待几天</Label>
            <Input
              id="adjust-days"
              type="number"
              min={1}
              max={30}
              step={1}
              required
              value={days}
              onChange={(event) => setDays(event.target.value)}
            />
            <span className="field-hint">1～30 天</span>
          </div>
          {error ? (
            <p className="form-error" role="alert">
              {error}
            </p>
          ) : null}
          <div className="modal-actions">
            <Button
              variant="ghost"
              type="button"
              onClick={() => setAdjustOpen(false)}
            >
              取消
            </Button>
            <Button
              type="button"
              onClick={() => {
                setError(null);
                const parsedDays = Number(days);
                if (
                  !Number.isInteger(parsedDays) ||
                  parsedDays < 1 ||
                  parsedDays > 30
                ) {
                  setError("请输入 1～30 天的整数。");
                  return;
                }
                try {
                  if (adjustItemCooling(record.id, parsedDays)) {
                    setAdjustOpen(false);
                  }
                } catch (adjustError) {
                  setError(
                    adjustError instanceof Error
                      ? adjustError.message
                      : "无法调整等待时间。",
                  );
                }
              }}
            >
              <RotateCcw size={17} aria-hidden="true" />
              开始新一轮
            </Button>
          </div>
        </Modal>
      </section>
    );
  }

  if (record.status === "review_ready") {
    return (
      <section className="status-panel status-panel-ready">
        <div className="status-panel-top">
          <span className="status-symbol">
            <CheckCircle2 size={22} aria-hidden="true" />
          </span>
          <div>
            <span className="eyebrow">冷静期已完成</span>
            <h2>现在可以复盘了</h2>
            <p>先对照当时的理由，再决定继续等、先不买，还是已经买了。</p>
          </div>
        </div>
        <Button asChild className="button-block">
          <Link href={`/items/${record.id}/review`}>开始复盘</Link>
        </Button>
      </section>
    );
  }

  if (record.status === "purchased") {
    const review = record.postPurchaseReview;
    const due = review?.status === "due";
    return (
      <section className="status-panel status-panel-decided">
        <div className="status-panel-top">
          <span className="status-symbol">
            <ShoppingBag size={22} aria-hidden="true" />
          </span>
          <div>
            <span className="eyebrow">已记录决定</span>
            <h2>你最后买了</h2>
            <p>
              {review?.status === "completed"
                ? "真实使用感受已经记录下来。"
                : due
                  ? "差不多一周了，可以记录实际使用感受。"
                  : "使用一段时间后，再回来验证当初的预期。"}
            </p>
          </div>
        </div>
        {review?.status !== "completed" ? (
          <Button
            asChild
            className="button-block"
            variant={due ? "default" : "outline"}
          >
            <Link href={`/items/${record.id}/post-review`}>
              {due ? "记录 7 天使用感受" : "提前记录使用感受"}
            </Link>
          </Button>
        ) : null}
      </section>
    );
  }

  return (
    <section className="status-panel status-panel-decided">
      <div className="status-panel-top">
        <span className="status-symbol">
          <CheckCircle2 size={22} aria-hidden="true" />
        </span>
        <div>
          <span className="eyebrow">已记录决定</span>
          <h2>你决定先不买</h2>
          <p>
            {record.decision?.reason ||
              "没有记录原因也没关系，这仍然是一条真实的决定。"}
          </p>
        </div>
      </div>
    </section>
  );
}
