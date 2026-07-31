import Link from "next/link";
import { Plus, Sprout } from "lucide-react";
import { Button } from "@/src/components/ui/button";

export function EmptyState({ filter }: { filter: string }) {
  const copy =
    filter === "waiting"
      ? {
          title: "先把一个念头放在这里",
          body: "不是劝你别买，只是给决定留一点时间。",
        }
      : filter === "ready"
        ? {
            title: "还没有到复盘时间的记录",
            body: "等冷静期结束，它们会自动来到这里。",
          }
        : {
            title: "还没有做完的决定",
            body: "买或不买都没关系，留下真实结果就有价值。",
          };
  return (
    <section className="empty-state">
      <span className="empty-icon">
        <Sprout size={30} strokeWidth={1.5} aria-hidden="true" />
      </span>
      <h2>{copy.title}</h2>
      <p>{copy.body}</p>
      {filter === "waiting" ? (
        <Button asChild>
          <Link href="/items/new">
            <Plus size={18} aria-hidden="true" />
            记下想买的东西
          </Link>
        </Button>
      ) : null}
    </section>
  );
}
