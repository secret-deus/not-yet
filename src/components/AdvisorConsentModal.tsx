"use client";

import { Brain, LockKeyhole, Send } from "lucide-react";
import { Modal } from "./Modal";
import type { AiReflectRequest } from "@/src/domain/types";
import { formatMoney } from "@/src/domain/money";

export function AdvisorConsentModal({
  open,
  payload,
  onClose,
  onConfirm,
}: {
  open: boolean;
  payload: AiReflectRequest;
  onClose(): void;
  onConfirm(): void;
}) {
  const fields = [
    ["商品名", payload.productName],
    ["价格", formatMoney(payload.priceMinor)],
    ["购买理由", payload.reason || "未填写"],
    ["打算用途", payload.intendedUse || "未填写"],
    [
      "每周预计使用",
      payload.expectedUsesPerWeek === undefined
        ? "未填写"
        : `${payload.expectedUsesPerWeek} 次`,
    ],
    ["已有替代", payload.existingAlternative || "未填写"],
    [
      "想要程度",
      payload.desireLevel === undefined ? "未填写" : `${payload.desireLevel}/5`,
    ],
  ];

  return (
    <Modal
      open={open}
      title="发送前，请确认这些内容"
      description="每次请求都单独确认，不会记住本次授权。"
      onClose={onClose}
    >
      <div className="consent-provider">
        <span>
          <Brain size={19} aria-hidden="true" />
        </span>
        <div>
          <strong>OpenAI 反思助手</strong>
          <p>
            本应用不在服务端保存请求；API 提供方会按其数据政策处理内容。
          </p>
        </div>
      </div>

      <dl className="consent-fields">
        {fields.map(([label, value]) => (
          <div key={label}>
            <dt>{label}</dt>
            <dd>{value}</dd>
          </div>
        ))}
      </dl>

      <div className="privacy-callout">
        <LockKeyhole size={18} aria-hidden="true" />
        <p>
          <strong>不会发送：</strong>
          商品链接、其他记录、浏览器存储、时间线或设备信息。请先删去姓名、电话、地址等敏感文字。
        </p>
      </div>

      <div className="modal-actions">
        <button className="button button-ghost" type="button" onClick={onClose}>
          返回检查
        </button>
        <button
          className="button button-primary"
          type="button"
          onClick={onConfirm}
        >
          <Send size={17} aria-hidden="true" />
          确认发送
        </button>
      </div>
    </Modal>
  );
}
