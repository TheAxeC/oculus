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
| 10 | config-diff print | DONE | `git diff --unified=0 db3aa942 -- config \| grep -E '^\+[^+]'` printed nothing (grep exit 1); this step adds no config key |
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
| 10 | `git diff --unified=0 db3aa942 -- config \| grep -E '^\+[^+]'` | nothing, grep exit 1: this step adds no config key | under 1s |

## Line counts

New: `tests/scratch.ts` 36, `tests/scratch.test.ts` 132, `tests/duplication.test.ts` 288, `tests/audits.test.ts` 195, `tests/negatives.test.ts` 151, `tests/allow-duplication.ts` 606, `tests/allow-audits.ts` 161, `tests/allow-styling.ts` 126, `tests/allow-negatives.ts` 11, `tests/bin/revert-check.test.ts` 137, `tests/bin/cited-lines.test.ts` 83, `bin/revert-check.mjs` 240, `bin/cited-lines.mjs` 109, `bin/size-allow.txt` 15. Changed: `tests/boundaries.test.ts` 539, `.scratch/migration/agents/spec.md` +1, and 150 tracked files in all, `153 files changed, 1076 insertions(+), 306 deletions(-)` against db3aa942.

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
