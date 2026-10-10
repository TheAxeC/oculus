# Brief check of D58 (brief `tools/oculus/.scratch/migration/agents/briefs/D58.md`, main at e88122c51)

`plan.md` has no Goal section (`grep -n -i '^#.*goal\|^goal' plan.md` prints nothing); the goal is taken from D58's step line (plan.md:734) and the brief's line 25. Nothing was edited; no server, page or git write was run.

## Names

Command: `grep -rnF --exclude-dir=node_modules --exclude=local.yml --exclude-dir=.agents --exclude-dir=secrets --exclude-dir=.scratch --exclude-dir=.git "<name>" .` for renderHubDoc, renderManual, handleDocs, MANUAL_PARAM, DocAnswer, ownScope, `hubPath(`, docState, followDoc, hubDocument, doc.unlisted, engineDocument, engineAt, 'Apps guide', apps.md, `help` arrangement, G2; plus `DocState` and `manual:` under src and tests.

1. `src/lib/views/shared/prose/RenderedMarkdown.svelte:68-77` builds a `DocState` literal (`... parts: [], path: '', manual: ''`) passed to Markdown's `doc`. Item 2 adds `engine` and `engineAt`; if they become required fields of `DocState` this file fails the type check. Made false: yes. Add it to the write list or make the fields optional.
2. `src/lib/views/shared/prose/jump.ts:7-9` (head comment) and `:30-35` (`LinkFollower`: "relative to the hub", "told the empty path when the link leaves the hub"): false for an engine document. Made false: yes; spec:68, not in the write list.
3. `docs/DATA-MAP.md:220` ("Hub document | opened from the Help group | one Markdown document of the `docs:` list ..."): the doc view also draws engine documents after the step. Made false: yes; the write list holds only line 234.
4. `tools/oculus/DESIGN.md:495`: still true.
5. `tools/oculus/HELP.md:3`, `DESIGN.md:82`, `DESIGN.md:491`: still true.
6. `src/routes/api/(docs)/docs/+server.ts:7,14`: still true.
7. `src/lib/shell/Workbench.svelte:57,213`, `src/lib/views/system/workbench/Catalogue.svelte:44,228` (docState of a `docs:` entry): still true.
8. `src/lib/views/boards/entry/Entry.svelte:70,125` (hubDocument, no `follow`): still true.
9. `tests/checks/source/history.test.ts:4-5,24`: still true.
10. `tests/checks/config/config-folder.test.ts:393`: still true.
11. G2 in test titles (lint-route, writing-fix, edits): none made false.
12. Substring hits only: `followDocuments` (`lsp/held/requests/links.ts:92,266`), `hubPath` of `data/sources/manifests.ts:37`.
13. engineDocument and engineAt: no hits, no collision.
14. The doc comments of `MANUAL` (docs.ts:627) and `renderManual` (docs.ts:632-634) become false; item 1 names only the head comment.

## The step line

Each part of the step line (plan.md:734) and of Z768 (a) (plan.md:1648) maps to items 1 to 8. Parts with no requirement: none. Departure: item 6 restates only a saved tab "whose path the `docs:` list does not hold", narrower than Z768, and not named under "Decisions taken"; on a hub whose `docs:` list names a file inside the engine, the catalogue opens a hub tab and the Help page an engine tab, two tabs for one file.

## Premises

1 to 10: every "What is on the tree" command rerun on main at e88122c51 holds (the shape of docs.svelte.ts is at 128-136, the brief says 130-136).

11. Decision 2 is false with the engine outside the hub: `src/lib/server/files/files.ts:362-363` serves the engine only as root `engine` = `configDir(engine)`, so item 1 opens every `.md` file of the engine (`node_modules/`, `.scratch/` included) where today only HELP.md is opened.
12. Brief:117 cites a filter the rules file does not name (`grep -n -i 'filter\|pipe' agents/spec.md` prints nothing).
13. Verify 1's "Its ASCII gate covers the files the step changes" is false: `ASCII_GATE` (`tests/tiers/run.mjs:25`) runs over `find src tests bin config`; HELP.md, DESIGN.md, `docs/DATA-MAP.md`, `.oculus/config/layout.yml` and `guarded.md` are not covered.
14. The brief names no worktree, no base copy, no base `unused-exports` output and no `utils/folder-check.sh` run (spec:32, :85, :46; D57.md:19, :187).

## Cases and checks

1. Case 5 and item 9: the refusal rows pass on the unchanged tree, where every `engine=` request falls to `renderDoc(into, '', '')` and 404 "not a document this route serves: "; only the served row fails. Fix: each row asserts the message naming its reason.
2. Case 10's first half checks nothing: the guide holds no diagram.
3. Case 3 omits `engineAt`, which item 6 reads from the manual's answer.
4. Brief:59's "the landing's look shows them on a scratch oculus" goes against spec:58 and the `look:` key; cases 1 and 6 need the engine outside the hub, which only a scratch oculus gives.
5. Rule clash: the write list names `guarded.md` (G2) and the report under `.scratch/`; spec:35 says a builder never edits anything under `tools/oculus/.scratch/`.
6. G2's sentence becomes false for the engine read with the engine outside the hub; a changed guarantee goes to Axel (spec:57).
7. G54's test (`tests/checks/config/arrangements.test.ts`, 'the %s page parses and names only views the catalogue knows') is not in the verify list or the quick tier, while item 5 changes `config/layout.yml`.
8. Item 1 does not say where the new 404 words come from (literal English as docs.ts:497-506, or the catalog).
9. Case 10's comparison is a reference run of an unchanged read: acceptable.

## The question

1. Case 1: yes as the builder checks it; only the look shows the goal, and the case does not say where the engine sits.
2. Cases 2, 3, 4, 10: yes; route prerequisites, not proof.
3. Case 5: yes (Cases 1).
4. Cases 6, 7, 8: yes by reading; the look is the proof, over both engine positions.
5. Case 9: preserved behaviour.
6. The step line: no verify command exercises the doc view drawing an engine tab.
7. Items 1, 2: yes alone.
8. Item 3: no.
9. Item 4: no for the manual's links; two tabs possible for hub links (Implied 2, 3).
10. Item 5: yes alone, no with item 3.
11. Item 6: yes for a hub whose `docs:` names an engine file.
12. Items 7, 8, 9: supporting.
13. After item 7 no hub lists the guide in the Views catalogue; accepted by Z768 but not named as a visible change.

## Implied inputs

1. An engine folder reached through a symlink inside the hub: `hubPath` compares real paths (docs.ts:407-412), so `engineAt` would be `''`; the brief must say which path `engineAt` is.
2. A hub `docs:` list naming a file inside `engineAt`: two tabs (item 6's narrowing).
3. A hub document's link to `tools/oculus/HELP.md`: item 4's hub rule opens an engine tab of HELP.md; expected the Help view.
4. An engine document opened by a link with no label: the title falls back to "Hub document" (Doc.svelte:88, doc.yml:15); expected the document's name.
5. The manual's answer pending or failed when item 6 needs `engineAt`: the in-flight path is not stated (spec:69).
6. An engine document's link climbing out to a hub document: opens a tab today with the engine inside the hub, nothing under item 4.
7. `.md` under `node_modules/` or `.scratch/` with the engine outside the hub: served under decision 2.
8. `engine=Docs/Apps.md` on a case-folding file system: a second tab; `.MD` refused.
9. `engine=docs\apps.md`: 404 on macOS.
10. Percent-encoded climbing path: decoded by URLSearchParams into case 5's first row.
11. A folder ending in `.md`: expected 404.
12. A fragment-only link in an engine document: unchanged.
13. An engine tab when the engine moves: keeps drawing.
14. A hub path beginning `engine:`: collides with an engine tab id; no hub has one.
15. A request with both `manual` and `engine`, or `hub` and `engine`: precedence not named.

## ADRs

`ls docs/adr tools/oculus/docs/adr`: no such directory for both; `grep -n -i adr` of the state file and `.agents/plan.yaml` prints nothing; `find . -path ./node_modules -prune -o -type d -iname 'adr*' -print` prints nothing. No ADRs.

## Dictated text

1. brief:35, the test title: holds; its table also refuses an empty path and a missing file, which the title does not name.
2. brief:31, the arrangement entry: holds (yaml 2.9 parses it to `{"id":"engine:docs/apps.md","path":"docs/apps.md","engine":true,"label":"Apps guide"}`).
3. brief:46, the saved state: holds.
4. brief:35, "(the engine read)": holds; G2's clash is Cases 6.
5. brief:28, `engine: boolean`, `engineAt`, `engineDocument(path)`: holds.
6. brief:29, `engine:<path>`: holds.
7. brief:27, `engine=<path>`: holds.
8. brief:35, the expected values: holds.
9. brief:137, "Everything in the brief is done": holds.
10. brief:117, "the filter the rules file names": names nothing (Premises 12).
11. brief:142, the terms line: holds.

## Declined to judge

1. The page behaviour of cases 1 and 6 to 8: no page or server may be run here.
2. Whether `npm run test:quick` passes: no worktree.
3. The wording of the new 404 lines and doc.yml text: not written yet.
4. The state file's open items.

Usage: a7c19a6a67f61ce16, claude-opus-5-5, 235,846 tokens, 62 tool uses, 9.9 min.

## Closed

- Names 1: `RenderedMarkdown.svelte` added to the write list; item 2 gives its literal `engine: false` and `engineAt: ''`.
- Names 2: `jump.ts` added to the write list; item 4 says its head comment and `LinkFollower`'s comments name the linking document's own space.
- Names 3: `docs/DATA-MAP.md` line 220 added to the write list and to item 8.
- Names 14: item 1 names the doc comments of `MANUAL` and `renderManual`.
- The step line, item 6's narrowing: item 6 restates every non-engine doc tab whose path lies inside `engineAt`, saved or opened from a `docs:` entry, as Z768 says; case 11 added.
- Premises 11: decision 2 rewritten; item 1 refuses `node_modules` and dot-folder segments; G2's exception raised and closed as Z769.
- Premises 12: the filter phrase removed from "Verify before you report".
- Premises 13: check 3b added (`LC_ALL=C grep -n '[^ -~]'` over every touched file, the Markdown and the hub's layer included); check 1 says what the ASCII gate covers.
- Premises 14: the worktree, the base copy with `unused-exports.txt`, and check 3c (`folder-check.sh`, `wc -l`, `unused-exports.sh`) added.
- Cases 1: item 9's rows assert the message naming each reason, so each refusal row fails on the unchanged tree.
- Cases 2: case 10's first half removed.
- Cases 3: case 3 gives `engineAt: "tools/oculus"`.
- Cases 4: the look is named per case: case 7 on this hub, cases 1, 6, 8 and 11 on a scratch oculus, since Axel's server shows neither another hub nor an engine outside the hub.
- Cases 5: `guarded.md` removed from the write list; item 9 and the Report's "Doc text" section give G2's three lines for the orchestrator to apply at landing; the report path stays, as every builder writes its report there.
- Cases 6: Z769 (a), G2's exception for the engine's Markdown documents.
- Cases 7: G54 named in the reading list and its test added to check 3.
- Cases 8: decision 4, literal English as the route's other refusals.
- The question 13: decision 6 and item 8 name the guide leaving the Views catalogue.
- Implied 1: item 2 defines `engineAt` on the configured paths, then on the real paths.
- Implied 2: item 6 and case 11.
- Implied 3: item 4 checks `manual` first in the hub's space; case 7 gains the HELP.md link.
- Implied 4: item 3 titles an unlabelled engine tab by the path's last name.
- Implied 5: item 6 states the pending and failed manual answer.
- Implied 6: item 4 reads a climbing link in the hub at `engineAt`, nothing when it is empty.
- Implied 7: item 1's refusal of `node_modules` and dot folders; case 5 gains both.
- Implied 8: decision 5.
- Implied 11: item 1 refuses a folder; case 5 gains it.
- Implied 15: item 1 names the precedence.
- Implied 9, 10, 12, 13, 14: no change needed, as the report says.
