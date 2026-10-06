# Q125 report: handed back at the first run, no document or code changed

NOT done: everything in "What to build" items 1 to 11. The first run of the cases on the unchanged tree finds that the brief's rules for case 8 and item 1 have no destination for about 100,000 characters of today's HELP.md, so the step stops there, before any change to a document or to code, and hands back as the brief says. The one file written besides this report is the new test `tests/checks/config/arrangements.test.ts` (G54, added to the write list by the coordinator); the Help page's row fails on the unchanged tree, as expected.

## Open items of the state file

`grep -n "^## Open items" -A4 orchestrator-state.md` on the main checkout prints the heading, the line "An entry leaves this list for the closed log the moment Axel rules on it...", and no entry under it. The list holds no entry.

## The case the brief's rules get wrong: case 8 with item 1

The rule (item 1, "What to build"): every sentence that describes how a feature works inside, every list of options, every refusal and edge case "moves to the guide that owns it, or to DESIGN.md when it is a decision, or is dropped when DESIGN.md or a guide already says it", and "nothing a reader needs is lost". Case 8 asks for each removed run's destination: "a guide section, or the head comment's file:line that already says it". The brief names three guides: `docs/configuration.md`, `docs/source-control.md` and (only when E4g is on the base, which it is not) `docs/apps.md`.

The result, from `awk '/^#/{...}' HELP.md` (character counts per section, base copy equal to the worktree's) and the views table's cell lengths (`awk 'NR>=118&&NR<=166{print length($0)}' HELP.md`):

| HELP.md part | Characters | Destination the brief names |
|---|---|---|
| The window, the rail, pages and the pane tree (`:11-54`) | 27,474 | none; HELP keeps "the window" in short form, so about 24,000 of detail (tab strips, right-click menus, floats, pinned tabs, the rail's update tray with its refusal sentences, the catalogue's behaviour) has no guide |
| The keys table (`:58-104`) | 10,712 | kept whole in HELP.md |
| The paragraphs after the key table (`:106-112`: focus and unsaved-text rules, the palette and its commands, the key sheet, the status bar and notifications) | 7,156 | none |
| The views table (`:118-166`, 49 rows, 48,016 characters; Files row 13,467, Terminal row 8,868, Settings row 4,154, Repositories row 3,314) | 48,016 | one sentence per row stays; about 45,000 of row detail has no guide, except the Repositories row's detail, which belongs in `docs/source-control.md` but is outside "Source Control (`:222-271`) whole" |
| The paragraphs under the table (`:168-180`: file controls, the six views opened for something, LaTeX, source tab, preview tabs, editor options) | 11,185 | none |
| Searching the files (`:182-194`) | 8,099 | HELP keeps "a short section of what the reader does"; the toggles, replace rules, refusals and limits have no guide |
| Project commands (`:196-208`) | 7,054 | same: no guide for sources, placeholders, approval, the result |
| Apps (`:210-220`) | 3,821 | `docs/apps.md` only when E4g is on the base; it is not, so it stays in HELP.md |
| Source Control (`:222-271`) | 15,906 (`HELP.md:222-271`) | `docs/source-control.md` whole |
| Worktrees and the merge back (`:272-281`) | 3,410 | none named; HELP keeps "worktrees and the merge back" as a short section |
| The configuration, where the data comes from (`:282-328`) | 19,927 | `docs/configuration.md`, and DESIGN.md for what the server reads and writes |
| How the code fits together, Running it (`:329-375`) | 9,495 | DESIGN.md and README.md |

Total of HELP.md: 165,450 characters in 252 non-blank lines (`awk 'length($0)>0 {n++; t+=length($0)} END{print n, t}' HELP.md`). The parts with no named destination add up to about 100,000 characters (24,000 + 7,156 + 45,000 + 11,185 + about 6,500 of Search and Project commands detail + about 3,000 of worktree detail + the Apps text at the base). Of those, the only available routes are "dropped when DESIGN.md or a guide already says it", and DESIGN.md is itself to be cut to decisions in this step, with its step-by-step behaviour going "to the guide that owns it, or dropped where the code's head comment already says it". The same behaviour is told in HELP.md and in DESIGN.md "Decisions taken" (for instance the Files view operations in DESIGN.md `:400`, the Repositories view at `:408`, tabs, pages and panes at `:431`, the status bar at `:434`), and each document would be cut because the other says it. What survives for a user is a one-sentence row per view and the key table, and the behaviour lives only in code comments, which a user does not read. That is a loss of facts a reader needs, which the brief forbids, so a builder cannot do item 1 and case 8 with the paths and guides the brief lists.

Options for the orchestrator's ruling (decision belongs to Axel because it adds user-visible guides and Help tabs):

1. Add guides under `docs/`, each owning one concern, to the write list, to `config/layout.yml`'s `docs:` list and to the Help page's tabs (they take chords h8 onward only while the Help group has fewer than ten entries; beyond the ninth an entry has no chord, `catalogue.ts` `keyOf`). A split that follows the owner of each part: a window guide (the rail, pages, pane tree, tabs, menus, floats, the palette, the status bar, the focus and unsaved-text rules, the key paragraphs); a views guide (one section per view, from today's table cells and the paragraphs under it); a files and search guide (the Files view's detail, Searching the files); a terminals and commands guide (the Terminal row, Project commands); and `docs/source-control.md` taking the Repositories row and Worktrees and the merge back as its sections. HELP.md then becomes the short guide the brief describes, each moved paragraph named in case 8's table with its guide section. Recommended: it is the only option that keeps every fact and ends the growth of HELP.md.
2. Keep that detail in HELP.md. It satisfies "nothing lost" and leaves HELP.md at about 100,000 characters, which does not do what Z636 asks; this is the lazy option for the HELP half.
3. Drop the detail where DESIGN.md or head comments say it. It meets the letter of case 8 and loses user-facing facts; this is the lazy option for the facts.

If option 1 is ruled, the builder needs these paths added to the write list: the new guides, `config/layout.yml` lines 92-98 and the `docs:` list (already listed), and `config/text/app.yml` line 12 (already listed). DESIGN.md's rewrite then also has a home for each step-by-step run that is user-visible, instead of relying on head comments alone.

## First run of every case on the unchanged tree

Commands run from `tools/oculus` of the worktree; scratch harnesses were run from the session scratchpad and removed.

1. Repositories view, one row or short paragraph with a link to `docs/source-control.md`: unmet. `awk 'NR==131{print length($0)}' HELP.md` prints 3314: the row is one 3,314-character cell, and `ls docs` prints only `diagrams`, so there is no guide to link to.
2. Staging part of a file in `docs/source-control.md`: unmet for the guide (absent). The text exists at `HELP.md:230` ("Diffs, and staging part of a file", 3,040 characters).
3. `local.yml`'s `port` in `docs/configuration.md`: unmet for the guide (absent). The text exists at `HELP.md:305` and `README.md:13`; HELP.md links nowhere.
4. Every command in README.md, each said once: unmet. `grep -n "npm run lint\|test:slow" README.md HELP.md` prints `README.md:17` (test:slow, no lint) and `HELP.md:373`, `HELP.md:375` (test:slow and lint); `npm run lint` is in HELP.md only, and the other commands are said in both files (`README.md:17`, `HELP.md:371-375`).
5. The one-socket decision in a few sentences, no controls: met at the base. `DESIGN.md:116` ("**The socket.**", 6 sentences, channel names, no controls) and `DESIGN.md:365` ("Live data: one WebSocket with channels...", 217 characters).
6. Key table first columns: the new table does not exist yet. The old table (`HELP.md:58-104`) has 45 rows; the `h1-h6` row is `HELP.md:82`. The diff expected after the change is empty but for that row.
7. Views table against the catalogue: `grep -rh -A4 "export const registration" src/lib/views --include='*.svelte'` read for `id: '...'` gives 50 ids over 55 files, plus the collection ids from `config/sources.yml`; compared with the first column of `HELP.md:118-166` (49 rows): every listed view has a row. Twelve ids have no row: `customization`, `deposit`, `doc`, `document`, `editor`, `file`, `latex`, `note`, `person`, `project`, `slides`, `source`, each `listed: false` (`grep -c "listed: false"` on the file of each prints 1 for all twelve). Nine of the twelve are mentioned in HELP.md (`grep -c` of the backticked id prints 1 or 2); `customization`, `note` and `slides` have no backticked mention, and the only trace is the phrase "a note, a customization file" in the list of views opened for something at `HELP.md:35`, with no description of what each view is for.
8. Paragraph table: not made; see the case above. Sizes for the table: HELP.md 165,450 characters in 252 non-blank lines, DESIGN.md 348,946 characters in 312 non-blank lines; `awk 'length>1500' DESIGN.md | wc -l` prints 76; sections of DESIGN.md by size: Server 55,970, Apps added while oculus runs 67,840, Decisions taken 171,207 (74 items).
9. Doc view on DESIGN.md as diagram parts (a node run of `renderHubDoc` and `renderManual` over a scratch hub under the scratchpad, engine at `<hub>/tools/oculus`): `DESIGN 200 []` with all nine `<img src="/api/file/hub/tools/oculus/docs/diagrams/...svg">` through the file route and no parts; a guide at `docs/guide.md` with `diagrams/layers.svg`: `[]` parts, the image through the file route; `docs/RESEARCH-APPROACH.md` with `../tools/figures/a.svg`: `<img src="/api/file/hub/tools/figures/a.svg">`, no parts; the manual: 14 parts, six diagram parts for the layers, one each for the channels and the writes. With the engine outside the hub: `DESIGN 404 the document is not inside the hub` and the same for the guide (a path outside the hub is refused before the engine is consulted, `escapes` in `server/content/docs.ts`), `RESEARCH 200` through the file route, the manual as before. So an engine outside the hub can serve neither document from the `docs:` list today; the post-change run over that setup can only show the hub's own documents drawn as now.
10. Images in a guide naming a file outside `docs/diagrams/`, an upper-case name, a missing name: the same scratch run on the guide gives, for `../secrets.svg`, `diagrams/Layers.svg`, `diagrams/nonesuch.svg` and `docs/diagrams/../x.svg`, file-route addresses (`/api/file/hub/tools/oculus/secrets.svg`, `.../docs/diagrams/Layers.svg`, `.../docs/diagrams/nonesuch.svg`, `.../docs/docs/x.svg`) and no part. The diagram route itself is unchanged by the step.
11. The Help group's keys: a vitest run of `railOrder`, `keyOf` and `docPick` of `catalogue.ts` over the unchanged `config/layout.yml` (a scratch config under the scratchpad) prints `CHORD h ["help","memories","doc:docs/RESEARCH-APPROACH.md","doc:docs/AGENT-APPROACH.md","doc:docs/HPC-UTwente-howto.md","doc:docs/DATA-MAP.md"]`, `Research approach h3`, `Agent approach h4`, `HPC how-to h5`, `Data map h6`, `help h1`, `memories h2`: h1 to h6, no guide, no Design.
12. `npx vitest run tests/checks/source/history.test.ts --reporter=verbose` on the unchanged tree: `Test Files 1 passed (1) / Tests 3 passed (3)`, the comment audit taking 26,544 ms against its 30,000 ms limit on a machine with load average 17 (`uptime`); an earlier run in the same load timed out at the limit. Over three documents (`const DOCS = ['HELP.md', 'DESIGN.md', 'README.md']` at `:21`).
13. A press on a relative `.md` link in the Help view: `jump.ts:28-35` returns at once unless the `href` starts with `#`, so the press falls through to the browser, which navigates the page itself away from the relative address; `Markdown.svelte:87` hands every click to `jump`; `html.ts:114` keeps a relative `href` and `markLinks` (`html.ts:153-158`) gives a target to outward schemes only. `grep -n "HELP.md#\|DESIGN.md#"` over `src config tests utils README.md DESIGN.md HELP.md` prints nothing, so no link into a moved HELP.md section exists.

G54, `tests/checks/config/arrangements.test.ts`, title "the arrangements of config/layout.yml > the %s page parses and names only views the catalogue knows" (one row per key of `arrangements:`: focus, sessions, projects, incoming, explorer, academic, pillars, references, present, help, views, apps), first run on the unchanged tree: `tests/checks/config/arrangements.test.ts > ... > the help page parses and names only views the catalogue knows` fails with `AssertionError: expected null not to be null` at `arrangements.test.ts:25`, and the other eleven rows pass (11 passed, 1 failed in that file). `npx prettier --check` and `npx eslint` on the file print no finding, and the ASCII gate over it exits 0.

## Files changed

`diff -rq ../../../Q125-base/tools/oculus .` (folders the base copy holds) prints `Only in ./tests/checks/config: arrangements.test.ts` and nothing else under `src`, `tests`, `utils` and `config` (the other `Only in .` lines are folders the base copy does not hold: `docs`, `.scratch`, `assets`, `demo` and the tooling files). `HELP.md`, `DESIGN.md` and `README.md` are unchanged. Line counts: `tests/checks/config/arrangements.test.ts` 32 lines (new); this report.

## Findings for the later build, whichever option is ruled

- The engine outside the hub (case 9 and 10 above): `docs:` entries are hub paths, so Design and every guide of an engine outside the hub 404; item 7's second run can only show hub documents drawn as now.
- Unlisted views `customization`, `note` and `slides` have no description in HELP.md (case 7); the new views guide or HELP.md's views section should carry them.
- The history audit's id pattern catches ids like "D23" and not "Q125", "PR1" or "Z643" (the brief says so); the new guides are written with no plan id regardless.
- The history audit's comment test takes 26.5 s of its 30 s limit under load average 17; adding guides to `DOCS` adds the small `documentHits` read only (357 ms at the base).
- The scratchpad folder holds a symlink `node_modules` to this worktree's `node_modules` (made for the scratch vitest config); it replaced any earlier entry of that name, which was not listed beforehand.

## Verification

Not run, because no change was made to documents or code: `npm run test:quick`, the five-file vitest line, `sh utils/folder-check.sh`, the ASCII gate over the whole tree, `wc -l` of the documents, `npm run diagrams`, `sh utils/unused-exports.sh`, the DESIGN.md name greps. NOT DONE rows: items 1 to 11 of "What to build", cases 1 to 13 after the change, the paragraph table of case 8, "Doc text".

## Doc text

Not written: it depends on the ruling above, since the rule (a step writes HELP.md only where what a user does changes; every other detail goes to DESIGN.md or the guide that owns it) names the guides.
