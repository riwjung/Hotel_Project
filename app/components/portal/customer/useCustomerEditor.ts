"use client";

import { useState } from "react";
import { App } from "antd";
import { createCustomer, deleteCustomer, updateCustomer } from "./customer.api";
import type { Customer, CustomerInput } from "./types";

/**
 * Modal state + save/delete for customers. Calls onChanged() after any successful
 * write; a create/update passes the saved customer (the booking form selects it).
 */
export function useCustomerEditor(onChanged: (saved?: Customer) => void) {
  const { message, modal } = App.useApp();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Customer | null>(null);
  const [saving, setSaving] = useState(false);

  const openCreate = () => {
    setEditing(null);
    setOpen(true);
  };

  const openEdit = (customer: Customer) => {
    setEditing(customer);
    setOpen(true);
  };

  const close = () => setOpen(false);

  const save = async (input: CustomerInput) => {
    setSaving(true);
    try {
      const saved = editing ? await updateCustomer(editing.customerId, input) : await createCustomer(input);
      message.success(`Customer ${saved.firstName} ${saved.lastName} ${editing ? "updated" : "created"}`);
      setOpen(false);
      onChanged(saved);
    } catch (err) {
      message.error(err instanceof Error ? err.message : "Could not save the customer");
    } finally {
      setSaving(false);
    }
  };

  const remove = (customer: Customer) => {
    modal.confirm({
      title: `Delete customer ${customer.firstName} ${customer.lastName}?`,
      content:
        "This cannot be undone. A customer who already has bookings cannot be deleted — their history must stay with the bookings.",
      okText: "Delete customer",
      okButtonProps: { danger: true },
      onOk: async () => {
        try {
          await deleteCustomer(customer.customerId);
          message.success(`Customer ${customer.firstName} ${customer.lastName} deleted`);
          onChanged();
        } catch (err) {
          message.error(err instanceof Error ? err.message : "Could not delete the customer");
        }
      },
    });
  };

  return { open, editing, saving, openCreate, openEdit, close, save, remove };
}
