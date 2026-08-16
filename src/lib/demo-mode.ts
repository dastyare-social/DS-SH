export function isDemoMode(): boolean {
  return process.env.DEMO_MODE === "true";
}

export const demoModeError =
  "Demo mode is enabled: create, update and delete operations are disabled.";
