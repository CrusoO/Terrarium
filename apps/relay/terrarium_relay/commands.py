from __future__ import annotations


def parse_command(text: str) -> tuple[str, str]:
    """Returns (command, argument). Empty command means free-text change request."""
    stripped = text.strip()
    upper = stripped.upper()
    if upper == "YES":
        return "YES", ""
    if upper == "PUBLISH":
        return "PUBLISH", ""
    if upper == "UNDO":
        return "UNDO", ""
    if upper == "STATUS":
        return "STATUS", ""
    if upper == "TOOLS":
        return "TOOLS", ""
    if upper == "CANCEL":
        return "CANCEL", ""
    if upper.startswith("APPROVE "):
        return "APPROVE", stripped.split(maxsplit=1)[1].strip()
    if upper.startswith("EDIT "):
        return "EDIT", stripped[5:].strip()
    if stripped.isdigit() and len(stripped) == 6:
        return "LINK", stripped
    return "CHANGE", stripped
