export const STORAGE_KEY = "notyet:data:v1";
export const STORAGE_BACKUP_KEY = "notyet:data:backup:v1";

export const SCHEMA_VERSION = 1 as const;
export const DEFAULT_COOLING_DAYS = 3 as const;
export const DEFAULT_CURRENCY = "CNY" as const;
export const DEFAULT_LOCALE = "zh-CN" as const;

export const DELETE_UNDO_WINDOW_MS = 8_000;
export const DECISION_UNDO_WINDOW_MS = 8_000;
export const POST_PURCHASE_REVIEW_DAYS = 7 as const;

export const AI_DISCLAIMER =
  "这些内容只用于帮你补充思考，不代表购买建议，也不替你做决定。";

export const LOCAL_CHECKLIST = [
  "如果先不买 7 天，眼前的问题会怎样？",
  "家里已有的东西，能不能先完成一次同样的任务？",
  "你还缺哪一条可验证的信息，才能更有把握？",
  "能否先借用、租用、维修或做一次低成本试验？",
] as const;
