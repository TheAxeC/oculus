# Step D40 brief check (on main at 0c576e95f)

The report of the fresh agent of the `spec` skill's "Steps / The brief check", on `agents/briefs/D40.md` (uncommitted, mtime 00:46, read on disk). Main moved while the check ran: `git log -4 --format='%h %ci %s'` prints `0c576e95f 00:52:58 Book Axel's ruling on a folder Fix All for D40`, `310bbac94 00:50:49 Book Axel's rulings (a) on open items 18 and 19`, `3ab62225d 00:47:28 Book D40's brief choices and open items 18 and 19`, `04065ec63`. The brief predates the last two commits. `git diff --stat 5ed0bc24c HEAD -- tools/oculus ':!tools/oculus/.scratch'` prints nothing, so no oculus code changed after D36. Standards: `.agents/plan.yaml:8` reads `standards: []`. ADRs: `grep -n adr .agents/plan.yaml` prints nothing, and `ls tools/oculus/docs/adr docs/adr` prints "No such file or directory" for both.

## 1. Names

- `LINT_IDS` / `LintId` gain `writing`. `grep -rn "Record<LintId\|LINT_IDS\|lintersOf\|lintName\|chktex: true\|shellcheck: true" src tests` finds these hits outside "Paths this step writes":
  - `src/lib/state/system/machine/lint/lint.svelte.ts:31,43,110,139,153,163,200,237,249,282`: still true, since the code loops over the ids.
  - `lint.svelte.ts:1` head comment "What the linters (ChkTeX, Ruff, ESLint, ShellCheck) found": made false.
  - `src/lib/state/system/machine/lint/lint-words.ts:8` "The display name of a linter: ChkTeX, Ruff, ESLint, ShellCheck.": made false.
  - `lint-model.ts:7` and `problem-marks.svelte.ts:28`: still true.
  - `src/lib/server/core/program.ts:2` "the runner ... the linters share": made slightly false, since the writing linter runs no program.
- `LintSettings` (`on: Record<LintId, boolean>` gains `writing`, plus `writingSkip` and `writingGlyphs`):
  - `tests/server/machine/runs/lint/lint-fixture.ts:46-52` `settingsOf()` returns a `LintSettings` whose `on` has no `writing`, so the type check goes red. The file is not in the paths.
  - `tests/data/sources/config/settings.test.ts:381-410` (describe 'lintSettings') `toStrictEqual`s the exact `DEFAULT` object and the whole read value, so both rows go red. The file is not in the paths. guarded.md G13's test list names `settings.test.ts` "one case per setting reader", but the brief's Verify item 2 lists only `config.test.ts` and `config-folder.test.ts` for G12 and G13.
  - `server/root/context.ts:249,345` and `routes/api/(machine)/lint/+server.ts:27`: still true.
- The highlighter "kept for the life of the server process" (item 2) and the catalog words of the rows (items 4 and 11). `agents/spec.md:84` bans module-level mutable state: "a dependency is passed in ... a route reaches the server's objects through the request's locals". The lint route gets its held objects that way: `+server.ts:28-31` passes `server.lintRuns` and `server.eslint` from `server-context.ts:49`, which are built in `context.ts:275-276`. A held highlighter would follow the same path through `LintRouteOptions` (`routes.ts:55`). That touches `src/lib/server/root/process/server-context.ts`, `src/lib/server/root/context.ts`, `src/routes/api/(machine)/lint/+server.ts`, `tests/server/root/context-fixture.ts:82-91` and `tests/server/machine/runs/lint/lint-fixture.ts:132-140`. None of these is in the paths. `context.ts` is also a D39 path (D39 brief, "context.ts lines 240-330"), and the brief's "Shared with D39" list does not name it.
- The catalog read: `t()` lives in `src/lib/state/shared/words/text.ts:72` and is client-side. `src/lib/server/root/hooks.ts:174-177` says server code "never imports state/shared/words/text.ts". The server reads the catalog through `words(catalog, key)` of `src/lib/server/core/words.ts:18`, with the catalog passed in, as `server/machine/pty/routes.ts:241` does with `textCatalog(...)`. Item 11 says "every key read through `t()`", and items 4 and 8 put catalog titles and messages in rows the server builds. That cannot work as written. It needs either the catalog in `LintRouteOptions` (the same paths as above) or the page wording rows by `code`.
- `problem-sources.ts`: item 12 asks for its head comment to be reread, and line 3 ("the findings of the linters (ChkTeX, Ruff, ESLint, ShellCheck)") is made false. The path list gives only lines 20-35.
- `globTest`: `grep -rn globTest src tests` hits only `problem-rows.ts:69,80`, which is in the paths.
- `lint-writing`: `grep -rn "lint-writing" src | wc -l` prints 0. There is no collision.

Findings:
- `lint-fixture.ts` and `settings.test.ts` (G13's test) go red and are outside the paths. Verify item 2 does not name `settings.test.ts`.
- The highlighter and the catalog words have no lawful home inside the paths. Holding them per `agents/spec.md:84` needs `server-context.ts`, `context.ts` (shared with D39), `+server.ts`, `context-fixture.ts` and `lint-fixture.ts`.
- Item 11's "every key read through `t()`" is impossible for server-built rows.
- Head comments that become false: `lint.svelte.ts:1`, `lint-words.ts:8`, `problem-sources.ts:3` (outside its listed range) and `program.ts:2`.

## 2. The step line

The step line now reads `plan.md:540` "... (ruling Z347) (ruling 18) (ruling 19) (ruling Folder Fix All)" (`git show 0c576e95f`).

- "the writing rules as editor marks, after D36": item 1.
- "in `.md` and `.yml` files and in code comments": items 2, 3 and 6.
- "each character the hub's writing rules ban (six classes)": item 4.
- "is marked with a quick fix to its ASCII form": item 4, with C3 and C4.
- "a Markdown paragraph broken across lines is marked with a quick fix that joins it": item 5.
- "both reported as D36's linter results": item 1.
- "in the editor and in D33's Problems view": items 9 and 10, "What it must do".
- "facts only, no judgment of wording": the "What to build" intro.
- (ruling 18): `plan.md:1580` "D40's arrow fix to `->` / `=>` is automatic, ` to ` a suggestion. (the user)". The brief is written to the opposite. Line 9 says "written to option (b)", item 4 says "no arrow has a `kind: 'fix'` fix, so Fix All leaves arrows (C4, option (b), while open item 18 is open)", case 12 says "no preferred fix", and C4's "In force for the build: (b)". The brief also cites remove-unicode `SKILL.md:50` as "`->` only in code-output notation". After 310bbac94 that line reads "a word (to / yields / vs) or ASCII `->` / `=>`" (`sed -n 50p`).
- (ruling 19): `plan.md:1581` says G71's test is written by D40. The brief still says "writes its test only after the orchestrator passes Axel's yes" (item 13, line 9, Paths, Verify item 2).
- (ruling Folder Fix All): `plan.md:1582` "D40 adds a Fix All of the writing rules for a whole folder, from the Files view, applying the automatic fixes to every file under it that the writing rules take, after a confirm that lists the files and the count of fixes in each, each file written with its History copy. (the user)." No requirement serves it. `grep -n "folder\|Files view\|History" agents/briefs/D40.md` finds no such item. The paths have no Files view, write-route or History file, and there are no cases and no docs for it.

Findings:
- The brief is written to C4 (b) against ruling 18 (a): line 9, item 4's arrow bullet, case 12, C4's last bullet, and the docs item that will say Fix All leaves arrows.
- Ruling 19's "test written by D40" is still conditional in item 13, line 9, Paths and Verify 2.
- The Folder Fix All ruling has no requirement, path, case, guarded entry or doc. It is a server write of many files with no tab, so `agents/spec.md:70` applies ("A write that edits a file's text re-parses its own result and refuses when the reparse is not what was asked"). So do G1, G2 and G3 (`config/local.yml` is a `.yml` the writing rules take), the `privateFolders` refusal Axel ruled for `lsp-edit` (open item 16), unsaved tabs, files changed between the confirm and the write, and the History copy.

## 3. Premises

- `git log --oneline -3`: the brief says "Main's head is fc4b56795" and in the same sentence that the log prints `04065ec63` first. Head is now `0c576e95f`. Line numbers in the ledger shift: `git show HEAD:...orchestrator-state.md | grep -n "X3f landed in this commit (third"` prints 308 (the brief's case 3 says 307, true at fc4b56795).
- `wc -l`: model-machine.ts 718, index.ts 654, lint.svelte.ts 326, lint-fixes.ts 428, LanguageItems.svelte 294. All match.
- `ls src/lib/server/machine/runs/lint/`: 8 items. Matches. `ls src/lib/state/system/machine/lint/`: 4 items. Matches.
- model-machine.ts:630-718 (`LINT_IDS` 631, `LINT_EXTENSIONS` 636, `lintersOf` 644-648, `LintFix`, `LintRow`, six `LintState`s): match.
- routes.ts:332-363 `lint()` (`not_taken` at 337, `off` at 338, `hashOf` at 359, `runs.begin`): match. `linters.ts:24` `ProcessLinter`: matches.
- lint-fixes.ts: `fresh` 55, `disableLine` 231, `titleOf` 246, `code === undefined` 285, fixAll 339, `lintActions` 399 all match. `isPreferred` is at 292 (brief: 291). `monaco.Range.areIntersecting` is used in fixAll as stated.
- problem-sources.ts `lintOwner` 25 and `LINT_SOURCES` 30-35, `problems.svelte.ts:32-34`, `problem-marks.svelte.ts:28`: match.
- statusbar.yml:25 `item_linter`, and `lint_tip_not_found_` exists for chktex, ruff and shellcheck only (139-141): match.
- behavior.yml:182-194, options.yml:700-750, settings.ts:545-577: match.
- source.yml 3-33, with `source:` at 34: match.
- keys.test.ts:267-283 and config.test.ts:464-471: match.
- `ls tests/server/machine/runs/lint/`: the 4 files. Match.
- `grep -rn "lintersOf\|LINT_EXTENSIONS" src`: the same 11 hits. Match.
- `src/` has no comment finder. Shiki 4.4.3 (`package.json:102`), marked ^18.0.12 (`:88`), picomatch 4.0.7 (`:97`): match. `grep -rln shiki src` lists only `ui/controls/editor/**` and `data/helpers/code-themes.ts`: matches.
- `SHIKI_IDS` maps bash to shellscript: matches. It is a non-exported `const` (`grammars.ts:21`).
- `node shiki.mjs` (rerun): the same classification. highlighter 179 ms (brief 153).
- `node timing.mjs` (rerun): orchestrator-history 63 ms (brief 62); plan.md 32 (31); literature-radar 488 (487); page.py 335 (352); `kit/lsp/transport.ts` 383 (355); boundaries.test.ts 119 (114); LanguageItems.svelte 339 (326). Same order. The brief does not give transport.ts's path.
- splitFrontmatter (docs.ts:57-69) and globTest (problem-rows.ts:64-75): match. `ls src/lib/data/helpers/search/` lists query.ts and replace.ts: matches.
- sources.yml `languages:`: matches.
- The ASCII gate with `find src tests config` prints 0 lines. `agents/spec.md:99`'s form also names `bin`, and `ls -d bin` prints "No such file or directory", so the omission does no harm.
- Count of the six classes (`count.py` over `git ls-files '*.md' '*.yml' '*.yaml'`): now "files with a mark: 194 marks: 3933", arrow 930. The brief says 3936 and 933. The difference is 310bbac94's edit of the remove-unicode skill, under the skipped `.agents/`.
- `node marked-today.mjs`, rerun as-is and again with item 7's exact globs, globTest semantics and `glyphs.yml` by name (`d40-check/today-brief.mjs`): both print "files read 2029, skipped 186, files with a mark 18, marks 297" and the same classes. 297 in 18 files holds. The listing shows 12 files under `agents/reviews/`, not 13. The other 6 are 4 funding files (3 review files and mail.md) and 2 dongho files.
- `node wrap.mjs` over 1910 hub `.md` files: "with a wrapped paragraph 294 paragraphs 1695 line mismatches 0". Over the 1730 kept by the default skip list: "213 paragraphs 1152 line mismatches 0". Both match. wrap.mjs does not apply item 5's `$$` rule. With it applied (`d40-check/paras.mjs`), the result is "paragraphs with a soft break left 1130 in 209 files; ... all kept by the $$ rule 22". Case 41 expects 1152 in 213.
- `ls tools/oculus/docs/adr`: none. Matches.
- `grep -c "^- G[0-9]*\." agents/guarded.md`: 70, the last G70. Matches.
- Doc lines DESIGN.md:23, 166 and 476, HELP.md:118, views.md:81, configuration.md:13 and files-and-search.md "## Linters" at 87: all present.
- `grep -rln problem-rows tests`: prints nothing (exit 1). Matches.
- Case texts (each read with `git show fc4b56795:<file> | sed -n`): cases 2, 3, 5-20 hold as quoted, and case 10's paragraph ends at 19.
- Case 4 does not hold. `U2-audit.md` lines 13-28 hold 16 lines with no blank line between them (`sed -n 12,30p`): State, Fixed set, Rows, Indents, Headers, Toolbars and actions, Spacing, Type sizes, Icons, Hover actions, Focus, Empty state, Error state, Better and kept, Counterpart, Re-measure. wrap.mjs also prints "13-28". The brief says five lines, one row over 13-17.
- "Shared with D39" says D39 writes `data/model/index.ts` 94-98. D39's brief names `src/lib/data/index.ts` 215-276 instead. D39's worktree does change `data/model/index.ts` (`git -C .agents/worktrees/D39 diff -U0` shows `@@ -93,0 +94,5 @@`), so the overlap is real and the brief's citation is to the worktree. D39 also writes `server/root/context.ts` (see Names).

Findings:
- Case 4's paragraph is 13-28 (16 lines), not 13-17.
- Case 41's paragraph count ignores item 5's `$$` rule: 1130 in 209 under that rule, against 1152 in 213.
- "13 under reviews" should be 12.
- The head named as fc4b56795 is contradicted in the same sentence, and main is now 0c576e95f. Case 3 is at 308-309 on the builder's base.
- The remove-unicode line 50 premise in C4 is out of date (310bbac94).
- `isPreferred` is at 292.

## 4. Cases and checks

- Cases 1 and 3, judged against the hub rule. The hub `CLAUDE.md` "Writing docs" says each bullet is one continuous line and hard breaks belong only between paragraphs and list items, at headings, in tables and in code blocks.
  - `agents/guarded.md:7-9` (`- G1. ...`, `  Code: ...`, `  Test: ...`) is a bullet broken across lines. marked renders it as one paragraph, so marking it is right by the rule's letter.
  - The fix the case gives ("one line `- G1. ... token. Code: ... Test: ...`") erases the ledger's own "Code line". `agents/spec.md:57` and `guarded.md:3` name "its Code line", and Z409 `(the user)` rests on it. `grep -c "^  Code: \|^  Test: " agents/guarded.md` prints 116, and wrap.mjs counts 58 marked paragraphs in that file.
  - The brief's own Report section, and the G71 text Axel ruled (open item 19), ask for new entries in the same wrapped form. D40's own linter will mark them. That breaks `agents/spec.md` "What every package obeys" ("One line per paragraph or bullet in any Markdown or YAML you edit") as soon as the orchestrator writes them.
  - The way out that breaks neither text is to write the Code and Test lines as nested list items (`  - Code: ...`). That is a ledger convention change, so it is the orchestrator's or Axel's to make. The case as written does not name the clash.
  - Case 3 (`  Open for Axel: ...`, 14 such lines in the state file's log) is a plain log continuation. Marking it and joining it is right and costs nothing.
- Cases 6, 13, 14 and 15 are received third-party text:
  - case 6: `coauthor-request.md` under "## The request, verbatim";
  - cases 13 and 15: `mail.md` opens "Dear Dr A. Faes,", an NWO mail;
  - case 14: a reviewer's comment quoted in a response letter.
  - remove-unicode B exempts "Received third-party text kept verbatim as a record ... Rewriting them falsifies the record". The brief marks them on purpose (C5 note). Z742 (`plan.md:1579`) and `choices.md` describe `lint.writing_skip` as "defaulting to the remove-unicode skill's exempt list", so the ruling's text and the brief's default disagree. Under the Folder Fix All ruling these records would be rewritten on disk.
- Cases with Fix All outcomes (13, 15, 21, 30, 39) and case 36's "no status item" are page behaviour. `agents/spec.md` "What every package obeys" says "A builder runs no page" and "A behaviour that needs a DOM ... is seen at the look on landing", and asks such a row to name the look as its proof. The brief says only that each case "is checked by a quoted run". It should say which halves (the rows and fixes the server answers) are runs, and which (what Fix All applies, the status item) are proven by reading `lint-fixes.ts` and by the look.
- Cases 21-24, 26, 27 and 33 as G71's test: consistent with ruling 19, but the brief still makes the test conditional (see The step line).
- No case asks the builder to check, quote or explain a place the step does not change.

Findings:
- Case 1's fix clashes with the ledger's Code-line convention, and the brief dictates more entries in that form.
- Cases 6, 13, 14 and 15 mark and fix received text that remove-unicode B exempts. Z742's wording says the default is B's list.
- The Fix All and status-item parts of cases 13, 15, 21, 30, 36 and 39 need the look named as their proof.

## 5. The question

- Case 42 and Decision 4 (could the in-process Shiki run pass without keeping the server responsive?): yes.
  - Case 42 times "the largest code file of the hub that holds a banned character". Today that is three `bttrlib/bttr.py` files, which are skipped and answer `off`, and `07-collections.css`, a small file on a glyph surface. So the 200 ms trigger for a worker thread can never fire.
  - A hub code file costs more than 200 ms the day one em dash lands in its last comment. The brief's own timing gives page.py 352 ms. `node cost.mjs` (warm, three runs) gives page.py 382/340/342 ms and an 875-line `deposit.ts` 165-170 ms with the prescribed `codeToTokensBase(..., { includeExplanation: true })`.
  - That call tokenises every line twice (`@shikijs/primitive/dist/index.mjs:620-650`: `tokenizeLine` for scopes, then `tokenizeLine2`). The grammar's `tokenizeLine` alone (`highlighter.getLanguage(id)`) costs 106/92/100 ms and 45/44/44 ms on the same two files.
  - Lint runs on every open and save (files-and-search.md "A lint runs on save and on open"), synchronously in the server process that also carries the terminals and the LSP relay.
- Case 41: yes. "297 marks ... (or the difference, explained file by file)" passes with any count, and its 1152 paragraphs is not what item 5's rule gives (1130).
- Item 3 (comment ranges by `SHIKI_IDS`): yes. `.tsx` maps to the oculus language `typescript` (`sources.yml` languages), and Shiki's `typescript` grammar scopes JSX text as a comment. `node shiki3.mjs`: `const a = <p>// text <U+2014></p>` gives "COMMENT [... comment.line.double-slash.ts]" under `typescript` and "code [... meta.jsx.children.tsx]" under `tsx`. A Fix All would then change JSX text. Case 21 and G71's test would still pass. `git ls-files '*.tsx'` in the hub prints 0.
- Item 5 (the join keeps what the paragraph renders): yes, in one shape. Over the tree, `node join.mjs` applies item 5's join, with hard breaks and `$$` lines kept, to all 1910 hub `.md` files and compares marked's HTML: "soft breaks joined 6336, files whose HTML differs 0". Synthetic cases (`SYNTH=1 node join.mjs < synth.json, synth2.json`, 39 inputs) give two differences, both a list inside a block quote followed by a lazy line that drops `>`:
  - `> - a\nb\n> - c\n`: before, two lists; after the join, `> - a b\n> - c`, one list of two items.
  - `> - a\nb\n> c\n`: before, `<li>a b</li>` then `<p>c</p>`; after, `<li>a b c</li>`.

  The join moves the following line from a new block into a lazy continuation. Lazy continuations at top level and in list items, ordered `2.`, code spans across lines, HTML attributes across lines, emphasis across lines, tables, setext lines, tabs, hard breaks and `$$` showed no difference.
- Item 6 (no mark in a URL): yes, for link reference definitions and HTML. marked emits `{"type":"def","raw":"[r]: https://x.org/a<U>b \"T<U>s\""}` with no inner tokens. A URL in inline HTML stays in the paragraph's raw text (`node -e` lexer probe), and Decision 10 marks HTML as text. Neither is in item 6 or a case.
- Item 13 / G71 ("a mark and its fix fall only ... in a code file's comment, so Fix All never changes code"): yes. C6 counts Python docstrings, and case 22 expects a row on a docstring's arrow, which a Fix All would change (a string literal, `__doc__`). The ruled sentence and the counted docstrings disagree.
- Item 7: yes. The default list passes case 37 and the Verify list while diverging from list B (see section 8).
- Verify item 3 (`npm run build` exits 0): yes, for Shiki at run time. `grep -rlE "from ['\"]marked['\"]|from ['\"]zod['\"]" build/server` shows the server bundle keeps dependencies external, so Shiki's grammars and WASM load from `node_modules` only when called. A clean build says nothing about that. Case 41 says "imports the built reader" without saying whether that is the vite output or the source.
- Items 1, 2, 4, 8, 9, 10, 11 and 12, and cases 2, 5, 7-11, 16-20, 25 and 28-40: no. Each case checks the item's behaviour on an input that would show the defect.

Findings:
- Case 42 cannot trigger Decision 4's worker-thread rule while measured page.py and transport.ts cost 340-383 ms. The prescribed API costs about 3.5 times the scopes-only call.
- Case 41 accepts any count, and its paragraph number contradicts item 5.
- `.tsx` gets the wrong grammar.
- The join can merge two lists in a block quote.
- Link definitions and URLs in HTML are not left out.
- G71's sentence is contradicted by counted docstrings.
- `npm run build` does not exercise Shiki's runtime load.

## 6. Implied inputs

A code step. Covered under "Cases": CRLF (28), the hard break (29), nbsp at a line end (30), a nested quote list (31), emoji UTF-16 (34), empty and front-matter-only files (35), settings off and empty globs (36-37), `.json` (38), an unsaved tab (39), the ids (40).

Missing, each with the result it should have:
- A `.tsx` file whose JSX text holds a banned character (shown by probe). Expected: tokenised with Shiki `tsx`, no row in JSX text.
- A curly quote inside a YAML quoted scalar (`t: 'Axel<U+2019>s'`, `t: "a <U+201C>b<U+201D>"`). Fix to `'` or `"` makes the file unparsable. Today 0 such characters in hub YAML (perl scan of `git ls-files '*.yml' '*.yaml'` prints nothing), but a wrong answer corrupts a registry, and under Folder Fix All it writes the broken file to disk. Expected: the escaped form (`''`, `\"`) or a suggestion only, and a reparse that refuses otherwise (`agents/spec.md:70`). The same holds for `<U+2026>` alone at a YAML line start, which becomes the document-end marker `...`.
- A list in a block quote with a lazy line that drops `>` (`> - a\nb\n> - c`). Expected: no exact join fix, or a fix offered only when re-lexing the joined text gives the same blocks.
- A link reference definition holding a banned character in its destination or title. Expected: left out like an inline link's.
- A URL in an HTML attribute in Markdown (`<a href="https://x.org/c<U+2013>d">`). Expected: the URL rule of item 6 applies.
- Two first lint requests for code files arriving together on a fresh server, a request after the server closes, and a run superseded by a new one (`agents/spec.md:69`). Expected: one highlighter and one grammar load, no run after close. A synchronous tokenisation cannot be stopped by `held.signal`.
- A grammar that cannot be loaded. Expected: `{ ok: false, state: 'failed', reason }` (item 1 names this outcome; no case produces it).
- A very long line (minified JS) with a banned character in a string. Shiki's defaults are `tokenizeMaxLineLength = 0` and `tokenizeTimeLimit = 500` per line, twice per line with explanation (`@shikijs/primitive/dist/index.mjs:620`). Expected: a stated line cap and its outcome.
- An unspaced em dash `a<U+2014>b`. Item 4 keeps "the space ... as the text had it after the dash", which gives `a,b`. Expected `a, b`. 0 today (all 13 em-dash marks are spaced, perl scan of the 18 files).
- A code file on a glyph surface whose only banned characters are arrows (`07-collections.css`). Expected: the pre-scan ignores arrows there, so it is not tokenised.
- Folder Fix All (ruling): `config/local.yml` (G3), files under the hub's `secrets` and `~/.oculus` (open item 16), a file open with unsaved text, a file changed between the confirm and the write, a link out of the root (G2), a skipped file, a file over the read limit, and the reparse check. All are missing, since the ruling is not in the brief.

Findings: each item above is missing from "Cases".

## 7. ADRs

- No record: `ls tools/oculus/docs/adr docs/adr` prints "No such file or directory" for both, and the configuration has no `adr` key.

Findings: none.

## 8. Dictated text

- `lint.writing_skip` default (item 7), `grep -n "lint.writing_skip., list of globs" agents/briefs/D40.md` (line 105): read whole as a code line. The YAML must quote every glob that starts with `*` or `.`, and the brief writes them quoted. Against remove-unicode list B (`.agents/skills/remove-unicode/SKILL.md` "### B. Exempt files", line 98):
  - Generated `*_AUTO.md`, `STATUS.md` and both feeds: match. `cockpit.html` and `present.html` are not taken anyway.
  - The skills machinery: match. B's machine-read spec sits under `.agents/` and is covered.
  - Vendored: `**/vendor/**` and `**/bttrlib/**` match. `**/third_party/**` is added; it is reasonable as vendored, but B does not name it.
  - `**/manuscript/**` is wider than B. B exempts only `**/manuscript/**/*.tex` and `.bib`, and says "A `.md` inside `manuscript/` (e.g. `CONFIG.md`) IS in scope". The glob skips `projects/coauthor/active/clinical-hccnet/manuscript/EVIDENCE.md`, `projects/manuscripts/raw-pls/manuscript/CONFIG.md` and the hub tool `tools/manuscript/README.md` (`grep "/manuscript/" mdyml-now.txt`). Today they hold 0 marks (count.py).
  - The orchestration ledger `tools/oculus/.scratch/migration/plan.md` is missing. B exempts it for its checkmark, which no class marks, and it holds 1 wrapped paragraph (wrap.mjs, 732-733).
  - Received third-party text is missing (C5 says so).
  - Venue `*.sty`, `*.cls` and `*.clo` are missing, but those files are not taken.

  Not a style break: the line contradicts C5 (a)'s "default remove-unicode B" and Z742's "defaulting to the remove-unicode skill's exempt list". A default of `**/manuscript/**/*.tex` keeps B; whether to skip received text is Axel's call (see Declined).
- `lint.writing_glyphs` default, line 106: against list C (line 127 on). It is a superset of C. `tools/cockpit/data/**` covers `cockpit.yml`, `config/*.yml` and `data/HELP.md`. `tools/cockpit/assets/**` covers the css and js assets. The templates, the four reference docs, the `present` assets, the registries, `funding.yml`, `network`, applications, education, tasks and `**/project.yml` all match. `glyphs.yml` and its `dummy/` twin are skipped by name, as C says. Holds.
- `name_writing: Writing rules` and the palette 'Writing rules: Fix All Auto-fixable Problems' (C1), lines 260 and 308: hold (`agents/spec.md` "The working rules", Prose).
- Fix titles `Replace with ...` and `Join the paragraph's lines`, and the example "Replace the en dash with a hyphen" (item 11), line 115: hold.
- Codes `em-dash`, `en-dash`, `curly-quote`, `ellipsis`, `arrow`, `nbsp`, `wrapped-paragraph`, line 314: hold.
- The G71 Doc text (C7, and open item 19 as Axel ruled it), line 347: "G71. A writing-rule mark and its fix fall only in a Markdown or YAML file's text outside front matter, code, code spans and URLs, or in a code file's comment, so Fix All never changes code." The prose holds, but the sentence is inaccurate against C6's counted docstrings (section 5). Its `Code:` and `Test:` lines, written as continuation lines in guarded.md's form, break `agents/spec.md` "What every package obeys" ("One line per paragraph or bullet in any Markdown or YAML you edit. No hard wrapping.") and the hub "Writing docs" "No hard-wrapping". The words are fixed by ruling 19, so a change to them is a stop. The layout is the ledger convention (section 4).
- "the reader's doc comment says eleven keys", line 107: holds (8 keys plus 3).

Findings:
- `lint.writing_skip`'s default does not equal list B, as C5 and Z742 say it does. It skips in-scope `.md` files under `manuscript/` folders and `tools/manuscript/`, and omits `plan.md` and received text.
- G71's ruled words disagree with counted docstrings, and its Code and Test lines in the guarded.md layout break the one-line-per-bullet rule. Its words are fixed by ruling 19, so closing this needs a stop rather than a brief edit.

## Declined to judge

- Whether received third-party text should be skipped by default. remove-unicode B says yes, the brief says no, and with Folder Fix All it decides whether records are rewritten on disk. That is Axel's call.
- Whether guarded.md and the state file's log should change to nested list items so the writing rules hold in the ledger. That is the orchestrator's or Axel's, since it changes the ledger's convention named in Z409.
- The Folder Fix All's user-visible shape (the confirm's words and layout, where it sits in the Files view), beyond noting that the brief has none.
- Whether 200 ms is the right event-loop budget for Decision 4. The brief sets it; the measurements are above.
- Monaco's acceptance of touching edits in one `executeEdits` (case 30): read from `lint-fixes.ts` only, not run, since a builder may run no page.
- The C6 grammars for C, C++, Lua and SCSS were probed on a few lines each (`node shiki2.mjs`: strings, raw strings, Lua long strings, heredocs and LaTeX verbatim scoped as code, and comments as comments). This is not proof over whole files.

Agent usage: a2cb4c691ca4ee98c, claude-opus-5-5; 296,952 tokens, 97 tool uses, 18.4 min (its completion notice).

## Closed (the session's change to the brief for every finding above, and each dictated line added after the check, made before the preparation commit)

- Names, `lint-fixture.ts` and `settings.test.ts` outside the paths: both added to "Paths this step writes" and to item 7; `settings.test.ts` added to Verify 2 for G12 and G13.
- Names, no lawful home for the highlighter and the catalog: item 2 now passes the worker's client and the catalog through `LintRouteOptions`, made in `server/root/context.ts` and held in `server-context.ts`, passed by the lint `+server.ts`, with `context-fixture.ts` and `lint-fixture.ts` giving a test's own; all five in the paths; `context.ts` added to "Shared with D39".
- Names, item 11's `t()`: item 11 and Conventions now say the server words rows with `words(catalog, key, ...)` of `server/core/words.ts`.
- Names, head comments made false: `lint.svelte.ts:1`, `lint-words.ts:8`, `problem-sources.ts:3` (its range widened to 1-35) and `server/core/program.ts:2` added to item 12 and to the paths.
- Step line, ruling 18 written to (b): item 4 now gives each arrow's ASCII form as a `kind: 'fix'` and ` to ` as a suggestion; case 12 expects the `->` fix; the C4 choice section replaced by "Rulings this brief is written to"; the remove-unicode citation updated to line 50 after 310bbac94.
- Step line, ruling 19 conditional: item 13, Paths, Verify 2 and the Cases note now make G71's test unconditional.
- Step line, Folder Fix All with no requirement: item 14 added (the Files row menu, the plan through the lint route with its reparse and its cap, the confirm with a ticked box per file under open item 20.3 (a), the write as `op: 'writing-fix'` through `lsp-edit`'s checked chain with the private folders refused, the History copy and record), Decision 13, cases 50 to 55, the paths, the docs of item 12, and G1, G2, G3 (widened) and G9 in item 13.
- Premises, case 4: now 13-28, sixteen lines.
- Premises, case 41's paragraph count: case 41 now applies item 5's `$$` rule, and the orchestrator's counts at the base are written into the case before dispatch, a different number being a finding.
- Premises, "13 under reviews": 12.
- Premises, the head: "What is on the tree" now reads on main at 4d7c65f9f with one head named; case 3 names its entry by its text, since the state file moves with every commit.
- Premises, remove-unicode line 50: the citation reads the line after 310bbac94.
- Premises, `isPreferred`: 292.
- Premises, transport.ts's path: named as `ui/controls/editor/kit/lsp/transport.ts` in the timing line.
- Cases, case 1 against the Code-line convention: open item 20.1 (b), Axel: `agents/guarded.md` keeps its continuation lines and is in the skip default; case 1 now expects `off`, with the join only when the skip list is emptied; G71's Doc text is asked in the file's present form.
- Cases, received text marked: open item 20.3 (a), Axel: the folder Fix All's confirm has a ticked box per file and only ticked files are written; item 7 and case 6 say so.
- Cases, the page halves: a "Proof of the page halves" paragraph names cases 13, 15, 21, 30, 36, 39, 53 and the folder dialog as a run of the route or store half plus reading and the look for the page half.
- The question, case 42 and Decision 4: Decision 4 replaced: comments are found in a worker thread from the start, with the scopes-only `tokenizeLine`, a 2,000-unit line cap and a 5 s limit (item 2); case 42 now times a read code file (a scratch copy of `page.py` with a planted dash) and shows the event loop free; cases 44 and 45 added for the worker.
- The question, `.tsx`: item 3 now picks the Shiki id by extension, `tsx` and `jsx`; case 43 added.
- The question, the join merging lists: item 5 now makes a join a `kind: 'fix'` only when the re-lex gives the same blocks; case 46 added.
- The question, link definitions and HTML attribute URLs: item 6 leaves both out; case 47 added.
- The question, G71 against docstrings: open item 20.2 (a), Axel: G71 names Python docstrings; item 13 holds the ruled words.
- The question, the build and Shiki's runtime load: Verify 3 now asks for the worker's file in the server output, and cases 41, 42 and 44 load Shiki and the worker at run time.
- Implied inputs, YAML quoted scalars and the line-start ellipsis: item 4 now escapes in quoted scalars, gives a line-start ellipsis only a suggestion, and reparses every YAML fix; case 48 added.
- Implied inputs, the unspaced em dash: item 4 now replaces the dash and the spaces around it; case 49 added.
- Implied inputs, a glyph-surface code file with arrows only: item 3's pre-scan ignores arrows there; case 19 says the file is not sent to the worker.
- Implied inputs, concurrent first requests, after close, superseded, grammar failure, long line: item 2 and cases 44 and 45.
- Implied inputs, the folder Fix All's refusals: cases 50 to 55.
- Dictated text, the skip default against list B: item 7's default now skips `**/manuscript/**/*.tex` and `.bib` only, adds `tools/oculus/.scratch/migration/plan.md` and, by open item 20.1 (b), `agents/guarded.md`; `**/third_party/**` stays as vendored (Decision 14); received text is kept by the folder confirm's boxes (20.3 (a)).
- Dictated text, G71's words and layout: ruled by Axel as 20.2 (a) and 20.1 (b); written in item 13.
- Dictated lines added after the check, each read by the orchestrator: G71's words (item 13, Axel's ruling 20.2 (a), quoted as ruled); the folder menu item "Fix All Writing Problems in Folder...", the button "Fix N Files" and the History words "Fixed by the writing rules in {0} files" and "... in 1 file" (item 14), plain words in the catalog's form.

Probes written by this check, all read-only: `/private/tmp/claude-502/-Users-axelfaes-workspace-research-hub/be0ac0d7-a551-4911-a072-9f76e1bbe399/scratchpad/d40-check/` (`join.mjs`, `synth.json`, `synth2.json`, `paras.mjs`, `today-brief.mjs`, `skipfilter.mjs`, `shiki2.mjs`, `shiki3.mjs`, `cost.mjs`, `md-all.txt`, `md-kept.txt`, `mdyml-now.txt`).
