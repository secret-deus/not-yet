"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { NotFoundState } from "@/src/components/NotFoundState";
import { PageHeader } from "@/src/components/PageHeader";
import { PostPurchaseReviewForm } from "@/src/components/PostPurchaseReviewForm";
import { useRecord } from "@/src/hooks/useRecord";

export default function PostPurchaseReviewPage() {
  const { id } = useParams<{ id: string }>();
  const { record, ready } = useRecord(id);

  if (!ready) return null;
  if (!record) return <NotFoundState />;
  if (
    record.status !== "purchased" ||
    !record.postPurchaseReview ||
    record.postPurchaseReview.status === "completed"
  ) {
    return (
      <section className="state-card">
        <h1>这条记录现在不需要填写使用感受</h1>
        <p>只有已购买、且尚未完成验证的记录会来到这里。</p>
        <Link className="button button-primary" href={`/items/${id}`}>
          返回详情
        </Link>
      </section>
    );
  }

  return (
    <div className="content-page post-review-page">
      <PageHeader
        eyebrow="购买后验证"
        title="现在用起来怎么样？"
        description="这不是考试，只是帮你了解自己的判断。"
        backHref={`/items/${id}`}
      />
      <PostPurchaseReviewForm record={record} />
    </div>
  );
}
