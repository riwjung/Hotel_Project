"use client";

import { Select } from "antd";
import { useBranchOptions } from "./branch/useBranchOptions";

type Props = {
  value?: number;
  onChange: (branchId: number | undefined) => void;
  width?: number;
};

/** "All branches" filter in a Card's extra. Renders nothing for branch-scoped users. */
export default function BranchFilter({ value, onChange, width = 180 }: Props) {
  const { chainWide, loading, options } = useBranchOptions();
  if (!chainWide) return null;
  return (
    <Select
      allowClear
      placeholder="All branches"
      style={{ width }}
      loading={loading}
      value={value}
      onChange={onChange}
      options={options}
    />
  );
}
