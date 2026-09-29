# Q87 report: the duplication check on jscpd

Everything in the brief is done, under the cases ruling in `agents/briefs/Q87-cases.md` (round 0).

## Open items of the state file, verbatim

- None.

## The cases' first run, on the unchanged tree (the hand scanner)

The cases were written as tests and appended to `tests/checks/tree/duplication.test.ts` before any code change. `npx vitest run tests/checks/tree/duplication.test.ts` gave `Tests 4 failed | 13 passed (17)`, 5.41 s.

- **Case 1: red.** The scanner reported `group/one.ts:1 and group/two.ts:1 hold the same 8 lines (6e0a9c89c19f)`, where the case expects 12 lines and the mark of the whole clone. The hand scanner reports a fixed 8-line window and marks that window.
- **Case 2: red.** The seven-line half passed. The under-50-tokens half held 60 tokens, so it was not yet a valid fixture (fixed under the ruling's item 5).
- **Case 3: green.**
- **Case 4: green.**
- **Case 5: red.** Nothing was reported, because the hand scanner does not normalise `String( held )` against `String(held)`.
- **Case 6: red.** The mark differed, for the same cause as case 1.
- **Case 7: green.**
- **Case 8: green.**
- **Case 9:** a grep, run at the end.

## Cases the brief's rules got wrong, and the rulings

- **Case 3 and the import pattern.** Under the brief's `ignorePattern` `^\s*import\b`, jscpd 5.3.3 reports case 3's fixture as a clone (`group/one.ts:1 group/two.ts:1 9L 57T`). jscpd matches the pattern against the whole file without the multiline flag, so `^` anchors only at the file start. Ruled (a): `(?m)^\s*import\b[^;]*;`.
- **The programmatic API.** jscpd 5.3.3 is the Rust engine and has no Node API: its README says at line 162 "Rust crate API; no Node.js API", and the package holds only `run-jscpd.js` and `platform-map.js`. Ruled (a): the test runs `node_modules/jscpd/run-jscpd.js` through `execFileSync(process.execPath, [...])`, and the JSON report goes to a folder in the test's scratch directory, removed after the read.
- **Clones inside one file.** Ruled: dropped beside the CSS clones, with a case.
- **The mark.** Ruled: the first 12 hex digits of the SHA-256 of the fragment's tokens as `ts.createScanner` reads them (skipTrivia on), joined by one space. It comes with a case: a comment line inside the clone in the first-sorted file keeps the mark.
- **Case 2 and case 6 fixtures.** Fixed as proposed: case 2's thin half is 12 lines of `f();` (48 tokens, asserted), and case 6's gap lines end on different tokens.
- **The version caret.** `package.json` keeps `"jscpd": "^5.3.3"`.

## DONE / NOT DONE

| Item | State | Proof |
| --- | --- | --- |
| 1. jscpd 5.3.3 as a devDependency, lock updated | DONE | `npm install --save-dev jscpd@5.3.3`; `package.json:28` `"jscpd": "^5.3.3"`; `package-lock.json` gains `node_modules/jscpd` 5.3.3 `"dev": true` and its platform packages |
| 2. The check on jscpd, two groups, 8 lines, 50 tokens, three formats, imports ignored, CSS and same-file clones dropped, output line and mark as ruled, hand scanner gone | DONE | `npx vitest run tests/checks/tree/duplication.test.ts`: `Tests 14 passed (14)`, `Duration 1.63s` (wall `real 3.37` by `/usr/bin/time -p`) |
| 3. Ratchet kept, list regenerated | DONE | `grep -vc "^#\|^$" tests/checks/tree/allow-duplication.txt`: `197` (641 before) |
| 4. Cases rewritten over jscpd | DONE | the 14 cases above, and the revert table below |
| Case 9 | DONE | `grep -n "blockOpens\|meaningful\|WINDOW" tests/checks/tree/duplication.test.ts` prints nothing, exit 1 |
| Verify list | DONE | `checks.sh`: `Test Files 353 passed (353)`, `Tests 5664 passed \| 1 skipped (5665)`; svelte-check `0 ERRORS 0 WARNINGS`; `✓ built in 7.21s`; `All matched files use Prettier code style!`; eslint silent; `$ ! LC_ALL=C grep -rna '[^ -~]' src tests`; `checks: 6 commands passed`, exit 0 |

The build line above is quoted from vite's own output, which carries a non-ASCII check mark. The files of this step are ASCII: `LC_ALL=C perl -ne '... /[^\x20-\x7E\n]/ ...'` over the two test files and `package.json` prints nothing.

## Each test and the revert that turns it red

Every revert was applied to the file, the test file was run (`npx vitest run tests/checks/tree/duplication.test.ts`), and the file was restored byte for byte (`cmp`).

| Test | Revert | Red under it |
| --- | --- | --- |
| is not held anywhere under src/lib / under tests | the default allow list emptied | both red |
| reports a shared twelve-line function once (case 1) | the line count fixed at `MIN_LINES` instead of jscpd's `lines`; the start line reported one past jscpd's `start` | red under each |
| passes a copy of seven lines, and one of twelve lines under fifty tokens (case 2) | `MIN_LINES` 7; `MIN_TOKENS` 10 | red under each |
| passes two files sharing only an import list (case 3) | the brief's pattern `^\s*import\b` | red |
| names a copy in the script of two components | `.svelte:<format>` suffix kept in the path; `MIN_TOKENS` 10 | red under each |
| passes two components sharing only a style block (case 4) | CSS clones kept | red |
| sees through a comment and extra spaces in the second file (case 5) | the line count fixed at `MIN_LINES`; the start line one past jscpd's `start` | red under each, for the output line; its comment and whitespace half is an audit (see below) |
| keeps the mark when a comment line is added in the first file | mark over the whitespace-collapsed fragment | red |
| silences the listed clone and not a second one (case 6) | the allow list matching the pair without the mark | red |
| keeps the groups apart (case 7) | jscpd run over the whole root instead of the group | red |
| passes one file holding the same function twice | same-file clones kept | red |
| holds every entry to a reason | an entry with no reason added to the list | red |
| holds the lists to clones still shared | a stale entry `src/lib/a.ts src/lib/b.ts 000000000000 ...` added | red |

**Audit.** Case 5's comment and whitespace half does not exercise any code of this step. The comment sits in the second-sorted file and the fragment comes from the first, so no revert of this step's code changes whether the copy is seen. That half is an audit of jscpd's own comment and whitespace handling. The revert that would turn it red is jscpd's `--mode strict`, which this step does not set; that run was not taken. The case "keeps the mark when a comment line is added inside the clone in the first file" is what proves the mark ignores comments. Under the mark revert, case 1 and case 5 stay green, because their expected line computes the mark with the same `markOf`.

## Files, line counts before and after (`wc -l`, main checkout against the worktree)

- `package.json`: 56 before, 57 after.
- `package-lock.json`: 4347 before, 4498 after.
- `tests/checks/tree/duplication.test.ts`: 403 before, 429 after.
- `tests/checks/tree/allow-duplication.txt`: 654 before, 209 after.

## Held entries before and after, by group

- **Before:** `grep -vc` gives 641. Split by group, the 642 entry lines are 38 in `src` and 604 in `tests`. The one-line difference is the old file's last line, which had no newline, and BSD `grep -c` does not count it.
- **After:** 197, of which 53 are in `src` and 144 in `tests`.
- **jscpd's raw clones on this tree under the ruled pattern:** in `src/lib`, 72 non-CSS clones, of which 19 sit inside one file (so 53 across files) and 31 are CSS. In `tests`, 220 clones, all non-CSS, of which 76 sit inside one file (so 144 across files). This is from a scratch run of the launcher with the step's flags. The `tests` count reads 220 after this step's rewrite of the test file itself, against 221 before.

Every entry's reason is `the same <n> lines at <line> and <line>, to fold into one place`. The list's head comment now says the reason gives how many lines the clone runs and the line it starts on in each file. Three generations of the list over the tree were byte-identical (`cmp`).

## Judgment calls the brief left open (each reversible)

1. **Svelte file names.** jscpd names a component's block `File.svelte:html`, `File.svelte:typescript` or `File.svelte:css`, and gives the line in the file itself; I checked this against `src/lib/ui/menu/Menu.svelte:53`. `fileOf` strips the `:<format>` suffix, so an entry names the file. A case covers it: a function in the script of two components reports `group/one.svelte:2 and group/two.svelte:3`.
2. **Case 3 covers more than one form of import.** It checks a multi-line import list as well as eight single-line imports, since the ruled pattern exists to drop both.
3. **Case 4's style block is two CSS rules long (18 lines).** At that length, keeping CSS clones turns the case red.
4. **Case 2's seven-line copy sits between lines of its own in each file.** jscpd does not report a clone that spans a whole file of exactly `--min-lines` lines. A probe at `--min-lines 7` on a seven-line file reported nothing, while the same copy held mid-file was reported. Without those surrounding lines, the `MIN_LINES` 7 revert would not turn the case red.
5. **The scratch helper.** The test uses `plantScratch` from `tests/fixtures/scratch.ts` rather than its own copy of that helper. jscpd's report folder comes from `scratchDir` and is removed in a `finally`.

## What in the brief was wrong or impossible

- The `detectClones` API does not exist in jscpd 5.3.3 (evidence above; ruled).
- The pattern `^\s*import\b` does not ignore imports (evidence above; ruled).
- The brief's counts (133 clones in `src/lib`, 240 in `tests`, 79 non-CSS in `src/lib`) are right for that pattern. Under the ruled pattern the counts are those given in the held-entries section.

## Limitations and sharp edges

- **jscpd's line count can be one more than the shared lines.** In a probe, an 8-line copy held between differing lines was reported as `9L 2-10` at `--min-lines 8` and `8L 2-9` at `--min-lines 7`. So "hold the same <n> lines" is jscpd's number, and an entry's reason carries it. The threshold itself behaves as the brief asks: an 8-line copy is reported at 8, and a 7-line copy is not.
- **A clone's reported extent can run onto a neighbouring line** when that line shares a first or last token with the other file (for example a `;` or `export const`). The reported start line is then the neighbouring line. The mark is taken over the extent as jscpd reports it.
- **jscpd honours `.gitignore`.** No rule in the hub's `.gitignore` or `tools/oculus/.gitignore` matches a `.ts` or `.svelte` file under `src/lib` or `tests`; I read both files. `tests/checks/tree` holds no `.gitignore`.
- **The whole-tree cases depend on this step's own file.** The duplication test file is inside the `tests` group, so an edit to it that adds or removes a clone changes the list. The list was generated after the last edit, and the full suite passes.
- **The check needs the jscpd binary for the platform.** It comes from an optional dependency (`jscpd-darwin-arm64` here). On a platform without a prebuilt binary the launcher exits 1, and the test fails with jscpd's message.
