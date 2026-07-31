"use client";

import Link from "next/link";
import {
  ArrowUpRight,
  CheckCircle2,
  CirclePause,
  Clock3,
  ShoppingBag,
} from "lucide-react";
import { formatMoney } from "@/src/domain/money";
import {
  formatDateTime,
  formatRemaining,
} from "@/src/domain/time";
import type { PurchaseRecord } from "@/src/domain/types";

function statusView(record: PurchaseRecord, nowMs: number) {
  if (record.status === "review_ready") {
    return {
      label: "待复盘",
      detail: "冷静期已结束",
      className: "status-ready",
      icon: <Clock3 size={16} aria-hidden="true" />,
    };
  }
  if (record.status === "cooling") {
    return {
      label: "等待中",
      detail: formatRemaining(record.coolingEndsAt, nowMs),
      className: "status-cooling",
      icon: <CirclePause size={16} aria-hidden="true" />,
    };
  }
  if (record.status === "purchased") {
    const review = record.postPurchaseReview;
    const detail =
      review?.status === "completed"
        ? "使用验证已完成"
        : review?.status === "due"
          ? "该记录使用感受了"
          : "已记录购买";
    return {
      label: "买了",
      detail,
      className: "status-purchased",
      icon: <ShoppingBag size={16} aria-hidden="true" />,
    };
  }
  return {
    label: "先不买",
    detail: record.decision
      ? formatDateTime(record.decision.decidedAt)
      : "已做决定",
    className: "status-skipped",
    icon: <CheckCircle2 size={16} aria-hidden="true" />,
  };
}

export function RecordCard({
  record,
  nowMs,
}: {
  record: PurchaseRecord;
  nowMs: number;
}) {
  const status = statusView(record, nowMs);
  return (
    <Link className="record-card" href={`/items/${record.id}`}>
      <div className="record-card-topline">
        <span className={`status-pill ${status.className}`}>
          {status.icon}
          {status.label}
        </span>
        <span className="record-card-price">{formatMoney(record.priceMinor)}</span>
      </div>
      <div className="record-card-main">
        <div>
          <h2>{record.title}</h2>
          <p>{record.reason || "还没有写购买理由"}</p>
        </div>
        <ArrowUpRight size={20} aria-hidden="true" />
      </div>
      <div className="record-card-foot">
        <span>{status.detail}</span>
        <span>第 {record.coolingRound} 轮</span>
      </div>
    </Link>
  );
}
