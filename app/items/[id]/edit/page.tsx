"use client";

import { useParams } from "next/navigation";
import { NotFoundState } from "@/src/components/NotFoundState";
import { PageHeader } from "@/src/components/PageHeader";
import { RecordForm } from "@/src/components/RecordForm";
import { useApp } from "@/src/context/AppProvider";
import { useRecord } from "@/src/hooks/useRecord";

export default function EditItemPage() {
  const { id } = useParams<{ id: string }>();
  const { updateItem } = useApp();
  const { record, ready } = useRecord(id);

  if (!ready) return null;
  if (!record) return <NotFoundState />;

  return (
    <div className="content-page">
      <PageHeader
        eyebrow="编辑记录"
        title={record.title}
        description="编辑描述不会改变冷静期状态或已有决定。"
        backHref={`/items/${id}`}
      />
      <RecordForm
        record={record}
        submitLabel="保存更改"
        onCancel={() => window.location.assign(`/items/${id}`)}
        onSubmit={(draft) => {
          const ok = updateItem(id, draft);
          if (ok) window.location.assign(`/items/${id}`);
          return ok;
        }}
      />
    </div>
  );
}
