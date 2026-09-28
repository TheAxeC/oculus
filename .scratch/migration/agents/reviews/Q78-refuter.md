# Q78 refutation (claude:opus, read-only, first run over the builder report)

Q78 refutation. I changed nothing in the worktree. The only files I wrote are two probe scripts in my scratchpad: `render.mjs` runs `renderMarkdown` over a real hub file, and `purify.mjs` runs DOMPurify with `PROFILE` in Chrome through Playwright's library. Both ran against the worktree's source. The one git commands I ran are the read-only `git diff d1b9c274` and `git status --short`.

## Verification (run from `.agents/worktrees/Q78/tools/oculus`)

1. `npx vitest run --reporter=dot`
```
 Test Files  340 passed (340)
      Tests  5328 passed (5328)
```
2. `npm run check`
```
1790456947431 COMPLETED 1506 FILES 0 ERRORS 0 WARNINGS 0 FILES_WITH_PROBLEMS
```
3. `npm run build`: `build exit 0`
4. `npm run format:check`: `All matched files use Prettier code style!`
5. `npm run lint`: `lint exit 0`
6. The ASCII gate of spec.md printed nothing: `ascii exit 0`
7. `sh bin/size-check.sh`: `size exit 0`. `sh bin/folder-check.sh`: `folder exit 0`
8. `npm run diagrams` twice, with the md5 of `docs/diagrams/*` compared: `second run identical`. The four regenerated files (`layers.dot/.svg`, `layer-views.dot/.svg`) are modified against the base.
9. `npm run build`, then `OCULUS_BROWSER_PORT=8863 npx playwright test tests/browser/views/contents.spec.ts tests/browser/workbench/sanitise.spec.ts tests/browser/workbench/system.spec.ts tests/browser/shell/tinted.spec.ts`: `31 passed (29.3s)`
10. Sampled revert-check:
   - `node bin/revert-check.mjs tests/server/content/markdown.test.ts`: `16 reverts, 0 unproven, 0 unchecked`, exit 0, every line `red`. I chose it because it holds all of the list logic.
   - `node bin/revert-check.mjs tests/browser/views/contents.spec.ts`: `5 reverts, 0 unproven, 0 unchecked`, exit 0, every line `red`. I chose it because it holds all of the press behaviour.
   - I did not rerun the builder's 10-file figure (`89 reverts, 0 unproven, 29 unchecked`).
11. `ls -d $TMPDIR/oculus-* | wc -l`: 0 before and 0 after.

## Spec

1. **A change no item asks for: `HELP.md:5` adds `[TOC]` to the manual.** Item 6 asks HELP.md for a sentence, not a contents list in the manual itself. As a result the Help view now opens with a contents list. The report lists this under "Visible choices", so it is disclosed, not silent. The hub-document browser case now depends on it: `contents.spec.ts:144` `await expect(manual.locator('ul.toc a[href="#the-keys"]')).toHaveCount(1);`. The orchestrator should keep it or strip it as a ruling.
2. **Premise 5 is true as written, and the builder's claim about the scroll box reproduces.**
   - Premise 5 only says that every view's box carries `data-instance`, and that holds: `Project.svelte:169` `<div class="project" data-instance={instance.id} data-project={id}>`.
   - The false assumption is in item 3 ("scrolls that box"). `.project` (`Project.svelte:235-239`) has no overflow. The scroller is `Pane.svelte`'s `.body` (`overflow: auto`, under the comment "The one thing that scrolls").
   - Doc and Help put `overflow: auto` on their own `data-instance` box (`Doc.svelte:118-119`, `Help.svelte:79-80`).
   - So scrolling the Pane body for the project tab is a substitute target, and the report says so (judgment call 1).
3. **The press reaches a fourth view the brief does not name: the source tab's Markdown preview.** `Preview.svelte:54` draws through the same partial (`<Markdown {doc} loading=... failed=... />`), so `jump` now handles fragment links there too. The report and the head comment name only the doc, help and project views.
4. The builder disclosed one read-only `git diff --stat` against the brief's "Run no git command". spec.md's last paragraph allows reading git state for the worker's own change. The breach is procedural only.
5. The lock adds only `marked-gfm-heading-id` 4.1.4 and `github-slugger` 2.0.0 (read from `git diff d1b9c274 -- package-lock.json`). `html.ts` and `turns.ts` are unchanged (not in `git status`). Both match the report.

## Proof

1. **No test covers the sanitiser dropping a heading's id; this is a real defect the suite misses (details under Behaviour 1).**
   - `markdown.test.ts:5` reads the HTML "before any sanitising", and says so.
   - `contents.spec.ts` uses only headings whose slugs survive: `the-keys`, `after-the-diagram`, `deep-in-the-readme`.
2. **`tests/views/whole/sanitise.test.ts:79-91` is an assertion over source text.** It checks for `<Markdown` and `doc={shown}`, the absence of `{@html` in `Project.svelte`, and `{@html sanitise(doc.html)}` in the partial.
   - Its title, "is drawn through the sanitiser in the project tab", reads as coverage.
   - Under spec.md it is an audit. The report says so ("this case is an audit over source text"), but the case title was not changed to say so.
   - The DOM proof that project documents are sanitised is `sanitise.spec.ts`, whose cases have no revert directives. The builder names them among the 29 unchecked.
3. **The project-tab code-span case in `tinted.spec.ts:92-95` is now proven only through the shared rule.** Its revert now points at `Markdown.svelte:194`, the code-span rule. No case covers a `pre` block over a wallpaper in the project tab, which is where the visible change is (Behaviour 2).
4. **`docs.ts:309` `const TAG = /<(?:[^>"']|"[^"]*"|'[^']*')*>/g;` is a file-scope RegExp with the `g` flag, which carries mutable `lastIndex`.** It is used only through `String.prototype.replace` (`docs.ts:323`), which resets `lastIndex`. No state leaks today, but a later `.test`/`.exec` on it would.
5. **Module state in `marked-gfm-heading-id`: no defect found.**
   - `headings` and `slugger` are module-level in `node_modules/marked-gfm-heading-id/src/index.js:2-4`.
   - `preprocess` calls `resetHeadings()` at the start of each parse.
   - `renderMarkdown` parses synchronously (`parse(text, { async: false })`, `docs.ts:275`), and the `postprocess` hook reads `getHeadingList()` inside the same synchronous call.
   - Nothing else in the tree imports the library (grep), and no renderer calls `renderMarkdown` again, so a render cannot interleave or nest.
   - It is still a dependency's module-level mutable state, read across two hooks. The brief's premise 3 sanctions it.
6. Line references in the report do not match the file. The report puts the `ul.toc` styles at `Markdown.svelte:132-155`; they are at `:144-167`.

## Standards

1. **`HELP.md:136` is false for some headings.** It says: "A press on an entry, or on any link to `#` and a heading's anchor, scrolls the tab to that heading". It is false for every heading whose id the sanitiser removes (Behaviour 1). "A document drawn as prose ... gives every heading an anchor" is also false for the source preview, which draws prose through the same partial with no heading ids.
2. **Two comments in `Markdown.svelte` are false for the views they cover.**
   - `Markdown.svelte:10-15` says the box that scrolls is "the view's own box in the doc and help views and the pane's body around the project view's box". It does not mention the source preview, which the handler now covers.
   - `Markdown.svelte:188-192` says: "Over a wallpaper the document is drawn on a translucent surface already: the box of a view that draws it asks for the tint". That is false for the project view, which the partial now draws. `Project.svelte:168` is `<Pane title={title()}>` with no `tinted`, and `Pane.svelte:56` paints nothing over a wallpaper for an untinted box.
3. **A risk named and left unfixed, and not stated prominently.** The report's Limitations names the page-level id clash with `KeySheet.svelte:20` `aria-labelledby="key-sheet-title"` and leaves it, as "outside this step's paths". Spec.md says a named risk is fixed or stated "plainly and prominently". Here it sits under Limitations, not on the report's first line.
4. No non-ASCII (gate clean). No history in comments found in the diff. Sizes: `docs.ts` 548, `Markdown.svelte` 227, `Project.svelte` 323, `contents.spec.ts` 249, `markdown.test.ts` 152 (`wc -l`). `tests/browser/views/` now holds exactly 10 items (`ls`), and `folder-check.sh` passes.
5. DESIGN.md: I grepped for `renderMarkdown|Markdown.svelte|Project.svelte|shared/prose`. The one hit is `DESIGN.md:281` (Preview draws with the partial's styles), and it stays true. No DESIGN.md sentence was found false.

## Behaviour

1. **Contents entries and `#` links do nothing for headings whose slug is a DOM or form property name, because the sanitiser strips those ids. A real hub document has one.**
   - DOMPurify's default `SANITIZE_DOM` drops an `id` whose value is `in document` or `in formElement`. The line is `node_modules/dompurify/dist/purify.es.mjs:2001` `if (SANITIZE_DOM && (lcName === 'id' || lcName === 'name') && (value in document || value in formElement))`, and `src/lib/ui/html.ts` does not set `SANITIZE_DOM` (grep).
   - I rendered 194 hub Markdown files (docs, projects, HELP.md) with `renderMarkdown`, then ran each of the 845 distinct heading ids through `DOMPurify.sanitize(..., PROFILE)` in Chrome (`purify.mjs`). The output was `stripped: method ../../projects/manuscripts/ward-bttr-crosssubject/code/README.md`, plus the probes `title`, `links` and `images`.
   - That file has `## Method` at line 75, and `code/README.md` is a project document (`docs.test.ts` "serves a document inside the project"). A `[TOC]` there would draw a "Method" entry that does nothing when pressed, and so would any heading named Title, Links, Images, Open, Close, Name, Action, Target and the like.
   - The brief asks for "every rendered document's headings carry ids", and on the page they do not all carry one.
   - Possible fixes are an id prefix, such as `gfmHeadingId({ prefix: 'user-content-' })` with the list linking to the prefixed id, or DOMPurify's `SANITIZE_NAMED_PROPS` with `named()` matching the prefixed id. Either needs a browser case with a `## Method` heading and a revert.
2. **Project tab over a wallpaper: a `pre` block loses its only surface.**
   - Before: `Project.svelte` had `:global(body.wall) .doc :global(pre) { background: color-mix(in srgb, var(--chip) var(--wall-panel), transparent); backdrop-filter: blur(var(--wall-blur)); }`.
   - After: the partial's `Markdown.svelte:197-199` `background: transparent`. The project box is not tinted, so the block now sits straight on the wallpaper.
   - The report states the before and after ("a `pre` block is transparent instead of carrying its own blurred chip"), but not that nothing under it is tinted. The tint check on TEST should look at a fenced block in a project document with a wallpaper on.
3. **Project tab, tables and images.** The report states both correctly: before, a wide table widened the document and images were uncapped; after, `.doc :global(table) { display: block; overflow-x: auto }` and `img { max-width: 100% }` from the partial. The loading and failed lines went from `p.failed` to `p.note` with identical rules (margin 0, `--fs-md`, muted). No test or spec reads `.failed` (grep).
4. **Source tab preview (not stated in the report).**
   - Before, a press on a `#fragment` link in the preview took the browser default: the page's address gained the fragment.
   - Now `jump` prevents the default and looks the id up inside the view. `blockMarkdown` gives headings no ids, so such a press does nothing at all.
   - A `[TOC]` line in the preview is still drawn as the text `[TOC]`, which the report does state.
5. **Real hub document: the server side is correct.** `renderMarkdown` over the real `docs/HPC-UTwente-howto.md` (`render.mjs`) draws one `ul.toc` with 13 entries nested under the h1, `href`s matching the 13 heading ids (`#1-access` through `#8-contacts--references`), and `/local/&lt;jobid&gt;` escaped in the entry text. None of its ids is stripped by the sanitiser (`purify.mjs`).
   - The in-box scroll was proven only against a synthetic document written at that path (`contents.spec.ts:47-56`), not with the real text on screen.
   - Headings near the end of the real document cannot reach the box top, since the content ends. The report says the same of the manual.
6. **The 304 path can keep old HTML on a page left open.** `api/docs` tags on file size and modification time only. A page still holding a tag from before this build gets a 304 and keeps the old HTML, with no ids and the literal `[TOC]`, until the file changes or the page reloads. This is low impact; brief decision 1 relies on the 304.

## Not checked

- The full revert-check over all 10 files the builder names, and the 29 unchecked cases.
- The full browser suite.
- A look in Axel's Chrome on TEST.
- Keyboard Enter on a TOC entry, tested in a browser.
- Mod-click and middle-click on fragment links.
- `scrollerOf` climbing past the view's box when that box does not overflow. It is bounded only by `document.body` (`Markdown.svelte:72-79`), so it could scroll a shell ancestor. Not verified either way.
- Page-level id clashes beyond `key-sheet-title`. The other static `id="..."` hits in `src/lib` look like component props and were not confirmed in the DOM.
- The list's look in every theme.


# Repair round 1, refuted (claude:opus, read-only, a fresh reviewer)

Q78 repair round 1 refutation. I changed nothing. The only git commands were the read-only `git diff d1b9c274` and `git status --short`, run from the worktree. `git diff d1b9c274 --stat | tail -1` printed `35 files changed, 861 insertions(+), 643 deletions(-)` both before and after the revert-check, and `git status --short` still lists 38 entries.

## Verification (run from `.agents/worktrees/Q78/tools/oculus`, each once)

1. `npx vitest run --reporter=dot`
```
 Test Files  340 passed (340)
      Tests  5332 passed (5332)
```
2. `npm run check`: `1790463741432 COMPLETED 1507 FILES 0 ERRORS 0 WARNINGS 0 FILES_WITH_PROBLEMS`
3. `npm run build`: `build exit 0`
4. `npm run format:check`: `All matched files use Prettier code style!`
5. `npm run lint`: `lint exit 0`
6. ASCII gate of spec.md:85: printed nothing, `ascii exit 0`
7. `sh bin/size-check.sh`: `size exit 0`. `sh bin/folder-check.sh`: `folder exit 0`
8. `npm run diagrams` twice. The md5 over `docs/diagrams/*` was `b15e1bd998984deef3604002d7d46428` after both runs, so the second run changed nothing. The builder's `fadf85...` came from a different hashing method and cannot be compared with mine.
9. `OCULUS_BROWSER_PORT=8871 npx playwright test tests/browser/views/contents.spec.ts tests/browser/shell/tinted.spec.ts tests/browser/workbench/sanitise.spec.ts tests/browser/workbench/system.spec.ts`: `35 passed (39.3s)`
10. Sampled revert-check: `node bin/revert-check.mjs tests/browser/views/contents.spec.ts` printed `9 reverts, 0 unproven, 0 unchecked`, every line `red`, in 3:51. I chose this file because it holds the directives of three round findings: 1 (`markdown.ts:24` prefix, `Markdown.svelte:72` prefixed match), 3 (`html.ts:332` preview) and 8 (`Markdown.svelte:94` scroll limit). It also holds the press behaviour those findings change.

## Spec

1. **The round reaches past finding 3 into slide narratives, and the visible change has no before and after in the report.**
   - `src/lib/ui/html.ts:331-332` is now `export function blockMarkdown(text: string): string { return sanitise(renderDocument(text)); }`.
   - `blockMarkdown` is also the renderer of `src/lib/views/academic/present/markup.ts:84` (`return typeset(text, blockMarkdown);`).
   - The ruling for finding 3 names the source tab's preview. The report's "Visible changes, before and after" section lists the preview but not the Present view. The slide change appears only under Judgment calls, as an after: "A slide's narrative ... now also carries prefixed heading ids and draws `[TOC]`".
   - Before: a slide narrative had no heading ids and drew `[TOC]` as text. After: ids and a list whose links nothing handles (Behaviour 1).
   - The look on TEST has nothing to check the Present view against.

2. **The layer-rule change is a sound placement, not a check widened to pass.**
   - The document rule has to be importable by `server/content/docs.ts` and by `ui/html.ts`. The `data/, server/` row (`DESIGN.md:170`) may import only `data/`, and `ui/` may import no `state/` module other than `words/text`. So `data/` is the only folder both sides can reach.
   - There is precedent: `data/helpers/search.ts` and `data/helpers/text-kind.ts` are rules "the page runs before it sends and the server runs when it receives" (DESIGN.md:130).
   - The widening names one module, not a folder: `ui: ['ui/**', 'themes/**', 'state/shared/words/text', 'data/prose/markdown']` (`boundaries.test.ts:84`). It carries a reason comment (`:65-68`), and DESIGN.md:166 matches it.
   - Layer 1 importing `marked` and `marked-gfm-heading-id` breaks no DESIGN.md rule. The `data/` row forbids only client-side imports, and the data layer already imports `yaml` (`grep -rhoE "^import .* from '[^.][^']*'" src/lib/data`).
   - `order.ts` puts `data/prose` between `data/helpers` and `data/model`, so it can reach only `data/model`, and `markdown.ts` imports no tree module at all.
   - The new folder was needed because `data/helpers` is at ten items, and folder-check passes.
   - One gap is a doc gap and not a rule breach; it is listed under Standards 3.

3. The other rulings match what is on the tree:
   - 2: `Markdown.svelte:113` `class:surfaced={surface}` and `:226`.
   - 4: `HELP.md:5` `[TOC]` is kept.
   - 5: the case at `sanitise.test.ts:79` is retitled "audits that ...". The allow-list line is removed, and `audits.test.ts:214` skips titles that start with `audits`. `sanitise.spec.ts:67` gets a directive.
   - 6: the RegExp is a literal inside `wordsOf`, `markdown.ts:47`.
   - 8: `Markdown.svelte:94`.
   - 9: `docs.ts:109,121`.
   - 10: the directives added to `source.test.ts` sit on cases whose expectations changed. The renumbered directives in `boundaries.test.ts` and `order.test.ts` are existing directives with their line numbers shifted.

## Proof

1. The round's claims that I reran reproduce: vitest 5332 passed, browser 35 passed, and the 9 contents.spec reverts are all red.
2. I did not revert-check the round's other new directives:
   - `tinted.spec.ts:138-139` (finding 2)
   - `sanitise.spec.ts:67` (finding 5)
   - `docs.test.ts:386,411` (finding 9)
   - `markdown.test.ts` and `source.test.ts` (finding 3)
   For those, the builder's `135 reverts, 0 unproven, 46 unchecked` is unreproduced by me.
3. `docs.test.ts:385-395` builds its expected tag from the exported `PROCESS_TAG` itself (`` `"${PROCESS_TAG}-${String(stat.size)}-${String(stat.mtimeMs)}"` ``). That case therefore proves the tag's shape and not that the stamp differs between processes. The case at `:410` ("renders again for a tag an earlier server process answered with") is the real proof, and its revert is the right one. No defect.

## Standards

1. **`src/lib/server/content/docs.ts:24-25` is made false by finding 9.** It says: "Every file answered carries an entity tag of its size and modification time, and a request that sends the tag it holds back in If-None-Match is answered 304 while the file is unchanged."
   - The tag now starts with the process stamp (`docs.ts:121`).
   - An unchanged file is answered 200 to a tag from an earlier process.
   - The `fileTag` doc comment at `:112-117` was updated. This head comment was not.

2. **`DESIGN.md:107` is made false by the same change.** It says: "A document answer carries an `ETag` of the file's size and modification time ... an unchanged file is a `304` that keeps what the page holds". Spec.md:57 treats a sentence a change makes false as a defect of the change.

3. **`DESIGN.md:52-53` no longer lists the data layer's folders.** It reads "`data/` LAYER 1, top down: index.ts, sources/, snapshot/, accounts/, helpers/, model/". The tree and `tests/checks/imports/order.ts:35-43` now have `prose/` between `helpers/` and `model/`.

4. **`PROCESS_TAG = randomUUID()` at file scope (`docs.ts:109`) is judged not a breach of "no globals".**
   - It is an exported `const` string that is never written, so it is not mutable state or a bridge.
   - Each module graph that loads `docs.ts` gets its own stamp. The only effect of two graphs is a 200 where a 304 could have been.
   - It is a side effect at module load (randomness) that tests read by importing it, and it is disclosed in its doc comment. No finding.

5. Sizes (`wc -l` from the report, and size-check passes): `markdown.ts` 119, `Markdown.svelte` 257, `contents.spec.ts` 378, `boundaries.test.ts` 600, `docs.ts` 465. The ASCII gate is clean. I found no history in comments in the round's hunks. The head comments of the new files follow their siblings' pattern.

## Behaviour

1. **A contents entry or `#` link in a slide narrative is not handled.** The report's own words: "It is drawn outside the prose partial, so a press on one of its `#` links is not handled by `jump`."
   - `grep -rn 'onclick\|preventDefault' src/lib/views/academic/present/parts/Words.svelte` finds nothing. The only `preventDefault` calls in `Present.svelte:99-122` are for keys.
   - So a `[TOC]` the round now draws in a slide takes the browser default: the address gains `#user-content-...` and the browser scrolls to that id wherever it sits in the page.
   - That contradicts brief item 3's "the page's address does not change" for a drawn document. The round introduced this state (before the round, a slide drew `[TOC]` as text).
   - The builder named this risk and left it under Judgment calls, not fixed and not stated prominently.
   - Not verified in a browser.

2. After a server restart, every open document tab gets a 200 and re-renders once instead of a 304. This is intended by finding 9 and stated in the report.

3. Every heading id changed from `<slug>` to `user-content-<slug>`. Inside a drawn document, `Markdown.svelte:70-79` still resolves a bare `#slug`, and contents.spec's "Method" case proves that. A link from outside oculus to an unprefixed id does not apply, since the press never goes through the address.

## Not checked

- Revert-check of every file except `contents.spec.ts`, including the 46 unchecked cases.
- The full browser suite.
- The look on TEST in Axel's Chrome: the project `pre` surface over a wallpaper, and the list in every theme.
- A browser run of a slide narrative holding `[TOC]` or a `#` link (Behaviour 1 is read from the source and the report).
- Duplicate heading ids when several slides or several prose tabs are drawn on one page, beyond the brief's accepted decision 2.
- Keyboard Enter, mod-click and middle-click on contents entries.

## Closed

The first run's findings went back to the builder as the ten findings of the round message, with the orchestrator's read; the run over the round reproduced each closure on the tree (its Spec 3 and Proof 1). The run over the round, disposed at landing on main:

- Spec 1 and Behaviour 1, a `#` link or `[TOC]` entry in a slide narrative took the browser default and changed the address: fixed at landing. The press handler moved out of `Markdown.svelte` into `src/lib/views/shared/prose/jump.ts`, and `present/parts/Words.svelte` hands a narrative's clicks to it, so a slide answers a fragment link as every drawn document does. New case in `tests/browser/workbench/present.spec.ts` ("a contents entry in a slide narrative scrolls inside the deck and leaves the address alone"), red with the handler taken off `Words.svelte`. The before and after is in `Q78-landing.md`.
- Proof 2, the round's directives not revert-checked by the reviewer: re-run on main at landing, with every directive the landing re-pointed (the counts are in `Q78-landing.md`).
- Standards 1, `docs.ts`'s head comment on the entity tag: fixed at landing, it names the server process.
- Standards 2, `DESIGN.md`'s ETag sentence: fixed at landing, it names the server process and says a restarted server renders once.
- Standards 3, `DESIGN.md`'s data layer list: fixed at landing, `prose/` added between `helpers/` and `model/`.
- Spec 2, Proof 3, Standards 4 and 5, Behaviour 2 and 3: no defect, as the reviewer found.

Found by the orchestrator at landing:

- The tree row's controls and status letter followed the name (open item R1): Axel ruled (a), fixed at landing in `TreeItem.svelte` with a case in `views.spec.ts`.
- Two tooltips open at once when the pointer is over a row action inside a row that carries its own words: a defect of the Tooltip primitive older than this step, booked on Q81's line in `plan.md` (menus, tooltips and dialogs on bits-ui).

## Reviewer usage (added 2026-09-28 from the state file's usage table)

The review, claude:opus, agent `a4e9f46c3ef0c954a`: 42 messages, 42 tool uses, 15.6 minutes. The run over round 1, claude:opus, agent `ab8486ac284a14abd`: 34 messages, 35 tool uses, 14.3 minutes.
