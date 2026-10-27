export const RSVP_OPTIONS = [
  { key: "yes", label: "Attending", icon: "✅" },
  { key: "no", label: "Declined", icon: "❌" },
  { key: "maybe", label: "Maybe", icon: "🤔" },
  { key: "pending", label: "Pending", icon: "⏳" },
];

const COLOR_MAP = {
  yes: "var(--yes)",
  no: "var(--no)",
  maybe: "var(--maybe)",
  pending: "var(--pending)",
};

export function rsvpMeta(rsvp) {
  const opt = RSVP_OPTIONS.find((o) => o.key === rsvp) || RSVP_OPTIONS[3];
  return { ...opt, color: COLOR_MAP[rsvp] || COLOR_MAP.pending };
}
