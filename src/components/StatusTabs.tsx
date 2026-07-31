import type { ListFilter } from "@/src/domain/selectors";

const tabs: Array<{ id: ListFilter; label: string }> = [
  { id: "waiting", label: "等待中" },
  { id: "ready", label: "待复盘" },
  { id: "decided", label: "已决定" },
];

export function StatusTabs({
  value,
  counts,
  onChange,
}: {
  value: ListFilter;
  counts: Record<ListFilter, number>;
  onChange(value: ListFilter): void;
}) {
  return (
    <div className="status-tabs" role="tablist" aria-label="按状态筛选">
      {tabs.map((tab) => (
        <button
          type="button"
          role="tab"
          aria-selected={value === tab.id}
          className={value === tab.id ? "is-active" : ""}
          key={tab.id}
          onClick={() => onChange(tab.id)}
        >
          {tab.label}
          <span>{counts[tab.id]}</span>
        </button>
      ))}
    </div>
  );
}
