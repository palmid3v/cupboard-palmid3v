const STORAGE_KEY = "cupboard.workspaceId";
const VALID_WORKSPACES = new Set(["home", "sandwichies"]);

export function getActiveWorkspaceId() {
  if (typeof window === "undefined") return "home";
  const stored = window.localStorage.getItem(STORAGE_KEY);
  return VALID_WORKSPACES.has(stored) ? stored : "home";
}

export function setActiveWorkspaceId(workspaceId) {
  if (!VALID_WORKSPACES.has(workspaceId)) throw new Error("INVALID_WORKSPACE");
  if (typeof window !== "undefined") window.localStorage.setItem(STORAGE_KEY, workspaceId);
}
