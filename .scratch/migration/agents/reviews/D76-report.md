Item 5 of round 1 is not done as the round asks: the G5 rows cannot show DOMPurify at work in the `client` project, because that project has no DOM either. Items 1, 2, 3, 4, 6 and 7 are done.

# D76 report: notes like Obsidian (state after round 1)

What the orchestrator needs before landing, each stated in full below:
- **Item 5, premise wrong.** `tests/ui/frame/client-runtime.ts:1` reads "A vitest environment with no DOM whose modules are transformed as the browser's". A probe in the `client` project printed `{"isSupported":false,"sanitize":"undefined","window":"undefined","document":"undefined","out":"<b style=\"color:red\">x</b><script>1</script>"}`. Moving the G5 rows into a `*.client.test.ts` file would show the same text handed back, so they stay in `tests/ui/html.test.ts`. A run that checks the sanitiser needs a DOM library that is not installed (`ls node_modules | grep -iE '^(jsdom|happy-dom|linkedom)$'` prints nothing). spec.md:56 makes a new dependency a report: `happy-dom` or `jsdom` as a dev dependency, with a vitest environment for one file (`// @vitest-environment happy-dom`) or a project for `*.dom.test.ts` files, would let G5's rows run DOMPurify for real. That is for the orchestrator to rule.
- **A G5 check was red on round 0 and is green now.** `tests/checks/source/html-sites.test.ts` failed on the round-0 tree with the site `views/shared/prose/Markdown.svelte: sanitised ? doc.html : sanitise(doc.html)`. Round 0 did not report it. It is fixed in the code, with the check unchanged: `{@html sanitise(doc.html, slots)}` at `Markdown.svelte:182`. Now `Tests  19 passed (19)`.
- **test:quick passes every command and is over its own time limit**: "test:quick: 48.3 s (limit 45.0 s); every command passed".
- **The checks command has the same three red rows as round 0.** One is config-folder's chord row, which also fails on the unchanged tree; main holds `chord: a`. The other two read the hub's own `.oculus/` and pass only on main.
- **Full-list runs this round: two.** The first stopped at its red test:quick (eslint). test:quick was then rerun alone, and the second full-list run covered every command.
- **No git command was run in this round.** The read-only `git status` of round 0 (review Standards 3) is the only one in the step.

## Open items of the state file (verbatim)

The worktree's copy of the state file (`tools/oculus/.scratch/migration/orchestrator-state.md:170-174` in the worktree) lists "- None.". The current copy is main's, `tools/oculus/.scratch/migration/orchestrator-state.md`, read with `awk '/^## Open items/{p=1} /^## Booked/{p=0} p'` while this report was written:

```
## Open items (only what Axel must rule on; every report tells him these in plain words, decisions first, until he has ruled)

An entry leaves this list for the closed log the moment Axel rules on it. What a review or a look found and no brief covered is not an open item: it is folded into an existing step in `plan.md` (Z468), never booked as a step of its own.

- Open item 97 (2026-10-14): the palette page and the templates as tabs of the Help page in `config/layout.yml`. Recommended (a): both in D73's fourth part, with the Contents block Axel added to `docs/palette.md` written by its generator (`utils/diagrams/palette.mjs`), since the hand edit fails `tests/checks/diagrams/palette.test.ts`; (b) O33.
- Open item 98 (2026-10-14): where the Data map lives. Recommended (a): oculus's `docs/data-map.md`, written for any hub, in O33 part (5); the hub keeps its own lines (the website, the nested-repos block, `~/data`) in its README; (b) stays in the hub.
- Open item 99 (2026-10-14): `demo/` is used by `tests/data/hubs/hubs-fixture.ts`, the Playwright run of every landing and O33 part (4). Recommended (a): keep it, kept current by every step that changes a file shape (D73 edits it for open item 94).
- Open item 100 (2026-10-14): Add writes a new entry, a new project and a feed entry to the primary hub only (`homeOf`, `server/edit/writes/hubs.ts:166`). Recommended (a): the Add box asks which hub when more than one hub names the collection, and the `new-entry` body gains an optional `root` as `feed-field` has (a shape apps see), in D73; (b) O33 part (5); (c) primary only.
- Open item 101 (2026-10-14): a control that makes a folder a hub or a project, writing the files from `docs/templates.md` with a list to untick, and oculus's default data paths under `.oculus/data/`. Making a project writes a `project.yml`, which open item 77 (1) rules no oculus code does: a reversal for Axel. Recommended: the hub part in O33 part (5), the default paths `.oculus/data/<key>.yml`, research-hub keeping its own paths through its `collections:`; the project part only if Axel lifts that ruling for an explicit press.
```

## Round 1: what changed for each item

1. **A rename on a link renames the note.**
   - `src/lib/state/system/machine/lsp/edits.ts:197` adds `noteRenameOf(edit, hubs)`. It names the note when the edit holds exactly one entry that is not a text edit, that entry is a `rename`, and both its `oldUri` and its `newUri` are notes in the same notes folder of one hub. It returns `{ item: { root, path }, name }`, and `null` for every other edit.
   - The edit plan itself still refuses every create, rename and delete entry with `lsp_edit_structure`.
   - The source tab's `applyEdit` (`src/lib/views/sources/source/language/lsp.ts:235-252`) calls `noteRenameOf` first. When it names a note, the tab calls `client.explorer.rename(note.item, note.name)`, the Notes tree's rename (`ops.svelte.ts` asking `moving` of `explorer/notes/note-moves.ts`). That rename plans the link rewrites itself, so the server's text edits are not applied a second time.
   - A refusal from that rename shows `lsp_edit_refused` with the rename's own sentence (`sentenceOf(renamed, t)`). `lsp_edit_refused` is an existing catalog key, so no key is added.
   - Comments now true: `wiki.ts:15-19` (names `noteRenameOf`), the doc comments of `namedBy` and `declaringEdits` in `kit/lsp/transport/edits.ts`, and the head comment of `edits.ts:41`. `servers.ts:24` ("the rename of a note a link names") is unchanged and is now true.
2. **A scope inside `.oculus` other than the notes folder searches nothing.**
   - `searchedPaths` (`src/lib/data/helpers/search/query.ts:219-225`) gives `[]` to any scope with a `.oculus` segment, unless the place has a notes folder and the scope is that folder or a folder under it (`place.notes && inNotes(under) !== null`).
   - The comments of `STATE_FOLDER` and `rootSearchArgs` say so.
   - The view is unchanged: a root with no searched path gives no hits and the view's "no results" line, as for an empty scope.
3. **No regex search gains `--multiline`, and a tag's search lists what the Tags section counts.**
   - `spansLines` and every `--multiline` are removed from `query.ts`. The multi-line support in `src/lib/server/files/search/search.ts` is removed with them (`firstLineOf`, `linesOf`, the spanned loop and `spans` in `hitOf`), and those hunks match the base again. `grep -n 'multiline\|spansLines'` over both files prints nothing.
   - The tag index now holds each tag's line. `NoteScan.tags` (`note-links.ts`) is a list of `{ tag, line }`, with a front matter's lines read from the YAML nodes' ranges (`parseDocument`).
   - `NoteEntry.tags` (`model-sessions.ts`) and the transport shape (`fs-transport.ts`) carry the line.
   - `tagPattern` (`src/lib/state/sources/explorer/notes/note-index.ts:146`) holds no `\n`. It is four line patterns: an inline tag, a `tags:` key line, a list item, and a line of a list that continues. Its doc comment (`:136-145`) says the search keeps the lines the index holds.
   - `taggedHits(hubs, tag, files)` (`:160`) keeps each hit whose line is a line the index holds the tag at.
   - The search state gains `tag` (`state/sources/search/search.ts:79-80`, `:96`, `:257`, `:281`). `createSearch` takes a sixth argument, `tagged`. `runSearch` keeps the tagged hits and stores the others as dismissed, so a replace's re-read leaves them out too (`search.svelte.ts:308-316`). A change to the query, a toggle, the root or the scope drops `tag` (`:222`).
   - `state/client/context.ts:474` passes `taggedHits`. A tag press sets `tag` (`views/shared/explorer/control/note-actions.ts`).
4. **The server's name rule holds for the first note of a hub with no notes folder.**
   - `inNotesFolder` (`src/lib/server/files/fs/notes.ts:329-332`) compares would-be real paths through `wouldBeReal` (`:312`). `wouldBeReal` reads a path through its nearest folder that exists and joins the rest.
   - A create of `notes/<name>.md` under `.oculus` therefore follows the name rule whether the folder exists or not. The head comment of `ops.ts:45-48` and the `noteLanding` doc (`notes.ts:334-339`) are now true.
5. **The G5 rows in the `client` project: not done, premise wrong.** See the head of this report and case 7 below.
   - The rows stay in `tests/ui/html.test.ts`, run by the `unit` project. Their titles are unchanged.
   - Their bodies now draw through the helper `drawn(text)`, which is `sanitise(parts.html, parts.slots)`, the page's own call (see item 6's second change).
6. **An embed is valid HTML.**
   - `note-render.ts` adds a block-level extension, `noteEmbedLine` (`:71-77`, `:170-183`). An embed alone on its line is a block that ends the paragraph before it, and its slot is `<div class="note-slot">`. An embed inside a line keeps an inline slot.
   - `html.ts` `embedded` (`:537`) draws a block slot as `<div class="embed">` and an inline slot as `<span class="embed">`. Inside a span, `inlineDrawn` (`:550`) draws the embedded note's headings as `<strong>` and its paragraphs as inline text, joined by `<br>`; other blocks are escaped as raw text.
   - A picture or a refused embed alone on its line is wrapped in `<p>`, or is empty.
   - `Markdown.svelte:322-333` styles `.embed` for both elements and `span.embed-head`.
   - **Second change in the same files, the html-sites check.** `sanitise(html, slots?)` (`html.ts:208`) fills the math slots after the profile. `blockMarkdownParts` returns the unsanitised HTML with its slots. `Markdown.svelte` takes `slots` in place of `sanitised` and draws `{@html sanitise(doc.html, slots)}` (`:182`). `RenderedMarkdown.svelte` passes `slots={drawn.slots}`.
7. **Comments refilled at 100 columns:** `workspace/paths.ts:1-5`, `held/answers.ts:1-8`, `relay/relay-route.ts:1-11`, `relay/relay-server.ts:1-7`, `fs/lsp-edit.ts:7-21`.

## The round-1 cases: run on the round-0 tree, then after

How they were run:
- Round-0 tree: `$TMPDIR/d76-after`, a copy of the worktree as round 0 left it. Probe: `$TMPDIR/d76-cases/round1.test.ts` copied to `tests/zz/`, then `npx vitest run tests/zz/round1.test.ts`. Output: scratchpad `r1-before-cases.txt`.
- After: `$TMPDIR/d76-r1`, a copy of the worktree. `diff -rq -x local.yml -x zz` of `src`, `tests` and `config` against the worktree prints nothing. Same probe. Output: scratchpad `r1-after-cases.txt`.
- The probe prints and asserts nothing about the outcome. It is not in the tree.

**Case 1, rename on `[[Kickoff]]` to `Launch`.**
- The server's answer is the same on both trees:
  ```
  CASE 1 server answer: {"documentChanges":[{"kind":"rename","oldUri":"oculus-file:///hub/.oculus/notes/Kickoff.md","newUri":"oculus-file:///hub/.oculus/notes/Launch.md"},{"textDocument":{"uri":"oculus-file:///hub/.oculus/notes/A.md","version":1},"edits":[{"range":{"start":{"line":0,"character":6},"end":{"line":0,"character":13}},"newText":"Launch"}]},{"textDocument":{"uri":"oculus-file:///hub/.oculus/notes/B.md","version":null},"edits":[{"range":{"start":{"line":0,"character":2},"end":{"line":0,"character":9}},"newText":"Launch"}]}]}
  ```
- Round 0:
  ```
  CASE 1 page plan: {"ok":false,"outcome":{"applied":false,"notice":"lsp_edit_structure","words":["oculus-file:///hub/.oculus/notes/Kickoff.md"]}}
  CASE 1 note rename: "no noteRenameOf"
  ```
- After. The probe takes `noteRenameOf`'s answer and makes the three steps that `explorer.rename` makes: `createNoteMoves` asked `moving`, the server operation `rename` through the real `runOps`, then `landed`. That page store needs a running page to be built, so its steps are called directly.
  ```
  CASE 1 page plan: {"ok":false,"outcome":{"applied":false,"notice":"lsp_edit_structure","words":["oculus-file:///hub/.oculus/notes/Kickoff.md"]}}
  CASE 1 note the edit renames: {"item":{"root":"hub","path":".oculus/notes/Kickoff.md"},"name":"Launch.md"}
  CASE 1 link plan: "planned"
  CASE 1 ops rename: {"ok":true,"path":".oculus/notes/Launch.md"}
  CASE 1 landed said: ""
  CASE 1 writes: ["rename .oculus/notes/Kickoff.md -> Launch.md","lsp-edit .oculus/notes/B.md","lsp-edit .oculus/notes/A.md"]
  CASE 1 notes folder after: ["A.md","B.md","Launch.md"]
  CASE 1 A.md after: "See [[Launch]].\n"
  CASE 1 B.md after: "[[Launch]] again\n"
  ```
- Each linking note is written once. The plan alone still refuses the entry, and the source tab routes the edit around it through `noteRenameOf`.
- Look on landing: F2 on `[[Kickoff]]` in a note's source tab on TEST, new name `Launch`.

**Case 2, a rename of a `.ts` file and a create.**
- Round 0 and after, the same:
  ```
  CASE 2 rename of a .ts file: {"ok":false,"outcome":{"applied":false,"notice":"lsp_edit_structure","words":["oculus-file:///hub/src/a.ts"]}}
  CASE 2 create: {"ok":false,"outcome":{"applied":false,"notice":"lsp_edit_structure","words":["oculus-file:///hub/.oculus/notes/New.md"]}}
  ```
- After, in addition:
  ```
  CASE 2 note rename of the .ts rename: null
  CASE 2 note rename of the create: null
  ```

**Case 3, `searchedPaths` over `.oculus` scopes.**
- Round 0:
  ```
  CASE 3 notes folder false scope .oculus: ["./.oculus"]
  CASE 3 notes folder false scope .oculus/workspaces: ["./.oculus/workspaces"]
  CASE 3 notes folder false scope .oculus/notes: ["./.oculus/notes"]
  CASE 3 notes folder true scope .oculus: ["./.oculus/notes"]
  CASE 3 notes folder true scope .oculus/workspaces: null
  CASE 3 notes folder true scope .oculus/notes: ["./.oculus/notes"]
  ```
- After:
  ```
  CASE 3 notes folder false scope .oculus: null
  CASE 3 notes folder false scope .oculus/workspaces: null
  CASE 3 notes folder false scope .oculus/notes: null
  CASE 3 notes folder true scope .oculus: null
  CASE 3 notes folder true scope .oculus/workspaces: null
  CASE 3 notes folder true scope .oculus/notes: ["./.oculus/notes"]
  ```
- `null` is the probe's print of a root that searches no path.
- The brief's row "with a notes folder, scope `.oculus`" expects nothing. Round 0 searched the notes folder there; now it searches nothing.

**Case 4, `--multiline`.**
- Round 0:
  ```
  CASE 4 search args: {"ok":true,"args":["--json","--max-count","101","--max-filesize","2M","--glob","!node_modules","--glob","!.git","--glob","!.svelte-kit","--glob","!.svelte-kit-app","--multiline","--ignore-case","--replace","0${0}","--regexp","a\\nb","."]}
  CASE 4 replace file args: ["--json","--multiline","--ignore-case","--replace","0${0}","--regexp","a\\nb","./x.md"]
  ```
- After:
  ```
  CASE 4 search args: {"ok":true,"args":["--json","--max-count","101","--max-filesize","2M","--glob","!node_modules","--glob","!.git","--glob","!.svelte-kit","--glob","!.svelte-kit-app","--ignore-case","--replace","0${0}","--regexp","a\\nb","."]}
  CASE 4 replace file args: ["--json","--ignore-case","--replace","0${0}","--regexp","a\\nb","./x.md"]
  ```

**Case 5, a tag's search.** The fixture: `A.md` with `#plan` in prose, `B.md` with `#plan` only in a code fence, `C.md` with `tags: [plan]`.
- Round 0:
  ```
  CASE 5 tag rows: ["plan 2"]
  CASE 5 search hits: [".oculus/notes/B.md:2",".oculus/notes/A.md:1",".oculus/notes/C.md:1"]
  CASE 5 kept by the tag index: "no taggedHits"
  ```
- After:
  ```
  CASE 5 tag rows: ["plan 2"]
  CASE 5 pattern: "(?:^|\\s)[*_~]*#plan/*(?:$|[^\\p{L}\\p{N}_/-])|^(?-i:tags):.*?[\\s\\[,'\"#:]plan(?:$|[\\s\\],'\"])|^[ \\t]*-[ \\t]*['\"]?#?plan['\"]?[ \\t]*\\r?$|^[ \\t]*(?:[^\\s,\\[\\]'\"]+[ \\t]*,[ \\t]*)*['\"]?#?plan['\"]?[ \\t]*(?:,|\\]|\\r?$)"
  CASE 5 search hits: [".oculus/notes/A.md:1",".oculus/notes/C.md:2",".oculus/notes/B.md:2"]
  CASE 5 kept by the tag index: [".oculus/notes/A.md:1",".oculus/notes/C.md:2"]
  CASE 5 tag places: [["C.md",[{"tag":"plan","line":1}]],["B.md",[]],["A.md",[{"tag":"plan","line":0}]]]
  ```
- ripgrep alone still finds `B.md` (the fenced line). The kept list is `A.md` and `C.md`, and `C.md` is listed at its `tags:` line (hit line 2, index line 1).

**Case 6, a bad name created in a hub with no `.oculus/notes`.**
- Round 0:
  ```
  CASE 6 create with no notes folder: [{"ok":true,"path":".oculus/notes/Bad:name.md"},["Bad:name.md"]]
  CASE 6 create with a notes folder: {"ok":false,"error":"invalid_name"}
  ```
- After:
  ```
  CASE 6 create with no notes folder: [{"ok":false,"error":"invalid_name"},"(no folder)"]
  CASE 6 create with a notes folder: {"ok":false,"error":"invalid_name"}
  ```

**Case 7, the G5 rows in the `client` project.**
- Round 0, the rows in the unit project (`npx vitest run tests/ui/html.test.ts --reporter verbose`):
  ```
   (check) |unit| tests/ui/html.test.ts > inlineMarkdown > is the sanitiser over the inline renderer, so no field reaches a card around it 4ms
   (check) |unit| tests/ui/html.test.ts > blockMarkdownParts > draws a note link's shown text as text, so no tag it holds reaches the page 6ms
   (check) |unit| tests/ui/html.test.ts > blockMarkdownParts > typesets a formula's words as text, and a link it asks for as no link 5ms
        Tests  3 passed (3)
  ```
  (vitest prints a check mark where `(check)` stands.)
- The `client` project, a scratch probe `tests/zz/purify.client.test.ts` that calls `sanitise('<b style="color:red">x</b><script>1</script>')` and reports DOMPurify's state:
  ```
  {"isSupported":false,"sanitize":"undefined","window":"undefined","document":"undefined","out":"<b style=\"color:red\">x</b><script>1</script>"}
  ```
- After, the rows in the worktree, the same command: the same three titles, `Tests  3 passed (3)`.
- The case cannot show `style` stripped or the slot spans kept by DOMPurify in any project the repository has. See the head of this report for what would.

**Case 8, the rendered HTML of an embed.**
- Round 0:
  ```
  CASE 8 render "![[Kickoff]]": "<p><div class=\"embed\"><div class=\"embed-head\"><a class=\"wikilink\" href=\"#note=Kickoff\">Kickoff</a></div><h1 id=\"user-content-kickoff\">Kickoff</h1>\n<p>Intro.</p>\n</div></p>\n"
  CASE 8 render "see ![[Kickoff]] here": "<p>see <div class=\"embed\"><div class=\"embed-head\"><a class=\"wikilink\" href=\"#note=Kickoff\">Kickoff</a></div><h1 id=\"user-content-kickoff\">Kickoff</h1>\n<p>Intro.</p>\n</div> here</p>\n"
  ```
- After:
  ```
  CASE 8 render "![[Kickoff]]": "<div class=\"embed\"><div class=\"embed-head\"><a class=\"wikilink\" href=\"#note=Kickoff\">Kickoff</a></div><h1 id=\"user-content-kickoff\">Kickoff</h1>\n<p>Intro.</p>\n</div>\n"
  CASE 8 render "see ![[Kickoff]] here": "<p>see <span class=\"embed\"><span class=\"embed-head\"><a class=\"wikilink\" href=\"#note=Kickoff\">Kickoff</a></span><strong>Kickoff</strong><br>Intro.</span> here</p>\n"
  CASE 8 render "text\n![[Kickoff]]\nmore": "<p>text</p>\n<div class=\"embed\"><div class=\"embed-head\"><a class=\"wikilink\" href=\"#note=Kickoff\">Kickoff</a></div><h1 id=\"user-content-kickoff\">Kickoff</h1>\n<p>Intro.</p>\n</div>\n<p>more</p>\n"
  CASE 8 render "- ![[Kickoff]]": "<ul>\n<li><div class=\"embed\"><div class=\"embed-head\"><a class=\"wikilink\" href=\"#note=Kickoff\">Kickoff</a></div><h1 id=\"user-content-kickoff\">Kickoff</h1>\n<p>Intro.</p>\n</div>\n</li>\n</ul>\n"
  CASE 8 render "```\n![[Kickoff]]\n```": "<pre><code>![[Kickoff]]\n</code></pre>"
  CASE 8 render "![[Nowhere]]": "<p><a class=\"wikilink unresolved\" href=\"#note=Nowhere\">Nowhere</a></p>\n"
  CASE 8 render "![[../x]]": ""
  ```
- Look on landing: a note on TEST holding both lines.

**Case 9, the five comments.** The first line of each, its length, and the length it would reach with the next word:
- Round 0:
  ```
  src/lib/server/files/workspace/paths.ts:2: 78 cols; next line starts with "hub's" (6 more cols would make 84)
  src/lib/server/machine/lsp/held/answers.ts:3: 66 cols; next line starts with "holds" (6 more cols would make 72)
  src/lib/server/machine/lsp/relay/relay-route.ts:6: 81 cols; next line starts with "request" (8 more cols would make 89)
  src/lib/server/machine/lsp/relay/relay-server.ts:3: 87 cols; next line starts with "of" (3 more cols would make 90)
  src/lib/server/files/fs/lsp-edit.ts:14: 77 cols; next line starts with "`missing`," (11 more cols would make 88)
  ```
- After:
  ```
  src/lib/server/files/workspace/paths.ts:2: 95 cols; next line starts with "folder." (8 more cols would make 103)
  src/lib/server/machine/lsp/held/answers.ts:3: 94 cols; next line starts with "reference" (10 more cols would make 104)
  src/lib/server/machine/lsp/relay/relay-route.ts:6: 99 cols; next line starts with "workspace" (10 more cols would make 109)
  src/lib/server/machine/lsp/relay/relay-server.ts:3: 100 cols; next line starts with "client," (8 more cols would make 108)
  src/lib/server/files/fs/lsp-edit.ts:14: 97 cols; next line starts with "(the" (5 more cols would make 102)
  ```

**The html-sites check (G5), round 0 against after.**
- Round 0: `npx vitest run tests/checks/source/html-sites.test.ts` failed, naming `views/shared/prose/Markdown.svelte: sanitised ? doc.html : sanitise(doc.html)`. The base passes it 19 of 19.
- After: `Test Files  1 passed (1)`, `Tests  19 passed (19)`.

**Case 3 and case 6 of round 0, run again as the round asks.** Probe `tests/zz/r1extra.test.ts` in `$TMPDIR/d76-r1`. Its trash moves the file into a scratch trash folder instead of the system Trash. Output: scratchpad `r1-extra.txt`.
```
CASE 3 create "  Kickoff  .md": [{"ok":true,"path":".oculus/notes/Kickoff.md"},["Kickoff.md","Old.md"]]
CASE 6 trash Kickoff.md: [true,["Old.md"],["Kickoff.md"]]
```
`  Kickoff  ` is written as `Kickoff.md`, trimmed. The trashed note leaves the notes folder and is in the trash folder.

## The step's cases (round 0), on the tree as it is now

The round-0 probe (`tests/zz/after.test.ts`, `tests/zz/case42.test.ts`) was run again on `$TMPDIR/d76-r1`, which matches the worktree. Two changes were made to the probe copy:
- It draws a render through `sanitise(parts.html, parts.slots)`, the page's call, since `blockMarkdownParts` now returns the HTML before the sanitiser.
- Its `out` appends to a file, and one line is added: case 38's hits kept by the tag index.

Output: scratchpad `r1-round0cases-after.txt` and `r1-case38-after.txt`. The run ends `Tests  4 failed | 15 passed (19)`. The four failures are "expected any number of assertion, but got none": `it` blocks that print and assert nothing (cases 8, 17, 24 and 40 to 42). The probe escapes a character outside ASCII as `<U+...>`, and one of its two escapers leaves out the zero padding, so `<U+DC>` means U+00DC.

Below, each case gives the unchanged tree's output ("Before"), taken from the base copy `$TMPDIR/d76-before`, and then the output of the run above ("After"). Every After line is identical to round 0's except in cases 36, 38 and 39, where this round changed the output.

**Case 1 (look).**
- Before, a reading of `src/lib/views/sources/files/sections/Sections.svelte`: New Note opened the `note` view with an id and wrote no file named by a title (`42: import { noteId } from '$lib/state/life/notes';`, `123: openView('note', { id: noteId(new Date()), fresh: true });`).
- After:
  ```
  CASE 1 answer: {"ok":true,"path":".oculus/notes/Meeting 2026-10-13.md"}
  CASE 1 folder: ["Meeting 2026-10-13.md","Old.md"]
  CASE 1 bytes: ""
  ```
- Look on landing: the Files view's Notes section on TEST. Press New Note, type `Meeting 2026-10-13` and press Enter. The file should appear as a row and open in a source tab with its rendered half, and the Outline should follow that tab. Escape in the input row should make nothing.

**Cases 2, 3 and 4.**
- Before, the old id rule (`noteFile`):
  ```
  CASE 2-4: [["BT-FNO: ideas","refused"],["Ward [draft]","refused"],["a/b","refused"],["#todo","refused"],["x|y","refused"],[".hidden","refused"],["   ","refused"],["201 chars","refused"],["Uber notes","refused"],["<U+00DC>ber notes","refused"],["Notes (v2)","refused"],["2026-10-13","accepted"],["Paper - review","refused"],["  Kickoff  ","refused"],["Meeting 2026-10-13","refused"],["kickoff","accepted"]]
  ```
- After, each name through the Notes tree's typed check (`typedRefusal`), the server create into a folder that holds `Kickoff.md`, and the rule's sentence (`noteName`):
  ```
  CASE 2-4 creates: [["typed: A note's name cannot hold :.","\"BT-FNO: ideas\"","invalid_name","A note's name cannot hold :."],["typed: A note's name cannot hold [.","\"Ward [draft]\"","invalid_name","A note's name cannot hold [."],["typed: A note's name cannot hold /.","\"a/b\"","written","A note's name cannot hold /."],["typed: A note's name cannot hold #.","\"#todo\"","invalid_name","A note's name cannot hold #."],["typed: A note's name cannot hold |.","\"x|y\"","invalid_name","A note's name cannot hold |."],["typed: A note's name cannot start with a dot.","\".hidden\"","invalid_name","A note's name cannot start with a dot."],["typed: A note needs a name.","\"   \"","invalid_name","A note needs a name."],["typed: A note's name is at most 200 characters long.","201 chars","invalid_name","A note's name is at most 200 characters long."],["typed: taken by the rule","\"Uber notes\"","written",""],["typed: taken by the rule","\"<U+00DC>ber notes\"","written",""],["typed: taken by the rule","\"Notes (v2)\"","written",""],["typed: taken by the rule","\"2026-10-13\"","written",""],["typed: taken by the rule","\"Paper - review\"","written",""],["typed: taken by the rule","\"  Spaced  \"","written",""],["typed: taken by the rule","\"kickoff\"","exists",""],["typed: taken by the rule","\"U<U+0308>ber notes\"","exists",""]]
  CASE 2-4 folder: ["2026-10-13.md","Kickoff.md","Notes (v2).md","Paper - review.md","Spaced.md","Uber notes.md","a","<U+DC>ber notes.md"]
  CASE 4 rename case only: [true,["Kickoff.md"]]
  ```
- How to read this output:
  - "taken by the rule" is the probe's label for a name the rule accepts.
  - This fixture holds `Kickoff.md` for case 4, so the probe runs the trimming row as `  Spaced  `. The case's own `  Kickoff  ` is run in the round-1 section above and is written as `Kickoff.md`.
  - The Notes tree refuses `a/b` as typed. The server create of `a/b.md` makes a folder `a` holding the note `b` (judgment call 2).
  - The NFD spelling `U<U+0308>ber notes` beside the NFC one is refused as `exists`, and so is `kickoff` beside `Kickoff.md`. A case-only rename is allowed.

**Case 5.**
- Before, a reading of `src/lib/state/sessions/source/autosave.svelte.ts:146`: `if (options?.autosave !== 'after_delay') return;`. A note had no wait of its own.
- After: G60's rows in `tests/state/sessions/autosave.client.test.ts` pass (test:quick). On the unchanged tree three of them fail:
  ```
   FAIL  |client| tests/state/sessions/autosave.client.test.ts > the autosave store > 'saves a note once, notes.autosave_ms <U+2026>'
  AssertionError: expected [] to have a length of 1 but got +0
   FAIL  |client| tests/state/sessions/autosave.client.test.ts > the autosave store > 'starts a note\'s wait again at each e<U+2026>'
   FAIL  |client| tests/state/sessions/autosave.client.test.ts > the autosave store > 'under off saves a note\'s tab first o<U+2026>'
   FAIL  |client| tests/state/sessions/autosave.client.test.ts > the autosave store > 'writes nothing for a note whose file <U+2026>'
  TypeError: env.autosave.drop is not a function
        Tests  4 failed | 24 passed (28)
  ```
- Look on landing: a note's source tab on TEST with `editor.autosave: off`. Type a line and wait. The unsaved mark should clear about 0.8 s after the last key, and the file should hold the line.

**Case 6 (look for the confirm).**
- Before, a reading of `src/lib/server/files/fs/notes.ts:186` in the base: `rmSync(file, { force: true });`.
- After: the round-1 run above, with a trash that moves the file: `CASE 6 trash Kickoff.md: [true,["Old.md"],["Kickoff.md"]]`. The round-0 probe's own trash is `() => Promise.resolve()`, which moves nothing, so its line `CASE 6 trash: [true,["A.md"]]` shows only that the operation answered ok.
- Look on landing: Move to Trash on a note in the Notes section on TEST. The Explorer's question should show. After yes, the tab closes, the file is in the Trash, and History's Undo puts it back.

**Case 7 (look).**
- Before: `src/lib/views/sources/note/Note.svelte:7: id: 'note',`.
- After: `src/lib/views/sources/note/` and `config/text/views/sources/note.yml` are gone, and `grep -rn "openView('note'"` over `src` prints nothing.
- Look on landing: a saved layout naming a `note` tab should draw the unknown view in that tab and the rest of the page as saved.

**Case 8.**
- Before: `CASE 8 checkLocal: null`, `CASE 8 perOculus: "/elsewhere"`.
- After:
  ```
  CASE 8 checkLocal: null
  CASE 8 readLocalText unknown: ["notes"]
  CASE 8 perOculus keys: ["bookmarks","schedules","appsDir"]
  CASE 8 notesFolderOf: "/hub/.oculus/notes"
  ```
- `checkLocal` returns null for every save, so it names no unknown key; `readLocal` (`readLocalText`) does, and after the change it names `notes`.

**Case 9.**
- Before:
  ```
  CASE 9 list: ["b","c","a"]
  CASE 9 write: null
  CASE 9 file: {"version":1,"order":["b","a","c"]}
  CASE 9 subfolder note listed: ["b","a","c"]
  CASE 9 unreadable: "notes-order-unreadable"
  CASE 9 bytes: "{"
  ```
- After:
  ```
  CASE 9 list: ["b.md","c.md","a.md"]
  CASE 9 Alt+Up on a: ["b","a","c"]
  CASE 9 write: null
  CASE 9 file: {"version":1,"order":["b","a","c"]}
  CASE 9 list after: ["b.md","a.md","c.md"]
  CASE 9 drag a onto sub: [true,["sub/a.md","b.md","c.md"]]
  CASE 9 drag onto folder holding the name: {"ok":false,"error":"exists","done":[],"failed":".oculus/notes/b2.md"}
  CASE 9 landing: {"refused":"exists"}
  CASE 9 unreadable: "notes-order-unreadable"
  CASE 9 bytes: "{"
  ```
- The taken-name drag moves `b2.md` onto `sub/` holding `B2.md`, which also shows the letter-case rule.

**Case 10.**
- Before: there was no note wait and no `drop` (case 5's `TypeError`).
- After: `pageNotes` in `src/lib/state/sources/explorer/notes/note-hooks.ts:80-91` calls `autosave.drop(tab.id)` and then `layout.closeInstance(tab.id)` for each tab of a removed note. G60's row 'writes nothing for a note whose file was removed while its save waited' and G28's row "under off saves a note's tab first on a close" pass.
- A rename or a move: the tab follows through the Explorer's follow of a renamed file. The waiting save is keyed by the tab, so it writes to the new path. This is from reading the code; no run shows it.
- Look on landing: type in a note's tab, then within 0.8 s rename the note. The tab should name the new file and the text should be saved there. Type again and Move to Trash within 0.8 s: the tab closes and nothing is written.

**Case 11.**
- Before: `CASE 11 listNotes through link: ["x"]`.
- After:
  ```
  CASE 11 folder link: ["refused",0]
  CASE 11 group rows: ["linked","The notes folder of this hub is a link to a folder outside it, so it is not read."]
  CASE 11 note link listed: ["in.md"]
  CASE 11 serveFile of the link: 404
  ```

**Case 12 (look).**
- Before: `grep -c -i wiki` over the base's `src/lib/server/machine/lsp/adapters/markdown/` printed `0`.
- After:
  ```
  CASE 12 [[Me: ["A","B","C","D","E","Meeting 2026-10-13"]
  CASE 12 [[Meeting 2026-10-13#: ["Meeting","Decisions"]
  ```
- Look on landing: in a note on TEST, `[[Me` should offer `Meeting 2026-10-13`, `[[Meeting 2026-10-13#` its headings, and `[text](` files.

**Case 13.** Before: no wiki code. After:
```
CASE 13 definition lower case: [{"uri":"oculus-file:///hub/.oculus/notes/Meeting%202026-10-13.md","range":{"start":{"line":0,"character":0},"end":{"line":0,"character":0}}}]
CASE 13 definition heading: [{"uri":"oculus-file:///hub/.oculus/notes/Meeting%202026-10-13.md","range":{"start":{"line":2,"character":0},"end":{"line":2,"character":0}}}]
```

**Case 14.** Before: no wiki code. After:
```
CASE 14 references from the note: [{"uri":"oculus-file:///hub/.oculus/notes/A.md","range":{"start":{"line":0,"character":4},"end":{"line":0,"character":26}}},{"uri":"oculus-file:///hub/.oculus/notes/A.md","range":{"start":{"line":0,"character":31},"end":{"line":0,"character":72}}},{"uri":"oculus-file:///hub/.oculus/notes/B.md","range":{"start":{"line":0,"character":8},"end":{"line":0,"character":30}}},{"uri":"oculus-file:///hub/.oculus/notes/E.md","range":{"start":{"line":0,"character":0},"end":{"line":0,"character":22}}},{"uri":"oculus-file:///hub/.oculus/notes/E.md","range":{"start":{"line":0,"character":23},"end":{"line":0,"character":55}}}]
```
A second hub's note linking the same name is not in the list.

**Case 15.**
- Before: no wiki code.
- After, the server's answer and the Notes tree's own plan:
  ```
  CASE 15 rename: {"result":{"documentChanges":[{"kind":"rename","oldUri":"oculus-file:///hub/.oculus/notes/Meeting%202026-10-13.md","newUri":"oculus-file:///hub/.oculus/notes/Kickoff.md"},{"textDocument":{"uri":"oculus-file:///hub/.oculus/notes/A.md","version":3},"edits":[{"range":{"start":{"line":0,"character":6},"end":{"line":0,"character":24}},"newText":"Kickoff"},{"range":{"start":{"line":0,"character":33},"end":{"line":0,"character":51}},"newText":"Kickoff"}]},{"textDocument":{"uri":"oculus-file:///hub/.oculus/notes/B.md","version":3},"edits":[{"range":{"start":{"line":0,"character":10},"end":{"line":0,"character":28}},"newText":"Kickoff"}]},{"textDocument":{"uri":"oculus-file:///hub/.oculus/notes/E.md","version":3},"edits":[{"range":{"start":{"line":0,"character":2},"end":{"line":0,"character":20}},"newText":"Kickoff"},{"range":{"start":{"line":0,"character":25},"end":{"line":0,"character":43}},"newText":"Kickoff"}]}]}}
  CASE 15 other hub untouched: "[[Meeting 2026-10-13]]\n"
  CASE 15/19 rename edits: [["A.md",[{"range":{"start":{"line":0,"character":2},"end":{"line":0,"character":20}},"newText":"Kickoff"},{"range":{"start":{"line":0,"character":25},"end":{"line":0,"character":43}},"newText":"Kickoff"}]]]
  ```
- The page makes that answer as the note rename (round-1 case 1). G8's row "writes the edit of a note of a hub's notes folder, and refuses a file of another .oculus folder as outside" passes. On the unchanged tree it failed at `tests/routes/replace/lsp-edit.test.ts:57:30`.

**Case 16.** Before: no wiki code. After: `CASE 16 rename Kick:off: {"error":{"code":-32803,"message":"A note's name cannot hold :."}}`. A rewrite refused because a linking note is open in another page's tab, by reading only: `createNoteMoves` calls the edit plan first; the plan refuses a file open in another page's tab and names it; the move then returns the refusal and `/api/ops` is never called.

**Case 17.** After:
```
CASE 17 [[Plan]]: "x/Plan.md"
CASE 17 [[y/z/Plan]]: "y/z/Plan.md"
CASE 17 move unique a into sub: []
CASE 17 move second a into other: [["L.md",[{"range":{"start":{"line":0,"character":12},"end":{"line":0,"character":13}},"newText":"other/a"}]]]
```

**Case 18 (look).**
- Before: `CASE render "See [[Kickoff|the kickoff]] and [[Nowhere]]": "<p>See [[Kickoff|the kickoff]] and [[Nowhere]]</p>\n"`.
- After:
  ```
  CASE render "See [[Kickoff|the kickoff]] and [[Nowhere]]": "<p>See <a class=\"wikilink\" href=\"#note=Kickoff\">the kickoff</a> and <a class=\"wikilink unresolved\" href=\"#note=Nowhere\">Nowhere</a></p>\n"
  CASE render "[[a:b]]": "<p><a class=\"wikilink unresolved\" href=\"#note=a%3Ab\" title=\"A note's name cannot hold :.\">a:b</a></p>\n"
  CASE 18 press Kickoff: {"kind":"open","root":"hub","path":".oculus/notes/Kickoff.md","heading":""}
  CASE 18 press Nowhere: {"kind":"make","root":"hub","path":".oculus/notes/Nowhere.md","into":".oculus/notes","name":"Nowhere.md"}
  CASE 18 press sub/Nowhere: {"kind":"make","root":"hub","path":".oculus/notes/sub/Nowhere.md","into":".oculus/notes","name":"sub/Nowhere.md"}
  CASE 18 press a:b: {"kind":"refused","sentence":"A note's name cannot hold :."}
  ```
- Look on landing: `the kickoff` opens `Kickoff.md`; `Nowhere` has a dashed underline and a press makes and opens it; `[[a:b]]` shows the warning notice and makes nothing.

**Case 19.**
- Before, the table: `<td>[[Kickoff|kick]]</td>`.
- After:
  ```
  CASE render "`[[Kickoff]]` and\n\n```\n[[Kickoff]]\n```": "<p><code>[[Kickoff]]</code> and</p>\n<pre><code>[[Kickoff]]\n</code></pre>"
  CASE render "| a |\n| - |\n| [[Kickoff\\|kick]] |": "<table>\n<thead>\n<tr>\n<th>a</th>\n</tr>\n</thead>\n<tbody><tr>\n<td><a class=\"wikilink\" href=\"#note=Kickoff\">kick</a></td>\n</tr>\n</tbody></table>\n"
  ```

**Case 20.**
- Before, the five places that kept every dot folder out (`places.ts:87`, `watch.ts:120`, `watch.ts:249`, `lsp-edit.ts:65`, `edits.ts:179` of the base).
- After, the real Markdown server through the relay:
  ```
  CASE 20 links answer: [{"oculus":"links_answer","id":7,"edit":{"documentChanges":[{"textDocument":{"uri":"oculus-file:///hub/.oculus/notes/A.md","version":null},"edits":[{"range":{"start":{"line":0,"character":11},"end":{"line":0,"character":21}},"newText":"Plan.md"}]}]},"held":[],"overlaps":[],"unanswered":[]}]
  CASE 20 file uri: "file://<hub>/.oculus/notes/A.md"
  ```

**Case 21.** After:
```
CASE render "[[Q&A 50% done?]]": "<p><a class=\"wikilink\" href=\"#note=Q%26A%2050%25%20done%3F\">Q&amp;A 50% done?</a></p>\n"
CASE 21 href and back: ["#note=Q%26A%2050%25%20done%3F",{"name":"Q&A 50% done?","heading":""},{"kind":"open","root":"hub","path":".oculus/notes/Q&A 50% done?.md","heading":""}]
```

**Case 22.**
- Before: `CASE render "[[x|<img src=x onerror=alert(1)>]]": "<p>[[x|<img src=x onerror=alert(1)>]]</p>\n"`.
- After: `CASE render "[[x|<img src=x onerror=alert(1)>]]": "<p><a class=\"wikilink unresolved\" href=\"#note=x\">&lt;img src=x onerror=alert(1)&gt;</a></p>\n"`. The link's words are escaped by the renderer itself, so this holds without DOMPurify.

**Case 23 (look).** After:
```
CASE 23 backlinks of Kickoff: [{"path":"B.md","title":"B","line":3,"text":"see [[Kickoff]]"},{"path":"A.md","title":"A","line":1,"text":"[[Kickoff]] and #paper/draft #idea"}]
```
The hub's `README.md`, which holds `[[Kickoff]]`, is not listed. Look on landing: Backlinks on TEST with `Kickoff.md`'s tab looked at last; with `README.md`, "The open file is not a note."; with no file tab, "No file is open."

**Case 24.**
- Before: `CASE 24: ["editors","files","outline","ast","memory","timeline","bookmarks","notes"]`.
- After: `CASE 24: ["editors","files","outline","backlinks","ast","memory","timeline","bookmarks","notes","tags"]`.

**Case 25 (look).** After:
```
CASE 25 graph research-hub: {"nodes":["M","B","A","Kickoff"],"edges":["research-hub/B.md -> research-hub/Kickoff.md","research-hub/A.md -> research-hub/Kickoff.md"]}
CASE 25 graph cathedra: {"nodes":["D","B"],"edges":["cathedra/D.md -> cathedra/B.md"]}
CASE 25 filter hubs: ["research-hub","cathedra"]
```
Look on landing: Notes Graph on TEST from the catalogue and from the Notes head's Graph control.

**Case 26.** After: `CASE 26 filter naming a gone hub: 6`, every note of both hubs.

**Case 27.** After:
```
CASE 27/30 groups: [["research-hub",true,"ok"],["cathedra",false,"none"]]
CASE 27 no hub: ["No folder of this workspace is a hub, so there are no notes."]
```

**Case 28.** After:
```
CASE 28 rows: ["research-hub|0|research-hub","research-hub|1|R.md","cathedra|0|cathedra","cathedra|1|No note yet."]
CASE 28 making in a hub with no folder: {"into":".oculus","name":"notes/First.md"}
CASE 28 create: [true,["First.md"]]
```

**Case 29.** By reading only (`fs.svelte.ts:23-26`, `:357-358`, `:425-426`): the notes are read again when a files message names a folder in or above a hub's notes folder. Look on landing: write `.oculus/notes/Outside.md` from a terminal; it should appear in the Notes section and the Notes Graph.

**Case 30.** After: the same groups line as case 27. The probe's third entry names research-hub's folder again and is read once.

**Case 31.**
- Before: `"--fixed-strings","--ignore-case","--regexp","word","."` with no `--hidden`, so no note was searched.
- After: `CASE 31 word search: [".oculus/notes/B.md"]`, over a hub holding the word also in `.oculus/config.yml`, `.oculus/local.yml`, `.oculus/workspaces/x.yml` and `secrets/s.txt`.

**Case 32.** After: `CASE 32 replace over a note: [true,"---\ntags: [idea]\n---\nidea text WORD\n"]`. `tests/server/files/search.test.ts` (G2) is unchanged and passed in test:quick.

**Cases 33 and 34.** After, with the clock at 2026-10-13 14:15:00:
```
CASE 33/34 answers: [{"inserted":"![[Pasted image 20261013141500.png]]","said":""},{"inserted":"![[Pasted image 20261013141500 2.png]]","said":""},{"inserted":"![[photo.jpg]]","said":"big.bin was not uploaded: That file is larger than an upload may be."}]
CASE 33/34 writes: ["create .oculus/notes attachments true","upload .oculus/notes/attachments/Pasted image 20261013141500.png","upload .oculus/notes/attachments/Pasted image 20261013141500 1.png -> exists","upload .oculus/notes/attachments/Pasted image 20261013141500 2.png","upload .oculus/notes/attachments/photo.jpg"]
```
Look on landing: paste a screenshot into a note's tab on TEST. A drop from Finder cannot be made on TEST; the run above is its proof.

**Case 35.** By reading `src/lib/views/sources/source/Editor.svelte:264-292`: `pasted` returns at once, leaving the paste to Monaco, when the file is no note or the clipboard holds no image; `dropped` does the same unless the file is a note and the drag carries files.

**Case 36 (look). Changed this round.**
- Before: `CASE render "![[Kickoff]] ![[gone.png]]": "<p>![[Kickoff]] ![[gone.png]]</p>\n"`.
- After:
  ```
  CASE render "![[Kickoff]]": "<div class=\"embed\"><div class=\"embed-head\"><a class=\"wikilink\" href=\"#note=Kickoff\">Kickoff</a></div><h1 id=\"user-content-kickoff\">Kickoff</h1>\n<p>Intro.</p>\n<h2 id=\"user-content-decisions\">Decisions</h2>\n<p>Decided.</p>\n<h2 id=\"user-content-later\">Later</h2>\n<p>Later.</p>\n</div>\n"
  CASE render "![[Kickoff#Decisions]]": "<div class=\"embed\"><div class=\"embed-head\"><a class=\"wikilink\" href=\"#note=Kickoff%23Decisions\">Kickoff</a></div><h2 id=\"user-content-decisions\">Decisions</h2>\n<p>Decided.</p>\n</div>\n"
  CASE render "![[A]]": "<div class=\"embed\"><div class=\"embed-head\"><a class=\"wikilink\" href=\"#note=A\">A</a></div><p><a class=\"wikilink\" href=\"#note=B\">B</a></p>\n</div>\n"
  CASE render "![[gone.png]]": "<p><a class=\"wikilink unresolved\" href=\"#note=gone.png\">gone.png</a></p>\n"
  ```
- `![[A]]` is drawn inside `B.md`, which `A` embeds, so it stops at the second level with `B` as a link.

**Case 37.** After:
```
CASE render "![[x.svg]]": "<p><img src=\"/api/file/hub/.oculus/notes/attachments/x.svg\" alt=\"x.svg\"></p>\n"
CASE render "![[../../config.yml]] ![[/etc/hosts]]": "<p> </p>\n"
CASE 37: [200,{"cache-control":"private, max-age=60","content-security-policy":"default-src 'none'; style-src 'unsafe-inline'","content-type":"image/svg+xml","x-content-type-options":"nosniff"}]
```

**Case 38. Changed this round.**
- Before: `CASE render "#idea #paper/draft #123": "<p>#idea #paper/draft #123</p>\n"`, and there was no Tags section.
- After:
  ```
  CASE 38 tag rows: ["idea 3","paper -","  draft 1"]
  CASE 38 pattern: "(?:^|\\s)[*_~]*#idea/*(?:$|[^\\p{L}\\p{N}_/-])|^(?-i:tags):.*?[\\s\\[,'\"#:]idea(?:$|[\\s\\],'\"])|^[ \\t]*-[ \\t]*['\"]?#?idea['\"]?[ \\t]*\\r?$|^[ \\t]*(?:[^\\s,\\[\\]'\"]+[ \\t]*,[ \\t]*)*['\"]?#?idea['\"]?[ \\t]*(?:,|\\]|\\r?$)"
  CASE 38 under: ".oculus/notes"
  CASE 38 tag search: ["research-hub/.oculus/notes/A.md","research-hub/.oculus/notes/B.md","cathedra/.oculus/notes/C.md"]
  CASE 38 tag search kept by the tag index: ["research-hub/.oculus/notes/A.md:1","research-hub/.oculus/notes/B.md:2","cathedra/.oculus/notes/C.md:1"]
  ```
- The count is 3 because the probe's hubs hold three notes with `idea`. Every hit here is on an indexed line, so all are kept. `E.md` (`#ideas only`) is not found. Case 5 of round 1 shows a hit that is dropped.
- Look on landing: a press on `idea` in the Tags section on TEST opens Search with "In the notes of every hub" and lists the counted notes.

**Case 39. Changed this round (the scan's shape).** After:
```
CASE render "#idea #paper/draft #123 `#code` https://x.org/#frag [[note#heading]]\n\n# Title": "<p><a class=\"note-tag\" href=\"#tag=idea\">#idea</a> <a class=\"note-tag\" href=\"#tag=paper%2Fdraft\">#paper/draft</a> #123 <code>#code</code> <a href=\"https://x.org/#frag\">https://x.org/#frag</a> <a class=\"wikilink unresolved\" href=\"#note=note%23heading\">note &gt; heading</a></p>\n<h1 id=\"user-content-title\">Title</h1>\n"
CASE 39 scan tags: [{"tag":"idea","line":4}]
```

**Case 40 (look).**
- Before: `$e^{i\pi}+1=0$` and `$$\int_0^1 x\,dx$$` shown as text.
- After (the probe prints the first 120 characters, then three flags):
  ```
  CASE math "$e^{i\\pi}+1=0$": "<p><span class=\"katex\"><span class=\"katex-mathml\"><math xmlns=\"http://www.w3.org/1998/Math/MathML\"><semantics><mrow><msu ... katex:true cc0000:false ParseError:false"
  CASE math "$$\\int_0^1 x\\,dx$$": "<p><span class=\"katex-display\"><span class=\"katex\"><span class=\"katex-mathml\"><math xmlns=\"http://www.w3.org/1998/Math/M ... katex:true cc0000:false ParseError:false"
  ```
- Look on landing: both formulas typeset in a source tab's rendered half and in the Markdown Preview.

**Case 41.** After:
```
CASE math "$\\frac{1}{$": "<p><span class=\"math-error\" title=\"This formula could not be typeset.\">$\\frac{1}{$</span></p>\n"
CASE math "$5 and $10": "<p>$5 and $10</p>\n"
CASE math "`$x$`": "<p><code>$x$</code></p>\n"
```
`span.math-error` is styled at `src/lib/views/shared/prose/Markdown.svelte:334`.

**Case 42.**
- After:
  ```
  CASE math "$\\text{<img src=x onerror=alert(1)>}$": "<p><span class=\"katex\"><span class=\"katex-mathml\"><math xmlns=\"http://www.w3.org/1998/Math/MathML\"><semantics><mrow><mte ... katex:true cc0000:false ParseError:false"
  CASE math "<p style=\"color:red\">styled</p>": "<p style=\"color:red\">styled</p>"
  CASE 42 "$\\text{<img src=x onerror=alert(1)>}$": <img false <script false onerror= true escaped true
  CASE 42 "$\\text{<script>alert(1)</script>}$": <img false <script false onerror= false escaped true
  ```
- No `<img` and no `<script` tag is drawn. `onerror=` appears only inside the escaped words of the formula. KaTeX escapes them; DOMPurify does not run.
- The `style` on the hub text is kept because DOMPurify does not run in node. No run in this repository shows `style` stripped (item 5).
- `PROFILE` is unchanged against the base (the `diff` of the two `PROFILE` blocks exits 0).

## DONE / NOT DONE

| Item or part | State | Proof |
| --- | --- | --- |
| Round 1, item 1, rename on a link | DONE | round-1 cases 1 and 2 |
| Round 1, item 2, `.oculus` scopes | DONE | round-1 case 3 |
| Round 1, item 3, no `--multiline`, tag search kept | DONE | round-1 cases 4 and 5, case 38 |
| Round 1, item 4, name rule with no folder | DONE | round-1 case 6 |
| Round 1, item 5, G5 rows in `client` | NOT DONE | round-1 case 7; premise wrong |
| Round 1, item 6, embed block or span | DONE | round-1 case 8, case 36 |
| Round 1, item 7, five comments | DONE | round-1 case 9 |
| html-sites check (G5) | DONE | `Tests  19 passed (19)` |
| Parts 1 to 9 of the step | DONE | the step's cases above |
| Documents | DONE | `npm run diagrams`, `npm run docs:palette`, read below |

The verify list, each command run from `tools/oculus` in the worktree after the round's last change. The last code change was the eslint fix after full-list run 1. The scratchpad file of each output is named in brackets.

1. `npm run test:quick` (`r1-v2-quick.txt`), exit 0:
   ```
   ok      prettier (0.7 s): All matched files use Prettier code style!
   ok      ASCII gate (0.7 s)
   ok      svelte-kit sync (2.0 s)
   ok      eslint (1.4 s)
   ok      svelte-check (5.8 s): 1791972348911 COMPLETED 502 FILES 0 ERRORS 0 WARNINGS 0 FILES_WITH_PROBLEMS
   ok      vitest (47.5 s): Duration  42.97s (transform 45.20s, setup 0ms, import 73.65s, tests 88.91s, environment 933ms)
   test:quick: 48.3 s (limit 45.0 s); every command passed
   test:quick: over the time limit
   ```
   In full-list run 1, test:quick was red on eslint: `no-unnecessary-condition` at `note-links.ts:241` and `:244`, and `prefer-optional-chain` at `edits.ts:210`. Those lines are fixed. test:quick rerun alone printed "test:quick: 71.4 s (limit 45.0 s); every command passed" (`r1-quick-rerun.txt`), and full-list run 2 followed.
2. `npm run diagrams`, exit 0 (`r1-v2-diagrams.txt`). It writes the 18 files `docs/diagrams/layers.dot` to `docs/diagrams/writes.svg`.
3. `npm run docs:palette`, exit 0, `docs/palette.md` (`r1-v2-palette.txt`).
4. The checks command, `npx vitest run tests/checks/source/keys.test.ts tests/checks/diagrams tests/checks/tree tests/checks/config --testTimeout 0 --hookTimeout 0`, exit 1 (`r1-v2-checks.txt`):
   ```
    FAIL  |unit| tests/checks/config/config-folder.test.ts > oculus's own config directory > gives every group a chord and a glyph, and no letter a key the workbench binds
    FAIL  |unit| tests/checks/config/config-folder.test.ts > oculus's own config directory > names a group of its own and a path under the hub for every document
    FAIL  |unit| tests/checks/config/integrity.test.ts > the real hub > validates with no findings
    Test Files  2 failed | 8 passed (10)
         Tests  3 failed | 190 passed (193)
   ```
   These are the same three rows as round 0. The second and third read the hub's own `.oculus/`, which the sparse worktree does not hold; the brief names both as passing only on main. The first fails identically on the unchanged tree (`config-folder.test.ts:502:67`). Its cause is base `config/layout.yml:36`, where `apps` has no `chord`; main has `chord: a`.
5. `sh utils/folder-check.sh`: exit 0, no output. `sh utils/size-check.sh`: exit 0, no output.
6. `sh utils/unused-exports.sh`: exit 0. The lines not in `.agents/worktrees/D76-base/unused-exports.txt` (`comm -13` of the sorted files) are the same six as round 0. Each is a base line with names removed or the file moved:
   ```
   src/lib/data/prose/markdown/markdown.ts: TOC_MARK, TOC_CLASS, tocList
   src/lib/server/files/fs/notes.ts: noteFile
   src/lib/state/boards/structure/graph.ts: EdgeKind, Direction
   src/lib/state/boards/structure/graph.ts: typeCounts, lineCounts
   src/lib/state/sources/fs.svelte.ts: BookmarksState, FileText, Listing, NotesState, WorkspacesState
   src/lib/views/shared/graph/pointer.ts: DRAG_PIXEL, LINK_REACH
   ```
7. `npx vitest run tests/server/machine/lsp/adapters/markdown-created.test.ts --testTimeout 0` (G72): `Test Files  1 passed (1)`, `Tests  4 passed (4)`.
8. The perl ASCII gate over `src tests config` (`! -name local.yml`): exit 0, 0 lines.
9. `npx vitest run tests/checks/source/html-sites.test.ts`: `Tests  19 passed (19)`.

Runs this round, counted: two full-list runs. The first ended at its red test:quick; the second ran every command above. test:quick ran three times in all: red in run 1, alone after the fix, and in run 2. While working, only the test files covering a change were run. After the verify list: `npx vitest run tests/ui/html.test.ts`, `Tests  3 passed (3)`. No source file is newer than the run-2 test:quick output (`find src tests HELP.md DESIGN.md utils config -newer r1-v2-quick.txt -type f` prints nothing).

## Terms

No `docs/glossary.md` exists in this repository.

## Files

Files changed in round 1, against `$TMPDIR/d76-after` (the round-0 copy). Each entry gives the lines now and the lines added and removed (`diff | grep -c`):
- `src/lib/data/helpers/search/query.ts` 375, +12 -23
- `src/lib/data/model/model-sessions.ts` 799, +4 -1 (outside the round's list: the tag lines of item 3)
- `src/lib/data/prose/markdown/note-links.ts` 455, +55 -27 (outside: the tag lines)
- `src/lib/data/prose/markdown/note-render.ts` 206, +55 -18
- `src/lib/server/files/fs/lsp-edit.ts` 151, +8 -8
- `src/lib/server/files/fs/notes.ts` 360, +16 -13
- `src/lib/server/files/search/search.ts` 663, +5 -27 (outside: the multi-line hunks item 3 removes)
- `src/lib/server/files/workspace/paths.ts` 48, +4 -4
- `src/lib/server/machine/lsp/adapters/markdown/own/wiki.ts` 275, +5 -3
- `src/lib/server/machine/lsp/held/answers.ts` 102, +6 -6
- `src/lib/server/machine/lsp/relay/relay-route.ts` 619, +6 -6
- `src/lib/server/machine/lsp/relay/relay-server.ts` 359, +6 -6
- `src/lib/state/client/context.ts` 884, +15 -7 (outside: passes `taggedHits` to the search store)
- `src/lib/state/sources/explorer/notes/note-index.ts` 252, +45 -25
- `src/lib/state/sources/fs-transport.ts` 484, +1 -1 (outside: the tag line in the transport shape)
- `src/lib/state/sources/search/search.svelte.ts` 535, +19 -5
- `src/lib/state/sources/search/search.ts` 340, +11 -4
- `src/lib/state/system/machine/lsp/edits.ts` 501, +43 -1
- `src/lib/ui/controls/editor/kit/lsp/transport/edits.ts` 243, +6 -2
- `src/lib/ui/html.ts` 630, +59 -20
- `src/lib/views/shared/explorer/control/note-actions.ts` 112, +4 -2
- `src/lib/views/shared/prose/Markdown.svelte` 345, +12 -19 (outside: the embed's styles, and the `slots` site the html-sites check asks for)
- `src/lib/views/shared/prose/RenderedMarkdown.svelte` 195, +4 -4 (outside: passes `slots`)
- `src/lib/views/sources/source/language/lsp.ts` 653, +24 -2
- `tests/ui/html.test.ts` 65 (59 after round 0). The scratch copy was overwritten by this file, so its added and removed lines are not counted here.
- `HELP.md` 509, +3 -3; `DESIGN.md` 743, +2 -2
- `docs/diagrams/*`, rewritten by `npm run diagrams`; `docs/palette.md`, rewritten by `npm run docs:palette`.

`tests/checks/source/keys.test.ts` differs from the scratch copy by the round-0 comment edit made after that copy (lines 370-372), not by this round.

Files of the whole step, against `.agents/worktrees/D76-base`, with the line counts round 0 gave, where this round did not change them:
- New files (lines):
  - `config/text/views/sources/notes.yml` 41
  - `src/lib/data/prose/markdown/note-links.ts` 455, `note-names.ts` 157, `note-render.ts` 206
  - `src/lib/server/machine/lsp/adapters/markdown/own/wiki.ts` 275
  - `src/lib/server/machine/lsp/held/requests/merged.ts` 38
  - `src/lib/state/sources/explorer/notes/note-attach.ts` 167, `note-hooks.ts` 99, `note-index.ts` 252, `note-moves.ts` 246, `note-press.ts` 108, `note-tree.ts` 233
  - `src/lib/views/shared/explorer/control/note-actions.ts` 112
  - `src/lib/views/shared/explorer/sections/ListedSection.svelte` 47
  - `src/lib/views/shared/graph/node-tone.ts` 14
  - `src/lib/views/sources/files/sections/Backlinks.svelte` 127, `Tags.svelte` 75, `notes-section.svelte.ts` 237
  - `src/lib/views/sources/notes-graph/NotesGraph.svelte` 113
- Moved files:
  - `src/lib/data/prose/markdown.ts` to `src/lib/data/prose/markdown/markdown.ts` (136, 136)
  - `adapters/markdown/answers.ts` and `backticks.ts` to `adapters/markdown/own/` (82 and 181, unchanged)
  - `src/lib/views/structure/map/Graph.svelte`, `Nodes.svelte`, `labels.ts`, `pointer.ts` to `src/lib/views/shared/graph/` (469 to 474, 107 to 114, 114 to 117, 75 to 75)
  - the six files of `src/lib/views/shared/accounts/` to `src/lib/views/shared/forms/accounts/`
  - `src/lib/views/shared/forms/posting.ts` to `src/lib/views/shared/card/feed/posting.ts`
  - Each move keeps a folder at ten items or fewer.
- Deleted: `config/text/views/sources/note.yml` 16, `src/lib/views/sources/note/Note.svelte` 278.
- Changed files, base and now. Round 1 changed only the counts of the files in the round-1 list above:
  - Config: `config/behavior.yml` 325, 325; `config/catalogs/options.yml` 1488, 1485; `config/text/views/sources/files.yml` 294, 287; `config/text/views/sources/search.yml` 181, 184.
  - `src/lib/data`: `helpers/search/query.ts` 323, 375; `model/index.ts` 808, 811; `model/model-sessions.ts` 765, 799; `sources/config/local.ts` 584, 577.
  - `src/lib/server`: `content/diagrams.ts` 58, 58; `content/docs.ts` 856, 856; `files/files.ts` 160, 176; `files/fs/lsp-edit.ts` 158, 151; `files/fs/notes.ts` 188, 360; `files/fs/ops.ts` 759, 801; `files/fs.ts` 525, 498; `files/search/search-routes.ts` 87, 92; `files/search/search.ts` 647, 663; `files/workspace/paths.ts` 51, 48; `machine/apps/reach/private.ts` 60, 59; `machine/lsp/adapters/entry.ts` 273, 280; `machine/lsp/adapters/markdown/diagnostics.ts` 68, 68; `machine/lsp/adapters/markdown/places.ts` 138, 158; `machine/lsp/adapters/markdown/rewrite.ts` 102, 102; `machine/lsp/held/answers.ts` 84, 102; `machine/lsp/held/held.ts` 878, 880; `machine/lsp/held/watch.ts` 311, 340; `machine/lsp/relay/relay-join.ts` 259, 261; `machine/lsp/relay/relay-route.ts` 601, 619; `machine/lsp/relay/relay-server.ts` 352, 359; `machine/lsp/servers.ts` 642, 647; `machine/runs/lint/writing/markdown.ts` 457, 457; `root/process/context/machine-defaults.ts` 68, 67; `root/watch/local.ts` 176, 175.
  - `src/lib/state`: `boards/structure/graph.ts` 463, 466; `client/context.ts` 873, 884; `life/notes.ts` 126, 21; `sessions/source/autosave.svelte.ts` 198, 218; `sources/explorer/acts/selection.ts` 201, 203; `sources/explorer/ops.svelte.ts` 740, 785; `sources/explorer/view/card-tree.ts` 35, 41; `sources/explorer/view/files-view.ts` 269, 278; `sources/explorer/view/place.ts` 222, 228; `sources/fs-transport.ts` 494, 484; `sources/fs.svelte.ts` 852, 775; `sources/fs.ts` 61, 63; `sources/search/search.ts` and `search.svelte.ts` (round 1 only: 340 and 535 now); `system/machine/lsp/edits.ts` 451, 501; `workbench/layout/tabs/instances.ts` 412, 396; `workbench/layout.svelte.ts` 811, 810.
  - `src/lib/ui`: `html.ts` 372, 630; `controls/editor/kit/lsp/transport/edits.ts` (243 now).
  - `src/lib/views`: `feeds/inbox/Inbox.svelte`, `feeds/literature/LiteratureCard.svelte`, `personal/calendar/Calendar.svelte`, `shared/card/feed/LeadCard.svelte`, `shared/card/feed/RadarCard.svelte`, `shared/card/project/CardAddresses.svelte` (imports only); `shared/explorer/sections/list-drag.svelte.ts` 173, 172; `shared/explorer/tree/Failed.svelte` 36, 48; `FileRow.svelte` 238, 246; `Tree.svelte` 450, 495; `control/dragging.svelte.ts` 297, 345; `control/keyed.ts` 134, 140; `control/picks.svelte.ts` 297, 309; `menu/row-ops.ts` 446, 505; `shared/latex/math.ts` 37, 78; `shared/prose/Markdown.svelte` 298, 345; `shared/prose/RenderedMarkdown.svelte` 132, 195; `sources/doc/MarkdownPreview.svelte` 169, 171; `sources/files/Files.svelte` 374, 376; `sources/files/sections/Notes.svelte` 156, 149; `Outline.svelte` 287, 270; `Sections.svelte` 230, 195; `sources/search/Query.svelte` 126, 127; `sources/source/Editor.svelte` 320, 384; `Source.svelte` 514, 515; `SourceBody.svelte` 210, 215; `sources/source/language/lsp.ts` (653 now); `structure/map/Map.svelte` 195, 233; `structure/map/node-view.ts` 23, 13.
  - `src/routes/api/(files)/fs/+server.ts` 45, 44.
  - `tests`: `checks/config/config-folder.test.ts` 624, 624; `checks/source/keys.test.ts` 639, 671; `checks/tree/boundaries.test.ts` 828, 833; `data/sources/config/local.test.ts` 181, 196; `fixtures/hubs/workspace.ts` 95, 94; `routes/files/fs.test.ts` 101, 100; `routes/hubs/machine-answer.test.ts` 68, 67; `routes/replace/lsp-edit.test.ts` 248, 261; `server/files/notes.test.ts` 78, 78; `server/machine/lsp/adapters/markdown-created.test.ts` 269, 289; `server/machine/lsp/adapters/markdown-requests.test.ts` 309, 357; `server/machine/lsp/lsp-fixture.ts` 374, 375; `state/sessions/autosave.client.test.ts` 347, 420; `ui/html.test.ts` 19, 65.
  - Root files, against main's copy: `package.json` 128, 129 (`"marked-katex-extension": "5.1.13",`); `package-lock.json` 9548, 9559; `HELP.md` 499, 509; `DESIGN.md` 742, 743; `docs/apps.md` 1014, 1014; `docs/palette.md`; `docs/diagrams/*`.

Paths outside the write lists, each with its reason:
- Round 0's paths and reasons are unchanged:
  - `config/catalogs/options.yml`: the `notes` machine value's row.
  - `machine/apps/reach/private.ts`: `local.notes` dropped.
  - `content/docs.ts`, `runs/lint/writing/markdown.ts`: the moved `markdown.ts`.
  - `relay-join.ts`, `relay-route.ts`, `relay-server.ts`: an entry's added answer.
  - `state/client/context.ts`: notes hooks and the note wait.
  - `state/sources/fs.ts`: the index comment.
  - `instances.ts`, `layout.svelte.ts`: `closeRecord` removed.
  - `MarkdownPreview.svelte`: links, embeds, tags and math.
  - `Query.svelte`: "In the notes of every hub".
  - The importers of the moved `accounts/` and `posting.ts`.
  - `boundaries.test.ts`, `keys.test.ts`: allow lists.
  - `lsp-fixture.ts`: the `Root` type.
  - `tests/fixtures/hubs/workspace.ts`: `notes: null,` dropped.
- Round 1's are named in the round-1 list above.

## Edits to an existing assertion, allow list or predicate

Round 1 changed no allow list, no check and no predicate. `tests/checks/source/html-sites.test.ts` is unchanged; the code was changed to pass it.

Round 1 changed the bodies of the two G5 rows of `tests/ui/html.test.ts` that round 0 added:

| File | Before (round 0) | After |
| --- | --- | --- |
| `tests/ui/html.test.ts`, the rows "draws a note link's shown text as text, so no tag it holds reaches the page" and "typesets a formula's words as text, and a link it asks for as no link" | each called `blockMarkdownParts(text, extras).html` | each calls `drawn(text)`, a helper of the file that is `sanitise(parts.html, parts.slots)`, the page's own call; the expected strings are unchanged |

The new file run on a copy of the round-0 tree gave `Tests  3 passed (3)`; in the worktree, `Tests  3 passed (3)`.

Round 0's edits, all unchanged by round 1:

| File and line | Before | After |
| --- | --- | --- |
| `tests/checks/config/config-folder.test.ts:275` (`CATALOG_FILES`) | `'views/sources/note.yml',` | `'views/sources/notes.yml',` |
| `tests/checks/tree/boundaries.test.ts:217` (ui row allow list) | `'data/prose/markdown',` | `'data/prose/markdown/**',` |
| `tests/checks/tree/boundaries.test.ts:294` (state row allow list) | (no entry) | `'data/prose/markdown/**',` |
| `tests/checks/tree/boundaries.test.ts:128-131` (comment over those rows) | the primitives' row holds `data/prose/markdown` | it holds `data/prose/markdown/**`, and four lines say why the state row holds it |
| `tests/checks/source/keys.test.ts:370-381` (computed key prefixes) | (no entries) | `note-tree.ts` and `own/wiki.ts`, each with `keys: () => nameRefusalKeys()` |
| `tests/checks/source/keys.test.ts:176-190` (helper) | (no helper) | `NAME_REFUSALS` and `nameRefusalKeys()` |
| `tests/server/files/notes.test.ts:12,19,20` (fixture) | `saveNote(...)` | `writeFileSync(join(dir, 'one.md'), 'first')` and `two.md` |
| `tests/routes/files/fs.test.ts:54`, `tests/routes/hubs/machine-answer.test.ts:42`, `tests/fixtures/hubs/workspace.ts:90` (fixtures) | `notes: ...,` | (removed) |
| `tests/server/machine/lsp/lsp-fixture.ts:238` (fixture type) | `{ key: string; dir: string }[]` | `Root[]` |
| `tests/server/machine/lsp/adapters/markdown-created.test.ts:125` (fixture) | `[{ key: 'hub', dir: root }]` | `hub: true` when the case asks |
| `tests/state/sessions/autosave.client.test.ts:63` (fixture) | `timers: time` | adds `note: (file) => ...` |

## Judgment calls the brief left open

Round 1:
1. **Any `.oculus` segment counts, at any depth.** Item 2 names the first segment. Part 6 says nothing else under any `.oculus` folder is searched, so `searchedPaths` gives nothing to a scope with `.oculus` anywhere in it, for a hub root and for a repository root alike, unless the scope is in the notes folder.
2. **A note rename from a link skips the Rename preview.** The rename is made through `explorer.rename`, which asks no preview. By reading `lsp.ts:235-252`, Cmd+Enter on F2 over a note link therefore renames at once, with no preview; no run shows it. Every other rename keeps its preview.
3. **A refused note rename uses `lsp_edit_refused`** with the rename's own sentence. It is an existing key, so no catalog key is added.
4. **An inline embed flattens the note.** Inside a `<span>` only phrasing content is valid, so headings become `<strong>`, paragraphs are joined by `<br>`, and lists, code and tables are shown as escaped text. HELP.md says how an inline embed draws.
5. **The tag pattern's fourth alternative** matches a line of a `tags:` list continued over several lines. A `tags: >` folded text is counted by the index, but the search lists it only at the lines that hold one word. HELP.md says so.
6. **The hits a tag's search does not keep are stored as dismissed**, so a Replace's re-read leaves them out. The count shown is the kept hits'.
7. **The html-sites check is met by passing the slots to the one sanitise site** instead of the `sanitised` prop, so `Markdown.svelte` holds one `{@html}` site over `sanitise`.
8. **Round-1 case 1's run calls `explorer.rename`'s three steps directly.** The page store needs a running page to be built, so the probe calls `createNoteMoves`, `/api/ops` through `runOps`, and `landed`. The press itself is for the look on TEST.

Round 0's calls, still in force:
1. The notes folders are watched through the root watch.
2. The server keeps the name rule at every operation that lands a name in a notes folder (`noteLanding`). `a/b.md` makes folder `a` and note `b`; the Notes tree refuses a typed `/`.
3. Case 31's search reaches the notes through the withheld globs and the notes folder's explicit path, without `--hidden`.
4. An entry's added answer is joined in `held/requests/merged.ts`.
5. A reorder whose order file names a link out of the folder is refused with `no-such-note`.
6. The Notes tree's saved expansion is kept as `#notes`.
7. New Note in a hub with no folder writes `notes/<name>.md` into `.oculus`.
8. New File in the Notes tree appends `.md`.
9. A trashed note's tab closes without asking.
10. A tag's search runs over every root (`ALL_ROOTS`) scoped to `.oculus/notes` with a regular expression, and keeps the tag index's lines (round 1). Tag counts compare names without letter case.
11. A press on a refused link says why as a warning notice.
12. A paste takes image files only, a drop any file from outside the page, and the link is inserted at the caret.
13. An embed's text is read through `fileText` when drawn; a change on disk shows when the note is drawn again.
14. KaTeX's error colour is `var(--c-red-txt)` through `MATH_OPTIONS.errorColor`, shared with `math.ts`, so the TeX view and the Math Preview draw it with the token instead of `#cc0000`.
15. A drawn tag's class is `note-tag`.
16. The held watch's glob for `.oculus/notes` is fixed so the server is told of a note's events.
17. `name_taken` reads "'{0} is taken: a note of this folder has that name, but for letter case or the way its accented letters are encoded.'"
18. `ListedSection.svelte` is drawn by Backlinks, Tags and Outline.
19. `checkLocal` stays null for `notes`; `readLocal` names it as unknown.

## Host- and user-visible changes, for the look

Round 1:
- **Rename on a link** (a note's source tab, F2 on `[[Kickoff]]`).
  - Round 0: the notice `lsp_edit_structure` and no change.
  - After: the note is renamed as the Notes tree renames it, and every `[[Kickoff]]` in the hub's notes is rewritten. A refused name shows the rename's sentence.
- **Find in Folder on a `.oculus` folder** (Search view, scope `.oculus` or `.oculus/workspaces`).
  - Round 0: hits in the state folder's files when the hub has no notes folder.
  - After: no results. A scope in the notes folder still searches the notes.
- **A regular expression with `\n`** (Search view, regex on).
  - Round 0: it matched across lines.
  - After: the search runs with the same ripgrep arguments as on the base, with no `--multiline` (round-1 case 4). What ripgrep then shows for a pattern naming `\n` is not verified by a run.
- **A press on a tag** (Tags section, or a tag drawn in a note).
  - Round 0: every line the pattern matched, with a fenced `#plan` included.
  - After: only the counted notes, each at the line of the tag. Changing the query, a toggle or the scope makes it an ordinary search.
- **An embed** (a note's rendered half or the Markdown Preview).
  - Round 0: a frame inside a paragraph.
  - After: `![[name]]` alone on its line is a block frame between paragraphs. An embed inside a line is a frame within the line, the note's headings bold and its paragraphs separated by line breaks.
- **Math** still typesets. The formulas reach the page through the one sanitise site, filled from their slots.

Round 0's changes are unchanged by round 1 except the two named above (Search, embeds):
- **The Notes section**: one group per hub, each a tree of the hub's `.oculus/notes/` with the Explorer's rows, input row, menu, F2, Move to Trash, drag and Alt+Up and Alt+Down; a head with New Note and a Graph control. With no folder, "No note yet."; with no hub, "No folder of this workspace is a hub, so there are no notes."
- **A note's tab**: a Markdown source tab with its rendered half and the Outline. It saves itself 0.8 s after the last key under `editor.autosave: off`, and a pasted picture inserts `![[Pasted image <stamp>.png]]`.
- **The gone `note` view**: a saved layout's `note` tab draws the unknown view.
- **The gone `notes` machine value**: no row in Settings. Each hub's notes are `<hub>/.oculus/notes`.
- **Backlinks and Tags** sections in the Files view.
- **The Notes Graph** view. The Map draws through the same moved `Graph.svelte`, so its look should be unchanged.
- **Search reaches each hub's notes** and nothing else under `.oculus`.
- **Paste and drop into a note's tab** write to `attachments/`.
- **Math in every Markdown preview.** A refused formula shows in red with the tooltip "This formula could not be typeset.". The TeX view and the Math Preview draw an untrusted command in the theme's red token.
- **An SVG served by its address** carries `nosniff` and a policy that runs nothing.

## Documents

Round 1's changes:
- HELP.md:317, the embed sentence: an inline embed draws its frame within the line.
- HELP.md:318, the tag sentence: the search lists the notes the section counts at each tag's line; a change makes it ordinary; the `tags: >` limit.
- HELP.md: the sentence "A regular expression that names `\n` matches across lines..." is removed.
- DESIGN.md:651: math slots "before `sanitise` puts it back".
- DESIGN.md:732: the structural-edit exception for a note's rename (`noteRenameOf`).
- `npm run diagrams` rewrote `docs/diagrams/`.

Each changed sentence was read against the sentence rules: plain words, no history, no dash standing in for punctuation, one name for one thing, ASCII. A grep for history words (`before`, `still`, `no longer`, `used to`, `now`, `previously`, `formerly`, `round`, `reverted`, `earlier`, `fixed`) over every line this round added to `src`, `tests`, HELP.md and DESIGN.md found only behavioural uses. Examples: "ends the paragraph before it", "before `sanitise` puts it back", a regex fragment named `before`, and DESIGN.md's existing "no longer served". This also covers the added comment lines and test titles that review Standards 4 named.

## Anything in the brief that was wrong or impossible

- **Round 1 item 5 and case 7.** The `client` project has no DOM (`tests/ui/frame/client-runtime.ts:1`). DOMPurify's `sanitize` is not defined there, as the probe shows. The rows stay in the unit project. A dev dependency named in the head of this report would make the run possible; it is for the orchestrator to rule.
- **The checks command's chord row** fails on the unchanged tree and on the worktree alike (`config-folder.test.ts:502:67`). Main holds the fix.
- **test:quick is over its time limit** in every run (48.3 s, 71.4 s, and the red run) against 45.0 s, with every command passing.

## Every finding of the review, and what changed for it

- **Spec 1, rename on a link renames nothing**: fixed by item 1. `state/system/machine/lsp/edits.ts:197` (`noteRenameOf`), `views/sources/source/language/lsp.ts:235-252`. Round-1 cases 1 and 2.
- **Spec 2, a `.oculus` scope reads other files**: fixed by item 2. `data/helpers/search/query.ts:219-225`. Round-1 case 3.
- **Spec 3, the tag search finds more than the section counts**: fixed by item 3. `note-index.ts:146` and `:160`; `search.svelte.ts:308-316`; `state/sources/search/search.ts:79-80`; `context.ts:474`. Round-1 case 5.
- **Spec 4, no name rule for the first note**: fixed by item 4. `server/files/fs/notes.ts:312` and `:329-332`. Round-1 case 6.
- **Proof 1, no run checks the sanitiser**: not fixed. The premise is wrong (item 5). Round 0's sentence calling the G5 row "the browser run" is withdrawn: case 42 above says DOMPurify does not run. A run that checks the sanitiser needs a DOM library (head of this report). The bodies of the G5 rows now draw through the page's call (`tests/ui/html.test.ts`).
- **Proof 2, the verify list ran twice in round 0**: not sent back. This round ran it twice: the first run stopped at a red line, which spec.md allows.
- **Proof 3, case 3's probe used `  Spaced  `**: the case was run with `  Kickoff  ` this round and is written as `Kickoff.md` (scratchpad `r1-extra.txt`). Round 0's listing of it as a brief error is withdrawn.
- **Proof 4, case 6's probe stubs the Trash**: this round's run uses a trash that moves the file into a scratch trash folder, and states it. The note leaves the folder and is in the trash folder (`r1-extra.txt`). The system Trash is not used by a probe.
- **Standards 1, five comments not rewrapped**: fixed by item 7. `paths.ts:1-5`, `answers.ts:1-8`, `relay-route.ts:1-11`, `relay-server.ts:1-7`, `lsp-edit.ts:7-21`. Round-1 case 9.
- **Standards 2, comments that say what the code does not do**: each is now true. `wiki.ts:15-19` names `noteRenameOf`. `servers.ts:24` is unchanged and true through item 1. `ops.ts:45-48` and the `noteLanding` doc at `notes.ts:334-339` are unchanged and true through item 4.
- **Standards 3, a read-only `git status` in round 0**: not sent back (booked at landing). No git command was run in round 1.
- **Standards 4, the history-word grep was too narrow**: not sent back. This round's grep covered every added line of `src` and `tests` and the documents, and found only behavioural uses (section "Documents").
- **Behaviour 1, every regex search changes**: fixed by item 3. No `--multiline` remains (`grep -n 'multiline\|spansLines'` over `query.ts` and `server/files/search/search.ts` prints nothing). Round-1 case 4.
- **Behaviour 2, KaTeX `errorColor` in the TeX view and Math Preview**: not sent back, unchanged (round-0 judgment call 14). The orchestrator looks at it at landing.
- **Behaviour 3, rename on a link shows `lsp_edit_structure`**: fixed by item 1 (round-1 case 1).
- **Behaviour 4, an embed inside `<p>`**: fixed by item 6. `note-render.ts:71-77` and `:170-183`, `html.ts:537` and `:550`, `Markdown.svelte:322-333`. Round-1 case 8, case 36.
- **Not sent back and unchanged**: the module-level `let loading` in `views/shared/latex/math.ts:51`.

## Test rows by guarded entry, for `agents/guarded.md`

No test title was added or renamed in round 1, and no guarded entry was written. Round 1 changed the bodies of G5's two rows in `tests/ui/html.test.ts` (table above). Item 5's rows would need a DOM project; if one is added, the entry and titles are G5's:
- "draws a note link's shown text as text, so no tag it holds reaches the page"
- "typesets a formula's words as text, and a link it asks for as no link"

Their file name would change to the DOM project's suffix.

Round 0's rows, unchanged:
- **G3**, `tests/server/machine/lsp/adapters/markdown-requests.test.ts`: "lists a hub's notes and no other file under .oculus or secrets"; 'tells the server a change on disk in a hub of %s: %s' with two rows. Failed on the unchanged tree at `:217:34` and `:316:43`. Pass (test:quick).
- **G5**, `tests/ui/html.test.ts`: the two rows above. Failed on the unchanged tree at `:46:22` and `:52:24`. Pass (`Tests  3 passed (3)`). They do not run DOMPurify.
- **G5**, `tests/checks/source/html-sites.test.ts`: unchanged file. Red on round 0, `Tests  19 passed (19)` now.
- **G8**, `tests/routes/replace/lsp-edit.test.ts`: "writes the edit of a note of a hub's notes folder, and refuses a file of another .oculus folder as outside". Failed on the unchanged tree at `:57:30`. Passes.
- **G13**, `tests/data/sources/config/local.test.ts`: 'takes a notes key as a key it does not know, which readLocal names as unknown'. Failed at `:102:34`. Passes.
- **G60**, `tests/state/sessions/autosave.client.test.ts`: four note rows, three failing on the unchanged tree. Pass.
- **G28**, the same file: "under off saves a note's tab first on a close". Failed at `:405:30`. Passes.
- **G72**, `tests/server/machine/lsp/adapters/markdown-created.test.ts`: "a note created in the hub's notes folder after the first references is listed by references to its heading". Timed out on the unchanged tree. `Tests  4 passed (4)` now.
- **G31**, `tests/server/files/notes.test.ts:53`: fixture changed, assertions unchanged.
- **G12, G13**, `tests/checks/config/config-folder.test.ts`: `CATALOG_FILES` changed.

Behaviour a test would protect that no guarded entry covers, for Axel. Each is checked by its quoted case run above, and no test was kept for it:
- the edit plan's acceptance of a note under `.oculus/notes/`
- `noteRenameOf` and the note rename from a link
- the search's reach into each hub's notes and nothing else under `.oculus`, including the scope rule of round-1 case 3
- the tag counts, the tag search and `taggedHits`
- Backlinks
- the Notes Graph's data
- the attachment names and their retry on `exists`
- the embed's block and inline forms
- the refused formula's colour and title
- the Notes tree's refusal of a typed name
