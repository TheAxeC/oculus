# Step R14 refuter report (on .agents/worktrees/r14, base bbae5dd9)

## Verification (rerun by the reviewer)

```
$ npx vitest run --reporter=dot                      (tools/oculus, worktree)
 Test Files  257 passed (257)
      Tests  4279 passed (4279)
   Duration  57.75s
real 59.91

$ npm test                                            (second run, inside the count command)
 Test Files  257 passed (257)
      Tests  4279 passed (4279)
real 84.25

$ npm run check
1789689135335 COMPLETED 1233 FILES 0 ERRORS 0 WARNINGS 0 FILES_WITH_PROBLEMS
real 10.54

$ npm run lint
(no output)
real 45.48

$ npm run format:check
All matched files use Prettier code style!
real 9.58

$ LC_ALL=C perl -ne 'my $l = $_; $l =~ s/\xC3[\x80-\xBF]//g if $ARGV =~ m{^config/}; print "$ARGV:$.:$_" if $l =~ /[^\x20-\x7E\n]/; close ARGV if eof' $(find src tests bin config -type f ! -name glyphs.yml)
(no output)  exit 0   real 0.20

$ npm run build
vite v8.3.0  ... done
real 13.90

$ npx playwright test
  241 passed (9.8m)
real 590.43

$ node bin/revert-check.mjs tests/duplication.test.ts tests/audits.test.ts tests/negatives.test.ts tests/boundaries.test.ts tests/scratch.test.ts tests/bin/revert-check.test.ts tests/bin/cited-lines.test.ts
35 reverts, 0 unproven     (every line `red`, 3 `unchecked`)
real 102.24   exit 0

command 2, as the report lists it for the verification list:
$ git diff --name-only bbae5dd9 --diff-filter=d -- src config tests bin | xargs -I{} sh -c 'echo "--- {}"; sed -n "1,14p" {}'
--- tools/oculus/tests/bin/claude-usage.test.ts
sed: tools/oculus/tests/bin/claude-usage.test.ts: No such file or directory
(same for every file)
with --relative added: 149 files printed, real 2.37

command 4:
$ node bin/cited-lines.mjs <the builder's R14-report.md>
16 cited lines, 1 missing     exit 1

command 5, the exact line the report gives:
before=648192  node exit=0  browser exit=0  after=649088  equal exit=1
each `find` count: real 143.68 / real 136.04

command 5, repeated with TMPDIR pointed at an empty directory of my own:
node   before=0 after=0   (4278 passed, 1 failed, the failure caused by the TMPDIR override)
browser before=0 after=0  241 passed (6.0m)  real 362.00

command 6:
$ find src tests bin -type f \( -name '*.ts' -o -name '*.svelte' \) | xargs wc -l | awk -v allow=bin/size-allow.txt '...'
(no output)  exit 0
with two planted files (src/lib/planted-big.ts 901, src/lib/PlantedBig.svelte 541): both printed, exit 1

command 10:
$ git diff --unified=0 bbae5dd9 -- config | grep -E '^\+[^+]'
(nothing, grep exit 1)   real 0.01
```

Each of the eleven checks was planted against and shown red, then shown green with the plant removed: revert check (probe fixture), head-comment print, duplication (`src/lib/dup-a.ts` + `dup-b.ts`), citation check (fixture report), scratch count (private TMPDIR), size check (two planted files), negatives (one comment stripped from `tests/views/venues.test.ts`), primitive styling (`ul :global(.tool)` added to `src/lib/views/Status.svelte`), audits (a non-rendering case added to `tests/views/status.test.ts`), config-diff print (a scratch git repo), look rule (read at `.scratch/migration/agents/spec.md:54`, verbatim against brief item 11).

## 1. Spec

- `R14-report.md:58`, the head-comment print handed to the verification list: `git diff --name-only <base> --diff-filter=d -- src config tests bin | xargs -I{} sh -c 'echo "--- {}"; sed -n "1,14p" {}'`. Run from `tools/oculus` it prints `sed: tools/oculus/...: No such file or directory` for every file, because `git diff --name-only` prints repository-root-relative paths. It needs `--relative`. The builder's own run (report line 143) used a different command (`git status --porcelain | ... | sed 's#^tools/oculus/##'`), so the line that lands in the ledger is not the line that was run. Brief item 2 asks for the command to be named as a verification line.
- Brief Tests item 3 ("Each new or changed test carries the machine-readable revert line of item 1"): 88 call sites in 70 test files were changed (`mkdtempSync(join(tmpdir(), ...))` to `scratchDir(...)`, e.g. `tests/server/audit.test.ts:51`, `tests/browser/repositories.spec.ts:105`) and none carries a directive. `node bin/revert-check.mjs` was run over 7 files. The changes are mechanical, but the brief's rule is unqualified.
- Brief item 3 ("An allow list names what is deliberate, each entry with its reason"): `tests/allow-duplication.ts` holds 578 `HELD` entries and `grep -c "why:" tests/allow-duplication.ts` prints 0; `tests/allow-audits.ts` holds 150 bare strings. Only `tests/allow-styling.ts` carries a `why` per entry, and its 28 citations all resolve (`node bin/cited-lines.mjs tests/allow-styling.ts` prints `25 cited lines, 0 missing`). The report files this as decision 6 and attributes it to a ruling I was not given.
- Brief decision 3 ("An allow list is a file beside its test (`tests/allow-<name>.ts` or a constant in the test), never a silenced rule"): `bin/size-allow.txt` is a plain text file with no test and no orphan case. Appending `src/lib/planted-big.ts` and `src/lib/PlantedBig.svelte` to it turned my planted violation from exit 1 to exit 0. Nothing in the tree fails when a name is added to it, so its head comment's "nothing is added to this list" is prose only. The four `tests/allow-*.ts` lists each do have an orphan case (all four fired when I planted a stale entry).
- Rule clash, for the orchestrator to note rather than a defect of the diff: `agents/spec.md:33` says "You never edit anything under `tools/oculus/.scratch/`", and `agents/spec.md:3` says "Nothing in a brief overrides anything here", while brief item 11 and decision 4 instruct the builder to edit `agents/spec.md`. The builder followed the brief.
- Brief premise, "Files over the size line today ... `src/lib/views/Files.svelte` 592" and six others (7 files, read at ee7ab653). At the worktree base bbae5dd9 there are 12, each already over before the step (`git show bbae5dd9:tools/oculus/<f> | wc -l` for every entry of `bin/size-allow.txt`: 980, 970, 968, 942, 940, 928, 908, 906, 596, 592, 557, 547). The builder states this at report line 34.

## 2. Proof

- `bin/revert-check.mjs:165`, `const run = spawnSync('npx', ['vitest', 'run', file, '-t', caseName]);`. `-t` is a regex. A case whose name holds a metacharacter is reported proven although its revert leaves it green. Fixture probe: a case named `a name with a bracket (like this one`, whose body is `expect(allowed(5)).toBe(true)` and whose revert is `src/rule.mjs:2 => return true;` (which keeps it true), prints `red ... 1 reverts, 0 unproven`, exit 0. The identical case without the bracket prints `GREEN`.
- `bin/revert-check.mjs:159-161`, the browser path:
  ```
  const built = spawnSync('npm', ['run', 'build'], shared);
  if (built.status !== 0) return { green: false, note: 'the build refused the revert' };
  ```
  A failed build is `green: false`, which `checkOne:208` turns into `ok: true` and a `red` line. Probe: a `tests/browser/look.spec.ts` whose only assertion is `expect(1).toBe(1)` and whose revert cannot affect it prints `red ... [the build refused the revert]` / `1 reverts, 0 unproven`, exit 0. The report (line 167) says this path is "written and not exercised"; exercised, it proves nothing and reports zero unproven.
- `bin/revert-check.mjs:166`, `return { green: run.status === 0, note: '' }`. A replacement that makes the file unparsable is reported `red`. Probe: `// revert: src/rule.mjs:2 => return (;` over `expect(allowed(5)).toBe(true)` prints `red ... 1 reverts`. Red conflates "the assertion failed" with "the tree no longer imports".
- `bin/revert-check.mjs:204`, `writeFileSync(join(dir, directive.target), edit.text, 'utf8');`. A directive naming a file `SKIPPED` (`bin/revert-check.mjs:38`: `node_modules`, `.svelte-kit`, `build`, `.git`, `.scratch`, `test-results`) passes the `existsSync` guard at :184 against the real root and then throws an unhandled `ENOENT` against the copy. Probe: `// revert: .scratch/plan.md:1 => changed` printed a Node stack trace and abandoned the two directives after it; no summary line was printed. Report line 84 names the limitation but not that it crashes the run.
- `R14-report.md:144` claims `node bin/cited-lines.mjs <this report's citations>` prints `14 cited lines, 0 missing`. Run over the report itself from `tools/oculus`, the builder's own tool prints `16 cited lines, 1 missing`, exit 1:
  - `MISSING views/shared/CardActions.svelte:202 no such file` (report line 32).
  - `tests/bin/claude-usage.test.ts:22 | ` prints an empty line. Report line 7 cites `:22` as "the tree's shape" for a name on the line below `it(`; line 22 is blank, the `it(` is at `:25` and the name at `:26`. The tool does not flag a citation at a blank line, so the wrong-citation half of check 4 passes over it.
- `R14-report.md:104` claims the count command printed `before 647280 after 647280`, `equal exit 0`. I ran the same command on the same tree: `before=648192`, `after=649088`, `equal exit=1`. `ps -Ao pid,lstart,command` during the window showed `.agents/worktrees/q49/tools/oculus/node_modules/.bin/playwright test ...` running, and the leftovers newer than my marker were `oculus-browser-4JXYjp` (q49's server) plus 29 `oculus-files-spec-*`. So the growth is another worktree's, not r14's. The command counts the whole shared temporary directory and therefore goes red for any concurrent run; the plan's own configuration allows two workers at once, so the check as listed will report false reds by design. Repeated with `TMPDIR` pointed at an empty directory of mine, r14's own suites do leave it equal: node `before=0 after=0`, browser `before=0 after=0` with `241 passed (6.0m)`. (The private-TMPDIR node run had one failure, `tests/server/pty/sessions.test.ts > starts, lists, feeds, resizes, captures and stops a terminal`; it is caused by the TMPDIR override, and both standard-TMPDIR runs passed 4279.) Each `find` count over 649,088 entries took `real 143.68` and `real 136.04`, not "about a minute" (report line 67).
- `bin/size-allow.txt`: membership is binary and unbounded. `tests/views/collection.test.ts` went 928 to 957 inside the step; I raised it to 2157 lines in my clone and the check still exited 0. The report names this at line 153; it is the check's only blind spot on the very file the step grew most.
- `tests/allow-negatives.ts:8-11`, the per-file ceiling has headroom the moment an existing bare absence is explained. Probe: in `tests/browser/files-forms.spec.ts` (cap 26) I wrote a reason above 16 existing bare absences and added 16 brand-new bare ones; `npx vitest run tests/negatives.test.ts` printed `Tests 5 passed`. Both capped files are the ones Q48 is editing. Moving an assertion between the two capped files does fail (`browser/unsaved-forms.spec.ts asserts 23 absences with no reason, over 22`), and the orphan case fires for a file the tree no longer has.
- All four `tests/allow-*.ts` lists silence a brand-new violation when an entry is added, and only the orphan case constrains them. Shown for each: duplication (`{ a: 'src/lib/dup-a.ts', b: 'src/lib/dup-b.ts' }` added to `DELIBERATE` turned 1 failed into 8 passed), audits (an entry for a planted non-rendering case turned 1 failed into 4 passed), negatives (`'views/venues.test.ts': 5` turned 1 failed into 5 passed), styling (see next).
- `tests/allow-styling.ts`, each entry is keyed on file plus class, not on the selector the `why` names. I added a second, unrelated rule `.brand-new-rule :global(.opener) { gap: 99px; }` to `src/lib/views/shared/CardActions.svelte`, whose entry cites `:202 [data-action-more] :global(.opener)`; `npx vitest run tests/boundaries.test.ts` printed `Tests 9 passed`. A file already on the list can add unlimited further `:global` rules for the same class.
- Timings in the report that my runs do not reproduce: `npm run lint` 96s (mine 45.48), `npm run check` 16s (mine 10.54), the revert check "about four minutes" for 35 directives (mine 102.24s), `npx playwright test` 6.6m (mine 9.8m under concurrent load, 6.0m alone), the count's `find` "about a minute" (mine 143.68s). Load-dependent, but the report states them as measurements.

## 3. Standards

- `tests/views/collection.test.ts`, 928 to 957. `agents/spec.md:41` says "One source file under 1000 lines. A file approaching it is split by concern." The step added 29 comment lines to a file 43 lines from the cap, and the check it built exempts that file entirely. `tests/routes/terminal.test.ts` also grew, 968 to 970.
- `tests/scratch.test.ts:1-3` head comment: "no test file makes one any other way, and every suite that reaches the helper registers the sweep with its own runner". False for `tests/data/real-hub.probe.ts:95`, `const scratch = scratchDir('oculus-probe-');`, which registers no sweep. `findUnswept` at `tests/scratch.test.ts:77` filters on `/\.(test|spec)\.ts$/`, so the one file in the tree that takes a directory from the helper and cannot sweep it is the one file the guard cannot see. It leaks one directory per hand-run.
- `tests/scratch.test.ts:62`, `[...(held.get(rel) ?? '').matchAll(/from '(\.[^']+)'/g)]`. The import graph is single-quoted static imports only. Probes: a spec whose body is `const helper = await import('../scratch.ts'); helper.scratchDir(...)`, and a test file importing `from "../scratch.ts"` with double quotes, both take a directory from the helper, register no sweep, and `npx vitest run tests/scratch.test.ts` printed `Tests 5 passed`. Prettier blocks the double-quote form; nothing blocks the dynamic one. Report line 168 names only the package-alias case.
- `tests/scratch.ts:19` used at module scope. A throw in a module-scope statement after `scratchDir` runs before any hook is registered, so the sweep never runs. Probe: a test file whose module body calls the fixture and then throws left the directory behind (`1`), where the same throw from `beforeAll` left `0`. `tests/routes/terminal.test.ts:59` has exactly that shape (`const TASK_CONFIG = scratchDir('oculus-task-route-');` followed by module-scope `expect` calls). The other three shapes the brief's sweep must survive do sweep: through a fixture, failing midway, and a Playwright `beforeAll` that throws, all left `0`.
- `tests/audits.test.ts:99`, `for (const name of readdirSync(root))`, non-recursive, while `tests/negatives.test.ts:35-43` and `tests/duplication.test.ts:75-83` recurse. `tests/views` has no subdirectory today, so a future one would escape the audits check silently.
- `tests/negatives.test.ts:29-32`:
  ```
  function explains(line: string): boolean {
      const text = line.trim();
      return text.startsWith('//') || text.startsWith('*') || text.startsWith('/*');
  }
  ```
  Any comment satisfies it. `tests/views/project.test.ts:219-220` passes on the pre-existing `// The card's own list is where an absent document is drawn as a tag; the tab has none.` above `expect(body).not.toContain('>TEX</span>')`, which is the case Q34 named as encoding an unruled decision as the expected result. The check cannot separate a fact about the fixture from a restatement of the decision, which is the one shape it exists for. The report acknowledges the case in words (line 121) and leaves it.
- The 447 comments, read as a sample of 60 across 20 files (`tests/views/` collection, projects, files, repositories, focus, source, inbox, leads, map, project, hpc, card-docs, file, data, pillars, present; `tests/browser/` files, source, show-in-files, nested), plus a scan of all 424 distinct added comment lines for ones carrying no causal clause. Almost all state a fact about the case's own fixture and derive the absence from it (`// the root is drawn closed, so nothing under it is in the tree until it is expanded`, `tests/browser/files.spec.ts:38`). The "nor ..." continuations (`tests/views/inbox.test.ts:273,275`, `venues.test.ts:315`, `projects.test.ts:697`, `config.test.ts:260`, `domains.test.ts:50`, `cardlinks.test.ts:173`, `radar.test.ts:249`, `linkedin.test.ts:217`, `focus.test.ts:840`, `calendar.test.ts:282`) carry no fact standing alone but read correctly under the comment above them; I do not call them findings. The comments that excuse an absence rather than explain it are three, and two of them are the pair the builder flagged: `tests/views/file.test.ts:70` and `tests/browser/files.spec.ts:211`; the third is the pre-existing `tests/views/project.test.ts:219` above.
- The flagged case, judged. `tests/views/File.svelte:167` draws `<iframe class="frame" {title} {src}></iframe>` for `type.kind === 'pdf'` only, while `tests/views/Document.svelte:70` draws `sandbox="allow-same-origin allow-scripts"` for a local HTML file and carries its reasoning in its own head comment at `:19-24`. The absence is right: `src/lib/server/files.ts:57-59` serves the type from the extension map alone (`TYPES[extname(name).toLowerCase()] ?? FALLBACK`), so a `.pdf` is always `application/pdf` and Chrome hands the bytes to its own viewer, which does not run the file's script; and the only sandbox value that lets that viewer draw, `allow-same-origin allow-scripts`, grants exactly what no sandbox grants, so it would buy nothing. What a reader loses is that `File.svelte:167` carries no note at all: the justification lives only in two test comments, where `Document.svelte` carries its equivalent beside the markup. What is risked if it is ever wrong is bounded by that extension map: a type map change that let a framed file be served as a document would give that file the page's own origin, with no sandbox to stop it reaching `window.parent`.
- The three cases the pass called defect-encoding are no longer in that shape, confirmed by reading each: `tests/views/venues.test.ts:336` is now `expect(journal).toContain('target="_blank"')`, a positive assertion; `tests/views/memories.test.ts:253-257` asserts `read_failed` with its reason is drawn and the empty-wall line is not, which is the complement of a positive assertion over the repaired behaviour; `tests/browser/repositories.spec.ts:154` asserts the non-repository folder is kept out of the picker, the opposite of the pinned defect, and it is green in the 241-passed run.

## 4. Behaviour

- None. `git diff --name-only bbae5dd9 -- tools/oculus/src tools/oculus/config` prints nothing, and every removed line under `tests/` is import bookkeeping or the `mkdtempSync(join(tmpdir(), ...))` call it replaced; no assertion was removed, loosened or re-aimed. Diff: 150 files changed, 1033 insertions, 279 deletions, plus 14 untracked files totalling 2290 lines.

## Not checked

- The report's per-check tree counts I did not recompute from the check functions themselves: duplication "752 windows, 578 distinct file pairs", audits "150 cases", primitive styling "28 rules". I verified the allow-list lengths instead (`578`, `150`, `28` entries) and the absence counts directly (516 absence assertions, 468 with a reason above, 48 bare, 75 files), all matching.
- Whether the `oculus-*` leftovers already on the machine (649,088) include any that r14's own earlier runs made; I removed none.
- The revert check over the tree's other 150 changed test files, which carry no directives.
- Whether the four `SWEPT_BY_FIXTURE` entries are each still needed, beyond running the case that pins them.

Reviewer usage: about 300k tokens, 48 tool uses, about 75 minutes.

---

# The run over repair round 1 (reviewer a0f9ae50704b7e127, 04:22 to 05:05)

```
npx vitest run --reporter=dot        258 files, 4297 tests, all passed, 103.16s
npm run check                        COMPLETED 1232 FILES 0 ERRORS 0 WARNINGS
npm run build                        exit 0
npm run format:check                 All matched files use Prettier code style!
npm run lint                         no output
the ASCII gate                       no output, exit 0
npm run test:browser                 241 passed (5.4m), exit 0
node bin/revert-check.mjs <9 files>  53 reverts, 0 unproven; 53 red, 40 unchecked; 354s
the head-comment print               149 files, 0 No such file, 11.2s
node bin/cited-lines.mjs <report>    25 cited lines, 2 missing, exit 1
sh bin/scratch-count.sh              node before 0 / node after 0 / browser before 0 / browser after 0, exit 0, 746s
sh bin/size-check.sh                 no output, exit 0
git diff --stat bbae5dd9             150 files changed, 1076 insertions(+), 292 deletions(-)
```

The worktree is untouched: every plant, revert and stub was made in a copy under `scratchpad/r14-review2/`.

## Spec

1. **Ruling 2 is not met: four shapes still print `red` and count `0 unproven`.** (a) A skipped case: `bin/revert-check.mjs:233` reads any status other than `passed` as red, and `CASE` at `:41` admits `it.skip(`. (b) A case another case's `.only` excludes: the same. (c) Two cases of one name: `vitestResults` at `:173-181` collects every assertion whose title matches and `:233` takes `every(Boolean)`, so a red sibling proves the directive's own case. (d) A drifted line number: a directive naming a comment line proves that some edit there breaks the case, not that the rule the case is cited for is what it holds; a revert that replaces a line with itself prints red.

2. **Ruling 7 is not met, and the defect disables the guard's central case.** `tests/scratch.ts:6` is a comment holding `afterAll(sweepScratch)`, which `shapeOf` at `tests/scratch.test.ts:65` matches, so `held.get('scratch.ts').registers === true` and `swept()` at `:109-116` answers true for every file that imports the helper through any chain. A planted `tests/views/planted-scratch.test.ts` that takes a scratch directory and registers no sweep leaves `npx vitest run tests/scratch.test.ts` at `Tests 7 passed`; so does deleting `afterAll(sweepScratch);` from `tests/server/audit.test.ts`. Any of the 82 suites can drop its registration and stay green. The head comment at `tests/scratch.test.ts:2-8` is made false by it.

3. **Ruling 8 is half met.** `literalsIn` at `tests/negatives.test.ts:36` pairs quotes greedily, so on a line holding two quoted strings the captured literal is the text between them and the real one is never extracted; a comment that restates the assertion passes there.

4. **Ruling 9 is half met.** `findAudits` at `:121` recurses; the orphan case at `:237-246` builds its set from `readdirSync(VIEWS)` without recursing.

5. **Ruling 6 is enforced only as non-empty.** `tests/boundaries.test.ts:553`, `tests/duplication.test.ts:306` and `tests/audits.test.ts:215` filter on `why.trim() === ''`, so a reason of `x` stands. The styling half holds: a second unrelated `:global` rule for a listed class gives `1 failed | 9 passed`.

6. Ruling 10: the diff still carries `+1` in `.scratch/migration/agents/spec.md`, which `agents/spec.md:33` forbids a worker to touch. The orchestrator's to drop at landing.

7. Brief decision 3 is departed from: the two long floors are `.txt` rather than `.ts`. The round states it as its decision 1 with the reason; both are read by their test, both carry a reason per line, both have an orphan case.

Rulings 1, 3, 4 and 5 are met.

## Proof

8. **`19 cited lines, 0 missing` does not reproduce.** Over the whole `agents/reviews/R14-report.md`: `25 cited lines, 2 missing`, exit 1 (`tests/bin/claude-usage.test.ts:22 the line is blank`, `views/shared/CardActions.svelte:202 no such file`). The builder's run was over an extracted file of citations, which a later reader cannot rerun. The answer also depends on `--root`, which the report does not name: with the worktree's `tools/oculus` as root the same section gives `10 cited lines, 7 missing`.

9. `bin/cited-lines.mjs:49`: a range wider than 200 lines collapses to its first line, so `src/one.ts:1-9999` over a four-line file passes; a reversed range `src/one.ts:4-1` passes; `src/one.ts:-5` is not read as a citation at all; a citation landing on a line holding only `}` passes, though the head comment's reason for flagging a blank line covers it equally.

10. `bin/scratch-count.sh`: **the exit status does not follow a red suite.** With `"test": "exit 1"` and an empty `testDir`, the script prints `the node suite is red` and `the browser suite is red` as prose and exits 0. The verification list reads the exit status. Isolation holds (a directory planted in `$TMPDIR` mid-run did not move the count) and the script cleans up after itself. `left()` at `:21-23` counts only top-level directories named `oculus-*`, so a leak with another prefix, a leaked file or a leak one level down is not seen.

11. `bin/size-check.sh` and `tests/size.test.ts:50` measure `.ts` and `.svelte` only. A planted `bin/planted.mjs` of 2000 lines leaves the check at exit 0; `bin/` already holds `migrate-joint-work.mjs` 466, `revert-check.mjs` 319 and `cited-lines.mjs` 116. All five ratchet shapes hold. Every entry is still over its line and under its count on main at `16534873`.

12. `tests/allow-duplication.txt` is keyed on the file pair only: a brand-new nine-line clone between two listed files leaves `tests/duplication.test.ts` at `Tests 9 passed`. 578 listed pairs may share any amount of new code.

13. `tests/allow-negatives.ts` is a per-file ceiling at the current counts: explaining one bare absence and adding one brand-new bare absence in the same file leaves `Tests 6 passed`. One explained absence buys one unexplained one.

14. `explains()`: four long words of filler pass (`marmalade wheelbarrow constitutional phenomenology`), and a true reason that names the attribute it is about is refused.

15. `tests/audits.test.ts`: `DECLARES[2]` at `:56` takes every assignment name in the file and `reaches` at `:73-79` matches `\bname\b` anywhere in a case body, comments and strings included, so for `tests/views/projects.test.ts` any of twenty-one ordinary words (`done`, `first`, `open`, `cut`) buys a pass. `/\brender\(/` reads the text inside a string. `cases()` at `:50` needs the name on the `it(` line, so a case whose name is on the next line is not seen at all. `block()` at `:60-70` counts braces and parens inside strings and comments, so a case that does render but holds `foo))` in a comment is reported as an audit: a red it has not earned.

16. `bin/revert-check.mjs`: `unchecked` is in neither the summary's numbers nor the exit status, so a case added with no directive leaves `N reverts, 0 unproven`, exit 0. `:277` writes the edited copy with no containment check: a directive naming `../escape-target.txt` reads outside the tree and writes outside the scratch copy, where the `finally` at `:288-290` does not remove it. `caseAbove` at `:102-108` searches backwards, so a directive on the line above an `it(` attaches to the previous case, which the head comment at `:76-77` says it does not.

17. Timings not reproduced (load-dependent, my runs shared the machine with another step's browser suite): revert check 354s against 428s, check 24.5s against 16s, build 19.1s against 16s, lint 89s against 76s, scratch-count 746s against 626s, the head-comment print 11.2s against 5s.

## Standards

18. Two head comments the diff makes false: `tests/scratch.test.ts:2-8` (finding 2) and `bin/revert-check.mjs:76-77` (finding 16).
19. No history in any comment of the fourteen new files; the ASCII gate is clean; every new module opens with its head comment naming its layer; no file over the size limit; no document sentence is made false.
20. `tests/views/project.test.ts:220` still asserts a difference nobody ruled. (Booked as an open item for Axel at 05:15, after this review read the file.)

## Behaviour

21. One change to how a suite runs, which the report states: `tests/server/git.test.ts` gained `{ timeout: 60000 }` on one case. `git diff bbae5dd9 | grep -nE "^\+.*(timeout|retries|test\.slow|\.concurrent|setConfig|testTimeout|hookTimeout)"` prints that line and nothing else; the config files are untouched; `git diff --name-only bbae5dd9 -- src config` prints nothing.
22. The 88 converted call sites are faithful in the sample read whole (`tests/browser/repositories.spec.ts`, `tests/server/audit.test.ts`, `tests/watch/portfolio.test.ts`, `tests/data/real-hub.probe.ts`, `tests/server/git.test.ts`): each replaces `mkdtempSync(join(tmpdir(), 'X'))` with `scratchDir('X')`, keeps the containment assertion and adds the sweep. Over the whole diff, the removed lines that are not an import, an empty line, a `mkdtempSync` or a `tmpdir()` are 52, all import-list continuations plus the one reindented git case. No assertion was removed, loosened or re-aimed.

## Not checked

The duplication check's own window computation; whether each of the 35 styling entries is deliberate; whether any of the 150 audits entries should now render; `require()` and package-alias import shapes against the scratch guard; the browser half of the revert check on a real browser case.

Reviewer usage: about 100 tool uses, 43 minutes (04:22 to 05:05).

---

# The run over repair round 2 (reviewer ad56ae0ee60352bd7, 06:13 to 06:53)

```
npx vitest run --reporter=dot        258 files, 4306 tests, all passed, 54.38s
npm run check                        COMPLETED 1233 FILES 0 ERRORS 0 WARNINGS
npm run build                        built in 5.88s, exit 0
npm run format:check                 All matched files use Prettier code style!
npm run lint                         no output, exit 0
the ASCII gate                       no output, exit 0
TMPDIR=<private> npx playwright test 241 passed (6.5m), exit 0
node bin/revert-check.mjs <8 files>  65 reverts, 0 unproven, 0 unchecked, exit 0, 242.5s
the head-comment print               149 files, 0 "No such file", 1.7s
sh bin/size-check.sh                 no output, exit 0
sh bin/scratch-count.sh              node before 0 / the node suite is red / node after 0 /
                                     browser before 0 / browser after 0, exit 1, 494s
node bin/cited-lines.mjs --root . <the round-2 section>   10 cited lines, 4 missing, exit 1
git diff --stat bbae5dd9             150 files changed, 1082 insertions(+), 292 deletions(-)
```

The worktree is untouched; every plant was made in a copy under `scratchpad/r14-review3/`.

## Spec

1. **The negatives floor still buys room.** `findGrowth` (`tests/negatives.test.ts:85`) matches each absence against a multiset of that file's entries, and 15 of the 26 entries for `browser/files-forms.spec.ts` are the empty key, an absence naming no literal of eight characters or more, so the 15 are interchangeable: explaining one frees a slot a new one fills. Proven in a copy; adding the same absence without explaining one is caught. `tests/negatives.test.ts:16` says the opposite.
2. **The negatives floor never ratchets down**: explaining one listed absence and adding nothing leaves a stale entry nothing reports. The duplication, audits, styling and size lists each have a stale-entry case; this one is held only to files that still exist.
3. **The audits scan reports passes and reds it has not earned.** `reaches` (`:74`) matches `\brender\(` inside a string, so a case asserting `toContain('render(Files)')` counts as coverage; it also matches any declared name, and those names are ordinary words (`at`, `from`, `done`, `open`, `first`), so a case holding one of twenty-one words passes; `block` (`:61`) counts brackets inside comments, so a case that does render is reported as an audit, a red it has not earned; `CASE` (`:51`) needs the title on the `it(` line, so a case named on the next line is invisible.
4. **The scratch guard is blind to three shapes**: `mkdtemp` from `node:fs/promises`, `mkdirSync(join(tmpdir(), ...))`, and an import specifier without its `.ts`. Each planted leaves the guard green. The eight shapes the brief named are all caught.
5. **The revert check writes outside its copy through a symlink**: `inside()` (`:184-186`) compares lexically, so a symlink inside the tree passes and `writeFileSync` (`:363`) writes through it. `find src tests bin config -type l` prints nothing today.
6. **`bin/size-check.sh` and `tests/size.test.ts` do not hold the same rule, and neither measures a shell script.** A 1200-line extensionless file under `bin/` is caught by neither; a 2000-line symlink by the test only; the tree's own three `.sh` files are unmeasured, against `bin/size-check.sh:6`.
7. **`bin/cited-lines.mjs` has no containment check**: a report citing `../outside/secret.md:1` is read and counted among the good lines. The other four shapes behave.
8. **`tests/reason.ts` accepts filler and any restatement that changes one character**: `closed closed closed closed` passes, and against `not.toContain('data-open')` the comments `no Data-Open drawn at all`, `no data open is drawn here` and `no data.open drawn at all` are all accepted while the exact string is refused.
9. **`agents/spec.md` still carries the `+1`** the previous round withdrew; the orchestrator's to drop at the landing.
10. **`0 unchecked` is a property of the eight-file argument list, not of the step's diff**: over the 162 changed script files the command would print `65 reverts, 0 unproven, 2111 unchecked`. Disclosed in the head comment and the report's row.

**What held**: the duplication floor keyed on the clone (a brand-new clone between two listed files is reported; changing a listed clone turns the stale-entry case red); the revert check refusing a skipped case, an `.only` sibling, two of one title, a comment line, an identical replacement and a target outside the tree, reading a directive above a case as that case, printing `red` for titles holding `$`, `.`, `(` and an apostrophe, and `unproven [the case did not run]` for a file the runner never loads; `unchecked` in the summary and the exit status; the count script exiting 1 when a half is red.

## Proof

11. **`19 cited lines, 0 missing` does not reproduce**: over the round-2 section as it sits on disk, `10 cited lines, 4 missing`, exit 1 (`agents/spec.md:33` no such file, two blank lines, and `views/shared/CardActions.svelte:202` wanting its prefix). The six citations of the form `(:259)` carry no path and are not read as citations at all.
12. **The duplication floor is 743 entries, not 744**, counted exactly as `readHeld` does. The negatives floor is 48, which matches.
13. **`sh bin/scratch-count.sh` exited 1, not 0**: the four counts reproduce, and the node half printed `the node suite is red`. `TMPDIR=<private> npm test` immediately afterwards was green; three other worktrees' suites were running (load averages 11.46 12.73 12.80) and eight cases carry 60 to 120 s budgets, so contention is the likely cause. The command as written is red on this machine under the load the plan runs at.
14. **`left()` sees only top-level `oculus-*` directories**: of five planted shapes it counts two. After the reviewer's own runs the private roots held `node-compile-cache` and `playwright-transform-cache-502`, and the count read 0; nothing requires a scratch prefix of `oculus-`.
15. Timings, all load-dependent, none reproduced: node suite 54.38s against 90s, revert check 242.5s against 301s, build 5.88s against 25s, lint 35.0s against 77s, browser 6.5m against 5.4m.

Reproduced: `258 passed`, `4306 passed`, `COMPLETED 1233 FILES 0 ERRORS`, `241 passed`, `65 reverts, 0 unproven, 0 unchecked`, the head-comment print, `size-check.sh` silent, the ASCII gate silent, and the diff stat.

## Standards

16. **History in a comment**: `bin/cited-lines.mjs:49` names an earlier bug ("which is how `:1-9999` over a four-line file used to read as a hit"), which `agents/spec.md:39` forbids. The only such hit across the fourteen new and changed files.
17. **A stale doc comment**: `tests/audits.test.ts:121` describes `findAudits` while sitting above `everyCase`.
18. **Head comments the diff makes false**: `bin/revert-check.mjs:183-186` (finding 5), `tests/scratch.test.ts:2` (4), `bin/size-check.sh:6` and `tests/size.test.ts:11` (6), `tests/reason.ts:4-6` (8), `tests/negatives.test.ts:16` (1).
19. Clean: the ASCII gate, the size rule as written, every new module's head comment, Prettier and eslint.

## Behaviour

20. **`npm test` now starts child processes and no report states it**: `tests/bin/revert-check.test.ts` runs `node bin/revert-check.mjs` twelve times, each copying a fixture tree and starting a nested `npx vitest`; `tests/size.test.ts:143` runs the shell script over the whole tree.
21. **Eight case budgets are outside the tracked diff**, since `tests/bin/revert-check.test.ts` is untracked; the file's own comment gives the reason.
22. Nothing else changed how a suite runs: no `src` or `config` file in the diff, no config key added, and the one tracked budget is the `git.test.ts` case the report names.

## Not checked

The duplication window computation; whether each styling and audits entry is right on the merits; the browser half of the revert check, which no directive exercises; `require()` and package-alias import shapes; whether the count script's node half is red on an idle machine; the 30-minute port wait; the 447 absence comments beyond a sample of the 25 most repeated, which are real reasons.

Reviewer usage: about 45 tool calls, 40 minutes (06:13 to 06:53).
