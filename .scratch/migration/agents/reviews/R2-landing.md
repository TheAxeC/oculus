# R2 landing

Position: oculus migration plan, step R2 (the first-run check) landed, step 336 of 340; next: D56 (the workbench) in repair round 1, then its review and landing, then D49 (the help pages cut) and D55 (roots as hubs).

## Open items

None.

## Check before landing

`ListAgents` before the wip commit listed no R2 agent: its builders and both reviewers had ended (TaskStop found none of them running); the one subagent listed was D56's builder.

## Not done

Nothing inside R2's brief and the rulings on it.

## What landed

The first-run check, from base 5120f89cf (39 paths, +948 -318 against main). `src/lib/server/root/process/start/first-run.ts` checks, before oculus starts, the Node version (`^24.15.0 || >=26.0.0`), the installed packages against `package-lock.json`, the hub folder (missing, not a folder, or unreadable with its error code) and the programs `git`, `tmux`, `perl` and the `claude_bin` value. A required lack ends the start with its fix and exit 1; a missing program is named and the start goes on. `predev` and `prepreview` run the whole check and `preapp` runs the Node and packages part. `engines` is `^24.15.0 || >=26.0.0` in `package.json` and the lockfile, with `.npmrc` `engine-strict=true`. G73 is written into `agents/guarded.md` with its fifteen rows.

Visible change: a start under Node 24.0 to 24.14 or Node 25 (`node src/server.ts`, `npm run dev`, `npm run preview`) started at the base and is now refused with `oculus: Node <v> is not supported: oculus needs Node 24.15 or later on the 24 line, or Node 26 or later. Install it with: nvm install 24` and exit 1; `npm ci` refuses those versions too.

## What was found

The review over repair round 1 found four points, all closed at landing: the head comment of the G73 test and the doc comment of `machineLacks` named the old rule (fixed); `README.md:5` said "with Node 24" (fixed to the range); `README.md:11` gained a true sentence on the app's sheet outside the path list (kept); the refusal of Node 24.0 to 24.14 and 25 at start was not stated (stated above).

Fixes at landing: 4. The three comment and README fixes, and the conflicts in five generated diagram files resolved to main's copy and regenerated with `npm run diagrams`.

## Verification

Gate in `.agents/worktrees/gate`, `npm run diagrams && npm run test:landing`:

```
ok      ASCII gate (1.2 s)
ok      npm run lint (18.6 s)
ok      npm run format:check (24.8 s)
ok      npm test (188.9 s)
ok      npm run check, then npm run build, then npm run test:slow (338.8 s)
ok      npm run test:checks (351.0 s)
test:landing: 351.0 s; every command passed
```

Main's 39 staged blobs equal the gate's by `git rev-parse`. Look: R2 changes no page view; the start lines were read in the reviewer's runs, and the app's sheet is held by G48's slow test, which passed. No A/B (`bench: []`).

## Agents

- Builder a00e9759490ea453e (claude-sonnet-5-5): 164,875 tokens, 34 tool uses, 6.3 min (first run and cases, stopped by Axel).
- Builder a924a8b4546426f6a (claude-sonnet-5-5): 337,954 tokens, 122 tool uses, 31.2 min (the build); round 1 167,159 tokens, 59 tool uses, 42.5 min.
- Brief check a57eea66538e91df5 (claude-opus-5-5): 224,420 tokens, 82 tool uses, 12.2 min.
- Reviewer a89a4942c965eeb8a (claude-opus-5-5): 283,279 tokens, 86 tool uses, 24.2 min.
- Reviewer over round 1 a1d2a98931ed442a9 (claude-opus-5-5): 220,059 tokens, 48 tool uses, 14.5 min.

The first report did not pass its bar (one repair round). Fixes at landing: 4.

## Next

D56's builder finishes repair round 1, a fresh reviewer refutes it, and D56 lands; then D49 and D55 are prepared.
