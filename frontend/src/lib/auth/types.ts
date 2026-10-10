export type AuthUser = { id: string; email: string; display_name: string };
export type AuthWorkspace = { id: string; name: string; timezone: string; phone: string | null };
export type AuthState = {
  user: AuthUser;
  workspace: AuthWorkspace | null;
  memberships: { workspace_id: string; role: string; workspace: AuthWorkspace }[];
  needs_onboarding: boolean;
  csrf_token: string;
};
export function initials(name: string) {
  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0])
    .join('')
    .toUpperCase();
}
