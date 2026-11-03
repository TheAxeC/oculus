Brief check of step O133 (one front-matter pattern for every Markdown reader), read on main at cf551dd8b. No file was changed. The probes are in /private/tmp/claude-502/-Users-axelfaes-workspace-research-hub/be0ac0d7-a551-4911-a072-9f76e1bbe399/scratchpad/o133check/ (probe.ts, probe2.ts, probe3.ts). Each is run with `node <file>` under node v24.21.0 and imports the readers from src on main.

Six findings decide whether the brief can be dispatched as written:
- (A) RenderedMarkdown.svelte may not import from data/prose/markdown. The views row of the layer table does not list it, so the boundaries test goes red (Premises 5).
- (B) The new test file belongs to no entry of agents/guarded.md (Cases and checks 1).
- (C) The docs reader's form, read by every reader, swallows the body after an empty header when a later `---` or `...` line exists (Implied inputs 1).
- (D) The Outline column of the test cannot fail for any case C1 to C10 (Cases and checks 3).
- (E) C2's "Before" is wrong for the preview (Cases and checks 2).
- (F) The brief names no worktree and no base copy (Premises 9).

## Names

Commands:
- `grep -rn "FRONT_MATTER\|FRONTMATTER\|frontMatterEnd\|frontTags\|prose/markdown/front-matter" src tests docs utils README.md .scratch/migration/agents/guarded.md | grep -v "^docs/diagrams"` prints 15 lines. Every one is in a file of "Paths this step writes": note-links.ts:37,225,278,282; html.ts:46,628; requests.ts:19,26,32; outline.ts:56,67; docs.ts:58,66; RenderedMarkdown.svelte:83,124.
- The same names over config, with `--exclude=local.yml`, print nothing.
- `splitFrontmatter` is not renamed. Its users outside the write list are feeds.ts:21,185,339,365, lint/writing/markdown.ts:26,403, folder.ts:42,112-113, deck/split.ts:22,115 and deck/outline.ts:18,61. The change makes none of them false.
- No file under docs/diagrams names any of the names. `grep -rl "note-links\|prose/markdown" docs/diagrams` prints nothing. layer-data.dot counts imports between folders, so it may change on regeneration; it is in the write list.

Hits of the phrase "front matter" / "front-matter" (case-insensitive) outside the write list, each judged:
- config/text/server.yml:385 `post_no_front_matter: The LinkedIn idea has no front matter between two --- lines.` The step does not make it false: splitFrontmatter is unchanged, and it already accepts `...` (feeds.test.ts:306 'a front matter closed by ...'). It is a user-visible sentence that states a header's form other than the one form, and item 3 asks that "documents and comments that describe what a header is say the one form". Item 3's grep covers src, tests and docs, not config, so this line is outside the step. Rewording it widens the paths (config/text/server.yml), so it goes to Axel as an open item.
- src/lib/data/sources/deck/split.ts:7 "the front matter rule of docs.ts". After the step the pattern lives in front-matter.ts and docs.ts applies it, so the line is arguably stale. It names the pattern's place in a file the step does not change. Recommend adding it to the write list; it is an internal comment change.
- src/lib/server/machine/runs/lint/writing/markdown.ts:3-4 "after the front matter is cut off with the tree's one split (`splitFrontmatter`), so a mark falls where the preview shows prose". It is false today for the inputs where the preview's copy disagrees (C1, C3, C5, C8). The step makes it true, except after a BOM, where neither the preview nor the split reads a header. No change.
- Still true after the change, no edit needed:
  - src/lib/server/content/docs.ts:143
  - feeds.ts:177-179, 322, 328-329, 360, 410, 476
  - data/model/model-deck.ts:42,44,64
  - data/sources/documents/feeds.ts:44
  - deck/slide-text.ts:7-8,49,80,109, deck/project.ts:1,116, deck/split.ts:3,9,12-15,24,32-39, deck/outline.ts:13,15, deck/kinds.ts:3,148,200
  - linkedin-idea.ts:1,5,18
  - views/sources/files/sections/Tags.svelte:3
  - tests/checks/config/integrity.test.ts:66,242
  - tests/server/edit/feeds.test.ts:185-402 (test names)
  - tests/server/machine/runs/lint/writing.test.ts:2
  - tests/data/sources/present.test.ts:37,46,66,94,282
  - docs/templates.md:863
  - guarded.md:43 (G71), :75 (G8 Test line), :278 (G32 Test line)
  - config/text/findings.yml:128, config/text/server.yml:386
- Inside the write list and named by item 3, for the record: note-links.ts:13,36,156,221; RenderedMarkdown.svelte:14-16,81; outline.ts:9,55; requests.ts:26; docs/HELP.md:405. note-links.ts:36 ("which the document route splits off too") and RenderedMarkdown.svelte:81 are false today.

## The step line

There is no Goal section in plan.md. `grep -n "^## " .scratch/migration/plan.md` prints only "Steps, in execution order", "Could run in parallel", "Rulings", "Agents" and "Blocked, and by what". The preamble (plan.md:3) is the plan's statement.

The O133 line (plan.md:1643) is ruling 648 (a), at plan.md:3478: "Open item 648 (2026-11-03): (a), step O133, one exported front-matter pattern, the wider form, ... (c), no change, was the lazy option (the user)".

Each part of the line, and the requirement that serves it:
- "the note scan and its users (note-links.ts FRONT_MATTER, html.ts, requests.ts)": item 2, the note-links.ts and the html.ts/requests.ts bullets.
- "the preview (RenderedMarkdown.svelte's own copy)": item 2, the RenderedMarkdown bullet.
- "the Outline (outline.ts frontMatterEnd)": item 2, the outline.ts bullet.
- "the docs reader (docs.ts FRONTMATTER)": item 2, the docs.ts bullet.
- "read a leading header by one exported pattern": item 1, and item 2's "no other copy stays". No verify command checks that no copy stays (Cases and checks 6).
- "the wider form: an opening `---` and a closing `---` or `...`, each with trailing spaces or tabs allowed": item 1.
- "so a note whose header closes with `...` or `--- ` is hidden in the preview": item 2 (preview), and C1/C2 through the test's own `text.replace`, which does not reach the preview (The question).
- "and the editor": item 2's sentence "the hidden token covers every line of the header", checked only by a quoted run.
- "gives its tags": item 2's frontTags sentence, and C1 to C3 tags.
- "and is skipped by the Outline": item 2's outline.ts bullet. No case can show it (Cases and checks 3).
- "as one closing with `---` is": C4 and the docs tests (C11).
- "A full step": "Size: a full step".

Every part of the line has a requirement. Requirements that serve no part of the line, each from a rule:
- Item 3 (HELP sentence, comments), from spec.md:72.
- Item 4 (the test), from spec.md:60.
- Decision 3 and C10 (the BOM), an internal choice. The line says nothing about a BOM.
- C8 and C9, consequences of "one pattern".

## Premises

1. The four patterns and their lines. `grep -rn "FRONT_MATTER\|frontMatterEnd\|FRONTMATTER" src` confirms note-links.ts:37, html.ts:628, requests.ts:19,26,32, RenderedMarkdown.svelte:83 and :124, outline.ts:56-60 and :64-67, docs.ts:58 and :65-69, and the docs.ts comment at :51-57. scanNote is at note-links.ts:276-283 (`grep -n "export function scanNote"` gives 276), as stated.
2. frontTags is at note-links.ts:220-254, not 220-251. `sed -n 251,254p` shows `}` `}` `return found;` `}`. The head-strip and tail-strip description holds (lines 226-227).
3. "splitFrontmatter is 'the tree's one split' for the docs route (docs.ts:97)". The quoted phrase is at lint/writing/markdown.ts:4 ("tree's one split (`splitFrontmatter`)") and feeds.ts:178 ("the tree's split"). docs.ts:97 is readDoc's call. The users listed are right: split.ts:115, deck/outline.ts:61, feeds.ts:185,339,365, markdown.ts:403, folder.ts:112-113.
4. Paragraph 16 ("a note ... whose `---` lines carry trailing spaces ... is no header to ... the preview") is wrong for a closing `--- `. probe.ts, C2: `preview copy: "---\ntags: [alpha]\n---"`, `preview text: " \n# Title\n"`. The preview's `---\r?\n?` matches the dashes and leaves the trailing space line, so the preview hides that header today. It is right for the opening `---<tab>` (C3: preview copy none). The rest of paragraph 16 holds:
   - The empty header is a header to the Outline and the docs reader only (C5).
   - The preview matches `---x` (C8: `preview text: "x\n# Title\n"`).
   - The server reads the last line as a heading for C2 and C3 (`heading_open@1-3`, a setext heading). For C1 the server gives a paragraph, not a heading (`hr@0-1, paragraph_open@1-3`).
5. Paragraph 18 and decision 2 ("the primitives' row lets every layer import it") are wrong for the views layer. tests/checks/tree/layer-rows.ts:279-287, the `views:` row, is `'ui/**', 'state/**', 'views/shared/**', 'data/shapes/shapes', 'data/prose/linkedin-idea', 'data/prose/lsp-servers', 'data/prose/text-edits', 'data/helpers/keys/oculus/**'`, with no `data/prose/markdown/**`. boundaries.test.ts:53-66 (`findViolations`) checks .svelte files too (graph.ts:20-21 `/\.(ts|svelte)$/`). `ownPartials` gives nothing for `views/shared/...` (boundaries.test.ts:33-37). `grep -rn "data/prose/markdown" src/lib/views` prints only a comment at Markdown.svelte:3; no view imports it today. So RenderedMarkdown.svelte importing `$lib/data/prose/markdown/front-matter` is reported by `tests/checks/tree/boundaries.test.ts`, which test:quick runs.
   - The other five importers are allowed: data `data/**` (docs.ts, note-links.ts), ui row :233 (html.ts), state row :316 (outline.ts), server `data/**` (requests.ts).
   - Options:
     - (a) Add `'data/prose/markdown/front-matter'` to the views row, with its reason in the comment block above the table, and add tests/checks/tree/layer-rows.ts to the write list. Recommended. It is an internal allow-list line the ruled design needs, so it can be taken in automode under the brief-check scope ruling.
     - (b) The preview takes the pattern through ui/html.ts, either a re-export or blockMarkdownParts stripping the header itself.
6. Paragraph 19 (BOM): partly reproduced.
   - `grep -rn "uFEFF" <the six files>` prints only `note-links.ts:277`.
   - `LC_ALL=C grep -rlI $'^\xEF\xBB\xBF' --include='*.md' docs` prints nothing, exit 1. The same over /Users/axelfaes/workspace/research-hub prints nothing, exit 1.
   - The Outline reads a header after a BOM: probe.ts C10 `outline end: 3 lines skipped`.
7. Paragraph 20 is wrong. `grep -rln "scanNote\|markdownOutline\|RenderedMarkdown" tests` prints nothing, exit 1. The brief says it prints tests/ui/html.dom.test.ts, which matches only `blockMarkdownParts` (html.dom.test.ts:16,114,118). No test reads a note's front matter, the Outline or the preview, which is the brief's conclusion; only the quoted output is wrong.
   - "named in G278's Test line, `agents/guarded.md:278`": the entry is G32. guarded.md:276 is "- G32. What the hub shows ..."; :278 is its Test line, naming `tests/data/sources/docs.test.ts`, 'splits a leading frontmatter block from the body'. There is no G278.
   - G8 names feeds.test.ts. Confirmed by `awk '/^- G8\./...' guarded.md | grep -o "feeds.test.ts..."`.
8. Paragraph 21 reproduces. `grep -rn -i "front matter" docs/*.md` prints HELP.md:405 and templates.md:863.
9. The brief names no worktree and no base copy. `grep -n -i "worktree\|base copy\|O133-base" briefs/O133.md` prints only line 102 ("Run from the worktree's root") and line 107 (`../O133-base/unused-exports.txt`). spec.md:33 says "The brief names a base copy". O131's brief names it at line 21. `ls .agents/worktrees/` shows migration-O130, migration-O131, migration-O134, O130-base, O131-base and O134-base, with no O133 worktree or base yet. O130-base and O131-base hold config, src, tests and utils only. O133 writes docs/HELP.md and docs/diagrams, so its base copy must hold docs/, or the builder's `diff -rq` file table misses them. O134-base does hold docs.
10. The test files of verify 1 exist and pass on main. `npx vitest run tests/data/sources/docs.test.ts tests/data/sources/present.test.ts tests/server/edit/feeds.test.ts tests/server/machine/lsp/adapters/markdown-requests.test.ts tests/ui/html.dom.test.ts tests/server/machine/runs/lint/writing.test.ts --reporter=dot` gives "Test Files  6 passed (6)", "Tests  94 passed (94)". None is tagged slow (`grep -l "module-tag slow"` over them prints nothing).
    - tests/data/prose does not exist (`ls tests/data/prose`: No such file or directory). The new file is picked up by the unit project (vite.config.ts:511-515, `'tests/**/*.test.ts'`).
    - `utils/unused-exports.sh` exists and runs knip. `npm run test:quick` (package.json:17) and `npm run diagrams` (:23) exist.
11. Decision 4 ("requests.ts exports no parse of its own") is literally true, but the parser is reachable from a test. probe.ts calls `markdownRequests(() => ['.md'])['markdown/parse']({ text }, {} as never)` and prints the token, for example C4 `server token: map 0-3 hidden true; next heading_open@3-4`. The "or by reading where the parser is not reachable" branch of item 4 does not arise. The token can be a row of the table instead of a quoted run.
12. Folder and size room:
    - `git ls-files src/lib/data/prose/markdown | wc -l` gives 4, so 5 after the step.
    - tests/data has 7 items, so 8 with prose/.
    - Line counts: note-links.ts 455, html.ts 711, RenderedMarkdown.svelte 195, outline.ts 165, docs.ts 158, requests.ts 132. All are under the limits.

## Cases and checks

The "Before" values below come from probe.ts on main, for each text. "note" is note-links FRONT_MATTER, "preview" is the RenderedMarkdown copy, "docs" is docs.ts FRONTMATTER, "outline" is frontMatterEnd. Output is quoted as printed, with a BOM written <BOM>.

- C1: note none, preview none, docs `"---\ntags: [alpha]\n...\n"`, outline 3 lines; scanNote tags `[]`; markdownOutline `[["Title",4]]`; split block `"tags: [alpha]\n"`; preview and embed show the whole text; server `hr@0-1, paragraph_open@1-3`. Matches the brief.
- C2: note none; preview `"---\ntags: [alpha]\n---"` (preview text `" \n# Title\n"`); docs matches; outline 3; tags `[]`, scanNote headings `[["tags: [alpha]",1],["Title",3]]`; Outline `[["Title",4]]`; server `heading_open@1-3`. "Before as C1" is wrong for the preview: it hides the YAML today.
- C3: note none, preview none, docs matches, outline 3; tags `[]`, headings include `"tags: [alpha, beta]"`; preview shows the YAML; server `heading_open@1-3`. Matches.
- C4: all four match; tags `[{"tag":"alpha","line":1},{"tag":"beta","line":1}]`; Outline `[["Title",4]]`; server `map 0-3 hidden true`. Matches.
- C5: note none, preview none, docs `"---\n---\n"`, outline 2; split block `""`; server `hr@0-1, hr@1-2`. Matches.
- C6: none everywhere, outline 0, Outline `[["Title",3]]`. Matches.
- C7: none everywhere; Outline `[["Title",1]]`; scanNote headings also hold `"tags: [alpha]"` (setext). Matches.
- C8: preview `"---\ntags: [alpha]\n---"` (preview text `"x\n# Title\n"`), others none, outline 0. Matches.
- C9: outline 3, others none, Outline `[["Title",4]]`. Matches.
- C10: note scan tags `[{"tag":"alpha","line":1}]`; outline 3; note, preview and docs none (scanNote strips the BOM itself); preview and embed show `"<BOM>---\ntags: [alpha]\n---\n# Title\n"`; split block null; server `heading_open@0-3` (the header read as a setext heading). Matches decision 3.

The tag lines are right. NoteTag.line is 0-based: note-links.ts:149 "its line, counted from zero"; lineAt at :211-218 counts from zero. C1, C2, C4 and C10 line 1, and C3 alpha and beta each on line 1, are correct.

Findings:
1. (B) The new test has no guarded entry. spec.md:60: "A test exists only as the test of one entry of `agents/guarded.md` ... A builder writes no other test. A step that needs a new entry stops and asks Axel for it, and writes no test until he has ruled." Item 4 writes `tests/data/prose/markdown/front-matter.test.ts` and names no entry.
   - G32's Code line (guarded.md:277) covers `src/lib/data/sources/` (docs.ts) but not note-links.ts, outline.ts, html.ts, requests.ts or RenderedMarkdown.svelte.
   - `grep -n "note-links\|scanNote\|outline" guarded.md` finds no entry for the readers.
   - This is an open item for Axel, as items 8, 29 and 465 were:
     - (a) a new entry, for example "every reader of a Markdown file reads the same leading header: the note's tags, its headings, the Outline, the preview, an embed, the Markdown server's token and the docs split", with this table as its Test. Recommended.
     - (b) widen G32 to the note scan and the Outline. This puts two guarantees in one entry, which guarded.md's one-guarantee form does not take.
     - (c) no test, quoted runs only. This is the lazy option.
2. (E) C2's "Before as C1" is false for the preview (C2 above). The step's own claim that a `--- ` closing is "hidden in the preview" is already true for the preview. C2 still changes the note scan, the embed and the server, which read no header today.
3. (D) The Outline column cannot fail for any case C1 to C10. markdownOutline reads only ATX `#` headings (outline.ts:82). No header text in C1 to C10 holds a line starting with `#`, so it gives `Title` alone before and after in every case (probe.ts, every case). The Outline's part of the step has no proof:
   - C9: frontMatterEnd's trim reads a header today and must not after.
   - C10: the BOM sentence of item 2.
   - The `\s*` closing today (Implied inputs 7).
   - The brief marks C10 an audit but not the Outline column of C1 to C9.
   - A header holding a YAML comment line makes the column discriminate. probe3.ts on main: `"  ---\n# draft\ntags: [alpha]\n---\n# Title\n" ["Title"]`. After the step the Outline must give `draft, Title`. `"<BOM>---\n# draft\ntags: [alpha]\n---\n# Title\n" ["Title"]` stays `Title` only if the BOM is removed before matching.
   - Recommend adding a `# draft` line to the header texts of C9 and C10. This changes the case texts, not the case count.
4. C10 asks the builder to quote what the preview, the embed and splitFrontmatter give. Those are places the step does not change for this input (decision 3). It is acceptable as an audit, and it is named here as asked.
5. C11 runs the tests of the deck and the feeds. Their code is unchanged, but the pattern they read moves, so the case is legitimate.
6. Verify 5 cannot be carried out as written. The new test imports `src/lib/data/prose/markdown/front-matter.ts`, which does not exist on the unchanged tree. Every row, the audits C4, C6 and C7 included, fails there at import. "A test of a behaviour the change preserves passes on the unchanged tree where it can run there" then has no run. The preview's pattern is a local constant of a Svelte component and cannot be imported on the unchanged tree. The brief should say how the first run reads each column on the unchanged tree: the old note-links export for the embed, the docs split and scanNote as they are, and the preview by reading.
7. No case contradicts the rules file otherwise. The audit sentences match spec.md:66-68: a case-run program is allowed, and tests are judged by reading.
8. No verify command checks "no other copy stays". The grep spec.md:72 asks for covers it once quoted. Recommend naming `grep -rn "FRONT_MATTER\|FRONTMATTER\|frontMatterEnd" src` with the expected output: the export in front-matter.ts and the imports of the six readers.

## The question

Can each part pass without the goal ("every reader of a leading header reads the same header by one exported pattern") being reached?

- Item 1: yes, alone. A pattern can be exported while readers keep copies; item 2 closes that. With the docs form taken unchanged, every reader agrees, but the empty header swallows the body (Implied inputs 1). The goal of one answer is reached, but the Outline's answer changes from right to wrong for that input.
- Item 2: no for each bullet as written. No command checks it (Cases and checks 8), so it rests on the review's reading.
- Item 3: yes. A HELP sentence and comments do not touch the readers. It is not meant to prove the goal.
- Item 4: yes, in part.
  - The preview and embed columns apply `text.replace(FRONT_MATTER, '')` in the test itself, so they pass if RenderedMarkdown keeps its own copy or html.ts imports an old pattern. They test the pattern, not the readers.
  - The Outline column passes whatever markdownOutline does with the header (Cases and checks 3).
  - The server token is a quoted run, not a row, although it is reachable (Premises 11).
  - Only the scanNote tags column and the splitFrontmatter column go through the readers. A stronger form: RenderedMarkdown rendered to a string through svelte/server, as tests/shell/rail/schedule-dialog.test.ts and others render components, or blockMarkdownParts with a note's text for the embed, and the token through `markdownRequests(...)['markdown/parse']`.
- C1, C2, C3: tags and split, no. Preview, embed and server, yes (above). Outline, yes.
- C4, C6, C7: audits that pass before and after. They cannot show the goal, as the brief says.
- C5: tags column trivially `[]` before and after. The split column already gives a block today. The preview and embed columns pass without the preview changing (above). So C5 could pass with no reader changed, other than the test's own replace.
- C8: the preview column passes without RenderedMarkdown changing, since the test applies the new pattern itself. The other columns are none before and after.
- C9: every column gives the same before and after (Outline `Title`, no tags, no split), so it cannot fail.
- C10: cannot fail (Cases and checks 3).
- C11: audits.
- The step line: yes, by the same gaps. The editor part rests on one quoted run, and the Outline part on no discriminating input.

## Implied inputs

1. (C) An empty header followed by a body with a later `---` or `...` line. It is missing, and a wrong answer costs a note's text and headings. The group `((?:[\s\S]*?\r?\n)?)` is greedy-optional, so the empty block is tried last. probe2.ts:
   - Text `"---\n---\n# Title\n\nText\n\n---\n\n## More\n"`: docs form match `"---\n---\n# Title\n\nText\n\n---\n"`; splitFrontmatter `{"block":"---\n# Title\n\nText\n\n","body":"\n## More\n"}`; markdownOutline today `["Title","More"]`.
   - Text `"---\n---\n# Title\n\n...\n"`: block `"---\n# Title\n\n"`, body `""`.
   - The same regex with `??` matches `"---\n---\n"` in both.
   - The docs.ts:51-57 comment ("lets an empty block ... split") holds only when no later closing line exists.
   - After the step, this input loses `Title` from the Outline, and the preview, the embed, the note scan and the server hide the body up to the rule.
   - Has it happened? A search of the hub's .md files whose first two lines are `---` and `---`/`...` found 5 files, all Jekyll fixtures under side-projects/theaxec.github.io/vendor/bundle. None has a later closing line. Empty front matter is Jekyll's standard page head.
   - Expected result: the header is the two lines alone.
   - This is a premise found wrong, and it clashes with item 2's "What `splitFrontmatter` returns for every input is unchanged". It goes to Axel as an open item:
     - (a) the one pattern tries the empty block first (`??`), changing splitFrontmatter for this input only, plus a case. Recommended.
     - (b) the docs form as is, the Outline regressing for this input.
     - (c) is not an option, since leaving the defect is the lazy one.
2. A header at the end of the file with no trailing line end, `"---\ntags: [alpha]\n---"`. probe.ts X1: all four patterns match today; tags line 1; Outline `[]`; server `map 0-3`. Not missing in effect. After the step it should be the same, and the server's line count handles it (requests.ts:35). A row would guard it cheaply.
3. A `...` line at column 0 inside the YAML (X2, `"---\nabstract: |\n  one\n...\ntags: [alpha]\n---\n# Title\n"`).
   - Today the note scan, the preview, the embed and the server read through the later `---`, while the docs reader and the Outline stop at `...`.
   - After the step all stop at `...`. The preview then shows `tags: [alpha]` as a setext heading, which is hidden today (`preview text: "# Title\n"`).
   - YAML itself ends the document at a column-0 `...`, so the wider form agrees with YAML. Expected: the header ends at `...`.
   - Nothing in the hub has such a header (Implied inputs 9). It is not required, and it is a cheap row.
4. A `---` line inside a block scalar (X3): all four agree today and after. No case needed.
5. A closing line `----` (X4).
   - Today the preview strips up to the first three dashes and renders `"-\n# Title\n"`, a stray empty list item. The others read no header.
   - After the step: no header anywhere. C8 covers the class.
   - `----` is the more likely text (a four-dash rule). Recommend it as C8's text or a second row.
6. An embed of a note whose header closes with `...`. html.ts:628 strips with the new pattern. The table's embed column is the test's own replace, not html.ts (The question). Expected: the embed shows the body only.
7. Unicode whitespace after a delimiter (X11, a closing `---<no-break space>`).
   - Today the Outline reads a header (`\s*`, outline.ts:58), the preview strips the dashes, and note and docs read none.
   - After the step: none anywhere, and the Outline changes.
   - Rare. Expected: no header. Not required.
8. Lone CR line ends (X7). scanNote turns `\r` into `\n` (note-links.ts:277) and reads tag alpha. markdown-it normalises too and gives the token. The Outline, the preview and docs read none, and the Outline gives `[]` today. After the step the note scan and the server still read a header and the others do not, so the goal "same header" is not met for this input. Rare (classic Mac files). Item 1 says "CRLF and LF both read". Name it in the report as left as is.
9. Has the wider form changed any real file? A search of the hub's .md files (vendor excluded) for a header whose opening or closing is not a bare `---` (a `...` closing or trailing whitespace) printed nothing. The step changes no rendering of a hub file today.
10. A preview of a file that is no note. RenderedMarkdown strips every Markdown file it is given: the source tab, the preview tab, and Post.svelte:97-100, which passes the post body after the split. A README opening with a `---` rule and holding a later `...` line becomes a hidden header in the preview, as the docs route already hides it. Expected: as the docs route. No case needed.
11. The deck split and the feeds writes. splitFrontmatter is unchanged, and C11 runs present.test.ts and feeds.test.ts (both pass on main, Premises 10). No case missing.
12. scanNote's headings. Today C2 and C3 give a heading `tags: [alpha]` (setext) from the header's last line. It reaches heading completion after `[[note#` (lsp/adapters/markdown/own/wiki.ts:137) and `sectionOf` for an embed (html.ts:630). After the step it goes. No column checks scanNote's headings. Recommend adding them beside the tags; this is a check on the same rows, not a new case.
13. The Outline over a header with a YAML comment line (Cases and checks 3). It is the only input that shows the Outline's part, and it is missing.

## ADRs

`ls docs/adr` prints "ls: docs/adr: No such file or directory". No record applies, as the brief says.

## Dictated text

The brief dictates no line of text for a file. Items 1, 2 and 3 state what a comment or the HELP sentence must say, not its words (`grep -n "one sentence" briefs/O133.md` gives line 32; item 1's head comment at line 25; RenderedMarkdown's comment at line 30).

It dictates names:
- `FRONT_MATTER` and `src/lib/data/prose/markdown/front-matter.ts`: `grep -n "front-matter.ts"` gives lines 25 and 55. Holds.
- `tests/data/prose/markdown/front-matter.test.ts`: lines 33, 62 and 104. Holds.

The brief's own text breaks the ledger folder's character set (plan.md:3, "everything else in this folder is ASCII"). `LC_ALL=C perl -ne '... if /[^\x20-\x7E\n]/'` over the brief prints `19: EF BB BF` and `50: EF BB BF`, a literal BOM in paragraph 19 and in C10's text. If the builder copies C10's text into the test, the ASCII gate (spec.md:103) fails. Recommend writing it as `<BOM>` in the brief.

## Declined to judge

- The "Libraries checked" facts (gray-matter 4.0.3, front-matter 4.0.2, markdown-it-front-matter 0.2.4, their licences and dates) were not looked up.
- Whether the HELP sentence belongs in the tag bullet at :405 or a bullet of its own is the builder's to write and the review's to read.
- Whether split.ts:7 is false or only imprecise after the step (Names) is left to the orchestrator.

Usage: aa8f129fd1b7631ff, claude-opus-5-5, 223032 tokens, 61 tool uses, 12 min 14 s.

## Closed

The findings that need a ruling are raised in one stop, open item 652: the test's guarded entry (Cases and checks 1, finding B), the paths the step must widen to (Premises 5, finding A; Names, `config/text/server.yml:385` and `deck/split.ts:7`), and the empty header the docs form swallows (Implied inputs 1, finding C). The brief is restored to main's copy (main has none, so it is removed) and kept aside; the other findings are closed in it when `/spec` runs again after the ruling, as the spec skill's Steps 5 says of a step whose brief check has run.

