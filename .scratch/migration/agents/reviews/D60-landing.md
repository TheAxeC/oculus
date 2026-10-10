# D60 landing: repositories read as projects of the hub

Position: the oculus migration plan; D60, repositories read as projects of the hub, landed. Nothing in flight. Next: D62 (apps: the host and the bridge), prepared again by /spec on main's new head, then D63, D64, Q72 and O33.

## Open items

None.

## The check before the landing

The runner's agent listing showed no agent of the step: the builder a6dd13dec7398d216 and the reviewers adf31b9db8965f209 and a474ba6bf852ae0e1 had finished.

## NOT DONE

Nothing in the brief or in repair round 1.

## What landed

A `roots:` entry of the first hub's `.oculus/config/sources.yml` may carry `tier:` (`projects`, `coauthor`, `archive` or `personal`). Under a research tier the repository's `.oculus/project.yml` is a project of that tier of the first hub, its id the entry's key, shown and edited as a hub project with the LaTeX panel and without Deposit; `personal` or no `tier` keeps it a side project. Entry findings are filed on the hub layer's `sources.yml`; a hub root takes no `tier`; Settings gives a root's `tier` a choice whose "Not set" item leaves the key out; an audit finding that names a file of a repository project carries the repository's key and a repository-relative file, and the Deposit rules do not run on one. 77 paths, +3057 -1598 against main, from base 69b16a679.

## Found, and fixed at landing (5)

- `tests/data/hubs/hub-audit.test.ts` removed: the audit link and the Deposit skip fail at no cost the rules file names (lost work, a broken installation, a wrong configuration accepted), so they need no guarded entry; the runs of case 12 and the round show the behaviour.
- The `root` of an audit finding is stated as the Files root its file is relative to, in the `AuditFinding` and `Rooted` comments and in docs/apps.md's hubs paragraph and `audit` row.
- The collector's clause for a second hub's repository findings is dropped, since no second hub reads roots.
- `readRoots` refuses a research `tier` on a root whose directory is, lies inside or holds the directory of a hub root that stands, whichever is listed first, with the new finding `findings.roots.tier_in_hub`. Before the fix, a refused `hub: true` entry on a hub's directory with `tier: archive` read that hub's folder as a first-hub project. G13's changed row and its new row fail on D60's tree before the fix (`Tests  2 failed | 13 passed (15)`) and pass on main (`Tests  15 passed (15)`).
- `npm run diagrams` for the moved `files.ts` line.

D60's test rows are written under G8, G9, G13 and G32 in `agents/guarded.md`.

## Verification on main, from `tools/oculus`

```
test:landing: 6 commands, from /Users/axelfaes/workspace/research-hub/tools/oculus
ok      ASCII gate (0.9 s)
ok      npm run lint (21.6 s): > eslint . --cache --cache-location node_modules/.cache/eslint/
ok      npm run format:check (31.6 s): All matched files use Prettier code style!
ok      npm test (99.8 s): Duration  95.18s (transform 32.66s, setup 0ms, import 259.85s, tests 88.56s, environment 159ms)
ok      npm run check, then npm run build, then npm run test:slow (243.5 s): Duration  152.74s (transform 27.33s, setup 0ms, import 168.25s, tests 324.14s, environment 108ms)
ok      npm run test:checks (384.4 s): Duration  380.24s (transform 34.74s, setup 0ms, import 81.36s, tests 489.72s, environment 5ms)
test:landing: 384.5 s; every command passed
```

No A/B: the configuration names no `bench:`.

## The look

A scratch oculus from the gate (port 8796, the gate as the hub, main's staged diff applied), with a scratch repository `alpha` under the session scratch named by a `roots:` entry with `tier: projects`, the browser's saved state for that origin cleared first:

- Projects board: Alpha in the manuscript column, folder line `alpha`, no Deposit control.
- Alpha's project page: the repository's files, its README as the document, the LaTeX panel for `manuscript/main.tex` (build, clean, count words), no Deposit.
- Audit view: alpha's TODO marker in README.md, the missing `results`, the retired IDEA.md and the non-canonical `paper/` folder, no `code/` finding; IDEA.md opens as `alpha > IDEA.md`.
- Settings, roots records: `tier` on every entry, "Not set" on the entries without one, `projects` on alpha.

## Agents

- Builder a6dd13dec7398d216 (claude-sonnet-5-5): 204,709 tokens, 491 tool uses, 109.9 min; round 1: 142,092 tokens, 132 tool uses, 49.0 min.
- Brief check a9cd3f67733719350 (claude-opus-5-5): 222,061 tokens, 70 tool uses, 9.4 min.
- Reviewer adf31b9db8965f209 (claude-opus-5-5): 79,744 tokens, 120 tool uses, 21.3 min.
- Reviewer over round 1 a474ba6bf852ae0e1 (claude-opus-5-5): 269,002 tokens, 88 tool uses, 19.5 min.

The first report did not pass its bar (one repair round). Fixes at landing: 5. The builder ran three read-only git commands against the no-git rule, and the first reviewer one outside its set; neither changed anything.

## Next

/spec D62 on main's new head, with open item 46's rulings, then its launch.
