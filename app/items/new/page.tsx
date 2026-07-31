"use client";

import { PageHeader } from "@/src/components/PageHeader";
import { RecordForm } from "@/src/components/RecordForm";
import { useApp } from "@/src/context/AppProvider";

export default function NewItemPage() {
  const { createItem } = useApp();

  return (
    <div className="content-page">
      <PageHeader
        eyebrow="新建冷静期"
        title="先记下此刻的想法"
        description="最少只填商品名。其他线索都可以稍后补充。"
      />
      <RecordForm
        submitLabel="开始冷静期"
        onCancel={() => window.location.assign("/")}
        onSubmit={(draft) => {
          const id = createItem(draft);
          if (!id) return false;
          window.location.assign(`/items/${id}`);
          return true;
        }}
      />
    </div>
  );
}
