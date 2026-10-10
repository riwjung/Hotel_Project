"use client";

import { Tag } from "antd";
import type { StatusMeta } from "@/app/lib/status";

/** Renders a status code with its label, color and icon — never the raw code. */
export default function StatusTag<K extends string>({
  value,
  palette,
}: {
  value: K;
  palette: Record<K, StatusMeta>;
}) {
  const meta = palette[value];
  if (!meta) return <Tag>{value}</Tag>;
  return (
    <Tag color={meta.color} icon={meta.icon}>
      {meta.label}
    </Tag>
  );
}
