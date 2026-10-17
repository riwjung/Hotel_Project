import { api } from "@/app/lib/api-client";
import type { Customer, CustomerInput, MemberTier } from "./types";

export function fetchCustomers(signal?: AbortSignal) {
  return api<Customer[]>("/api/customers", { signal });
}

export function fetchMemberTiers(signal?: AbortSignal) {
  return api<MemberTier[]>("/api/member-tiers", { signal });
}

export function createCustomer(input: CustomerInput) {
  return api<Customer>("/api/customers", { method: "POST", body: input });
}

export function updateCustomer(id: number, input: CustomerInput) {
  return api<Customer>(`/api/customers/${id}`, { method: "PATCH", body: input });
}

export function deleteCustomer(id: number) {
  return api<{ ok: true }>(`/api/customers/${id}`, { method: "DELETE" });
}
