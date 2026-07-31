import { ExternalLink } from "lucide-react";
import { formatMoney } from "@/src/domain/money";
import type { PurchaseRecord } from "@/src/domain/types";

export function RecordFacts({ record }: { record: PurchaseRecord }) {
  const facts: Array<[string, string]> = [
    ["当时价格", formatMoney(record.priceMinor)],
    ["购买理由", record.reason || "未记录"],
    ["打算用途", record.intendedUse || "未记录"],
    [
      "每周预计使用",
      record.expectedUsesPerWeek === undefined
        ? "未记录"
        : `${record.expectedUsesPerWeek} 次`,
    ],
    ["已有替代", record.existingAlternative || "未记录"],
    [
      "当时想要程度",
      record.desireLevel === undefined ? "未记录" : `${record.desireLevel}/5`,
    ],
  ];
  if (record.decision?.type === "purchased") {
    facts.push(
      ["实际价格", formatMoney(record.decision.actualPriceMinor)],
      ["最后决定买的原因", record.decision.reason || "未记录"],
    );
  } else if (record.decision?.type === "skipped") {
    facts.push(["最后决定不买的原因", record.decision.reason || "未记录"]);
  }
  return (
    <section className="facts-section">
      <div className="section-heading">
        <div>
          <span className="eyebrow">当时的记录</span>
          <h2>先看事实，不急着下结论</h2>
        </div>
      </div>
      <dl className="facts-grid">
        {facts.map(([label, value]) => (
          <div key={label}>
            <dt>{label}</dt>
            <dd>{value}</dd>
          </div>
        ))}
      </dl>
      {record.productUrl ? (
        <a
          className="source-link"
          href={record.productUrl}
          target="_blank"
          rel="noreferrer"
        >
          查看当时保存的商品链接
          <ExternalLink size={16} aria-hidden="true" />
        </a>
      ) : null}
    </section>
  );
}
