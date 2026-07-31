"use client";

import type { KeyboardEvent } from "react";
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
  const selectAndFocus = (next: ListFilter) => {
    onChange(next);
    window.requestAnimationFrame(() => {
      document.getElementById(`status-tab-${next}`)?.focus();
    });
  };

  const handleKeyDown = (
    event: KeyboardEvent<HTMLButtonElement>,
    current: ListFilter,
  ) => {
    const currentIndex = tabs.findIndex((tab) => tab.id === current);
    let nextIndex = currentIndex;
    if (event.key === "ArrowRight" || event.key === "ArrowDown") {
      nextIndex = (currentIndex + 1) % tabs.length;
    } else if (event.key === "ArrowLeft" || event.key === "ArrowUp") {
      nextIndex = (currentIndex - 1 + tabs.length) % tabs.length;
    } else if (event.key === "Home") {
      nextIndex = 0;
    } else if (event.key === "End") {
      nextIndex = tabs.length - 1;
    } else {
      return;
    }
    event.preventDefault();
    selectAndFocus(tabs[nextIndex].id);
  };

  return (
    <div className="status-tabs" role="tablist" aria-label="按状态筛选">
      {tabs.map((tab) => (
        <button
          type="button"
          role="tab"
          id={`status-tab-${tab.id}`}
          aria-controls="records-panel"
          aria-selected={value === tab.id}
          className={value === tab.id ? "is-active" : ""}
          key={tab.id}
          onClick={() => onChange(tab.id)}
          onKeyDown={(event) => handleKeyDown(event, tab.id)}
          tabIndex={value === tab.id ? 0 : -1}
        >
          {tab.label}
          <span>{counts[tab.id]}</span>
        </button>
      ))}
    </div>
  );
}
