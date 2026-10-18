// employee_service_skill — who may be assigned to which service (R5).

export const SKILL_LEVELS = ["JUNIOR", "SENIOR", "EXPERT"] as const;
export type SkillLevel = (typeof SKILL_LEVELS)[number];

export type SkillMatrix = {
  employees: Array<{ employeeId: number; employeeCode: string; fullName: string; branchCode: string | null; roleName: string }>;
  services: Array<{ serviceId: number; serviceCode: string; serviceName: string; needAssignment: boolean }>;
  skills: Array<{ employeeId: number; serviceId: number; skillLevel: SkillLevel; certifiedDate: string | null }>;
};

/** Body of PUT /api/skills — skillLevel null removes the skill */
export type SkillInput = {
  employeeId: number;
  serviceId: number;
  skillLevel: SkillLevel | null;
};
