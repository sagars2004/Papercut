export function normalizeInviteCode(value: string) {
  const trimmed = value.trim();
  const linkMatch = trimmed.match(/(?:^|\/)join\/([a-z0-9]{8})(?:[/?#]|$)/i);

  return (linkMatch?.[1] ?? trimmed).replace(/\s/g, "").toUpperCase();
}

export type DurationUnit = "minutes" | "hours" | "days";

export function durationToMinutes(value: number, unit: DurationUnit) {
  const multiplier = unit === "days" ? 1440 : unit === "hours" ? 60 : 1;
  return Math.round(value * multiplier);
}

export function formatRoomDuration(minutes: number) {
  if (minutes >= 1440 && minutes % 1440 === 0) return `${minutes / 1440} day${minutes === 1440 ? "" : "s"}`;
  if (minutes >= 60 && minutes % 60 === 0) return `${minutes / 60} hour${minutes === 60 ? "" : "s"}`;
  return `${minutes} minute${minutes === 1 ? "" : "s"}`;
}
