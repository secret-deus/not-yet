import { Sprout } from "lucide-react";

export function ReflectionPause() {
  return (
    <aside className="reflection-pause" aria-label="给决定留一点空间">
      <Sprout size={30} strokeWidth={1.5} aria-hidden="true" />
      <strong>给自己一点空间</strong>
      <span>让想法慢慢沉淀，再回来做决定。</span>
    </aside>
  );
}
