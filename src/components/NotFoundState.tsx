import Link from "next/link";
import { SearchX } from "lucide-react";

export function NotFoundState() {
  return (
    <section className="state-card">
      <SearchX size={32} aria-hidden="true" />
      <h1>这条记录不存在</h1>
      <p>它可能已经被删除，或者这个链接不完整。</p>
      <Link className="button button-primary" href="/">
        返回记录列表
      </Link>
    </section>
  );
}
