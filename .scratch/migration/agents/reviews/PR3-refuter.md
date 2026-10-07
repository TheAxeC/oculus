PR3 review (refute). The verification lines come first, then the verdicts, then the findings. All commands ran in /Users/axelfaes/workspace/research-hub/.agents/worktrees/PR3/tools/oculus unless a line says otherwise.

VERIFICATION LINES, VERBATIM

1. `npm run test:quick -- --base 272f60b4` (load average 5.99 8.49 11.72 at the start):
- test:quick: 112 changed file(s), from git since 272f60b4
- test:quick: 97 test file(s), 10 essential
- ok ASCII gate (1.7 s)
- ok prettier (4.2 s): All matched files use Prettier code style!
- ok svelte-kit sync (14.5 s)
- ok eslint (26.6 s)
- ok svelte-check (29.2 s): 1791325569328 COMPLETED 397 FILES 0 ERRORS 0 WARNINGS 0 FILES_WITH_PROBLEMS
- ok vitest (44.8 s): Duration 30.26s (transform 66.92s, setup 0ms, import 84.29s, tests 19.12s, environment 1.64s)
- test:quick: 46.1 s (limit 45.0 s); every command passed
- test:quick: over the time limit

2. `npx vitest run` over the 11 changed or new test files printed "Test Files 11 passed (11)" and "Tests 64 passed (64)". Run one file at a time, the counts were: present 3, deck 3, app-gate 19, deck-slides 2, undo 11, changes 7, window-guard 5, deck-acts 6, source 3, palette-source.client 2, export 3. These match the report's counts per file.

3. `grep -nE "\S - \S" ../../projects/*/*/present/*.md ../../projects/archive/*/*/*/present/*.md` printed nothing (exit 1).

4. `grep -rn printToPDF src` printed `src/desktop/windows/print.ts:5` and `src/desktop/windows/print.ts:70` and nothing else. `grep -ni "pptx\|powerpoint"` over the changed files hit only `docs/views.md:11`. That line is the same on the base tree, and the report says so.

5. On "each new or changed test is run on the unchanged tree": I did not rerun it. Doing so would mean checking the new tests out over the base tree, and that comes close to the ban on breakage testing. The report's base-tree failures (report:109) agree with what the tests contain:
- export.ts did not exist on the base tree.
- `source.offer` did not exist on the base tree.
- The `no-cache` assertion fails without the source.svelte.ts change.
- The app-gate row passes on both trees, and the report says so.

6. Every case the report quotes, I compared against Appendix A (report lines 430 to 820) and against the driver scripts in the scratch folder. Example: cases-a.py:13 `newm = more[:1] + ['btfno'] + more[1:]`, together with deck/present.yml lines 20 to 26, puts btfno second in `more`. Checks on where the cases wrote:
- `ls deck/slide-1.md deck/fig.png deck/deck.pdf deck/title-copy.md docs/present.yml` in the main checkout: none of these files exists.
- `git status --short` in the main checkout printed nothing, so no case wrote into `deck/` or a project.

7. The tests of G47, G49 and G53 (window-guard, window-file, app-gate, approve, manifest, app-files, methods) printed "Test Files 7 passed (7)" and "Tests 183 passed (183)".

8. Other checks:
- `bash utils/folder-check.sh` exited 0.
- `sh utils/unused-exports.sh` ran. Of its entries in files the step touched, only `writeDeckSlides` (path changed) and `deckEditWrite` were added by the step (`git diff 272f60b4 -- src | grep "^+export"`). Both follow the pattern of the roughly 45 other re-exports of writes.ts that the script already lists. No new unused export is a finding.
- Non-ASCII on added lines: 0.

ITEM VERDICTS (What to build)

1. Slide list, drag within and across groups, `order:`: holds.
- `deck-slides` takes `{groups, order}` and applies them as one edit (deck.ts `put`). The old body shape answers 400 (case 4).
- An order base that differs from the file refuses the whole request (case 3).
- Order.svelte and the order rows are present.
- A dragged row is always a member, since the grip and `draggable` exist only when `at >= 0` (Slides.svelte:299-307). So withCross's null paths are the two cases "same group" and "already in", and the `already_in` sentence is true when it is shown.

2. A slide's actions in the Present view: holds.
- slideActs (present.ts:373-386) offers Edit only when there is a source, Duplicate only for an own slide, and Delete for an own slide or a summary or grid entry.
- deck-acts.ts dispatches the acts. Delete asks first (the dialog line in final-step3.log).

3. The slide drawn live beside its editor: holds in code.
- `drawn` POSTs the drafts. live.svelte.ts debounces at 250 ms and guards with `current`.
- The server matches drafts by real path, takes at most 64 of them, and answers 413 above 1 MB.
- The look (case 16) is not judged.

4. An image dropped on a slide: holds, with the Behaviour finding B2.

5. New Presentation: holds (createDeck, the explorer menu item and the folder-name input).

6. From outline: holds (outline.ts on the marked Lexer; cases 21, 22, 23 and 35 quoted).

7. Export to PDF, the only export: holds.
- print.ts is the one printToPDF site. The 'print' sender may call no channel (`PRINT_CHANNELS=[]`), and printTarget checks the address.
- The PDF is written through explorer.upload. No pptx path exists.
- G53 holds by reading the code, with no test (Proof P2).

8. The carried spaced hyphens (Z664): holds. I read the word diff of the 40 lines: every change is a comma, colon, semicolon or parentheses, and every number and name is kept. The grep of check 3 prints nothing.

9. The documents: holds, with the Standards findings S1, S2 and S4. DESIGN.md, HELP.md, docs/views.md, files-and-search.md, apps.md, configuration.md, window.md and the diagrams all changed.

CASE VERDICTS

1. Met at the write level. The quoted diff shows exactly two changed lines: `-14 btfno` and `+21 btfno`, second in `more`. The UI run in final-step12.log dropped btfno at the end of `more`, which is the place that run dropped it; a look at landing.
2. Met. One line moved.
3. Met. Answers `order_changed` with `changed: []`, so no group list was written. The brief itself names order_changed in item 1 and "the file-changed sentence" in case 3; the sentence used is the order variant of that sentence (Spec F5).
4. Met. 400, file unchanged.
5. Met. slide-1.md is inserted after engine.md, undo trashes it and restores present.yml, and redo works.
6. Met. slide-1.md, then slide-2.md. The second one is inserted before slide-1, since both are anchored at engine.md.
7. Met.
8. Met.
9. Met. It asks first (final-step3.log). The file is trashed and its entry removed. Undo writes the file back and puts the entry back.
10. Met. `'# One\n\n---\nkind: image\n---\n# Two\n'` after undo, and `'---\nkind: image\n---\n# Two\n'` after the delete.
11. Met. One order line removed; pillars kept.
11a. Met for the data: the summary's source carries `line: 45`. That the tab opens at that line is a look, not judged.
12. Met at the server (Delete on a member slide is refused: "is not in a file of this deck"), and in slideActs by reading: Duplicate and Delete need ownSlide. The menu itself was not seen by me.
13. Met.
14. Met. Every path variant is refused, and the POST answers 403 outside.
15. Met. 403 with the token sentence or `token`.
16. Not verifiable (a look). The server half is quoted: "TYPED HEADING UNSAVED | disk unchanged True".
17. Met.
18. Write half met: fig.png, then fig-2.png, the `image-bytes` record carries a sha256, and undo leaves fig.png. The drop look is not judged.
19. Partial. The `.pdf` refusal is quoted. The two-file refusal is code only (present.ts:412 `files.length !== 1` gives `present.drop_one`). It is neither quoted nor tested.
20. Met.
21. Met.
22. Met.
23. Met. `***` stays inside slides.md, and the deck reads two text slides plus closing.
24. Not verifiable (a look and the desktop app). The builder's hidden-window run shows the deck.pdf write (4191856 bytes) and the replace question on a second export.
25. Not verifiable (the real print dialog). The builder's run shows data-ready, 21 frames and window.print called once.
26. Met (check 3 and the word diff).
27. Met. The five grid lines move whole.
28. Met. The old-shape record is undone through `groupOf`.
29. Met.
30. Met.
31. Met. Both entries leave the order, and the file is trashed.
32. Met.
33. Met.
34. Met.
35. Met.
36. Met.

FINDINGS

Spec

F1. New tests outside the brief's allowed entries.
- Where: tests/views/academic/export.test.ts (new, 3 tests); tests/state/workbench/palette-source.client.test.ts (new, 2 tests); a new test in tests/state/sessions/source.test.ts ('asks the server each time...'); the G47 rows in tests/server/desktop/window-guard.test.ts ('prints only the print route...').
- What is wrong: the brief and spec.md:57 allow tests only for the guarded entries named (G2, G8, G9, G32, G49), and a case outside them is handed back before it is written. `grep -c` over guarded.md printed 0 for export.test.ts, for palette-source.client.test.ts and for the new source.test.ts title. Report:252-253 admits these with no ruling.
- Failure scenario: tests the plan never asked for enter the quick list and its time budget, and nobody has ruled that they are wanted. The G47 rows do test a guard this step changes (the print sender), so they are the strongest of the four.
- Verdict: a finding for the orchestrator. Rule on keeping or dropping each one. My recommendation: keep the G47 rows and book them on G47's line; drop or rule on the other three.

F2. Paths written beyond the write list.
- Each one, as I read it:
  - changes.ts `writtenWith`: needed for act-wide undo. Justified.
  - History.svelte (`kind_deck_order`, deckAct, named): needed. Justified.
  - file-ops.ts and the explorer files (naming.ts mode 'deck', place.ts, tree-rows.ts, files-view.ts, picks.svelte.ts, NameInput.svelte, Tree.svelte, row-menu.ts, row-ops.ts): needed for the New Presentation and outline items of item 5. Justified.
  - themes/slide.css and +layout.svelte: the shared slide frame styles for Present and the print route. Justified.
  - command-runs.ts and palette-open.ts: an extraction that keeps Palette.svelte under the size limit (510 lines). Justified.
  - source.svelte.ts `cache:'no-cache'`: changes every source tab's read. The reason is real: the file route answers max-age 60, so a stale base text would refuse an act. It widens behaviour beyond decks (B4).
  - docs/window.md, the diagrams, app.ts, model/index.ts, app.yml: follow from the above.
- Not changed although named in the write list: windows.ts and window-options.ts. This fits G53: the print window is created in print.ts and never registered.
- Verdict: no defect. The source.svelte.ts change needs to be recorded as a cross-cutting change.

F3. Wire shape beyond the brief.
- Where: model-entities.ts.
- What is wrong: DeckSlideSource gained `entry` and `line` (the brief named root, path and index), and Deck gained `order: DeckOrderEntry[]`. Report:247 names `line` only.
- Failure scenario: a wire field nobody ruled on, which later readers depend on.
- Verdict: a finding to record. All three fields are internal to the page's deck model, and Order.svelte and Edit Slide use them.

F4. Electron was run outside the desktop app.
- Where: report:256; the scratch folder ui/*.cjs.
- What happened: the looks were driven in standalone hidden Electron windows (`new BrowserWindow({ show: false })`), and the first run downloaded the Electron binary into the package cache, a write outside the worktree. The brief bans starting the desktop app (G48), and the standing demands ban taking focus.
- Evidence: the harness creates no shown window. I cannot verify whether focus was taken.
- Verdict: disclosed. It does not technically break "do not start the desktop app", but the cache download is a side effect outside the worktree that nobody ruled on.

F5. The brief is inconsistent on case 3.
- Case 3 says "the file-changed sentence". Item 1 asks for `order_changed`, which is what the code answers: "The order of the deck changed on disk while you were working...".
- Verdict: the brief, not the code. Accept.

Proof

P1. Report:97-109 claims every new test was seen failing first.
- The app-gate DECK_EDIT row passes on the base tree too (the report says so at :109), so it pins preserved behaviour, not new behaviour.
- Verdict: acceptable as stated in the report.

P2. G53 (the print window is never recorded in the window file) has no test.
- It holds by reading the code: print.ts builds its own BrowserWindow and never goes through windows.ts, and `grep getAllWindows` finds no enumeration that would pick it up.
- Failure scenario: a later change that saves every BrowserWindow's bounds would record the print window, and no test would catch it.
- Verdict: open. Whether G53 gets a test, or stays under the code-reading guarantee, is the orchestrator's call per spec:57.

P3. The `UnhandledPromiseRejectionWarning: Error: An object could not be cloned` at the top of final-step11.log comes from the harness, not the product.
- step11.cjs runs `executeJavaScript("window.__printed = 0; window.print = () => {...};")`, and the value of that expression is a function, which cannot be cloned back over IPC.
- Verdict: no product defect. The report quotes it without explaining it.

P4. deck-acts.test.ts undoes every act in one loop (6 tests). dropRefusal and slideActs have no tests (`grep -rn "dropRefusal\|slideActs" tests` printed nothing). That fits the brief's G-only test rule.
- Verdict: none.

Standards

S1. Catalog sentences hardcode limits that the code holds as constants.
- config/text/server.yml:55 `image_large: 'The image {0} is larger than 32 MB'`
- config/text/views/academic/present.yml:15 `drop_large: '{0} is larger than 32 MB, so it is not added to the slide.'`
- config/text/desktop.yml:63 `timeout: The deck was not ready to print within 60 seconds, so no PDF was made.` The code has `READY_WAIT_MS = 60_000` (print.ts:18) and MAX_UPLOAD_BYTES.
- Elsewhere the catalog passes the number as a parameter, for example findings.yml:216 `{1} MB` and memories.yml:22 `{0} MB`.
- Failure scenario: a change to the constant leaves the sentence wrong.
- Verdict: fix. Pass the limit as `{1}`.

S2. Catalog keys out of order.
- config/text/views/academic/slides.yml: `already_in` sits between `drag_tip` and `dropped`, and `entry_moved` sits between `kind_missing` and `loading`. Every other key of the file is in alphabetical order.
- Verdict: fix (move the two keys).

S3. History wording in a code comment.
- deck.ts:48 `/** The group a record's key names: the key of a first-form record is the group itself. */`
- "first-form" describes an earlier record shape by when it was written. The file-wide history ban asks for the shape itself, for example "a record keyed by the bare group name".
- Verdict: fix (reword).

S4. The `outline` fact duplicates the `markdown` fact.
- row-menu.ts:257 `outline: kind === 'file' && languageOf(row.path, languages) === 'markdown'` is the same expression as row-menu.ts:235 `markdown: ...`.
- Verdict: minor. Use `facts.markdown` for ROW_DECK_OUTLINE at :299 and drop the field, unless the plan wants the two to diverge.

S5. test:quick ran 46.1 s against its 45 s limit, at load about 6. The report saw 105 s at load 24.
- Verdict: noted. The overrun is small at moderate load. The 11 new or changed test files add to the selection (see F1).

S6. config/text/server.yml:70 `changed: The group's slides list changed on disk...` is still worded for one group, while the request now carries several lists. It is still correct per list, since it is answered for the list whose base differs.
- Verdict: none.

Behaviour

B1. A deck-edit undo is not all-or-none when the Trash fails.
- Where: deck-undo.ts:71-91.
```ts
for (const one of parts.filter((part) => part.before !== '')) {
    mkdirSync(dirname(one.path), { recursive: true });
    writeTextAtomic(one.path, one.before);
}
for (const one of parts.filter((part) => part.before === '')) {
    await trash(one.path, { glob: false });
    ...
} catch {
    return { error: 'unwritable' };
}
```
- What is wrong: the head comment (deck-undo.ts:1-2) says "every file the act changed goes back as it was, or none does". If the Trash call throws after present.yml was written back, present.yml is restored, the made file stays, and no record is written.
- Failure scenario: an undo of New Slide where the Trash fails (permissions, a volume without a Trash). present.yml loses the entry and slide-1.md stays as an orphan. Every later undo of that act answers 'moved', since present.yml no longer holds its after state, so the act can never be undone. deck-files.ts `remove` already rolls present.yml back on a Trash failure, so the pattern exists in the step.
- Verdict: defect, rare trigger. Fix: on a Trash failure, write back the after texts already written, as `remove` does.

B2. The image link breaks for some legal names.
- Where: deck-files.ts:369-372.
```ts
return /[\s()]/.test(name) ? `![${stem}](<${name}>)` : `![${stem}](${name})`;
```
- What is wrong: a name holding `#`, `%` or `?` passes the name check (it refuses only `/[/\\<>\0]/`, `..` and a leading dot) and is linked without angle brackets.
- Failure scenario: `fig#1.png` writes `![fig#1](fig#1.png)`. The browser reads `#1.png` as a fragment and asks for `fig`, so the image does not draw, although the file was copied. `%` gives a bad percent escape.
- Verdict: defect. Fix: wrap or percent-encode for `#`, `%` and `?` too, or refuse those names with the existing `image_name` sentence.

B3. History names an order record "order / order".
- Where: History.svelte:150-151 `return row.field === '' ? key : t('history.named', key, row.field);`, with history.yml:13 `named: '{0} / {1}'`. An order record has key 'order' and field 'order'.
- Failure scenario: the History row reads "order / order" beside the kind "deck order".
- Verdict: minor defect. Fix: name an order record by its file, or by the key alone.

B4. source.svelte.ts `fetch(sourceFileUrl(root, path), { cache: 'no-cache' })` applies to every source read in every view, not only decks.
- Effect: each read revalidates instead of using the up-to-60 s browser copy. That is correct for write bases, at the cost of one request per read.
- Verdict: holds. Record it as a cross-cutting change (F2).

B5. saveMessage now puts a refused reason ahead of ok.
- This is correct: deck-slides answers 200 `ok: true` with `refused`, and before this change the view would have said "saved".
- Verdict: holds.

B6. The print route passes `first={false}` for every slide, so the key-hint foot ("Arrow keys or Space...") is absent from the PDF.
- Verdict: intended by reading. No finding.

Judgment of the report's open questions

1. G53 has no test: see P2. The guarantee holds by construction today. Open for a ruling.

2. The widened paths: see F2. Each is justified. source.svelte.ts is the one with effects outside decks.

3. The 45 s quick-limit overrun: see S5. 46.1 s at load 6 in my run.

4. tests/server/desktop/start.test.ts is flaky.
- It is outside this step: no hunk of the diff touches it, and spec:74 treats failures outside the step's tests as not the step's.
- Verdict: not a PR3 finding. It needs its own booking.

5. The Trash moves of the scratch copies landed in the real macOS Trash. Only scratch files were moved: the main checkout is clean, and none of the case files exists there.
- Verdict: acceptable. The deck-acts tests use an injected trash folder.

6. Act-wide undo is bounded by log pruning.
- changes.ts:332-334 `if (lines.length + written.length > log.keep * 2) { ... const kept = all.slice(-log.keep);` can cut through an act's records. With keep 500 (behavior.yml:153), the cut lands inside an act only when the act sits exactly at the boundary.
- writtenWith then returns only the remaining records, and an undo takes back part of the act. For example, slide-1.md is trashed while present.yml keeps the entry, so the order names a missing file.
- Verdict: a real defect, low likelihood. Fix: prune at an act boundary, or refuse an undo whose act has lost records. The second needs a record count stored in the act.

7. The `slides:x` group name is ambiguous.
- `groupOf` strips `slides:` only from keys that begin with it. Only an old bare-key record of a group literally named `slides:...` would be misread, and no deck on the tree has one.
- Verdict: negligible. No finding.

DECLINED TO JUDGE

- Cases 16, 24 and 25, and the look halves of 11a, 12 and 18, need the running page or the desktop app and a print dialog. The brief makes them looks at landing, and I may not start the desktop app or take focus.
- G53 at runtime, that is whether the window file stays free of the print window during a real export: this needs the desktop app.
- The base-tree rerun of each new test (check 5): I did not run it, as explained under check 5.

Usage: agent aa378ab34c21e2821, model claude-opus-5-5.

Usage: aa378ab34c21e2821, claude-opus-5-5, 126,998 tokens, 108 tool uses, 15.8 min.

## Repair round 1, refuted

The run over repair round 1, saved from the reviewer's final message (a22d168bb7ca66506, claude-opus-5-5). Its findings are never sent to the builder; each is fixed at landing, as the Closed heading below says.

Verification: `npm run test:quick -- --base 272f60b4` printed `test:quick: 36.6 s (limit 45.0 s); every command passed` (ok ASCII gate, svelte-kit sync, prettier, vitest, svelte-check 397 FILES 0 ERRORS, eslint); the round's 11 test files `Test Files 11 passed (11)`, `Tests 81 passed (81)`; the round's three new rows fail on the builder's copy of the worktree before the round (`Tests 3 failed | 12 passed (15)`); `grep -rn "32 MB\|60 seconds" config/text --exclude=local.yml` nothing; the ASCII gate over the round's files nothing; `npm run test:checks` 243 passed; `npm run check` 3078 FILES 0 ERRORS.

Verdicts over the whole diff since the base: items 1 to 9 hold (item 4 for `#`, `%` and `?`; the space and parentheses case is Z675's). Cases 1 to 15, 17, 19 (by reading), 20 to 23, 26 to 36 met; 11a, 12 and 18 met for the data, their look halves at landing; 16, 24 and 25 not verifiable here (looks at landing).

Findings:
- R1, Behaviour. `deck-undo.ts:93-97`: the rollback writes every file already written back with its `after` text, so a file the act left absent (`after` empty) is written as an empty file; the `catch` takes every throw, not only the Trash's. Failure: the undo of Delete Slide of a one-slide `slide-1.md` whose `present.yml` write throws leaves an empty `slide-1.md` that `order:` does not name.
- R2, Behaviour (report text). `PR3-report.md:367` "within about 1.5 s"; the code waits `DRAFT_REST_MS = 250` and the brief asks for at most 250 ms; the look at landing would read against the wrong figure.
- R3, Standards. `READY_WAIT_MS` moved into `src/lib/state/shared/stores/desktop.ts` and imported by `src/desktop/windows/print.ts`, a host-to-client-state runtime import (DESIGN.md "Boundaries"), a new `"desktop" -> "state"` edge in `docs/diagrams/layers.dot`, which `boundaries.test.ts` does not read; `IMAGE_LIMIT_MB` and `UPLOAD_LIMIT_MB` repeat one expression over `MAX_UPLOAD_BYTES` (`src/lib/data/file-ops.ts`).
- R4, Standards. `config/behavior.yml:152`'s description of `keep` is false once the prune keeps whole acts.
- R5, Standards. The worktree's `guarded.md` copy books the prune row under G9's "an app's store", and the test sits in the describe of store writes (`changes.test.ts:282`, `:321`).
- R6, Proof. `kinds.ts:107` now decodes with `decodeURIComponent`; no kept test reads an encoded image link through the deck reader (G32's present table).
- R7, Standards (the first build). `PR3-report.md:226` and `:532` show the first build ran git commands (`git status`, `git diff HEAD`, `git show HEAD:`), which spec.md forbids a builder; not new in this round.
- Z675, stated by the builder in part: a name with parentheses and no space (`![fig(1)](<fig(1).png>)`) also breaks, the `IMAGE` pattern capturing `<fig(1`; `deck-acts.test.ts:181` asserts the angle-bracket form Z675 replaces.

Declined to judge: cases 16, 24 and 25 and the look halves of 11a, 12 and 18 (the running page, the desktop app, a print dialog); B3's History row (a view, at the look); the case scripts on the scratch server (not rerun); the builder's two-file drop run (judged by reading); the base's unused-export list (the base copy has no node_modules); Z674 (6) (the separate diagnosis).

### Closed

- R1: fixed at landing. In the rollback, a non-image part whose `after` is empty is removed (`unlinkSync`) rather than written; small, inside item 2 and B1.
- R2: fixed at landing. The report's row reads "within 250 ms of the last keystroke, plus the answer of the POST".
- R3: fixed at landing. `READY_WAIT_MS` and one `MAX_UPLOAD_MB` move into `src/lib/data/` (the MB value beside `MAX_UPLOAD_BYTES` in `file-ops.ts`), imported from there by the host and the page, and `npm run diagrams` run again so the edge goes.
- R4: fixed at landing. `behavior.yml:152` reads "...it is rewritten down to that number, or the few more that keep the last act whole, once it has grown past twice it."
- R5: fixed at landing. The prune row is booked on G9 under its own label, "the change log's prune", in a describe that names the prune.
- R6: fixed at landing. One row in G32's present table: an image linked as `fig%231.png` and as `my%20fig.png` is read to the files `fig#1.png` and `my fig.png`, with Z675's fix.
- R7: no change to the tree; booked with the landing as a fact of the first build.
- Z675: fixed at landing as ruled, a space, `(`, `)`, `#`, `%` and `?` percent-encoded with no angle brackets; the row at `deck-acts.test.ts:181` takes the encoded form.
