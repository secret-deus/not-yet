"use client";

import { FlaskConical, Lightbulb, Search, Sparkles } from "lucide-react";
import { useApp } from "@/src/context/AppProvider";
import type {
  AiSession,
  LocalChecklistSession,
  ReflectionItemStatus,
} from "@/src/domain/types";
import { formatDateTime } from "@/src/domain/time";
import { ReflectionItem } from "./ReflectionItem";

export function ReflectionSessionView({
  recordId,
  session,
}: {
  recordId: string;
  session: AiSession | LocalChecklistSession;
}) {
  const { changeReflectionItem } = useApp();
  const change = (
    itemId: string,
    status: ReflectionItemStatus,
    text?: string,
  ) => changeReflectionItem(recordId, session.id, itemId, status, text);

  if (session.source === "local_checklist") {
    return (
      <section className="reflection-session">
        <div className="advisor-result-head">
          <div>
            <span className="eyebrow">本地检查清单</span>
            <h3>先从四个问题开始</h3>
          </div>
          <small>{formatDateTime(session.generatedAt)}</small>
        </div>
        <p className="session-source-note">
          这些是固定问题，没有调用 AI，也没有发送任何数据。
        </p>
        <div className="reflection-grid">
          {session.items.map((item, index) => (
            <ReflectionItem
              key={item.id}
              title={`问题 ${index + 1}`}
              text={item.question}
              status={item.status}
              editedText={item.userEditedText}
              onChange={(status, text) => change(item.id, status, text)}
            />
          ))}
        </div>
      </section>
    );
  }

  const state = (id: string) => session.itemStates[id];
  const result = session.result;
  return (
    <section className="reflection-session">
      <div className="advisor-result-head">
        <div>
          <span className="eyebrow">换个角度的结果</span>
          <h3>不是结论，是一组待验证的想法</h3>
        </div>
        <span className="completeness">
          信息完整度：
          {result.informationCompleteness === "high"
            ? "较高"
            : result.informationCompleteness === "medium"
              ? "一般"
              : "较低"}
        </span>
      </div>

      <div className="need-summary">
        <Sparkles size={19} aria-hidden="true" />
        <div>
          <span>可能的底层需要</span>
          <p>{result.underlyingNeed.text}</p>
          {result.underlyingNeed.basedOn.length ? (
            <small>
              依据你填写的：
              {result.underlyingNeed.basedOn.join("、")}
            </small>
          ) : null}
        </div>
      </div>

      <ResultGroup icon={<Search size={18} />} title="还缺的证据">
        {result.missingEvidence.map((item) => (
          <ReflectionItem
            key={item.id}
            text={item.question}
            secondary={item.whyItMatters}
            status={state(item.id)?.status}
            editedText={state(item.id)?.userEditedText}
            onChange={(status, text) => change(item.id, status, text)}
          />
        ))}
      </ResultGroup>

      <ResultGroup icon={<Lightbulb size={18} />} title="不急着购买的替代">
        {result.alternatives.map((item) => (
          <ReflectionItem
            key={item.id}
            text={item.idea}
            secondary={`取舍：${item.tradeoff}`}
            status={state(item.id)?.status}
            editedText={state(item.id)?.userEditedText}
            onChange={(status, text) => change(item.id, status, text)}
          />
        ))}
      </ResultGroup>

      <ResultGroup
        icon={<FlaskConical size={18} />}
        title="一个冷静期小实验"
      >
        <ReflectionItem
          title={result.coolingExperiment.title}
          text={result.coolingExperiment.steps.join("；")}
          secondary={`${result.coolingExperiment.duration} · 完成信号：${result.coolingExperiment.completionSignal}`}
          status={state(result.coolingExperiment.id)?.status}
          editedText={state(result.coolingExperiment.id)?.userEditedText}
          onChange={(status, text) =>
            change(result.coolingExperiment.id, status, text)
          }
        />
      </ResultGroup>

      <ResultGroup title="回来复盘时问自己">
        {result.reflectionQuestions.map((question, index) => {
          const itemId = `question-${index + 1}`;
          return (
            <ReflectionItem
              key={itemId}
              text={question}
              status={state(itemId)?.status}
              editedText={state(itemId)?.userEditedText}
              onChange={(status, text) => change(itemId, status, text)}
            />
          );
        })}
      </ResultGroup>

      <p className="ai-disclaimer">{result.disclaimer}</p>
    </section>
  );
}

function ResultGroup({
  icon,
  title,
  children,
}: {
  icon?: React.ReactNode;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="result-group">
      <h4>
        {icon}
        {title}
      </h4>
      <div className="reflection-grid">{children}</div>
    </section>
  );
}
