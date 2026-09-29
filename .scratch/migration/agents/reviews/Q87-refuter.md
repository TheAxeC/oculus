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
