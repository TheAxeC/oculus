# O133 report: one front-matter pattern for every Markdown reader

Everything in the brief is done. Check 1's combined command depends on the machine's load: in round 1 it was red once on a 5000 ms timeout of `tests/checks/tree/boundaries.test.ts > layer boundaries > holds across src/lib` (5546 ms, load average 12.28) and green in its last run (`Tests  119 passed (119)`, that test 3694 ms, load average 12.76); the reviewer's runs of that file alone timed out twice, at load averages 18.24 and 16.84. The last `npm run test:quick` printed `test:quick: 102.7 s; every command passed`.

## Open items of the state file (verbatim)

- None.

## The cases' first run (unchanged tree, before any code change)

The test `tests/data/prose/markdown/front-matter.test.ts` was written first and run on the unchanged tree with `npx vitest run tests/data/prose/markdown/front-matter.test.ts --reporter=verbose`. Result lines as printed (vitest cuts long titles with its own ellipsis character, written here as `<ellipsis>`; the check marks are written `<check>` and `<cross>`):

```
 <cross> |unit| ... > 'a header closed by ...' 30ms
 <cross> |unit| ... > 'a header whose closing --- has a trai<ellipsis>' 2ms
 <cross> |unit| ... > 'a header whose opening --- has a trai<ellipsis>' 1ms
 <check> |unit| ... > 'a header with CRLF line ends' 1ms
 <cross> |unit| ... > 'an empty header' 1ms
 <check> |unit| ... > 'an opening --- with no closing line, <ellipsis>' 1ms
 <check> |unit| ... > 'two --- lines further down, which are<ellipsis>' 0ms
 <cross> |unit| ... > 'a closing line with text after its da<ellipsis>' 1ms
 <cross> |unit| ... > 'a closing line of four dashes, which <ellipsis>' 1ms
 <cross> |unit| ... > 'an opening line with leading spaces, <ellipsis>' 1ms
 <check> |unit| ... > 'a header after a BOM, a header to the<ellipsis>' 5ms
 <cross> |unit| ... > 'an empty header and a --- rule furthe<ellipsis>' 1ms
 <cross> |unit| ... > 'a ... line inside the YAML, which clo<ellipsis>' 1ms
 <check> |unit| ... > 'a header at the end of the text with <ellipsis>' 0ms
 Test Files  1 failed (1)
      Tests  9 failed | 5 passed (14)
```

(`...` after `|unit|` stands for `tests/data/prose/markdown/front-matter.test.ts > the leading header every reader reads`; the titles are the test's own.)

Each row compares one object of seven columns (tags, headings, outline, block, preview, embed, token); `-` is the expected value, `+` what the unchanged tree gave. The failing diffs, by case:

- C1 'a header closed by ...': fails. Preview and embed `+ "hr", + "p tags: [alpha] ..."` before `"h1 Title"`; `- tags [{line 1, alpha}]` `+ "tags": []`; `- token {hidden true, map [0,3]}` `+ "token": null`. Outline and block match. As the brief's Before.
- C2 'a header whose closing --- has a trailing space': fails. Embed `+ "hr", + "h2 tags: [alpha]"`; headings `+ {level 2, line 1, text "tags: [alpha]"}`; preview matches (`"h1 Title"` alone); `+ "tags": []`; `+ "token": null`. As the brief's Before (the embed shows the YAML, the server reads a setext heading).
- C3 'a header whose opening --- has a trailing tab': fails. Preview and embed `+ "hr", + "h2 tags: [alpha, beta]"`; headings `+ {level 2, line 1, text "tags: [alpha, beta]"}`; `+ "tags": []`; `+ "token": null`. As the brief's Before.
- C4 'a header with CRLF line ends': passes (audit).
- C5 'an empty header': fails. Preview and embed `+ "hr", + "hr"` before `"h1 Title"`; `+ "token": null`; block `""` and Outline match. As the brief's Before.
- C6 'an opening --- with no closing line, which is no header': passes (audit).
- C7 'two --- lines further down, which are no header': passes (audit).
- C8 row 1 'a closing line with text after its dashes, which is no header': fails on the preview alone: `- "hr", - "p tags: [alpha] ---x"` `+ "p x"`. As the brief's Before.
- C8 row 2 'a closing line of four dashes, which is no header': fails on the preview alone: `- "hr", - "h2 tags: [alpha]"` `+ "li "` (an empty list item). As the brief's Before.
- C9 'an opening line with leading spaces, which is no header': fails on the Outline alone: `- "draft"` (it gave `Title` alone). As the brief's Before.
- C10 'a header after a BOM, a header to the note scan and the Outline alone': passes (audit).
- C11 'an empty header and a --- rule further down, the header its two lines alone': fails. `- "block": ""` `+ "block": "---\n# Title\n\nText\n\n"`; preview and embed `- "h1 Title", - "p Text", - "hr"` (both drew `"h2 More"` alone); headings `- {level 1, line 2, text "Title"}` (only `More` on line 8); token `- 2` `+ 7` (map `[0, 7]`); Outline matches (`Title`, `More`). The brief asked the first run to quote the other columns: the note scan, the preview, the embed and the server all read the header to the later `---` line, as the docs split does.
- C12 'a ... line inside the YAML, which closes the header': fails. Preview and embed `- "h2 tags: [alpha]"` (both drew `"h1 Title"` alone); headings `- {level 2, line 4, text "tags: [alpha]"}`; token `- 4` `+ 6`; block `"abstract: |\n  one\n"`, tags `[]` and Outline match. As the brief's Before: the note scan, the preview, the embed and the server read to the later `---`, the Outline and the docs split stop at `...`.
- C13 'a header at the end of the text with no line end after it': passes (audit).
- C14: `npx vitest run tests/data/sources/docs.test.ts tests/data/sources/present.test.ts tests/server/edit/feeds.test.ts` on the unchanged tree: `Test Files  3 passed (3)`, `Tests  39 passed (39)`.

No case the brief's rules got wrong: every failing row failed on the columns the brief's Before names, and every audit row passed.

The expected drawn blocks of the no-header rows were checked before the test was written by a case-run program over marked alone (none of the readers), `node marked-probe.mjs` in the scratchpad, since removed:

```js
import { Marked } from '<worktree>/node_modules/marked/lib/marked.esm.js';
const reader = new Marked({ gfm: true });
for (const body of bodies) console.log(JSON.stringify(body), '=>',
    reader.lexer(body).filter((t) => t.type !== 'space').map((t) => `${t.type}${t.depth ? t.depth : ''} ${JSON.stringify(t.text ?? '')}`).join(' | '));
```

Its output, among others: `"---\ntags: [alpha]\n----\n# Title\n" => hr "" | heading2 "tags: [alpha]" | heading1 "Title"`, `"  ---\n# draft\ntags: [alpha]\n---\n# Title\n" => hr "" | heading1 "draft" | heading2 "tags: [alpha]" | heading1 "Title"`, `"<BOM>---\n# draft\ntags: [alpha]\n---\n# Title\n" => paragraph "<BOM>---" | heading1 "draft" | heading2 "tags: [alpha]" | heading1 "Title"`, `"# Title\n\nText\n\n---\n\n## More\n" => heading1 "Title" | paragraph "Text" | hr "" | heading2 "More"`.

Edits to the test after its first run, each checked by reading: the BOM row's two strings were written with the escape `\u{FEFF}` (the first form held a literal <BOM> in the source; the string value is the same character); `one[1] === undefined` became `one[0].startsWith('<hr')` and `tokens[0]` became `tokens.at(0)` (eslint's no-unnecessary-condition); the types `NoteTag` and `NoteHeading`, which note-links.ts does not export, became `NoteScan['tags']` and `NoteScan['headings'][number]`; prettier's layout. No row, input or expected value changed.

## DONE / NOT DONE

| Item | State | Proof (command, output as printed) |
| --- | --- | --- |
| 1. `front-matter.ts` with `FRONT_MATTER`, empty block tried first | DONE | `grep -rnE "FRONT_MATTER\|FRONTMATTER\|frontMatterEnd" src` prints `src/lib/data/prose/markdown/front-matter.ts:23:export const FRONT_MATTER = /^---[ \t]*\r?\n((?:[\s\S]*?\r?\n)??)(?:---\|\.\.\.)[ \t]*(?:\r?\n\|$)/;`; rows C5, C11 pass |
| 2. Every reader uses it, no copy left; views row and its reason | DONE | the grep of check 2 below; `npx vitest run tests/checks/tree/boundaries.test.ts`: `Tests  11 passed (11)` |
| 3. HELP sentence, LinkedIn sentence, split.ts:7 comment, head comments | DONE | `git diff docs/HELP.md config/text/server.yml src/lib/data/sources/deck/split.ts`; the grep table below |
| 4. Test of G150, one table, readers only | DONE | `npx vitest run tests/data/prose/markdown/front-matter.test.ts`: `Tests  14 passed (14)` |
| C1 to C13 after | DONE | the same run, all 14 rows `<check>` |
| C14 | DONE | check 1's run: docs, present and feeds among the 7 passing files |
| Check 1, the combined command | DONE in its last run; red on a timeout in earlier runs | last run (round 1, after the last change, load average 12.76): `Test Files  8 passed (8)`, `Tests  119 passed (119)`, 'holds across src/lib' 3694 ms. Earlier runs, the first of round 1 among them (load average 12.28): `Test Files  1 failed \| 7 passed (8)`, `Tests  1 failed \| 118 passed (119)`, `FAIL  \|unit\| tests/checks/tree/boundaries.test.ts > layer boundaries > holds across src/lib` `Error: Test timed out in 5000ms.` (5546 ms). The reviewer's runs of that file alone timed out twice (load averages 18.24 and 16.84) and passed with `--testTimeout=60000`; `vitest checks` of `npm run test:quick` passes it in every run |
| Check 2, the two greps | DONE | outputs quoted below |
| Check 3, `npm run diagrams` then `npm run test:quick` | DONE | last run (round 1): every line `ok`, `test:quick: 102.7 s; every command passed`. The run before it in round 1 was red on `FAILED  vitest (125.0 s)`, one test, `tests/data/hubs/workspace-projects.test.ts > a folder of the workspace that holds a project manifest > is the second hub's project alone when that hub's scan reads its manifest`, `Error: Test timed out in 5000ms.`; rerun alone `npx vitest run tests/data/hubs/workspace-projects.test.ts`: `Test Files  1 passed (1)`, `Tests  5 passed (5)` |
| Check 4, the character-set check | DONE | `LC_ALL=C perl -ne 'print "$ARGV:$.:$_" if /[^\x20-\x7E\n]/; close ARGV if eof' <the twelve changed files>` printed nothing, `perl exit 0` |
| Check 5, unused exports | DONE | `sh utils/unused-exports.sh` against `../O133-base/unused-exports.txt`: `diff` printed nothing, `unused diff exit 0` |
| Check 6, before and after runs | DONE | first run quoted above; after: `Tests  14 passed (14)` |
| Check 7, list items and sentences | DONE | below |

Check 2, `grep -rnE "FRONT_MATTER|FRONTMATTER|frontMatterEnd" src`:

```
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
```

`grep -rnF -- '^---' src`:

```
src/lib/data/sources/deck/split.ts:51:const SEPARATOR = /^---[ \t]*$/;
src/lib/data/sources/deck/outline.ts:25:const CUT = /^---[ \t]*$/;
src/lib/data/prose/markdown/front-matter.ts:23:export const FRONT_MATTER = /^---[ \t]*\r?\n((?:[\s\S]*?\r?\n)??)(?:---|\.\.\.)[ \t]*(?:\r?\n|$)/;
```

`SEPARATOR` is at `split.ts:51`, one line below the brief's `:50`, since the rewrapped head comment of split.ts gained a line.

Verify list runs: three. The first was red on `svelte-check` in the new test file (`NoteHeading` and `NoteTag` are not exported by note-links.ts); fixed, the file rerun alone, the list run again: `test:quick: 119.1 s; every command passed`. The third ran after the last change to docs.ts (the `text.match` judgment call below): red on `vitest slow` in `tests/data/hubs/hub-portfolio.test.ts`, a file the step does not change, which passes alone. No whole-suite command was run.

Check 7: the spec's one standards page asks for one line per bullet or paragraph and plain prose. The HELP bullet is one line of two sentences (28 and 17 words, `wc -w` over its parts); the LinkedIn sentence is one sentence of 20 words; the new comments are whole paragraphs rewrapped at 100 columns. No departure.

The grep of item 3, `grep -rniE "FRONT_MATTER|FRONTMATTER|frontMatterEnd|front matter|front-matter" src tests docs config README.md --exclude=local.yml` (diagrams left out), each comment hit:

| Hit | Mark |
| --- | --- |
| `note-links.ts:13-14` head comment, a tag of the front matter | rewritten: names front-matter.ts |
| `note-links.ts:155` NoteScan tags doc | still true |
| `note-links.ts:220-223` frontTags doc | rewritten: the block starts on the second line |
| `docs.ts:23,53-57,77-79,98,105,120` | `:53-57` rewritten (names the pattern's place); the rest still true |
| `requests.ts:24-28` parser comment | rewritten: the token covers every line, the closing line included |
| `outline.ts:8-9` head comment | still true (a heading outside a leading front matter block) |
| `outline.ts:57-63` markdownOutline doc | rewritten |
| `RenderedMarkdown.svelte:14-17` head comment | rewritten: the document route splits the same block off by the same pattern |
| `split.ts:3-11` head comment | rewritten: names data/prose/markdown/front-matter.ts through splitFrontmatter |
| `split.ts:13-40`, `deck/outline.ts:13-15`, `deck/slide-text.ts:7-8,49,80,109`, `deck/project.ts:1,116`, `deck/kinds.ts:3,148,200`, `model-deck.ts:42-64`, `deck/read.ts:265` | still true |
| `feeds.ts:177-179,322,328-329,360-361,410,476` (server edit) | still true (the block `splitFrontmatter` finds) |
| `writing/markdown.ts:3-4,14`, `writing/folder.ts` | still true |
| `server/content/docs.ts:143,152,553`, `state/system/docs.svelte.ts:41` | still true |
| `linkedin-idea.ts:1,5,18`, `data/sources/documents/feeds.ts:44` | still true |
| `Tags.svelte:3` | still true |
| `docs/HELP.md:405` | still true; `:406` added |
| `docs/templates.md:864`, `:883-893` (the Notes section's head to copy) | still true |
| `config/text/server.yml:385` | rewritten; `:386` still true; `config/text/findings.yml:128` still true |
| `tests/server/edit/feeds.test.ts`, `tests/data/sources/present.test.ts`, `tests/data/sources/docs.test.ts`, `tests/checks/config/integrity.test.ts`, `tests/server/machine/runs/lint/writing.test.ts:2` | still true |

The history-word grep over every added line and the two new files (`before|used to|no longer|still|always has been|always had|as before|previously|the step adds|after this package lands`, package ids, dates) prints one hit, `* file whose block does not parse still has it.`: the existing sentence of splitFrontmatter's doc, rewrapped, meaning a reader keeps the body; no history.

Edits to an existing assertion, allow list or predicate (from `diff` of `tests/checks/tree/layer-rows.ts` against the base copy): one line added to the views row, `'data/prose/markdown/front-matter',` (before: absent), and the five-line comment paragraph giving its reason. No other test file changed.

## Files

From `diff -rq` of src, tests, utils, config and docs against `../O133-base`, line counts from `git diff --numstat` (added, removed) and `wc -l`:

| Path | Change | Lines now |
| --- | --- | --- |
| `src/lib/data/prose/markdown/front-matter.ts` | new | 23 |
| `src/lib/data/prose/markdown/note-links.ts` | +10 -12 | 453 |
| `src/lib/data/sources/documents/docs.ts` | +5 -12 | 151 |
| `src/lib/ui/html.ts` | +2 -1 | 712 |
| `src/lib/server/machine/lsp/adapters/markdown/requests.ts` | +4 -3 | 133 |
| `src/lib/views/shared/prose/RenderedMarkdown.svelte` | +4 -7 | 192 |
| `src/lib/state/sources/explorer/sections/outline.ts` | +11 -8 | 168 |
| `src/lib/data/sources/deck/split.ts` (lines 3-11) | +5 -4 | 139 |
| `config/text/server.yml` (line 385) | +1 -1 | |
| `tests/checks/tree/layer-rows.ts` (lines 227-231, 287) | +6 -0 | 363 |
| `tests/data/prose/markdown/front-matter.test.ts` | new | 263 |
| `docs/HELP.md` (line 406) | +1 -0 | |
| `docs/diagrams/layer-data`, `layer-state`, `layer-ui`, `layer-views`, `layers` (`.dot` and `.svg`) | regenerated by `npm run diagrams` | |
| `.scratch/migration/agents/reviews/O133-report.md` | this report | |

Every path is on the write list. The comment paragraph of layer-rows.ts sits at lines 227-231, the end of the block the brief names as 160-226, which grew by the five lines. `docs/diagrams/writes.*` is unchanged.

## Judgment calls

- The lone CR of decision 4: unchanged. The note scan and the Markdown server turn a lone CR into `\n` (scanNote's `/\r\n?/g` at `note-links.ts:275`; markdown-it's `UNNORMALIZED_NEWLINE_RE = /\r\n?/g` at `node_modules/markdown-it/dist/markdown-it.cjs.js:1514`, which has no BOM rule: `grep -c FEFF` prints 0) and read a header; the Outline (`split(/\r?\n/)`), the preview, the embed and the docs split match `\r?\n` and read none. Read from the code; no run holds a lone CR. No row of the test holds a lone CR, and its head comment says so.
- `splitFrontmatter` matches with `text.match(FRONT_MATTER)` rather than `FRONT_MATTER.exec(text)`: the write diagram (`utils/diagrams/writes.mjs`) lists a method call on an imported value as a call it cannot follow, and with `exec` it drew `docs.ts:59 FRONT_MATTER.exec(` among the calls not placed and pulled docs.ts and the deck modules into the drawn write chains (`docs/diagrams/writes.dot` +1053 -970 lines). With `text.match` and a pattern without the `g` flag the match is the same, and `writes.dot` regenerates unchanged from the base.
- The line count of a matched header, `match[0].replace(/\r?\n$/, '').split(/\r?\n/).length`, is written in requests.ts (where it was) and in outline.ts. The new module exports the pattern alone, as the brief's item 1 names; a shared helper for the count would be a second export the brief does not name.
- The Outline's BOM is a module constant `BOM = /^\u{FEFF}/u` in outline.ts, written with the braced escape; note-links.ts keeps its own BOM expression at `note-links.ts:275`, unchanged.
- `frontTags` takes group 1 and places a tag at `1 + lineAt(body, offset)`: the block always starts on the line after the opening line, whatever that line's trailing spaces.
- The views row's reason sits as a new paragraph at the end of the comment block over `ALLOWED`, where the views row had no paragraph of its own.
- The test reads a drawn document as its list of blocks (`hr`, or a tag `h1`-`h6`, `p`, `li` with its text, markup taken out and runs of spaces and line ends folded), so a header line drawn as a rule or a paragraph is a block of its own; preview and embed share one expected list per row.

## Host- and user-visible changes, before and after

Each is seen on landing on a scratch server; texts are note texts under a hub's `.oculus/notes/`.

- The preview (a Markdown source tab's rendered half, or the Markdown preview tab). Open `---\ntags: [alpha]\n...\n# Title\n`: before, a rule and the paragraph `tags: [alpha] ...` above `Title`; after, `Title` alone. Open `---\n---\n# Title\n`: before, two rules above `Title`; after, `Title` alone. Open `---\ntags: [alpha]\n---x\n# Title\n`: before, `x` above `Title`; after, a rule, the paragraph `tags: [alpha] ---x`, `Title`. Open `---\ntags: [alpha]\n----\n# Title\n`: before, an empty bullet above `Title`; after, a rule, the heading `tags: [alpha]`, `Title`. Open `---\n---\n# Title\n\nText\n\n---\n\n## More\n`: before, `More` alone; after, `Title`, `Text`, a rule, `More`. Open `---\nabstract: |\n  one\n...\ntags: [alpha]\n---\n# Title\n`: before, `Title` alone; after, the heading `tags: [alpha]` and `Title`.
- An embed: a note holding `![[other]]` where `other.md` holds the texts above draws the same blocks as the preview, after. Before, a header closed by `...` or by `--- ` (trailing space), or opened by `---<tab>`, or empty, showed as rules and its YAML inside the embed.
- The Outline section: `  ---\n# draft\ntags: [alpha]\n---\n# Title\n` lists `draft` and `Title` (before, `Title` alone). A closing line followed by a no-break space is no closing (decision 5), so such a file lists no header skip. A text whose opening line is `---` followed by a no-break space: before, a header (the base read the first line with `trim`); after, none, so the lines below it are read for headings.
- The Markdown server's headings (the Outline the server answers, the breadcrumb, go to symbol): a header closed by `...` or `--- `, or opened by `---<tab>`, gives no heading `tags: [...]` after (before, a setext heading over lines 1-3); an empty header is hidden; in the C11 text, `# Title` is a heading after (before, hidden with the first seven lines).
- The note scan (Tags section, Backlinks, tag search): the tags of a header closed by `...` or `--- `, or opened by `---<tab>`, are listed after, each on line 1 (before, none); in the C11 text the heading `Title` is listed after.
- The note scan's headings, which the Markdown server offers after `[[note#` (`src/lib/server/machine/lsp/adapters/markdown/own/wiki.ts:137`) and which an embed `![[note#heading]]` reads a section by: in C2 (`---\ntags: [alpha]\n--- \n# Title\n`) and C3 (`---<tab>\ntags: [alpha, beta]\n---\n# Title\n`), before, a heading `tags: [alpha]` or `tags: [alpha, beta]` on line 1; after, none, `Title` alone. In C12 (`---\nabstract: |\n  one\n...\ntags: [alpha]\n---\n# Title\n`), before, `Title` alone; after, the heading `tags: [alpha]` on line 4 as well.
- The preview of a header whose opening line ends in a tab (C3, `---<tab>\ntags: [alpha, beta]\n---\n# Title\n`): before, a rule and the heading `tags: [alpha, beta]` above `Title`; after, `Title` alone.
- The LinkedIn sentence (a LinkedIn idea promoted to a post whose file has no front matter): before, "The LinkedIn idea has no front matter between two --- lines."; after, "The LinkedIn idea has no front matter, a first line --- and a closing line --- or ... below it."
- The docs split (the document route, the deck, the LinkedIn view and its writes, the writing lint): differs only for an empty header followed by a later `---` or `...` line (C11), whose block is `""` after and whose body keeps the text up to that line.
- The layer diagrams on the Help page: the views layer gains its import of `data/prose/markdown/front-matter`.

## Wrong or impossible in the brief

- `deck/split.ts:50` (`SEPARATOR`) in check 2 is `:51` after the step's own rewrap of that file's head comment (grep quoted above).
- Check 1's combined command does not finish green on this machine at its load: `boundaries.test.ts`'s 'holds across src/lib' runs about 4 s alone and 7.3 s beside the other seven files, over its 5000 ms limit. No timeout or configuration was changed for it.
- Nothing else.

## Limitations

- The lone CR and a BOM before a header are read differently by the readers, as decisions 3 and 4 keep; G150's test covers the BOM in one row and the lone CR in none.
- An embed's preview and the source tab's preview are checked by the rendered markup on the server (`svelte/server`, no DOM, the sanitiser a pass-through there); how they look is for the look on landing.

## Repair round 1

Every item of `agents/briefs/O133-round-1.md` is done. This section states the state after the round; where it differs from the sections above (the judgment calls on the line count and the Outline's BOM constant, and the "Wrong or impossible" bullet on check 1), this section holds.

### Item 1, the two exceptions named

- `src/lib/data/prose/markdown/front-matter.ts:7-11`: "So a line is header to all of them or to none, and a note's tags come from the lines the preview leaves out, with two exceptions: one byte-order mark before the opening line is skipped by the note scan (its tags and headings) and the Outline alone, and a text with lone CR line ends has a header in the note scan and the Markdown server alone, since those two read a lone CR as a line end." The module's last paragraph (`:22-24`) says what it holds after item 2.
- `tests/checks/tree/layer-rows.ts:228-234`: the preview leaves out the lines the others take as the header, "but for one byte-order mark before the opening line, which the note scan and the Outline alone skip, and lone CR line ends, which the note scan and the Markdown server alone read"; the module "holds that pattern, the byte-order mark and the count of a header's lines, no reader and no I/O".
- `docs/HELP.md:406`, one line: "A note's front matter runs from a first line `---` to the next line that is `---` or `...`, either line allowed to end in spaces or tabs; a note without that closing line has none. The preview, an embed, the Outline and the tags all take the same lines as front matter, except that the tags and the Outline skip a byte-order mark before the first line and the preview and an embed do not." Two sentences.
- Not changed: `note-links.ts:13-14` and `requests.ts:26-27` call the pattern "the header every reader of a Markdown file reads", naming the shared pattern; item 1 names three places and these two are not among them.

### Item 2, the rule exists once

`front-matter.ts` exports, beside `FRONT_MATTER`:

```ts
/** One byte-order mark at the start of a text. */
export const BYTE_ORDER_MARK = /^\u{FEFF}/u;

/** The number of lines a match of `FRONT_MATTER` spans, its closing line included. */
export function headerLines(header: string): number {
    return header.replace(/\r?\n$/, '').split(/\r?\n/).length;
}
```

- `note-links.ts:275` is `source.replace(BYTE_ORDER_MARK, '')`, imported at `:35`.
- `outline.ts` lost its own `BOM`; `:67` is `FRONT_MATTER.exec(text.replace(BYTE_ORDER_MARK, ''))` and `:68` `headerLines(header[0])`, imported at `:19-23`.
- `requests.ts:36` is `headerLines(found[0])`, imported at `:19`.
- `grep -rnE "BYTE_ORDER_MARK|headerLines|uFEFF|u\{FEFF\}|split\(/\\\\r\?\\\\n/\)\.length" src` prints the two exports, those imports and uses, and BOM handling in modules the step does not touch (`server/machine/runs/lint/routes.ts:216`, `lint/text.ts:13`, `lint/readers.ts:87`, `server/files/source/source.ts:241`, `data/prose/text-edits.ts:26`, which read a BOM of a linted or saved file, not a header); no other copy of the count.
- The test's rows are unchanged; after this item `npx vitest run tests/data/prose/markdown/front-matter.test.ts`: `Test Files  1 passed (1)`, `Tests  14 passed (14)`.
- `sh utils/unused-exports.sh` against `../O133-base/unused-exports.txt`: `diff` printed nothing, `unused diff exit 0`.

### Item 3, the reason at docs.ts

`src/lib/data/sources/documents/docs.ts:59-61`, over `const match = text.match(FRONT_MATTER);`:

```ts
    // A string's own method, where the other readers call `FRONT_MATTER.exec`: the write diagram
    // (utils/diagrams/writes.mjs) draws a call of a method of an imported value in its group of
    // what is not placed, and `text.match` keeps the write diagram as it is.
```

`npm run diagrams` leaves `docs/diagrams/writes.*` unchanged from the base (`git status --short docs/diagrams` lists only the layer diagrams).

### Item 4, the visible changes added

Added to "Host- and user-visible changes, before and after": the preview of C3 (before, a rule and the heading `tags: [alpha, beta]` above `Title`; after, `Title` alone); the note scan's headings offered after `[[note#` (`own/wiki.ts:137`, `scanNote(text).headings`, read in this round) and read by `![[note#heading]]` (C2 and C3 lose the heading `tags: [...]` on line 1; C12 gains `tags: [alpha]` on line 4); the Outline of a text opening with `---` and a no-break space (before, a header; after, none).

### Item 5, the first line and the rows of checks 1 and 3

Rewritten above to the runs of this round.

### Runs of this round, after the last change

- Check 1, `npx vitest run <the eight files of the brief>`: first run red, `FAIL  |unit| tests/checks/tree/boundaries.test.ts > layer boundaries > holds across src/lib`, `Error: Test timed out in 5000ms.` (5546 ms, load average 12.28), `Tests  1 failed | 118 passed (119)`; that file alone, `Test Files  1 passed (1)`, `Tests  11 passed (11)`; last run, after the last change (load average 12.76), `Test Files  8 passed (8)`, `Tests  119 passed (119)`.
- Check 2: `grep -rnE "FRONT_MATTER|FRONTMATTER|frontMatterEnd" src` prints the export at `front-matter.ts:27` and the imports and uses in note-links.ts (`:35`, `:276`), docs.ts (`:16`, `:62`), html.ts (`:46`, `:629`), requests.ts (`:19`, `:33`), RenderedMarkdown.svelte (`:37`, `:121`) and outline.ts (`:21`, `:67`), and three comment lines in those files (`front-matter.ts:32`, `docs.ts:59`, `requests.ts:26`). `grep -rnF -- '^---' src` prints `src/lib/data/sources/deck/split.ts:51:const SEPARATOR = /^---[ \t]*$/;`, `src/lib/data/sources/deck/outline.ts:25:const CUT = /^---[ \t]*$/;` and `src/lib/data/prose/markdown/front-matter.ts:27:export const FRONT_MATTER = ...` (the pattern as at the top of this report), and nothing else.
- Check 3, full verify list runs in this round: two. The first: `FAILED  vitest (125.0 s)`, one test, `tests/data/hubs/workspace-projects.test.ts > a folder of the workspace that holds a project manifest > is the second hub's project alone when that hub's scan reads its manifest`, `Error: Test timed out in 5000ms.`, a file the step does not change; rerun alone, `Test Files  1 passed (1)`, `Tests  5 passed (5)`. The second, after `npm run diagrams`:

```
ok      prettier (1.4 s): All matched files use Prettier code style!
ok      ASCII gate (1.5 s)
ok      svelte-kit sync (3.3 s)
ok      eslint (3.7 s)
ok      svelte-check (13.0 s): 1793726068858 COMPLETED 582 FILES 0 ERRORS 0 WARNINGS 0 FILES_WITH_PROBLEMS
ok      vitest (68.9 s): Duration  53.03s (transform 38.53s, setup 0ms, import 90.72s, tests 110.19s, environment 2.48s)
ok      vitest checks (93.4 s): Duration  77.49s (transform 72.47s, setup 0ms, import 122.57s, tests 141.45s, environment 4ms)
ok      vitest slow (99.2 s): Duration  83.32s (transform 24.77s, setup 0ms, import 58.28s, tests 147.46s, environment 4ms)
test:quick: 102.7 s; every command passed
```

- Check 4: `LC_ALL=C perl -ne 'print "$ARGV:$.:$_" if /[^\x20-\x7E\n]/; close ARGV if eof'` over the twelve changed source, test, config and docs files and `docs/diagrams/*.dot` printed nothing, `perl exit 0`.
- Check 5: as under item 2, `unused diff exit 0`.
- Check 6: the new test after the round, `Tests  14 passed (14)`; no test changed in this round.
- `npx eslint` over the six TypeScript files this round changes: exit 0; `npx prettier --write` laid out the import of `requests.ts` on one line.
- No whole-suite command was run.

### Files changed in this round, with line counts after it

| Path | Against the base (added, removed) | Lines now |
| --- | --- | --- |
| `src/lib/data/prose/markdown/front-matter.ts` | new | 35 |
| `src/lib/data/prose/markdown/note-links.ts` | +11 -13 | 453 |
| `src/lib/data/sources/documents/docs.ts` | +8 -12 | 154 |
| `src/lib/server/machine/lsp/adapters/markdown/requests.ts` | +5 -4 | 133 |
| `src/lib/state/sources/explorer/sections/outline.ts` | +13 -9 | 169 |
| `tests/checks/tree/layer-rows.ts` | +9 -0 | 366 |
| `docs/HELP.md` | +1 -0 (line 406 rewritten) | |
| `.scratch/migration/agents/reviews/O133-report.md` | this report | |

Every path is on the brief's write list. `diff -rq` of src, tests, utils, config and docs against `../O133-base` lists 22 paths: the twelve of the step and ten layer diagram files (`layer-data`, `layer-state`, `layer-ui`, `layer-views`, `layers`, each `.dot` and `.svg`).
