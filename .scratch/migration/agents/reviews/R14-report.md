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
