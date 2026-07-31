import {
  Bot,
  Check,
  Clock3,
  Pencil,
  RotateCcw,
  ShoppingBag,
  Trash2,
} from "lucide-react";
import { formatDateTime } from "@/src/domain/time";
import type {
  TimelineEvent,
  TimelineEventType,
} from "@/src/domain/types";

const labels: Record<TimelineEventType, string> = {
  created: "开始冷静期",
  edited: "编辑了记录",
  cooling_adjusted: "调整了冷静期",
  review_started: "提前开始复盘",
  waiting_extended: "决定继续等待",
  skipped: "决定先不买",
  purchased: "记录为已经买了",
  decision_undone: "撤销了刚才的决定",
  ai_generated: "生成了一次反思",
  ai_item_adopted: "采纳了一条反思线索",
  delete_requested: "请求删除记录",
  delete_undone: "撤销了删除",
  post_purchase_review_completed: "完成购买后使用验证",
};

function iconFor(type: TimelineEventType) {
  if (type === "edited") return <Pencil size={15} />;
  if (type === "ai_generated" || type === "ai_item_adopted") {
    return <Bot size={15} />;
  }
  if (type === "purchased") return <ShoppingBag size={15} />;
  if (type === "delete_requested" || type === "delete_undone") {
    return <Trash2 size={15} />;
  }
  if (
    type === "cooling_adjusted" ||
    type === "waiting_extended" ||
    type === "decision_undone"
  ) {
    return <RotateCcw size={15} />;
  }
  if (type === "skipped" || type === "post_purchase_review_completed") {
    return <Check size={15} />;
  }
  return <Clock3 size={15} />;
}

export function RecordTimeline({ events }: { events: TimelineEvent[] }) {
  return (
    <section className="timeline-section">
      <div className="section-heading">
        <div>
          <span className="eyebrow">时间线</span>
          <h2>这个决定怎么变化的</h2>
        </div>
      </div>
      <ol className="timeline-list">
        {[...events].reverse().map((event) => (
          <li key={event.id}>
            <span className="timeline-icon" aria-hidden="true">
              {iconFor(event.type)}
            </span>
            <div>
              <strong>{labels[event.type]}</strong>
              {event.summary ? <p>{event.summary}</p> : null}
              <time dateTime={event.at}>{formatDateTime(event.at)}</time>
            </div>
          </li>
        ))}
      </ol>
    </section>
  );
}
