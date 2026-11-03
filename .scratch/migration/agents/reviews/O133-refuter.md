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
