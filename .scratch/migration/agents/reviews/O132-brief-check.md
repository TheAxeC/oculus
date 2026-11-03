# Brief check of O132

All commands were run on main at 556218edb (`git log --oneline -1` prints `556218edb Launch the builder of step O133`). The probes are my own `/private/tmp/claude-502/-Users-axelfaes-workspace-research-hub/be0ac0d7-a551-4911-a072-9f76e1bbe399/scratchpad/o132check/probe.mts` and `.../o132check/combo.mts`, run with `npx tsx` from the oculus root and importing `/Users/axelfaes/workspace/oculus/src/lib/data` by absolute path. They plant each text in a mkdtemp hub, run `loadConfig(engineDir(), { hub: dir, other: 'lab' })`, and print `readOtherHub(...).findings` (today) next to `vocabFindings(config, () => 'HUB', textCatalog(config))`. The session's probe at `.../o132/probe.mts` now holds only three texts (`lacks`, `catsonly`, `dupcluster`), so I reran every case of the brief with my own probe. `git diff --stat 849c4c580 556218edb -- src/lib/data tests/data/shapes tests/data/sources/config docs/HELP.md` prints nothing, so the gate and main hold the same files there.

The brief can be dispatched after the fixes below. The ones that matter most:
- **(a)** The write list misses the import lines of `index.ts` and the doc comment of `vocabFindings`.
- **(b)** The test's filter is left open with "...".
- **(c)** C10 repeats an O130 row and checks nothing new, while the ordering requirement has no case.
- **(d)** The head comment of `vocab.test.ts` becomes false and is not named.
- **(e)** The step line's "the value is not read" has no requirement.
- **(f)** G13's text line is not extended.
- **(g)** Verify command 1 times out under load on this machine.

## Names

Command: `grep -rn "readOtherHub\|\bOtherHub\b" src tests docs utils .scratch/migration/agents/guarded.md | grep -v "^docs/diagrams"`. Config: `grep -rn ... config --exclude=local.yml` prints nothing. Diagrams: `grep -rln ... docs/diagrams` prints nothing.

Hits outside "Paths this step writes":
- `src/lib/server/root/watch/portfolio/portfolio.ts:27,610`, the caller. The comment at 603-606 ("each with its own settings") stays true.
- `src/lib/server/root/watch/portfolio/payload.ts:20,51,73` and `src/lib/server/root/watch/build.ts:22,73` use the type `OtherHub`. The type's shape does not change. payload.ts's head comment (lines 15-17, on the primary's readers) stays true.
- `tests/state/forms/choices.test.ts:9,86`, `tests/data/hubs/connection-keys.test.ts:10,175`, `tests/data/hubs/workspace-projects.test.ts:12,53` and `tests/data/sources/config/boards.test.ts:10,327`: none is made false.
  - Their hubs set no vocabulary key, or set one with no wrong word (`grep -n "stages:\|focus_\|tiers:\|statuses:"` over them prints no hub text with one).
  - boards.test.ts filters `key.startsWith('categories')`, and connection-keys.test.ts filters by the message `primary hub`.
- `tests/data/sources/manifests/manifests.test.ts:10,44` is not made false: its labs set `scan`/`collections` only (lines 640-701). It is missing from verify command 1, though `test:quick` picks it up as an importer.
- `.scratch/migration/agents/guarded.md:187`, G124's Code line naming `readOtherHub` for `categories`, stays true.

Command: `grep -rn --exclude=local.yml -- "<name>" src tests docs utils config .scratch/migration/agents/guarded.md README.md`.
- `vocabFindings`: `findings.ts:24,50` (the primary's run, still true) and `guarded.md:254` (G13's Test line, still true but incomplete; see the step line section). Hits inside the write list: `vocab.ts:189` and `vocab.test.ts:12,57,192`.
- "category check": only `src/lib/data/index.ts:621,632`, which are in the write list.
- "vocabulary check": no hit.
- The HELP bullet "`categories` rows a hub writes": only `docs/HELP.md:592`, in the write list.
- describe "the vocabulary's words past its shape": `vocab.test.ts:55` (write list) and `guarded.md:254`.
- The new describe's title: no hit.

Inside the write list, two sentences become false and the brief names neither:
- `tests/data/shapes/catalog-files/vocab.test.ts:6-7`: "The hub's file is given as text, so no file is read for it." The new describe plants a file on disk. Lines 5-6, "the hub's when the hub's value gives it", is wrong for the new describe, where oculus's lanes are filed under the hub's file (C7). Item 4 only asks the head comment to "name the new describe's subject".
- `vocab.ts:1-3`, "as findings of the file each value was read from", is not true for the caller `readOtherHub` under ruling 647 (a): C7's oculus lanes are read from oculus's file and named under the hub's. Item 2 adds a sentence but does not ask for this clause to be reconciled.

Outside the write list, one doc comment becomes false: `vocab.ts:187`, "`fileOf` gives the file a key was read from". `readOtherHub` will pass `() => sources`, which gives the hub's file for oculus's lanes. The write list (`vocab.ts` lines 1-14) does not cover it. Widen the write list to `vocab.ts` 184-188, or reword it as "the file a finding on a key is filed in".

Other documents I read and found still true after the change:
- `docs/templates.md:351-357` ("two words carrying it are a finding naming both") becomes true for every hub; today it is false for a hub other than the primary.
- `docs/HELP.md:563,572,345` and `docs/data-map.md:82,280-300`.
- `docs/apps.md:423` (`config` carries `findings`) needs no change.
- The Findings view's texts (`config/text/views/system/findings.yml`) need no change.
- No new catalog string is needed: the messages are in `config/text/findings.yml:207-213`.

## The step line

Command: `grep -n "^- O132" .scratch/migration/plan.md` gives line 1644. Mapping:
- "readOtherHub runs vocabFindings over each other hub's merged config": item 1, item 4, C1-C7.
- "when its settings file sets a key of config/catalogs/vocab.yml": item 1 and decision 1, with C9 (an audit). No row can tell "run" from "not run", because `vocabFindings` over oculus's own words gives `[]` (`vocab.test.ts:56-59`). The condition is proven by reading only, and the brief should say so.
- "each finding naming that hub's settings file": item 1, and item 4's `[file, key, message]`.
- "as O130 does for categories": item 1 ("as the category check's do") and item 4 ("as O130's describe does").
- "a flag a single word carries set on two words": C1-C3.
- "a focus_clusters row naming no catalog word": C7.
- "a Focus lane's move_writes naming a word the vocabulary lacks": C6.
- "in any hub": item 1 together with C11 (the primary).
- **"and the value is not read": no requirement and no case.** The primary's rows check it (`vocab.test.ts:159-165,198-204`, `oneWordWith(read.config, ...)` toBe undefined). For a hub other than the primary, the words reach the page through `hubWords(config.merged)` (`index.ts:704-708`, used at `:732`), and nothing in the brief points at that.
  - Fix: add to C1-C3 that `oneWordWith(<the hub's merged config>, key, flag)` is undefined, or add a premise naming the reader that passes over the value for every hub's words, with its `file:line`.
- "the documents that say which hubs the check reads say so": items 2 and 3.

Also missing from the landing plan: G13's text line (`guarded.md:252`). The brief says the orchestrator adds the run to G13's Code line and the new describe to its Test line. The behaviour itself, "the words a hub writes are held to that hub's vocabulary, each finding naming that hub's file", belongs in G13's text, as O130's landing put the categories sentence into G124's text (plan.md:1641, "G124's text, Code and Test lines").

## Premises

Each claim of "What is on the tree" reproduces except where marked.
- First bullet (worktree `migration-O132`, base copy `O132-base`, `unused-exports.txt`): **not yet present**. `ls .agents/worktrees/` lists `gate`, `migration-O133`, `O133-base` and logs, with no `migration-O132` or `O132-base`. The brief is untracked (`git status --short` prints `?? .scratch/migration/agents/briefs/O132.md`), so the preparation commit it names does not exist yet. This is consistent with /spec creating the worktree after the brief check. `../O132-base/` relative to `.agents/worktrees/migration-O132` resolves to `.agents/worktrees/O132-base`, which matches bullet 1.
- `readOtherHub` at `index.ts:636-662`, its doc comment at `:629-635`, and `OtherHub`'s doc comment at `:618-622`: confirmed (`sed -n '595,680p'`).
- `sources = join(root.dir, HUB_FILE)` at `:639`, and `fromHubFile(from.categories)` with `categoriesFindings(config, () => sources, textCatalog(config))` at `:640-642`: confirmed.
- The caller at `portfolio.ts:607-611`: confirmed.
- `vocabFindings` at `vocab.ts:189-203`: **off by one**. `wc -l` prints 202, and the function spans 189-202.
- `SINGLE_USE` at `:26-35` with the eight flags listed, and the key cut at `:196`: confirmed.
- `READER_FINDINGS` at `findings.ts:50` with `filesOf(where)` (`keyFile`): confirmed.
- `grep -rn "vocabFindings" src` prints `vocab.ts:189`, `findings.ts:24` and `findings.ts:50` only: confirmed.
- `HUB_LIST` rows 719-743 hold the 25 keys from `palette` to `ticker_categories`, with `categories` at 735, and `hubFileOf` sits at 795-797: confirmed (`sed -n '673,810p' src/lib/data/helpers/hub-names.ts`). `hubKeysOf('catalogs/vocab.yml')` prints the same 25 keys.
- All 25 keys are in `OWN_HUB_KEYS` (`hub-keys.ts:19-43`): confirmed.
- The probe lines C1-C7 match my run word for word. C7's seven lanes are `focus_lanes[3]` review/parked, `[4]` blocked/parked, `[5]` backburner/parked, `[6]` scope/incubate, `[7]` derisk/incubate, `[8]` build/incubate and `[9]` idea/idea, each "the Focus lane <l> names the cluster <c>, which no readable row of focus_clusters has; the lane is not drawn". The brief names the lanes but does not quote these seven messages; the builder needs them.
- C8, C9 (`palette`, `scan: []`) and `stages: { building: null }`: no finding from either function. Confirmed.
- C10: `readOtherHub` today gives `<hub>/.oculus/config.yml categories[7] | categories[7] names no color, so it is drawn in no colour`, and `vocabFindings` gives none. Confirmed.
- G13 at `guarded.md:252-254` and the quoted Test text: confirmed (`sed -n '252,253p'`; `grep -n` puts the Test line at 254).
- `vocab.test.ts` uses `withHub` from `layers-fixture.ts` (lines 15-22): confirmed. O130's describe runs `boards.test.ts:263-337` (`grep -n "describe('the category rows"` gives 263, and `wc -l` gives 337), using `plantScratch` and `readOtherHub(..., loadConfig(engineDir(), { hub: dir, other: 'lab' }))`: confirmed.
- `docs/HELP.md:592` and `vocab.ts:1-12` with the quoted clause at lines 4-5: confirmed. `grep -rn "vocabFindings\|vocabulary check" docs src` outside vocab.ts, findings.ts and docs/diagrams prints nothing: confirmed.
- O133 writes `docs/HELP.md` 400-410 and `docs/diagrams/*`, and no other path of this step (O133.md "Paths this step writes"): confirmed.
- The verify list equals the page: `orchestrator-state.md:6-7` (`verify:` `- npm run test:quick`). Confirmed.

Premises the brief leaves out and the builder needs:
- `named(from, key)` already exists at `index.ts:248-252` ("Whether the hub's own settings file holds a key, by the `from` that loadConfig returned"), and `hubKeysOf(name)` at `hub-names.ts:789-792`. Item 1's selector ("a key of `from`, read by its first segment, whose `hubFileOf` is ...") would add a second form of a rule the tree already holds; the rules file's reuse rule (spec.md:89) asks for `hubKeysOf('catalogs/vocab.yml')` with `named`.
  - The two are equivalent: every vocab-file key of `HUB_LIST` is top-level. `mergeHub` sets `from[path] = HUB_FILE` only for the listed path (`hub-layer.ts:640`) and gives the sub-keys oculus's file (`:645`). My probe's first-segment selection lists only top-level keys for every text.
  - The Read list should add `index.ts:248-252` and `hub-names.ts:783-797`.
- `vocab.test.ts:9` imports `it` from vitest. A file that plants scratch directories takes `it` from `tests/fixtures/scratch.ts` (that file's head comment, lines 5-11), as `boards.test.ts:18` does, so the builder changes that import too.

## Cases and checks

Before and After against the run: C1-C10 hold exactly as quoted (probe output above). The look's combined text (C1 plus C7 in one hub) gives 0 findings today and 9 after (`combo.mts`: `tiers.personal focus_clusters[0].label focus_lanes[3] ... focus_lanes[9]`).

Cases inconsistent with the rules file:
- **C10** is the same input as O130's row 'a row naming no color' (`boards.test.ts:280-283`, the same text read through `readOtherHub`), so it is a second test of one input. Its "the category finding ... before and after" checks O130's code, which this step does not change. Under item 4's filter on vocabulary keys, the C10 row cannot see the category finding at all, and its outcome (`[]`) is the same as C9's.
- **C8, C9 (two rows) and C10** give one outcome (`[]`) in the new table. spec.md:60 asks for "one row per input that gives a different outcome". C9b (no vocabulary key, so the check is not run) differs from C8/C9a (the check runs and finds nothing) only in the path the code takes, not in its output.
  - Recommended: keep C8 and C9b, each named an audit, and drop C9a and C10, or give each kept row a stated reason.
  - Replace C10 with a hub that sets both `categories` (a row with no `color`) and C1's `tiers`. Expected: `[file, 'categories[7]', 'categories[7] names no color, so it is drawn in no colour']` then `[file, 'tiers.personal', 'research, personal each carry default, ...']` (probe text `both`). It is the only input that checks item 1's "The findings come after the category check's", and it shows that both checks run.
- **Item 4's filter** ("whose key is a key vocabFindings gives (`tiers`, `statuses`, `stages`, `lead_statuses`, `focus_clusters`, `focus_lanes`, ...)") is left open. The exact set is the SINGLE_USE keys `stages`, `statuses`, `lead_statuses`, `ticker_categories` and `tiers`, plus `focus_clusters` and `focus_lanes`.
  - A prefix filter on those keys would also take in the merge's shape findings (`focus_lanes.0`, `focus_clusters.0.layout`).
  - For C1-C9 `readOtherHub` today gives an empty whole list, so comparing the whole findings list is stricter. It would also show a finding said twice.
  - Recommended: compare the whole list, or name the exact seven keys.
- **Row titles:** item 4 says "a row per case C1 to C10". C1 to C13 are package ids of this ledger (plan.md: "C1 cockpit: `claude` CLI resolved ..."), and spec.md:44 makes a package id in a test title a defect. The brief should say the titles describe the input and carry no case id.
- C11 asks for a run of `tests/data/sources/config/boards.test.ts`, which the step does not change. That is allowed: it is the guarded test of `readOtherHub`'s categories run (G124), and spec.md:60 asks a step to run the test of the code it touches.

## The question

The goal: a hub other than the primary is held to the vocabulary check over its own merged config, each finding naming its settings file.
- **C1-C7:** cannot pass without the goal. Each expects a finding that `readOtherHub` does not give today (probe "today" is empty), with the hub's file in the `file` column.
- **C8, C9, C10, C11:** can pass without the goal. They are audits by design, as the brief says.
- **Step line:** the "and the value is not read" part has no check (see the step line section). The rest is covered by C1-C7.
- **Item 1:** the trigger condition can pass with the condition missing (running always gives the same output today), so it is judged by reading. The ordering clause can pass unbuilt, because no case has findings from both checks; the "both" row above closes that.
- **Item 2:** checked by reading. It can be done while `vocab.ts:187` and `vocab.ts:1-3` stay false, since the first is outside the write list and the second is not named.
- **Item 3:** the dictated content, "the words a hub writes ... (its flags, its Focus clusters and lanes) are checked ... and each finding names that file", can pass while a reader is still misled. C7 gives findings on oculus's lanes, which the hub never wrote, under the hub's file. The bullet should say that a finding on one of oculus's values that the hub's words make wrong, such as a lane whose cluster the hub's `focus_clusters` leaves out, is also named in that file.
- **Item 4:** cannot pass without the goal if the rows compare `[file, key, message]` with the hub's file, which they do. The filter and C10 issues are above.

## Implied inputs

Each was run with `probe.mts`; the case names are its keys.
- **A hub that sets `categories` and a vocabulary key (`both`).** Expected: the categories finding, then `tiers.personal`. Missing, and it is the only check of the order requirement. Add it (see Cases and checks).
- **A vocabulary key in dotted form (`dotted`, `"tiers.personal": {...}`).** Today it gives `tiers.personal | key tiers.personal is not one the hub's settings file takes; it is not applied`. `from` holds no vocabulary key, so the check does not run and nothing is said twice. Not needed as a row; the merge already covers it.
- **The nested form (`nested`, `tiers:\n  personal:\n    default: true`).** Same as C1. Not needed.
- **A `from` naming a key by its words.** For C3, `from['stages.nascent']` is oculus's file (`vocab.test.ts:220` asserts `'catalogs/vocab.yml'`) and `from['stages']` is the hub's file. The first-segment selector and `named` both count `stages` alone. Not needed as a row.
- **A finding the merge already gives for the same key.**
  - `lanebad` (a lane with no `stages`): the merge refuses the whole list (`focus_lanes.0 | focus_lanes.0 is not a value this key takes`), oculus's lanes stand, and `vocabFindings` gives none, so nothing is said twice. Worth one audit row: a build that read the hub's raw value instead of the merged config would say it twice.
  - `clusterbadshape` (a row with no `layout`): the merge gives `focus_clusters.0.layout | ... must be one of columns, full_width`. The check adds `focus_clusters[0].label` and the ten lanes `focus_lanes[0]` to `[9]`, all under the hub's file under ruling 647 (a). These are different messages, not a repeat. The primary's form of this input is tested (`vocab.test.ts:99-121`); for another hub, C7 covers the same lanes-under-the-hub's-file rule. Optional.
- **Two words carrying `default_lead` (`leadtwice`) and `manifests` (`ticker`).** These give `lead_statuses.other ...` and `ticker_categories.a | paper, a, b each carry manifests ...`. The behaviour is covered by C1-C3; not needed.
- **The primary hub.** `readOtherHub` is not called for it (`portfolio.ts:607-611` filters it out); C11 covers it.
- **A workspace with two other hubs.** `readOtherHub` runs once per hub with no shared state. The config payload joins them with `others.flatMap((one) => one.findings)` (`payload.ts:88`), and the Findings view keys rows by `${finding.file}:${finding.key}:${index}` (`Findings.svelte:131`), so equal key and message in two hubs collide nowhere. Expected: each hub's findings name its own file. Not needed as a row.
- **A Settings write into another hub's vocabulary key.** Already checked over that hub's merged config: `refusedBy` runs `FINDERS = [...READER_FINDINGS, ...]` with `layers.hub` (`config-checks.ts:87-91,183-198`). No change is needed.
- **A hub with an empty or unparseable file (`empty`).** Its one finding is ` | is not a map of keys`; there is no vocabulary key, so the check does not run. Covered by C9b's path.

## ADRs

`ls docs/adr` prints `ls: docs/adr: No such file or directory`. The brief's line 5 is right. None.

## Dictated text

The brief dictates one line of file text: the describe title `'the vocabulary words of a hub that is not the primary'` (`grep -n "the vocabulary words of a hub" .scratch/migration/agents/briefs/O132.md` gives line 36). It holds: ASCII, no history wording, no package id, and the same form as O130's 'the category rows of a hub that is not the primary'.

Items 2 and 3 give the content of the comments and the HELP bullet but dictate no words. "One line, no hard wrap" is an instruction, not text.

## Other checks asked for

- **Layer rule:** `tests/checks/tree/layer-rows.ts:353` gives `data: ['data/**']`, so `src/lib/data/index.ts` may import `sections/vocab.ts`. It already imports the sibling `sections/boards.ts` (`index.ts:61`). `vocab.ts` imports only helpers, model and shapes modules, and none of them imports `data/index.ts` (`grep -ln "data/index\|../index" <those four files>` exits 1), so there is no cycle. `npx vitest run tests/checks/tree/boundaries.test.ts` alone prints `Tests  11 passed (11)`.
- **Verify commands:**
  - All six test files and `utils/unused-exports.sh` exist (`ls` printed each). `test:quick` and `diagrams` are in `package.json:17,23`.
  - **Verify command 1 failed twice on this machine.** Each run printed `FAIL |unit| tests/checks/tree/boundaries.test.ts > layer boundaries > holds across src/lib` / `Error: Test timed out in 5000ms.`, then `Test Files  1 failed | 5 passed (6)` and `Tests  1 failed | 97 passed (98)`, at load averages 8.07 6.63 6.79 (`uptime`). The same file alone passes, 11 of 11.
    - The step does not change that file, but it reads every file under `src/lib`, so the changed files count as related.
    - The brief's "every test passes" for command 1 should allow for this: the spec's rule is that a red line in a file the step does not change is rerun alone and named. Under the state file's line 85 the file could also be tagged slow.
  - Command 1 also leaves out `tests/data/sources/manifests/manifests.test.ts`, which imports `readOtherHub`; `test:quick` runs it anyway.
  - `../O132-base/unused-exports.txt` does not exist yet (see Premises).
- **Paths:**
  - `src/lib/data/index.ts` "lines 600-670" leaves out the import lines the change needs. `hubKeysOf` joins the `hub-names.ts` import at `index.ts:44-54`, and `vocabFindings` needs an import beside `categoriesFindings` at `:61`. Widen the range to 44-61 and 600-670.
  - `vocab.ts` lines 1-14 leaves out `:184-188` (see Names).
  - `docs/apps.md`, `docs/data-map.md` and the Findings view's texts need no change (see Names).
  - The diagrams are in the list. `writes.dot` carries `file:line` labels, so line moves in `index.ts` or `vocab.ts` can change it. They are regenerated, and are shared with O133 as the brief says.
  - `index.ts` is 847 lines (`wc -l`); a handful of lines stays under 880.
- **Report section "before and after":** the Findings view's count on the tab, the rail and the status bar comes from the same list (`allFindings`, `status.ts:469-481`; `fileFindingsCount`, `:455-462`). For the look's hub holding C1 plus C7, the Files section goes from no lab row to 9 rows, and the count rises by 9. The brief names only the view.

## Declined to judge

- Whether `docs/data-map.md`'s "A second hub" section (lines 280-286) should gain a bullet. None of its sentences is made false, it does not say which hubs a check reads, and O130 added none there.
- Whether jscpd (`tests/checks/tree/duplication.test.ts`: 50 tokens over 8 lines, across `tests/`) would flag a new describe body copied from `boards.test.ts:326-336`. I did not run jscpd on a hypothetical file. The varying filter line would likely split the copy into runs under 8 lines (judgment). If it is flagged, the shared helper would go in `tests/data/sources/config/layers/layers-fixture.ts`, which is outside the write list.

Usage: a3a364c925924ff9a, claude-opus-5-5, 226477 tokens, 74 tool uses, 11 min 31 s.

## Closed

Closed at /spec, on main at 8ad17c38b, in `agents/briefs/O132.md`. No finding needs a ruling.

- (a) Paths: the write list names `src/lib/data/index.ts` lines 44-61 and 600-670 and `vocab.ts` lines 1-14 and 184-188.
- (b) The test's filter: item 4 compares the hub's whole findings list, so a finding said twice or out of order fails.
- (c) C10: replaced by the hub that sets both `categories` and C1's `tiers`, the order of the two checks its expected result; C9's `palette` row dropped; C8 and C9 kept as audits with their reasons; C11 is the lane the merge refuses, said once.
- (d) Head comments: item 2 names the head comment of `vocab.test.ts`, the clause of `vocab.ts:1-3` and the doc comment of `vocabFindings` at `:184-188`.
- (e) "The value is not read": the rows of C1 to C3 check that `oneWordWith` over the hub's merged config gives no word, which holds today (`probe3.mts`, quoted under "What is on the tree").
- (f) G13: the landing extends its text as well as its Code and Test lines.
- (g) Verify 1: `boundaries.test.ts` runs alone after the other six files, `manifests.test.ts` added, and a red line in a file the step does not change is rerun alone and named.
- Premises: `vocabFindings` cited at 189-202; `named` (`index.ts:248-252`), `hubKeysOf` (`hub-names.ts:789-792`) and the hub layer's `from` (`hub-layer.ts:640`) are premises, and item 1 uses `hubKeysOf` with `named`; C7's seven lane messages are quoted; `it` from `tests/fixtures/scratch.ts` is a premise and item 4 names it.
- Row titles: item 4 says each title describes its input and carries no case id.
- Item 3: the HELP bullet also says a finding on one of oculus's values the hub's words make wrong is named in the hub's file.
- Report: the before and after names the Findings view's rows and the count on its tab, the rail and the status bar.
- Dictated text: the describe title holds; no line was rewritten or added after the check.
