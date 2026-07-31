"use client";

import { Tabs, TabsList, TabsTrigger } from "@/src/components/ui/tabs";
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
    <Tabs
      className="status-tabs-root"
      value={value}
      onValueChange={(nextValue) => onChange(nextValue as ListFilter)}
    >
      <TabsList className="status-tabs" aria-label="按状态筛选">
        {tabs.map((tab) => (
          <TabsTrigger
            className="status-tab"
            value={tab.id}
            id={`status-tab-${tab.id}`}
            aria-controls="records-panel"
            key={tab.id}
          >
            {tab.label}
            <span className="status-tab-count">{counts[tab.id]}</span>
          </TabsTrigger>
        ))}
      </TabsList>
    </Tabs>
  );
}
