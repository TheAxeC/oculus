# Step Q119 brief check (on S5's worktree `.agents/worktrees/S5`, base 6005baee6 plus S5's uncommitted build; main at a5f1285bd for the files S5 does not touch)

I changed no file. Scratch work went to $TMPDIR/q119bc only. I never opened, grepped or hashed config/local.yml. Every grep over config/ carried --exclude=local.yml.

## 1. Names

1. `requirePaintLimit` (deleted by item 1.5): `grep -rn ... requirePaintLimit .` in the worktree. One hit is outside the paths, `DESIGN.md:395`: "The server reads that key at start through `requirePaintLimit` ... and stops with the key named when it is missing or is not a size". The change makes it false. DESIGN.md:395 is in neither the write list (243, 245, 402) nor the brief's list of false text.
2. `paint_limit` at start: `sed -n 62,63p tests/checks/tree/boundaries.test.ts` gives "`data/helpers/editor`, the server requiring `editor.paint_limit_kb` at start". This is outside the paths and is made false.
3. "a value the server refuses keeps the one in force": `sed -n 261p HELP.md` (S5 rewrote this line). It is outside Q119's paths and made false (a wrong value now takes its default with a finding).
4. `checkLocal` and `loadLocal` throwing: `sed -n 85,99p src/lib/server/files/source.ts` gives "a malformed value in it throws: saved, it would take the source route down with it". This is outside the paths and is false once item 3.2 makes `loadLocal` never throw.
5. `sed -n 10,11p src/lib/server/accounts/connect/rows.ts` gives "(checkLocal, the rule the start and the source tab apply)". This is outside the paths. The start no longer refuses by that rule, so the sentence is false or misleading.
6. `sed -n 282p HELP.md` gives "a body the server could not read back is refused with the reason". The brief says :282 "stays true", but after 3.2 the server reads back every body (with defaults). Only `checkLocal` refuses, so this sentence needs rewording too.
7. `sed -n 369,376p tests/checks/config/config.test.ts` (SOUND, "The keys a configuration needs to draw no finding of its own", editor.paint_limit_kb 64) is outside the range 386-403. It is made false, because a missing paint limit draws no finding under Decision 3.
8. `grep -n "loadLocal(dir)" tests/checks/config/config.test.ts` gives :90, :96-104, :120, :134-150 and :289, which assert that `loadLocal` answers a `LocalConfig` `toEqual`. They are outside the write range. The brief does not say whether `loadLocal`'s return type stays `LocalConfig`, and item 3.3's finder implies a second source of problems.
9. `grep -rln -e "program_ext" ... tests` gives open-fixture.ts:19 (`openSettings(...).programApps`), which holds as long as `openSettings` keeps its type (item 1.5). No finding.

Findings: 1, 2, 3, 4, 5, 6, 7 and 8.

## 2. The step line

1. `sed -n 257p plan.md` shows Q116's line. `grep -n Q119 plan.md` finds only rulings Z443, Z454, Z462-Z464 and Z468. The brief quotes "(plan.md:257)", a line that no longer exists, since Z468 removed Q119 as a step.
2. Mapping the quoted line: "wrong value ... gives a finding that names the key" maps to 1.1-1.3, 1.6 and 1.7. "Default is used" maps to 1.1 and 1.4. "At start and on a change" maps to 2.1, 2.2 and 2.4. "The server starts" maps to 2.1. "Findings view shows the key" maps to 1.6 and Decision 11. "Tests in settings.test.ts assert" maps to Cases 1-10. "local.ts likewise ... only that key takes its default" maps to 3.1, 3.2, 3.3 and 3.5. Z454 (D11's sentence) maps to 3.4.
3. Z463 (`grep -n "^- Z463" plan.md`): "the move stated in HELP.md with its before and after". No requirement serves it. Decision 10 says only "reported among the before and after" (the report), and item 4's HELP.md:282 bullet does not name the port move.
4. Z468 (`grep -n "^- Z468" plan.md`) folds Q119 into S5's repair round 1. The brief still has its own report path (`agents/reviews/Q119-report.md`), its own write list and its own "unchanged tree". The round needs four things stated: S5's report path; the union with S5's write list; S5's base copy (6005baee6) for `diff -rq`; and "unchanged tree" meaning S5's worktree as it stands before the round.

Findings: 1, 3 and 4.

## 3. Premises

1. Base: `git merge-base --is-ancestor 6005baee6 ec4c6f577` is true. S5's base is older than the brief's ec4c6f577, and the builder works in S5's worktree. In the files S5 changed, every line number has moved (worktree line count vs main's):
   - options.yml: 1210 vs 722
   - findings.yml: 140 vs 129
   - context.ts: 734 vs 732
   - portfolio.ts: 642 vs 640
   - config-checks.ts: 294 vs 292
   - images.ts: 341 vs 339
   - writes.ts: 549 vs 542
   - data/sources/config.ts: 84 vs 83
   - config.test.ts: 529 vs 522
2. options.yml, the brief's line vs where it is in S5's worktree (`grep -n "^        <key>:" config/catalogs/options.yml`):
   - head :1-12 is now :1-14
   - `behavior.yml:` :109 is now :170
   - usage_tiers :141-146 is now :215-224, and its description :143 is now :218
   - usage_refresh_min :149 is now :228
   - usage_refresh_model :154 is now :236
   - slurm.resource :236 is now :336
   - processes.patterns :256 is now :373
   - editor.paint_limit_kb :300 is now :452
   - open.program_ext :388-392 is now :605-614
   - local.yml :686-722 is now :1156-1210
3. "options.yml:3 names tests/checks/config/options-catalog.test.ts" is false on S5's tree. `sed -n 3p config/catalogs/options.yml` now ends "tests/checks/config/config.test.ts reads the shipped catalog with no finding", and `grep -rn options-catalog config src tests HELP.md DESIGN.md` prints nothing. The rest of the premise stands: no check holds a `default` to the file's value (section 9).
4. S5 also changed `usage_refresh_model` to `control: choice, values_from: models` and `slurm.resource` to `choice, values_from: clusters`, and gave the cadences and windows `min` and `max` (`sed -n 225,240p;333,365p`). The brief's premise that these keys are plain text or number options has moved (see section 6, item 10).
5. `catalogOf` was at options.ts:55-57. It is now at :360 (`grep -n "export function catalogOf" src/lib/data/sources/config/catalog/options.ts`).
6. context.ts (`grep -n` in the worktree), the brief's line vs the worktree's:
   - :266 is now :267
   - :270-285 is now :271-286
   - "Read for their check alone" :277 is now :278
   - `reportFindings` :184-188 is now :185-189
   - :303-310 is now :304-312
   - :371-374 is now :373-376
   - :194 is now :195
   - `reloadLocal` :653-669 is now :655-671
   - `apply` :672-700 is now :677-702 (on main it starts at :675, not :672)
7. portfolio.ts: :497-525 is now :498-527, `relevant` :147 is now :148, and `queue` :617 is now :619. config-checks.ts: `READERS` :104-121 is now :105-122, `FINDERS` :128-136 is now :130-139, `refusedBy` :202-237 is now :204-239, :92-103 is now :93-104, and :219 is now :221.
8. images.ts :39 and :328 are now :41 and :330. writes.ts :231 is now :237, and `changesKeep` :258 is now :265 (`grep -n "loadLocalOrDefaults\|changesKeep"` in the worktree). config.test.ts :388-403 is now :389-404 (comment :389-390), the loadLocal describe is :75-153, and :288 is now :289.
9. Ledger references: Z454 is at plan.md:1175, not :1171 (`grep -n "^- Z454" plan.md`; the file is being edited). D11's case 31 is at D11.md:268, not :197 (`grep -n "rite_dap_bin must be" agents/briefs/D11.md`).
10. Unused exports: `sh utils/unused-exports.sh` in the worktree prints 380 lines ("Unused exports (256)"), not 381. Over the files Q119 touches, the brief's list leaves out four lines: `catalogs.ts: VOCAB_KEYS, iconCatalog`; `config-checks.ts: optionText, replacedText`; `context.ts: hostInfo, createServerContext, carryServerContext, carryingHandler`; and `context.ts: ContextDependencies`.
11. pty/routes.ts: lines 28, 203, 311, 353 and 429 hold in the worktree. On main (D37 landed) they are 29, 225, 324, 361 and 433 (`git grep -n loadLocalOrDefaults HEAD`). Three of main's hunks sit next to Q119's edits: old 305-310, old 347-352 and old 425-427 (`git diff -U0 6005baee6 HEAD -- .../routes.ts`). Landing S5 with Q119 by cherry-pick is therefore not a simple merge there.
12. These hold, rerun in the worktree:
    - settings.ts: 297 lines; every reader line; `blockOf` :66; `settingOf` :73; `confirmDelete` :181; `defaultPatterns` :228; `behaviorDropped` :240; `processesSettings` :252.
    - local.ts: 376 lines; `applyLocal` :257; `loadLocal` :328; `reportedLocal` :340; `loadLocalOrDefaults` :349; `checkLocal` :368.
    - editor.ts :32 and :41; fetch-period.ts :19 and :25; autofetch.ts :73 and :141; refresh.ts :152, :170 and :360.
    - live-settings.ts :114-118, :121-130 and :152-189.
    - catalogs.ts :176 and :188-192; G13 at guarded.md:71-73 and :101.
    - one oculus `behavior.yml` (`find`); no test of live-settings or createServerContext (`grep -rln`, rc=1).
    - 10 call sites of `loadLocalOrDefaults` in 7 files; settings.test.ts 161 lines and local.test.ts 55 lines.
    - every listed catalog default equals the file's value (section 9).

Findings: 1 to 11.

## 4. Cases and checks

1. Case 25 (and 26 if it builds a context the same way) with real `ContextDependencies` would start two things. One is the usage refresh: tmux plus Claude processes on the default accounts (`sed -n 1,13p src/lib/server/machine/usage/refresh.ts`, context.ts:384). The other is the HPC poller over ssh (`grep -n "ssh" src/lib/server/machine/hpc/poll.ts`). That goes against spec.md "Where you work" (synthetic fixtures only) and the no-ssh rule. The case must use case 11's recorders, with only `loadLocal` real.
2. Case 15 must name the opener as the fixture's recorder (`src/routes/api/(files)/open/+server.ts:19-20` hands `locals.server.openPath`). Otherwise "a .pdf file opens" launches an application.
3. Case 7 asserts `programApps` (`data/helpers/files/opens-in-program.ts`) and case 10 asserts `paintLimit` (`data/helpers/editor.ts`) inside settings.test.ts. Both units are outside G13's Code line, `src/lib/data/sources/config/`, which goes against spec.md "What every package obeys": a test exists only as the test of one entry. Case 9's `behaviorFindings` belongs to catalogs.ts, which G13 tests in config.test.ts, not settings.test.ts.
4. Item 1.5 says `paintLimit` stays in editor.ts and answers from "the same rule as the server's reader", which lives in settings.ts, with the catalog default from `catalogOf` (data/sources). `sed -n 37,45p tests/checks/imports/order.ts` places `data/sources` above `data/helpers`, so editor.ts importing settings.ts or options.ts is an upward import, and G17 (`tests/checks/imports/order.test.ts`) refuses it. The brief must place the rule where both sides may import it: settings.ts, which the page may import per boundaries.test.ts:165.
5. The quoted-run wording "`npx vitest run` on a file kept out of the tree after the run" allows the probe to sit in the worktree while it runs. S5's refuter (Standards) found exactly that against spec.md "Where you work".
6. Decision 11's look is one wrong value and is "owed until Axel restarts". Z467 (`grep -n "^- Z467" plan.md`) asks every landing look to exercise the feature across real cases before the landing commit, and says a step whose look fails is not committed.
7. Case 19 and item 3.3 give the problem form `<key> must be <words>`. Two of local.test.ts's rows do not fit it: "accounts[1].label duplicates a Claude label or reduced label: a-b" and "calendars[1].label repeats a for ics" (`cat tests/data/sources/config/local.test.ts`). The finding words for those rows are not given.
8. Cases 11 and 25 say createServerContext "returns on port 8790". `createServerContext` does not listen, so the assertion is the context's `local.port` (context.ts:267). This is minor.

Findings: 1 to 7.

## 5. The question

1. Case 1: yes, it could pass without the goal. If the synthetic catalog's defaults equal the shipped ones, a literal fallback in code (which spec.md forbids) passes cases 1 and 9. The brief must require case 1's catalog defaults to differ from the shipped values.
2. Case 9: yes on its own (a literal equal to the shipped default passes it). It is closed only together with item 1 above.
3. Verify 4 (`grep 'refuses to start' 'in force and is logged' options.yml`): yes. It passes with DESIGN.md:395, HELP.md:261, HELP.md:282's last sentence and source.ts:87-92 left false (section 1).
4. Step-line part "the Findings view shows the key": yes. Its only proof is the look, which Decision 11 lets stay owed after landing.
5. Case 24: passes on both trees by design. It is a preservation check, not proof of the goal, which is correct.
6. Cases 2-8, 10-14, 16-23 and 25-27, and items 1.1-1.7, 2.1-2.5 and 3.1-3.5: no. Each asserts the default or the finding at the key, red on the base, with case 1's caveat.

Findings: 1, 3 and 4.

## 6. Implied inputs

1. Every row of `accounts`, `calendars` or `mail` failing: `[]` or the default list? Missing.
2. An undo that puts back a wrong value the file held, through `putBackConfigValue` then `refusedBy` (config-value.ts:209) or the value write (:167). Under Decision 6 it is refused, so the undo fails. The expected result is missing (it overlaps S5's Behaviour 1, section 10).
3. A value that reads, with a catalog `default` that fails its shape: is the value read, with no throw and no finding? Missing (item 1.1.3 implies yes).
4. Start with options.yml dropped by the merge and one wrong value: Decision 2 says the start throws, naming the key and the catalog. There is a unit case (8) but no start case.
5. A misspelt key under a block (`slurm: { pol_min: 5 }`): the default, with no finding (Decision 3). Missing.
6. local.yml unreadable (EACCES, or a folder at the path): every default, one problem with key `''`, marked unread (item 3.2). Missing.
7. A wrong `port` while running: `portMove` to 8790 (Decision 10, Z463). Missing.
8. An unknown local.yml key at start read twice (by `loadLocal` and by the item 3.3 finder): how many warnings? config.test.ts:104 expects exactly one per `loadLocal` call. Missing.
9. A whole block present as `{}`: the defaults, no finding. Covered by case 3's "missing one key" only in part.
10. A hand-written value the reader accepts but S5's catalog control refuses, and the reverse:
    - `latex.latexindent_path: foo`: the reader accepts it (settings.ts labelShape), but config-fit's `path` control refuses it.
    - `usage_refresh_model` or `slurm.resource` naming no model or cluster: the reader accepts it, but `values_from` refuses it.
    - `slurm.days: 1.5`: the reader refuses it, but config-fit has no whole-number rule (`grep -n isInteger config-fit.ts` prints nothing).
    - `editor.paint_limit_kb`, `search.*`, `changes.keep` and `git.autofetch_minutes`: these have no `min` in the catalog, but the reader refuses 0 or a negative value.

    The brief does not say which rule makes a value "wrong" for the finding, or what the Settings view's mark (S5 item 4.3) and the Findings view each show for these keys.

Findings: 1 to 10.

## 7. ADRs

1. `ls tools/oculus/docs` in the worktree and on main lists only `diagrams`, and no `adr:` key exists (`grep -n adr orchestrator-state.md` prints nothing). There are no records.

Findings: none.

## 8. Dictated text

1. "slurm.poll_min must be a number from 1 to 35791; the default is used" (`grep -n "must be a number from 1 to 35791; the default" agents/briefs/Q119.md`, :184): holds. It matches S5's min 1 and max 35791 (options.yml:353-355).
2. "calendar must be a map; each of its keys takes its default" (:184): holds.
3. "usage_tiers.b must be text; the entry is not read" (:184): holds.
4. "latex.formatter must be one of none, latexindent, tex-fmt, badness; the default is used" (:184): holds. `tex-fmt` is a name, not a dash.
5. "editor.paint_limit_kb must be a number above zero; the default is used" (:184): holds.
6. The forms `<key> must be <words>; the default is used`, `<block> must be a map; each of its keys takes its default`, `<key> must be <words>; the entry is not read` and `...; the row is not read` (:89 and :184): each holds against the prose rules. Form coverage is section 4, item 7.
7. `${file}: ${key} must be ${words}` (:90): a code line that holds.
8. "local.yml: rite_dap_bin must be a non-empty string" (:39, :90, :184): holds, and is fixed by Z454.
9. Decision 11's commands (`cp tools/oculus/config/behavior.yml <scratch>/behavior.yml.bak`, `shasum`, `git diff --exit-code -- tools/oculus/config/behavior.yml`) (:190): code lines that hold.
10. `LC_ALL=C grep -n '[^ -~]' agents/briefs/Q119.md` prints nothing. Every ` - ` hit is a list marker.

Findings: none.

## 9. Q122, what it needs written

1. On S5's options.yml the test name is already true. `sed -n 3p` names `tests/checks/config/config.test.ts` "reads the shipped catalog with no finding", which is T2 at config.test.ts:525-529, 'reads the shipped options catalog with no finding' (`sed -n 525,529p`). `grep -rn options-catalog` prints nothing.
2. Three places in S5's tree still define `default` as the tracked file's value, and nothing holds it:
   - :3: "the value the tracked file holds (`default`)"
   - :9: "`default` (the value the tracked file holds)"
   - options.ts:145: "A leaf option carries `default`, the value the tracked file holds"

   `grep -n "default" tests/checks/config/*.ts tests/data/sources/config/catalog/options.test.ts` shows no comparison with a file.
3. Today the claim is true. `python3 $TMPDIR/q119bc/cmp.py` (it walks each leaf entry's dotted key in its file) prints "leaf entries with default 108 differing or absent 0". That holds on S5's worktree, on main's head (files from `git show HEAD:`) and on main's working files.
4. A check that holds the equality would go red whenever a setting is saved, by design:
   - The Settings view writes the tracked file (`config-key.ts:107`, `join(configDir(engine), file)`).
   - A row is Modified exactly when its value differs from the default (`state/system/config/rows.ts:205`).
   - Reset writes the default (`state/system/config/write.ts:127`).

   Option (a) would be a row in config.test.ts (held whole under G12 and G13): `describe('the options catalog')`, 'holds each option's default equal to the value its shipped file holds', comparing each leaf `default` with the value at its key path in `loadConfig(engineDir()).config`. It turns the landing list red after any Settings save, and it forbids the Modified state that S5 builds.
5. Option (b) would say instead what the default is, at :3, at :9 (both shapes) and at options.ts:145:
   - the value the Settings view's Reset writes and its Modified filter compares with;
   - for the settings of `settings.ts`, the value used when the key is missing or wrong (G13).

   The fact that each shipped default reads through its reader is held by Q119's case 9 in `tests/data/sources/config/settings.test.ts`, whose title the round's brief must give.
6. Recommendation: (b). (a) costs about the same to write but contradicts the Modified and Reset design in rows.ts and write.ts. (b) is cheaper, and it is the one that ends the cause, because the claim is wrong by design rather than merely unchecked. DESIGN.md:85 ("its default") and HELP.md:274 ("its default") stay true under either option.

## 10. Where Q119 and S5's round-1 findings touch the same lines (S5's worktree numbers)

1. options.yml head :3 and :9 (Q122), :10 (Spec 1 and Z486, `empty: <words>`) and :13 ("A reader clamps or refuses a value it cannot use", read again under Q119): one comment block.
2. options.yml :218, :228, :236, :336, :373 and :452: Q119 item 4's six descriptions sit inside S5's rewritten entries. S5's `min` and `max` on the cadence and window entries (:343-429) and settings.ts's MAX_CADENCE_MIN, MAX_DAYS and MAX_PER_SIGNAL (settings.ts:18-42) are two copies of one bound, which spec.md's principle "a rule exists once" covers.
3. catalog/options.ts:145 (Q122) and :163 (refuter Standards, G23 comment-width red, 102 columns per `awk 'length > 100'`).
4. DESIGN.md:85 (Z486 already says both forms of `empty`) and Q122, if the round also states there what a default is.
5. context.ts:304-312 and portfolio.ts:513-527. Refuter Proof 1 (case 60: `optionFindings` at start and on the push, read but not run) and Q119's local finder join the same two lists. One probe in Q119's cases 11, 25 and 27 can show both.
6. config-checks.ts `READERS` :105-122 and `refusedBy` :204-239, with config-value.ts :167 and :209. Refuter Behaviour 1 (an undo with no sources refused, config-fit.ts:337-340 and :503-507) and Q119 Decision 6's new `READERS` entry both decide whether an undo can put back what the file held (section 6, item 2). With S5's config-fit refusing out-of-range Settings writes, Decision 6's reason against option (b) needs reading again.
7. Probe practice: refuter Standards (scratch tests ran inside the worktree's tests/ with logs in /tmp) and Q119's Cases wording "kept out of the tree after the run".
8. Guarded tests: refuter Proof 4 (G3 not run, G9 run in part) and Q119's changes to G3 code (`grep -rl local.yml src/lib/server` lists writes.ts, project-files.ts, compose.ts, routes.ts, context.ts and live-settings.ts) and to G8 code (writes.ts, writes/config/config-checks.ts). Q119's verify list names none of the G3, G8 or G9 test files.
9. Landing-list tree checks: refuter Standards (G23 comment-width, G21 duplication and G17 order red), section 4 item 4 (G17 for `paintLimit`), and Q119's many rewritten comments. Neither brief's verify list runs comment-width, duplication, order, history, size or boundaries.
10. Report file table: refuter Standards (paths outside the write list not marked) and Q119's roughly 20 paths outside S5's write list.
11. A grep over config/ without the exclusion: refuter Standards (the builder's `--exclude` stood after `--`). Q119's Conventions forbid reading local.yml, but they do not dictate the form "`--exclude=local.yml` before the pattern".
12. HELP.md:261 (S5 item 9 rewrote it; Q119 makes its last sentence false).
13. config.test.ts:1-5 head (Q119 drops "and loadLocal throw"). S5 added the `optionFindings` describe at :525-529, but the head's reader list at :1-2 does not name it.
14. findings.yml: Q119 changes `findings.config` at :58-80 (drops `paint_limit` at :67), next to S5's `findings.options` at :81-91.
15. data/sources/config.ts: S5's export at :83; Q119 drops `loadLocalOrDefaults` at :40 and exports the new readers and finder.
16. writes.ts:237 (Q119) in `target()` beside S5's `entities` at :245, and images.ts :41 and :330 (Q119) beside S5's import change at :40-43.
17. Token discipline: refuter "Number of runs". The combined round runs the verify list once.

## Declined to judge

1. Whether Decision 6 should stay (a) now that S5's config-fit checks min, max and choice items on a Settings write. That is the orchestrator's ruling, and the facts are in section 10, item 6.
2. Whether settings.ts should read its bounds from S5's catalog `min` and `max`, and whether "wrong" follows the reader's shape or the catalog's control (section 6, item 10). Both are design choices for the orchestrator.
3. Whether a cherry-pick of S5 with Q119 onto main actually conflicts in pty/routes.ts. I read the hunk positions only and ran no merge (no git command that writes objects).
4. Every case's runtime result. I ran no case. The only things I ran were the defaults comparison and `unused-exports.sh`, read-only, in the worktree.
5. Whether options.yml's added "is refused" sentences (:343-602) are false. Under G13's own words ("refused with a finding ... default used") I read them as true. Q119 item 4 rewrites only the six named sentences.

Usage: ordo-high on claude-opus-5-5 (a5b40ed74302680f1), 280,042 tokens, 91 tool uses, 15.1 min.
