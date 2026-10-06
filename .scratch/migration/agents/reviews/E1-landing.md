# E1 landing

Position: oculus/migration (the migration plan), E1 the design section for apps added while oculus runs, landed 2026-09-30; next: `/spec` X3d, S3, U2, Q88b and D23.

## Open items

- Z93, the design of apps added while oculus runs: 31 choices, in full in `agents/reviews/E1-choices.md`. Nothing is built and no build step is booked until Axel rules.

## The check of Steps 1

`ListAgents` before the landing listed no agent of this session: the builder (a47c8e362c522c5fb) and both reviewers had ended. Nothing was stopped.

## NOT DONE

- No look: the step changes `DESIGN.md` only and no view.
- Not verified, since no browser may be run against the design: every browser behaviour the section relies on (the `sandbox` directive on a direct visit, `frame-src` on a frame's own navigation, path sources in an opaque document, the policy's reach over WebRTC and DNS prefetch). The build step measures them; choice C29 asks whether the last two are part of that.

## What landed

Base aae8f7b7, `DESIGN.md` only, 79 lines inserted before the fixes at landing: the section "Apps added while oculus runs", between "Hot reload" and "Relationship to the cockpit", marked as an unbuilt proposal awaiting a ruling. "Decisions taken" and "Still undecided" are unchanged.

## Fixes at landing (fifteen, all text of the section)

1. F1: the two shared files (`/apps/-/penpal.js`, `/apps/-/oculus.js`) have a request rule of their own; the long list is for an app's file.
2. F2: the Document view opens a link that leaves this origin in a browser tab, so `frame-src 'self'` costs the manuals nothing.
3. F3: a write that names the bookmarks is refused for an app.
4. F4 and St1: the last sentence of "What an app does not get" states approval as the boundary and claims nothing for WebRTC and DNS prefetch.
5. F5: a file under `apps_dir` opens as source text, never in the Document view.
6. F6: the glyph `app` is the group heading's and a manifest may not name it; the default glyph is `app-view`.
7. F7 (P2): a refusal rejects with a plain string, since penpal copies an `Error`'s stack (`dist/penpal.mjs:15-20` and `88-97`, read from the 8.0.1 package).
8. F9: the clause on a rebound host name names the check that stops it.
9. F10: the manifest paragraph points at the closed sets instead of a second list.
10. F11: a second effect reads `data.apps` after a rerun load.
11. F12: the key rate is `apps.keys_per_s`.
12. F13: an absent `approvals.json` is looked for every two seconds.
13. F14: the `config` channel is said to carry the machine's name and address.
14. and 15. The two negation-contrasts.

F8: the report's "DESIGN.md:402" for the native-window sentence is the new file's line; the base line is 323 (`git show aae8f7b7:tools/oculus/DESIGN.md | sed -n 323p`).

## Verification on main, after the last fix

`npm run diagrams`, then `sh ~/.claude/skills/land/templates/checks.sh .scratch/migration/orchestrator-state.md` from `tools/oculus`, node v24.21.0, exit 0:

```
$ npm test
 Test Files  348 passed | 19 skipped (367)
      Tests  5303 passed | 557 skipped (5860)
$ npm run test:checks
 Test Files  27 passed | 2 skipped (29)
      Tests  365 passed | 9 skipped (374)
$ npm run check
1790770907053 COMPLETED 2377 FILES 0 ERRORS 0 WARNINGS 0 FILES_WITH_PROBLEMS
$ npm run build
$ npm run format:check
All matched files use Prettier code style!
$ npm run lint
$ ! LC_ALL=C grep -rna '[^ -~]' src tests
checks: 7 commands passed
```

`LC_ALL=C grep -c '[^ -~]' DESIGN.md` prints 0. What this does not cover: whether the design is right, which is Axel's ruling on Z93.

## Usage

- Builder, claude-sonnet-5-5: 37 tool uses, 215,466 tokens, 15.1 min; repair round 1: 20 tool uses, 264,475 tokens, 7.8 min.
- Brief check, claude-opus-5-5: 54 tool uses, 161,730 tokens, 8.4 min.
- Reviewer, claude-opus-5-5: 64 tool uses, 233,794 tokens, 16.7 min. Reviewer over round 1, claude-opus-5-5: about 40 tool calls by its own count, tokens and time not measured.
- The builder's first report did not pass its bar: the first review sent 20 items back. The review over round 1 left fifteen fixes for the landing.

## Next

`/spec` X3d, S3, U2, Q88b and D23, three slots filled.
