# Step Q87 refuter report (reviewer a261d09361fbf1ffa, on .agents/worktrees/Q87, base 34d32b78)

## Verification (rerun by the reviewer)

```
$ (from tools/oculus in the worktree) PATH=$HOME/.nvm/versions/node/v24.21.0/bin:$PATH sh ~/.claude/skills/land/templates/checks.sh .../Q87/tools/oculus/.scratch/migration/orchestrator-state.md </dev/null   -> exit 0
$ npm test
 Test Files  353 passed (353)
      Tests  5664 passed | 1 skipped (5665)
   Duration  77.99s (transform 11.88s, setup 0ms, import 69.92s, tests 212.05s, environment 68ms)
$ npm run check
$ npm run build
$ npm run format:check
$ npm run lint
$ ! LC_ALL=C grep -rna '[^ -~]' src tests
checks: 6 commands passed

$ /usr/bin/time -p npx vitest run tests/checks/tree/duplication.test.ts
      Tests  14 passed (14)
   Duration  2.29s (transform 52ms, setup 0ms, import 536ms, tests 1.67s, environment 0ms)
real 4.40
   (report: Duration 1.63s, real 3.37; same order, machine load differs)

$ grep -vc "^#\|^$" tests/checks/tree/allow-duplication.txt      -> 197
$ grep -v "^#" ... | grep -c "^src/"                             -> 53
$ grep -v "^#" ... | grep -c "^tests/"                           -> 144
  main checkout (base file, 654 lines): grep -vc -> 641; ^src/ 38; ^tests/ 604; file ends without newline (od -c), so 642 entry lines, as the report says
$ grep -n "blockOpens\|meaningful\|WINDOW" tests/checks/tree/duplication.test.ts   -> nothing, exit 1
$ wc -l (main checkout): allow-duplication.txt 654, package.json 56, package-lock.json 4347, duplication.test.ts 403; worktree: 209, 429 (test), matches the report
$ git status --short (after every run of mine)
 M package-lock.json
 M package.json
 M tests/checks/tree/allow-duplication.txt
 M tests/checks/tree/duplication.test.ts
?? .scratch/migration/agents/reviews/Q87-report.md
  no jscpd-report.json anywhere outside node_modules (find), no oculus-jscpd-* or oculus-duplication-* left in os.tmpdir()

jscpd 5.3.3 launcher with the test's flags and the ruled pattern, report into my scratch folder:
 src/lib: sources 1233, 103 clones {typescript 50, css 31, html 22}; non-CSS across two files: 53
 tests:   sources 393, 220 clones {typescript 220}, 76 same-file; across two files: 144
 (the report's 72 non-CSS / 19 same-file / 53 and 220 / 76 / 144 reproduce)
Under the brief's old pattern ^\s*import\b over a copy of the base tree: src/lib 1261 sources, 133 clones {typescript 57, css 54, html 22}; tests 393 sources, 240 clones (brief premises reproduce).
Allow list: no duplicate <a> <b> <mark> triple (sort | uniq -d prints nothing); all 197 reasons have the one shape "the same N lines at N and N, to fold into one place".

Reverts, each on a copy of the test in my scratch folder (src/lib copied, node_modules linked, allow list = the 53 src entries), never in the worktree:
 unchanged copy: Tests 14 passed (14)
 stale entry "career.ts collections.ts 000000000000 ..." appended: x holds the lists to clones that are still shared -> 1 failed
 Catalogue/Settings entry removed: x is not held anywhere under src/lib (names the 171-line clone) -> 1 failed
 markOf over whitespace-collapsed fragment: x src/lib, x keeps the mark when a comment line is added..., x holds the lists -> 3 failed
 same-file filter (line 190) removed: x src/lib, x passes one file holding the same function twice -> 2 failed
 CSS filter (line 187) removed: x src/lib, x passes two components sharing only a style block -> 2 failed
 IMPORTS back to ^\s*import\b: x src/lib, x passes two files sharing only an import list -> 2 failed
 detect over root instead of join(root, group), -t "groups apart": x keeps the groups apart -> 1 failed

Mark stability (real clone career.ts:32 / collections.ts:45, copied to scratch, first-sorted file edited):
 unchanged, two runs: 0b53d19ffb40, 0b53d19ffb40
 comment line added inside the clone in career.ts: 0b53d19ffb40 (lines 9 -> 10)
 "parsed   =   parse( text );" in career.ts: 0b53d19ffb40, and again on a second run
 Catalogue.svelte + Settings.svelte copied, two runs: 18caf1b52c98 both

Time, old check against new (scratch copies of the worktree tree, node_modules linked):
 old test file from main: Tests 10 passed (10), Duration 5.57s, real 6.41
 new test file:           Tests 14 passed (14), Duration 2.42s, real 3.18
```

## 1. Spec

- `tests/checks/tree/allow-duplication.txt` (entries for `Catalogue.svelte`/`Pages.svelte` and `Catalogue.svelte`/`Settings.svelte`), quoted: `src/lib/views/system/workbench/Catalogue.svelte src/lib/views/system/workbench/Settings.svelte 18caf1b52c98 the same 171 lines at 1 and 1, to fold into one place`. `Settings.svelte` has 49 lines (`wc -l`), and jscpd's own report gives its end of the clone as lines 1-32. The two files are not the same: `Catalogue.svelte:9` is `order: 0` and `Settings.svelte` has `order: 1`, and their script bodies differ. jscpd's `html` format reads a component's `<script>` and `<style>` bodies as a few opaque tokens (57 tokens over 171 lines), so the "clone" is the shape `<script module>...</script><script>...</script>` and not shared code. The brief asks for an entry per clone "with its reason naming where the first shared lines sit". This reason is false, and the entry holds something that is not a copy. The same kind of html clone runs into a script or style body whose text differs in six held `src` entries. Their spans are unequal and the fragment contains `<script` or `<style` (my s3/s4 listing): ActivityRail/Pages 47 vs 45, ActivityRail/PagesReset 47 vs 37, Data/Domains 40 vs 29, CommandCenterView/Tasks 89 vs 72, Catalogue/Pages 171 vs 223, Catalogue/Settings 171 vs 32. I read Data/Domains in full: 11 markup lines are shared (Data.svelte:155-165 against Domains.svelte:104-114), then two different `<style>` blocks. The other five were judged only from the spans and the fragment heads.
- Brief case 4 and decision 2 ("CSS clones are dropped, as today's check drops the style block"; "a style block is not a copy"): the CSS filter `if (one.format === 'css') continue;` (duplication.test.ts:187) drops only clones jscpd tags `css`. An `html` clone that runs into a `<style>` block keeps the style text in its extent and its mark (Data/Domains, ActivityRail/Pages, ActivityRail/PagesReset). The case 4 test (line 339) covers only two components that share nothing but a style block, so no test catches this.
- The report gives no first run on the unchanged tree for the two cases the ruling added ("passes one file holding the same function twice", line 400; "keeps the mark when a comment line is added inside the clone in the first file", line 366), or for "names a copy in the script of two components" (line 327). For case 9 the first-run entry is "a grep, run at the end", not its result on the unchanged tree. The first-run section lists cases 1 to 9 from a 17-test run only.
- Dependency: `package.json` adds only `"jscpd": "^5.3.3"` (devDependencies). The lock's top level adds only `jscpd`. The lock also adds the eight optional platform packages `jscpd-{darwin-arm64,darwin-x64,linux-arm64-gnu,linux-arm64-musl,linux-x64-gnu,linux-x64-musl,windows-arm64-msvc,windows-x64-msvc}` 5.3.3 (`"dev": true, "optional": true`), and `node_modules` holds only `jscpd-darwin-arm64` of them. No other package is added. No finding.

## 2. Proof

- `duplication.test.ts:210` (output line `hold the same ${one.lines} lines`) and the allow list reasons: `lines` is jscpd's count for the first file's extent. For 26 of the 53 held `src` clones and 36 of the 144 held `tests` clones the two extents differ in length (my s4 count). Most differ by one or two lines (the report states this as a limitation). For the six html entries above the claim "hold the same N lines" is false by 11 to 139 lines.
- Case 5's comment-and-whitespace half (line 358) stays green whatever this step's code does, because the comment sits in the second-sorted file and the fragment comes from the first. The report states this as an audit, so this is not an unstated gap. The ruling's first-file case (line 366) turns red when the mark is reverted (checked above).
- Every revert the report names that I reran turns its test red as claimed: stale entry, CSS filter, same-file filter, mark, import pattern, group scoping. I did not rerun the `MIN_LINES`/`MIN_TOKENS`/start-line/`.svelte:` suffix reverts (see Not checked).
- Counts and paths in the report reproduce (197; 53/144; 641 with 38/604 and the missing trailing newline; 72/19/53 and 220/76/144; line counts before and after). The single-file test time differs from the report's (2.29s/4.40 real against 1.63s/3.37). I read that as machine load, not a false claim.

## 3. Standards

- `tests/checks/tree/allow-duplication.txt:5-6` (head comment, rewritten by the diff): "The reason says how many lines the clone runs and the line it starts on in each file". For the html entries above the count is the first file's extent only, and for Catalogue/Settings it is more lines than `Settings.svelte` holds. Under spec.md ("A sentence in a document or a head comment that the change makes false is a defect of the change"), the sentence is false for those entries.
- `tests/checks/tree/duplication.test.ts:3-8` (head comment): "reports each run of tokens two places share ... A clone in a component's style block is dropped, since a repeated CSS rule is not a rule written twice". Style text is kept inside html clones (Data/Domains), and the Catalogue/Settings "run of tokens" is not shared code, so the sentence overstates what the check does.
- The grep of removed or renamed names (`blockOpens`, `meaningful(`, `WINDOW`, `findCopies`, `markOf`, `allow-duplication`, "8 identical", "eight identical", `filesUnder`, `duplication.test`) over DESIGN.md, HELP.md, README.md, docs, bin, tests, src, config and the ledger's spec.md hits only unrelated homonyms (`WINDOW` in the calendar tests, a local `markOf` in `tests/views/system/workbench/settings.test.ts:43`, a local `filesUnder` in `tests/routes/shape.test.ts:21`, `WINDOW_DAYS` in src). No document mentions jscpd or the duplication check (`grep -rni "duplicat\|jscpd"`). `tests/server/core/paths.test.ts:80` mentions "a later duplication pass" in general terms, and that stays true.
- ASCII: `LC_ALL=C grep -n '[^ -~]'` over the two test files and package.json prints nothing. There is no step id or date in either file (grep for `Q[0-9]+` and `20..-..` prints nothing). The test file has 429 lines, under the limit. No file-scope mutable is added: `HELD`, `DELIBERATE` and constants are as before, and the old file-scope `made` array is removed. No finding beyond the two above.

## 4. Behaviour

- A developer who edits code that is not duplicated now gets the duplication check red. On a scratch copy of the tree, the only change `gap: 8px` to `gap: 9px` inside `Data.svelte`'s `<style>` gave: `x is not held anywhere under src/lib` with `+ "src/lib/views/sources/data/Data.svelte:155 and src/lib/views/structure/domains/Domains.svelte:104 hold the same 40 lines (e7ee5d21800b)"`, and `x holds the lists ...` with `+ "... Data.svelte and ... Domains.svelte (33e97fb9b039)"`, `Tests 2 failed | 12 passed (14)`. The only change `order: 0` to `order: 7` in `Catalogue.svelte`'s registration gave four failure lines, both Catalogue entries reported anew under mark `1a3eca133ac9` and both held entries (`18caf1b52c98`) stale, `Tests 2 failed | 12 passed (14)`. The old hand scanner did not report these pairs at all, so a style or script edit in these six component pairs is a new way for `npm test` to go red, and the developer must regenerate list entries for code that was never copied. The report does not state this. Its "limitations" section describes extents running onto neighbour lines, not html clones that span whole script and style bodies.
- Time of the check: 5.57s before, 2.42s after (Duration, scratch copies, same tree). The report gives only the after time.
- On a platform with no prebuilt binary, or on an install with optional dependencies omitted (`npm install --omit=optional`), the launcher exits 1 and both tree tests and the stale test fail with jscpd's message. The report states the first case and does not name the `--omit=optional` case.
- jscpd honours `.gitignore`, so a gitignored `.ts` or `.svelte` file under `src/lib` or `tests` is no longer read, where the hand scanner read every file. The report states this, and that no rule matches today.
- Nothing is written outside the system temporary directory: the report folder comes from `scratchDir` and is removed in `finally` (lines 124-154), and I found no leftovers after my runs (`git status --short`, `find`, tmpdir listing).

## Not checked

- The reverts I did not rerun: line count fixed at `MIN_LINES`, start line one past jscpd's `start`, `MIN_LINES` 7, `MIN_TOKENS` 10 (cases 2 and the component case), the `.svelte:<format>` suffix kept, the default allow list emptied, and an entry with no reason.
- CommandCenterView/Tasks, ActivityRail/Pages and ActivityRail/PagesReset were judged from jscpd's spans and fragment heads, not read in full.
- Whether any of the 144 `tests` clones or the other 47 `src` clones are also false copies. I read none of them beyond the samples: allow list lines 13-25, 55, 60-66, 150-155 and 205-209.
- The behaviour of jscpd on Linux or Windows binaries.
- Whether the markup mark is stable across an HTML comment or an apostrophe in markup text. The ruling asks only for same-run stability, which I checked on one pair.

## Usage

Reviewer: 167,477 tokens, 44 tool uses, 599 s (from its completion notice).

## Repair round 1, refuted

### Verification

From `tools/oculus` in the worktree, `PATH=$HOME/.nvm/versions/node/v24.21.0/bin:$PATH sh ~/.claude/skills/land/templates/checks.sh .../Q87/tools/oculus/.scratch/migration/orchestrator-state.md </dev/null`:
```
 FAIL  tests/server/git/git-ops.test.ts > through the endpoint, with the real operations > routes each action to its own operation with its own fields
Error: Test timed out in 5000ms.
 Test Files  1 failed | 352 passed (353)
      Tests  1 failed | 5666 passed | 1 skipped (5668)
   Duration  140.10s
checks: failed with exit 1: npm test
```
The step does not change `git-ops.test.ts`. Run alone, `npx vitest run tests/server/git/git-ops.test.ts` gave `Test Files  1 passed (1)` and `Tests  37 passed (37)`. The script stops at the first failure, so I ran the other five commands by hand:
```
npm run check         -> COMPLETED 1494 FILES 0 ERRORS 0 WARNINGS 0 FILES_WITH_PROBLEMS, exit 0
npm run build         -> exit 0
npm run format:check  -> All matched files use Prettier code style!, exit 0
npm run lint          -> exit 0
! LC_ALL=C grep -rna '[^ -~]' src tests -> exit 0
git status --short    -> M allow-duplication.txt, M duplication.test.ts, ?? Q87-report.md (no leftovers)
```
Reruns of what the report quotes:
```
npx vitest run tests/checks/tree/duplication.test.ts -> Tests 17 passed (17), Duration 4.57s, real 6.15
grep -vc "^#\|^$" allow-duplication.txt -> 191; ^src/ 47; ^tests/ 144
wc -l (worktree): package.json 57, package-lock.json 4498, duplication.test.ts 565, allow-duplication.txt 204
wc -l (main): 56, 4347, 403, 654
grep -c "blockOpens\|meaningful\|WINDOW" over main's duplication.test.ts -> 12
Open items in main's orchestrator-state.md:130 -> "- None." (the report quotes the same)
```
First runs against the base check. I copied main's `duplication.test.ts`, its allow list, `scratch.ts` and `reason.ts` into `scratchpad/Q87-round1-refute/base` over copies of the worktree's `src` and `tests`, added the three cases in the base API, and ran with `-t "refuter against"`:
```
Tests  1 failed | 2 passed | 10 skipped (13)
x R names a copy in the script of two components ...
-   "group/one.svelte:2 and group/two.svelte:3 hold the same 12 lines (93692309eb71)",
+   "group/one.svelte:1 and group/two.svelte:2 hold the same 8 lines (46e233aa7031)",
```
This matches report correction 5 exactly.

Reverts, each applied to a copy of the new test in `scratchpad/Q87-round1-refute/tree` (with `src` and `tests` copied and `node_modules` linked), run, then restored:
```
unchanged copy                                  -> Tests 17 passed (17)
one run, html kept in code run, markup run gone -> x src/lib, x passes two components whose scripts differ..., x reports shared markup alone... (3 failed)
markup run without the block patterns           -> the same three red
code run also skips the blocks                  -> x names a copy in the script of two components..., x under tests, x holds the lists... (3 failed)
count = first extent                            -> x names the lines both ends hold... (1 failed)
count = Math.max                                -> x names the lines both ends hold... (1 failed)
```
Launcher runs over `src/lib` with the check's flags, the reports going to my scratch folder:
```
markup run: 16 html clones, 9 cross-file (RailPages/Catalogue, Radar/Venues, ChangesRepo/ChangesTouched, Data/Venues, DatasetCard/VenueCard, DatasetCard/DomainCard, Facets/Facets, VenueCard/DomainCard, DomainCard/LineCard); no html fragment holds "<script" or "<style"
code run:   50 typescript clones; none of their fragments holds "<script" or "<style"
markup run formats: html sources 228, svelte 228 (of 244 components); at --min-tokens 1: 244 and 244, 1 cross-file html clone
```
Time. I ran the base check and the new check alternately, over the same copied tree, at load average 4.92 to 5.45:
```
base: 5.21s (first run), then 1.16s, 1.26s, 1.26s     (Tests 10 passed)
new:  4.01s, 4.10s, 4.25s, 3.40s                      (Tests 17 passed)
```
This reproduces the report's shape: the base check takes about 1.1 to 1.3 s once the files are cached, and the new check 3.2 to 5.0 s.

The edits to a script and a style block, reproduced on the scratch tree: I changed `gap: 8px` to `9px` in `Data.svelte` and `order: 0` to `7` in `Catalogue.svelte`. The new check then gave `Tests 17 passed (17)`.

### Spec

Round items 1 to 4 are closed:
- The six entries are gone from the allow list, and no entry takes their place.
- The nine cross-file markup entries that stay match the markup run's clones, and none of their fragments holds a block.
- Counts are the smaller extent. For example, `Menu.svelte` 53-90 against `MenuOpener.svelte` 21-42 is listed as 22.
- The three new cases, and the existing script case, each go red under their revert.

Report corrections 5 to 8 are made and reproduce.

- The builder's "not fixed" finding names the wrong cause, and the tree loses nothing to it today. I copied each of the 244 components alone into a scratch folder and ran the launcher on it (`percomp.mjs`, output in `percomp.txt`). The markup run at 50 drops 16 components: TabView, CloseQuestion, RowButton, Search, CodeText, Checkbox, FileChooser, Toolbar, TreeView, Dot, CommandCenter, NewIdea, RemoveAccount, Reveal, SourceToolbar and ShowPath.
  - Each of the 16 has fewer than 50 markup tokens once the scripts, styles and imports are skipped: between 16 and 48 (for example TabView `html=1/34`, CommandCenter `html=1/47`, ShowPath `html=1/36`).
  - Their scripts are not short. CommandCenter's is 1551 TypeScript tokens, ShowPath's 686, TreeView's 318 and FileChooser's 135.
  - Every component the markup run does read has 51 markup tokens or more. The smallest are `ui/frame/Empty.svelte` at 51 and `NoAccounts.svelte` at 52.
  - So none of the 16 could hold a markup clone of 8 lines and 50 tokens.
  - The code run drops only `SourceToolbar.svelte`: 42 tokens in the whole file, a 15-token script and a 37-token markup.
- The check still has a real blind spot, and the report does not describe it. jscpd reads no component whose script and style blocks together hold fewer than 50 tokens (the "svelte" format count), however long its markup. Scratch pairs sharing the same 11 markup lines (183 tokens), from `scratchpad/Q87-round1-refute/shortscript`, all through the markup run at 50:
  - (a) Scripts of about 5 tokens and no style: `sources 0`, no clone.
  - (b) No script at all: `sources 0`, no clone.
  - (d) The same 5-token scripts plus a style block of 70 or more tokens: `css=2/146 html=2/366 svelte=2/184 clones=1 html 5-15 183T`.
  - (e) No script, with that style block: reported.

  A markup copy between two such components passes the suite, where the base hand scanner would report it. That falls short of the brief's "a copy added to either group from now on fails the suite". No component in the tree today has 50 or more markup tokens and is dropped (`percomp.txt`), and no component lacks a script block (`grep -L "<script"` prints nothing).

### Proof

- The report's cause for the 16 dropped components is not reproduced: "that count is close to its script's tokens" and "a component whose script is short". The evidence under Spec shows the drop follows the markup token count for 15 of them, and the gate is the script and style tokens together for the case the test fixture guards. The report's numbers do reproduce: html and svelte sources 228 at 50 and 244 at 1, and 1 cross-file markup clone at `--min-tokens 1`.
- Every other closure I reran reproduces. See Verification.

### Standards

- `tests/checks/tree/duplication.test.ts:442-443`: `// Each script holds fifty tokens or more: jscpd does not read a component whose script is shorter, markup and all.` This is false as written. A component with a 5-token script is read, and its markup clone reported, when its style block brings the script and style tokens to 50 or more (scratch pair d). A component with no script and such a style is read too (pair e). The gate is the script and style blocks together, not the script.
- `tests/checks/tree/duplication.test.ts:3-5`: `reports each run of tokens two places share: eight lines and fifty tokens at least`. Since the count became the smaller extent, three held entries read under eight lines:
  - `allow-duplication.txt:30` `deposit-routes.ts git-routes.ts 2e395e19649f the same 6 lines at 176 and 266` (jscpd extents 176-184 and 266-271: the same tokens reflowed onto 6 lines in `git-routes.ts`)
  - `:32` `hpc/parse.ts state/system/hpc.ts 8ead1c0cdafe the same 7 lines` (extents 25-33 and 20-26)
  - `:115` `git-workspaces.test.ts git.test.ts a11022f63461 the same 6 lines` (extents 91-100 and 550-555)

  The check's output for such a clone ("hold the same 6 lines") contradicts the head comment's floor of eight.
- `tests/checks/tree/duplication.test.ts:17-18`: `the smaller of its two extents, since jscpd can end one extent on a line the other does not reach`. The three entries above differ because the same tokens are laid out on fewer lines in one file, not because an extent ends on an extra line, so the reason covers only part of what the rule handles.
- No history, step id or date in either file. ASCII is clean. The test file is 565 lines.

### Behaviour

- The check is slower once files are cached: before about 1.1 to 1.3 s, after 3.4 to 4.3 s on this machine (see Verification), since it now runs jscpd twice per group. The report states this with before and after. No further finding.
- A component whose script and style together hold fewer than 50 tokens is not checked for markup copies. Before, such markup was compared line by line; after, it is not compared. The report states a different mechanism (see Spec).

### Not checked

- Why jscpd reports 1 cross-file markup clone at `--min-tokens 1` against 9 at 50. I reproduced the numbers only.
- Whether any of the 144 `tests` entries, or the `src` TypeScript entries beyond the ones quoted above, is a false copy. I checked only the entries named above against the launcher's extents.
- The report's claim that three generations of the list were byte-identical. The check passed on each of my 6 runs over the same tree, but I did not regenerate the list.
- The real `npm install --omit=optional` case and non-darwin binaries.
- The reverts from round 0 that this round did not touch.

### Usage

Reviewer (this run): token count and elapsed time not measured from inside the agent. Roughly 50 tool calls.
## Closed

Round 1 was the step's last. Each finding of the two reviews:
- First review: closed by round 1, as the round 1 review's verification and reverts show.
- Round 1, Spec 2 and Behaviour 2 (a component whose script and style blocks together hold fewer than fifty tokens is not read by the markup run): fixed on main at landing. The markup run reads every component as HTML (`MARKUP_FORMATS`, `--format html --formats-exts html:svelte`), and the case "reports shared markup between two components whose scripts are short and which have no style" guards it: red with the markup run in the Svelte format (`Tests 1 failed | 17 passed (18)`), green with the fix (`Tests 18 passed (18)`). Over the tree the markup run gives the same 9 cross-file clones under `src/lib` and 0 under `tests` in both formats, so the allow list is unchanged.
- Round 1, Spec 1 and Proof 1 (the builder's cause for the 16 components the markup run skipped): corrected in the landing booking.
- Round 1, Standards 1 (`duplication.test.ts:442-443`): the false comment removed at landing.
- Round 1, Standards 2 and 3 (the head comment's eight-line floor, and the reason for the smaller extent): rewritten at landing. The head comment says a clone runs over eight lines at least in one of the two files, that the count is the smaller extent since one file can lay the same tokens on fewer lines or end its extent on a line the other does not reach, and that the count can therefore be under eight.
- Round 1, Behaviour 1 (the check's time): stated in the report with before and after; the booking quotes the time on main.
