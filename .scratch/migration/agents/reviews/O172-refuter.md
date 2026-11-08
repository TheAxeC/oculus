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


## Repair round 1, refuted

```
The rules file names no pipe filter, so long output is cut with tail only. test:quick was issued in the foreground with a 590000 ms timeout; the harness moved it to the background at 180 s and it ran to its end, exit 0. No diagnosis or other agent was used. The `.agents/scratch` folder used here is removed (`test -e .agents/scratch` prints scratch-gone; `git status --short` prints 30 lines before and after the cleanup).

Verify 1. npm run diagrams; diff -rq docs/diagrams <copy taken before> => "diagrams unchanged by rerun"
npm run test:quick -- --base bf279a486 (TMPDIR unset, as the rules file says), tail:
ok      prettier (12.4 s): All matched files use Prettier code style!
ok      ASCII gate (13.6 s)
ok      svelte-kit sync (23.8 s): See https://rolldown.rs/reference/InputOptions.checks#plugintimings for more details.
ok      eslint (19.1 s)
ok      svelte-check (52.8 s): 1794170713047 COMPLETED 591 FILES 0 ERRORS 0 WARNINGS 0 FILES_WITH_PROBLEMS
ok      vitest (129.9 s): Duration  63.84s (transform 73.85s, setup 0ms, import 136.00s, tests 26.10s, environment 6.04s)
ok      vitest checks (151.2 s): Duration  84.47s (transform 80.49s, setup 0ms, import 149.54s, tests 155.29s, environment 4ms)
test:quick: 176.7 s; every command passed
test:quick: not covered: tests that reach no changed file within the import depth,
            other than the checks under tests/checks/source and tests/checks/tree,
            which run for any change under src, tests or utils; the build, the lint
            of unchanged files

Verify 2, the perl ASCII gate over the 27 changed paths (git diff --name-only --diff-filter=d bf279a486 without .scratch, plus the three untracked source files): printed nothing, ascii-exit:0
The same gate over .scratch/migration/agents/reviews/O172-report.md: printed nothing, exit 0

Verify 3, grep -rn "inlineMarkdown" src/lib/views (23 lines):
ArchivalCard.svelte:18,56; OrphansCard.svelte:13,47; VenueCard.svelte:42,365; LineCard.svelte:30,130,187; DatasetCard.svelte:43,283; DomainCard.svelte:26,101; RadarCard.svelte:47,341; LeadCard.svelte:39,340,372; card-math.svelte.ts:4 (comment); present/markup.ts:19,99; Leads.svelte:52,263

Verify 4:
21:        threatens: 'threatens:'
301:            <span class="threat-label">{t('radar.threatens')}</span>
302-            <div class="threat-words">

Verify 5, sh utils/unused-exports.sh: exit:0, 334 lines; diff ../O172-base/unused-exports.txt against it:
1,2d0
< ERROR: Error loading vite.config.ts (File './.svelte-kit/tsconfig.json' not found.)
< ERROR: Please fix or visit https://knip.dev/reference/known-issues
337d334
< knip stopped with status 2

Verify 6, npx vitest run tests/ui/html.dom.test.ts tests/checks/source/html-sites.test.ts --reporter=verbose (TMPDIR and GIT_CEILING_DIRECTORIES set to .agents/scratch):
 <check mark> |unit| tests/checks/source/html-sites.test.ts > every {@html} site > draws the sanitiser, inline or field Markdown, the catalog, or a named exception 1402ms
 <check mark> |unit| tests/checks/source/html-sites.test.ts > every {@html} site > is one of the sites this file knows about 1223ms
 <check mark> |dom| tests/ui/html.dom.test.ts > fieldMarkdown > is the sanitiser over the field renderer, so no long field reaches a card around it 13ms
 Test Files  2 passed (2)
      Tests  34 passed (34)

The round's programs, recreated from the report's text in .agents/scratch, each exit 0:
node blocks.mjs:
fieldMarkdown("<div>rsync <source> <target></div>"): "<div>rsync &lt;source&gt; &lt;target&gt;</div>"
fieldMarkdown("<div><script>alert(1)</script></div>"): "<div>&lt;script&gt;alert(1)&lt;/script&gt;</div>"
fieldMarkdown("<div>a <script"): "<div>a &lt;script</div>"
fieldMarkdown("<details>\nrsync <source> <target>\n</details>"): "<details>\nrsync &lt;source&gt; &lt;target&gt;\n</details>"
fieldMarkdown("<!-- <script> --> <source>"): "&lt;source&gt;"
fieldMarkdown("3. three\n4. four"): "<ol start=\"3\">\n<li>three</li>\n<li>four</li>\n</ol>\n"
node inline-equal.mjs, base copy against the worktree:
18 of 18 equal
The same program widened by the reviewer, 40000 strings built at random from tag fragments:
fuzz: 40000 inputs, 0 differ
node first-sentence.mjs (the report's ten inputs, the "After" block):
firstSentence("- \nfoo", 130): "foo"
firstSentence("#\nfoo", 130): "foo"
firstSentence("1.\nfoo", 130): "foo"
firstSentence("- Do A. Then B.\n- Do C.", 130): "Do A."
firstSentence("1. Do A\nDo B", 130): "Do A"
firstSentence("Do A. Do B.", 130): "Do A."
firstSentence("", 130): ""
firstSentence("  \n \n", 130): ""
firstSentence("A sentence\nbroken here.", 130): "A sentence"
firstSentence("- [ ] task", 130): "[ ] task"
node clamp.mjs:
overflowsClamp(160, 20, 4): true
overflowsClamp(40, 20, 4): false
overflowsClamp(80, 20, 4): false
overflowsClamp(89, 20, 4): true
node after-run.mjs (C1 to C17 through the real fieldMarkdown and firstSentence): every line equals the report's block, the C16 long-word line left out of the recreated program as the first review found it differs only by a run of the letter w.
C9 memo keys: ["icons","inline","field"]
C17 CRLF equals LF: true
C17 blank: ""

The report's other quoted evidence, same form:
sed -n 248p tests/checks/source/html-sites.test.ts =>         expect(counted.length).toBeGreaterThanOrEqual(19);
sed -n 240p => it('draws the sanitiser, inline or field Markdown, the catalog, or a named exception', () => {
grep -rn "{@html" src/lib --include='*.svelte' | wc -l => 19 on the worktree, 32 on ../O172-base
grep -rn "<FieldMarkdown" src/lib/views --include='*.svelte' | wc -l => 18
grep -rn -B2 "<FieldMarkdown" ... | grep -E "<p[ >]|<span[ >]" => one line, RadarCard.svelte-301 threat-label
grep -n 'Clamp\.svelte' src/lib/views/shared/card/card-layout.ts => nothing, exit 1
ls -1 src/lib/views/shared/card | wc -l => 10; ls -1 src/lib/ui | wc -l => 10; ls -1 src/lib/ui/display | wc -l => 10; ls -1 src/lib/ui/display/text | wc -l => 3
wc -l: html.ts 823; html-memo.ts 103; text/FieldMarkdown.svelte 161; text/Clamp.svelte 100; presets.ts 731; html.dom.test.ts 183; html-sites.test.ts 337; EntryFields.svelte 468
The report's greps of "The greps of round item 6", rerun in the same form: the TAG_NAME|card/Clamp|Clamp.svelte|HTML_PIECE grep (7 lines), the memo grep (7 lines, and 0 for the moved names over docs, README.md, config and tests), 'inline Markdown|inline renderer' (17 lines), radar.threatens (4 lines), firstSentence (15 lines), 'relative (link|address)' (1 line), the kept-attributes grep (6 lines), the helper grep on the base (4 lines, all deadlineWords), the key-call grep on the base (9 lines), the README grep (line 42): each the same as the report's block.
History words, git diff -U0 bf279a486 -- src tests config over added comment lines and test titles:
18:+ * the file holds is somebody's text, so the result is sanitised before it is returned, which is
Over the three untracked source files:
src/lib/views/shared/card/text/FieldMarkdown.svelte:65:    /* A block is spaced from the one before it and the first of its parent has no gap, so a field
Both are positions or order in code, the report's judgment holds. Package ids or dates in added lines: none.
grep -n "is the sanitiser over the inline renderer" .scratch/migration/agents/guarded.md => 21, the G5 Test: line.

Names of this round across src, tests, config, docs, README.md, guarded.md and spec.md:
grep -rnE --exclude=local.yml 'TAG_NAME|LEADING_MARK|linksKeepPress|UNKEPT_TAGS_AS_TEXT|ALLOWED_ATTR': no TAG_NAME; the others only at their definition and uses in src/lib/ui/html.ts, presets.ts:700,704 and FieldMarkdown.svelte:39,53.
grep -rn "inlineMarkdown|fieldMarkdown|FieldMarkdown" over docs (without diagrams), README.md and config: nothing.

The reviewer's own probes through the real code (programs in .agents/scratch, removed):
fieldMarkdown("<div>if a<b then c</div>"): "<div>if a<b></b></div>"
inlineMarkdown("<div>if a<b then c</div>"): "<div>if a&lt;b then c</div>"
fieldMarkdown("<details>\nif n<i, stop\n</details>"): "<details>\nif n</details>"
fieldMarkdown("<script>if (a<b) x=\"<source>\"</script>"): "&lt;script&gt;if (a"
fieldMarkdown("<div>x<y then z</div>"): "<div>x&lt;y then z</div>"
fieldMarkdown("mail foo@bar.org now"): "<p>mail <a href=\"mailto:foo@bar.org\" target=\"_blank\" rel=\"noopener noreferrer\">foo@bar.org</a> now</p>\n"
fieldMarkdown("[x](y.md)"): "<p><a href=\"y.md\">x</a></p>\n"
fieldMarkdown("[x](#y)"): "<p><a href=\"#y\">x</a></p>\n"
sanitise('<ol start="5"><li>x</li></ol>'): "<ol start=\"5\"><li>x</li></ol>"
blockMarkdown('3. three\n4. four'): "<ol start=\"3\">\n<li>three</li>\n<li>four</li>\n</ol>\n"
```

### Verdicts

Items of the brief's "What to build":

- 1: holds. `fieldMarkdown` at `src/lib/ui/html.ts:496`; `FIELD_RULE` `{ gfm: true, breaks: true }` at `:546`; after-run C1, C2, C7, C8 and C9 reproduced; the memo apart (`C9 memo keys: ["icons","inline","field"]`); `inlineMarkdown`'s comment rewritten. Behaviour 1 is an input outside the item's list.
- 2: holds. `src/lib/views/shared/card/text/` holds both files; `src/lib/views/shared/card` has 10 items; each style bullet read in `FieldMarkdown.svelte:60-160`; the listener is an attachment (`:53`) with no `svelte-ignore`.
- 3: holds. `Clamp.svelte:46-48` and `:95-99`; the Props comment at `:24` is rewritten.
- 4: holds. Verify 3 prints only "Not changed" sites; each site read in the diff; 18 `<FieldMarkdown` sites; margins read (`.prose`, `.description`, `.note`, `.what`, `.goal`, `.blurb`, `.wants`, `.value`), each box setting its own margin.
- 5: holds. Verify 4.
- 6: holds. `LeadCard.svelte` `note` and `CardDetails.svelte` `reproducedWords` read; C15 lines reproduced.
- 7: holds. C13 lines reproduced; `presets.ts:699-722`.
- 8: holds. `FILTERED` holds `'fieldMarkdown('` and the head comment names it.
- 9: holds. One test, the title the brief names, passing in Verify 6.
- 10: holds. `card-math.svelte.ts:4`.

Items of the round's brief:

- 1: holds. Floor 19 at `tests/checks/source/html-sites.test.ts:248` and the title at `:240`, each by `sed`; the count is 19; listed under "Every edit" with open item 490 (a), which `plan.md`'s Rulings holds at line 3404.
- 2: holds. `blocks.mjs` lines reproduced; `TAG_NAME` absent; `NO_ELEMENT`, `ONE_TAG` and `HTML_PIECE` each used; C7 lines unchanged; `inlineMarkdown` equal on the 18 inputs and on 40000 random strings against the base copy; both comments rewritten (`html.ts:504-528`); the three assertions in the test. The widening of the tag shape to quoted values and of the pass-through to instructions, CDATA and declarations is needed by the item's own requirement of equal inline results, and is named in the report's judgment calls. Behaviour 1 is a residual of the shape the round named.
- 3: holds for `ALLOWED_ATTR` (`html.ts:137`, its comment at `:125`) and `<ol start="3">`; the report's list names a document and a slide as the round asks; Behaviour 2 is the surface it does not name.
- 4: holds. `first-sentence.mjs` lines reproduced; `presets.ts:700`, `:703-705`; the doc comment rewritten.
- 5: holds by reading. `FieldMarkdown.svelte:39-45`, head comment `:16-20`; a link carrying a scheme keeps its tab (`mailto` probe), so only a relative address or a fragment is refused; the report's list names it. The press is owed to the look.
- 6: partial, Standards 2. The history words, the helper grep and the head-comment table are present and reproduce.

Cases:

- C1: met, after-run `C1`; card and page sites read.
- C2: met, after-run `C2`.
- C3: met by reading and after-run `C3`; the height is owed to the look.
- C4: met by reading (`.text.cut`, `Clamp.svelte:46-48`, `overflowsClamp` lines); the cut is owed to the look.
- C5: met by reading; owed to the look.
- C6: met by reading (`clamp.mjs`); owed to the look.
- C7: met, the test and after-run `C7` lines.
- C8: met, after-run `C8` lines; the column width is owed to the look.
- C9: met, after-run `C9` lines.
- C10: met, after-run `C10`; the code look read in `FieldMarkdown.svelte:95-108`; owed to the look.
- C11: met by reading (`linksKeepPress`); no `FieldMarkdown` sits within two lines of an `<a>` or a `<button>` by grep, so `closest('a')` cannot reach a surrounding anchor at any site; the press is owed to the look.
- C12: met by reading and the two greps; the one `<span>` is a sibling.
- C13: met, after-run lines equal the case's values.
- C14: met by reading (`RadarCard.svelte:298-305` and its styles); owed to the look.
- C15: met by reading `LeadCard.svelte` and `CardDetails.svelte`, with after-run `C15` lines.
- C16: met, after-run `C16` for the markup; widths owed to the look.
- C17: met, after-run `C17` lines.

### Findings

Spec: none.

Proof:

- 1. `.scratch/migration/agents/reviews/O172-report.md`, section "DONE / NOT DONE", the line after the table: "No other test is added or changed."; what is wrong: the claim is false by the diff. `tests/checks/source/html-sites.test.ts` changes two tests, 'draws the sanitiser, inline or field Markdown, the catalog, or a named exception' (its title and `FILTERED`) and 'is one of the sites this file knows about' (the floor), and the same report lists those edits under "Every edit to an existing assertion". The rules file ("What every package obeys") asks for each added or changed test's failing line; `grep -n "expected 19" O172-report.md` prints nothing, so the report quotes none for the floor, and none for `FILTERED`. failure scenario: a reader of that sentence concludes that only the G5 test changed and that no failing line is owed for the other two; no behaviour depends on it; verdict: no item is made violated.

Standards:

- 1. `.scratch/migration/agents/reviews/O172-report.md`, section "DONE / NOT DONE": "4 for the step, 2 in the first run and 2 in repair round 1 ... both runs of repair round 1 printed "every command passed""; what is wrong: the rules file's "Token discipline" allows the list once after the last change and once more only after a red line, and calls a run beyond that a finding of the review; the round's brief says the same. Two green runs in one round fit neither case: either the first ran before the last change or the second was not needed. failure scenario: two runs of a list that takes about three minutes under load, on a machine where several suites run at once; no result is wrong.
- 2. `.scratch/migration/agents/reviews/O172-report.md`, section "The greps of round item 6": "`grep -rnE --exclude=local.yml 'TAG_NAME|card/Clamp|Clamp\.svelte|\bHTML_PIECE\b' src tests config docs README.md`"; what is wrong: the round asks for the grep of each name the step changed across the documents and comments, with each hit judged (rules file, "What every package obeys"). The report has no such grep for `UNKEPT_TAGS_AS_TEXT`, whose behaviour the round changed, or for `LEADING_MARK` or `linksKeepPress`. The reviewer's grep of the three over `src`, `tests`, `config`, `docs`, `README.md`, `guarded.md` and `spec.md` finds only their definitions and uses, so no sentence is false. failure scenario: the orchestrator has no builder record for these three names and relies on this review's grep; verdict: round item 6 partial.
- 3. `src/lib/ui/html.ts:523`: " * own name, since a block's token holds every tag of the block: a tag naming an element the"; also `:477` (" * text, and every card draws its fields again when it is drawn again, so with the page's `memo`") and `src/lib/ui/display/text/html-memo.ts:19` (" * modules and options and the refusal's sentence it was typeset with, with them in `math`. A"); what is wrong: each line ends at 92, 96 and 93 columns where the next word (`profile`, `the`, `result`) fits inside 100, and `html.ts:524` shows 100 is reached in the same comment. The rules file ("What every package obeys") asks an edited comment to be rewrapped so no line inside a sentence ends short. failure scenario: a reader sees three lines cut short in comments the step rewrote; nothing is wrong in behaviour.

Behaviour:

- 1. `src/lib/ui/html.ts:533-536`: "if (name === undefined) return piece; const kept = (ALLOWED_TAGS as readonly string[]).includes(name.toLowerCase()); return kept ? piece : escapeAttribute(piece);"; what is wrong: a piece with no closing `>` is kept when its name is in `ALLOWED_TAGS`, as the round's shape names it, and the sanitiser then reads it as a tag running over the words after it. The report's after-run and "Sharp edges" do not name it. The probe gives `<div>if a<b then c</div>` drawn by `fieldMarkdown` as `<div>if a<b></b></div>`, where `inlineMarkdown` of the same text gives `<div>if a&lt;b then c</div>`, and `<details>\nif n<i, stop\n</details>` gives `<details>\nif n</details>`; an unkept name is correct (`<div>x<y then z</div>` keeps its words). failure scenario: a note holding an HTML block with a comparison written against a one-letter name such as `a<b`, `n<i` or `x<p` loses the rest of the block's words on its card and page. On the unchanged tree a long field drew the same block by the inline rule, with those words kept; the first review's Behaviour 1 is closed on its inputs and this is what remains of it. verdict: round item 2 holds on the inputs it lists.
- 2. `src/lib/ui/html.ts:137`: "'start',"; what is wrong: the same profile covers an assistant turn: `src/lib/views/sessions/terminal/transcript/TurnList.svelte:33,111` draws an answer through `Markdown.svelte`, which runs `sanitise` (`Markdown.svelte:231`), and `sanitise` now keeps `start` (probe). The report's row names "A document (`views/shared/prose/Markdown.svelte`) and a slide" with the general clause "as every text drawn through the same profile does", and no row names the session transcript, so the before and after list the look is read against has no view or state for it. Whether the server's `new Marked(codeColour)` (`turns.ts:315`) emits `start` is read from Marked's default list renderer and was not run through that path. failure scenario: an assistant answer with a list that resumes at 3 after a code block now draws 3, where the unchanged tree drew 1; the look on landing follows the report's table and does not open the transcript; verdict: no item is made violated.

### Declined to judge

- The "Before" lines of `blocks.mjs` and `first-sentence.mjs`, the failing run at `tests/ui/html.dom.test.ts:90:69`, and the new test's failure on the unchanged tree: reproducing them means running the test or the program with the changed code taken out, which the rules file and the review's standing rule forbid. The first review's probe printed `<div>rsync  </div>`, `-`, `#`, `1.` and an `<ol>` without `start` on the code before the round, and the snapshot's `html.ts` read gives the rest.
- The report's count of full-list runs and the absence of a whole-suite command: only the transcript shows them; Standards 1 takes the report's own figure.
- The hub's `textarea` field list and the count of hub values in the brief's "What is on the tree": a hub's `.oculus` folder is not grepped under this review's limits.
- A change to the floor's ruling: open item 490 (a) is the user's, and round item 1 applies it; the reviewer did not reassess it.
- A line of `docs/HELP.md`, `docs/data-map.md` or `docs/decks.md`: the rules file bars the review from raising a missing or unchanged line there.
- The moved file's history: `git log --follow src/lib/views/shared/card/text/Clamp.svelte` is outside the git commands allowed; the content diff was read.
- Owed to the look on landing, on a scratch server per the configuration block: C3's height; C4, C5 and C6 on an ELI5, a task note and a ten-item list on a clamped card; C8's display formula width; C10's code look on a project page; C11's press on an ordinary link and a press on a `[x](y.md)` link in a card and a row; C14's one-line and two-paragraph threat, the glyph's position under `align-items: baseline` included; C16's scroll, break and column width; the Career `order_note` line; an ordered list past 1 in a document, a slide and a session transcript.

Reviewer usage: aa55cdabd485bca66, claude-opus-5-5, 245759 tokens, 29 tool uses, 12.2 min.

## Closed

Findings of the run over repair round 1, which are never sent to the builder; each is closed at the landing.

- Proof 1 (the report's sentence "No other test is added or changed."): closed with this note. The sentence is wrong: `tests/checks/source/html-sites.test.ts` changes the title and `FILTERED` of one test and the floor of another, both listed under the report's "Every edit to an existing assertion". The floor is the number open item 490 (a) ruled. No behaviour depends on the sentence.
- Standards 1 (two green runs of the list in the round): closed with this note. Two runs where the rules file allows one; no result is wrong. The landing report states the count.
- Standards 2 (no builder grep for `UNKEPT_TAGS_AS_TEXT`, `LEADING_MARK`, `linksKeepPress`): closed by the reviewer's own grep over `src`, `tests`, `config`, `docs`, `README.md`, `guarded.md` and `spec.md`, which finds only definitions and uses, so no sentence is false.
- Standards 3 (comment lines ending short at `src/lib/ui/html.ts:523`, `:477`, `src/lib/ui/display/text/html-memo.ts:19`): fixed at landing, the three comments rewrapped.
- Behaviour 1 (a piece with no closing `>` kept when its name is kept): fixed at landing inside round item 2. A piece is kept only when it ends with `>` and its name is in `ALLOWED_TAGS`; `<div>if a<b then c</div>` keeps its words, and an assertion is added to the G5 field test.
- Behaviour 2 (`start` also reaches a session transcript): closed at landing. The landing report names the transcript among the surfaces, and the look opens an ordered list past 1 in a document, a slide and a session transcript.
