export function normalizeInviteCode(value: string) {
  const trimmed = value.trim();
  const linkMatch = trimmed.match(/(?:^|\/)join\/([a-z0-9]{8})(?:[/?#]|$)/i);

  return (linkMatch?.[1] ?? trimmed).replace(/\s/g, "").toUpperCase();
}
