export function yuanToMinor(value?: string): number | undefined {
  const trimmed = value?.trim();
  if (!trimmed) return undefined;
  if (!/^(?:0|[1-9]\d*)(?:\.\d{1,2})?$/.test(trimmed)) {
    throw new Error("价格最多保留两位小数。");
  }

  const [whole, fraction = ""] = trimmed.split(".");
  const minor = Number(whole) * 100 + Number(fraction.padEnd(2, "0"));
  if (!Number.isSafeInteger(minor) || minor < 0 || minor > 9_999_999_999) {
    throw new Error("价格需在 0～99,999,999.99 元之间。");
  }
  return minor;
}

export function minorToYuan(value?: number): string {
  if (value === undefined) return "";
  return (value / 100).toFixed(2);
}

export function formatMoney(value?: number): string {
  if (value === undefined) return "未记录";
  return new Intl.NumberFormat("zh-CN", {
    style: "currency",
    currency: "CNY",
  }).format(value / 100);
}
