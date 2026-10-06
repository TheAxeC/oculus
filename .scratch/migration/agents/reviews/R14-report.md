# R14 report

NOT DONE, two halves of the brief, both blocked on the same clash: item 5's "fix any that do not, in the test files themselves" and item 7's "existing cases that lack one get the comment". Both need edits in dozens of test files outside decision 4's path list ("You edit no ... other test: Q48 is running beside this step"). Item 5's leak spans 61 directory prefixes across tests/server, tests/routes, tests/data, tests/state, tests/watch, tests/views and tests/browser; item 7's is 495 assertions in 77 files, several of them the files Q48 is in. I fixed the part inside my paths (the three scratch directories of `tests/boundaries.test.ts`) and recorded the rest as a floor the checks hold the tree to. The clash is for the orchestrator to rule: widen R14's paths, or book a step of its own for each.

## What the earlier builder already covered

`bin/revert-check.mjs` and `bin/cited-lines.mjs` were both there and both meet their items (1 and 4); I kept them. What I added to them: `bin/revert-check.mjs` read a case name only from the same line as `it(`, so a case written with its name on the line below (`tests/bin/claude-usage.test.ts:22` is the tree's shape) was reported as `no case`; `caseName` at `bin/revert-check.mjs:50` now reads the opening line and then the line under it, and `caseAbove` and `caseNames` go through it. Nothing else in either script changed. Neither had a test; both now have one.

## DONE / NOT DONE

| # | Item | State | Command and output |
| --- | --- | --- | --- |
| 1 | revert check `bin/revert-check.mjs` | DONE | `node bin/revert-check.mjs tests/duplication.test.ts tests/audits.test.ts tests/negatives.test.ts tests/boundaries.test.ts tests/bin/revert-check.test.ts tests/bin/cited-lines.test.ts` prints `30 reverts, 0 unproven`, every line `red`, plus 3 `unchecked` |
| 2 | head-comment print | DONE | `git status --porcelain -- . \| awk '{ print $2 }' \| sed 's#^tools/oculus/##' \| xargs -I{} sh -c 'echo "--- {}"; sed -n "1,14p" {}'` printed 14 files; each head comment holds |
| 3 | `tests/duplication.test.ts` | DONE | `npx vitest run tests/duplication.test.ts`, 8 passed |
| 4 | citation check `bin/cited-lines.mjs` | DONE | `node bin/cited-lines.mjs <file of this report's citations>` printed `18 cited lines, 0 missing` |
| 5 | scratch-directory count | Command DONE, tree RED | see below |
| 6 | size check | DONE | exits 0 with `bin/size-allow.txt`, exits 1 printing 12 files with `-v allow=/dev/null` |
| 7 | `tests/negatives.test.ts` | Check DONE, comments NOT DONE | `npx vitest run tests/negatives.test.ts`, 5 passed |
| 8 | primitive-styling case | DONE | `npx vitest run tests/boundaries.test.ts`, 9 passed |
| 9 | `tests/audits.test.ts` | DONE | `npx vitest run tests/audits.test.ts`, 4 passed |
| 10 | config-diff print | DONE | `git diff --unified=0 ee7ab653 -- config \| grep -E '^\+[^+]'` printed nothing (grep exit 1); this step adds no config key |
| 11 | look rule in `agents/spec.md` | DONE | the sentence is `.scratch/migration/agents/spec.md:54`, verbatim |

Verification list: `npx vitest run --reporter=dot` 256 files, 4274 tests passed; `npm run check` `COMPLETED 1231 FILES 0 ERRORS 0 WARNINGS`; `npm run build` `built in 7.34s`; `npm run format:check` `All matched files use Prettier code style!`; `npm run lint` no output; the ASCII gate printed nothing. `npx playwright test` 241 passed (6.1m).

## What each check reports on the tree today

- **Revert check**: over this step's six test files, 30 directives, all 30 red. 3 cases unchecked, all in `tests/boundaries.test.ts` and all pre-existing and untouched: `holds across src/lib`, `holds no process-wide state under src`, `keeps every shell file to the stores its row names`.
- **Duplication**: 752 windows, 578 distinct file pairs. Under `src/lib` 117 windows over 85 pairs; under `tests` 635 windows over 493 pairs. The pass's own examples are among them (`src/lib/data/sources/collections.ts` against `registries.ts` and `feeds.ts`, `src/lib/server/calendar/poll.ts` against `mail/poll.ts`, `views/collection/EntryCard.svelte` against `views/shared/ProjectCard.svelte`).
- **Negatives**: 516 absence assertions under `tests/views` and `tests/browser`, 495 of them with no comment above, in 77 files. Worst: `tests/views/collection.test.ts` 29, `tests/browser/files-forms.spec.ts` 26, `tests/browser/files.spec.ts` 26, `tests/views/projects.test.ts` 24.
- **Primitive styling**: 28 rules, in 17 view or shell components, reaching into 8 primitives. `.tool` of `ui/ToolButton.svelte` 7 times, `.card` of `ui/Card.svelte` 4, then `.title`, `.bar`, `.label`, `.glyph`, `.tip`, `.tag`, `.text`, `.area`, `.search`, `.opener`. The pass's `views/shared/CardActions.svelte:202 [data-action-more] :global(.opener)` is one of them.
- **Audits**: 150 cases under `tests/views` never reach a render and are not named `audits ...`. Whole files of them: `tests/views/card-layout.test.ts` 15, `tests/views/card.test.ts` 6, `tests/views/config.test.ts` 5.
- **Size**: 12 files over the line, not the seven the brief names. The five the brief does not list are `src/lib/server/audit.ts` 940, `tests/views/collection.test.ts` 928, `tests/shell/rail.test.ts` 906, `src/lib/ui/Menu.svelte` 557, `src/lib/views/focus/Lanes.svelte` 547.
- **Scratch count**: RED. `before 631026 after 633552`, a growth of 2526 directories over one node run plus one browser run. A separate marked node-only run left 843 directories over 61 prefixes (`oculus-route-` 77, `oculus-open-` 47, `oculus-docs-` 46, `oculus-open-outside-` 41, `oculus-writes-` 40 at the head of the list). `$TMPDIR` already holds 631026 of them.
- **Head comments and config diff**: nothing to report; this step touches no `src/` or `config/` file.

## The allow lists

Three of the four are a floor, not a list of deliberate shares, and each says so in its own head comment. Every one of them also has a case that fails when an entry no longer matches anything, so an entry cannot outlive what it covers.

- `tests/allow-styling.ts`: `DELIBERATE` empty, `HELD` 28 entries, each carrying the selector it stands for (`'src/lib/shell/Palette.svelte:262 reads .result :global(.tool)'`). I read all 28 selectors: every one is a consumer reaching into a primitive's markup, which is the cause itself. None is deliberate, so none is in `DELIBERATE`.
- `tests/allow-duplication.ts`: `DELIBERATE` empty, `HELD` 578 pairs, generated from the tree.
- `tests/allow-audits.ts`: 150 case names.
- `tests/allow-negatives.ts`: 77 files with a count each, a ceiling; a file may hold no more than its number, so every absence written from now on carries its comment.

## The reverts run

All 30 red, one per new or changed case. `tests/duplication.test.ts` 8, `tests/audits.test.ts` 4, `tests/negatives.test.ts` 5, `tests/boundaries.test.ts` 6 (the three new cases and the three whose bodies I changed), `tests/bin/revert-check.test.ts` 3, `tests/bin/cited-lines.test.ts` 4.

## Files changed

New: `bin/size-allow.txt` 15, `tests/duplication.test.ts` 285, `tests/negatives.test.ts` 148, `tests/audits.test.ts` 192, `tests/allow-duplication.ts` 606, `tests/allow-audits.ts` 161, `tests/allow-styling.ts` 126, `tests/allow-negatives.ts` 86, `tests/bin/revert-check.test.ts` 134, `tests/bin/cited-lines.test.ts` 80. Changed: `bin/revert-check.mjs` 240 (was 214), `tests/boundaries.test.ts` 536 (+138 -8), `.scratch/migration/agents/spec.md` +1.

## The five commands for the verification list

```
git diff --name-only <base> --diff-filter=d -- src config tests bin | xargs -I{} sh -c 'echo "--- {}"; sed -n "1,14p" {}'
node bin/cited-lines.mjs <report>
before=$(find "${TMPDIR:-/tmp}" -maxdepth 1 -name 'oculus-*' | wc -l); npm test >/dev/null 2>&1; npx playwright test >/dev/null 2>&1; after=$(find "${TMPDIR:-/tmp}" -maxdepth 1 -name 'oculus-*' | wc -l); test "$before" = "$after"
find src tests bin -type f \( -name '*.ts' -o -name '*.svelte' \) | xargs wc -l | awk -v allow=bin/size-allow.txt 'BEGIN { while ((getline line < allow) > 0) if (line !~ /^#/ && line != "") skip[line] } $2 != "total" && !($2 in skip) && ($1 > 900 || ($2 ~ /\.svelte$/ && $1 > 540)) { print; bad = 1 } END { exit bad }'
git diff --unified=0 <base> -- config | grep -E '^\+[^+]'
```

Two of them differ from the wording the pass proposed, for a measured reason:

- The count command. `ls -d "${TMPDIR:-/tmp}"/oculus-* | wc -l` reads **0** in a temporary directory holding 631026 matching entries: the glob overflows the argument list, the error goes to the suppressed stderr, and the comparison then passes on two zeroes. It is a false all-clear, so the command uses `find -maxdepth 1 -name`. Each count takes about a minute at this size.
- The head-comment print. `-- src config` reaches no test and no script, so a step that changes only tests prints nothing; the path list is `src config tests bin`, and `--diff-filter=d` keeps a deleted file from failing `sed`.

`grep` exits 1 when a diff holds no config line, so the config-diff line is read for its output, not its exit code.

## Decisions the orchestrator may reverse

1. **`tests/bin/` holds the two script tests.** Decision 4's path list does not name it, and Tests item 2 needs a home for the fixture proof; `tests/bin/` is where the tree already tests a `bin/` script (`tests/bin/migrate-joint-work.test.ts`, `tests/bin/claude-usage.test.ts`).
2. **The duplication scan drops import statements and a component's `<style>` block** on top of the comments and blank lines the brief names. Neither can hide a rule, a parser or a fold; keeping them costs 82 more pairs under `src/lib` (214 windows instead of 132), nearly all of them a repeated CSS block or a shared import list.
3. **The three grandfather lists** (items 3, 7, 9) instead of 578 judged reasons, 495 comments and 150 renames. Reversing this is the same work as the two NOT DONE halves.
4. **The negatives check is a per-file ceiling**, not a per-assertion allow list: line numbers move under every edit, a file name does not.
5. **The audits check counts a case as coverage when it reads a name the file binds to a render**, including the variable a `beforeEach` fills. The literal rule (the case body calls `render(` or the file's render helper) flags 292 cases, over half of which assert on a `body` a `beforeEach` rendered; that is coverage, and calling it an audit would be a false alarm, not a stricter rule.
6. **`bin/size-allow.txt` is a plain list beside the command** rather than a constant inside it, so the command stays one line and the list carries its own head comment.

## Limitations and sharp edges

- The revert check costs one tree copy and one vitest start per directive: the 30 of this step took about four minutes. A browser directive costs a build plus a playwright start, and none of this step's directives is one, so that path is written but not exercised.
- `copyTree` skips `.scratch`, so a revert naming a file under the plan's folder cannot be applied.
- The duplication check is O(files squared) in the worst case but runs in about 0.3 s over the tree; it reads text, so it cannot see a rule copied and then renamed.
- The audits and duplication checks read source text, not an AST. A case whose body contains a helper's name in a string would count as coverage.
- The primitive-styling check compares class names, not elements: a view whose own class happens to share a primitive's name is flagged. All 28 present entries were read and none is that case, but a future one could be, and the answer then is a `DELIBERATE` entry with its reason.
- The three orphan cases (one per list) turn red when a step repairs a duplication, renames a case or removes a `:global` rule without editing the list. That is the ratchet working, and it is a line to delete, but it does land in a step that did not expect it.
- `npx playwright test` inside the count command serves on port 8792 and takes 6.1 minutes, so the whole count line is about 8 minutes.


## The widened paths: both halves finished

Everything in the brief and in the ruling is done: both halves are finished, and the count command now reads equal around a full node run and a full browser run. Nothing is left open. Two things to know before the numbers: `tests/server/git.test.ts :: carries the newest commits, newest first, capped at the constant` failed once, at 01:05, in a full run that was competing with a prettier pass, and passed alone and in the three full runs since, so I report it as a flake I saw once and did not reproduce; and every write of this step went to the r14 worktree, although the harness moved my working directory to the q48 worktree mid-way.

## Widened paths, item 5: the scratch directories

Every temporary directory a test makes now comes from one helper, and every suite that reaches it registers the sweep with its own runner.

- `tests/scratch.ts` (new, 36 lines): `scratchDir(prefix)` at `tests/scratch.ts:19` makes the directory, checks it is inside the system temporary directory and records it; `sweepScratch()` at `tests/scratch.ts:30` removes what was recorded. The helper registers no hook of its own, because a vitest `afterAll` at its module scope breaks the browser layer: playwright has no such hook and every spec importing the helper dies in `afterAll`.
- **88 call sites in 70 tracked files** were converted from `mkdtempSync(join(tmpdir(), ...))` to `scratchDir(...)`, by folder: `tests/server` 37, `tests/routes` 23, `tests/data` 10, `tests/browser` 9, `tests/` 5, `tests/bin` 2, `tests/watch` 1, `tests/ui` 1. With the six sites in this step's own new files that is 94 in the tree. The 61 prefixes the earlier count named are all in it, the head of the list being `oculus-route-` (2 sites in `tests/routes/write-fixture.ts`), `oculus-open-*` (6 in `tests/routes/open-fixture.ts` and `tests/routes/open.test.ts`), `oculus-docs-*` (5 in `tests/routes/docs.test.ts`, plus `tests/data/docs.test.ts` and `tests/server/doc-findings.test.ts`), `oculus-fs-`/`oculus-notes-`/`oculus-bookmarks-`/`oculus-workspaces-`/`oculus-notes-out-` (6 in `tests/server/fs.test.ts`), `oculus-writes-`, `oculus-audit-`, `oculus-git-`, `oculus-config-`, `oculus-sessions-`, `oculus-hub-` and `oculus-engine-` (both in `tests/watch/portfolio.test.ts`), one prefix per remaining file. `tests/routes/terminal.test.ts:59` is in it too, which was making its directory under `resolve(tmpdir())` by another name.
- **82 suites register the sweep**: a vitest file carries `afterAll(sweepScratch);` under its imports, a browser spec carries `test.afterAll(sweepScratch);`. `tests/browser/files.ts:13` registers one for every spec that takes a file-browser fixture from it, which is how `files-forms.spec.ts` is covered without being touched.
- `tests/scratch.test.ts` (new, 132 lines) holds the guard, which is what keeps this from coming back in a second rather than in the ten minutes the count takes: no file under `tests/` calls `mkdtempSync` except the helper and `tests/browser/serve.ts` (the browser layer's own server process, which removes its copy through `removeOnExit`), and every suite that reaches the helper, directly or through a fixture, registers a sweep (`findUnswept` at `tests/scratch.test.ts:56` walks the local import graph).
- **The proof**: `before=$(find "${TMPDIR:-/tmp}" -maxdepth 1 -type d -name 'oculus-*' | wc -l); npm test; npx playwright test; after=$(...); test "$before" = "$after"` printed `node exit 0`, `browser exit 0`, `before 647280 after 647280`, `equal exit 0`, in 473 seconds. The node suite was 4279 tests passed, the browser suite 241 passed.
- I deleted none of the machine's existing leftovers. The count stands at 647280 directories and only stops growing from here.

## Widened paths, item 7: the absence assertions

**447 comments written, in 75 files**, one above every `.not.toContain(`, `.not.toHaveAttribute(`, `.not.toBeVisible(` and `toHaveCount(0)` under `tests/views` and `tests/browser` outside the four files left to Q48. Each says what makes the absence right, in the terms of that case's own fixture: `tests/views/collection.test.ts:579` reads `// the entry carries no subtasks, so neither the block nor its heading is drawn`.

Per file, largest first: collection.test.ts 29, browser/files.spec.ts 26, projects.test.ts 24, files.test.ts 20, repositories.test.ts 18, focus.test.ts 16, source.test.ts 16, browser/source.spec.ts 14, inbox.test.ts 12, leads.test.ts 12, map.test.ts 12, project.test.ts 12, venues.test.ts 11, memories.test.ts 10, sessions.test.ts 10, hpc.test.ts 10, browser/show-in-files.spec.ts 10, card-docs.test.ts 9, browser/open-file.spec.ts 8, cardlinks.test.ts 7, browser/nested.spec.ts 7, browser/repositories.spec.ts 7, config.test.ts 6, data.test.ts 6, file.test.ts 6, note.test.ts 6, pillars.test.ts 6, present.test.ts 6, radar.test.ts 6, history.test.ts 5, linkedin.test.ts 5, browser/changes.spec.ts 5, browser/keyboard.spec.ts 5, browser/tasks.spec.ts 5, person.test.ts 4, registry.test.ts 4, browser/focus-buttons.spec.ts 4, browser/shell-defects.spec.ts 4, audit/calendar/changes/domains/editor/search .test.ts and browser/icons, browser/memories, browser/tabs 3 each, doc/sanitise/usage .test.ts and browser/board, browser/collection, browser/focus-look, browser/layout, browser/leads, browser/pages, browser/sanitise, browser/views 2 each, and one each in crosslinks, deposit, document, slides, source-button, status and in browser/appearance, calendar, cards, focus-drag, funding, inbox, latex, map, present, system, venues-themes.

`tests/allow-negatives.ts` now holds two entries and nothing else: `browser/files-forms.spec.ts: 26` and `browser/unsaved-forms.spec.ts: 22`. The other two files of the ruling, `tests/state/explorer.test.ts` and `tests/state/form-drafts.test.ts`, are outside `tests/views` and `tests/browser`, so the check never scans them; an entry for either would fail the list's own orphan case, which is why they are not in the file.

**The four files left to Q48**: `tests/browser/files-forms.spec.ts`, `tests/browser/unsaved-forms.spec.ts`, `tests/state/explorer.test.ts`, `tests/state/form-drafts.test.ts`. None of them was edited. None of them makes a temporary directory of its own either, so item 5 has no share waiting on them: `files-forms.spec.ts` takes its roots from `tests/browser/files.ts`, which now sweeps for it. What waits on Q48 is item 7's 48 absences, the two counts in `allow-negatives.ts`.

## What I found that was not right rather than uncommented

I read all 447 sites. One absence is a trade-off rather than a fact about a fixture, and it is asserted in two places: `tests/browser/files.spec.ts:212` and `tests/views/file.test.ts:71` both assert the PDF frame carries no `sandbox` attribute. The reason I wrote is the true one, that Chrome's own PDF viewer does not draw inside a sandboxed frame and the bytes come from the page's own origin through the file route, but it is a security-relevant absence, not a drawing rule, and it is worth the orchestrator's eye.

The three cases the recurring pass named as encoding a defect are no longer in the tree in that shape, and I confirmed each: `tests/views/venues.test.ts:336` now asserts `target="_blank"` positively; `tests/views/memories.test.ts:257` asserts the failed read is said in place of the empty wall, which is the repaired behaviour; `tests/browser/repositories.spec.ts:154` asserts a folder git reads as no repository is kept out of the picker, which is the opposite of the pinned defect. `tests/views/project.test.ts`'s `not.toContain('>TEX</span>')` already carried its reason and I left it as it stands; the reviewer's question there is about where an absent document belongs, not about the comment.

## The reverts run

`node bin/revert-check.mjs tests/duplication.test.ts tests/audits.test.ts tests/negatives.test.ts tests/boundaries.test.ts tests/scratch.test.ts tests/bin/revert-check.test.ts tests/bin/cited-lines.test.ts` prints `35 reverts, 0 unproven`, every line `red`, and three `unchecked` lines for the three pre-existing `tests/boundaries.test.ts` cases this step did not change. The two new cases of `tests/scratch.test.ts` carry theirs.

## The verify list on the final tree

| Command | Output | Runtime |
| --- | --- | --- |
| `npm test` | `Test Files 257 passed`, `Tests 4279 passed` | 64s |
| `npx playwright test` | `241 passed` | 6.6m |
| `npm run check` | `COMPLETED 1233 FILES 0 ERRORS 0 WARNINGS 0 FILES_WITH_PROBLEMS` | 16s |
| `npm run build` | `built in 5.79s` | 12s |
| `npm run format:check` | `All matched files use Prettier code style!` | 9s |
| `npm run lint` | no output | 96s |
| the ASCII gate | prints nothing, exit 0 | 1s |

## The five commands

| # | Command | Output | Runtime |
| --- | --- | --- | --- |
| 2 | `git status --porcelain -- . \| awk '{ print $2 }' \| sed 's#^tools/oculus/##' \| xargs -I{} sh -c 'echo "--- {}"; sed -n "1,14p" {}'` | 164 files printed; every head comment holds, and the three this step made false (`tests/scratch.ts`, `tests/negatives.test.ts`, `tests/scratch.test.ts`) were rewritten with it | 9s |
| 4 | `node bin/cited-lines.mjs <this report's citations>` | `14 cited lines, 0 missing` | under 1s |
| 5 | the count around both suites | `before 647280 after 647280`, `equal exit 0` | 473s |
| 6 | `find src tests bin -type f \( -name '*.ts' -o -name '*.svelte' \) \| xargs wc -l \| awk -v allow=bin/size-allow.txt '...'` | no output, exit 0; with `-v allow=/dev/null` it prints the twelve and exits 1 | under 1s |
| 10 | `git diff --unified=0 ee7ab653 -- config \| grep -E '^\+[^+]'` | nothing, grep exit 1: this step adds no config key | under 1s |

## Line counts

New: `tests/scratch.ts` 36, `tests/scratch.test.ts` 132, `tests/duplication.test.ts` 288, `tests/audits.test.ts` 195, `tests/negatives.test.ts` 151, `tests/allow-duplication.ts` 606, `tests/allow-audits.ts` 161, `tests/allow-styling.ts` 126, `tests/allow-negatives.ts` 11, `tests/bin/revert-check.test.ts` 137, `tests/bin/cited-lines.test.ts` 83, `bin/revert-check.mjs` 240, `bin/cited-lines.mjs` 109, `bin/size-allow.txt` 15. Changed: `tests/boundaries.test.ts` 539, `.scratch/migration/agents/spec.md` +1, and 150 tracked files in all, `153 files changed, 1076 insertions(+), 306 deletions(-)` against ee7ab653.

The size check stays green, and three files on its allow list grew inside it: `tests/views/collection.test.ts` 928 to 957, `tests/routes/terminal.test.ts` 968 to 970, `tests/shell/rail.test.ts` unchanged at 906. Membership of `bin/size-allow.txt` is binary, so growth inside the list is not caught; the check only refuses a file that is not on it.

## Decisions the orchestrator may reverse

1. **`tests/scratch.ts` and `tests/scratch.test.ts` are new files no brief named.** They are the mechanism item 5 needs and the guard that keeps it, and the alternative was the same cleanup written out in 70 files, which the duplication check would then have flagged.
2. **The sweep is registered per suite, not inside the helper.** One line per suite, and it is the only shape that serves both runners.
3. **`tests/browser/files.ts` registers for its three consumers.** It is what covers a file this step may not touch.
4. **`tests/bin/` holds the two script tests**, as the tree already does for its other `bin/` scripts.
5. **The duplication scan drops import statements and a component's style block**, neither of which can hide a rule; keeping them costs 82 more pairs under `src/lib`.
6. **The three floors stay** (`allow-duplication.ts` 578 pairs, `allow-audits.ts` 150 cases, `allow-styling.ts` 28 rules), each with its orphan case, as the ruling says.

## Limitations and sharp edges

- The count command counts directories. `oculus-browser.lock`, a file the browser layer's server takes and releases, is outside it by design; I did not touch the lock.
- The revert check costs one tree copy and one vitest start per directive: the 35 of this step took about four minutes. A browser directive would cost a build and a playwright start; none of this step's is one, so that path is written and not exercised.
- `findUnswept` follows relative imports only. A suite that reached the helper through a package alias would not be seen; the tree has no such import today.
- The negatives check reads the line above an assertion. A reason written on the same line, or two lines up, does not count, so the comment has to sit directly above.
- `npm run lint` takes 96 seconds on this tree, most of it the browser specs.

---

# Repair round 1 (builder a7dc75ae4e37c3339, sent 02:34, reported 04:19)

All eleven rulings done. `tests/server/git.test.ts` and three of the step's own fixture cases were timing out under the load of a second worktree's suite; each was given a budget of its own rather than a loosened assertion.

| # | Ruling | State | Command and output |
| --- | --- | --- | --- |
| 1 | the head-comment command is the one that was run | DONE | `git diff --name-only bbae5dd9 --diff-filter=d --relative -- src config tests bin | xargs -I{} sh -c 'echo "--- {}"; sed -n "1,14p" {}'`: 149 files, 0 `No such file`, 5s; the 17 untracked files printed by the same command fed from `git status --porcelain` |
| 2 | the revert check never calls a revert proven when the case did not run | DONE | `node bin/revert-check.mjs <8 files>`: `53 reverts, 0 unproven`, every line red, 428s; `npx vitest run tests/bin/revert-check.test.ts`: 7 passed |
| 3 | the citation check flags a blank line, and the report's citation is right | DONE | `node bin/cited-lines.mjs <citations>`: `19 cited lines, 0 missing`, exit 0. The miss was `views/shared/CardActions.svelte:202`, which is `src/lib/views/shared/CardActions.svelte:202` |
| 4 | the scratch count measures the run, not the machine | DONE | `sh bin/scratch-count.sh`: `node before 0 / node after 0 / browser before 0 / browser after 0`, exit 0, 626s for both suites |
| 5 | the size list is a ratchet | DONE | `sh bin/size-check.sh` exit 0; `npx vitest run tests/size.test.ts`: 6 passed |
| 6 | an allow entry says why, and styling keys on the selector | DONE | `npx vitest run tests/duplication.test.ts tests/audits.test.ts tests/boundaries.test.ts`: 9, 6 and 10 passed |
| 7 | the scratch guard sees every way a directory is taken | DONE | `npx vitest run tests/scratch.test.ts`: 7 passed |
| 8 | `explains()` refuses a restatement | DONE | `npx vitest run tests/negatives.test.ts`: 6 passed |
| 9 | the audits check walks `tests/views` recursively | DONE | a planted case in `under/planted.test.ts`, 6 passed |
| 10 | `agents/spec.md` left exactly as it is | DONE | `git diff --stat bbae5dd9 -- .scratch/migration/agents/spec.md`: `1 file changed, 1 insertion(+)`, untouched this round |
| 11 | every timing measured in the run quoted | DONE | the table below |

## What each check now refuses that it accepted before

- A case name holding a metacharacter: `bin/revert-check.mjs:157` escapes and anchors the name, `:203` reads the verdict from the runner's JSON report and matches the title exactly. Fixture: `calls a case whose name holds a bracket by that name, and not by it as a pattern` prints `GREEN` and `1 reverts, 1 unproven`, exit 1.
- A build that refuses the revert, and a replacement that leaves the file unparsable: both `unproven` with the reason in the line, never red, both counted.
- A directive naming a path the copy leaves behind: `bin/revert-check.mjs:257` names it, counts it unproven and goes on; `checkOne` is wrapped so an unexpected error becomes a line rather than a stack trace that abandons the rest. Fixture: the second directive still prints red.
- A citation landing on a blank line is `MISSING` (`bin/cited-lines.mjs:86`).
- Another worktree's run can no longer turn the scratch count red, and a leak of the run's own can no longer hide among the leftovers: `bin/scratch-count.sh:17` makes a fresh root per suite and points `TMPDIR` at it. The roots are made under `/tmp` because the terminal suite opens a tmux socket inside `TMPDIR` and a unix socket path is capped near 104 characters.
- A listed file that grows: `bin/size-allow.txt` carries a count per entry (`tests/views/collection.test.ts 957`), and `bin/size-check.sh` fails when a listed file passes its count, falls back under the line, carries no count, or names a file the tree has not.
- An allow entry with no reason: `tests/allow-duplication.txt` and `tests/allow-audits.txt` carry one per line. `tests/allow-styling.ts` is keyed on the selector, so a second unrelated `:global` rule for the same class in a listed file is a new violation; the list went from 28 to 35 entries.
- A directory taken any other way: the guard covers every file under `tests/`, reads dynamic and double-quoted imports, and fails a `scratchDir` call at module scope whose registration comes after it. `tests/data/real-hub.probe.ts` now sweeps itself through `process.on('exit', sweepScratch)`.
- A comment that restates the assertion: `explains` at `tests/negatives.test.ts:48` refuses a comment holding a literal the assertion names (eight characters or more) and one under four words. Eight comments failed and are rewritten.
- A folder under `tests/views`: `findAudits` at `tests/audits.test.ts:121` recurses.

## The findings the round raised for the orchestrator

- `tests/views/project.test.ts:219`, `expect(body).not.toContain('>TEX</span>')`: the comment is true of the tree, and the stricter rule passes it. What is wrong is the assertion, which pins as expected behaviour a difference nobody ruled: the card draws a known document the project does not have as a plain `Tag` (`src/lib/views/shared/CardDocs.svelte:79`), the project tab draws nothing for it.
- The 88 converted call sites carry no revert directive. The change in those 70 files is import bookkeeping and the `mkdtempSync` call it replaced; `tests/scratch.test.ts` is what makes the conversion load-bearing and it carries its own directives.
- Two flakes not fixed, both under the load of a second worktree's suite, both green alone and on the final run: `tests/server/hpc/ssh.test.ts :: rejects a command that ignores SIGTERM at the budget...` and `tests/server/watch/git.test.ts :: reads a root added to the workspaces file while it is running` (a watcher race, not a budget).
- `tests/server/git.test.ts :: carries the newest commits...` now has `{ timeout: 60000 }` with a comment naming why. It carries no revert directive: the revert of a budget is red only under load.

## The reverts run

`node bin/revert-check.mjs tests/duplication.test.ts tests/audits.test.ts tests/negatives.test.ts tests/boundaries.test.ts tests/scratch.test.ts tests/size.test.ts tests/bin/revert-check.test.ts tests/bin/cited-lines.test.ts tests/server/git.test.ts` prints `53 reverts, 0 unproven`, every line red, 428s. Unchecked: the three pre-existing `tests/boundaries.test.ts` cases the step never changed, and the 37 cases of `tests/server/git.test.ts`.

## The verify list, each timed in the run quoted

| Command | Output | Runtime |
| --- | --- | --- |
| `npx vitest run --reporter=dot` | `Test Files 258 passed`, `Tests 4297 passed` (two other worktrees running) | 139s |
| the same, on a quiet machine | `258 passed`, `4297 passed` | 115s |
| `npx playwright test` | inside `bin/scratch-count.sh`, which reports a red suite and reported none | in the 626s |
| `npm run check` | `COMPLETED 1232 FILES 0 ERRORS 0 WARNINGS` | 16s |
| `npm run build` | exit 0 | 16s |
| `npm run format:check` | `All matched files use Prettier code style!` | 19s |
| `npm run lint` | no output | 76s |
| the ASCII gate | nothing, exit 0 | 0s |

## Files changed

New this round: `bin/size-check.sh` 52, `bin/scratch-count.sh` 37, `tests/size.test.ts` 150, `tests/allow-duplication.txt` 587, `tests/allow-audits.txt` 160. Removed: `tests/allow-duplication.ts` and `tests/allow-audits.ts`, whose entries with their reasons would have made a 2904-line source file.

Changed this round: `bin/revert-check.mjs` 319, `bin/cited-lines.mjs` 116, `bin/size-allow.txt` 15, `tests/scratch.test.ts` 265, `tests/duplication.test.ts` 320, `tests/audits.test.ts` 248, `tests/negatives.test.ts` 206, `tests/boundaries.test.ts` 561, `tests/allow-styling.ts` 155, `tests/bin/revert-check.test.ts` 274, `tests/bin/cited-lines.test.ts` 92, `tests/data/real-hub.probe.ts` 130, `tests/server/git.test.ts` 616, and eight comments under `tests/views/`.

The step's whole diff against bbae5dd9: 150 files changed, 1076 insertions, 292 deletions, plus 17 untracked files.

## Decisions the orchestrator may reverse

1. The two long floors are text files read by their tests; as TypeScript with a reason per entry they are 2904 and 600 lines, and the first breaks the size rule the same step enforces.
2. A literal counts as a restatement at eight characters; below that the rule refuses comments holding ordinary words that happen to be the asserted string.
3. `bin/size-check.sh` and `bin/scratch-count.sh` are scripts rather than one-liners in the verification list, so the line in the ledger is the line that runs.
4. The flaky git case got a budget, not a loosened assertion, with a comment naming why.

---

# Repair round 2 (builder a7dc75ae4e37c3339, sent 05:25, reported 06:10)

Every ruling is done. One the builder could not do: `agents/reviews/R14-report.md` lives under `.scratch/`, which `agents/spec.md:33` forbids a worker to write, so the two wrong citations of the round-1 report are corrected here rather than there.

| # | Ruling | Command and output | The probe that now fails |
| --- | --- | --- | --- |
| 1 | a skipped case, one another excludes, and a shared title are unproven | `npx vitest run tests/bin/revert-check.test.ts`: 12 passed | `it.skip` and an `.only` sibling each print `unproven ... [the case was skipped]`; two cases of one name print `[the file holds 2 cases of that name]`; `2 reverts, 2 unproven`, no `red` line |
| 2 | a revert that changes nothing is unproven | the same run | a directive naming a comment line prints `where the line it names is blank or a comment`; `return size > 2;` written over itself prints `where the replacement is the line it replaces` |
| 3 | the scratch guard reads code, not prose | `npx vitest run tests/scratch.test.ts`: 8 passed; over a copy with the review's two plants, `findUnswept` returns both | both of the review's plants, which passed before |
| 4 | the literals of a line holding two strings | `npx vitest run tests/negatives.test.ts`: 7 passed | `literalsIn` over a line with two quoted strings returns the literal, and the comment restating it is refused |
| 5 | one walk under `tests/views` | `npx vitest run tests/audits.test.ts`: 6 passed | the orphan case and `findAudits` both read `everyCase`, which recurses |
| 6 | every source file is measured | `sh bin/size-check.sh` exit 0; a planted `bin/planted-big.mjs` of 2000 lines prints `over the line and not on the list`, exit 1 | the review's 2000-line `.mjs` |
| 7 | a red suite is a red command | over a probe tree whose `test` script is `exit 1`: prints both red lines, exit 1 | the review's probe, which exited 0 |
| 8 | four citation misses | `npx vitest run tests/bin/cited-lines.test.ts`: 7 passed; over a four-line file, each of `1-9999`, `4-1`, `-5` and a punctuation-only line prints `MISSING` with its reason | all four |
| 9 | a target that escapes the copy | the revert-check test | a directive naming `../escape-target-*.txt` prints `which is outside the tree`, the outside file is byte-for-byte unchanged, nothing is written outside the copy |
| 10 | a directive above a case opens that case | the revert-check test | the directive above `it('the case the directive opens'` names that case and prints `red`; `the case above` is `unchecked` |
| 11 | unchecked counts | `node bin/revert-check.mjs <8 files>`: `65 reverts, 0 unproven, 0 unchecked`, exit 0, 301s | a fixture of three undirected cases prints `0 reverts, 0 unproven, 3 unchecked`, exit 1 |
| 12 | a reason is a reason | the duplication, audits and boundaries runs | `x` is refused by all three; the three share `isReason` in `tests/reason.ts:34` |
| 13 | the two lists keep their own keys | duplication 9 passed, negatives 7 passed | a second clone between two listed files is one finding; one explained absence buys no room |

## What each check now refuses

- **`bin/revert-check.mjs`** reads one verdict for one case (`:259`): no case of that title, two of that title, or a skipped one is `unproven` with the reason. A revert that changes nothing is refused before the copy is run (`:152`); a target outside the tree or the copy is refused and named (`:184`); a directive on the line above a case belongs to that case (`:114`); `unchecked` is counted and decides the exit status (`:397`).
- **`bin/cited-lines.mjs`** refuses a range that runs backwards or spans 200 lines or more (`:51`), a number below one, which the pattern now admits so it can be refused by name (`:28`), and a line holding nothing or nothing but punctuation (`:82`).
- **The scratch guard** blanks comments and string literals before looking for a registration or a call (`tests/scratch.test.ts:70`), and the helper never counts as a file's registration (`:142`). Over the tree it now finds **zero** unregistered suites: the 82 registrations of round one are all real, and the guard is what says so.
- **`tests/reason.ts:34`** is the one rule three checks ask: four words at least, and none of the literals its subject names (`:13`). What it still cannot tell is a sentence that reads as a reason and says nothing about the fixture; both head comments say so.
- **The duplication floor** is keyed on the clone (`tests/duplication.test.ts:38`, `:127`), so two listed files cannot grow a second copy under the first one's entry; the allow list is read after the run suppression.
- **The negatives floor** is keyed on the literals of each absence (`tests/negatives.test.ts:54`): 26 entries for `browser/files-forms.spec.ts` and 22 for `browser/unsaved-forms.spec.ts`, one per absence.
- **The size rule** measures `.ts`, `.svelte`, `.mjs` and `.js` (`tests/size.test.ts:51`, `bin/size-check.sh:15`). No file under `bin/` is over the line.
- **`bin/scratch-count.sh`** exits non-zero when either suite is red (`:30`), and waits for port 8792 before the browser run.

## The verify list, each timed in the run quoted

| Command | Output | Runtime |
| --- | --- | --- |
| `npx vitest run --reporter=dot` | `Test Files 258 passed`, `Tests 4306 passed` | 90s |
| `sh bin/scratch-count.sh` | `node before 0 / node after 0 / browser before 0 / browser after 0`, exit 0 | 492s |
| `npm run check` | `COMPLETED 1233 FILES 0 ERRORS 0 WARNINGS` | 19s |
| `npm run build` | `built in 15.99s`, exit 0 | 25s |
| `npm run format:check` | `All matched files use Prettier code style!` | 19s |
| `npm run lint` | no output | 77s |
| the ASCII gate | nothing, exit 0 | 1s |
| `sh bin/size-check.sh` | nothing, exit 0 | 1s |

The browser suite ran inside the count script; on its own under a private `TMPDIR` it printed `241 passed (5.4m)`.

## The citation check over the report

`node bin/cited-lines.mjs --root . <this report's citations>` from `tools/oculus` prints `19 cited lines, 0 missing`, exit 0. Over the round-one report as it sits on disk it prints `25 cited lines, 3 missing`: `tests/bin/claude-usage.test.ts:22` blank, `bin/revert-check.mjs:50` blank (the line has moved), and `views/shared/CardActions.svelte:202`, which wants its `src/lib/` prefix.

## Files changed this round

New: `tests/reason.ts` 38. Changed: `bin/revert-check.mjs` 407, `bin/cited-lines.mjs` 152, `bin/size-check.sh` 53, `bin/scratch-count.sh` 54, `tests/scratch.test.ts` 335, `tests/duplication.test.ts` 376, `tests/negatives.test.ts` 242, `tests/audits.test.ts` 258, `tests/boundaries.test.ts` 567, `tests/size.test.ts` 151, `tests/bin/revert-check.test.ts` 440, `tests/bin/cited-lines.test.ts` 123, `tests/allow-duplication.txt` 754 (744 entries, one per clone), `tests/allow-audits.txt` 160, `tests/allow-negatives.ts` 63 (48 entries, one per absence), `tests/data/real-hub.probe.ts` 130.

The step's whole diff against bbae5dd9: 150 files changed, 1082 insertions, 292 deletions, plus 18 untracked files.

## What is left over

- The duplication floor grew from 578 pair entries to 744 clone entries, because a pair holding more than one clone was silencing all of them under one line. Nothing new was added to the tree.
- The audits floor's reasons are machine-derived from each case's first assertion, so they pass the four-word rule and name a fact, but they are not a human's judgment of why that case never renders.
- `bin/scratch-count.sh` waits up to thirty minutes for port 8792 and then runs anyway; the line above the count says when the browser half was red for that reason.
