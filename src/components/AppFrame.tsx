"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { CirclePause, LockKeyhole, X } from "lucide-react";
import {
  useEffect,
  useRef,
  type ReactNode,
} from "react";
import { useApp } from "@/src/context/AppProvider";

export function AppFrame({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const mainRef = useRef<HTMLElement>(null);
  const {
    ready,
    loadError,
    recoveredFromBackup,
    saveError,
    multiTabWarning,
    notice,
    noticeRemainingMs,
    undoLatestNotice,
    resetLocalData,
    clearSaveError,
  } = useApp();

  useEffect(() => {
    if (ready) mainRef.current?.focus();
  }, [pathname, ready]);

  return (
    <div className="app-shell">
      <header className="site-header">
        <Link className="brand" href="/" aria-label="再等等，返回首页">
          <span className="brand-mark" aria-hidden="true">
            <CirclePause size={23} strokeWidth={1.7} />
          </span>
          <span>
            <strong>再等等</strong>
            <small>Not Yet</small>
          </span>
        </Link>
        <span className="local-badge">
          <LockKeyhole size={15} aria-hidden="true" />
          数据只存在本机
        </span>
      </header>

      <div className="banner-stack" aria-live="polite">
        {recoveredFromBackup ? (
          <div className="banner banner-info">
            已从上一份本地备份恢复数据，请确认最近的记录。
          </div>
        ) : null}
        {multiTabWarning ? (
          <div className="banner banner-warning">
            检测到另一个页面修改了数据。为避免冲突，请只保留一个编辑页面。
          </div>
        ) : null}
        {saveError ? (
          <div className="banner banner-error" role="alert">
            <span>{saveError}</span>
            <button
              className="icon-button"
              type="button"
              onClick={clearSaveError}
              aria-label="关闭保存错误提示"
            >
              <X size={18} />
            </button>
          </div>
        ) : null}
      </div>

      <main className="page-wrap" ref={mainRef} tabIndex={-1}>
        {!ready ? (
          <LoadingState />
        ) : loadError ? (
          <RecoveryState message={loadError} onReset={resetLocalData} />
        ) : (
          children
        )}
      </main>

      {notice && noticeRemainingMs > 0 ? (
        <div className="undo-toast" role="status">
          <div>
            <strong>{notice.message}</strong>
            <span>
              还可撤销 {(noticeRemainingMs / 1_000).toFixed(1)} 秒
            </span>
          </div>
          <button type="button" onClick={undoLatestNotice}>
            撤销
          </button>
        </div>
      ) : null}
    </div>
  );
}

function LoadingState() {
  return (
    <div className="state-card" aria-live="polite">
      <span className="spinner" aria-hidden="true" />
      <h1>正在读取你的记录</h1>
      <p>数据仍然留在这个浏览器里。</p>
    </div>
  );
}

function RecoveryState({
  message,
  onReset,
}: {
  message: string;
  onReset(): void;
}) {
  return (
    <section className="state-card state-card-error" role="alert">
      <span className="eyebrow">需要你确认</span>
      <h1>{message}</h1>
      <p>
        应用没有覆盖原始内容。若你确认不再需要这些本地数据，可以重置后重新开始。
      </p>
      <button className="button button-danger" type="button" onClick={onReset}>
        重置本地数据
      </button>
    </section>
  );
}
