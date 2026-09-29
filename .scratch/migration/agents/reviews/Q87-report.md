# Q87 report: the duplication check on jscpd (after repair round 1)

Everything in the brief, the cases ruling and repair round 1 is built. One finding is not fixed and needs a ruling: jscpd does not read 16 of the 244 components under `src/lib` at `--min-tokens 50`, so their markup is not compared (see "Findings not fixed").

## Open items of the state file, verbatim

From `tools/oculus/.scratch/migration/orchestrator-state.md` in the main checkout, read at the end of this round:

- None.

## Findings not fixed

**Components jscpd does not read.** jscpd drops a whole `.svelte` file whose file-level token count is under `--min-tokens`, and that count is close to its script's tokens. The file's markup is then never compared.
- Measured with the launcher over `src/lib`, using the markup run's flags: at `--min-tokens 50` the report's statistics give `html sources 228 svelte sources 228`; at `--min-tokens 1` they give 244. `find src/lib -name "*.svelte" | wc -l` is 244.
- A scratch pair with a 5-token script and 11 shared markup lines of 183 tokens is reported at `--min-tokens 10` and not at 17, 20, 30 or 50 (launcher runs on the case fixture).
- The check covers every component the hand scanner covered, except those 16. This is jscpd's behaviour, and the ruled flags keep 50.
- Running the markup run at `--min-tokens 1` and filtering to 50 tokens in the test is not a fix. Over `src/lib` it reports 1 cross-file markup clone where the run at 50 reports 9, so a lower threshold changes which clones jscpd finds, beyond merely admitting more files.
- This is a ruling for the orchestrator. Option (a): accept the gap and state it in the head comment. Option (b): a further step to find a jscpd setting that reads every component. I have not verified that any setting does.
- The case "reports shared markup alone" gives both scripts fifty tokens or more for this reason, and a comment in the case says so.

## Rulings carried

**Cases ruling (round 0), `briefs/Q87-cases.md`:**
1. The import pattern is `(?m)^\s*import\b[^;]*;`.
2. The test runs `node_modules/jscpd/run-jscpd.js` through `execFileSync(process.execPath, ...)`, with JSON reports in folders under the test's scratch directory that are removed after the read. jscpd stays at 5.3.3.
3. Clones inside one file are dropped.
4. The mark is taken over the TypeScript scanner's tokens.
5. The case 2 and case 6 fixtures are fixed.
6. The caret is kept.

**Repair round 1, `briefs/Q87-round1-sent.md`:**
1. jscpd runs twice per group. The code run keeps clones that are neither `css` nor `html`. The markup run adds `(?s)<style[^>]*>.*?</style>` and `(?s)<script[^>]*>.*?</script>` to `--ignore-pattern` and keeps `html` clones only.
2. A clone's count is the smaller of its two extents.
3. The list is regenerated.
4. Four cases guard these changes.
5. The missing first runs are below.
6. The visible changes are below.

## The cases' first run on the unchanged tree

**Round 0.** The cases were appended to the test file before any change and run there: `npx vitest run tests/checks/tree/duplication.test.ts` gave `Tests 4 failed | 13 passed (17)`, 5.41 s.
- **Case 1: red.** It got `... hold the same 8 lines (6e0a9c89c19f)`; the case expects 12 lines and the whole clone's mark.
- **Case 2: red.** The seven-line half is green. The few-tokens half held 60 tokens and was not yet a valid fixture.
- **Case 3: green.**
- **Case 4: green.**
- **Case 5: red.** Nothing was reported, because `String( held )` is not normalised against `String(held)`.
- **Case 6: red.** The mark differed.
- **Case 7: green.**
- **Case 8: green.**

**Round 1, against the base check.** These first runs were missing from the round-0 report. I made a copy of the main checkout's `tests/checks/tree/duplication.test.ts` (403 lines), its allow list and the two fixtures in my scratch folder. The three cases were added in the base check's API, and the copy ran under its own vitest config (`npx vitest run --root <scratch> --config <scratch>/vitest.config.mjs -t "against the base check"`): `Tests 1 failed | 2 passed | 10 skipped (13)`.
- **"passes one file holding the same function twice": green.** The base check skips a window shared inside one file.
- **"keeps the mark when a comment line is added inside the clone in the first file": green.** The base scanner drops comments before it marks a window. In the base API, the case compares the marks `findCopies` reports for the plain pair and for the commented pair, and checks that the allow list built from the plain marks silences the commented pair.
- **"names a copy in the script of two components...": red.** It got `group/one.svelte:1 and group/two.svelte:2 hold the same 8 lines (46e233aa7031)`; the case expects `group/one.svelte:2 and group/two.svelte:3 hold the same 12 lines (93692309eb71)`.
- **Case 9: red.** `grep -c "blockOpens\|meaningful\|WINDOW"` over the base file gives 12.

## DONE / NOT DONE

| Item | State | Proof |
| --- | --- | --- |
| jscpd 5.3.3 devDependency, lock updated | DONE | `package.json:28` `"jscpd": "^5.3.3"`; the lock has `node_modules/jscpd` 5.3.3 `"dev": true` and its eight optional platform packages |
| Check on jscpd, two groups, code run and markup run | DONE | `copies` in `tests/checks/tree/duplication.test.ts`: `detect(base, group, [IMPORTS])` filtered to formats other than `css` and `html`, then `detect(base, group, [IMPORTS, ...BLOCKS])` filtered to `html`, with same-file clones dropped from both |
| Count is the smaller extent | DONE | `heldLines` in the test file; the reasons in `allow-duplication.txt` use it |
| Head comments say both | DONE | test file lines 3-24; `allow-duplication.txt` lines 1-13 |
| List regenerated | DONE | `grep -vc "^#\|^$" tests/checks/tree/allow-duplication.txt`: `191` (641 before) |
| Round-1 cases | DONE | see the revert table |
| The check on this tree | DONE | `/usr/bin/time -p npx vitest run tests/checks/tree/duplication.test.ts`: `Tests 17 passed (17)`, `Duration 4.64s`, `real 7.99` |
| Type check | DONE | `npm run check`: `COMPLETED 1494 FILES 0 ERRORS 0 WARNINGS 0 FILES_WITH_PROBLEMS`, exit 0 |
| Format | DONE | `npm run format:check`: `All matched files use Prettier code style!`, exit 0 |
| Lint | DONE | `npm run lint`: exit 0, no output |
| Comment width over the changed file | DONE | `npx vitest run tests/checks/source/comment-width.test.ts`: `Tests 2 passed (2)` |
| ASCII | DONE | `LC_ALL=C grep -n '[^ -~]'` over the two test files prints nothing, exit 1 |
| Case 9 | DONE | `grep -n "blockOpens\|meaningful\|WINDOW" tests/checks/tree/duplication.test.ts` prints nothing, exit 1 |
| The whole verify list | not run this round | the round says the orchestrator runs it on main at landing; round 0 ran it green (`checks: 6 commands passed`) |

## Each test and the revert that turns it red

Each revert was applied to the test file, the file was run, and the file was restored and compared with `cmp`.

| Test | Revert | Result |
| --- | --- | --- |
| is not held anywhere under src/lib / tests | default allow list emptied | both red (round 0) |
| reports a shared twelve-line function once (case 1) | line count fixed at `MIN_LINES`; start line one past jscpd's | red under each (round 0) |
| passes a copy of seven lines and one under fifty tokens (case 2) | `MIN_LINES` 7; `MIN_TOKENS` 10 | red under each (round 0) |
| passes two files sharing only an import list (case 3) | pattern `^\s*import\b` | red (round 0) |
| names a copy in the script of two components (round-1 case 3) | the script and style blocks skipped in the code run too | `x names a copy in the script of two components by the files and their own lines`, `Tests 3 failed \| 14 passed (17)` |
| passes two components sharing only a style block (case 4) | CSS clones kept | red (round 0) |
| sees through a comment and extra spaces (case 5) | line count fixed at `MIN_LINES`; start line one past | red for the output line; its comment and whitespace half is an audit of jscpd, since the comment sits in the file the fragment is not taken from |
| keeps the mark when a comment line is added in the first file | mark over the whitespace-collapsed fragment | red (round 0) |
| silences the listed clone and not a second one (case 6) | allow list matching the pair without the mark | red (round 0) |
| keeps the groups apart (case 7) | jscpd run over the whole root | red (round 0) |
| reports shared markup alone, from its first line (round-1 case 1) | one run keeping markup clones (`one.format !== 'css'`, and the markup run dropped) | `x reports shared markup alone, from its first line, when the scripts and styles differ` |
| passes two components whose scripts differ in one value (round-1 case 2) | the same one-run revert | `x passes two components whose scripts differ in one value and whose markup differs`, `Tests 3 failed \| 14 passed (17)`, with `x is not held anywhere under src/lib` |
| names the lines both ends hold (round-1 case 4) | count taken as the first file's extent | `x names the lines both ends hold when one extent runs a line further`, `Tests 1 failed \| 16 passed (17)` |
| passes one file holding the same function twice | same-file clones kept | red (round 0) |
| holds every entry to a reason | entry with no reason added | red (round 0) |
| holds the lists to clones still shared | stale entry added | red (round 0) |

Under the markup revert, the stale-entry case was also red before the list was regenerated. It named the six entries the round removes:
- ActivityRail/Pages
- ActivityRail/PagesReset
- CommandCenterView/Tasks
- Data/Domains
- Catalogue/Pages
- Catalogue/Settings

## Visible changes, before and after

**The check's time.** Before is the main checkout's test file; after is this round's. Both ran over copies of the same tree (this worktree's `src` and `tests`), one after the other on this machine, at load average 9.75.

| Check | First pair of runs | Next four runs |
| --- | --- | --- |
| Base check (`Tests 10 passed (10)`) | `Duration 6.34s` | `1.09s`, `1.16s`, `1.06s`, `1.07s` |
| This round's check (`Tests 17 passed (17)`) | `Duration 5.00s` | `3.90s`, `4.05s`, `3.73s`, `4.24s`, `3.18s` |

- The base check is faster once the files are in the file cache.
- The new check runs jscpd twice for each call to `copies`: 8 runs over the tree and 2 for each scratch case.
- The "about 5.6 s" before figure matches the base check's first, cold run here (6.34 s), not its warm runs.

**Script and style edits no longer move a markup clone.** On a scratch copy of the tree I changed `gap: 8px` to `gap: 9px` in `Data.svelte`'s style block and `order: 0` to `order: 7` in `Catalogue.svelte`'s registration. This round's check then gave `Tests 17 passed (17)`. Before this round, the review measured the round-0 check on the same two edits: `Tests 2 failed | 12 passed (14)`, with the Data/Domains and Catalogue pairs reported anew and their entries stale. That before figure is the review's, since the round-0 list is not in this worktree to rerun.

**An install without jscpd's binary fails the check.** With `npm install --omit=optional`, or on a platform with no prebuilt binary, the launcher cannot find its platform package and exits 1. `execFileSync` then throws, and every case that calls `copies` fails with jscpd's message.
- The launcher's lines 31-56 were read (`require.resolve` at 33, the message at 50, `process.exit(1)` at 56).
- A copy of the launcher, with its platform package renamed to one that does not exist, run through `execFileSync` in my scratch folder, printed: `jscpd: Platform package "jscpd-darwin-arm64-absent" not installed. Install it with: npm install jscpd-darwin-arm64-absent`, `Alternatively, build from source: cargo build --release -p jscpd`, `status 1`.
- The check was not run on a real `--omit=optional` install. Any copy inside the worktree still resolves the platform package from `tools/oculus/node_modules`, and this round keeps scratch files inside the worktree.

## Files, line counts before and after (`wc -l`; before is the main checkout)

- `package.json`: 56 before, 57 after.
- `package-lock.json`: 4347 before, 4498 after.
- `tests/checks/tree/duplication.test.ts`: 403 before, 565 after.
- `tests/checks/tree/allow-duplication.txt`: 654 before, 204 after.

## Held entries before and after, by group

- **Before:** 641 by `grep -vc`, 38 under `src` and 604 under `tests`. `grep -c` misses one entry line because the file ends without a newline.
- **After:** 191, of which 47 are under `src` and 144 under `tests`.
- **Content of the regenerated list:** the six markup entries named above are gone, and the markup run gives no new entry in their place. The `src` entries hold 9 cross-file markup clones. Reasons now carry the smaller extent. Three generations of the list were byte-identical (`cmp`).

## Judgment calls (each reversible)

1. **Svelte block names map back to the file.** jscpd names a component's block `File.svelte:<format>`, and the check strips the suffix, so an entry names the file (round 0).
2. **The markup case's fixture.** Both scripts in "reports shared markup alone" hold fifty tokens or more, because of the finding above.
3. **The Catalogue-shaped case's fixture.** It shares a view comment and the `Pane` line after its scripts, as `Catalogue.svelte` and `Settings.svelte` do. That puts the one-run form's markup clone over fifty tokens, so the revert turns the case red: a launcher run of the one-run form on the fixture reports `html 1-26 1-26 75T`, and this round's form reports none.
4. **The Svelte script case stays one test.** The round's third case, "two components sharing a 12-line function in their scripts", is the existing test "names a copy in the script of two components...". It turns red when the code run also skips the blocks.
5. **One extent per case.** The extent case uses a clone whose first file's extent runs one line past the second's: a blank line and `export const` in one file against `export function` in the other. The case asserts 13.

## What in the brief was wrong or impossible

- The `detectClones` API does not exist in jscpd 5.3.3 (ruled at round 0).
- The pattern `^\s*import\b` does not skip imports (ruled at round 0).
- jscpd's `html` format reads script and style bodies as opaque tokens (ruled at round 1).
- The minimum token count also drops whole components (see "Findings not fixed").

## Limitations and sharp edges

- **Start lines.** A reported clone can start on a neighbouring line when that line shares a boundary token with the other file. The count now takes the smaller extent. The start line is still jscpd's.
- **`.gitignore`.** jscpd honours it. No rule in the hub's or oculus's `.gitignore` matches a `.ts` or `.svelte` file under `src/lib` or `tests`; I read both files.
- **Self-reference.** The test file is inside the `tests` group, so an edit to it can change the list. The list was regenerated after the last edit, and a fresh generation compared equal (`cmp`).
- **Blocks skipped in `.ts` files too.** The markup run's block patterns also match inside `.ts` files. Only its `html` clones are kept, so this does not change what is reported.
- **Comma-separated patterns.** jscpd splits `--ignore-pattern` on commas. None of the three patterns holds a comma. A pattern added later that holds one would be split.
