# Step O134 refuter report (on /Users/axelfaes/workspace/oculus/.agents/worktrees/migration-O134, base c41dc24ec)

A page this report cites (the rules file, a standard, a skill's text) is named with its section, never with a line number, since a page's lines move and a section's name does not. A finding in code keeps its `file:line`.

The report is written in the rules file's character set. A character outside it in a quoted line is written by its name in angle brackets, such as `<tab>` or `<em dash>`.

## Verification (rerun by the reviewer)

```
$ npx vitest run tests/checks/config/templates.test.ts tests/routes/hubs/make.test.ts
 Test Files  2 passed (2)
      Tests  40 passed (40)
   Duration  18.70s (transform 11.12s, setup 0ms, import 21.41s, tests 4.61s, environment 1ms)

$ npx prettier --check docs/templates.md
Checking formatting...
All matched files use Prettier code style!
exit 0

$ LC_ALL=C perl -ne 'print "$ARGV:$.:$_" if /[^\x20-\x7E\n]/; close ARGV if eof' docs/templates.md
(nothing) perl exit 0
$ LC_ALL=C grep -n '[^ -~]' docs/templates.md
(nothing) grep exit 1

$ git diff c41dc24ec --numstat
15<tab>2<tab>docs/templates.md

$ git status --short
 M docs/templates.md
?? .scratch/migration/agents/reviews/O134-report.md

$ ls node_modules/.bin/tsx
ls: node_modules/.bin/tsx: No such file or directory

$ node <scratchpad>/o134/c1.mts            (worktree)
"---\ntags: [alpha, beta]                # the note's tags, each a word: [paper, review]\n---\n\nSome text.\n"
[{"tag":"alpha","line":1},{"tag":"beta","line":1}]
$ node <scratchpad>/o134/c1.mts planned    (worktree)
"---\ntags: [alpha, beta]                # the note's tags, each a word: [paper, review]\n---\n\nSome text.\n"
[{"tag":"alpha","line":1},{"tag":"beta","line":1}]
$ node <scratchpad>/o134/c1.mts            (from O134-base)
no section `## notes/<name>.md` with a markdown block on the page

$ node --input-type=module -e '<scanNote over the report's three inputs>'
"---\ntags: alpha, beta gamma\n---\nx\n" [{"tag":"alpha","line":1},{"tag":"beta","line":1},{"tag":"gamma","line":1}]
"---\ntags: [\"#alpha\", beta]\ntitle: Kept\n---\nx #delta\n" [{"tag":"alpha","line":1},{"tag":"beta","line":1},{"tag":"delta","line":4}]
"---\ntitle: [a\n---\nx\n" []

$ node --input-type=module -e '<scanNote over further inputs, reviewer's own>'
"---\ntags: [12, beta, true]\n---\nx\n" [{"tag":"beta","line":1}]
"---\ntags: [\"a b\", c]\n---\nx\n" [{"tag":"a b","line":1},{"tag":"c","line":1}]
"---\ntags: [\"2026\", review]\n---\nx\n" [{"tag":"review","line":1}]
"---\ntags: 2026 review\n---\nx\n" [{"tag":"review","line":1}]
"x #2026 and `#code` and #ok\n" [{"tag":"ok","line":0}]
"---\ntags: [#paper]\n---\nx\n" []
"---\ntags: [alpha, #beta]\n---\nx\n" []
"---\ntags:\n  - alpha\n  - beta\n---\nx\n" [{"tag":"alpha","line":2},{"tag":"beta","line":3}]
"---\ntags: [alpha, beta]  # c\n---\n" [{"tag":"alpha","line":1},{"tag":"beta","line":1}]

$ grep -rnE "setHiddenAreas|hiddenAreas" src
(nothing) exit 1
$ grep -rln "frontTags\|FRONT_MATTER" src
src/lib/ui/html.ts
src/lib/server/machine/lsp/adapters/markdown/requests.ts
src/lib/data/prose/markdown/note-links.ts
src/lib/views/shared/prose/RenderedMarkdown.svelte

$ grep -rn "writeFile\|mkdir\|rename(\|copyFile\|createWriteStream" src/lib/server/content/wallpaper.ts src/lib/server/content/images.ts src/lib/server/content/memories.ts
(nothing) exit 1

$ npm run test:quick   (npm run diagrams not run: it writes files)
test:quick: 2 changed file(s), from git since HEAD
ok      ASCII gate (1.1 s)
ok      svelte-kit sync (2.8 s)
ok      svelte-check (8.0 s): 1793721073072 COMPLETED 582 FILES 0 ERRORS 0 WARNINGS 0 FILES_WITH_PROBLEMS
ok      vitest checks (10.3 s): Duration  917ms (transform 369ms, setup 0ms, import 732ms, tests 18ms, environment 0ms)
test:quick: 13.3 s; every command passed

$ git diff c41dc24ec -U0 | grep '^+[^+]' | grep -i -E "before|used to|no longer|still|always has|always had|as before|previously|the step adds|after this package"
(nothing) exit 1
$ LC_ALL=C perl -ne '...' .scratch/migration/agents/reviews/O134-report.md
(nothing) exit 0
$ ls docs/adr
ls: .../migration-O134/docs/adr: No such file or directory
```

## Verdicts

Items of the brief's "What to build", in its numbering:

- 1: holds. `docs/templates.md:883-893` holds the heading `## notes/<name>.md` between the LinkedIn task's block (ends 881) and `## project.yml` (895), the one sentence on what a note is, the `markdown` block `---` / `tags: []` with a comment / `---`, and the rule sentences. The brief's clause "the head is hidden in ... the editor" is left out, and the code bears the builder out (Spec 1): `src/lib/views/sources/source/Editor.svelte:25-28` opens a Markdown file in the Monaco editor with its text as written, `grep -rnE "setHiddenAreas|hiddenAreas" src` prints nothing, the head is cut only from rendered text (`RenderedMarkdown.svelte:124` `text.replace(FRONT_MATTER, '')`, `src/lib/ui/html.ts:628` for an embedded note), and the `front_matter` token in `src/lib/server/machine/lsp/adapters/markdown/requests.ts:24-43` is `hidden` in markdown-it's own token stream so the head's last line is not read as a heading, which hides nothing on screen. "The preview hides the head" is true. Two of the rule sentences are untrue for some inputs (Standards 1); the brief itself asked for that wording, so the item holds as written.
- 2: holds. `docs/templates.md:22`: "| `notes/<name>.md` | `<hub>/.oculus/notes/` | New Note, or you |", after the `tasks/<task>.md` row. `newFile` at `src/lib/server/files/fs/ops.ts:306-309` creates an empty file, so New Note writes the file and the head is the user's.
- 3: holds. `docs/templates.md:35`: "`<hub>/.oculus/notes/order.json`: the order the Notes list shows the notes in." The sentence over the bullets was also reworded. I judge the rewording needed: the old sentence ("Oculus writes these itself") was untrue for the wallpaper bullet before this step, since no code in `src/lib/server/content/{wallpaper,images,memories}.ts` writes a file, and so it could not meet C3 with the brief's words alone. The new sentence "These have no template, since they hold pictures or oculus writes them:" is true for each bullet. Memories and wallpaper hold pictures; the Memories view's Add writes into the memories folder through `addMemory`, the POST of `src/routes/api/(docs)/memories/+server.ts`. `order.json` is written by `writeNoteOrder` (`src/lib/server/files/fs/notes.ts:288`). The root app's store is written by the write chain (`src/lib/server/machine/apps/store/store.ts:7-8`). The report states the rewording as a judgment call and as a reader-visible change, with before and after.

Cases of the brief's "Cases":

- C1: met. The program's rerun over the worktree page prints `[{"tag":"alpha","line":1},{"tag":"beta","line":1}]`, and over the base page it prints "no section ...". `npx tsx` is unavailable (`ls node_modules/.bin/tsx` fails), so the program runs under `node`, as the report says.
- C2: met. `docs/templates.md:893`: "Any other key is kept in the file and not read." `grep -rln "frontTags\|FRONT_MATTER" src` lists four readers, and none of them reads another key. `frontTags` (`note-links.ts:230`) looks up `tags` only. The docs route's front matter (`src/lib/server/content/docs.ts`) serves PROJECT_DOCS, not notes.
- C3: met. Each bullet was read against the code as under item 3.
- C4: met. The after run passes, 40 of 40. The before run was not rerun by me (see "Declined to judge"). The diff changes only `docs/templates.md`, and the heading lookups the tests use (`templateBlock`, `tests/checks/config/template-keys.ts:20-28`, finds the first ```yaml after an exact heading) do not reach the new ```markdown block.

## 1. Spec

- Brief, "What is on the tree" and "What to build" item 1: "The header is hidden in the preview and the editor." What is wrong: the premise does not reproduce. The editor shows the head (evidence under item 1). The diff leaves the clause out, which is correct, and no change to the diff is needed. Failure scenario: had the clause been written, a reader would open a note in its source tab, see the `---` block and take the page or oculus for broken. Verdict: none (item 1 holds).

## 2. Proof

none

## 3. Standards

1. `docs/templates.md:893`: "It takes a list, each text item one tag, or one text whose words, split on spaces and commas, are the tags. A `#word` in the note's text is a tag too."
   - What is wrong: the rules file ("Verify before asserting"; "A sentence in a document ... that the change makes false is a defect of the change") requires the sentences to be true, and both are untrue for inputs a reader writes:
     - `tagWord` (`src/lib/data/prose/markdown/note-links.ts:102-105`) drops a word made only of digits. `tags: ["2026", review]` (a text item) gives only `review`, `tags: 2026 review` gives only `review`, and `#2026` in the text gives nothing.
     - A `#word` in a code span or a fence is text and gives no tag: `` `#code` `` gives nothing.
     - The page also says nothing about `#` inside the head, where an unquoted `#` starts a YAML comment. `tags: [alpha, #beta]` fails to parse and gives no tags at all, and `tags: #alpha beta` gives none.
   - The comment of the copyable block avoids `#`, and HELP.md:405 states the digit and code exceptions ("not only digits; not in code, a link, a heading mark or an address"). This page states neither and does not point at HELP's Notes section.
   - Failure scenario: a reader tags notes by year from this page, writes `tags: [2026, review]` or `tags: [alpha, #beta]`, and the Tags section shows no `2026` tag, or no tags for the note at all, with nothing on the page that explains it.
   - Fix at landing, inside the step's lines: add "of letters, digits, `_`, `-` and `/`, not only digits" and "a `#` inside the head is written quoted", or end the paragraph with a link to HELP's Notes section.
   - Verdict: none. Item 1 holds, since the brief asked for this wording.
2. `docs/data-map.md:23`: "| `.oculus/notes/` | the notes, one Markdown file each, and `order.json`, their order in the Notes list; written by oculus |".
   - What is wrong: the diff's new row (`docs/templates.md:22`, "New Note, or you") and the brief's premise say the notes are written by New Note and the user. The data map, whose line 3 sends the reader to `docs/templates.md`, still lists them as written by oculus.
   - The rules file ("After changing a name, a construct or a shape, grep it across `src`, `tests`, `config`, `docs` and `README.md`, carry the change to every hit or say why not") was not followed for this hit, and the report quotes no docs grep for `notes/`.
   - The line is outside the brief's write list, so the fix is a one-cell edit at landing: "written by New Note and you; `order.json` by oculus".
   - Failure scenario: a reader of the data map takes the notes for oculus-managed files that are not hand-edited, and finds that the templates page offers a head to copy into them.
   - Verdict: none.

## 4. Behaviour

none. The report's "Reader-visible changes, before and after" names the new row, the reworded sentence, the reworded bullet and the new section with its contents entry, each with before and after, in the Help view's Templates tab.

## Declined to judge

- C4 before the change was not rerun by me. The base copy has no `node_modules`, and running it on the base would need a checkout at c41dc24ec with dependencies. The builder's first run quotes `Tests  40 passed (40)`.
- `npm run diagrams` was not run, because it writes files. The worktree's diagrams being unchanged rests on the builder's `git status --short`, which my `git status --short` matches.
- Whether the Help view renders the heading `## notes/<name>.md` with `<name>` visible or swallowed as an HTML tag. The page already has `## workspaces/<name>.yml` in the same form, so the new heading behaves as that one does. It is settled by the look on landing in the Templates tab.
- The quoted program in the report omits the file's four-line head comment, which names the step id. This is a scratchpad file outside the diff, the code is the same, and no decision rests on it.

Reviewer usage: a05c46e52aec55295, claude-opus-5-5, 131236 tokens, 31 tool uses, 6 min 6 s.
