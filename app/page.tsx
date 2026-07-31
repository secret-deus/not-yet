"use client";

import Link from "next/link";
import { ArrowRight, Plus, ShieldCheck } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { CoolingDial } from "@/src/components/CoolingDial";
import { EmptyState } from "@/src/components/EmptyState";
import { RecordCard } from "@/src/components/RecordCard";
import { ReflectionPause } from "@/src/components/ReflectionPause";
import { StatusTabs } from "@/src/components/StatusTabs";
import { useApp } from "@/src/context/AppProvider";
import {
  filterRecords,
  recordCounts,
  sortRecords,
  type ListFilter,
} from "@/src/domain/selectors";

export default function Home() {
  const { records } = useApp();
  const [filter, setFilter] = useState<ListFilter>("waiting");
  const [nowMs, setNowMs] = useState(() => Date.now());

  useEffect(() => {
    const timer = window.setInterval(() => setNowMs(Date.now()), 60_000);
    return () => window.clearInterval(timer);
  }, []);

  const counts = useMemo(() => recordCounts(records), [records]);
  const visible = useMemo(
    () => sortRecords(filterRecords(records, filter), nowMs),
    [filter, nowMs, records],
  );
  const focusRecord = useMemo(
    () =>
      sortRecords(
        records.filter((record) => record.status === "cooling"),
        nowMs,
      )[0],
    [nowMs, records],
  );

  return (
    <div className="home-page">
      <section className="home-intro">
        <div className="home-copy">
          <span className="eyebrow">给购买决定一点时间</span>
          <h1>
            <span>想买的，</span>
            <span>先放一放。</span>
          </h1>
          <p>
            记下此刻的理由，等冷静期结束再回来看看。买或不买，都由你决定。
          </p>
          <Link className="button button-primary home-cta" href="/items/new">
            <Plus size={19} aria-hidden="true" />
            记下想买的东西
            <ArrowRight className="button-arrow" size={18} aria-hidden="true" />
          </Link>
          <div className="privacy-note">
            <ShieldCheck size={17} aria-hidden="true" />
            <span>
              <strong>默认只存在本机</strong>
              刷新不会丢，清除浏览器数据前请自行留意。
            </span>
          </div>
        </div>
        <CoolingDial
          endsAt={focusRecord?.coolingEndsAt}
          nowMs={nowMs}
          recordTitle={focusRecord?.title}
        />
      </section>

      <section className="records-section" aria-labelledby="records-title">
        <div className="section-heading">
          <div>
            <span className="eyebrow">你的记录</span>
            <h2 id="records-title">现在更接近哪一步？</h2>
          </div>
          <span className="total-count">共 {records.length} 条</span>
        </div>

        <StatusTabs value={filter} counts={counts} onChange={setFilter} />

        <div
          className="records-panel"
          id="records-panel"
          role="tabpanel"
          aria-labelledby={`status-tab-${filter}`}
          tabIndex={0}
        >
          {visible.length ? (
            <div className="record-list">
              {visible.map((record, index) => (
                <RecordCard
                  featured={index === 0 && visible.length > 1}
                  key={record.id}
                  record={record}
                  nowMs={nowMs}
                />
              ))}
              <ReflectionPause />
            </div>
          ) : (
            <EmptyState filter={filter} />
          )}
        </div>
      </section>
    </div>
  );
}
