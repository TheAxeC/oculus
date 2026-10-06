# Q78 landing

## Open items

None. R1 was ruled by Axel (a) and is closed.

Booked, no ruling needed: 4 (Q72, Q79, O33, O32), plus one finding of this landing on Q81's line (one tooltip at a time).

## NOT DONE

Nothing of Q78's brief.

## What landed

Q78, a `[TOC]` line draws the document's table of contents, one commit on main (the commit that carries this file):

- `src/lib/data/prose/markdown.ts`, the one document rule: heading ids from `marked-gfm-heading-id` 4.1.4 under the `user-content-` prefix, and a paragraph that is exactly `[TOC]` replaced by the nested list of the document's headings. `renderMarkdown` (`server/content/docs.ts`) and `blockMarkdown` (`ui/html.ts`) both use it, so the doc view, the manual, a project's documents, the source tab's preview and a slide's narrative draw the list.
- `src/lib/views/shared/prose/jump.ts`: a press on a `#` link scrolls the nearest scrolling box around the heading inside the link's own view (`data-instance`), no further out than the pane's scrolling body, and never changes the page's address. `Markdown.svelte` and `present/parts/Words.svelte` both use it.
- The project view draws its documents through `Markdown.svelte`, with a surface under a fenced block over a wallpaper.
- A document's ETag carries the server process, so a page open across a server restart renders the new HTML once.

## Fixed at landing

1. R1 (a), Axel's ruling: a tree row's name takes the row's free width (`TreeItem.svelte:275`, `flex: 1 1 auto`), so a row's controls, count and status letter sit at the pane's right edge, one column down the list, in the Files, Repositories and every other tree view. New case in `views.spec.ts` comparing the right edges of two rows' controls, red with the change reverted; the "words open anywhere over the row" case now points at the row's own edge.
2. The round refutation's Spec 1 and Behaviour 1: a `#` link or `[TOC]` entry in a slide narrative took the browser default and changed the address. Before: the address gained `#user-content-...`. After: the press is handled as in every other drawn document. The handler moved from `Markdown.svelte` to `jump.ts`; new case in `present.spec.ts`, red with the handler taken off `Words.svelte`.
3. The round refutation's Standards 1 to 3: `docs.ts`'s head comment and `DESIGN.md`'s ETag sentence name the server process; `DESIGN.md`'s data layer list holds `prose/`.
4. Every directive whose target line moved in the landing fixes re-pointed by its target line's content, the ones on the moved handler to `jump.ts`.

## Found, booked

- `files.spec.ts:811` fails under the whole suite's load and passes alone: booked into Q77's item 6.
- Two tooltips open at once over a row action inside a tree row that carries its own words: a defect of the Tooltip primitive, booked on Q81's line (menus, tooltips and dialogs on bits-ui).

## Verification on main

- `land.sh Q78 fa7499f2` on main, then the whole check list (`checks.txt` in the orchestrator's scratchpad): `npm run check` `COMPLETED 1507 FILES 0 ERRORS 0 WARNINGS`; build exit 0; `format:check` clean; lint exit 0; ASCII gate 0 lines; size and folder checks exit 0; diagrams stable; `npm run test:browser` `464 passed`, 2 failed, both from the R1 change (fixed, then `views.spec.ts` `22 passed`); `npx vitest run` `5330 passed`, 2 failed on the 5 s timeout under load (`order.test.ts` "holds the data folders", `git-ops.test.ts` "routes each action..."), each file `50 passed` alone; these timeouts are Q77's item 6.
- After the slide fix: `npm run check` `COMPLETED 1508 FILES 0 ERRORS 0 WARNINGS`; lint exit 0; `format:check` clean; build exit 0; `npx vitest run tests/checks` 371 cases, the two diagram cases red until `npm run diagrams` regenerated for `jump.ts`, then `tests/checks/diagrams` `63 passed`; diagrams twice `ee5c7a7209298360cb306f263b4d2192caa71b22` both times; size and folder exit 0; ASCII gate 0 lines; the affected unit files `51 passed`; `present.spec.ts` `12 passed`, `contents.spec.ts`, `tinted.spec.ts` and `sanitise.spec.ts` passed with it (29 of 30 in the joint run, the one failure the present case's order effect, fixed by moving it ahead of the cases that save a selection). Every unit file that reads the moved modules or the views drawn through them (`tests/views/boards`, `sources`, `academic`, `whole`, `help.test.ts`, `html-sites.test.ts`): `30 passed`, `731 passed`. The whole browser suite once more: `466 passed`, 1 failed, `files.spec.ts:811` (the bookmarks read-again control detached and re-rendered until the 30 s timeout); alone `5 passed` with `--repeat-each 5`, and with `files.spec.ts` and `files-forms.spec.ts` `43 passed`. It is load-dependent and outside Q78's paths; booked into Q77's item 6, whose parallel runs raise that load.
- revert-check on main over every test file whose directives the landing added or re-pointed: `27 reverts, 0 unproven` (`present.spec.ts`, `contents.spec.ts`, `tinted.spec.ts`, `sanitise.spec.ts`, `sanitise.test.ts`, `doc.test.ts`), `63 reverts, 0 unproven` (`markdown.test.ts`, `docs.test.ts`, `help.test.ts`, `source.test.ts`), the moved present case again `1 reverts, 0 unproven`, and the R1 directives `3 reverts, 0 unproven` (`TreeItem.svelte:275`, `:219`, `:439`). The builder's own run covered the rest of Q78's directives (`135 reverts, 0 unproven`); `system.spec.ts` and `views.spec.ts`'s unmoved directives were not rerun at landing.
- `ls -d $TMPDIR/oculus-*`: none.
- Agents: `ListAgents` lists no agent of this session; Q78's builder and both reviewers are finished.

## The look

On the TEST page of the dev server on 8790, light theme; Q78 changes no theme.

- The Files view: a file row's hover controls (the bookmark star and open-as-tab) at the pane's right edge.
- `docs/HPC-UTwente-howto.md` in a source tab with its preview: the `[TOC]` line drawn as the nested contents list; a press on "6. Common failures & fixes" scrolled the preview so that heading sits at its top.
- The HPC how-to's tab replaced the preview tab that held `README.md`; `README.md` was opened again as the preview tab, the `docs` folder collapsed, the Config tab focused, and the page switched back to Info/more (`localStorage` `oculus.layout.v1` `current` reads `140df1b2-...`), as found.
- Not looked at: a project document's fenced block over a wallpaper, and the doc view and the manual (the same partial and handler as the preview); these are proven by `tinted.spec.ts` and `contents.spec.ts`.

## Next

Q77 alone (the verification tooling), then L7, Q89, Q79, Q80, then the queue of `plan.md`.
