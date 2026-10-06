# Review: Q52, the run over repair round 2

Reviewer, claude:opus, read-only, 10:44 to 11:32. Worktree `.agents/worktrees/q52`, base `07f99ee1`. Nothing in the worktree was edited: every revert, probe and browser experiment ran on an rsync copy under the scratch folder (`scratchpad/q52-review3/tree`, node_modules symlinked, its own port 8795). `git status --short` gives the same 20 lines and `git diff --stat 07f99ee1` the same `18 files changed, 607 insertions(+), 131 deletions(-)` as at the start.

## Verification, rerun from the worktree's `tools/oculus`

```
npx vitest run --reporter=dot        Test Files  251 passed (251) / Tests  4287 passed (4287) / Duration 80.42s
npm run check                        1789721318751 COMPLETED 1223 FILES 0 ERRORS 0 WARNINGS 0 FILES_WITH_PROBLEMS
npm run build                        build exit 0, "built in 6.73s"
npm run format:check                 All matched files use Prettier code style!
npm run lint                         no output, exit 0
the ASCII gate (the amendment perl)  printed nothing, exit 0
LC_ALL=C grep -rna '[^ -~]' src tests   printed nothing
python3 yaml.safe_load changes.yml + repositories.yml   both parse
npx playwright test repositories changes   12 passed (47.5s)
git status --short / git diff --stat 07f99ee1   20 lines / 18 files, 607 insertions, 131 deletions
```

All three numbers I was given reproduce: 4287 over 251 files, `COMPLETED 1223 FILES 0 ERRORS`, `12 passed`.

## Spec

1. **This round has no report.** `.scratch/migration/agents/reviews/Q52-report.md` is 161 lines and its last heading is `# Repair round 1 (builder a4d2d5b3b40564ca1, sent 07:20, reported 07:4x)`; `stat -f '%Sm'` gives `Sep 18 07:42:56`. `find ... -newermt "2026-09-18 08:00"` finds no Q52 report anywhere in the hub. So there is nothing on disk for this round: no DONE/NOT DONE table, no revert list, no doc lines, no before-and-after. Everything below is measured from the diff and the running page, not read against a report, and the "does the picker list what the report says" part of my brief cannot be answered as asked.
2. **Axel's picker ruling is built and the two drawings are reader-reachable.** `state/repositories.ts:93` is now `pickerRoots`, `return roots.filter((root) => stateOf(root) !== null)`; `views/Repositories.svelte:69,83-84` feeds it and sets `badge: shapeBadge(repoShape(root, gitFor(root)))` with `badgeTitle: gitFor(root)?.error ?? undefined`. Driven in Chrome on the served app (my own spec in the copy), the picker rows read:
   - hub plus a repository whose folder I then deleted: `[demo | badge="" ] [cathedra | badge="gone" | title="no such directory"] [game-engine | badge="gone" | title="no such directory"] [q52r3-doomed2 | badge="" ]`, and after a real delete of a picked root the panel stays on it and reads `This workspace folder is not there.` with `title="no such directory"`.
   - a root that is a file: the Files view refuses it (the add-root form stays open, the textbox never clears), so it cannot be added that way. Reached through the git channel, `statusFor` gives `present=true repository=false shape=none badge="no repository"` with git's `cannot change to '...': Not a directory` as the badge's hover words.
   - a root the channel names with no state: dropped, since `gitFor` answers null (`selectors.svelte.ts:397`). No server path produces it; `statusFor` writes a state for every root.
   - every root gone: rendered through the real view, the picker is drawn, the first gone root is shown as `data-repo="missing"` with `sessions.ch_nofolder`, and `repositories.empty` is not drawn.
   - no roots at all: no picker, `Nothing is on the channel yet.`
3. **The reader's pick survives all three, in the page.** One case of my own, green: a picked repository whose folder is deleted keeps `data-root` and reads `This workspace folder is not there.`; the same root with `.git` removed keeps `data-root` and reads `This workspace is not a git repository.` with `title="not a git repository (or any of the parent directories): .git"`; re-inited with a corrupt `.git/index` it keeps `data-root` and reads `git could not read this repository: .git/index: index file smaller than expected`.
4. **The rename is clean.** `grep -rn repositoryRoots src tests config bin HELP.md DESIGN.md README.md` gives three hits, all server: `server/roots.ts:39` (the definition, `repositoryRoots(target: RootsTarget)`) and `server/context.ts:36,216`. No server path is in the rename: the diff's server hunks are `server/git.ts` (present/exists) and `server/watch/git.ts` (one comment). `git show 07f99ee1:.../state/repositories.ts` and `:.../server/roots.ts` both declare a `repositoryRoots` at the base, with different signatures in different layers and no import between them (nothing client-side may import `lib/server`), so the two were never one function; the rename ends the shared name.
5. The three new keys and the reworded `empty` are right for what they mark, and `empty` is unreachable in the state it used to describe: it is drawn only for `roots.length === 0`, and a channel carrying only folders now draws the picker and the row's sentence (`tests/views/repositories.test.ts:337`, reproduced in my own render). `tests/keys.test.ts` holds both ways: putting `error:` back into `repositories.yml` reddens `has a reader for every catalog key` with `+ [ "repositories.error" ]`; deleting `pick_missing` reddens `names a catalog key in every literal read`.

## Proof

1. **Every revert reddens its own case.** Each applied to the copy, run, then restored and the file compared byte for byte:

| Revert | Node red | Browser red |
| --- | --- | --- |
| A `ch_insync` whenever `bits` is empty | 3 (changes x2, repositories) | 2 (changes.spec:134, repositories.spec:239) |
| B drop the detached line | 2 (changes, keys gate) | not run |
| C `repoShape` without the `missing` branch | 3 (changes, repositories x2) | 2 (changes.spec:198, repositories.spec:177) |
| D `gone.present = true` | 2 (git.test) | 2 (changes.spec:198, repositories.spec:177) |
| E drop `&& !exists(root)` | 1 (git.test) | not run |
| F `refused.present = true` | 1 (git.test) | not run |
| G the bare `data-repo-failed` | 5 (repositories) | 2 (repositories.spec:177, :298) |
| H `rowLabel` returns the failed sentence always | 3 (repositories) | not run |
| I drop `ENAMETOOLONG` | 1 (git.test) | not run |
| J `repository === true` filter in `pickerRoots` | 5 (state x3, views x2) | 2 (repositories.spec:97, :177) |
| K `shapeBadge` returns `''` | 1 (keys gate only) | 2 (repositories.spec:97, :177) |
| L drop `title` from the row's div | 1 (repositories) | 0 (12 passed) |

   Worth knowing: revert K's only node red is the orphan-key gate, so the badge's words are proven by the browser cases alone, which is the right place for markup a server rendering cannot reach.
2. **`exists()` answers false for `ENAMETOOLONG`, measured.** `lstatSync` on this machine gives `ENAMETOOLONG` for a 4096-character name, for a 300-character name and for a path of 200 components; `ENOTDIR` for a child of a regular file; `EACCES` under a 000 parent; `ok` for a symlink loop (the link itself is read); `ENOENT` for the empty string and for a missing name. Through `statusFor`, only a name too long and a path with nothing at it read `present=false shape=missing badge="gone"`; a regular file, a dangling symlink, a symlink loop, a folder under a 000 parent, a plain folder, a bad `.git/config` and a `.git` file pointing nowhere all read `present=true shape=none` with git's own reason.
3. Nothing in the diff asserts a known defect, and no threshold was loosened: the one gate that could have been widened, `tests/keys.test.ts`, is red in both directions.

## Standards

1. **`src/lib/server/watch/git.ts:202-205` is still false for two path kinds after this round's rewrite.**

   ```
   // A session's workspace that has since been deleted is still a root the payload names. There
   // is nothing to watch: its state is the empty shape statusFor gives a path with nothing at
   // it, `present` false, which the views draw as the folder not being there, read once below,
   // and no error is logged.
   if (!existsSync(root)) {
   ```

   `existsSync` follows the link and returns false on any throw, so it is also false for a dangling symlink and for a folder under a parent nothing may enter; `statusFor` gives both `present=true`, shape `none`. Measured: `dangling symlink existsSync=false lstat=true`, `folder under a 000 parent existsSync=false lstat=EACCES`. The behaviour (not watching either) is unchanged and harmless; the sentence is wrong for the two.
2. **`src/lib/views/Repositories.svelte:21-23` names the wrong element.** It says "each row carries the few words its state comes to (`views/shared/repo-shape.ts`'s shapeBadge) with git's own reason as the row's hover words". The row's `title` is the root path (`Repositories.svelte:81 title: root`); git's reason is `badgeTitle`, on the badge span alone (`ui/Menu.svelte:263,272`). Hovering a row shows the path, not the reason.
3. **Six document lines the change makes false; two are carried, two are carried wrongly, two are not named anywhere.**
   - `DESIGN.md:340` names `views/sessions/repo-shape.ts`, `repoShape(workspace, state)`, "which of five", and "the Repositories view's second copy of that line is Q52". The report on disk carries a whole replacement paragraph for it, and that paragraph is itself now false in three clauses: "`repositoryRoots` offers it the failed and the readable one" (the name is `pickerRoots` and it offers every root), "the Repositories view draws all six" (it draws four; `unplaced` and `reading` are unreachable there), and "Each drawing writes its own name as `data-repo`" (in the Repositories view only the four non-readable drawings do; `grep -rn data-repo src` shows the readable row there writes none).
   - `DESIGN.md:334`: "Repositories picks among the roots of the `git` channel whose state has no error ... (`repositoryRoots`, `repositoryLabels`, `shownRoot`)". The report's proposed correction, "that git reads as repositories", is what Axel's ruling of 08:15 replaced, so the correction on disk is wrong too.
   - `DESIGN.md:319`: "one repository at a time through a picker over the roots that are git repositories (`GitState.repository`, ...)". The report on disk says ":319 needs no edit"; the picker ruling makes that sentence false.
   - `HELP.md:105` (the `changes` row) lists four sentences and not `ch_nofolder`. Carried in the report, correctly.
   - `HELP.md:87`: "One repository at a time, picked at the top from the roots that are git repositories". Not named in the report at all.
   - `HELP.md:141`: "The Repositories view is over every root the file browser serves that git reads as a repository ... plus the workspace of every session, one repository at a time through the picker at its top." Not named in the report at all.
4. Clean: the ASCII gate and `grep -rna '[^ -~]' src tests` print nothing; no added line names a package, a date or an earlier attempt; every changed file is far under the limits (`server/git.ts` 421, `Repo.svelte` 247, `Repositories.svelte` 213, the two new modules 44 and 20); the only added lines over 100 columns are `it(...)` titles, which Prettier does not wrap, not comments; the catalog group `repositories` is declared in one file.

## Behaviour

1. **The picker now lists every session workspace as well as every file-browser root.** `server/watch/git.ts:2,250` publishes the browser's roots then the sessions' workspaces, and the filter that hid the non-repositories is gone, so a session working in a folder that is no repository is now a picker row badged "no repository", and a session whose folder was deleted a row badged "gone". This is the ruling working as asked; it is also the thing to look at on the TEST page, since the row count grows with the session list.
2. **In the browser layer two rows read "gone" out of the box**, because `config/sources.yml:99-100` names `~/workspace/cathedra` and `~/workspace/game-engine` and the layer serves under its own home. On this machine both exist and are repositories (`ls -d ~/workspace/cathedra/.git ~/workspace/game-engine/.git` succeeds), so Axel's own picker will badge neither.
3. **A false word is now on a row that used to be absent.** A repository whose `.git/config` is corrupt, and one whose `.git` file points nowhere, read `repository=false`, so the picker badges them "no repository" with git's own reason as the badge's hover words. The untruth is the base's (`repository` false where a reader would say repository); the ruling makes it visible in the list rather than dropping the row. Not covered by any ruling of this round.
4. **The badge has no tone, and the premise about `--on-c-*` is wrong in the running page.** `Repositories.svelte` passes no `badgeTone`, so `badgeStyle(undefined)` returns undefined (`ui/Menu.svelte:175-179`) and `.item-badge` falls back to `background: var(--badge-bg, var(--chip)); color: var(--badge-fg, var(--accent-txt, var(--accent)))` (`Menu.svelte:530-537`). Measured in Chrome on the served app: `color rgb(173, 85, 51)`, `background rgb(241, 245, 249)`, that is `--accent-txt` on `--chip`, ratio 4.65:1. In the same evaluation `getComputedStyle(document.documentElement).getPropertyValue('--on-c-red')` returns `#ffffff`: the `--on-c-*` family is absent from the built CSS because `themes/derive.ts:208` computes it and `ui/theme.ts` sets it on the document, so it does resolve, and a tone could have been passed. Legibility of the pair the code does use is held across themes by `tests/contrast.test.ts:31`, whose surfaces include `--chip` and whose families include every `-txt`. Under a wallpaper only the popover surface becomes translucent (`Menu.svelte:453` `color-mix(... var(--wall-popover), transparent)` with a backdrop blur); the badge paints an opaque `--chip` over it, so the text keeps its ground. I did not measure with a wallpaper switched on.
5. The reader's pick survives deletion, a folder that stops being a repository, and a failed read, each measured in the page (Spec 3 above). The reverse case, a root that comes back, was not probed this round.

## Not checked

The look on the TEST page (the orchestrator's); the full browser suite; the badge with a wallpaper switched on and under a second theme, measured (reasoned from the CSS and the contrast gate instead); a second full node run for flakiness; `EPERM` from `lstat`; a `safe.directory` refusal; the cost of `exists()`, which no run measured; the browser reverts for B, E, F, H and I (their cases are node cases); "every root gone" in a browser, which would mean removing the served hub; and this round's own report, which does not exist on disk.

Reviewer usage: about 50 tool calls, 10:44 to 11:32.

