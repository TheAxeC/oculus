# Step O133 refuter report (on /Users/axelfaes/workspace/oculus/.agents/worktrees/migration-O133, base 651a57b8a)

A page this report cites (the rules file, a standard, a skill's text) is named with its section, never with a line number, since a page's lines move and a section's name does not. A finding in code keeps its `file:line`.

The report is written in the rules file's character set. A character outside it in a quoted line is written by its name in angle brackets, such as `<tab>` or `<em dash>`.

## Verification (rerun by the reviewer)

```
# Verify 1, from the worktree root
npx vitest run tests/data/prose/markdown/front-matter.test.ts tests/data/sources/docs.test.ts tests/data/sources/present.test.ts tests/server/edit/feeds.test.ts tests/server/machine/lsp/adapters/markdown-requests.test.ts tests/ui/html.dom.test.ts tests/server/machine/runs/lint/writing.test.ts tests/checks/tree/boundaries.test.ts
 <heavy right-pointing angle> |unit| tests/checks/tree/boundaries.test.ts (11 tests | 1 failed) 9113ms
     <multiplication sign> holds across src/lib 6584ms
 FAIL  |unit| tests/checks/tree/boundaries.test.ts > layer boundaries > holds across src/lib
Error: Test timed out in 5000ms.
 Test Files  1 failed | 7 passed (8)
      Tests  1 failed | 118 passed (119)

# boundaries.test.ts alone, twice (load average 18.24, then 16.84, from uptime)
npx vitest run tests/checks/tree/boundaries.test.ts
 Test Files  1 failed (1)
      Tests  1 failed | 10 passed (11)
 <heavy right-pointing angle> |unit| tests/checks/tree/boundaries.test.ts (11 tests | 1 failed) 7611ms
     <multiplication sign> holds across src/lib 5212ms
Error: Test timed out in 5000ms.
 Test Files  1 failed (1)
      Tests  1 failed | 10 passed (11)

# the same file with the time limit raised, to read the assertion's result (no file changed)
npx vitest run tests/checks/tree/boundaries.test.ts --testTimeout=60000
 Test Files  1 passed (1)
      Tests  11 passed (11)

# Verify 2
grep -rnE "FRONT_MATTER|FRONTMATTER|frontMatterEnd" src
src/lib/ui/html.ts:46:import { FRONT_MATTER } from '../data/prose/markdown/front-matter.ts';
src/lib/ui/html.ts:629:        const body = source === null ? null : source.replace(FRONT_MATTER, '');
src/lib/server/machine/lsp/adapters/markdown/requests.ts:19:import { FRONT_MATTER } from '../../../../../data/prose/markdown/front-matter.ts';
src/lib/server/machine/lsp/adapters/markdown/requests.ts:26: * a YAML front matter block at the top (`FRONT_MATTER`, the header every reader of a Markdown file
src/lib/server/machine/lsp/adapters/markdown/requests.ts:33:    const found = FRONT_MATTER.exec(state.src);
src/lib/state/sources/explorer/sections/outline.ts:19:import { FRONT_MATTER } from '../../../../data/prose/markdown/front-matter.ts';
src/lib/state/sources/explorer/sections/outline.ts:66:    const header = FRONT_MATTER.exec(text.replace(BOM, ''));
src/lib/data/sources/documents/docs.ts:16:import { FRONT_MATTER } from '../../prose/markdown/front-matter.ts';
src/lib/data/sources/documents/docs.ts:59:    const match = text.match(FRONT_MATTER);
src/lib/data/prose/markdown/note-links.ts:35:import { FRONT_MATTER } from './front-matter.ts';
src/lib/data/prose/markdown/note-links.ts:276:    const front = FRONT_MATTER.exec(text);
src/lib/data/prose/markdown/front-matter.ts:23:export const FRONT_MATTER = /^---[ \t]*\r?\n((?:[\s\S]*?\r?\n)??)(?:---|\.\.\.)[ \t]*(?:\r?\n|$)/;
src/lib/views/shared/prose/RenderedMarkdown.svelte:37:    import { FRONT_MATTER } from '$lib/data/prose/markdown/front-matter';
src/lib/views/shared/prose/RenderedMarkdown.svelte:121:            ? blockMarkdownParts(text.replace(FRONT_MATTER, ''), { note, math, image })
exit 0
grep -rnF -- '^---' src
src/lib/data/sources/deck/split.ts:51:const SEPARATOR = /^---[ \t]*$/;
src/lib/data/sources/deck/outline.ts:25:const CUT = /^---[ \t]*$/;
src/lib/data/prose/markdown/front-matter.ts:23:export const FRONT_MATTER = /^---[ \t]*\r?\n((?:[\s\S]*?\r?\n)??)(?:---|\.\.\.)[ \t]*(?:\r?\n|$)/;
exit 0

# Verify 3: shasum of docs/diagrams/* taken before, then npm run diagrams, then shasum again
diff diag-before.txt diag-after.txt && echo "diagrams unchanged"
diagrams unchanged
npm run test:quick   (exit 1)
test:quick: 23 changed file(s), from git since HEAD
test:quick: 58 test file(s)
ok      prettier (9.4 s): All matched files use Prettier code style!
ok      ASCII gate (10.6 s)
ok      svelte-kit sync (20.4 s): See https://rolldown.rs/reference/InputOptions.checks#plugintimings for more details.
ok      eslint (15.8 s)
ok      svelte-check (56.2 s): 1793725056819 COMPLETED 582 FILES 0 ERRORS 0 WARNINGS 0 FILES_WITH_PROBLEMS
ok      vitest (192.5 s): Duration  118.42s (transform 86.06s, setup 0ms, import 226.04s, tests 224.36s, environment 13.34s)
ok      vitest checks (225.9 s): Duration  151.35s (transform 173.71s, setup 0ms, import 286.77s, tests 266.22s, environment 4ms)
FAILED  vitest slow (242.5 s)
 FAIL  |unit| tests/data/hubs/hub-portfolio.test.ts > the portfolio of several hubs > holds every record of both hubs, each under the name of its hub's folder
Error: Test timed out in 20000ms.
 FAIL  |unit| tests/server/machine/lsp/servers.test.ts > starting a server > 'starts each server and the interprete<horizontal ellipsis>'
AssertionError: expected [ '/node', '/node', '/node', 'clangd' ] to deeply equal [ '/node', '/node', '/node', <horizontal ellipsis>(2) ]
 Test Files  2 failed | 7 passed (9)
      Tests  2 failed | 90 passed | 59 skipped (151)
test:quick: 263.4 s; failed: vitest slow
# the two red files rerun alone
npx vitest run tests/data/hubs/hub-portfolio.test.ts
 Test Files  1 passed (1)
      Tests  16 passed (16)
npx vitest run tests/server/machine/lsp/servers.test.ts
 Test Files  1 passed (1)
      Tests  7 passed (7)

# Verify 4, over the 17 changed text files (the 12 sources, tests, config and HELP, and the five .dot files)
LC_ALL=C perl -ne 'print "$ARGV:$.:$_" if /[^\x20-\x7E\n]/; close ARGV if eof' <those files>
(nothing printed) exit 0

# Verify 5
sh utils/unused-exports.sh > unused.txt; diff ../O133-base/unused-exports.txt unused.txt
exit 0; 335 lines each; diff printed nothing, diff exit 0

# Verify 6, the new test after the change
npx vitest run tests/data/prose/markdown/front-matter.test.ts --reporter=verbose
 <check mark> ... 14 rows, each <check mark>, 0 to 13 ms each
 Test Files  1 passed (1)
      Tests  14 passed (14)
   Duration  4.38s (transform 3.03s, setup 0ms, import 4.22s, tests 33ms, environment 0ms)

# Commands the builder's report quotes as evidence, rerun
grep -rniE "FRONT_MATTER|FRONTMATTER|frontMatterEnd|front matter|front-matter" src tests docs config README.md --exclude=local.yml   (docs/diagrams left out)
every hit the report's table lists is printed, and no other comment hit; the table's marks read correct, apart from Standards 1
history-word grep over the added lines and the two new files
26:+ * file whose block does not parse still has it.   (the one hit the report names)
wc -l over the changed files: front-matter.ts 23, note-links.ts 453, docs.ts 151, html.ts 712, requests.ts 133, RenderedMarkdown.svelte 192, outline.ts 168, split.ts 139, layer-rows.ts 363, front-matter.test.ts 263 (as the report's table)
grep -n "not placed\|cannot follow\|imported value" utils/diagrams/writes.mjs
12:// What it cannot follow, and why. A call through a computed member (`HANDLERS[kind]()`) and a call
13:// of a method of an imported value are drawn in the group of what is not placed, with their file
git status --short: docs/diagrams/writes.* not among the changed paths
```

## Verdicts

Items of the brief's "What to build", in its numbering:

- 1: holds. `src/lib/data/prose/markdown/front-matter.ts:23` is the docs form with the block group made lazy (`)??`), no `m` flag, `[ \t]*` after both lines, `\r?\n` line ends. Its head comment (`:1-20`) says what the pattern reads, why the empty block is tried first, and that it is the one pattern every reader uses. The module holds no reader and no I/O. The one false sentence of the head comment is Standards 1.
- 2: holds. Verify 2 prints the one export and the imports and uses in the six readers, and nothing else. `docs.ts` lost `FRONTMATTER` and its comment, whose content now sits in the new module's head comment. `note-links.ts` lost its export, and `frontTags(front[1])` places a tag at `1 + lineAt(body, offset)` (C3, a trailing tab, gives line 1). `html.ts` and `requests.ts` import from the new module; the token rule's body is unchanged and the rows give `map [0, n]` over every line, the closing line included. `RenderedMarkdown.svelte` imports the pattern, and its comment names the document route's split by the same pattern. `outline.ts` lost `frontMatterEnd` and matches on `text.replace(BOM, '')`. `layer-rows.ts:287` adds `'data/prose/markdown/front-matter'` alone, with its reason at `:228-231`. The boundaries assertion holds: the `--testTimeout=60000` run and test:quick's `vitest checks` both pass. Verify 1's timeout is Proof 1.
- 3: holds. `docs/HELP.md:406` says which lines open and close a note's front matter. `config/text/server.yml:385` names the one form under the same key. `deck/split.ts:7-8` names `data/prose/markdown/front-matter.ts` through `splitFrontmatter`. The report marks each grep hit. The extra second sentence at HELP.md:406 is Standards 1.
- 4: holds. `tests/data/prose/markdown/front-matter.test.ts` has the describe 'the leading header every reader reads' and one table of 14 rows (C1 to C13, with C8 as two rows). Each row checks scanNote's tags and headings with their lines, the `markdownOutline` titles, the `splitFrontmatter` block, the preview through `render(RenderedMarkdown, ...)` after `installRealText()`, the embed through `blockMarkdownParts('![[other]]\n', ...)`, and the token through `markdownRequests(() => ['.md'])['markdown/parse']`. The test imports no pattern.

Cases of the brief's "Cases":

- C1: met. The row gives tag `alpha` on line 1, heading `Title` on line 3, Outline `Title`, block `"tags: [alpha]\n"`, drawn `h1 Title` alone and token `[0, 3]`. The report quotes the first-run failure.
- C2: met. The row equals C1's. The quoted first-run failure is on the embed, the headings, the tags and the token, with the preview matching, as the brief's Before says.
- C3: met. Tags `alpha` and `beta` are each on line 1. The first-run failure is quoted.
- C4: met. The audit row passed before (as quoted) and passes after.
- C5: met. The row gives no tag, Outline `Title`, block `""`, drawn `h1 Title` and token `[0, 2]`. The first-run failure is quoted.
- C6: met. An audit, passing before and after.
- C7: met. An audit, passing before and after.
- C8: met. Both rows read no header in any reader. The preview draws the whole text (`hr`, `p tags: [alpha] ---x` / `h2 tags: [alpha]`, `h1 Title`). Both first-run failures are quoted, on the preview alone.
- C9: met. The Outline gives `draft` and `Title`, and no reader reads a header. The first-run failure is quoted, on the Outline alone.
- C10: met. The audit row gives tag `alpha` on line 2 and Outline `Title`, and the preview, the embed (`p <BOM>---` first), the token and the block read no header. It passed before and passes after.
- C11: met. The row gives block `""`, Outline `Title` and `More`, drawn `Title`, `Text`, `hr`, `More`, and token `[0, 2]`. The report gives the first run's other columns: headings `More` alone and token `[0, 7]`.
- C12: met. The row gives block `"abstract: |\n  one\n"`, no tag, token `[0, 4]`, and drawn `h2 tags: [alpha]` then `h1 Title`. The first-run failure is quoted.
- C13: met. The audit row gives tag `alpha` on line 1, an empty Outline and token `[0, 3]`.
- C14: met. `docs.test.ts`, `present.test.ts` and `feeds.test.ts` pass in my verify 1 run (7 of 8 files pass, the red one being boundaries.test.ts). The report quotes the unchanged tree's run: `Tests  39 passed (39)`.

## 1. Spec

none

## 2. Proof

- Verify 1, the brief's command, and the report's DONE row "Check 1": "the same test passes alone (`Tests  11 passed (11)`)".
  - What is wrong: verify 1 is red in my run on the timeout the report names. The claim that the test passes alone did not reproduce: it timed out twice alone, at 5212 ms in the second run, under load averages 18.24 and 16.84.
  - The assertion itself holds. `--testTimeout=60000` gives `Tests  11 passed (11)`, and test:quick's `vitest checks` line is `ok`. `tests/tiers/quick.mjs:19-20` runs the files under tests/checks "with no time limit".
  - The decision that rests on this is whether the red is the step's. It is the command's: it runs a tree check, which reads every module of src/lib, under the unit project's default 5000 ms limit. The diff adds only one allowed pattern and one import to that check's input.
  - Failure scenario: at landing, verify 1 is rerun on a loaded machine and prints `Tests  1 failed | 118 passed (119)`, with nothing in the diff to fix.
  - Verdict: none. Item 2 holds on the assertion's result.
- The report's DONE row "Check 3": "DONE, last run red on a slow test the step does not change".
  - What is wrong: a row whose run is red is marked DONE, and the first line names only check 1 as not done.
  - My run of test:quick was red on `vitest slow` in two different tests: a 20000 ms timeout in `tests/data/hubs/hub-portfolio.test.ts` ('holds every record of both hubs, each under the name of its hub's folder') and an assertion in `tests/server/machine/lsp/servers.test.ts:76` (one `/node` spawn missing within the `turn < 30` settle loop).
  - Both pass alone (`Tests  16 passed (16)`, `Tests  7 passed (7)`). Neither reads a front-matter header, by reading the failing assertions.
  - test:quick chose both files as reaching a changed file, so the rules file's exemption for "any other test file" (Verify before you report section) is not plainly the one that applies.
  - Failure scenario: the orchestrator reads the first line as "only check 1 is red" and lands, then meets a red `vitest slow` in the gate worktree that the report did not list as not done.
  - Verdict: none.

## 3. Standards

- `src/lib/data/prose/markdown/front-matter.ts:7-8`: "So a line is header to all of them or to none, and a note's tags come from the lines the preview leaves out."
  - The same claim appears at `docs/HELP.md:406`, "The preview, an embed, the Outline and the tags all take the same lines as front matter.", and at `tests/checks/tree/layer-rows.ts:229-231`, "so the preview leaves out the lines the others take as the header".
  - What is wrong: under decisions 3 and 4 these sentences are false for a text that opens with a BOM, and for one with lone CR line ends. The step's own C10 row shows it: scanNote gives tag `alpha` and the Outline skips the header, while the preview and the embed draw `p <BOM>---`, `h1 draft`, `h2 tags: [alpha]`.
  - The test's head comment states the two exceptions; the module's head comment and the HELP bullet state the rule as having none. The rule broken is the rules file's What every package obeys section: a sentence in a document or a head comment that the change makes false is a defect of the change.
  - HELP.md:406 also leaves out that either line may end in spaces or tabs.
  - Failure scenario: a user with a BOM-prefixed note reads HELP and expects its tags to be hidden in the preview, but sees them drawn as a heading. A maintainer reads front-matter.ts as a guarantee without exceptions and drops the BOM handling in `outline.ts:57` or `note-links.ts:275` as redundant.
  - Verdict: none. Items 1 and 3 hold on what they ask.
- `src/lib/state/sources/explorer/sections/outline.ts:67` and `src/lib/server/machine/lsp/adapters/markdown/requests.ts:36`: "header[0].replace(/\r?\n$/, '').split(/\r?\n/).length" and "found[0].replace(/\r?\n$/, '').split(/\r?\n/).length".
  - What is wrong: two readers count the header's lines with the same expression, and the BOM is stripped by two expressions (`outline.ts:57` `/^\u{FEFF}/u`, `note-links.ts:275` `/^<BOM>/`).
  - The rules file's principles section says a parser, a fold or a rule exists once and is reused. The step exists to make the header's lines one rule. The report's reason for leaving the count in two places ("a second export the brief does not name") does not hold: item 1 forbids a reader and I/O in the module, and a line count of a match is neither.
  - Failure scenario: the server's count is changed for a lone CR (markdown-it normalises `\r` first) and the Outline's is not. The two then disagree on which lines are header, and no row of G150's table holds a lone CR to catch it.
  - Verdict: none.
- The report, "Verify list runs: three".
  - What is wrong: the second run was green, a code change to `docs.ts:59` followed it, and then a third run.
  - The rules file's Token discipline section allows the list once after the last change, and once more after a red line in a changed file. It says a run beyond that is a finding of the review.
  - Failure scenario: none for the tree. The cost is about 120 s of a whole verify list on a machine shared with other suites.
  - Verdict: none.
- `src/lib/data/sources/documents/docs.ts:59`: "const match = text.match(FRONT_MATTER);".
  - What is wrong: the call form departs from the other three readers (`FRONT_MATTER.exec(...)` at `note-links.ts:276`, `outline.ts:66`, `requests.ts:33`). It was chosen so that `utils/diagrams/writes.mjs` keeps docs.ts out of the drawing's "not placed" group (writes.mjs:12-13, a method call of an imported value). No comment at the line gives that reason.
  - The rules file's Conventions say a comment says what the code does and why.
  - Failure scenario: a later tidy-up writes `FRONT_MATTER.exec(text)` to match the other readers, and `npm run diagrams` rewrites `docs/diagrams/writes.dot` by about two thousand lines (the report's figure, not reproduced here) with no write changed.
  - Verdict: none.

## 4. Behaviour

- The report's "Host- and user-visible changes, before and after" section, the preview bullet and the note-scan bullet.
  - What is wrong: three changes are not stated with their before and after.
  - The preview for an opening line with trailing spaces or tabs (C3, `---\t\ntags: [alpha, beta]\n---\n# Title\n`): before, a rule and the heading `tags: [alpha, beta]` above `Title` (the report's own first run); after, `Title` alone. The preview bullet lists C1, C5, C8, C11 and C12 and not C3.
  - The note scan's headings, which `src/lib/server/machine/lsp/adapters/markdown/own/wiki.ts:137` offers after `[[note#` and which an embed's `![[note#heading]]` section reads. Before, C2 and C3 gave a heading `tags: [alpha]` / `tags: [alpha, beta]` on line 1; after, it is gone. Before, C12 gave no heading `tags: [alpha]`; after, it gives one on line 4. Only C11's `Title` is stated.
  - The Outline for an opening line followed by Unicode white space other than a space or a tab, such as a no-break space. Before, a header (`lines[0]?.trim() !== '---'` at base `outline.ts:56-57`); after, none. Decision 5 and the report name only the closing line.
  - Failure scenario: at the look on landing, the orchestrator opens the preview, the `[[note#` completion and the Outline against the report's list. The completion list losing `tags: [alpha]`, and the preview of a `---<tab>` header, have no expected result to be read against.
  - Verdict: none.

## Declined to judge

- The first run of the new test on the unchanged tree. Its failure lines are judged from the report's quotes, which agree with the brief check's probes, because rerunning it would need the test placed into the base copy, and the reviewer changes no file.
- Whether `boundaries.test.ts` 'holds across src/lib' also passes 5000 ms on the base under the same load. The base copy has no node_modules or vite config to run it from; a run of verify 1 on main at 651a57b8a at a comparable load average would settle it.
- The report's figure of `writes.dot` +1053 -970 lines with `exec`. Reproducing it needs the code changed.
- Whether `docs/diagrams/*` match what a clean checkout at the base plus this diff would draw. My `npm run diagrams` left every file byte-identical (shasum before and after), which shows they match the worktree's source; the tree after staging would take `git diff --cached` or `git stash`, which this review does not run.
- G150's own text and its Code and Test lines, which the orchestrator writes at landing.

Reviewer usage: a65e7d50717ad34a0, claude-opus-5-5, 208309 tokens, 45 tool uses, 13 min 46 s.

## Repair round 1, refuted

```
# load before verify 1: 18:21  up 1 day,  2:24, 1 user, load averages: 5.31 8.01 10.36
# Verify 1, from the worktree root
npx vitest run tests/data/prose/markdown/front-matter.test.ts tests/data/sources/docs.test.ts tests/data/sources/present.test.ts tests/server/edit/feeds.test.ts tests/server/machine/lsp/adapters/markdown-requests.test.ts tests/ui/html.dom.test.ts tests/server/machine/runs/lint/writing.test.ts tests/checks/tree/boundaries.test.ts
 Test Files  8 passed (8)
      Tests  119 passed (119)
   Duration  9.69s (transform 9.50s, setup 0ms, import 19.59s, tests 9.11s, environment 1.06s)

# Verify 2
grep -rnE "FRONT_MATTER|FRONTMATTER|frontMatterEnd" src
src/lib/ui/html.ts:46:import { FRONT_MATTER } from '../data/prose/markdown/front-matter.ts';
src/lib/ui/html.ts:629:        const body = source === null ? null : source.replace(FRONT_MATTER, '');
src/lib/server/machine/lsp/adapters/markdown/requests.ts:19:import { FRONT_MATTER, headerLines } from '../../../../../data/prose/markdown/front-matter.ts';
src/lib/server/machine/lsp/adapters/markdown/requests.ts:26: * a YAML front matter block at the top (`FRONT_MATTER`, the header every reader of a Markdown file
src/lib/server/machine/lsp/adapters/markdown/requests.ts:33:    const found = FRONT_MATTER.exec(state.src);
src/lib/state/sources/explorer/sections/outline.ts:21:    FRONT_MATTER,
src/lib/state/sources/explorer/sections/outline.ts:67:    const header = FRONT_MATTER.exec(text.replace(BYTE_ORDER_MARK, ''));
src/lib/data/sources/documents/docs.ts:16:import { FRONT_MATTER } from '../../prose/markdown/front-matter.ts';
src/lib/data/sources/documents/docs.ts:59:    // A string's own method, where the other readers call `FRONT_MATTER.exec`: the write diagram
src/lib/data/sources/documents/docs.ts:62:    const match = text.match(FRONT_MATTER);
src/lib/data/prose/markdown/note-links.ts:35:import { BYTE_ORDER_MARK, FRONT_MATTER } from './front-matter.ts';
src/lib/data/prose/markdown/note-links.ts:276:    const front = FRONT_MATTER.exec(text);
src/lib/data/prose/markdown/front-matter.ts:27:export const FRONT_MATTER = /^---[ \t]*\r?\n((?:[\s\S]*?\r?\n)??)(?:---|\.\.\.)[ \t]*(?:\r?\n|$)/;
src/lib/data/prose/markdown/front-matter.ts:32:/** The number of lines a match of `FRONT_MATTER` spans, its closing line included. */
src/lib/views/shared/prose/RenderedMarkdown.svelte:37:    import { FRONT_MATTER } from '$lib/data/prose/markdown/front-matter';
src/lib/views/shared/prose/RenderedMarkdown.svelte:121:            ? blockMarkdownParts(text.replace(FRONT_MATTER, ''), { note, math, image })
exit 0
grep -rnF -- '^---' src
src/lib/data/sources/deck/split.ts:51:const SEPARATOR = /^---[ \t]*$/;
src/lib/data/sources/deck/outline.ts:25:const CUT = /^---[ \t]*$/;
src/lib/data/prose/markdown/front-matter.ts:27:export const FRONT_MATTER = /^---[ \t]*\r?\n((?:[\s\S]*?\r?\n)??)(?:---|\.\.\.)[ \t]*(?:\r?\n|$)/;
exit 0

# Verify 3: shasum docs/diagrams/* before, npm run diagrams, shasum after
diff diag-before.txt diag-after.txt && echo "diagrams unchanged"
diagrams unchanged
# npm run test:quick -- --base 651a57b8a (the state file's reviewer form), run twice; the first run was moved to the background by the runner after 180 s and was still running when the second started, so the two overlapped for about a minute
# first run (start 18:21, load average 7.61; end 18:27, load average 14.30); its output was cut to the last 40 lines by my filter, so the red test of `vitest` is not among the captured lines
 FAIL  |unit| tests/data/hubs/hub-portfolio.test.ts > the portfolio of several hubs > reports the findings each hub gives, the second hub own naming its files
Error: Test timed out in 20000ms.
 FAIL  |unit| tests/data/hubs/hub-portfolio.test.ts > the portfolio of several hubs > resolves a reference of the second hub in the primary hub when the primary alone holds the key
Error: Test timed out in 20000ms.
 Test Files  1 failed | 8 passed (9)
      Tests  4 failed | 88 passed | 59 skipped (151)
test:quick: 327.5 s; failed: vitest, vitest slow
# second run (start 18:26, load average 16.25; end 18:29, load average 14.46)
test:quick: 25 changed file(s), from git since 651a57b8a
test:quick: 58 test file(s)
ok      prettier (13.9 s): All matched files use Prettier code style!
ok      ASCII gate (14.8 s)
ok      svelte-kit sync (57.7 s): svelte-kit types: waiting for the vitest runs 31259, 31260
ok      eslint (5.4 s)
ok      svelte-check (19.4 s): 1793726859864 COMPLETED 582 FILES 0 ERRORS 0 WARNINGS 0 FILES_WITH_PROBLEMS
ok      vitest (97.4 s): Duration  73.01s (transform 48.71s, setup 0ms, import 136.41s, tests 134.89s, environment 5.22s)
ok      vitest checks (134.6 s): Duration  109.82s (transform 103.07s, setup 0ms, import 174.22s, tests 196.60s, environment 3ms)
ok      vitest slow (145.6 s): Duration  120.96s (transform 51.40s, setup 0ms, import 105.71s, tests 189.47s, environment 2ms)
test:quick: 205.8 s; every command passed
exit 0
# the red file of the first run, a file the step does not change, rerun alone twice
npx vitest run tests/data/hubs/hub-portfolio.test.ts   (load average 14.32)
<horizontal line extension x7> Failed Tests 2 <horizontal line extension x7>
 Test Files  1 failed (1)
      Tests  2 failed | 14 passed (16)
npx vitest run tests/data/hubs/hub-portfolio.test.ts   (load average 13.63, then 9.02)
 Test Files  1 passed (1)
      Tests  16 passed (16)
grep -rln "front-matter\|note-links\|splitFrontmatter\|FRONT_MATTER" tests/data/hubs/hub-portfolio.test.ts
grep exit 1

# Verify 4, over the twelve changed source, test, config and docs files and the ten layer diagram files
LC_ALL=C perl -ne 'print "$ARGV:$.:$_" if /[^\x20-\x7E\n]/; close ARGV if eof' <those 22 files>
perl exit 0   (nothing printed)

# Verify 5
sh utils/unused-exports.sh > unused.txt; diff ../O133-base/unused-exports.txt unused.txt
diff exit 0   (nothing printed; 335 lines)

# Verify 6: no test changed in the round (diff -u of the snapshot's front-matter.test.ts against the worktree's prints nothing); the new test after the round
npx vitest run tests/data/prose/markdown/front-matter.test.ts
 Test Files  1 passed (1)
      Tests  14 passed (14)

# Commands the round's report section quotes as evidence, rerun
grep -rnE "BYTE_ORDER_MARK|headerLines|uFEFF|u\{FEFF\}|split\(/\\\\r\?\\\\n/\)\.length" src
src/lib/server/machine/lsp/adapters/markdown/requests.ts:19:import { FRONT_MATTER, headerLines } from '../../../../../data/prose/markdown/front-matter.ts';
src/lib/server/machine/lsp/adapters/markdown/requests.ts:36:    const lines = headerLines(found[0]);
src/lib/server/machine/runs/lint/routes.ts:216:            rows = readChktex(ran.stdout, file, tabSizeOf(rc), content.startsWith('<BOM>'));
src/lib/server/machine/runs/lint/text.ts:13:    return text.startsWith('<BOM>') ? text.slice(1) : text;
src/lib/server/machine/runs/lint/readers.ts:87:        const shown = marked && line === 1 ? `<BOM>${text}` : text;
src/lib/server/files/source/source.ts:241:    return withMark(Buffer.from(content, 'utf8'), marked && !content.startsWith('<BOM>'));
src/lib/state/sources/explorer/sections/outline.ts:20:    BYTE_ORDER_MARK,
src/lib/state/sources/explorer/sections/outline.ts:22:    headerLines
src/lib/state/sources/explorer/sections/outline.ts:67:    const header = FRONT_MATTER.exec(text.replace(BYTE_ORDER_MARK, ''));
src/lib/state/sources/explorer/sections/outline.ts:68:    const skip = header === null ? 0 : headerLines(header[0]);
src/lib/data/prose/markdown/note-links.ts:35:import { BYTE_ORDER_MARK, FRONT_MATTER } from './front-matter.ts';
src/lib/data/prose/markdown/note-links.ts:275:    const text = source.replace(BYTE_ORDER_MARK, '').replace(/\r\n?/g, '\n');
src/lib/data/prose/markdown/front-matter.ts:30:export const BYTE_ORDER_MARK = /^\u{FEFF}/u;
src/lib/data/prose/markdown/front-matter.ts:33:export function headerLines(header: string): number {
src/lib/data/prose/markdown/front-matter.ts:34:    return header.replace(/\r?\n$/, '').split(/\r?\n/).length;
src/lib/data/prose/text-edits.ts:26:const BOM = '<BOM>';
npx eslint <the six files the round changes>
eslint exit 0
wc -l: front-matter.ts 35, note-links.ts 453, docs.ts 154, requests.ts 133, outline.ts 169, layer-rows.ts 366   (as the round's table)
diff -rq ../O133-base/<src|tests|utils|config|docs> <same> -x local.yml | wc -l
      22   (the twelve paths of the step and the ten layer diagram files)
git status --short: docs/diagrams/writes.* not among the changed paths
# a case-run program in my scratchpad (probe.mts), importing the readers from the worktree, for the two exceptions the round names
node probe.mts
bom {"tags":[{"tag":"alpha","line":1}],"headings":[["Title",3]],"outline":["Title"],"block":null,"stripped":"none","token":{"type":"heading_open","hidden":false,"map":[0,3]}}
lonecr {"tags":[{"tag":"alpha","line":1}],"headings":[["Title",3]],"outline":[],"block":null,"stripped":"none","token":{"type":"front_matter","hidden":true,"map":[0,3]}}
crlf {"tags":[{"tag":"alpha","line":1}],"headings":[["Title",3]],"outline":["Title"],"block":"tags: [alpha]\r\n","stripped":"header","token":{"type":"front_matter","hidden":true,"map":[0,3]}}
eot {"tags":[{"tag":"alpha","line":1}],"headings":[],"outline":[],"block":"tags: [alpha]\n","stripped":"header","token":{"type":"front_matter","hidden":true,"map":[0,3]}}
headerLines 2 3 3
```

(bom = `<BOM>---\ntags: [alpha]\n---\n# Title\n`; lonecr = `---\rtags: [alpha]\r---\r# Title\r`; "stripped" is `text.replace(FRONT_MATTER, '')` on the raw text, which is what the preview and an embed do.)

### Verdicts

Items of the brief's "What to build":

- 1: holds. `front-matter.ts:27` is the pattern the first review judged, unchanged by the round. The head comment (`:1-24`) says what it reads, why the empty block is tried first, that it is the one pattern, the two exceptions (`:8-11`, which the probe reproduces: a BOM text is a header to the note scan and the Outline alone, a lone-CR text to the note scan and the server alone), and what the module now holds (`:22-24`). There is still no reader and no I/O in it.
- 2: holds. Verify 2 prints the one export and the six readers' imports and uses and nothing else. Verify 1 passes `boundaries.test.ts` within its 5000 ms limit in my run, at load average 5.31. The views row and its reason are at `layer-rows.ts:228-234,290`.
- 3: holds. `HELP.md:406`, `server.yml:385` and `split.ts:7-8` are in place. The sentences that remain false for the two exception texts are Standards 1.
- 4: holds. The test is unchanged in the round, and its 14 rows pass (verify 6).

Cases of the brief's "Cases" (judged from the same test and the runs above):

- C1, C2, C3, C5, C8 (both rows), C9, C11, C12: met. Each row passes after the round. The first-run failures quoted in the first report stand, since no row changed.
- C4, C6, C7, C10, C13: met, as audits that pass after the round. The probe's `crlf`, `bom` and `eot` lines give the same columns as rows C4, C10 and C13.
- C14: met. docs, present and feeds pass in my verify 1 run (8 of 8 files).

Items of the round's brief:

- R1, the two exceptions named: holds. They are named at `front-matter.ts:8-11` and `layer-rows.ts:231-233`, each in one clause, and the probe reproduces both. `HELP.md:406` is one line, says that either line may end in spaces or tabs, and names only the BOM for the tags, the Outline, the preview and an embed, as the item says. Other sentences of the same claim that the item does not list are Standards 1.
- R2, the rule of the header's lines exists once: holds. `BYTE_ORDER_MARK` (`front-matter.ts:30`) is imported by `note-links.ts:35,275` and `outline.ts:20,67`. `headerLines` (`:33-35`) is called by `outline.ts:68` and `requests.ts:36`. The item 2 grep shows no other copy of the count. The probe's `headerLines 2 3 3` matches the old expression on an empty header, a header with no line end after it, and a CRLF header closed by `...`. The module's head comment says what it holds. The test rows are unchanged and pass. That an older BOM helper exists in the tree is Standards 2.
- R3, the reason at docs.ts: holds. The comment at `docs.ts:59-61` gives the reason, which agrees with `utils/diagrams/writes.mjs:12-13` on reading. My `npm run diagrams` left every diagram byte-identical.
- R4, the visible changes added: holds. The report now has the C3 preview at its line 189, the note-scan headings for C2, C3 and C12 offered after `[[note#` at line 188, and the Outline with a no-break space after the opening `---` at line 185, each with its before and after.
- R5, the first line and the rows of checks 1 and 3: holds. No row is marked DONE on a red last run. My verify 1 is green (`Tests  119 passed (119)`), and my second test:quick run prints `every command passed`. The rest of the report still carries figures from before the round; that is Proof 1.

### 1. Spec

none

### 2. Proof

- `.scratch/migration/agents/reviews/O133-report.md`, the sections above "Repair round 1": the DONE row "Check 2 ... outputs quoted below" and the block it points to (`front-matter.ts:23:export const FRONT_MATTER`, `outline.ts:19:import { FRONT_MATTER }`, `outline.ts:66: ... text.replace(BOM, '')`, `requests.ts:19:import { FRONT_MATTER } from`); the Files table (`front-matter.ts ... 23`, `docs.ts ... 151`, `outline.ts ... 168`, `layer-rows.ts ... 363`); "Verify list runs: three."
  - What is wrong: these figures are from before the round, and my runs do not reproduce them. Verify 2 now prints `front-matter.ts:27`, `outline.ts:21,67` with `BYTE_ORDER_MARK`, and `requests.ts:19` with `headerLines`. `wc -l` gives 35, 154, 169 and 366.
  - The round section's opening sentence lists the parts it supersedes: "the judgment calls on the line count and the Outline's BOM constant, and the 'Wrong or impossible' bullet on check 1". It does not list the check 2 block, the Files table or the run count.
  - The rules file's Report rule says every count, line count and `file:line` is taken after the last change, and a figure from before it is taken again or removed.
  - Decision resting on it: at landing, the orchestrator checks the verify 2 output and the file list against the DONE row's quoted block.
  - Failure scenario: the orchestrator compares the gate's verify 2 output with the block at report lines 87-110, reads the mismatch (`:27` against `:23`, the `headerLines` import) as a change made after the report, and goes looking for an edit that does not exist.
  - Verdict: none, since the round section has the current figures.

### 3. Standards

- Standards 1. Four sentences still say, with no exception, that every reader takes the same lines. Each is false for the two exception texts the round names:
  - `src/lib/data/sources/documents/docs.ts:54-55`: "The block is the one every reader of a Markdown file takes as its header (data/prose/markdown/front-matter.ts)."
  - `src/lib/data/prose/markdown/note-links.ts:13-14`: "the YAML front matter at the top, the header every reader of a Markdown file reads (front-matter.ts)."
  - `src/lib/server/machine/lsp/adapters/markdown/requests.ts:26-27`: "(`FRONT_MATTER`, the header every reader of a Markdown file reads, a note's `tags:` among it)."
  - `tests/data/prose/markdown/front-matter.test.ts:6-7`: "Each row is one text, and every reader of it takes the same lines as the header, or none."
  - What is wrong: the probe shows the claim fails for both exception texts. For the `bom` text, `splitFrontmatter` gives `block: null` and the server's first token is `heading_open`, while the note scan gives tag `alpha` and the Outline skips the header. For the `lonecr` text, the server hides `[0, 3]` while the docs split, the Outline and the preview's strip read no header. The test's own C10 row is titled 'a header after a BOM, a header to the note scan and the Outline alone', which contradicts the test's line 6-7.
  - The round report keeps `note-links.ts:13-14` and `requests.ts:26-27` as "naming the shared pattern". Judged on their text, they say "the header every reader ... reads", which is the same unqualified claim the round qualified at `front-matter.ts:7-11`. They do not say "the pattern every reader matches with".
  - Round item 1 lists three places by name. Its opening sentence, "The sentences that say every reader takes the same lines are made true by naming the two exceptions", covers these four as well.
  - The rule broken is in the rules file's "What every package obeys" section: a sentence in a document or a head comment that the change makes false is a defect of the change.
  - Failure scenario: a maintainer reads `docs.ts:54-55` or `requests.ts:26-27` as a guarantee. They then take a BOM-prefixed note's `splitFrontmatter` null, or the server's hidden lines for a lone-CR file, as a bug in one reader, and change it against decisions 3 and 4.
  - Fix at landing: name the pattern rather than the lines (for example "the pattern every reader of a Markdown file matches with, front-matter.ts, which names the two texts they read apart"), and state the C10 exception in the test's sentence.
  - Verdict: none.
- Standards 2. `src/lib/data/prose/markdown/front-matter.ts:29-30`: "/** One byte-order mark at the start of a text. */ export const BYTE_ORDER_MARK = /^\u{FEFF}/u;"
  - What is wrong: the tree already has an exported helper for exactly this. `src/lib/data/prose/text-edits.ts:28-31` is "The text without a leading byte order mark", `export function withoutMark(text: string)`. It is used by `data/snapshot/references/scan.ts:315`, `rename.ts:210` and `data/helpers/files/yaml/collection-text.ts:56`, and `data/prose/text-edits` is already in the views row.
  - The round adds a second leading-BOM rule in another `data/prose` module. It does not have `note-links.ts:275` and `outline.ts:67` call `withoutMark`.
  - The rules file's principles section says a rule exists once and is reused, and that a helper is grepped for and reused before one is written.
  - The builder's grep printed `text-edits.ts:26` and set it aside as "a BOM of a linted or saved file, not a header". `withoutMark` is not tied to a linted or saved file.
  - Round item 2's first bullet asked for this export by name, so the builder followed the ruling. Closing the finding means changing the ruled shape: drop `BYTE_ORDER_MARK` and import `withoutMark` in the two readers. That is the orchestrator's call.
  - Failure scenario: someone widens what counts as a leading mark in `withoutMark`, for example to the UTF-16 mark a pasted file brings. The Outline and the note scan go on reading by `BYTE_ORDER_MARK`, and the two places in `data/prose` disagree on what a leading mark is.
  - Verdict: none.
- Standards 3. The round report, "Check 3, full verify list runs in this round: two."
  - What is wrong: the first run of the round was red only on `tests/data/hubs/workspace-projects.test.ts`, a file the step does not change, and the list was then run again.
  - The changed files' last modification is 18:09:08 (`requests.ts`; `HELP.md` and `layer-rows.ts` 18:09:07; `ls -lT`), and the report was written at 18:18:04. Both runs took over 100 s and both followed the last change: the first run's prettier line was not red, so the `prettier --write` the report names came before it.
  - The rules file's Token discipline section: "A red line in a file the step does not change is rerun alone and named with that run in the report, and the list is not run again for it", and a run beyond that is a finding of the review.
  - Failure scenario: none for the tree. The cost is about 100 s of the whole list on a shared machine, the same kind as the first review's Standards 3, which the round brief left to be noted at landing.
  - Verdict: none.

### 4. Behaviour

none. The round changes no reader's result: `headerLines` is the old expression moved, and `BYTE_ORDER_MARK` matches what `/^<BOM>/` and `/^\u{FEFF}/u` matched. Verify 6 and the probe give the same columns.

### Declined to judge

- `docs/HELP.md:406` stays false for a note with lone CR line ends. For such a text the probe gives the tags while the preview's strip reads no header. Round item 1 rules that the HELP bullet names the BOM alone, so this is the orchestrator's ruling, and I do not judge it as a defect of the round.
- The `vitest` red line of my first test:quick run. My filter cut it from the captured output, and the run overlapped my second one, so the load was above 14. The `vitest slow` reds in that run were 20000 ms timeouts in `hub-portfolio.test.ts`, a file that reads no front-matter name (grep exit 1). Run alone, that file was red at load 14.32 and green at 13.63. A third test:quick run on a quiet machine would settle which `vitest` test was red; I did not start one.
- Whether `FRONT_MATTER.exec(text)` at `docs.ts:62` would move docs.ts into the write diagram's not-placed group, as the comment at `:59-61` says. Settling it needs the code changed, so I judged it by reading `writes.mjs:12-13` alone.
- The tree after staging, and whether `docs/diagrams/*` match a clean checkout of the base plus this diff. That needs `git diff --cached` or a commit, which this review does not run. My `npm run diagrams` left every file byte-identical.
- G150's text and its Code and Test lines, which the orchestrator writes at landing.

Reviewer usage: a7df403ff43b2bf2e, claude-opus-5-5, 209676 tokens, 48 tool uses, 15 min 27 s.

## Closed

The first review's findings, closed in repair round 1 (`agents/briefs/O133-round-1.md`), each closure judged by the review over the round:
- Proof 1 (check 1's row) and Proof 2 (check 3's row): round item 5; the review over the round gives R5 holds.
- Standards 1 (the sentence that every reader takes the same lines): round item 1; R1 holds. The other sentences of the same claim are the round review's Standards 1, below.
- Standards 2 (the BOM pattern and the line count written twice): round item 2; R2 holds. The second BOM helper the round added is the round review's Standards 2, below.
- Standards 3 (three runs of the verify list): no change asked; its cost is noted in the booking.
- Standards 4 (`text.match` at docs.ts): round item 3; R3 holds.
- Behaviour 1 (three visible changes without before and after): round item 4; R4 holds.

The review over round 1, its findings fixed at landing on the gate and carried to main:
- Proof 1 (the report's check 2 output, Files table and run count from before the round): fixed at landing in `agents/reviews/O133-report.md`; the check 2 output and the Files table give the tree as landed, the run count reads "in the first build", and the round section names the byte-order mark as landed.
- Standards 1 (four sentences that every reader takes the same lines): fixed at landing. `docs.ts:54-56`, `note-links.ts:13-14` and `requests.ts:26-27` name the pattern every reader matches with and point at front-matter.ts for the texts the readers part on; `front-matter.test.ts:6-8` names the byte-order mark exception.
- Standards 2 (`BYTE_ORDER_MARK` beside `withoutMark` of `data/prose/text-edits.ts`): fixed at landing. `BYTE_ORDER_MARK` is removed from front-matter.ts; `scanNote` and `markdownOutline` call `withoutMark`, which the state row already allows; the head comments of front-matter.ts and `layer-rows.ts:228-234` say what the module holds. The round's ruling of item 2 named the export; the landing replaces that ruling with the existing helper, a rule that exists once.
- Standards 3 (two runs of the verify list in the round): no change; its cost is noted in the booking.
- Declined to judge, `docs/HELP.md:406` for a note with lone CR line ends: fixed at landing; the bullet adds that in such a note the tags read front matter that the preview, an embed and the Outline do not.
