import { formatRemaining } from "@/src/domain/time";

type TimePart = {
  value: string;
  unit: string;
};

function remainingParts(endsAt: string | undefined, nowMs: number): TimePart[] {
  if (!endsAt) return [];
  const remaining = Math.max(0, Date.parse(endsAt) - nowMs);
  const totalMinutes = Math.ceil(remaining / 60_000);
  const days = Math.floor(totalMinutes / (24 * 60));
  const hours = Math.floor((totalMinutes % (24 * 60)) / 60);
  const minutes = totalMinutes % 60;

  if (days > 0) {
    return [
      { value: String(days), unit: "天" },
      { value: String(hours), unit: "小时" },
    ];
  }
  if (hours > 0) {
    return [
      { value: String(hours), unit: "小时" },
      { value: String(minutes), unit: "分钟" },
    ];
  }
  return [{ value: String(minutes), unit: "分钟" }];
}

export function CoolingDial({
  endsAt,
  nowMs,
  recordTitle,
}: {
  endsAt?: string;
  nowMs: number;
  recordTitle?: string;
}) {
  const validEndsAt =
    endsAt && Number.isFinite(Date.parse(endsAt)) ? endsAt : undefined;
  const parts = remainingParts(validEndsAt, nowMs);
  const accessibleTime = validEndsAt
    ? formatRemaining(validEndsAt, nowMs)
    : "还没有正在冷静期的记录";

  return (
    <div className="cooling-object">
      <span className="sr-only">
        {recordTitle
          ? `${recordTitle}，${accessibleTime}`
          : "给购买决定留一点时间"}
      </span>
      <div className="paper-bag" aria-hidden="true">
        <span className="bag-handle" />
        <span className="paper-tab paper-tab-one">再想想</span>
        <span className="paper-tab paper-tab-two">复盘</span>
        <span className="paper-tab paper-tab-three">决定</span>
      </div>
      <div className="cooling-dial" aria-hidden="true">
        <span className="dial-pointer" />
        <div className="dial-face">
          <span className="dial-kicker">{parts.length ? "还有" : "先等等"}</span>
          {parts.length ? (
            <strong className="dial-time">
              {parts.map((part) => (
                <span className="dial-time-part" key={part.unit}>
                  <b>{part.value}</b>
                  <small>{part.unit}</small>
                </span>
              ))}
            </strong>
          ) : (
            <strong className="dial-empty">留一点空白</strong>
          )}
          <span className="dial-record">
            {recordTitle || "一个念头，不必马上变成订单"}
          </span>
        </div>
      </div>
    </div>
  );
}
