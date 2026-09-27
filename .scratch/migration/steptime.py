"""Time per step from an agent transcript: minutes per category of wait.

Usage: python3 steptime.py <transcript.jsonl> [<from ISO time> <to ISO time>]

A foreground tool call counts from call to result. A background command counts from the
agent's last record before its notification to the notification (the time the agent sat idle
waiting for it). Categories come from the command text.
"""
import json, re, sys
from datetime import datetime

def ts(s):
    return datetime.fromisoformat(s.replace('Z', '+00:00'))

def cat(cmd):
    if 'revert-check' in cmd:
        return 'revert-check'
    if 'playwright' in cmd or 'test:browser' in cmd:
        return 'browser'
    m = re.search(r'vitest run([^|;&]*)', cmd)
    if m or 'npm test' in cmd:
        args = [a for a in (m.group(1).split() if m else []) if not a.startswith('-') and not re.match(r'^\d?[<>]', a)]
        return 'unit (scoped)' if args else 'unit (whole)'
    if re.search(r'npm run (check|lint|format|diagrams|build)|size-check|folder-check|grep -rna', cmd):
        return 'other checks'
    return 'other tools'

rows = [json.loads(l) for l in open(sys.argv[1]) if '"timestamp"' in l]
rows = [r for r in rows if 'timestamp' in r]
if len(sys.argv) > 3:
    lo, hi = ts(sys.argv[2]), ts(sys.argv[3])
    rows = [r for r in rows if lo <= ts(r['timestamp']) <= hi]
start, end = ts(rows[0]['timestamp']), ts(rows[-1]['timestamp'])
calls, bg, totals = {}, [], {}
prev = None
for d in rows:
    t = ts(d['timestamp'])
    c = d.get('message', {}).get('content')
    if prev and d.get('type') == 'user' and isinstance(c, (str, list)) and 'task-notification' not in str(c) and 'SYSTEM NOTIFICATION' not in str(c)[:200] \
            and not (isinstance(c, list) and any(x.get('type') == 'tool_result' for x in c)) and (t - prev).total_seconds() > 300:
        totals['idle, awaiting round'] = totals.get('idle, awaiting round', 0) + (t - prev).total_seconds()
    if ('task-notification' in str(c) or 'SYSTEM NOTIFICATION' in str(c)[:200]) and bg:
        k = bg.pop(0)
        totals[k] = totals.get(k, 0) + (t - prev).total_seconds()
    if isinstance(c, list):
        for x in c:
            if x.get('type') == 'tool_use':
                inp = x.get('input', {})
                k = cat(inp.get('command', '')) if x['name'] == 'Bash' else 'other tools'
                if inp.get('run_in_background'):
                    if not inp.get('command', '').startswith('until '):
                        bg.append(k)
                else:
                    calls[x['id']] = (t, k)
            if x.get('type') == 'tool_result' and x.get('tool_use_id') in calls:
                t0, k = calls.pop(x['tool_use_id'])
                totals[k] = totals.get(k, 0) + (t - t0).total_seconds()
    prev = t
wall = (end - start).total_seconds()
print(f"wall {wall/60:.1f} min ({start:%H:%M}-{end:%H:%M} UTC)")
for k, v in sorted(totals.items(), key=lambda kv: -kv[1]):
    print(f"  {k:14s} {v/60:6.1f} min  {100*v/wall:4.0f}%")
rest = wall - sum(totals.values())
print(f"  {'model (rest)':14s} {rest/60:6.1f} min  {100*rest/wall:4.0f}%")
