# O134 report: a Notes section in the templates page

Everything in the brief is done, except one clause of item 1 that the code shows false: "the head is hidden in ... the editor" is left unwritten and handed back below ("Wrong in the brief"); the section says "The preview hides the head."

## Open items of the state file

From `.scratch/migration/orchestrator-state.md`, "## Open items (only what Axel must rule on; every report tells him these in plain words, decisions first, until he has ruled)":

- None.

## The cases' first run, on the unchanged page (before any change)

- C1. Command: `node <scratchpad>/o134/c1.mts` from the worktree root (the program is quoted under "Case-run program"). Output: `no section `## notes/<name>.md` with a markdown block on the page`. The same program over the block the brief describes (`node <scratchpad>/o134/c1.mts planned`) printed `"---\ntags: [alpha, beta]                # the note's tags, each a word: [paper, review]\n---\n\nSome text.\n"` and `[{"tag":"alpha","line":1},{"tag":"beta","line":1}]`, so the brief's rule for C1 holds and was not handed back.
- C2. Command: `grep -n '^## notes/' docs/templates.md` printed nothing, exit 1; `grep -n 'kept in the file' docs/templates.md` printed nothing, exit 1. The page says nothing about a note's keys.
- C3. Command: `sed -n '31,35p' docs/templates.md`, which printed:
  ```
  Oculus writes these itself, so they have no template:

  - `<hub>/.oculus/memories/` and `<hub>/.oculus/wallpaper/`: picture folders.
  - `<hub>/.oculus/notes/`: your notes as Markdown files, and `order.json`, the order the Notes list shows them in.
  - `<repository>/.oculus/app-data/<name>.json`: the store of a root app.
  ```
  Read against the code, the sentence is false for two bullets: the notes are written by New Note (`src/lib/server/files/fs/ops.ts:306-309`, an empty file) and then by the user, and the wallpaper folder is only read by oculus (`grep -rn "writeFile\|mkdir" src/lib/server/content/wallpaper.ts src/lib/server/content/images.ts src/lib/server/content/memories.ts` printed nothing; HELP.md:347 has Add write into the memories folder only). `order.json` is written by `writeNoteOrder` (`src/lib/server/files/fs/notes.ts:288`) and the root app's store through the write chain (`src/lib/server/machine/apps/store/store.ts:7-8`).
- C4. Command: `npx vitest run tests/checks/config/templates.test.ts tests/routes/hubs/make.test.ts`. Output: `Test Files  2 passed (2)`, `Tests  40 passed (40)`, `Duration  4.00s (transform 2.63s, setup 0ms, import 5.12s, tests 762ms, environment 1ms)`.

## Case-run program

`<scratchpad>` is `/private/tmp/claude-502/-Users-axelfaes-workspace-research-hub/be0ac0d7-a551-4911-a072-9f76e1bbe399/scratchpad`. It reads the page, writes nothing, and is outside the worktree. The brief names `npx tsx`; `ls node_modules/.bin/tsx` printed "No such file or directory", and `npx tsx` would fetch a package the tree does not hold, so the program runs under Node 24's own type stripping, which loads `note-links.ts` unbuilt as the desktop app does.

```ts
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const root = process.cwd();
const { scanNote } = await import(resolve(root, 'src/lib/data/prose/markdown/note-links.ts'));

const planned = '---\ntags: []                # the note\'s tags, each a word: [paper, review]\n---\n';

function blockOfPage(): string | null {
    const page = readFileSync(resolve(root, 'docs/templates.md'), 'utf8');
    const at = page.indexOf('\n## notes/<name>.md\n');
    if (at < 0) return null;
    const next = page.indexOf('\n## ', at + 1);
    const section = page.slice(at, next < 0 ? page.length : next);
    const fenced = /```markdown\n([\s\S]*?)```/.exec(section);
    return fenced === null ? null : fenced[1];
}

const block = process.argv[2] === 'planned' ? planned : blockOfPage();
if (block === null) {
    console.log('no section `## notes/<name>.md` with a markdown block on the page');
} else {
    const note = block.replace('tags: []', 'tags: [alpha, beta]') + '\nSome text.\n';
    console.log(JSON.stringify(note));
    console.log(JSON.stringify(scanNote(note).tags));
}
```

The rule sentences were run through `scanNote` too, with `node --input-type=module -e` importing the same module:

```
"---\ntags: alpha, beta gamma\n---\nx\n" [{"tag":"alpha","line":1},{"tag":"beta","line":1},{"tag":"gamma","line":1}]
"---\ntags: [\"#alpha\", beta]\ntitle: Kept\n---\nx #delta\n" [{"tag":"alpha","line":1},{"tag":"beta","line":1},{"tag":"delta","line":4}]
"---\ntitle: [a\n---\nx\n" []
```

## DONE / NOT DONE

| Item | State | Proof, after the last change |
|---|---|---|
| 1. Section `## notes/<name>.md` before `## project.yml` | DONE, without the editor clause | `docs/templates.md:883-893`; quoted below |
| 2. Table row after `tasks/<task>.md` | DONE | `docs/templates.md:22` |
| 3. Bullet keeps `order.json` alone | DONE | `docs/templates.md:35` |
| C1 | met | `node <scratchpad>/o134/c1.mts` printed `"---\ntags: [alpha, beta]                # the note's tags, each a word: [paper, review]\n---\n\nSome text.\n"` and `[{"tag":"alpha","line":1},{"tag":"beta","line":1}]` |
| C2 | met | `docs/templates.md:893`: "Any other key is kept in the file and not read." |
| C3 | met | `docs/templates.md:32-36`, each bullet read against the code as under the first run: the picture folders hold pictures, `order.json` and the app store are written by oculus |
| C4, check 1 | passes | `npx vitest run tests/checks/config/templates.test.ts tests/routes/hubs/make.test.ts`: `Test Files  2 passed (2)`, `Tests  40 passed (40)`, `Duration  1.83s (transform 1.21s, setup 0ms, import 2.17s, tests 422ms, environment 0ms)` |
| Check 2 | passes | `npx prettier --check docs/templates.md`: `Checking formatting...`, `All matched files use Prettier code style!`, exit 0 |
| Check 3 | passes | `LC_ALL=C perl -ne 'print "$ARGV:$.:$_" if /[^\x20-\x7E\n]/; close ARGV if eof' docs/templates.md` printed nothing, exit 0; the rules file's `LC_ALL=C grep -n '[^ -~]' docs/templates.md` printed nothing, exit 1 |
| Check 4 | passes | `git diff --numstat`: `15<tab>2<tab>docs/templates.md`, 17 lines in all |
| Check 5 | done | under "Sentences against the rules" |
| Verify list | passes, run once | `npm run diagrams` then `npm run test:quick`: `ok      ASCII gate (0.9 s)`, `ok      svelte-kit sync (2.2 s)`, `ok      vitest checks (12.7 s): Duration  1.38s (transform 507ms, setup 0ms, import 1.22s, tests 20ms, environment 0ms)`, `ok      svelte-check (24.8 s): 1793720638452 COMPLETED 582 FILES 0 ERRORS 0 WARNINGS 0 FILES_WITH_PROBLEMS`, `test:quick: 27.1 s; every command passed`. It ran `tests/checks/config/templates.test.ts` only ("named for a changed file") and does not cover the build or the lint of unchanged files. `npm run diagrams` changed no file (`git status --short` printed only ` M docs/templates.md`). No whole-suite command was run. |
| Paths written | inside the write list | `git status --short`: ` M docs/templates.md`, plus this report |

No test was added or changed. No comment or test title was added; `git diff -U0 | grep '^+[^+]' | grep -i -E "before|used to|no longer|still|always has|always had|as before|previously|the step adds|after this package"` printed nothing.

## The new section, the changed table and bullet, quoted whole

Table row, `docs/templates.md:22`:

```
| `notes/<name>.md` | `<hub>/.oculus/notes/` | New Note, or you |
```

The sentence over the bullets and the bullets, `docs/templates.md:32-36`:

```
These have no template, since they hold pictures or oculus writes them:

- `<hub>/.oculus/memories/` and `<hub>/.oculus/wallpaper/`: picture folders.
- `<hub>/.oculus/notes/order.json`: the order the Notes list shows the notes in.
- `<repository>/.oculus/app-data/<name>.json`: the store of a root app.
```

The section, `docs/templates.md:883-893`:

````
## notes/<name>.md

A note is a Markdown file in `<hub>/.oculus/notes/`, and its file name without `.md` is its title. Copy this head to the top of a note to give it tags.

```markdown
---
tags: []                # the note's tags, each a word: [paper, review]
---
```

`tags:` is the one key oculus reads. It takes a list, each text item one tag, or one text whose words, split on spaces and commas, are the tags. A `#word` in the note's text is a tag too. Any other key is kept in the file and not read. The preview hides the head.
````

## Judgment calls the brief left open

- The sentence over the bullets is reworded from "Oculus writes these itself, so they have no template:" to "These have no template, since they hold pictures or oculus writes them:". C3 asks that it be true for each bullet, and it was false for the wallpaper folder as well as for the notes (first run of C3). This is a reader-visible change the brief did not name, inside its write list (lines 11-36), and the orchestrator may reverse it; the alternative is a separate bullet split, which would leave the memories folder (Add writes, and so does the user) under a claim of its own.
- The comment in the head reads "the note's tags, each a word: [paper, review]". It avoids a `#` inside the example, since `[#paper]` in YAML starts a comment and gives no tag. It is aligned to column 25, as the commented keys of the YAML templates are.
- The section leaves out that a leading `#` on a tag is dropped (`note-links.ts:234`), so the rule stays in short sentences; a reader writes `#` only quoted, and the run above shows `"#alpha"` read as `alpha`.
- "its file name without `.md` is its title" follows `noteTitle` (`src/lib/data/prose/markdown/note-names.ts:139-142`) and HELP.md:397's "A note's name is its file name without `.md`".

## Sentences against the rules

The rules file sets one line per paragraph or bullet (held: each paragraph and bullet is one line) and plain prose with no 'not X but Y' (held). It names no word limit for a sentence. The longest new sentence is "It takes a list, each text item one tag, or one text whose words, split on spaces and commas, are the tags." (22 words); it keeps the two forms of `tags:` in one sentence so the reader sees they are alternatives of one key. The table row and the bullet are fragments, as every row and bullet of that table and list is.

## Reader-visible changes, before and after

The page is `docs/templates.md`, shown in the Help view's Templates tab; the look reads it there.

- "Where each file goes": before, no row for a note; after, a row `notes/<name>.md` | `<hub>/.oculus/notes/` | New Note, or you, after the `tasks/<task>.md` row.
- The sentence over the bullets: before "Oculus writes these itself, so they have no template:"; after "These have no template, since they hold pictures or oculus writes them:".
- The notes bullet: before "`<hub>/.oculus/notes/`: your notes as Markdown files, and `order.json`, the order the Notes list shows them in."; after "`<hub>/.oculus/notes/order.json`: the order the Notes list shows the notes in."
- A new section `notes/<name>.md` between the LinkedIn task's block and `project.yml`, with its entry in the page's contents list, which `[TOC]` builds from the headings.

## Wrong in the brief

- "the head is hidden in the preview and the editor" (item 1, and the premise at line 14): the editor shows the head. A note opens in a source tab, the Monaco editor with the text as written: `src/lib/views/sources/source/Editor.svelte:25-28` ("A Markdown file opens as the editor alone. With the rendered half turned on, the row splits into the editor and the rendered half"), and `grep -rnE "setHiddenAreas|hiddenAreas" src` printed nothing, exit 1. The head is cut only from what is rendered: `src/lib/views/shared/prose/RenderedMarkdown.svelte:124` (`text.replace(FRONT_MATTER, '')`, the preview and the rendered half) and `src/lib/ui/html.ts:628` (an embedded note). The Markdown server's `front_matter` token (`src/lib/server/machine/lsp/adapters/markdown/requests.ts:24-43`) is hidden in its own parse so the head's last line is no heading, which hides nothing on screen. The editor clause is left unwritten.
- C1 names `npx tsx`; the tree has no `tsx` (`ls node_modules/.bin/tsx`: "No such file or directory"). The case ran under `node`, as under "Case-run program".
