import { api } from "@/app/lib/api-client";
import type { SkillInput, SkillMatrix } from "./types";

export function fetchSkillMatrix(branchId: number | undefined, signal?: AbortSignal) {
  return api<SkillMatrix>("/api/skills", { params: { branchId }, signal });
}

export function setSkill(input: SkillInput) {
  return api<{ ok: true }>("/api/skills", { method: "PUT", body: input });
}
