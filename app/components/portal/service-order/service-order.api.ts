import { api } from "@/app/lib/api-client";
import type { SkillLevel } from "../skill/types";
import type { AssignInput, OrderStatusInput, ServiceOrder, ServiceOrderFilter, ServiceOrderInput } from "./types";

export type EligibleEmployee = {
  employeeId: number;
  employeeCode: string;
  fullName: string;
  skillLevel: SkillLevel;
  openAssignments: number;
};

export function fetchOrders(filter: ServiceOrderFilter, signal?: AbortSignal) {
  return api<ServiceOrder[]>("/api/service-orders", { params: filter, signal });
}

export function createOrder(input: ServiceOrderInput) {
  return api<ServiceOrder>("/api/service-orders", { method: "POST", body: input });
}

export function changeOrderStatus(id: number, input: OrderStatusInput) {
  return api<{ ok: true }>(`/api/service-orders/${id}/status`, { method: "POST", body: input });
}

export function assignOrder(id: number, input: AssignInput) {
  return api<{ ok: true }>(`/api/service-orders/${id}/assign`, { method: "POST", body: input });
}

export function fetchEligibleEmployees(id: number, signal?: AbortSignal) {
  return api<EligibleEmployee[]>(`/api/service-orders/${id}/eligible-employees`, { signal });
}
