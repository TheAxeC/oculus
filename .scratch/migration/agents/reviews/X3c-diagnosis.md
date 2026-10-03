# Diagnosis: an active tab left out of sight in its strip (Q78-look-1)

Every quoted command output carries `<REDACTED>` in place of the value of a secret in it, as the rules file's rule on secrets in quoted command output says. A diagnosis of the same step later is appended below under its own heading, which names its finding.

## Symptom

From `agents/reviews/owed-looks.md`, the Q78 look (2026-10-02, TEST, the rice palette "mocha" with its wallpaper, then back to "vscode dark modern"): "Q78-look-1: a tab activated while it is scrolled out of its strip stays out of sight: Processes shown in the left pane while the strip shows the inactive "Account setup" tab; VS Code scrolls the active tab into view. Booked into X3c (Z294)."

## Where the probes run

TEST at localhost:8790, tab 812136282, which serves main at 4bc8983b8 (X3c is not served). The probes are page scripts only: no source file is changed, so the step's worktree and main are untouched. The paths redirected under `$TMPDIR`: none. From 2026-10-03 23:00 the TEST window was in front (Z371 (a)): `document.visibilityState` `visible`, 121 frames in one second; it went `hidden` whenever Axel worked in the terminal. By Axel's ruling Z371 (b) the probes then ran headless: a detached worktree of main at 4e8d04297 under the session scratchpad (sparse to `tools/oculus`), a standalone page that mounts `ui/tabs/Tabs.svelte` alone (served by Vite on 127.0.0.1:8797 from that copy), driven by Playwright with its headless Chromium, both installed in the scratch folder only.

## Red command

None stands. Every run below carries its frame count.

- The earlier TEST runs that looked red (`__diagRed7` and its variants, the end placement) placed the tab's inner `[role=tab]` button at the list's right edge. The strip measures a tab by its whole face (`ui/tabs/Tabs.svelte:265` binds `faces[index]` to `TabFace`'s outer element, which holds the close control too), so those runs left the face cut at the right edge before the change. The strip reads that as the reader's own scroll and correctly leaves it, by design (`tab-scroll.svelte.ts:60-64`). The runs were the probe's error, not the symptom.
- Headless, with the probe's placement copied (`red.mjs`, the button at the edge): red three of three, 42 frames each, and the tagged log (`DIAG-4b2e`) showed `scrolled ... shownWhole=false` right after the placement, the face spanning `[416.3,534.1]` against an offset of 313 and a width of 159.
- Headless, with the whole face placed at the right end (`red2.mjs`): the tab is brought back whole after the tabs grow, five of five (`end j0 g1.3: pre 395/159 [21,139] V | grown 452/159 [0,130] V | reveals 1 | frames 42`, and the same with a scroll away and back of 50 px).
- Activating "Processes" from "Changes" in a strip of the left pane's nine tabs (`narrow.mjs`), with the strip 140, 200 and 260 px wide: Processes is shown from its start or whole every time (`width 260 ... post ... *Processes Pr:143/143`).
- A strip that mounts 0, 97 or 140 px wide with Processes active and is then widened to 260 or 400 px (`mount.mjs`): Processes whole every time (`start 97 grow 400 ... widened cw 299 ... *Processes Pr:143/143`).

## No red command

Ways tried, with what each gave:

- Way 4 on TEST, page scripts: a hidden tab gives no frames; while drawn, the only red came from the probe's own placement of the inner button (above).
- Way 7 headless (Z371 (b)): the width change, the activation of a tab out of sight at four widths, and a strip mounted narrow then widened, all green once the face is placed whole.
- Not reproduced: the Q78 look's state, "Processes" active in the left pane with the strip showing the inactive "Account setup". The look's own steps (the rice palette "mocha" with its wallpaper, then back to "vscode dark modern") were not replayed, since they change the theme on TEST, which Z290 limits.

Reproduced instead, on TEST and headless: a strip in a pane about 97 px wide gives its tab list 0 px (`narrow.mjs`: `width 97 ... cw 0`; TEST's left pane: list `clientWidth` 0 with nine tabs). The history arrows and the strip's controls take the whole width, so no tab, the active one included, is in sight at any scroll.

## Shrunk case

Not reached: no red command.

## Hypotheses

Formed on the probe's artifact and resolved by it: hypotheses 1 to 4 above were falsified on TEST; hypothesis 5 (`shownWhole` false after the reader's scroll) is explained by the artifact: the strip never held the face whole.

## Probes

- `DIAG-4b2e` logging in the scratch copy's `tab-scroll.svelte.ts` (`scrolled`, `resized`, `reveal`), headless: with the button placed at the edge, `scrolled cw=159 mw=159 sl=313 shownWhole=false` then `resized was=false ... whole=false`; with the face placed whole, `resized was=true cw=159 sl=395 whole=false shown=3`, `reveal i=3 target=452.3,582.1 ... to=452.265625`, `scrolled ... sl=452 shownWhole=true`.

## Cause

Cause not found: the Q78 look's state does not reproduce on main, and the only red run came from the probe. Raised to Axel as Z372 with the zero-width tab list as the defect that does reproduce.

## Fix and test

Not reached.

## Cleanup

On TEST: the inline styles, the `scrollTo` wrappers and the page globals are removed and `--text-scale` is `1`, read back by page scripts. Headless: the scratch worktree is removed (`git worktree remove --force`; `git worktree list` names no diagnose folder), Vite on 8797 is stopped (no listener), and `grep -rln DIAG-4b2e tools/oculus/src tools/oculus/tests` on main prints nothing. Kept for a later probe, in the session scratchpad and nowhere in the repository: the harness and driver scripts (`x3c-harness/`) and the Playwright folder with its browser. `~/.oculus/changes.jsonl` and `workspaces.json` still hash `f3d06124` and `1bf5d57a`, history holds 3.
