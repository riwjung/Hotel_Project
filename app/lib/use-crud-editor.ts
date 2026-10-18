"use client";

import { useState } from "react";
import { App } from "antd";

type Options<T, I> = {
  /** singular noun for messages, e.g. "promotion" */
  noun: string;
  /** how a record is named in messages, e.g. (p) => p.promotionCode */
  label: (record: T) => string;
  create: (input: I) => Promise<T>;
  update: (record: T, input: I) => Promise<T>;
  remove?: (record: T) => Promise<unknown>;
  /** consequence shown in the delete confirmation (ui-standard §5 Modal) */
  removeWarning?: string;
  /** called after every successful write; create/update pass the saved record */
  onChanged: (saved?: T) => void;
};

const capitalize = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

/**
 * Modal state + save/delete for a CRUD screen (the pattern of useBranchEditor,
 * moved to lib on its third use). Messages come from App.useApp(); errors show
 * the server's message.
 */
export function useCrudEditor<T, I>(options: Options<T, I>) {
  const { message, modal } = App.useApp();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<T | null>(null);
  const [saving, setSaving] = useState(false);

  const openCreate = () => {
    setEditing(null);
    setOpen(true);
  };

  const openEdit = (record: T) => {
    setEditing(record);
    setOpen(true);
  };

  const close = () => setOpen(false);

  const save = async (input: I) => {
    setSaving(true);
    try {
      const saved = editing ? await options.update(editing, input) : await options.create(input);
      message.success(`${capitalize(options.noun)} ${options.label(saved)} ${editing ? "updated" : "created"}`);
      setOpen(false);
      options.onChanged(saved);
    } catch (err) {
      message.error(err instanceof Error ? err.message : `Could not save the ${options.noun}`);
    } finally {
      setSaving(false);
    }
  };

  const remove = (record: T) => {
    const removeFn = options.remove;
    if (!removeFn) return;
    modal.confirm({
      title: `Delete ${options.noun} ${options.label(record)}?`,
      content: options.removeWarning ?? "This cannot be undone.",
      okText: `Delete ${options.noun}`,
      okButtonProps: { danger: true },
      onOk: async () => {
        try {
          await removeFn(record);
          message.success(`${capitalize(options.noun)} ${options.label(record)} deleted`);
          options.onChanged();
        } catch (err) {
          message.error(err instanceof Error ? err.message : `Could not delete the ${options.noun}`);
        }
      },
    });
  };

  return { open, editing, saving, openCreate, openEdit, close, save, remove };
}
