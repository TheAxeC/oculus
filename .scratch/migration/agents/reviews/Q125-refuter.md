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
