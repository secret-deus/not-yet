"use client";

import { Brain, ClipboardList, RefreshCw, Sparkles } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { Button } from "@/src/components/ui/button";
import {
  buildReflectRequest,
  inputHash,
} from "@/src/advisor/contract";
import {
  makeLocalChecklistSession,
  withFixedDisclaimer,
} from "@/src/domain/actions";
import type {
  AiReflectResponse,
  AiSession,
  PurchaseRecord,
} from "@/src/domain/types";
import { useApp } from "@/src/context/AppProvider";
import { AdvisorConsentModal } from "./AdvisorConsentModal";
import { ReflectionSessionView } from "./ReflectionSessionView";

export function AdvisorPanel({ record }: { record: PurchaseRecord }) {
  const { addReflection } = useApp();
  const [consentOpen, setConsentOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [slow, setSlow] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const controllerRef = useRef<AbortController | null>(null);
  const payload = useMemo(() => buildReflectRequest(record), [record]);
  const latest = record.reflectionSessions.at(-1);

  useEffect(
    () => () => {
      controllerRef.current?.abort();
    },
    [],
  );

  const runAdvisor = async () => {
    setConsentOpen(false);
    setLoading(true);
    setSlow(false);
    setError(null);
    const controller = new AbortController();
    controllerRef.current = controller;
    const slowTimer = window.setTimeout(() => setSlow(true), 8_000);
    const timeout = window.setTimeout(() => controller.abort(), 15_000);

    try {
      const response = await fetch("/api/reflect", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
        signal: controller.signal,
      });
      const data = (await response.json()) as AiReflectResponse;
      if (!data.ok) {
        setError(data.message);
        return;
      }

      const session: AiSession = {
        id: crypto.randomUUID(),
        source: "remote_ai",
        inputHash: await inputHash(payload),
        schemaVersion: "1",
        promptVersion: data.promptVersion,
        generatedAt: data.generatedAt,
        result: withFixedDisclaimer(data.result),
        itemStates: {},
      };
      if (!addReflection(record.id, session)) {
        setError("结果已经生成，但没有保存到本机。请不要关闭这个页面。");
      }
    } catch (requestError) {
      setError(
        requestError instanceof DOMException &&
          requestError.name === "AbortError"
          ? "AI 思考时间太久了，可以改用本地检查清单。"
          : "AI 暂时不可用，你的记录没有受到影响。",
      );
    } finally {
      window.clearTimeout(slowTimer);
      window.clearTimeout(timeout);
      controllerRef.current = null;
      setLoading(false);
      setSlow(false);
    }
  };

  const addLocal = () => {
    setError(null);
    addReflection(record.id, makeLocalChecklistSession(Date.now()));
  };

  return (
    <section className="advisor-panel" aria-labelledby="advisor-title">
      <div className="advisor-intro">
        <span className="advisor-icon">
          <Brain size={22} aria-hidden="true" />
        </span>
        <div>
          <span className="eyebrow">聪明一点，但不替你决定</span>
          <h2 id="advisor-title">换个角度想想</h2>
          <p>
            根据你写下的内容，补充缺失证据、替代方案和一个可执行的小实验。
          </p>
        </div>
      </div>

      <div className="advisor-actions">
        <Button
          type="button"
          disabled={loading}
          onClick={() => setConsentOpen(true)}
        >
          {loading ? (
            <RefreshCw className="spin" size={18} aria-hidden="true" />
          ) : (
            <Sparkles size={18} aria-hidden="true" />
          )}
          {loading ? "正在换个角度…" : "请 AI 帮我反思"}
        </Button>
        <Button
          variant="outline"
          type="button"
          disabled={loading}
          onClick={addLocal}
        >
          <ClipboardList size={18} aria-hidden="true" />
          使用本地清单
        </Button>
      </div>

      {loading ? (
        <div className="advisor-loading" aria-live="polite">
          <span className="spinner" aria-hidden="true" />
          <div>
            <strong>{slow ? "还在整理这些线索" : "正在生成反思问题"}</strong>
            <p>
              {slow
                ? "已超过 8 秒；15 秒仍未完成会自动停止。"
                : "不会修改你的状态或替你做决定。"}
            </p>
          </div>
        </div>
      ) : null}

      {error ? (
        <div className="advisor-error" role="alert">
          <p>{error}</p>
          <button className="text-button" type="button" onClick={addLocal}>
            改用本地检查清单
          </button>
        </div>
      ) : null}

      {latest ? (
        <ReflectionSessionView recordId={record.id} session={latest} />
      ) : (
        <p className="advisor-empty">
          AI 是可选项。即使不使用，你仍然可以完成全部冷静期和复盘流程。
        </p>
      )}

      <AdvisorConsentModal
        open={consentOpen}
        payload={payload}
        onClose={() => setConsentOpen(false)}
        onConfirm={runAdvisor}
      />
    </section>
  );
}
