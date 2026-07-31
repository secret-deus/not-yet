"use client";

import { useMemo } from "react";
import { useApp } from "@/src/context/AppProvider";

export function useRecord(id: string) {
  const { records, ready } = useApp();
  const record = useMemo(
    () => records.find((item) => item.id === id),
    [id, records],
  );
  return { record, ready };
}
