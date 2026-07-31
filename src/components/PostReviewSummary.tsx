import { formatMoney } from "@/src/domain/money";
import type { PurchaseRecord } from "@/src/domain/types";

const outcomeLabels = {
  met: "符合",
  partly_met: "部分符合",
  not_met: "不太符合",
};

export function PostReviewSummary({ record }: { record: PurchaseRecord }) {
  const review = record.postPurchaseReview;
  if (review?.status !== "completed") return null;
  const purchased =
    record.decision?.type === "purchased" ? record.decision : undefined;
  const unexpectedCost = review.hadUnexpectedCost
    ? review.unexpectedCostMinor === undefined
      ? "有，金额未记录"
      : formatMoney(review.unexpectedCostMinor)
    : "没有记录到";

  return (
    <section className="comparison-section">
      <div className="section-heading">
        <div>
          <span className="eyebrow">购买后对照</span>
          <h2>预期和实际，哪里一样？</h2>
        </div>
      </div>
      <div className="comparison-grid">
        <div>
          <span>购买前预期</span>
          <dl>
            <div>
              <dt>每周使用</dt>
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
              <dt>预计价格</dt>
              <dd>{formatMoney(record.priceMinor)}</dd>
            </div>
          </dl>
        </div>
        <div>
          <span>实际使用</span>
          <dl>
            <div>
              <dt>最近 7 天</dt>
              <dd>{review.actualUseCount} 次</dd>
            </div>
            <div>
              <dt>需要是否满足</dt>
              <dd>
                {review.needOutcome
                  ? outcomeLabels[review.needOutcome]
                  : "未记录"}
              </dd>
            </div>
            <div>
              <dt>满意度</dt>
              <dd>
                {review.satisfaction ? `${review.satisfaction}/5` : "未记录"}
              </dd>
            </div>
            <div>
              <dt>实际价格</dt>
              <dd>{formatMoney(purchased?.actualPriceMinor)}</dd>
            </div>
            <div>
              <dt>额外成本</dt>
              <dd>{unexpectedCost}</dd>
            </div>
          </dl>
        </div>
      </div>
      {review.note ? <blockquote>{review.note}</blockquote> : null}
    </section>
  );
}
