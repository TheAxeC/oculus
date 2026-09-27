# Q78 report (claude:opus builder)

Everything in the brief is done.

Before the details, two things the orchestrator should know:
- I broke the no-git rule once. Right after `npm install` I ran `git diff --stat` in the worktree to check which files the install had changed. It is a read-only command and changed nothing, but the prompt forbade any git command.
- Premise 5 of the brief is only partly true: the project view's box does not scroll. The press therefore scrolls the nearest scrolling box around the heading (details under Judgment calls, item 1).

## Open items of the state file (verbatim)

- R1, where a tree row's status letter and controls sit (raised 2026-09-26 at X3b's landing, seen on the TEST page). In the Repositories view, as in the Files view, a row's hover controls and its status letter (`M`, `U`, `A`) follow the path, so the letters of a list sit at a different place on every row. VS Code puts them at the row's right edge, one column down the list. `src/lib/ui/tree/TreeItem.svelte:270-276` keeps the name to its own width on purpose: Q59's orchestrator, not Axel, decided that the controls and counts should sit beside the name in a wide pane (`agents/reviews/Q59-report.md:72`). That decision now clashes with Axel's standing demand that VS Code surfaces match VS Code. Options: (a) the name takes the free width, so every row's controls and letter sit at the right edge as in VS Code's Source Control and Explorer, in every view that draws a tree row; the change is `.main { flex: 1 1 auto }` and a browser case; (b) keep the controls beside the name. Recommended (a): it is what VS Code does, a column of letters can be read down the list, and a count or letter a pane's width from its name is what VS Code accepts too. (b) is the lazy option.

## DONE / NOT DONE (all commands run from `.agents/worktrees/Q78/tools/oculus`)

| Item | State | Command and output |
|---|---|---|
| 1 Library | DONE | `package.json:49` `"marked-gfm-heading-id": "4.1.4"`. The lock adds only that package and its dependency `github-slugger` 2.0.0 (diff against the main checkout). `html.ts` and `turns.ts` are unchanged. |
| 2 `[TOC]` becomes the list | DONE | `npx vitest run tests/server/content/markdown.test.ts`: 15 passed |
| 3 A press scrolls the view's own box | DONE | `OCULUS_BROWSER_PORT=8841 npx playwright test tests/browser/views/contents.spec.ts`: 4 passed |
| 4 One draw point | DONE | `Project.svelte:211-215` draws `<Markdown doc={shown} loading=... failed=...>`. `grep '{@html' Project.svelte` finds nothing. |
| 5 The list's look | DONE (not seen on screen) | `Markdown.svelte` has `ul.toc` rules using tokens only |
| 6 Docs | DONE | HELP.md has `[TOC]` at line 5 and a new paragraph at line 136. DESIGN.md is unchanged: no sentence of it became false (grep for renderMarkdown, Markdown.svelte and Project.svelte). |
| 7 Tests | DONE | New `tests/server/content/markdown.test.ts` and `tests/browser/views/contents.spec.ts` |
| check 1 | pass | `npx vitest run --reporter=dot`: `Test Files 340 passed (340)`, `Tests 5328 passed (5328)` |
| check 2 | pass | `npm run check`: `COMPLETED 1506 FILES 0 ERRORS 0 WARNINGS 0 FILES_WITH_PROBLEMS` |
| check 3 | pass | `npm run build`: exit 0 |
| check 4 | pass | `npm run format:check`: `All matched files use Prettier code style!` |
| check 5 | pass | `npm run lint`: exit 0 |
| check 6 | pass | The ASCII gate printed nothing (exit 0) |
| check 7 | pass | `sh bin/size-check.sh` exit 0; `sh bin/folder-check.sh` exit 0 |
| check 8 | pass | `npm run diagrams` run twice: md5 of `docs/diagrams/*` identical between runs. `layers.dot/.svg` and `layer-views.dot/.svg` were regenerated for the new imports. |
| check 9 | pass | `npm run build`, then `OCULUS_BROWSER_PORT=8841 npx playwright test contents.spec.ts sanitise.spec.ts system.spec.ts tinted.spec.ts`: `31 passed` |
| check 10 | pass on its own count | `node bin/revert-check.mjs <10 files>`: `89 reverts, 0 unproven, 29 unchecked`, exit=1. The exit 1 comes from the 29 unchecked cases, which are cases on main that never had a revert (listed under Limitations). Every new or changed case is red under its revert. |
| check 11 | pass | `ls -d $TMPDIR/oculus-* \| wc -l`: 0 before and 0 after |

## What changed, with the revert that proves each

- **`src/lib/server/content/docs.ts:250-275`** (`renderMarkdown`): one `new Marked(...extensions)` built from:
  - `gfmHeadingId()`;
  - a `paragraph` renderer that returns a per-call `<!--toc-<uuid>-->` mark when the paragraph's trimmed text is `[TOC]`, and `false` otherwise;
  - a `postprocess` hook that replaces every mark with `tocList(getHeadingList())`;
  - `figures(base)` (`:281-297`, the former image renderer), added only when there is a folder.

  `tocList` (`:318-351`) nests the entries by level. Each entry's words are marked's rendered heading text with its tags removed by `TAG` (`:309`), so they stay escaped. A heading with no words gets no entry, and no heading at all gives the empty string.

  Reverts in markdown.test.ts, all red: `:260` delete (ids); `:260` a non-unique heading renderer (unique ids); `:260 globalSlugs` (ids restart per document); `:333 else if (false)` (nesting); `:340` delete (a jump of two levels nests once, and a heading coming back takes that list); `:269 split(TOC_MARK)` (fenced block); `:264 includes` (code span and longer paragraph); `:264 said ===` (surrounding whitespace); `:325` delete (no headings); `:324 filter(() => true)` (a heading with no words); `:269 replace(mark` (two `[TOC]`); `:323` unescape and `:309 /$^/` (escaping and inline markup); `:309 /<[^>]*>/` (a quoted `>` inside a tag); `:275` two variants (with and without a folder).

- **`src/lib/views/shared/prose/Markdown.svelte:36-79`**: `jump` on the `.doc` div. For a link whose href starts with `#` it:
  - calls `preventDefault`;
  - finds the `[data-instance]` box around the link;
  - looks the id up there, as written or percent-decoded, compared as a string;
  - scrolls the nearest scrolling ancestor of the heading by the heading's offset from that ancestor's top.

  The `ul.toc` styles are at `:132-155`.

  Reverts in contents.spec.ts, all red: `:41 const box = document.body` (the manual in the other tab holds the same `the-keys` id); `:40` delete (the address changes; also the case for a fragment naming nothing); `:41 closest('.doc')` (the manual's heading sits in a later run of prose); `:44 const scroller = box` (project tab).

- **`src/lib/views/boards/project/Project.svelte`**: draws through the partial. Its own `.doc` styles, its `sanitise` import and its `.failed` rule are gone.

  Revert in `tests/views/whole/sanitise.test.ts`: `Project.svelte:211` and `Markdown.svelte:92`, both red (this case is an audit over source text).

- **Tests changed**:
  - `docs.test.ts`: `<h1>` expectations now carry the id; every revert line was remapped by matching its content to the main checkout.
  - `help.test.ts:122`: revert moved to `docs.ts:275`.
  - `doc.test.ts`: `:84` and `:92`.
  - `tinted.spec.ts`: `:66` and `:95` now point at `Markdown.svelte:194`.
  - `type-scale.test.ts`: Project's roles.
  - `tests/browser/helpers/rail.ts`: `boot(page, saved = STATUS_PAGE)` and a new `openProjectTab`. `system.spec.ts` and `sanitise.spec.ts` use them, which removes the two copies the duplication check found.

## Files with line counts

| File | Lines now | Lines changed |
|---|---|---|
| `src/lib/server/content/docs.ts` | 548 | +/-110 |
| `src/lib/views/shared/prose/Markdown.svelte` | 227 | 91 |
| `src/lib/views/boards/project/Project.svelte` | 323 | 115 |
| `HELP.md` | 285 | 4 |
| `package.json` | 53 | 1 |
| `package-lock.json` | | +19 |
| `tests/server/content/markdown.test.ts` | 152 | new |
| `tests/browser/views/contents.spec.ts` | 249 | new |
| `tests/browser/helpers/rail.ts` | 251 | 39 |
| `tests/browser/workbench/sanitise.spec.ts` | 154 | 11 |
| `tests/browser/workbench/system.spec.ts` | 599 | 12 |
| `tests/browser/shell/tinted.spec.ts` | 112 | 4 |
| `tests/routes/docs/docs.test.ts` | 468 | 76 |
| `tests/views/system/help.test.ts` | 307 | 2 |
| `tests/views/sources/doc.test.ts` | 189 | 4 |
| `tests/views/whole/sanitise.test.ts` | 106 | 15 |
| `tests/views/whole/type-scale.test.ts` | 342 | 3 |
| `docs/diagrams/layers.dot`, `.svg` and `layer-views.dot`, `.svg` | | regenerated |

`docs/diagrams/` is outside the brief's path list, but the brief's check 8 requires regenerating it.

## Judgment calls (each reversible)

1. **Scroll target.** The press scrolls the nearest scrolling ancestor of the heading. In the doc and help views that is the `data-instance` box. In the project view it is the Pane's `[data-scroll]` body, because `.project` (`Project.svelte:238-242`) has no overflow and the body (`Pane.svelte:103-110`) is what scrolls. I did not change the project tab's own scroll container. Doing so would have moved its scrollbar and the keyboard's scroll target.
2. **New spec's location.** The browser cases are in a new `tests/browser/views/contents.spec.ts`. `tests/browser/workbench/` already holds 10 items, so a new file there would fail `bin/folder-check.sh`.
3. **Synthetic manual.** The manual case writes a synthetic HELP.md into the served engine copy and puts the original back at the end. In the real manual the heading after the diagrams is the last heading, and it cannot reach the box top: it stays 130 px short at 1280x480. The real manual's own `[TOC]` is still asserted in the hub-document case.
4. **Visible choices.** `HELP.md` itself opens with `[TOC]`. The list is a `ul.toc`, with no `<nav>`, so the sanitise profile is unchanged. A heading with no words gets no entry. A link whose fragment names nothing still has its default prevented.
5. **Project states.** The project's loading and failed lines now carry the class `note` instead of `failed`. The words are the same, and no test or spec reads the old class (grep).

## Visible changes, for the look on TEST

- **Doc view** of a hub document with `[TOC]` (for example `docs/HPC-UTwente-howto.md`): before, the literal text `[TOC]`. After, an indented list of accent links with no bullets. Pressing one brings the heading to the tab's top, and the address bar keeps no `#...`.
- **Help view**: a contents list after the first paragraph. Pressing "Running it and checking it" scrolls as far as the content allows (it cannot reach the top, see judgment call 3).
- **Project tab**, documents segment: the document is now drawn by the partial, which changes three things:
  - a wide table scrolls inside its own box;
  - images are capped at the width;
  - over a wallpaper a `pre` block is transparent instead of carrying its own blurred chip.

  Code spans are unchanged.

## Limitations and findings

- **Page-level id collision.** A heading id can equal an id elsewhere in the page. `src/lib/ui/menu/KeySheet.svelte:20-22` uses `aria-labelledby="key-sheet-title"`, and a document heading named "Key sheet title" would come first in the tree. Raw HTML ids in documents could already do this. The fix is a unique id in KeySheet (for example `$props.id()`), which is outside this step's paths and is not done.
- **Library heading id.** The library's slug for raw inline HTML carrying a quoted `>` reads `bkept-words`. The list follows whatever id the heading carries, so the link still works.
- **Source preview.** The source tab's Markdown preview (`Preview.svelte`, through `blockMarkdown`) gives headings no ids and draws `[TOC]` as text. That follows item 1's rule that other readers of `marked` stay unchanged.
- **Unchecked cases.** The 29 unchecked cases in the revert-check are cases on main that carry no revert directive, in files I touched (help.test, sanitise.test, type-scale.test, tinted.spec, sanitise.spec, system.spec). The seven sanitise.spec cases, plus the three that open the Help view to scroll or not ("the manual is drawn from the file beside DESIGN.md", "a view that draws its own text tints its box and a board leaves it clear", "a hub document opens from its group in the catalogue"), now run through the changed `boot` or `openProjectTab` helpers. They pass (31 passed), but none of them has its own revert.


# Repair round 1

Everything in the brief and in repair round 1 is done. The only thing left open is R1, which is Axel's decision.

Open items (state file, verbatim):
- R1, where a tree row's status letter and controls sit (raised 2026-09-26 at X3b's landing, seen on the TEST page). In the Repositories view, as in the Files view, a row's hover controls and its status letter (`M`, `U`, `A`) follow the path, so the letters of a list sit at a different place on every row. VS Code puts them at the row's right edge, one column down the list. `src/lib/ui/tree/TreeItem.svelte:270-276` keeps the name to its own width on purpose: Q59's orchestrator, not Axel, decided that the controls and counts should sit beside the name in a wide pane (`agents/reviews/Q59-report.md:72`). That decision now clashes with Axel's standing demand that VS Code surfaces match VS Code. Options: (a) the name takes the free width, so every row's controls and letter sit at the right edge as in VS Code's Source Control and Explorer, in every view that draws a tree row; the change is `.main { flex: 1 1 auto }` and a browser case; (b) keep the controls beside the name. Recommended (a): it is what VS Code does, a column of letters can be read down the list, and a count or letter a pane's width from its name is what VS Code accepts too. (b) is the lazy option.

All paths below are relative to /Users/axelfaes/workspace/research-hub/.agents/worktrees/Q78/tools/oculus.

## Findings, one row each

| # | State | Where | Revert that proves it |
|---|---|---|---|
| 1 | DONE | `src/lib/data/prose/markdown.ts:24` sets `HEADING_PREFIX = 'user-content-'`, and line 117 passes it as `gfmHeadingId({ prefix: HEADING_PREFIX })`. `Markdown.svelte:72` matches the fragment as written, percent-decoded, and each with the prefix | `contents.spec.ts:278` `markdown.ts:24 => export const HEADING_PREFIX = '';` and `:279` `Markdown.svelte:72 => const wanted = plain;` (case "Method", pressed through the `[TOC]` list and through a hand-written `#method` link). `markdown.test.ts` has three reverts on line 117 and one on line 24 |
| 2 | DONE | `Markdown.svelte:113` `class:surfaced={surface}`. `:226` `:global(body.wall) .doc.surfaced :global(pre)` gives a pre block a color-mix surface and a backdrop blur. `surface` defaults to true (the project view); Doc.svelte:111, Help.svelte:60 and :71, and Preview.svelte:58 pass `surface={false}` | `tinted.spec.ts:138` `Markdown.svelte:113 => <div class="doc" onclick={jump}>` and `:139` `Markdown.svelte:226 => :global(body.wall) .doc :global(pre) {`. The case asserts that the project pre has a non-transparent fill and a filter, and that the hub doc pre has fill 0 and no filter |
| 3 | DONE | New shared module `src/lib/data/prose/markdown.ts`, which holds the heading ids, the `[TOC]` mark, `tocList` and `renderDocument`. `docs.ts:247` and `html.ts:332` (`blockMarkdown`) both use it. One test file: `tests/data/prose/markdown.test.ts` (the old `tests/server/content/markdown.test.ts` is deleted) | `contents.spec.ts:357` `html.ts:332 => return sanitise(marked.parse(text, { async: false }));` (a `[TOC]` entry pressed in the source tab's preview). The same revert is on `source.test.ts:330/347/366` and `markdown.test.ts:181` |
| 4 | DONE (no change) | `HELP.md:5` `[TOC]` kept | n/a |
| 5 | DONE | `tests/views/whole/sanitise.test.ts:79` is retitled "audits that the project tab draws its document through the prose partial's sanitised draw", and its line in `tests/checks/tree/allow-audits.txt` is removed | The DOM proof is `tests/browser/workbench/sanitise.spec.ts:67` `Markdown.svelte:115 => {@html doc.html}`, proven red by revert-check |
| 6 | DONE | `markdown.ts:47`: the tag-stripping RegExp is a literal inside `wordsOf`. There is no file-scope global RegExp; `TAG` is removed from docs.ts | `markdown.test.ts`, three reverts on line 47 |
| 7 | DONE | `Markdown.svelte` head comment (lines 1-25: doc, help, project and source preview; scroll box; prefix), the wallpaper comment above line 226, and `HELP.md` about line 136 (preview, `user-content-` prefix, headings with words, `#method`) | Comments only, so no revert applies |
| 8 | DONE | `Markdown.svelte:94` `const limit = box.closest('[data-scroll]') ?? box;`. `scrollerOf` returns null at the limit, and `jump` does nothing on null | `contents.spec.ts:308` `Markdown.svelte:94 => const limit = document.documentElement;` (case "a document too short to scroll scrolls nothing of the shell around its pane": the `[data-pane]` ancestor is made to overflow, and the case asserts that no ancestor scrolled and that the URL is unchanged) |
| 9 | DONE | `docs.ts:109` `export const PROCESS_TAG = randomUUID();`. `docs.ts:121` puts it into the entity tag | `docs.test.ts:411` `docs.ts:121 => return stat.isFile() ? \`"${String(stat.size)}-${String(stat.mtimeMs)}"\` : '';` (case "renders again for a tag an earlier server process answered with, the file unchanged"). Also `docs.test.ts:386` `=> return '';` |
| 10 | DONE | The 46 unchecked cases reported by revert-check are cases this round did not change. No directive was added to them | n/a |

## Checks

| Check | State | Output |
|---|---|---|
| vitest | DONE | `Test Files  340 passed (340)` / `Tests  5332 passed (5332)`. After the last comment-only directive remaps, `tests/checks` was re-run: `Tests  371 passed (371)` |
| npm run check | DONE | `COMPLETED 1507 FILES 0 ERRORS 0 WARNINGS 0 FILES_WITH_PROBLEMS` |
| npm run build | DONE | exit 0 (`build=0`) |
| format:check | DONE | `All matched files use Prettier code style!` |
| lint | DONE | `eslint .` finished with no output |
| ASCII gate (spec.md:85 perl form) | DONE | printed nothing |
| size-check / folder-check | DONE | `size=0`, `folder=0` |
| diagrams twice | DONE | both runs hash `fadf85e701831d9fd39734654439aaeb2eeb2897` |
| playwright (port 8841: contents, tinted, sanitise, system specs) | DONE | `35 passed (31.3s)` |
| revert-check (the 11 changed test files plus order.ts, order.test.ts, boundaries.test.ts, rail.ts) | DONE | `135 reverts, 0 unproven, 46 unchecked` |
| $TMPDIR/oculus-* count | DONE | 0 before, 0 after |

## Files (line counts from wc -l)
- New: `src/lib/data/prose/markdown.ts` 119, `tests/data/prose/markdown.test.ts` 188.
- Deleted: `tests/server/content/markdown.test.ts`.
- Changed:
  - `src/lib/server/content/docs.ts` 465
  - `src/lib/ui/html.ts` 333
  - `src/lib/views/shared/prose/Markdown.svelte` 257
  - `src/lib/views/boards/project/Project.svelte` 323
  - `src/lib/views/sources/doc/Doc.svelte` 129
  - `src/lib/views/system/help/Help.svelte` 90
  - `src/lib/views/sources/source/Preview.svelte` 78
  - `HELP.md` 285
  - `DESIGN.md` 319
  - `tests/browser/views/contents.spec.ts` 378
  - `tests/routes/docs/docs.test.ts` 497
  - `tests/views/system/help.test.ts` 307
  - `tests/views/sources/doc.test.ts` 189
  - `tests/views/sources/source.test.ts` 553
  - `tests/browser/shell/tinted.spec.ts` 162
  - `tests/views/whole/sanitise.test.ts` 106
  - `tests/views/whole/type-scale.test.ts` 342
  - `tests/browser/workbench/sanitise.spec.ts` 155
  - `tests/browser/workbench/system.spec.ts` 599
  - `tests/browser/helpers/rail.ts` 251
  - `tests/checks/imports/order.ts` 187
  - `tests/checks/imports/order.test.ts` (directive line numbers only)
  - `tests/checks/tree/boundaries.test.ts` 600
  - `tests/checks/tree/allow-audits.txt` 122
  - `docs/diagrams/*` (regenerated)

## Judgment calls
- **Where the shared module lives.** It is `src/lib/data/prose/markdown.ts`, in a new folder, because `data/helpers` already holds the 10-item folder maximum. The layer rules needed three registrations:
  - `boundaries.test.ts` ALLOWED: the ui row gains `data/prose/markdown`, with a comment saying why;
  - the DESIGN.md Boundaries table: the same row;
  - `order.ts`: `data/prose` in the data folder order.
  These paths are outside the step's original list, as finding 3 allows.
- **Which way the `surface` prop points.** The `tinted.test.ts` audit reads `surface={false}` as "this partial's wallpaper surface is taken away". So the default (true) paints the pre surface, and the three tinted views (Doc, Help, Preview) pass `surface={false}`. Their look is unchanged.
- **Code spans stay clear.** In the project view only `pre` gets a surface back. Inline code spans stay transparent, as the existing `tinted.spec` cases at `Markdown.svelte:217` require.
- **Finding 6 wording.** "replaceAll with a non-global pattern" cannot be done: `String.prototype.replaceAll` throws on a non-global RegExp. Building the pattern where it is used was taken instead.
- **Slide narratives.** A slide's narrative (`views/academic/present/markup.ts` through `blockMarkdown`) now also carries prefixed heading ids and draws `[TOC]`. It is drawn outside the prose partial, so a press on one of its `#` links is not handled by `jump`.
- **KeySheet clash ended.** With the `user-content-` prefix, no heading id can equal `KeySheet.svelte`'s `key-sheet-title`.
- **Directive line numbers.** Existing revert directives that name `html.ts`, `docs.ts`, `boundaries.test.ts` and `order.ts` were renumbered to follow the inserted lines. Each renumbered line was checked to hold the same text as main's original line. All of them are proven: 0 unproven.

## Visible changes, before and after
- A heading id was `method` and is now `user-content-method`. A hand-written `#method` link still reaches it.
- A project document over a wallpaper: a fenced block had no fill and no blur, and now has a blurred panel surface.
- The source tab's Markdown preview: `[TOC]` was literal text and `#` links did nothing. It now draws the list and scrolls the preview to the heading.
- After a server restart, a page open from before the restart now gets the new HTML (the old server's tag no longer gets a 304).

## Wrong in the brief
Only finding 6's `replaceAll` wording, explained above.

## Next
The orchestrator reads this diff and refutes or lands it. R1 waits for Axel's ruling.
