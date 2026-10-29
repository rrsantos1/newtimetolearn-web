import type { UserRole } from "@/modules/auth/types/auth.types";

export function hasAnyRole(
  userRoles: UserRole[],
  allowedRoles: UserRole[],
): boolean {
  return allowedRoles.some((role) => userRoles.includes(role));
}