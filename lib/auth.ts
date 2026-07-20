const defaultNextPath = "/dashboard";

export function getSafeNextPath(value: string | undefined, fallback = defaultNextPath) {
  if (!value || !value.startsWith("/") || value.startsWith("//")) return fallback;
  return value;
}

export function getDisplayName(metadata: Record<string, unknown> | undefined, email: string | undefined) {
  const storedName = metadata?.full_name ?? metadata?.name;
  if (typeof storedName === "string" && storedName.trim()) return storedName.trim();
  return email?.split("@")[0] ?? "Trader";
}

export function getInitials(name: string) {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("") || "P";
}
