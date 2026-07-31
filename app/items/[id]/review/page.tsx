"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { Button } from "@/src/components/ui/button";
import { NotFoundState } from "@/src/components/NotFoundState";
import { PageHeader } from "@/src/components/PageHeader";
import { ReviewFlow } from "@/src/components/ReviewFlow";
import { useRecord } from "@/src/hooks/useRecord";

export default function ReviewPage() {
  const { id } = useParams<{ id: string }>();
  const { record, ready } = useRecord(id);

  if (!ready) return null;
  if (!record) return <NotFoundState />;
  if (record.status !== "review_ready") {
    return (
      <section className="state-card">
        <h1>这条记录现在不需要复盘</h1>
        <p>
          {record.status === "cooling"
            ? "冷静期仍在继续；如果你想提前复盘，请先从详情页开始。"
            : "它已经有最终决定，可以在详情页查看。"}
        </p>
        <Button asChild>
          <Link href={`/items/${id}`}>返回详情</Link>
        </Button>
      </section>
    );
  }

  return (
    <div className="content-page review-page">
      <PageHeader
        eyebrow="冷静期复盘"
        title={record.title}
        description="看看时间有没有带来新的信息，而不是评判当时的自己。"
        backHref={`/items/${id}`}
      />
      <ReviewFlow record={record} />
    </div>
  );
}
