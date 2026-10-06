# Step Q125 refuter report (on .agents/worktrees/Q125, base 02ac124ec)

A page this report cites is named with its section; a finding in code keeps its `file:line`. All commands were run from `tools/oculus` in the worktree unless stated. I changed no file. One scratch copy of my link checker went into the worktree by mistake and was deleted at once; `git status --short` afterwards lists the same 41 entries the builder left (30 modified or deleted, 11 untracked).

## Verification (rerun by the reviewer)

```
npm run test:quick
ok      ASCII gate (0.4 s)
ok      prettier (1.2 s): All matched files use Prettier code style!
ok      svelte-kit sync (1.6 s)
ok      eslint (17.2 s)
ok      svelte-check (17.0 s): 1791294097904 COMPLETED 390 FILES 0 ERRORS 0 WARNINGS 0 FILES_WITH_PROBLEMS
ok      vitest (18.8 s): Duration  16.03s (transform 34.72s, setup 0ms, import 43.43s, tests 17.49s, environment 71ms)
test:quick: 19.2 s (limit 45.0 s); every command passed

npx vitest run tests/checks/source/history.test.ts tests/checks/tree/boundaries.test.ts tests/checks/tree/size.test.ts tests/checks/diagrams/diagrams.test.ts tests/checks/config/config-folder.test.ts tests/checks/config/arrangements.test.ts --reporter=dot
 Test Files  6 passed (6)
      Tests  101 passed (101)
sh utils/folder-check.sh -> exit 0, no output

ASCII gate (brief's form, + docs/*.md) -> prints nothing, exit 0

wc -l HELP.md DESIGN.md README.md docs/*.md
 159 HELP.md / 790 DESIGN.md / 48 README.md / 64 docs/configuration.md / 91 docs/files-and-search.md / 67 docs/source-control.md / 69 docs/terminals.md / 231 docs/views.md / 82 docs/window.md / 1601 total
awk 'length>1500' DESIGN.md | wc -l -> 0

npm run diagrams: not run (it writes into the worktree); tests/checks/diagrams/diagrams.test.ts, which compares the committed diagrams with the source in memory, passed above.

sh utils/unused-exports.sh -> exit 0; diff with Q125-base/unused-exports.txt:
40c40
< src/lib/server/content/docs.ts: ... renderMarkdown, renderManualParts, renderDoc, ...
> src/lib/server/content/docs.ts: ... renderMarkdown, renderDoc, ...

Cited names (verify 8): each of the 14 quoted names and the unquoted ones is a heading or a bold label: Auth 206, The socket 130, PTY 196, Git 150, Apps added while oculus runs 350, Approval 493, Watchers 132, Sessions are six views, not one 558, Sessions 140, Normalise 109, Layer 1, data 101, Hot reload 330 (table rows 2 and 3 still present), Client state 228, Boundaries 240, Opening things in oculus 479, Wire model 543, Untyped input 212.

npm run test:checks -> Test Files  16 passed | 1 skipped (17) / Tests  239 passed | 3 skipped (242)
npm test -> Test Files  103 passed | 17 skipped (120) / Tests  617 passed | 72 skipped (689)

Case 6, key tables (first columns, base vs new): 23c23 < h1-h6 --- > h1-h9 ; nothing else
Case 7, views tables (first columns): diff empty; 49 rows each
Link check (scratch node script with github-slugger over the nine documents): links 81, bad 0

Cases 9 and 10 (scratch node run of renderHubDoc / renderManual over a scratch hub, engine at <hub>/tools/oculus):
DESIGN 200 parts html,channels,html,writes,html,layers,html,layer-data..layer-views,html (nine diagram parts) path=tools/oculus/DESIGN.md manual=tools/oculus/HELP.md
DESIGN with its etag -> 304
extra guide -> diagram parts for diagrams/layers.svg, diagrams/nonesuch.svg, ../docs/diagrams/layers.svg; none for ../secrets.svg, diagrams/Layers.svg, docs/diagrams/../x.svg, nor an image inside a sentence
docs/views.md, HELP.md through the hub, the manual -> no parts
docs/RESEARCH-APPROACH.md -> no parts, /api/file/hub/tools/figures/a.svg as now
engine outside the hub: DESIGN 404; manual 200 with path=null manual=null
```

The builder's quoted unchanged-tree runs (case 12 on three documents, G54's Help row failing) were not rerun: the base copy has no node_modules. G54's failing row is confirmed by reading: the base `help:` arrangement is a `split` with one child, and `saved.ts:241` refuses a split with fewer than two children.

## Verdicts

Items of the brief's "What to build":

- 1: holds. HELP.md has the window, the key table whole (case 6), 49 one-sentence view rows linking to `docs/views.md`, short sections for search, project commands, Source Control with worktrees, and configuration. It is 159 lines, and the report gives the reason: lines 141 to 151 are the Apps detail, which Z646 A keeps at this base.
- 2: holds. `docs/configuration.md` has its nine sections and `local.yml`'s `port` at `:32`, and HELP.md:159 links to it.
- 3: holds. `docs/source-control.md` has twelve sections, "Diffs, and staging part of a file" at `:15`, and the worktrees section.
- 4: violated. See Standards 1 (DESIGN.md:284, the moved sentence made false) and Standards 2 (README.md:27, false and in conflict with DESIGN.md:258).
- 5: violated. See Spec 1 and Proof 1.
- 6: holds. The `docs:` list is at `layout.yml:172-183` in the order Z646 C gives. The Help arrangement is one pane with the guides as tabs and Design not a tab. The key row and the key sheet read `h1-h9`.
- 7: holds. My run of cases 9 and 10 is above. `Diagram.svelte`, `diagram-file.ts` and `newest.ts` are under `views/shared/prose/diagram/`, and diffed against the base they differ only in names and words. `diagram.yml` is added to `CATALOG_FILES`.
- 8: violated. See Behaviour 1 (the page still navigates away when the engine is outside the hub), Spec 3 (an unlisted `.md` link does nothing, where the item says it opens a doc tab) and Behaviour 2 (the fragment re-scrolls).
- 9: holds. `documentsOf`, `history.test.ts:118-126`, reads `docs/*.md`, and the head comment is updated. See Proof 3 on coverage and Standards 3 on the wrap.
- 10: violated. See Standards 1 (DESIGN.md:284). The other listed sentences are rewritten: `grep -rn "ManualPart|renderManualParts"` prints nothing, the three already-false comments are fixed, the README pointer is fixed, the chord sentence at DESIGN.md:85 is fixed, and there is no `HELP.md#` link.
- 11: holds as text. The judgment is under "Doc text" in Declined to judge.

Cases of the brief's "Cases":

- 1: met. The row at HELP.md:94 is one sentence. HELP.md:155 links `docs/source-control.md`.
- 2: met. `docs/source-control.md:15`.
- 3: met. `docs/configuration.md:32` gives `port`, and HELP.md:159 links to the guide.
- 4: partial. Every command HELP.md held is in README.md once (Z646 E). The `npm run diagrams` fact is said twice and differently: see Standards 2.
- 5: met. DESIGN.md:130 is 497 characters with no controls, and DESIGN.md:541.
- 6: met. The diff is above.
- 7: met. The first-column diff is empty. The report's comparison of the 38 listed ids against the rows, read, has no row missing.
- 8: partial. The table exists, but several "decision sentence kept" cells hold a label, not a decision (row 400: "- The Files view's file operations."). It also lets through the paragraph broken mid-quotation at DESIGN.md:703/705. See Spec 1 and Proof 1.
- 9: met. My run is above. Ruling D's 404 for the engine outside the hub is reproduced. A hub symlinked so that the engine's real path falls outside the hub's real path is also refused by `escapes` (`docs.ts:166-171`, unchanged).
- 10: met. My run is above.
- 11: met by reading. The help group has views help and memories, then the docs in `layout.yml` order, so h1 to h9 end at the Source Control guide.
- 12: met. It passes after the change. That a guide holding "D23" would fail is read from `HISTORY` applied to every line `documentsOf` returns. See Proof 3.
- 13: met by reading for an engine inside the hub. `jump.ts:48-53` hands the press to `docLinkOf`, then `Markdown.svelte:79-90` opens the target, and `../HELP.md#the-keys` resolves to `doc.manual`, so the Help view opens with `fragment`. The press itself is for the landing look. See Behaviour 1 for the engine outside the hub.
- G54 (added by message, Z645 a): met. `arrangements.test.ts` has twelve rows and passes. The Help row fails on the base arrangement, read from `saved.ts:241`.

## 1. Spec

- **1. DESIGN.md "Decisions taken" and the sections above it, item 5.** Examples: DESIGN.md:671 "The refusals are made in one order, `outside`, `missing`, `root` ..., `protected` ..., `invalid_name`, `exists`, `into_itself`, `not_a_folder` ..."; :174 "**Processes view.** ... one `ps -axww` run ... under a ten-second limit ... prints more than 32 MB ..."; :587 "A pane has an optional `locked` flag ... keeps its lock through activate, open, move, split and close ..."; :711 "Tab reaching the controls makes the focus order itself a design surface ..."; :164 "Replace in the Search view is `POST /api/ops` ... (Node refuses a request head over 16384 bytes) ...".
  - What is wrong: item 5 asks for each decision and its reason in a few sentences, with the step-by-step behaviour (controls, refusal words, edge cases) moved out. The tree has the following.
    - "Decisions taken" went from 171,188 to 134,094 bytes (`awk` over the section, base vs new). 28 of its 74 items are still over 1,500 characters, 14 over 3,000 and 4 over 5,000: "The code window's languages ..." 7,177, "The Repositories view" 6,991, "Tabs, pages and panes" 6,670, "The pty bridge" 5,748. About 34 items are within 1% of their base size.
    - The whole file went from 349,382 to 291,973 bytes.
  - Each example above has a home elsewhere, so ruling B allows it out of DESIGN.md.
    - :671 repeats the head comment `server/files/fs/ops.ts:11-16` almost word for word ("The refusals are made in one order: `outside`, `missing`, `root`, `protected` ...").
    - :174 repeats `server/machine/processes/watch.ts:1-8`, which it cites, and `failure.ts`.
    - :587's pinned-tab and lock behaviour is in `docs/window.md` ("Inside a page": `grep -c` gives 5 hits for pinned, 2 for locked).
    - :711 is told in `docs/window.md:66` and `ui/tree/roving.ts:1-5`.
    - :164's server refusals are in `docs/files-and-search.md:91`.
  - Text with no home elsewhere: the Apps section (DESIGN.md:350-518, about 68,000 characters), which Z646 A keeps for the second landing, and the behaviour the report says it kept because no guide or head comment held it. I did not audit every one of those items.
  - The report says the 179 unchanged non-Apps paragraphs "each already state a decision with its reason". DESIGN.md:218 ("The page says a failed read in a catalog sentence ... A plain object built from an outside map's keys skips an own `__proto__` key ...") is a list of mechanisms. The rewritten item at :671 also shows that "rewritten" does not mean reduced.
  - Failure scenario: Axel reads DESIGN.md before landing for "why it is built as it is" and finds, in 74 items, runs of refusal words, timeouts and per-operation edge cases that the guides and head comments already say. A later step that changes the file operations has to edit the same fact in DESIGN.md, the head comment and the guide, which is the growth Z636 set out to end.
  - Verdict: item 5 violated, case 8 partial.
- **2. Shapes the brief does not name, not reported as decisions.** `docs.ts:110-111` "path: string | null; manual: string | null;" (new fields of the api/docs answer), and the new `fragment` key of the help and doc views' instance state (`Doc.svelte:79`, `Help.svelte:45`, `Markdown.svelte:93-95`), which is saved with the layout.
  - What is wrong: spec.md "No silent design decisions" names a wire format and a saved instance-state key as shapes to report. The report's "Judgment calls" lists neither.
  - Failure scenario: the orchestrator reads the judgment calls to decide what to put to Axel or reverse, and does not learn that the docs answer and the saved layout gained fields.
- **3. A relative `.md` link to a file outside `docs:` does nothing.** `Markdown.svelte:79-90`: `if (entry !== undefined) client.layout.openView('doc', ...)`, after `jump.ts` has already called `preventDefault`.
  - What is wrong: item 8 says such a press "opens that document in a `doc` tab". The builder made it do nothing. It reported this as judgment call 5, with before and after, giving as its reason that a source tab would need a root. The doc view already draws an unlisted path as a visible line (`config/text/views/sources/doc.yml:13`, "`{0}` is not in the documents list of config/layout.yml ..."), so opening the doc tab as the item says needs no root and gives the reader feedback. No current link is affected: every link in the nine documents targets a listed document or HELP.md (my link check), and the four hub documents hold no `.md` link.
  - Failure scenario: a hub document later links `../projects/x/README.md`. The reader presses it, nothing happens and nothing says why.
  - Verdict: item 8 violated, together with Behaviour 1.

## 2. Proof

- **1. DESIGN.md, the line limit met by splitting paragraphs.** Lines 703 and 705: "... A list cut at 200 entries says 'Too many changes were detected." / "Only the first 200 changes will be shown below.' under the group it shortened. ..."
  - What is wrong: the report's Verify 4 row gives `awk 'length>1500' DESIGN.md | wc -l` as `0`, DONE. That zero comes from splitting each paragraph at 1,450 characters (judgment call 1), not from rewriting it. "Decisions taken" had no continuation paragraphs at the base and has 74 now. 29 lines fall between 1,400 and 1,444 characters, and the longest line is 1,444. The split also cut a quoted refusal sentence across two Markdown paragraphs (703/705, found by searching for a paragraph that opens inside a quotation). The decision this rests on is whether item 5's "no line over 1500" is met. The report does disclose the splitting under item 5's PARTLY DONE.
  - Failure scenario: a reader of the rendered DESIGN.md sees a stray closing quote opening a paragraph. A later check of "no line over 1500" reads green while paragraphs of 3,000 to 7,000 characters remain.
  - Verdict: item 5 violated.
- **2. Counts in the report not taken after the last change.** The file table gives `DESIGN.md` 800, `docs/files-and-search.md` 87 and `docs/source-control.md` 65. `wc -l` prints 790, 91 and 67. The "Host- and user-visible changes" section, item 6, says the diagram words "moved from `config/text/app.yml`". The diff shows they moved from `config/text/views/system/help.yml`.
  - What is wrong: spec.md "Report" asks for every count to be taken after the last change. No decision rests on these line counts, but the words' source is part of the landing-look text.
  - Failure scenario: at the look, the orchestrator searches app.yml for the moved keys and finds they were never there.
- **3. `history.test.ts`, the guide reading has no assertion that fails without it.** `documentsOf` at `:118-126` is reached only by "names no package id, date or session in any document", which passes whether or not the guides are read while they hold no id. The planted-tree case covers comments only.
  - What is wrong: the brief allowed case 12 to be checked by reading, so this is not against the brief. But the behaviour item 9 adds has no test that would go red if it were taken away. One planted `docs/x.md` holding "D23" checked through `documentHits(dir)` in the existing scratch case would cover it, without adding a test.
  - Failure scenario: a later edit drops `documentsOf` and every guide leaves the audit while the suite stays green.

## 3. Standards

- **1. DESIGN.md:284** "In the Help view and the Doc view each diagram takes the page's text colour, because the SVG is fetched as text ...".
  - What is wrong: this is HELP.md's moved paragraph (report row H361, "none removed"). The Help view now draws no diagram ("The manual holds no diagram", `Help.svelte` head comment, and the manual's answer carries no parts in my run). spec.md:66 makes a sentence the change makes false a defect.
  - Failure scenario: a developer looks in `Help.svelte` for the diagram drawing and finds none.
  - Verdict: items 4 and 10 violated.
- **2. README.md:27** "`npm run diagrams` redraws the diagrams ..., and the unit suite fails while a committed diagram differs from what the source gives now."
  - What is wrong: `tests/checks/diagrams/diagrams.test.ts` is a tree check, and `npm test` runs `--exclude 'tests/checks/**'` (package.json). DESIGN.md:258 correctly names the tree check. The brief's convention is one fact said once, and here it is said twice and differently.
  - Failure scenario: a developer runs `npm test` after moving an import, sees green and commits stale diagrams.
  - Verdict: item 4 violated, case 4 partial.
- **3. `tests/checks/source/history.test.ts:4-5`** "// file there, and every line of the documents (HELP.md, DESIGN.md, README.md and each guide under" / "// docs/), is read and matched against the migration" / "// plan's id vocabulary ...".
  - What is wrong: spec.md "What every package obeys" says an edited comment is rewrapped as a whole paragraph at 100 columns, and here a line ends short inside a sentence.
  - Failure scenario: the next reader sees a ragged comment, the form the rule exists to prevent.
- **4. `src/lib/views/shared/prose/doc-link.ts:41-47`** (the dot-segment loop `if (part !== '..') kept.push(part); else if (kept.length === 0) ...`).
  - What is wrong: the same rule exists as `normalisePath` (`state/sources/explorer/view/place.ts:29`, exported, keeps a leading `..` so a climb above the root shows) and as `resolveAgainst` (`ui/controls/editor/kit/latex/latex.ts:108`). spec.md "The principles" says a rule exists once, and a helper is grepped for and the grep quoted before it is written. The report quotes no such grep.
  - Failure scenario: a fix to how a path is resolved (percent-decoding, a backslash) reaches one copy and not the others.
- **5. The report has no quoted history-word grep** of the comments and test titles it added (spec.md "What every package obeys"). My grep of the added lines finds only "still on its way" and "no longer shown" in `Diagram.svelte`, which describe the present, so nothing in the code is wrong. The missing grep is a defect of the report.
- **6. The builder's process breaches**, disclosed in the report: twelve general-purpose agents started (spec.md "Where you work", no agent) and one `git log` on the main checkout (spec.md, no git command).
  - Checked from the tree: every changed path is either on the write list or named in the report's file table with its reason. The paths outside the list are `Markdown.svelte`, `RenderedMarkdown.svelte` and `doc-link.ts` as siblings of `jump.ts`, the four guides from Z646 and `arrangements.test.ts` from Z645.
  - `git status --short --ignored` lists no stray file but `.svelte-kit/`, and `.agents/worktrees/` holds no worktree beyond the known ones.
  - Cannot be checked here: the agents' transcripts, whether any text they produced reached the diff by hand, and the builder's scratchpad.
  - Failure scenario: the diff is taken as one builder's work under the rules file without that being established.

## 4. Behaviour

- **1. The engine outside the hub: the page still navigates away.** `Markdown.svelte:98-100` "follow && doc.path !== '' ? { from: doc.path, open } : undefined".
  - What is wrong: with the engine outside the hub, which README.md:13 documents for "a run that must not touch the checkout's configuration ... over a copy with `--engine`", the manual's answer has `path: null` (my run: "outside manual 200 ... path=null manual=null"). There is then no follower, `jump` returns without `preventDefault`, and the browser takes the page to the relative address, which is the base behaviour item 8 removes. The report gives before and after only for an engine inside the hub.
  - Failure scenario: a server started with `--engine /tmp/copy`. The reader presses "Configuration" in the Help view's rail paragraph and the oculus tab leaves for `/docs/configuration.md`.
  - Verdict: item 8 violated.
- **2. A fragment is kept in the tab's state and scrolled to again.** `Doc.svelte:104-111` (the `$effect` reading `shown` and `fragment`), and the same at `Help.svelte:48-54`.
  - What is wrong: nothing ever clears `fragment`. The effect runs again whenever `shown` changes identity, which `docs.svelte.ts:322` lets happen whenever the file's content changes, and again when the saved layout is restored. The report says "a fragment is scrolled to as `jump` does" and does not state this. Found by reading; not seen in a page.
  - Failure scenario: a reader opens DESIGN.md from a guide's link to `#auth`, scrolls to another section, and an agent edits DESIGN.md. The tab jumps back to Auth. Reloading the page jumps back to Auth too.

## Declined to judge

- **Whether the 237 paragraphs the builder kept may stay as they are** beyond the examples in Spec 1, and how far "a few sentences" may stretch for the items that keep behaviour no guide holds: this is the reading Axel does before the landing, and a full sentence-by-sentence audit of 290,000 characters was not done here.
- **HELP.md at 159 lines against 150:** I judge it acceptable under Z646 A, since lines 141-151 are the Apps detail kept for the second landing and the report gives the reason. Whether the rest belongs in the short guide is Axel's reading.
- **The "Doc text" proposals** (`agents/spec.md:66` and the state file's demand, now at `orchestrator-state.md:154` by `grep -n "Every brief also lists"`; the report says 153).
  - Both are true as text and state Z636's rule. The spec.md text names the guides including Apps, which exists on main (`ls tools/oculus/docs` in the main checkout prints `apps.md`).
  - Applying the sentence "A behaviour a head comment already says is not told again in DESIGN.md" makes the rules file name a rule the delivered DESIGN.md breaks at once (DESIGN.md:671 against `ops.ts:11-16`). Whether to apply it before Spec 1 is closed is the orchestrator's call.
- **Whether README.md should also name `npm run test:quick` and `npm run test:landing`:** both are check commands in `package.json` that no document names. Ruling E covers only the commands HELP.md held.
- **The press, the tab placement and the scroll in a page (cases 9 and 13, Behaviour 2):** these need the landing look; no browser was opened.
- **The unchanged-tree runs of `history.test.ts` and `arrangements.test.ts`:** not rerun, because the base copy has no node_modules. G54's failure there is confirmed by reading.
- **The base's character counts:** `wc -c` gives 349,382 bytes for the base DESIGN.md where the report says 348,946 and the brief 348,197. No decision rests on the difference.

Reviewer usage: a592538c261dc0fa4 (as the state file records it), claude-opus-5-5, about 270,000 tokens, 66 tool uses, about 16 minutes.

## Repair round 1, refuted

I ran everything from `tools/oculus` in `.agents/worktrees/Q125` (base 02ac124ec) and changed no file. The round was sent with nothing committed, so I read the whole diff since the base against the first review. The guides under `docs/` were not touched in this round: every `docs/*.md` was last modified between 13:55 and 15:31, before the first review was written at 16:28 (`stat -f '%Sm'`). DESIGN.md and README.md were modified at 16:53. HELP.md was modified at 13:23.

```
npm run test:quick
ok      ASCII gate (0.4 s)
ok      prettier (0.8 s): All matched files use Prettier code style!
ok      svelte-kit sync (8.2 s)
ok      eslint (17.8 s)
ok      svelte-check (19.4 s): 1791299252058 COMPLETED 390 FILES 0 ERRORS 0 WARNINGS 0 FILES_WITH_PROBLEMS
ok      vitest (31.1 s): Duration  22.30s (transform 50.62s, setup 0ms, import 65.59s, tests 17.97s, environment 76ms)
test:quick: 31.5 s (limit 45.0 s); every command passed

npx vitest run tests/checks/source/history.test.ts tests/checks/tree/boundaries.test.ts tests/checks/tree/size.test.ts tests/checks/diagrams/diagrams.test.ts tests/checks/config/config-folder.test.ts tests/checks/config/arrangements.test.ts --reporter=dot
 Test Files  6 passed (6)
      Tests  101 passed (101)
sh utils/folder-check.sh -> folder-check exit 0, no output

ASCII gate (the brief's form, docs/*.md included) -> prints nothing, ascii exit 0

wc -l HELP.md DESIGN.md README.md docs/*.md
 159 HELP.md / 571 DESIGN.md / 48 README.md / 64 docs/configuration.md / 91 docs/files-and-search.md / 67 docs/source-control.md / 69 docs/terminals.md / 231 docs/views.md / 82 docs/window.md / 1382 total
awk 'length>1500' DESIGN.md | wc -l -> 0 ; longest line 1495 ; wc -c DESIGN.md -> 207221 (base 349382)

npm run diagrams: not run (it writes into the worktree); tests/checks/diagrams/diagrams.test.ts passed above.

sh utils/unused-exports.sh -> exit 0; diff with Q125-base/unused-exports.txt:
40c40: renderManualParts gone from the src/lib/server/content/docs.ts line, nothing else

Cited names (Verify 8), grep -n in the new DESIGN.md: Approval 403, Apps added while oculus runs 260, Auth 153, Boundaries 170, Client state 158, Git 131, Hot reload 245, Layer 1, data 91, Normalise 99, PTY 146, Sessions 124, The socket 118, Watchers 120, Sessions are six views, not one 461, Wire model 452, Untyped input 155, Opening things in oculus 389, two agents and a shell 458, Git writes and the deposit 456, Live data 450

npm run test:checks -> Test Files  16 passed | 1 skipped (17) / Tests  239 passed | 3 skipped (242)
npm test -> Test Files  103 passed | 17 skipped (120) / Tests  617 passed | 72 skipped (689)
npx prettier --check . -> All matched files use Prettier code style!, exit 0
npx eslint . -> exit 0, no finding
npx svelte-check -> COMPLETED 3039 FILES 0 ERRORS 0 WARNINGS 0 FILES_WITH_PROBLEMS

grep -n "^['\"]" DESIGN.md | wc -l -> 0 ; the odd-quote awk of the report -> 0
unbalanced parentheses per line, outside code and tables -> 292 open=5 close=4 ; 294 open=5 close=6
adjacent prose lines Markdown joins into one paragraph -> DESIGN.md 141-142, 142-143, 145-146, 152-153, 210-211 (base: 130-131, 139-140)

Case 6: diff of the key tables' first columns -> 25c25 <  h1-h6 / >  h1-h9, nothing else
Case 7: diff of the views tables' first columns -> empty
Link check (scratch script, the nine documents, relative .md links and their anchors) -> links 72 bad 0
Text greps: grep -rniE "help (view|page).{0,80}diagram" -> nothing ; "npm run|npm test|node src/server" in HELP.md DESIGN.md docs/*.md -> 0 ; "h1-h" -> config/text/app.yml:12 and HELP.md:51 (h1-h9) ; ManualPart|renderManualParts -> 0

Cases 9 and 10 (scratch node run of renderHubDoc / renderManual, engine at <hub>/tools/oculus):
DESIGN 200 | html,diagram:channels,html,diagram:layers,html,diagram:layer-data,diagram:layer-server,diagram:layer-state,diagram:layer-ui,diagram:layer-shell,diagram:layer-views,html | path=tools/oculus/DESIGN.md manual=tools/oculus/HELP.md | imgs 9
DESIGN with etag 304
extra guide 200 | html,diagram:layers,diagram:nonesuch,html,diagram:channels,html (no part for ../secrets.svg, diagrams/Layers.svg, docs/diagrams/../x.svg, or an image inside a sentence)
views 200 | no parts ; HELP via hub 200 | no parts ; manual 200 | no parts
RESEARCH 200 | no parts | imgs 1 src="/api/file/hub/tools/figures/a.svg"
engine outside the hub: OUT DESIGN 404 the document is not inside the hub ; OUT manual 200 path=null manual=null ; OUT RESEARCH 200 through the file route
```

### The closures claimed, against my rerun

1. **Item 5 done whole:** not reproduced. The round removed the splits outside Apps and repaired the quotation at the old :703/:705. "Decisions taken" went from 134,094 to 79,201 characters. But guide text is still repeated, the first review's own examples among it, and the destination table is incomplete. The rewrite also brought in a false sentence and five joined paragraphs. See Spec 1 to 3 and Standards 1 to 5.
2. **DESIGN.md:284:** reproduced. DESIGN.md:210 now reads "In the Doc view each diagram takes the page's text colour", and :485 says "the Help view draws no diagram". The grep prints nothing.
3. **README.md:27:** reproduced. README.md:27 names the tree check as one of those `npm run test:checks` runs. DESIGN.md:184 points to it. `npm run test:checks` passes with that test inside it.
4. **An unlisted .md link opens a doc tab:** reproduced by reading.
   - `Markdown.svelte:91-92` opens `{ label: '', path, group: '' }`.
   - In `Doc.svelte:80-88`, `followDoc` with an empty label gives `entry: null`, so `reading` is empty and `shown` is null.
   - `doc.unlisted` is then drawn.
5. **Engine outside the hub:** reproduced by reading and by my run ("OUT manual 200 path=null manual=null").
   - `docLinkOf` returns the empty path when `from` is empty (`doc-link.ts:44`).
   - `jump.ts:51` calls `preventDefault`, and `open` returns on the empty path (`Markdown.svelte:82`).
   - The page no longer navigates away, which closes the first review's Behaviour 1.
   - On item 8: ruling D makes the engine's own documents answer 404 there, so no doc tab could show them. Doing nothing meets item 8 as ruling D narrows it. The report states the no-op with its before and after (finding 5, host-visible change 4).
6. **The fragment is scrolled to once:** reproduced by reading `Doc.svelte:105-115` and `Help.svelte:52-58`. The effect scrolls, then restates the tab without `fragment`. `openView` restates an existing instance with the new state (`opening.ts:145`), so a second press scrolls again.
7. **Shapes named:** reproduced (judgment call 7: `path`, `manual`, `fragment`, `DocPart`).
8. **The planted docs/x.md case:** reproduced. `history.test.ts:178` plants it and `:186` asserts `documentHits(dir)`. Reading it: without `documentsOf`, `documentHits` would read only the three root documents, which the scratch tree lacks, and would return `[]`. So the assertion depends on the guide reading. The builder declined to quote a failing run with `documentsOf` removed, and that decline is correct under the rule against breakage testing. The case passes in the six-file run.
9. **Rewrap:** reproduced. `history.test.ts:1-7` is one paragraph within 100 columns.
10. **normalisePath reused:** reproduced (`doc-link.ts:8`, `:46`). The loop is gone.
11. **History-word grep and counts:**
    - The file-table counts are reproduced: 571, 91 and 67 match `wc -l`.
    - The source of the moved words is reproduced: the help.yml diff removes both keys, and diagram.yml holds `failed` and `loading`.
    - The history-word grep is not reproduced as asked. See Proof 2.

### Verdicts

Items of the brief's "What to build", over the whole diff since the base:

- 1: holds. HELP.md is unchanged in this round. It is 159 lines, which Z646 A allows. The key and views diffs are above.
- 2: holds. `docs/configuration.md` gives `port`, and HELP.md links to it.
- 3: holds. `docs/source-control.md` is unchanged since the first review.
- 4: violated. DESIGN.md:186 is moved prose that is false (Standards 4). The first review's Standards 1 and 2 are closed.
- 5: violated. See Spec 1, Spec 2, Spec 3 and Spec 4, Standards 1, Standards 2, Standards 3 and Standards 5, and Proof 1.
- 6: holds. `layout.yml:172-183` is in the order of Z646 C, and the Help arrangement is one pane.
- 7: holds for the code: the cut, the 304, the moved component, `diagram.yml` and `CATALOG_FILES`. The missing writes diagram comes from DESIGN.md's text, not from the code (Behaviour 1).
- 8: holds. Closures 4, 5 and 6 above. The press itself waits for the landing look.
- 9: holds. Closure 8 above.
- 10: holds. The listed sentences are rewritten. The `ManualPart|renderManualParts` grep prints nothing, and there is no `HELP.md#` link into a moved section.
- 11: holds as text. The line-cite sentence the proposed Doc text adds is under Spec 3.

Cases of the brief's "Cases":

- 1: met. HELP.md:94 is one sentence, and :155 links the guide.
- 2: met. `docs/source-control.md:17`.
- 3: met. `docs/configuration.md:32`.
- 4: met. Every command is in README.md once, and README.md:27 agrees with DESIGN.md:184.
- 5: met. DESIGN.md:118 and :450.
- 6: met. My diff is above.
- 7: met. The first-column diff is empty.
- 8: partial. The table exists, but its destinations are incomplete and one is wrong (Spec 2). The Apps splits break a parenthesis and a list of conditions (Standards 3).
- 9: partial. Eight diagram parts, not nine. writes.svg is drawn as a file-route image (Proof 1, Behaviour 1).
- 10: met. My run is above.
- 11: met, read from `layout.yml:172-183` with the chord rule.
- 12: met. It passes after the change, and the planted guide line is asserted.
- 13: met by reading for an engine inside the hub.
- G54: met. `arrangements.test.ts` passes in the six-file run.

### 1. Spec

- **Spec 1. DESIGN.md "Decisions taken" still repeats the guides and head comments, and still narrates behaviour no guide holds.**
  - What is wrong: the round's item 1 says text a guide or head comment already holds is deleted, and the rest moves to a guide (ruling B). Four places show this was not done:
    - **DESIGN.md:524** "Ctrl and a digit still answers while a field or the palette holds the keyboard, and Ctrl and a bracket is silent there, because a bracket is a character a field takes." The item repeats `docs/window.md:66-68` almost sentence for sentence: Tab and Shift+Tab are the browser's, one stop per strip with the pane menu after it, Delete with a confirmation for unsaved text, Ctrl+Tab left to the browser, and Ctrl and a digit or a bracket inside a field. This is the first review's :711 example, which the round named for deletion.
    - **DESIGN.md:141** "publishes one payload on the `processes` channel every ten seconds while the hub has a subscriber on it and reads nothing while it has none ... A read that fails keeps the last good rows under the failure's sentence." This repeats `server/machine/processes/watch.ts:1-5`, the first review's :174 example.
    - **DESIGN.md:562** "its first Save asks for the workspace's served root as a choice field and refuses a name that starts with a slash or holds a `..` folder". This repeats `docs/window.md:54` and adds a refusal edge case.
    - **DESIGN.md:555** "Card grids stretch each row's cards to one height in file order. A card draws no subtasks block until it has a subtask, adding the first being a card control." These are control behaviours with no decision or reason, and no guide holds them. No guide was edited in this round to take them (the mtimes above).
  - Size of what is left: 39 of the 89 items are over 1,000 characters, and 12 sit between 1,400 and 1,495, just under the line limit.
  - Failure scenario: Axel reads DESIGN.md before landing and meets the same key and focus rules he reads in the Window guide. A later step that changes Ctrl and a bracket has to edit DESIGN.md:524 and `docs/window.md:68`, which is the double home Z636 set out to end.
  - Verdict: item 5 violated.
- **Spec 2. The paragraph table of case 8 names only some destinations, and one is wrong.**
  - Report, "The paragraph table of case 8": row 130 (Git, 8,000 to 1,374 characters) names one destination, `model-sessions.ts:614`.
  - Row 375 (the pty bridge, 6,800 to 1,438) names one: capture.ts and channel.ts. The removed `GRID_ENV` / `CLAUDE_CODE_DISABLE_ALTERNATE_SCREEN=1` run, the alternate-screen capture, Attach to Session and the republish rule are named nowhere in the row. My greps find each in `pty/sessions.ts`, `docs/terminals.md` or `terminals.svelte.ts`, so nothing was lost there, but the table does not say so.
  - Row 408 (12,255 to 2,116) names three runs.
  - Row 429 names "config/appearance.yml and src/lib/themes/derive.ts:1-29" for the hue of each lane. `grep -n -i lane config/appearance.yml` prints nothing, and derive.ts:1-29 names no lane's hue. The lane colours sit in `config/catalogs/vocab.yml:153-170` as hex values, and the hue names (Run green ... Teaching teal) are now in no file.
  - What is wrong: the round's item 1 asked the report to name every place a removed mechanism now lives, and case 8 asks for each run's destination.
  - Failure scenario: at the second landing of Z642, the orchestrator reads row 129 to carry E4g's or D23's text and cannot tell where the removed Git paragraph's sentences went, or follows row 429 to a file that does not hold them.
  - Verdict: case 8 partial.
- **Spec 3. DESIGN.md now cites code by line range throughout, a shape the brief did not name.**
  - `grep -o '\.(ts|svelte|mjs|css|js|yml):[0-9]+' DESIGN.md | wc -l` prints 36 at the base and 328 now. Item 5 asks for "the file or folder that holds it".
  - The proposed Doc text for spec.md:66 makes the shape a rule: "the paragraph cites the comment's `file:line`".
  - Judgment calls do not list it.
  - Some ranges already miss: DESIGN.md:485 cites `doc-link.ts:1-8` and `jump.ts:1-22` for "a fragment scrolls to the heading it names once", and neither range says it (the scroll-once is in `Doc.svelte:21-29` and `Help.svelte:23-29`).
  - The report's `cites.py` checks only that each file and range exists.
  - Failure scenario: a later step adds three lines above `run.ts:10`. DESIGN.md:131's `run.ts:10-60` then points at the wrong lines, no check fails, and the new spec.md:66 text puts finding every such range on every step.
  - Verdict: item 5 violated, item 11 decision for the orchestrator.
- **Spec 4. The three comments that were already false name no section.**
  - Places: `deposit-git.ts:17` "the snapshot mode of the deposit", `deposit-git.ts:299`, `root/hooks.ts:1`, `boards/editor/Editor.svelte:15`.
  - What is wrong: item 5's first bullet says they "are rewritten to name the section they mean". They now cite no section of DESIGN.md. They are true, but the pointer is gone.
  - Failure scenario: a reader of `forcePushSnapshot` looks for the decision behind the forced push and is not sent to DESIGN.md:133 ("Fixed git choices").
  - Verdict: item 5 violated (minor).

### 2. Proof

- **Proof 1. Case 9 after the change, "nine diagram parts" is not reproduced.**
  - The report's own list names eight: channels, layers and the six layer diagrams. My run gives the same eight, while the first review's run gave nine, writes included.
  - Cause: DESIGN.md:152 `![The write chain ...](docs/diagrams/writes.svg)` is followed directly by :153 "**Auth.** ..." with no blank line, so Markdown makes them one paragraph, and the cut leaves an image inside a paragraph alone (my extra guide's "Text with ![g] inside" gives no part).
  - What rests on it: the verdict of case 9 and host-visible change 5.
  - Failure scenario: the orchestrator's landing look checks the doc view on DESIGN.md against "nine diagram parts" and takes the writes diagram's grey file-route image for a fault of the look.
  - Verdict: case 9 partial.
- **Proof 2. Standards 5 closed with a different check.**
  - Report, finding 11: "History words: the audit's vocabulary (`tests/checks/source/history.test.ts:30-69`: the id families, a date, 'this session' and 'earlier session')".
  - What is wrong: the round asked for the rules file's history-word grep ("What every package obeys": 'before', 'used to', 'no longer', 'still', 'always has been', 'always had', 'as before', 'previously', 'the step adds', 'after this package lands') over the added comment lines and test titles.
  - My grep of the added comment lines finds 8 hits: "before git has exited", "still leaves a named, marked session", "still one download", "a fetch still on its way", "a name no longer shown", "before the figures pass", "before it draws it" and "before git runs". All describe the present, so no code is wrong. The report does not quote this grep.
  - Failure scenario: a word comparing with an earlier state in the 24 head comments this round edited would go unseen, since the check that ran does not search for it.
- **Proof 3. The git disclosure does not match the transcript.**
  - Report, Disclosures (b): "one read-only `git log` on the main checkout earlier in the step and, in this repair round, three read-only git commands in the worktree (`git status`, `git diff --stat` and `git rev-parse`)".
  - The builder's transcript (`subagents/agent-a53eac68600a643ef.jsonl`) holds five, each piped to `head -0` after the first:
    - line 1647, 12:18, `git log --oneline -8` on the main checkout;
    - line 2718, 13:23, `git -C . log -1 --format=%h` in the worktree, which is not disclosed;
    - line 2756, 13:24, `git -C <hub> status --short`;
    - line 4544, 14:47, `git diff --stat`;
    - line 4698, 14:59, `git -C . rev-parse`.
  - The round's message is line 3105, 13:55, so two ran in the round and three before it.
  - The round's message said "you run no git command at all, not even a read-only one on main". No agent was started in the round: the twelve Agent calls are at lines 569-580, 11:25-11:26.
  - Failure scenario: the orchestrator books the disclosure as complete and does not count the undisclosed `git log`.

### 3. Standards

- **Standards 1. DESIGN.md:131** "`server/root/watch/autofetch.ts` fetches unattended while `git.autofetch_minutes` of `behavior.yml` is above 0 (the default)".
  - What is wrong: the default is 0 (`config/behavior.yml:168` `autofetch_minutes: 0`, and `config/catalogs/options.yml` `default: 0`, "0, the default, fetches only when Fetch is pressed"). The base said "(the default is 0)". The rewrite made the sentence false, which the rules file names a defect ("A sentence in a document ... that the change makes false").
  - Failure scenario: a reader concludes that oculus fetches every remote unattended on a fresh checkout, and Axel reads the security decision the wrong way round.
  - Verdict: item 5 violated.
- **Standards 2. DESIGN.md:80**, inside the repository-layout code block: "the channels and the write chain   docs/*.md                         the guides: what each control does, ...".
  - What is wrong: the new `docs/*.md` entry is joined onto the continuation line of `docs/diagrams/`, so the tree reads as one row.
  - Failure scenario: a reader of the layout cannot see that `docs/*.md` is its own folder entry.
  - Verdict: item 5 violated.
- **Standards 3. DESIGN.md:292/294 and :330/:332 (Apps).**
  - Line 292 ends "`channel_closed` (a channel closed to every app, or, for a root app, `inbox`, `calendar`, `sessions` or `usage`." Line 294 opens "Its sentence names the channel, ... what the channel carries), `write_closed` (a ...". Line 330 ends "the path is a file of the app's recorded list." Line 332 opens "The file's size, modification time and change time ... equal the record's".
  - What is wrong: at the base both were one sentence, "`usage`; its sentence names" and "recorded list; the file's size". The split turned each ";" into "." and cut a parenthesis (5 open and 4 close on 292, 5 and 6 on 294) and a list of conditions ("answered only when every one of these holds") across two Markdown paragraphs.
  - This is the defect class of the quotation the round asked repaired. The report says the Apps section changed only by the split and that "No quotation is broken". Its check counts quotation marks, not parentheses.
  - Failure scenario: a reader of :332 takes the size and time check as a separate rule, not a condition of answering at all, and sees an unopened ")" on :294.
  - Verdict: item 5 violated, case 8 partial.
- **Standards 4. DESIGN.md:186** "The layers diagram, the layer diagrams, the channels and the write chain follow, each drawn from the source as the paragraph above says."
  - What is wrong: the channels and write-chain diagrams are at :122 and :152, above this sentence. Only the layer images follow (:188-:202). The sentence is new (row H331).
  - Failure scenario: a reader scrolls down for the channels diagram and does not find it.
  - Verdict: item 4 violated.
- **Standards 5. DESIGN.md:141-143, :145-146, :152-153 and :210-211 have no blank line between paragraphs.**
  - Rendered, "**Processes view.**", "**Schedules.**" and "**Calendar.**" are one paragraph, as are "**Mail.**" and "**PTY.**", the writes image and "**Auth.**", and "In the Doc view each diagram ..." with "The client's stores are one object ...".
  - What is wrong: item 5's first bullet keeps every name a comment cites "as a heading or a bold label at the start of its paragraph". PTY (4 comments) and Auth (13 comments) are no longer at the start of a rendered paragraph. The base had only 130-131 and 139-140.
  - Failure scenario: a developer follows `channel.ts`'s "DESIGN.md, Auth" to the doc view and finds Auth in the middle of a paragraph that opens with a picture.
  - Verdict: item 5 violated, together with Proof 1.

### 4. Behaviour

- **Behaviour 1. The write-chain diagram is drawn as an image in the doc view, not in the page's text colour.**
  - Place: DESIGN.md:152-153 (see Proof 1).
  - What is wrong: host-visible change 5 says each diagram of oculus's own documents is a diagram part in the page's text colour. writes.svg comes through the file route in its own colours (`imgs 9` with eight parts in my run), drawn at the start of the Auth paragraph. The report does not state this.
  - Failure scenario: under a dark theme, the reader of Design sees the write chain in the SVG's own colours beside eight diagrams in the text colour, and the Auth text running on after the picture.
  - Verdict: case 9 partial.

### Declined to judge

- **The press, the tab placement, the unlisted-document line and the scroll in a page (cases 9 and 13, closures 4 to 6):** these need the landing look, and no browser was opened.
- **Whether the silent no-op with the engine outside the hub should instead say why:** ruling D makes the targets unservable, the report states the behaviour, and whether to add a visible line is the orchestrator's call.
- **A full audit of the 89 "Decisions taken" items and the 140 unchanged non-Apps lines:** I sampled 34 paragraphs across every section outside Apps.
  - Read in full: 87, 120, 131, 133, 135, 137, 139, 141, 142, 143, 145, 148, 153, 157, 166, 229, 241, 259, 456, 464, 476, 483, 485, 487, 502, 511, 524, 545, 548, 551, 553, 555, 558, 560, 562.
  - Destinations checked against their files for 17 table rows: 87, 118, 124, 130, 140, 154, 156, 166, 375, 400, 401, 404, 408, 421, 426, 429 and 417.
  - The unchanged lines over 250 characters (9 of them, at most 624) are decisions with reasons.
  - Nothing a decision needs was found lost beyond Spec 2's row 429. The rest is Axel's reading before the landing.
- **The "Doc text" proposals beyond the line-cite sentence (Spec 3):** applying them is the orchestrator's call.
- **`npm run diagrams`:** not run, since it writes into the worktree. The diagram tree check passes.

Reviewer usage: a87f63d952b088f27 (as the state file records the run), claude-opus-5-5, about 330,000 tokens, 68 tool uses, about 18 minutes.
