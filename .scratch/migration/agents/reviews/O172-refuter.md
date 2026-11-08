# Step O172 refuter report (on .agents/worktrees/migration-O172, base bf279a486)

A page this report cites (the rules file, a standard, a skill's text) is named with its section, never with a line number, since a page's lines move and a section's name does not. A finding in code keeps its `file:line`.

The report is written in the rules file's character set. A character outside it in a quoted line is written by its name in angle brackets, such as `<tab>` or `<em dash>`.

## Verification (rerun by the reviewer)

```
ls docs/adr => ls: docs/adr: No such file or directory

npm run diagrams; diff -r docs/diagrams <snapshot taken before> => "diagrams unchanged by rerun"
npm run test:quick -- --base bf279a486 (TMPDIR and GIT_CEILING_DIRECTORIES set to .agents/scratch, piped through tail; the rules file names no other filter)
ok      prettier (0.6 s): All matched files use Prettier code style!
ok      ASCII gate (0.7 s)
ok      svelte-kit sync (2.7 s)
ok      eslint (2.6 s)
ok      svelte-check (9.2 s): 1794168746953 COMPLETED 591 FILES 0 ERRORS 0 WARNINGS 0 FILES_WITH_PROBLEMS
ok      vitest (38.0 s): Duration  27.04s (transform 32.11s, setup 0ms, import 52.05s, tests 10.70s, environment 1.22s)
FAILED  vitest checks (46.1 s)
 FAIL  |unit| tests/checks/source/html-sites.test.ts > every {@html} site > is one of the sites this file knows about
AssertionError: expected 19 to be greater than or equal to 32
 Test Files  1 failed | 11 passed (12)
      Tests  1 failed | 148 passed | 9 skipped (158)
test:quick: 48.9 s; failed: vitest checks

Verify 2, the perl ASCII gate over the 28 changed paths: printed nothing, ascii-exit:0

Verify 3, grep -rn "inlineMarkdown" src/lib/views (23 lines), source lines:
  ArchivalCard.svelte:18,56; OrphansCard.svelte:13,47; VenueCard.svelte:42,365; LineCard.svelte:30,130,187; DatasetCard.svelte:43,283; DomainCard.svelte:26,101; RadarCard.svelte:47,341; LeadCard.svelte:39,340,372; card-math.svelte.ts:4 (comment); present/markup.ts:19,99; Leads.svelte:52,263

Verify 4:
21:        threatens: 'threatens:'
301:            <span class="threat-label">{t('radar.threatens')}</span>
302-            <div class="threat-words">

Verify 5, sh utils/unused-exports.sh (exit 0, 334 lines), diff against ../O172-base/unused-exports.txt:
1,2d0
< ERROR: Error loading vite.config.ts (File './.svelte-kit/tsconfig.json' not found.)
< ERROR: Please fix or visit https://knip.dev/reference/known-issues
337d334
< knip stopped with status 2

Verify 6, npx vitest run tests/ui/html.dom.test.ts tests/checks/source/html-sites.test.ts --reporter=verbose:
 <check mark> |dom| tests/ui/html.dom.test.ts > fieldMarkdown > is the sanitiser over the field renderer, so no long field reaches a card around it 8ms
 <multiplication sign> |unit| tests/checks/source/html-sites.test.ts > every {@html} site > is one of the sites this file knows about 839ms
      Tests  1 failed | 33 passed (34)
tests/ui/html.dom.test.ts:81 is: const paragraph = fieldMarkdown(`In ${words} rsync <source> <target>`);
On the base copy the report's first-run program prints: C9 fieldMarkdown exported: "undefined"

The report's two programs, recreated from its text in .agents/scratch (folder removed):
node first-run.mjs from the base copy: exit 0; diff with the report's output differs only on the line "C16 long word tree" (a run of the letter w, one character shorter than the report's).
node after-run.mjs from the worktree: exit 0; diff with the report's output differs only on the line "C16 long word stays one word" (a run of the letter w, the same kind of difference).

Report's Premises and other quoted commands:
grep -rn "{@html" src/lib --include='*.svelte' | wc -l => 19 on the worktree, 32 on the base copy
grep -n 'Clamp\.svelte' src/lib/views/shared/card/card-layout.ts => no output, exit 1
grep -n "is the sanitiser over the inline renderer" .scratch/migration/agents/guarded.md => line 21, the G5 Test: line
ls -1 src/lib/views/shared/card | wc -l => 10; ls -1 src/lib/ui | wc -l => 10; ls -1 src/lib/ui/display | wc -l => 10; ls -1 src/lib/ui/display/text | wc -l => 3
wc -l src/lib/ui/html.ts => 804; EntryFields.svelte 468; text/Clamp.svelte 100; text/FieldMarkdown.svelte 155

The reviewer's own probe of the changed code (program in .agents/scratch, removed):
div block: "<div>rsync  </div>"
div inline rule: "<div>rsync &lt;source&gt; &lt;target&gt;</div>"
kept tag starts block: "<details>\nrsync  \n</details>"
script first then para: "&lt;script&gt;a&lt;/script&gt;<p>Word</p>\n"
TOC: "<p>[TOC]</p>\n"
math keeps breaks: true
rel link: "<p><a href=\"y.md\">x</a></p>\n"
js link: "<p><a>x</a></p>\n"
ol start: "<ol>\n<li>three</li>\n</ol>\n"
fs "- \nfoo": "-"
fs "#\nfoo": "#"
fs "1.\nfoo": "1."
fs "- Do A.\r\n- Do C.": "Do A."
```

The red line is the one line of Verify 1. The rules file's "Token discipline" paragraph names no pipe filter, so the output is cut with `tail` only. TMPDIR was set as the review's hard limits require; the red line does not depend on it.

## Verdicts

Items of the brief's "What to build", in its numbering:

- 1: holds. `fieldMarkdown` at `src/lib/ui/html.ts`; `FIELD_RULE` `{ gfm: true, breaks: true }`; `UNKEPT_TAGS_AS_TEXT` applied; `mathExtension` through `readSanitised`; after-run C1, C2, C8, C9, C16 reproduced; `[TOC]` stays words and a heading has no id (probe, C16). The memo is apart (`C9 memo keys: ["icons","inline","field"]`). The inline head comment is rewritten. The block-level gap of `UNKEPT_TAGS_AS_TEXT` is Behaviour 1 and Standards 1; it does not touch C7's inputs.
- 2: holds. `src/lib/views/shared/card/text/` holds both files; `ls` shows 10 items in `card/`; styles read against each bullet; `linksKeepPress` is an attachment with no `svelte-ignore`.
- 3: holds. `src/lib/views/shared/card/text/Clamp.svelte`: `.text.cut` sets `--field-gap: 0`; the measure sets and removes the property in one read; `measure` keeps `line` before it; the Props comment is rewritten.
- 4: holds. Each listed site was read in the diff. Verify 3 shows only the "Not changed" sites and the imports and comment; every `<p>` and `<span>` named became a `<div>`, selectors followed (`DomainCard` `.blurb`, `DatasetCard` `.note > .words`), margins read per file.
- 5: holds. Verify 4.
- 6: holds. `LeadCard.svelte` `note`; `CardDetails.svelte` `reproducedWords`, read, with C15 lines.
- 7: holds. C13 reruns identical. The line of a mark alone is Behaviour 3.
- 8: holds. `FILTERED` in `tests/checks/source/html-sites.test.ts` holds `'fieldMarkdown('` and the head comment names it. The red floor in the same file is Spec 1.
- 9: holds. One test, the title the brief names, in a `describe('fieldMarkdown')` block, passing; `fieldMarkdown` undefined on the base copy gives the quoted failing line.
- 10: holds. `card-math.svelte.ts:4`.

Cases of the brief's "Cases":

- C1: met, after-run `C1` two paragraphs and a two-item list; the card and page sites are read in item 4; the base run gives one run of text.
- C2: met, after-run `C2` `<p>Role: A<br>Team: B</p>`.
- C3: met by reading (`.field :where(...):first-child` has `margin-top: 0` and the shorthand has none below), after-run `C3` one `<p>`; the height is owed to the look.
- C4: met by reading (`.text.cut`, `--field-gap: 0`, whole-line `max-height`, `clampControl`); the cut is owed to the look.
- C5: met by reading (list items have `margin: 0`, the cut sets the gap off); owed to the look.
- C6: met by reading (`overflowsClamp` over the height with the gap off, `clampControl(open, false)` returns null); owed to the look.
- C7: met, item 9's test and after-run `C7` lines.
- C8: met, after-run `C8` lines; the column width is owed to the look.
- C9: met, after-run `C9` lines.
- C10: met, after-run `C10` for the link and `<code>`; the code look read in `FieldMarkdown.svelte` against `CodeText.svelte`; owed to the look.
- C11: met by reading (`linksKeepPress` stops a click whose target is inside an `<a>`); the press is owed to the look.
- C12: met by reading: every site's box is a `<div>`, a `<blockquote>` or a `<dd>`; the snippets render under `RecordField` (`<div>`) or `RecordCard`'s `{@render text?.()}` (no `<p>` around it, `RecordCard.svelte:350`).
- C13: met, after-run `C13` lines identical to the case's expected values.
- C14: met by reading (`RadarCard.svelte:298-305` and its styles); owed to the look.
- C15: met by reading `LeadCard.svelte` and `CardDetails.svelte`, with after-run `C15` lines; the program feeds the joined text, so the join itself is proved by the reading.
- C16: met, after-run `C16` for the markup, styles read; widths owed to the look.
- C17: met, after-run `C17 CRLF equals LF: true` and `C17 blank: ""`.

## 1. Spec

- `tests/checks/source/html-sites.test.ts:248`: "expect(counted.length).toBeGreaterThanOrEqual(32);"; what is wrong: Verify 1 does not print "every command passed". The brief's item 4 and Decision 2 take the `{@html}` sites from 32 to 19, and the brief's "What is on the tree" omits this floor and item 8 gives only the `FILTERED` edit. Lowering it is a threshold edit the rules file forbids without a ruling, and the report leaves it unedited and names it first. failure scenario: `npm run test:quick` at landing prints `failed: vitest checks` on this line, so the step cannot land until the orchestrator rules on the floor; verdict: no item is violated; this is the one red line of Verify 1 and needs a ruling.

## 2. Proof

none.

## 3. Standards

- `src/lib/ui/html.ts:503` and `:505-511`: "The name of the element an inline HTML token opens or closes" and "The extension that draws as written, escaped, an inline HTML token naming an element the profile does not keep"; what is wrong: `fieldDrawing` now passes block HTML tokens through this renderer too, and one block token holds every tag of the block, so both comments are false after this change (rules file, "What every package obeys": a sentence in a document or head comment that the change makes false is a defect). failure scenario: a reader trusts the comment and believes each tag in a field is judged on its own, where a block token is judged by its first tag alone (Behaviour 1).
- `tests/checks/source/html-sites.test.ts:240`: "draws the sanitiser, inline Markdown, the catalog, or a named exception"; what is wrong: the head comment and `FILTERED` now take block Markdown as well, and the title still names inline Markdown only, the only filtered drawing `FieldMarkdown.svelte`'s site does not match (same rule). failure scenario: a reader of the test's output believes a block-Markdown site would be refused.
- `.scratch/migration/agents/reviews/O172-report.md`, section "Judgment calls" and the whole file: no quoted grep of the changed names, no quoted grep of the history words over added comments and test titles, no quoted grep before writing the helpers, and no list of head comments as "still true" or "rewritten"; `grep -n -i "grep -r\|still true\|rewritten"` over the report finds none of them. What is wrong: the rules file requires each ("What every package obeys": "quote that grep in the report", "the report quotes the grep with each hit judged", "list each one in the report as 'still true' or 'rewritten'"; "The principles": "quoting that grep in the report"). The reviewer's own greps of `Clamp.svelte`, the moved memo names and the history words found no stale name and one hit, "before it is returned", about order in code, not history. failure scenario: the orchestrator has no record from the builder that the checks were made, and must rerun them at landing.

## 4. Behaviour

- `src/lib/ui/html.ts:511-519`, `UNKEPT_TAGS_AS_TEXT` under `fieldDrawing`: "const name = TAG_NAME.exec(text)?.at(1)?.toLowerCase();"; what is wrong: a block HTML token is one token, so only its first tag is judged, and a later tag-like word is lost to the sanitiser. The probe gives `<div>rsync  </div>` from `fieldMarkdown` for `<div>rsync <source> <target></div>`, where `inlineMarkdown` of the same text keeps `&lt;source&gt; &lt;target&gt;`; `<details>` gives the same loss. The report's sharp edges name only a block of an unkept element alone. failure scenario: a note holding `<details>` or a `<div>` and a command such as `rsync <source> <target>` is drawn with the two words gone, where the unchanged tree shows them; verdict: item 1 holds on C7's inputs and this input is outside them.
- `src/lib/ui/html.ts:128`, `ALLOWED_ATTR`; what is wrong: `start` is not kept, so an ordered list is renumbered from 1: `fieldMarkdown('3. three')` gives `<ol>\n<li>three</li>\n</ol>\n`. The report does not state it. failure scenario: a task note `3. three` newline `4. four` is drawn as 1 and 2, which is a wrong number in a field written as a numbered list.
- `src/lib/state/boards/board/presets.ts:712`: "const flat = line.trim().replace(LEADING_MARK, '')"; what is wrong: `line.trim()` removes the space that `\s+` in `LEADING_MARK` needs, so a first line holding only a mark stays a mark. The probe gives `-` for `- ` newline `foo`, `#` for `#` newline `foo`, `1.` for `1.` newline `foo`. failure scenario: a note whose first line is a bare `-` shows `-` as the card's NEXT; the report's sharp edges do not name it; verdict: item 7 holds on the marks the brief lists.
- `.scratch/migration/agents/reviews/O172-report.md`, section "Sharp edges and limitations": "A relative Markdown link written in a field (`[x](y.md)`) is an ordinary link on the page address ... Not run."; what is wrong: the probe gives `<p><a href="y.md">x</a></p>` with no `target`, and the listener in `FieldMarkdown.svelte` stops the click from reaching what surrounds the field while the browser still follows the link. The report states no before and after for the project card and page, where such a link is new. failure scenario: an ELI5 or NEXT holding `[note](docs/x.md)` becomes a link that, pressed, sends the oculus tab to a relative path, where the unchanged tree draws it as words; what the press does is owed to the look.

## Declined to judge

- The `textarea` field list and the count of hub values in the brief's "What is on the tree" (the hub's collection files and manifests): a hub's `.oculus` folder is not grepped under this review's limits. The manifest schema's nine `textarea` fields were reproduced on the base copy; the rest of that premise is not verified.
- Whether the floor at `tests/checks/source/html-sites.test.ts:248` is lowered, replaced or removed: the orchestrator's or the user's ruling, as the rules file forbids a builder or reviewer loosening a threshold.
- The report's "`html.ts` reached 896 lines" before the memo moved: the intermediate state is gone. The reviewer's arithmetic from the final files gives about 894 lines (804 plus the 93 lines of `html-memo.ts` after its head and imports, less the three re-export lines), which still passes the 880-line limit, so the decision to add the path stands.
- The report's count of 2 full runs of the list and no whole-suite command: only a transcript shows that.
- `html.ts` "its 20 importers are unchanged": no decision rests on the count, so it was not counted.
- The moved file's history: `git log --follow` of `Clamp.svelte` is outside the git commands allowed; the content diff was read.
- Owed to the look on landing, on a scratch server per the configuration block: C3's height against the unchanged tree; C4, C5 and C6 on an ELI5 and a task note and a ten-item list on a clamped card; C8's display formula width; C10's code look on a project page; C11's press on a link inside a row and a card; C14's one-line and two-paragraph threat, including the glyph's position under `align-items: baseline`; C16's scroll, break and column width; the Career `order_note` line.

Reviewer usage: afc0139febb1e70da, claude-opus-5-5, 241873 tokens, 28 tool uses, 12.4 min.
