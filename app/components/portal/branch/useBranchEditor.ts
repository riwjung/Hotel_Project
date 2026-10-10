"use client";

import { useState } from "react";
import { App } from "antd";
import { createBranch, deleteBranch, updateBranch } from "./branch.api";
import type { Branch, BranchInput } from "./types";

/** Modal state + save/delete for branches. Calls onChanged() after any successful write. */
export function useBranchEditor(onChanged: () => void) {
  const { message, modal } = App.useApp();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Branch | null>(null);
  const [saving, setSaving] = useState(false);

  const openCreate = () => {
    setEditing(null);
    setOpen(true);
  };

  const openEdit = (branch: Branch) => {
    setEditing(branch);
    setOpen(true);
  };

  const close = () => setOpen(false);

  const save = async (input: BranchInput) => {
    setSaving(true);
    try {
      if (editing) {
        await updateBranch(editing.branchId, input);
        message.success(`Branch ${input.branchCode} updated`);
      } else {
        await createBranch(input);
        message.success(`Branch ${input.branchCode} created`);
      }
      setOpen(false);
      onChanged();
    } catch (err) {
      message.error(err instanceof Error ? err.message : "Could not save the branch");
    } finally {
      setSaving(false);
    }
  };

  // Irreversible → confirm first, and say what happens (ui-standard.md §5 Modal)
  const remove = (branch: Branch) => {
    modal.confirm({
      title: `Delete branch ${branch.branchCode}?`,
      content:
        "This cannot be undone. A branch that still has rooms, staff or bookings cannot be deleted — set it to Inactive instead.",
      okText: "Delete branch",
      okButtonProps: { danger: true },
      onOk: async () => {
        try {
          await deleteBranch(branch.branchId);
          message.success(`Branch ${branch.branchCode} deleted`);
          onChanged();
        } catch (err) {
          message.error(err instanceof Error ? err.message : "Could not delete the branch");
        }
      },
    });
  };

  return { open, editing, saving, openCreate, openEdit, close, save, remove };
}
