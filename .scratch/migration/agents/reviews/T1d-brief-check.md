# Step T1d brief check (on main at cf91445bf86eb9f2460887f8ee0eec8f2a9b486a)

The report of the fresh agent of the `spec` skill's "Steps / The brief check", on `agents/briefs/T1d.md`. Pages are cited by section; code and grep hits keep `file:line`. All commands ran from `tools/oculus` on main's head unless stated. Nothing was changed anywhere.

## 1. Names

The step changes test titles (the word "audits" leaves every kept title), deletes and renames test files and cases, deletes helpers, and edits `allow-duplication.txt` entries.

- **Case titles under `tests/views/`, and the word "audits".** `grep -rln "tests/\(views\|shell\|ui\|themes\)" tests/checks` prints `tests/checks/tree/allow-audits.txt`, `audits.test.ts`, `allow-negatives.ts`, `negatives.test.ts`, `allow-duplication.txt`, `scratch.test.ts` and `tests/checks/utils/outside-paths.test.ts`. Two of these are outside the brief's paths, and the change makes them false:
  - `tests/checks/tree/audits.test.ts:202-213` (`findAudits`): a case under `tests/views/` whose body reaches no `render(` (`:86`) must have a title that starts with `audits` (`:205`) or be listed in `allow-audits.txt`. `:232` "is named an audit everywhere under tests/views" fails on any other case. `allow-audits.txt:6` says "nothing is added".
  - `:321` "holds the allow list to cases the tree still has" and `:328` "holds the allow list to the cases the scan still finds" fail when a listed case is deleted, retitled or folded. `grep -c "^tests/views" tests/checks/tree/allow-audits.txt` prints `107`.
  - Item 4 ("the word 'audits' leaves the title of a kept test"), verify item 4, and the Cases verdicts "keep, retitled" therefore turn `npm run test:checks` red for every kept case that does not render. That covers `memories.test.ts:202` (its body calls `answered`, `:147-155`, which never renders), `repositories-menu.test.ts:80/:107/:130/:147` (pure calls of `changeMenu` and `hasMenu`) and every `*.client.test.ts` case titled "audits" (they call `mount`, which `:86` does not count).
  - The deletions the Cases order also turn it red. `memories.test.ts` "asks the folder again...", "lays the wall out in CSS columns...", "draws a sentence of its own per refusal..." and "refuses a file larger..." are entries 72-79 of `allow-audits.txt`. `tinted.test.ts`, `type-scale.test.ts` and `sanitise.test.ts` have entries 97-117.
  - Neither file is in "Paths this step writes". `tests/checks/` is T1e's folder. The brief never names the check or Z349 (`plan.md:1038`, which states this rule of `audits.test.ts`).
- **`tests/ui/frame/client-runtime.ts`.** It is referenced at `vite.config.ts:63` (`environment: './tests/ui/frame/client-runtime.ts'`) and imported by no file (`grep -n "import" tests/ui/frame/client-runtime.ts` prints only `import type { Environment } from 'vitest/environments'`). Item 5 says "a helper nothing imports any more is deleted". Read literally, that deletes the environment of all 13 client test files, three of them in `tests/state` (`find tests -name '*.client.test.ts'`). The brief's helper list does not name it.
- **`views/whole/type-scale.test.ts` and `chips.test.ts`.** `DESIGN.md:223` says "`tests/views/whole/type-scale.test.ts` pins each view's local roles". `DESIGN.md:227` says "`tests/views/whole/chips.test.ts` reads every `<Chip` and `<Tag` site in the tree and fails on...". A deletion or change of either makes those sentences false. The brief's "What is on the tree" does not name them, though Decision 5 rests on them (T1c's brief named `DESIGN.md:128` for its own Decision 5).
- **`tests/checks/tree/negatives.test.ts`** (head comment: every `.not.toContain(` under `tests/views/` needs a reason comment directly above it) constrains every fold under item 2. The verify list catches a lost comment, but the brief does not name the check.
- **`allow-duplication.txt`.** `grep -n "tests/\(views\|shell\|ui\|themes\)/" tests/checks/tree/allow-duplication.txt` prints lines 64 70-74 76 77 79 85-87 89-100 103 104 111-128, as the brief says. `grep -n "tests/state"` prints 30 and 65-110, so lines 70-74, 76, 77, 79, 85-87, 89-100, 103 and 104 are in both T1d's and T1b's paths (see 2).
- **The comments outside the folders that name a file in them.** The brief's grep reproduces exactly: src/lib 7, checks 13, data 3, routes 1, server 6, state 41. Item 8 covers them.

Findings:
- (a) `audits.test.ts` and `allow-audits.txt` are made false by item 4, by verify 4, by the Cases' retitles and deletions, and by any fold or deletion of a listed case. The step cannot reach `checks: 7 commands passed` inside its paths. The rule of `audits.test.ts` (a case that renders nothing is titled "audits") contradicts Z354 ("no audits") and the brief's item 4. Changing either file widens the step into T1e's folder.
- (b) Item 5 would delete `client-runtime.ts`, which `vite.config.ts:63` needs.
- (c) `DESIGN.md:223` and `:227` are unnamed reliances of Decision 5, and item 8 does not list them.

## 2. The step line

`plan.md:227` (working copy; the counts were corrected at this /spec):
- "deletes every test there that breaks `agents/spec.md`'s test rule (its three sentences of Z365 included)": item 1.
- "read file by file, slow-tagged files included": the preamble of "What to build" and "What it must do".
- "may cut harder than one test per behaviour (Z363): a variation of an outcome another case already gives is cut": item 1, bullet 5.
- "cases of one outcome become rows of one table": item 2.
- "a test that passes with its behaviour taken out is deleted": item 1, bullet 4.
- "where a behaviour is tested both in its own module and at a higher level ... the step owning the higher folder deletes the higher test unless it is the one case of the wiring": item 1, bullet 6, for rendered views. Bullet 5 covers non-rendered higher tests. Example: `memories.test.ts:191` and `:212` duplicate `tests/state/life/memories-message.test.ts:154` and `:104`.
- "a test that cannot run well under a second takes the slow tag": item 3 and Decision 1. See 5: Decision 1's measure leaves out import and hook time.
- "Its report lists each removal with the behaviour it guarded or why it guarded none, and the line count of its folders before and after": item 7.
- "Runs beside the other sweeps, its paths disjoint from theirs": "Paths this step writes". The paths are not disjoint.

Findings:
- (a) "its paths disjoint from theirs" is false as briefed. `allow-duplication.txt` lines 70-74, 76, 77, 79, 85-87, 89-100, 103 and 104 are claimed by both T1d and T1b (T1b's brief: "lines 30 and 65-110"), and neither brief says which step removes an entry whose two files lie in both sweeps. Line 64 sits next to T1c's 37-63, and git's merge treats changes on adjacent lines as one hunk.
- (b) The work the step cannot avoid, `allow-audits.txt` (and the rule in `audits.test.ts`), lies in T1e's `tests/checks/`.

## 3. Premises

- Counts: `find tests/views tests/shell tests/ui tests/themes -name '*.test.ts' | wc -l` (run per folder, since zsh does not split the variable) gives 109 + 32 + 52 + 1 = 194. Lines give 34946 + 7447 + 9470 + 132 = 51995. Every subfolder figure matches. Files directly in a top folder: `context-guard.test.ts`, `workbench.test.ts`, `derive.test.ts`, `html.test.ts`, `primitives.test.ts`. Ten `*.client.test.ts`. Matches.
- Slow tags: `grep -rl "@module-tag slow" ...` prints the same four files with the same reason. The `{ tags: \[` grep prints nothing. Matches.
- Audits: `grep -rn "it('audits\|it(\"audits" ... | wc -l` prints `468`, and the per-file top seven match. The grep misses three titles written as template literals: `tests/views/sources/repositories/graph-row.test.ts:282`, `:293`, `:299` (``it(`audits that ...``). The true count is 471.
- Source readers: the brief's pipeline prints `47`. Matches. The `memories.test.ts` and `calendar.test.ts` lines match; `calendar.test.ts:225/:248/:277/:296` are the cases named. `tinted.test.ts:340-400`: the audit cases are at `:336`-`:388` and the file has 394 lines. Imprecise.
- Process and socket grep prints nothing. The timer grep prints `tests/ui/controls/editor/kit/paint.test.ts`. Matches. The hit is `paint.test.ts:525`, `await new Promise((resolve) => setTimeout(resolve, 20));`, which is a fixed sleep (the rules file, the bullet on waiting on a signal). The brief lists it only as a timer cause.
- **`shell/workbench.test.ts` "imports every view inside one case under the 5 s timeout": false on the tree.** `tests/shell/workbench.test.ts:646-648` holds `beforeAll(async () => { ({ registerAll } = await import('../../src/routes/views.ts')); }, IMPORT_MS);` with `const IMPORT_MS = 60000;` at `:146`. The import is already in a `beforeAll`, and the brief's source, `orchestrator-state.md:173`, itself ends "R12d's edge 6 hoists the import out of the timed case". The Cases verdict ("the import moves into a beforeAll") therefore orders work already done.
- Largest files (`find ... -exec wc -l {} + | sort -n | tail`): match. `size.test.ts:28` `const LINES = 900;` matches.
- Folders at 10 items (`git ls-files` per folder): the same ten. Matches.
- Vitest 4.1.11 (`node -e` on `node_modules/vitest/package.json`). `vite.config.ts:35` declares `slow`. Matches.
- Helpers imported from outside (`grep -rn "from '\.[./]*/\(views\|shell\|ui\|themes\)/" tests` outside the folders): the same eight. Missing: `ui/frame/client-runtime.ts`, used by `vite.config.ts:63` (see 1).
- The comments-outside counts: match (see 1).
- `allow-duplication.txt` (128 lines) and its line list: match. `duplication.test.ts:597-606` and `:304`: match.
- Slow-tier sentences: `vite.config.ts:31-35` and `README.md:15` match. **`HELP.md:342` is stale**: `grep -n "module-tag slow" tools/oculus/HELP.md` prints `346:` at cf91445b (it was `342:` at T1c's base b93d69b52). `agents/spec.md:56`: matches.
- `ls tools/oculus/docs` prints `diagrams`. Matches.
- Not on the brief's list: `tests/ui/theme/colours.test.ts` is red on main. `npx vitest run tests/ui/theme/colours.test.ts --reporter=verbose` (load 5.67) printed `× ... the colour rule > holds in every component and stylesheet under ui, shell, views and routes 128ms` with `"lib/views/sources/files/sections/OpenEditors.svelte: .dirty: background: currentColor (not a surface or a hue)"`, `Tests 1 failed | 13 passed (14)`. That is Z359's finding, owed to X3e (unticked at `plan.md:192`), and Z364 lets `test:slow` stay red on it. The brief does not name it, and item 3 may untag the file (see 5), which would put a known red into `npm test`.

Findings:
- (a) The workbench premise is false (the import is already in a `beforeAll` with a 60 s hook timeout).
- (b) `HELP.md:342` should read `:346`.
- (c) The "audits" count misses three template-literal titles (471, not 468).
- (d) `paint.test.ts:525` is a fixed sleep that the bullet on waiting on a signal bans, not only a timer cause.
- (e) The known red of `colours.test.ts` (Z359, Z364) is unnamed.
- (f) The helper list omits `client-runtime.ts`.
- (g) `tinted.test.ts:340-400` should read `:336-388`.

## 4. Cases and checks

- `memories.test.ts:202`, keep and retitle. Keeping it agrees with the test rule (`image_name_repeated` has no other test: `grep -rn "image_name_repeated" src tests` prints only `src/lib/state/life/memories.svelte.ts:77,:92`, `memories.ts:63` and this test). The retitle breaks `audits.test.ts` (see 1).
- `memories.test.ts:222-281`, delete; `:251` kept. Consistent with the rules file's sentence on source text (the bullet on behaviours that need a DOM). It breaks `allow-audits.txt` entries 72-79 (see 1).
- `calendar.test.ts:225/:248/:277` (stylesheet text) and `:296` (`existsSync` of a deleted file), delete. Consistent with the test rule ("stylesheet text") and the source-text sentence.
- `repositories-menu.test.ts:80/:107/:147`, keep and retitle. Consistent with the test rule: a missing command, or a write let through while one is in flight. The retitles break `audits.test.ts`. `:124`, delete: consistent. **`:130`, keep: it also asserts `expect(linked.at(-1)?.rule).toBe(true);`, the same rule-between-groups markup that `:124` is deleted for.** Item 4 forbids rewriting a kept assertion, so the case keeps an assertion that item 1 classes as "markup the look covers". The brief does not say what happens to a kept test that carries one assertion of a deleted kind.
- `views/whole/*`, kept as checks (Decision 5). **Inconsistent with the rules file**:
  - The test rule says "No test of ... stylesheet text, ... or markup the look covers". The source-text sentence says "an assertion over source text ... proves nothing and is not written". Neither limits itself to one component.
  - Decision 5's reading ("`spec.md:61` is about testing one behaviour by its own source text") is not in the rules file. It also disagrees with T1c's Decision 5, which reads the same sentence as "about behaviours that need a DOM". On that reading, tint, type size and chip tone are DOM-drawn appearance and would go.
  - Within T1d's own brief, item 1 deletes "markup the look covers (... a class, a colour, a size)" and one component's style rules (calendar), while Decision 5 keeps `type-scale.test.ts` (a size), `chips.test.ts` (a colour, a capsule class) and `tinted.test.ts` (a surface colour) because they read many files. A source check becomes keepable just by reading more than one file.
  - Decision 5 names three rules (tint, type scale, unsanitised HTML) while the Cases keep all four files. Chip tone is in neither list of reasons.
  - The four files are judged as a group. `sanitise.test.ts` partly renders, and it guards untrusted HTML (the rules file, the bullet on ids, keys and untrusted values), a different cost from a colour. Each needs its own verdict.
  - Keeping a test against the user's test rule (Z354, Z365) is a departure from a ruling (the rules file, the bullet on silent design decisions). It belongs to the user, or the checks follow the rule. A form consistent with the rules file is to treat them as tree checks, which the rules file sets apart from the unit suite ("The tests are the unit suite (`npm test`) and the tree checks (`npm run test:checks`)"). They would then live under `tests/checks/`, T1e's folder.
- `shell/workbench.test.ts`: the premise is false (see 3). Re-measured under Decision 1, the file loses its tag (see 5), against the reason it was tagged.
- `monaco-diff.ts` helper, keep every export: consistent.
- `allow-duplication.txt` stale entry removed, `npm run test:checks` green: consistent. `test:checks` cannot go green for the reason in 1.
- The fold of cases into a table: consistent. It omits a row dropped during a fold, which T1c's round 1 ruling 7 required to be named with the test that holds it. Item 7's "each removal names ... the kept test" covers it only if the builder counts a dropped row as a removal.
- **Decision 4 (rendered views)**, checked against the rules file:
  - It agrees with the test rule's last sentences: a view is rendered only for what no function below it decides, and one case per wire.
  - "The wiring of a press to its call" needs a qualifier. The rules file says a press is a behaviour that needs a DOM and is seen at the look, and that only an effect's timing is tested in a `*.client.test.ts`, with "every other behaviour that needs a DOM stays with the look". Several `tests/views` client files test presses and focus, not effect timing: `commands-keys.client.test.ts:92` "a press sends the source of the button pressed", `editor-saving.client.test.ts` ("Save is pressed by calling the handler"), `tests/ui/forms/multi-select.client.test.ts` (focus and arrow keys).
  - Decision 4 speaks of rendering. It says nothing of mounted client tests, of the server-render press harness `tests/views/sources/repositories/press-on-render.ts` (8 importers), or of whether it applies to `tests/ui` primitives and `tests/shell`.
  - It is consistent as far as it goes, but it leaves the client tests and the press harness to the builder.
- **Decision 1 (slow by cause and by time)** is consistent with the test rule's sentence "a test runs in well under a second or is tagged slow", except that it measures only per-test duration (see 5).

Findings:
- (a) Decision 5 is inconsistent with the test rule ("stylesheet text", "markup the look covers") and with the source-text sentence, contradicts the brief's own item 1, and contradicts T1c's reading of the same sentence. It lumps four files that differ (sanitise against the other three).
- (b) `repositories-menu.test.ts:130` keeps a `.rule` assertion that item 1 deletes in `:124`, and item 4 forbids removing it.
- (c) Decision 4's "the wiring of a press" is not reconciled with the rules file's bullets on behaviours that need a DOM and on effect timing in client files, for the client tests and the press harness.
- (d) Every "keep, retitled" verdict on a case that renders nothing turns `test:checks` red (see 1).

## 5. The question

The goal the step delivers: the tests of the four folders hold only behaviour whose failure costs something, each once at its lowest level, and the quick tier holds no test that cannot run well under a second (Z354, Z363, Z365, and Z351's quick list under 30 s).

- `memories.test.ts:202` case: no; the case is read on its body.
- `memories` source cases deleted: no.
- `calendar` cases: no.
- `repositories-menu` cases: partly. `:130` passes kept while it still asserts markup the look covers.
- `views/whole` kept as checks: **yes**. The brief's checks pass with source-text and stylesheet checks kept, though the rules file says such assertions are not written.
- **`shell/workbench.test.ts` case: yes.** `npx vitest run tests/shell/workbench.test.ts --reporter=verbose` at load 5.50 printed `Tests 55 passed (55)` and `Duration 23.16s (transform 8.35s, setup 0ms, import 17.02s, tests 6.00s ...)`, with the slowest test at `81ms`. Under Decision 1 every test is quick, so the file loses its tag, and a 23 s file enters `npm test`. The every-view compile sits in a `beforeAll` whose 60 s timeout is exactly the load failure the tag was added for (`orchestrator-state.md:173`). That defeats the quick tier.
- Helper case: no. Allow-list case: no. Fold case: no.
- The step line's check ("takes the slow tag") and items 3 and 6 with verify items 2 and 3: **yes**. Decision 1 measures each test's own duration, which leaves out the file's import (collect) time and its hooks. Two runs show it:
  - `colours.test.ts`: `Duration 5.84s (... import 5.47s, tests 270ms ...)`, with every case but the red one under 100 ms.
  - `workbench.test.ts`: as above.

  Item 3's "a cold-start cost ... moves into a `beforeAll`" moves the cost out of the per-test measure without taking it out of `npm test`. Verify 3 then passes with multi-second files in the quick tier. The rule needs to count a file's import and hook time, and to put a cold start into a `beforeAll` of a slow-tagged describe (as T1b's item 3 does for a module-load probe) or give the file the file tag. For `colours.test.ts` the untagging would also put Z359's known red into `npm test`.
- Item 1 (delete) and its report: **yes**. No check tests the claim "the kept test X still holds it". T1c's round 1 ruling 1 found exactly this: the only test of `mover.ts:129-137` deleted. Also, T1b sweeps `tests/state/` side by side from the same base. A T1d deletion justified by "a test of `tests/state/` already holds it" (item 1, bullet 6) can be matched by T1b deleting that same state test, and neither worktree sees the other. The brief asks for no file:line of the held test and no check of it after T1b's landing.
- Item 2 (fold), verify 5: no.
- **Item 4 (retitle), verify 4: yes.** The grep `it('audits\|it(\"audits` passes with ``it(`audits ...`` left at `graph-row.test.ts:282/:293/:299`.
- Item 5 (comments and helpers): no command checks it. Its literal rule would delete `client-runtime.ts`, which verify 1 would catch (red, not a false pass).
- Item 6 (duplication): no. `test:checks` checks it.
- Item 7 (timings): yes, mildly. The before and after times of the quick run are reported with no expectation, so the step passes with that run slower (for example, after untagging the files above).
- Item 8 (doc text): yes, mildly. Nothing names `DESIGN.md:223` and `:227`, which the sweep can make false.

Findings:
- (a) Decision 1 and item 3 measure per-test time only, so files whose cost is import or hook time (`workbench.test.ts` 23.16 s, `colours.test.ts` 5.84 s) pass verify 3 untagged.
- (b) Removals rest on unverified "held by" claims, with a cross-sweep race against T1b.
- (c) Verify 4 misses template-literal "audits" titles.
- (d) Decision 5 lets source and stylesheet checks pass kept.
- (e) `repositories-menu.test.ts:130` keeps a markup assertion.
- (f) The timing of item 7 has no expectation.

## 6. Implied inputs

This is a judgment step over tests. These are the inputs the sweep will meet that the brief does not settle:
- **`*.client.test.ts` files (10 here).** Which are effect timing (kept, per the rules file's bullet on effect timing) and which are presses or focus. Presses and focus are look-only under that bullet: `multi-select.client.test.ts` (focus and arrow keys), `commands-keys.client.test.ts:92` (a press), `editor-saving.client.test.ts` (Save pressed through a handler). Missing; expected: a rule and one case.
- **Client tests titled "audits" that are kept.** They `mount`, which `audits.test.ts:86` does not count as a render, so a retitle is red. Missing (see 1).
- **Non-rendering cases under `tests/views/`** (pure calls of view modules: menus, `card-layout`; state stores driven from a views file, such as `memories.test.ts` `answered`). Kept ones must keep "audits" or be listed. Missing.
- **`.svelte` probes and harnesses** (`shell/fixtures/{ActionsHost,Alpha,Beta}.svelte`, `shell/panes/ShownProbe.svelte`, `ui/forms/OpenGlyphList.svelte`, `ui/menu/{GroupContexts,HeldContexts,LaidOutTooltip,OpenMenu}.svelte`, `ui/tree/TreeHarness.svelte`, `views/shared/SnippetProbe.svelte`, `*.svelte.ts` helpers). Item 5 covers deletion when unused. `client-runtime.ts`, referenced by config and imported by no file, is not covered. Missing; expected: kept.
- **The server-render press harness** `views/sources/repositories/press-on-render.ts` and `harness.ts`. Whether a press through it is "the one case of the wire" under Decision 4. Missing.
- **Menu tests whose items are commands.** Covered by the repositories-menu example. Missing: a kept test that also asserts a divider or order (`:130`).
- **Single-file source checks that guard a cost.** `tests/ui/html.test.ts:199` reads `src/routes/+layout.ts` and asserts `export const ssr = false`. `src/lib/ui/html.ts:22-25` says the sanitiser's pass-through "would then be a hole". Item 1, bullet 3 deletes it as "one component's source text", while T1c's Decision 5 keeps the same kind of check (a forbidden thing entering code, with a real cost). Missing; the brief's rules give a delete that the brief's own reasons argue against.
- **Tree-wide checks outside `views/whole/`**: `tests/ui/theme/colours.test.ts` (Z359, Z364 rely on it), `tests/ui/theme/wall.test.ts`, `tests/views/system/help.test.ts`. `grep -rln "treeFiles\|readdirSync" ...` lists them. Decision 5 covers only `views/whole/`. Missing.
- **Polling waits.** `vi.waitFor` or `vi.waitUntil` appears 9 times (`grep -rn "vi.waitFor\|vi.waitUntil\|waitFor(" ... | wc -l`), in `memories.test.ts`, `memories-add.test.ts`, `sessions/presses.test.ts` and `files/menu/keyed.test.ts`. They are neither a signal nor a fixed sleep under the rules file's waiting bullet, and their timer counts or not under Decision 1. Missing.
- **The fixed sleep at `paint.test.ts:525`.** Item 4 speaks of "a wall-clock margin" only. Missing: a fixed sleep is replaced, not tagged.
- **Files whose cost is import or hooks** (`workbench`, `colours`, and likely `kit/theme.test.ts` with `shiki` at import). Missing (see 5).
- **A `src/` export left with no caller once its only tests go.** Test-only methods such as `state/system/deposit.svelte.ts:134` ("The panel does not call it; tests/views/boards/deposit.test.ts does"), `state/sessions/changes.svelte.ts:62` and `transcript.svelte.ts:225`. T1c's round 1 ("Standards 4") had such an export removed at landing. Missing; expected: named in the report for landing.
- **A shared helper changed in place.** T1c's round 1 ruling 8 held that a fixture rewrite keeps its failure behaviour (it rejects rather than hangs). Decision 2 keeps exports only. Missing.

Findings: each item above marked missing.

## 7. ADRs

- `ls tools/oculus/docs` prints `diagrams`. `ls docs/adr` (at the repository root) prints `No such file or directory`. `grep -n "adr" .agents/plan.yaml` prints nothing. There are no records.

Findings: none.

## Declined to judge

- Whether the `views/whole/` checks (and `colours.test.ts`, `wall.test.ts`) should be kept, deleted, or moved to `tests/checks/` as tree checks. The rules file as written does not keep them. Keeping them is a departure from Z354 and Z365, which is the user's to rule. Moving them is in T1e's folder.
- How `audits.test.ts` and `allow-audits.txt` are resolved (T1d's paths widened into `tests/checks/tree/`, T1e first, or the check changed to match Z354). It changes the step's scope or its order with T1e.
- Whether `npm run test:checks` currently passes on main: not run (the full test or checks suite was out of bounds). The red analysis comes from reading `audits.test.ts:86`, `:202-213`, `:232`, `:321`, `:328`.
- The other two slow-tagged files (`kit/theme.test.ts`, `chips.test.ts`) were not timed. Only `colours.test.ts` and `workbench.test.ts` were run, each alone.
- T1b's brief, read only for agreement. It disagrees with T1d without a stated reason:
  - On the source-text sentence: T1b deletes "an assertion over source text" unconditionally, including a three-store check; T1d deletes only one component's; T1c keeps forbidden-write checks.
  - T1b's item 3 carries the module-load probe sentence (T1c round 1, ruling 2) and its Decision 1 says "the cause rule ... does not move with the load". T1d has neither.
  - T1b has the 95/105 ms case (T1c round 1, ruling 3) and "the assertion holds on the answer" in item 4. T1d has neither.
  - T1b has client tests too (3) and does not cite the rules file's bullet on effect timing.

Agent usage: claude-opus-5-5, about 210k tokens (from the context counter, not verified), 47 tool uses, minutes not measured.


Completion notice: 220,718 tokens, 70 tool uses, 11.1 min (agent a16750a87be697aae).

## Closed

- Names (a), The step line (b), Cases (d) and The question (c) (`audits.test.ts`, `allow-audits.txt`): booked as open item Z376 for Axel; T1d waits for his ruling, and the items, cases and verify 4 that retitle or delete non-rendering cases are settled by it before dispatch. The grep of verify 4 is then written to catch template-literal titles too.
- Names (b): `ui/frame/client-runtime.ts` is kept, named in item 5 and a case.
- Names (c): `DESIGN.md:223` and `:227` are named under "What is on the tree" and in Decision 5; verify 6 greps each deleted path over the documents.
- Names, `negatives.test.ts`: named under "What is on the tree".
- The step line (a): the shared `allow-duplication.txt` lines are removals only, merged by the orchestrator at landing, named in the path list.
- Premises (a): `shell/workbench.test.ts`'s import is in a `beforeAll`; premise and case corrected, and the hook rule of item 3 keeps its tests slow.
- Premises (b): `HELP.md:344` and `:346`. (c): 471, the three template-literal titles named. (d): `paint.test.ts:525` is a fixed sleep, a case and item 4. (e): `colours.test.ts` named red on main (Z359, Z364), kept with its tag. (f): `client-runtime.ts` named. (g): `tinted.test.ts:336-388`.
- Cases (a) and The question (d) (Decision 5): rewritten; each tree check is judged on its own written rule, named per file, `sanitise` on `spec.md:67`; one with no written rule goes to Axel; where checks live is T1a's.
- Cases (b) and The question (e) (`repositories-menu.test.ts:130`): item 1 now drops a deleted-kind assertion from a kept test and lists it.
- Cases (c) (Decision 4 and client tests): item 1 and Decision 7 delete a client case of a press or focus under `spec.md:65`; a press through `press-on-render.ts` stays only as the one case of its wire.
- The question (a) (import and hook time): item 3 counts a hook's time and causes; module import time outside hooks is the suite's shared cost, T1a's to measure.
- The question (b) (holders across sweeps): item 7 names each holder by `file:line`, marked when in another sweep's folder, checked by the orchestrator when both have landed.
- The question (f): item 7 asks a slower quick run to be explained file by file.
- Implied inputs: client tests (Decision 7), `.svelte` probes (kept while imported; `client-runtime.ts` kept), the press harness (item 1), menu tests with a divider (item 1's paragraph), `html.test.ts:199` (a case, keep), tree-wide checks outside `views/whole/` (Decision 5), polling waits (item 4, Decision 6), the fixed sleep (item 4), hook cost (item 3), a `src/` export left with no caller (item 8, now naming the three test-only methods), a helper changed in place (item 5).
- Declined to judge, T1b's brief disagreeing: T1d now carries the same module-load, hook, minimum-over-runs, `vi.waitFor`, client-test and holder sentences as T1b.
- The audits check (Z376): ruled (b); the brief's item 9 rewrites the check with no title escape and no allow list, moves kept non-rendering cases to the folder of the code they call and the tree checks of `views/whole/` to `tests/checks/views/`, and its paths list widens to match. The brief's premises were reread on main at 8d88bbf00 after T1c and T1b landed, with the rulings Z379 to Z388 carried into items 3, 4 and Decision 2.
