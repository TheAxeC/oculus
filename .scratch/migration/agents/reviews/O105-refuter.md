# Review of O105

Usage: (filled by the session)

## 1. Verification lines

Run from `/Users/axelfaes/workspace/oculus/.agents/worktrees/migration-O105`, base eafa79e6e. `docs/adr` does not exist: `ls: docs/adr: No such file or directory`. So no ADR governs the diff.

Check 1, `npm run diagrams && npm run docs:palette && npm run test:quick`, run once, exit 0. The harness moved the command to the background after 180 s; no second copy ran and I read it only after it ended.
```
test:quick: 38 changed file(s), from git since HEAD
test:quick: 264 test file(s)
ok      prettier (1.6 s): All matched files use Prettier code style!
ok      ASCII gate (1.7 s)
ok      svelte-kit sync (1.9 s)
ok      eslint (25.1 s)
ok      svelte-check (47.6 s): 1793405276353 COMPLETED 576 FILES 0 ERRORS 0 WARNINGS 0 FILES_WITH_PROBLEMS
ok      vitest checks (197.2 s): Duration  186.06s (transform 105.43s, setup 0ms, import 272.31s, tests 366.78s, environment 7ms)
ok      vitest (240.8 s): Duration  232.17s (transform 201.53s, setup 0ms, import 426.64s, tests 414.13s, environment 17.75s)
ok      vitest slow (300.8 s): Duration  292.26s (transform 20.36s, setup 0ms, import 160.70s, tests 995.51s, environment 15ms)
test:quick: 303.1 s; every command passed
```
- The report's first line says this check did not print "every command passed". Here it did, so that line is overtaken, and the landing run settles it.
- After all my runs `git diff eafa79e6e --stat` still ends `34 files changed, 758 insertions(+), 323 deletions(-)` and `git status --short` still counts 38 lines, as at the start.

Check 2, plain `grep` with `--exclude=local.yml`:
```
grep -rnE "SITE_FILE|CV_FILE|PAPERS_FILE|INDUSTRY_FILE|titleOf\(input|[^b]site\.(cv|sections)" src tests --exclude=local.yml
exit 1
grep -n -w parts src/lib/server/content/audit/website/cv.ts
exit 1
```

Check 3, `patch --dry-run`: both exit 0, no failed hunk. The hub patch touches `.oculus/config.yml` and `.oculus/data/academic/career.yml`; the website patch touches the 15 files the report lists.

Check 4:
```
config/defaults/behavior.yml:40:    site: _data/website.yml
config/defaults/behavior.yml:41:    cv: _data/data.yml
config/defaults/behavior.yml:42:    papers: _data/publications.yml
config/defaults/behavior.yml:43:    industry: _data/industry.yml
```

Check 5: the after-the-change half ran. The unchanged-tree half is under "Declined to judge".

Check 6: read; the findings are under Standards.

The report's quoted test runs, same form:
```
npx vitest run tests/data/hubs/website-files.test.ts tests/routes/docs/audit.test.ts tests/data/sources/career.test.ts tests/state/sessions/source/website-store.test.ts
 Test Files  4 passed (4)
      Tests  105 passed (105)
npx vitest run tests/routes/sessions/website.test.ts --tagsFilter slow --testTimeout 20000 --reporter=dot
 Test Files  1 passed (1)
      Tests  20 passed (20)
npx vitest run tests/routes/sessions/website.test.ts tests/server/root/watch/website-watch.test.ts
 Test Files  2 passed (2)
      Tests  21 passed (21)
```

Other reproductions, on scratch copies under $TMPDIR. My own scratch folders were removed afterwards; no `local.yml` of a hub was read or copied, and the scratch hubs got my own one-line file.
- **Cases A and H:** the case-run program re-created byte for byte from the report gives the same lines as Output blocks A-after and H: `problems: 0`, `first-name, last-name, links` twice, and `16 { removed: 16 }`, `9 { removed: 9 }`, `3 { removed: 3 }`. Every printed diff line is `removed`. The built files of A and H compare equal with `cmp`.
- **Case I:** `cv exit 0`, `industry exit 0` in both copies; 38402, 7409 and 2852 bytes, each `EQUAL`; 1 image in each of the six PDFs.
- **Case J:** `jekyll exit 0` in both copies; `32 EQUAL cv`, `26 EQUAL publications`; no html page differs past the css stamp and `diff -rq` shows nothing else.
- **Count not reproduced:** the report says 16 html files, I count 14 in each site. No decision rests on it.
- **Hub list count:** `awk ... | wc -l` gives 68.
- **`sh utils/unused-exports.sh`:** exit 0, 337 lines, none naming `site.ts`, `BadPath`, `WebsiteFiles`, `settings/files.ts` or `website.svelte`.
- **Doc text:** all nine "Current" lines equal `guarded.md` lines 189 to 191 and 225 to 230.
- **Timeouts the report lists:** in the second run none of the five files is a file the step changes. In the first run `tests/routes/sessions/website.test.ts` is one, the only one, and it is green in my run. Nothing further was done on them.

## 2. Verdict per item of "What to build"

1. **Website reads its own words: holds.** The patch does what the item says. Cases I and J are reproduced. No reader of the copied keys remains in `_includes`, `_scripts`, `_industry`, `_layouts` or `_pages` (grep of `site.data`, `['personal']`, `['title']`). The 8 keys and both comments are in. `_industry/cv_pdf_generator.py` and its README are corrected. The `seckey` substitute is judged under Spec.
2. **Generated files hold only what the hub gives: holds.** The diff, check 2 and case A agree. `parts` and `title` are gone from every place the item names; the hub patch has 8 rows and both career lines.
3. **`website.files`: holds.** Four keys, four rows, four hub-list rows. Primary-only follows from `hub-keys.ts`, which lists none of them. `badPaths` is one function; `website-bad-path` comes before the site read and the approval at `runs/website.ts:146`; the audit gives one finding and returns at `publications.ts:87-97`. The `below` substitute is judged under Spec.
4. **`programs:` check stays: holds.** `readSite` keeps the keys and `path`; the row of case C passes.
5. **No code carries the old form: holds.** Case H. `sharedShape` and `websiteKindShape` drop the keys. `settingProblems` over a hub that keeps `title` in its rows printed `setting problems website: []`, so the report's sharp edge is true.
6. **Docs and tests: holds.** Counts 68 and twenty-seven are in place, the lists are extended, the templates show the keys, and the Doc text is present. T6 is a wording defect inside it.

## 3. Verdict per case

- A: met (reproduced).
- B: met (tests read, pass).
- C: met.
- D: met (three test files, not the slow watch file).
- E: met.
- F: partial, see P1.
- G: met.
- H: met (reproduced).
- I: met (reproduced).
- J: met (reproduced).
- K: met.
- L: met, by reading the templates. My landing-order run shows the blank headings and a stop for missing keys at scale, though it stopped on `portrait_url`, the first key read.
- M: met.
- N: met.
- O: met. The unparsable site file in the rows shows it is not read.
- P: met.
- Q: met.

## 4. Findings tied to verdicts

Case F partial: finding P1.

## 5. Findings

### Spec

**S1. The compare loop of cases I and J is an unquoted, unapproved script, and the case-run run is not whole.**
- Place: `.scratch/migration/agents/reviews/O105-report.md`, Output blocks I and J; judgment call 16.
- Hunk: `html files compared: 16; differing past the css build stamp: 0` and `38402 old-_scripts-_tmp-cv.pdf.txt    38402 new-_scripts-_tmp-cv.pdf.txt EQUAL _scripts-_tmp-cv.pdf`.
- What is wrong: these lines are the output of a shell program whose source the report does not quote; the Cases table gives only tool names. Spec line 65 keeps a case-run program only when its source is quoted "so the reviewer can run it again", and "Any other script needs the approval the brief names". `plan.md` Rulings 599 to 602 hold no such approval. How the scratch hub was made is also unquoted.
- A/H output: the block is cut by the builder's own words ("The program also printed one line per removed key").
- Leftovers: the report says the program is gone, while three folders of its `o105-state-` prefix remain in `$TMPDIR`, dated 00:03 and 00:17. They match the run times; attribution to the builder rests on that alone.
- Failure scenario: the next reader cannot run the comparison; the 16 against my 14 cannot be explained from the report.

Judged, no finding:
- **Judgment call 16 for cases A and H.** Spec line 3 says nothing in a brief overrides the spec, and line 65 allows such a program, so the program quoted for A and H stands. Its writing of three files into a scratch `out` folder is within line 65's parenthesis, since they are outside the diff.
- **`below` in place of `inside` (call 1).** With `inside`, a value `.` names the folder itself. As the site key, `slurp` of a folder would go on with no programs, by reading. The header of `core/paths.ts` gives `below` for a write that may never name the folder. It is reported twice and is stricter than the brief.
- **`seckey` in `about.html` (call 11).** `vendor/.../liquid-4.0.4/lib/liquid.rb:41` has `VariableParser = /\[[^\]]+\]|.../`, which cannot read a nested bracket, so the assign is needed and is the narrowest way.
- **Premises:** the ones I grepped reproduce. No new dependency; the diff touches no `package.json`. No path is outside the write list except `docs/diagrams/*`, which the report marks.

### Proof

**P1. The moved link row dropped the assertion on the outside file, and the report says it kept it.**
- Place: `tests/routes/sessions/website.test.ts`, row 'a file that is a link to a file out of the folder' and the loop under it; report table row for `website.test.ts`.
- Hunk removed: `expect(readFileSync(outside, 'utf8')).toBe('kept: 1\n');`
- Hunk added:
```
plant: (site) => {
    const outside = join(outsideFolder(), 'industry.yml');
    writeFileSync(outside, 'kept: 1\n');
    symlinkSync(outside, join(site, INDUSTRY_PATH));
},
```
  with `expect(onDisk(world).filter((name) => name !== value)).toEqual([]);`
- Report's words: "nothing written, no approval, the outside file kept".
- What is wrong: the row never reads the outside file, and `outside` is local to `plant`. The report's "the outside file kept" has no assertion behind it. The filter also lifts the nothing-written check from `value` in the rows of case M, where only the link row needs it.
- Judgment on the row move itself: right. Case F wants `website-bad-path` for a link out of the folder, and with no `approve` on the row the 200 on the unchanged tree is the asking answer, so the failing line is genuine. Only the assertion was lost.
- Failure scenario: a later change that writes through the link without a History record, moving the check after a write path, leaves `log.listed()` empty and the 409 in place. The row stays green while the file outside the website is overwritten, which is the case the old test held.

**P2. A row of the assertion table states the opposite of the diff.**
- Place: report, row `tests/server/root/watch/website-watch.test.ts`: "the literal paths | the same paths, through `website.files` in the shipped shape".
- Hunk: `-const GENERATED = [CV_FILE, PAPERS_FILE, INDUSTRY_FILE];` becomes `+const GENERATED = ['_data/data.yml', '_data/publications.yml', '_data/industry.yml'];`
- What is wrong: before was the imported constants, after is the literals, and that file sets no `website.files`.
- Failure scenario: a reader takes the slow watch test as a run of the wiring at `portfolio.ts:658` with configured paths. It runs shipped paths only; the configured watch list is held by `siteFiles` rows alone.

**P3. Judgment calls 1 and 3 state behaviour with no quoted check and no row.**
- Place: report, calls 1 and 3; `src/lib/server/content/audit/website/site.ts:107-125`.
- What is wrong: no row covers a path naming the folder itself, or two keys differing by letter case. The behaviours hold in my probe: `dot ["website.files.papers"]`, `updot ["website.files.papers"]`, `case-new ["website.files.cv","website.files.papers"]`. The report itself offers no proof.
- Failure scenario: the `spelled` folding is lost in a later edit and two new paths in different case overwrite one file on this machine, with every row green.

Moved rows and first-run lines otherwise read as sound. The test 'writes the three files while the website's own file at a configured path is missing' is correctly classed as preserved behaviour.

### Standards

**T1. `isEntry` copies an exported helper, and no helper grep is quoted.**
- Place: `src/lib/server/content/audit/website/site.ts:67-74` against `src/lib/server/core/git/run.ts:300` (`export function seen`), the same five lines of `lstatSync` in a try.
- Rule: spec line 88, "before writing a helper, type or schema, grep ... quoting that grep in the report". The report's greps cover changed names only; `grep -n -iE "placeOf|isEntry|badPaths"` over it hits only the Doc text.
- Failure scenario: one rule held in two places drifts, as `exists` and `seen` already differ on an unreadable parent.

**T2. An export with no importer.**
- Place: `site.ts:92`, `export type BadPath = { key: string; value: string };`
- `grep -rn "BadPath\b" src tests` prints only `site.ts:92` and `:102`. Spec line 88 says such an export is removed or made local. `utils/unused-exports.sh` does not list it, so the report's "No line is added" does not settle it.
- Failure scenario: the file's public surface carries a type nothing outside it reads, so the next reader takes it for a contract.

**T3. The report lacks the head-comment list and the key statement.**
- Spec line 71 requires each head comment, doc comment and doc paragraph listed as 'still true' or 'rewritten'. `grep -n -i "still true\|rewritten"` over the report prints nothing.
- Spec line 72 requires the report to state each new key's case of collision with a configured or reserved key. Calls 4 and 6 cover empty and duplicated only.
- Spec line 58 requires a kept case in a slow-tagged file to be named in the report. Cases F, G, M, N, Q and part of D are rows of `website.test.ts`, which has `@module-tag slow`, so `npm test` does not run them. The report gives the `--tagsFilter slow` run and the module tag but does not say this. The brief's case D names the file, so the placement is right and only the statement is missing.
- Failure scenario: the look and the landing read against a list that was never made.

**T4. The try and catch of `settingsOf` guards nothing its reason names (judgment call 9).**
- Place: `src/lib/state/sessions/source/website.svelte.ts:100-106`.
```
if (config === null) return null;
try {
    return websiteSettings(config);
} catch {
    return null;
}
```
- What is wrong: the call's reason is "the configuration may not be there yet", which the line above answers: `context.ts:581` hands `entities.config()?.config ?? null`, unlike `configMap()`, whose `{}` is why `paintLimit` has its catch. The header of `reader.ts:7-9` says a reader throws only for a key with no rule. So the catch hides only a catalog defect.
- Failure scenario: an options file that loses a `website.files` row makes `off()` say "The setting website.folder is not set" for a set folder, a false sentence in place of the real defect.

**T5. New hard wrapping.**
- Place: website patch, `_industry/README.md:38`: "The text is in **`../_data/industry.yml`**, and the portrait comes from `cv.portrait_url`" followed by "of **`../_data/website.yml`**:".
- Rule: spec line 56, one line per paragraph in any Markdown you edit. The file is hard-wrapped around it. Verify 6 does not name this departure.
- Failure scenario: the edited paragraph keeps the wrap the rule bans, unreported.

**T6. A pronoun in `docs/HELP.md` points the wrong way.**
- Place: `docs/HELP.md:561`: "the three files hold what the hub gives, and its `programs:` are the research lines a paper may name."
- What is wrong: `its` follows "the three files" and "the hub", but means the website's own file.
- Failure scenario: a reader looks for `programs:` in the hub.

Judged, no finding:
- **Call 2.** Without it `placeOf` passes a dead link as a new file and `writable` accepts it, since `existsSync` is false, so the check closes the escape item 3 asks to catch. My probe gives `dangling` and `through-dangling` bad.
- **Call 3.** Native `realPath` settles existing files, so folding matters only for two not-yet-existing paths, which item 3's "two keys naming one file" covers on this case-folding machine. It is five lines; its lack of proof is P3.
- **Call 10.** One call, with a row that fails without it.
- **Call 8.** Required: `config/text/findings.yml:272` raises `group_missing` for a dotted prefix with no line.
- **Calls 4, 5, 6, 7, 12, 13, 14, 15.** Nothing against them.
- No history in comments or titles; no package id in added lines beyond the G numbers the test heads already use.
- ASCII gate ok; `grep -c` over the report gives 0; the two patches hold only the tabs of the `diff` headers.
- Sizes: `hub-names.ts` 848, `model-machine.ts` 845, `portfolio.ts` 819, `Career.svelte` 206; `tests/state/sessions/source/` holds 7 items.
- Comments and docs grepped for each changed name: no other sentence is false.

### Behaviour

**B1. The landing-order paragraph is wrong for the CV and leaves out which server presses.**
- Place: report, "Landing order matters: the website patch goes in with the press. If the press ran on a website without the patch, `about.html` and the CV would find no titles and the headings would be blank."
- Measured on scratch copies, the built files of case A on a website without the patch:
```
KeyError: 'portrait_url'
exit 1            (_scripts/cv_pdf_generator.py)
KeyError: 'portrait_url'
exit 1            (_industry/cv_pdf_generator.py)
jekyll 0
_site/publications/index.html:8
_site/cv/index.html:10
```
- So all 18 page headings are blank and both CV builds stop, which also means the press's own `website.cv` command ends red. The report's own case L says a stop; its landing paragraph says blank.
- The order the brief asks holds: the website patch first, with the old three files, gives `cv exit 0`, `ind exit 0`, so the patch may land before the press with nothing broken in between. The hub patch's place in the order does not matter, since the files of A and H are equal under `cmp`.
- Not stated, my judgment from reading the old `cv.ts` and `papers.ts`, not run: the press must come from a server running the landed code. An older process still writes the person parts and titles from `website.yml`, so the files come out in neither shape and the audit differs after the restart.
- Failure scenario: the orchestrator presses in the wrong order or on a stale server, reads "headings blank" as a cosmetic risk, and meets a failed CV terminal and a blank site.

**B2. Visible changes the before-and-after table leaves out.**
- A generated file that is a link out of the website's folder. Before: an approved press gave `website-unwritable` naming the file, after the approval was asked; a link into another served root was written through. After: `website-bad-path` naming the key, with no approval asked.
- In the audit, the same link: before, a comparison of the file; after, one bad-path finding and no comparison of any of the four files.
- The table's rows show only `../outside.yml`, whose "the press writes" is not a before state anyone could reach, since the key did not exist.
- The look needs the link state to see this. The real website's four files are plain files (`ls -la _data`), so the real hub is unaffected.

The landing window the report does name holds by reading: the audit shows the three files as differing until the press.

## 6. Declined to judge

- **The unchanged-tree half of check 5 and the report's 35 failing lines, and Output block A-first.** They need the tests run with the change taken out of the code, which the no-breakage rule forbids me. The tests were judged by reading, as the rules say.
- **`git grep` forms:** run as plain `grep`, as instructed.
- **The website's commit 4e1437c:** it takes a git command outside the allowed three. `git status --short` in the website printed nothing.
- **The base comparison of `utils/unused-exports.sh`:** the brief names no base file, so only the after-run was read.
- **The reruns of the 19 and 5 other files, and whether the timeouts are load:** told not to go further.
- **The look:** no page was opened; ports 8787 and 8790 were not touched. How the four rows, the tip and the bad-path line are drawn rests on the landing look.
- **The real `patch` application and the real press:** dry-run only.
- **The claim about an older server in B1:** read, not run.
