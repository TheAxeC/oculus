#!/bin/sh
# Layer 1, data. Preserve Claude Code's status-line payload for the Usage watcher and print its compact terminal status.

set -eu

config_dir=${CLAUDE_CONFIG_DIR:-"$HOME/.claude"}
account=${config_dir%/}
account=${account##*/}
target_dir="$HOME/.oculus/usage/claude/$account"
mkdir -p "$target_dir"
temporary="$target_dir/.incoming-$$"
trap 'rm -f "$temporary"' EXIT HUP INT TERM
umask 077
cat > "$temporary"

parsed=$(python3 - "$temporary" <<'PY'
import json
import sys

with open(sys.argv[1], encoding="utf-8") as handle:
    data = json.load(handle)

session = data.get("session_id", "")
if not isinstance(session, str) or not session or any(ch not in "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789-_" for ch in session):
    raise SystemExit("claude-usage: session_id is missing or unsafe")

parts = []
model = data.get("model")
if isinstance(model, dict) and model.get("display_name") is not None:
    parts.append(str(model["display_name"]))
context = data.get("context_window")
if isinstance(context, dict) and context.get("used_percentage") is not None:
    parts.append(f'{context["used_percentage"]}% context')
limits = data.get("rate_limits")
if isinstance(limits, dict):
    five = limits.get("five_hour")
    if isinstance(five, dict) and five.get("used_percentage") is not None:
        parts.append(f'5h {five["used_percentage"]}%')
    seven = limits.get("seven_day")
    if isinstance(seven, dict) and seven.get("used_percentage") is not None:
        parts.append(f'7d {seven["used_percentage"]}%')

print(session + ":" + " | ".join(parts))
PY
)
session_id=${parsed%%:*}
status=${parsed#*:}
mv -f "$temporary" "$target_dir/$session_id.json"
trap - EXIT HUP INT TERM
printf '%s\n' "$status"
