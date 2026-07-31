"use client";

import Link from "next/link";
import { Pencil, Trash2 } from "lucide-react";
import { useParams } from "next/navigation";
import { useState } from "react";
import { AdvisorPanel } from "@/src/components/AdvisorPanel";
import { Modal } from "@/src/components/Modal";
import { NotFoundState } from "@/src/components/NotFoundState";
import { PageHeader } from "@/src/components/PageHeader";
import { PostReviewSummary } from "@/src/components/PostReviewSummary";
import { RecordFacts } from "@/src/components/RecordFacts";
import { RecordStatusPanel } from "@/src/components/RecordStatusPanel";
import { RecordTimeline } from "@/src/components/RecordTimeline";
import { useApp } from "@/src/context/AppProvider";
import { useRecord } from "@/src/hooks/useRecord";

export default function ItemDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { deleteItem } = useApp();
  const { record, ready } = useRecord(id);
  const [deleteOpen, setDeleteOpen] = useState(false);

  if (!ready) return null;
  if (!record) return <NotFoundState />;

  return (
    <div className="content-page detail-page">
      <PageHeader
        eyebrow="购买记录"
        title={record.title}
        description="这里保存的是你当时写下的内容和之后的真实决定。"
        action={
          <Link className="button button-secondary" href={`/items/${id}/edit`}>
            <Pencil size={17} aria-hidden="true" />
            编辑
          </Link>
        }
      />

      <RecordStatusPanel record={record} />
      <RecordFacts record={record} />
      <PostReviewSummary record={record} />
      <AdvisorPanel record={record} />
      <RecordTimeline events={record.timeline} />

      <section className="danger-zone">
        <div>
          <h2>不再保留这条记录</h2>
          <p>删除后有 8 秒可以撤销；时间结束后会从本机最终清理。</p>
        </div>
        <button
          className="button button-danger-quiet"
          type="button"
          onClick={() => setDeleteOpen(true)}
        >
          <Trash2 size={17} aria-hidden="true" />
          删除
        </button>
      </section>

      <Modal
        open={deleteOpen}
        title={`删除“${record.title}”？`}
        description="记录会立刻从列表隐藏，并给你 8 秒撤销。之后无法恢复。"
        tone="danger"
        onClose={() => setDeleteOpen(false)}
      >
        <div className="modal-actions">
          <button
            className="button button-ghost"
            type="button"
            onClick={() => setDeleteOpen(false)}
          >
            取消
          </button>
          <button
            className="button button-danger"
            type="button"
            onClick={() => {
              if (deleteItem(id)) {
                setDeleteOpen(false);
                window.location.assign("/");
              }
            }}
          >
            确认删除
          </button>
        </div>
      </Modal>
    </div>
  );
}
