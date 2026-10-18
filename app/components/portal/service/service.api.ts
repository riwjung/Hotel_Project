import { api } from "@/app/lib/api-client";
import type { Service, ServiceCategory, ServiceCategoryInput, ServiceInput } from "./types";

export function fetchCategories(signal?: AbortSignal) {
  return api<ServiceCategory[]>("/api/service-categories", { signal });
}

export function createCategory(input: ServiceCategoryInput) {
  return api<ServiceCategory>("/api/service-categories", { method: "POST", body: input });
}

export function updateCategory(id: number, input: ServiceCategoryInput) {
  return api<ServiceCategory>(`/api/service-categories/${id}`, { method: "PATCH", body: input });
}

export function deleteCategory(id: number) {
  return api<{ ok: true }>(`/api/service-categories/${id}`, { method: "DELETE" });
}

export function fetchServices(signal?: AbortSignal) {
  return api<Service[]>("/api/services", { signal });
}

export function createService(input: ServiceInput) {
  return api<Service>("/api/services", { method: "POST", body: input });
}

export function updateService(id: number, input: ServiceInput) {
  return api<Service>(`/api/services/${id}`, { method: "PATCH", body: input });
}

export function deleteService(id: number) {
  return api<{ ok: true }>(`/api/services/${id}`, { method: "DELETE" });
}
