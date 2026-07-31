"use client";

import { Check, Clock3, EyeOff, Pencil } from "lucide-react";
import { useState } from "react";
import type { ReflectionItemStatus } from "@/src/domain/types";

export function ReflectionItem({
  title,
  text,
  secondary,
  status = "pending",
  editedText,
  onChange,
}: {
  title?: string;
  text: string;
  secondary?: string;
  status?: ReflectionItemStatus;
  editedText?: string;
  onChange(
    status: ReflectionItemStatus,
    userEditedText?: string,
  ): void;
}) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(editedText ?? text);

  return (
    <article className={`reflection-item reflection-${status}`}>
      {title ? <span className="reflection-kicker">{title}</span> : null}
      {editing ? (
        <div className="reflection-edit">
          <label>
            改成更适合你的说法
            <textarea
              rows={3}
              maxLength={500}
              value={draft}
              onChange={(event) => setDraft(event.target.value)}
            />
          </label>
          <div className="compact-actions">
            <button
              className="button button-small button-primary"
              type="button"
              onClick={() => {
                onChange("adopted", draft);
                setEditing(false);
              }}
            >
              保存
            </button>
            <button
              className="button button-small button-ghost"
              type="button"
              onClick={() => setEditing(false)}
            >
              取消
            </button>
          </div>
        </div>
      ) : (
        <>
          <p>{editedText || text}</p>
          {secondary ? <small>{secondary}</small> : null}
          <div className="reflection-actions" aria-label="处理这条想法">
            <button
              type="button"
              className={status === "adopted" ? "is-selected" : ""}
              onClick={() => onChange("adopted", editedText ?? text)}
            >
              <Check size={15} aria-hidden="true" />
              采纳
            </button>
            <button
              type="button"
              onClick={() => {
                setDraft(editedText ?? text);
                setEditing(true);
              }}
            >
              <Pencil size={15} aria-hidden="true" />
              编辑
            </button>
            <button
              type="button"
              className={status === "later" ? "is-selected" : ""}
              onClick={() => onChange("later")}
            >
              <Clock3 size={15} aria-hidden="true" />
              稍后
            </button>
            <button
              type="button"
              className={status === "ignored" ? "is-selected" : ""}
              onClick={() => onChange("ignored")}
            >
              <EyeOff size={15} aria-hidden="true" />
              忽略
            </button>
          </div>
        </>
      )}
    </article>
  );
}
