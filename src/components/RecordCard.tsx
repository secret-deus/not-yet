"use client";

import Link from "next/link";
import {
  ArrowUpRight,
  Camera,
  CheckCircle2,
  CirclePause,
  Clock3,
  Headphones,
  Keyboard,
  Monitor,
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
  featured = false,
}: {
  record: PurchaseRecord;
  nowMs: number;
  featured?: boolean;
}) {
  const status = statusView(record, nowMs);
  return (
    <Link
      className={`record-card${featured ? " record-card-featured" : ""}`}
      href={`/items/${record.id}`}
    >
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
        <ProductSketch title={record.title} />
      </div>
      <div className="record-card-foot">
        <span className="record-card-detail">{status.detail}</span>
        <span>第 {record.coolingRound} 轮</span>
        <span className="record-card-arrow" aria-hidden="true">
          <ArrowUpRight size={18} />
        </span>
      </div>
    </Link>
  );
}

function ProductSketch({ title }: { title: string }) {
  const normalized = title.toLowerCase();
  const Icon = normalized.match(/耳机|音响|headphone|airpods/)
    ? Headphones
    : normalized.match(/键盘|keycap|keyboard/)
      ? Keyboard
      : normalized.match(/相机|摄影|镜头|camera/)
        ? Camera
        : normalized.match(/电脑|显示器|屏幕|monitor/)
          ? Monitor
          : ShoppingBag;

  return (
    <span className="record-card-visual" aria-hidden="true">
      <Icon size={featuredIconSize(title)} strokeWidth={1.15} />
      <i />
    </span>
  );
}

function featuredIconSize(title: string): number {
  return title.length > 12 ? 76 : 88;
}
