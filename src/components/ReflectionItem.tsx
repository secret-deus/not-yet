"use client";

import { Check, Clock3, EyeOff, Pencil } from "lucide-react";
import { useState } from "react";
import { Button } from "@/src/components/ui/button";
import { Label } from "@/src/components/ui/label";
import { Textarea } from "@/src/components/ui/textarea";
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
          <Label className="reflection-edit-label">
            改成更适合你的说法
            <Textarea
              rows={3}
              maxLength={500}
              value={draft}
              onChange={(event) => setDraft(event.target.value)}
            />
          </Label>
          <div className="compact-actions">
            <Button
              size="sm"
              type="button"
              onClick={() => {
                onChange("adopted", draft);
                setEditing(false);
              }}
            >
              保存
            </Button>
            <Button
              size="sm"
              variant="ghost"
              type="button"
              onClick={() => setEditing(false)}
            >
              取消
            </Button>
          </div>
        </div>
      ) : (
        <>
          <p>{editedText || text}</p>
          {secondary ? <small>{secondary}</small> : null}
          <div className="reflection-actions" aria-label="处理这条想法">
            <Button
              type="button"
              size="xs"
              variant="ghost"
              className={status === "adopted" ? "is-selected" : ""}
              onClick={() => onChange("adopted", editedText ?? text)}
            >
              <Check size={15} aria-hidden="true" />
              采纳
            </Button>
            <Button
              type="button"
              size="xs"
              variant="ghost"
              onClick={() => {
                setDraft(editedText ?? text);
                setEditing(true);
              }}
            >
              <Pencil size={15} aria-hidden="true" />
              编辑
            </Button>
            <Button
              type="button"
              size="xs"
              variant="ghost"
              className={status === "later" ? "is-selected" : ""}
              onClick={() => onChange("later")}
            >
              <Clock3 size={15} aria-hidden="true" />
              稍后
            </Button>
            <Button
              type="button"
              size="xs"
              variant="ghost"
              className={status === "ignored" ? "is-selected" : ""}
              onClick={() => onChange("ignored")}
            >
              <EyeOff size={15} aria-hidden="true" />
              忽略
            </Button>
          </div>
        </>
      )}
    </article>
  );
}
