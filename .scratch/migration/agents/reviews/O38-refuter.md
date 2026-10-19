# Step O38 refuter report (on /Users/axelfaes/workspace/research-hub/.agents/worktrees/migration-O38, base db086e36d)

A page this report cites (the rules file, a standard, a skill's text) is named with its section, never with a line number, since a page's lines move and a section's name does not. A finding in code keeps its `file:line`.

The report is written in the rules file's character set. A character outside it in a quoted line is written by its name in angle brackets, such as `<tab>` or `<em dash>`.

I changed nothing in the worktree, the main checkout or the ledger. All runs used `PATH=$HOME/.nvm/versions/node/v24.21.0/bin:$PATH` from `tools/oculus` in the worktree. Every vitest and probe run used `HOME` set to a fresh folder under `$TMPDIR`.

## Verification (rerun by the reviewer)

```
1. npm run diagrams: not run, because it writes files. The staleness of the diagrams was checked with tests/checks/.../diagrams.test.ts instead: 47 passed with --testTimeout 0 --hookTimeout 0 (it times out at the default timeout).
   npm run test:quick -- --base db086e36d   EXIT 0
     467 changed file(s); 250 test file(s), 9 essential
     ok ASCII gate (1.9 s)
     ok prettier (3.5 s)
     ok svelte-kit sync (49.6 s)
     ok eslint (86.1 s)
     ok svelte-check (96.6 s): 525 FILES 0 ERRORS 0 WARNINGS
     ok vitest (187.1 s)
     test:quick: 236.9 s (limit 45.0 s); every command passed
     over the time limit
2. The guarded tests (135 files: G1, G8, G9, G13, G14, G28, G30, G32, G35, G49, G79, G85, G111 to G115), with OCULUS_TEST_HUB=<worktree root>:
     Test Files  3 failed | 132 passed (135)
     Tests  3 failed | 1685 passed (1688)
   All three failures were 5000 ms timeouts under load: the config-folder glyph row, integrity, and git.test. The three files run alone:
     Test Files  3 passed (3)
     Tests  50 passed (50)
   No skip was printed.
3. npx vitest run tests/checks/tree/boundaries.test.ts tests/checks/tree/size.test.ts
     Test Files  2 passed (2)
     Tests  21 passed (21)
4. sh utils/folder-check.sh: exit 0
5. LC_ALL=C perl -ne 'print "$ARGV:$.:$_" if /[^\x20-\x7E\n]/; close ARGV if eof' over the 86 changed hub files outside tools/oculus and the 18 new .oculus/data files. It prints lines. The moved files keep the base's glyphs: check marks in venues.yml, emoji in applications/funding/education/tasks.yml, and <euro sign>. It also prints accented names (G<u with diaeresis>iza, Drma<c with caron>, Li<e with grave>ge, E<e with acute>n). The only non-ASCII on an added line is the accented name G<u with diaeresis>iza. The report quotes no run of this item.
6. Case 16's grep from the worktree root: 43 lines. They are the 34 scout lines of .oculus/data/academic/leads.yml, CLAUDE.md:56,60,72, funding/2026-fwo-senior-transplant/proposal/proposal/form-fields.md:238,635,637,641, .agents/plan.yaml:12 (the session's, Part 7), and tools/oculus/DESIGN.md:61 (oculus's own state folder feeds/, a false hit of the pattern).
7. python3 -c "import yaml,glob; [yaml.safe_load(open(f)) for f in glob.glob('.oculus/data/**/*.yml', recursive=True)]": exit 0 (18 files)
8. sh utils/unused-exports.sh, diffed against O38-base/unused-exports.txt. The diff matches the report's section 12. Five new lines: cluster.ts jobScript, local.ts systemProcessOf and ProcessInfo, plan.ts stateOf, routes.ts listFiles. Each is used only by tests (see Standards).
9. Read from the report's case table. No rerun on the base copy was made by the reviewer.
10. Not rerun. It is a reading item; see Standards for the sentences found.

Evidence the report quotes, rerun:
K4 / case 1-10 run (HOME=$TMPDIR/o38rev-home.*): npx vitest run tests/routes/machine/recover.test.ts tests/server/machine/runs/recover/ tests/routes/hubs/make.test.ts tests/data/sources/config/ tests/routes/hubs/machine-answer.test.ts tests/data/snapshot/normalise.test.ts tests/data/snapshot/schema-rules.test.ts tests/routes/edit/rail.test.ts tests/state/workbench/count-row.test.ts tests/shell/window/menu-answer.test.ts tests/server/desktop/menu-template.test.ts tests/state/system/apps/app-keys.test.ts --testTimeout 0
   Test Files  24 passed (24)
   Tests  530 passed (530)
K1 ls -d of the 13 deleted tool/registry/collection paths: 13 x "No such file or directory". The three .agents/skills folders and the six .claude/.codex skill links: each gone.
K3 LC_ALL=C grep -c '[^ -~]' .agents/skills/project-cleanup/SKILL.md: 0
grep -c "^  - key:" .oculus/data/research/data.yml: 63
grep -c "chip: true" config/catalogs/vocab.yml: 33
grep -rn "body.rice:where(:not(.rice-plain))" src | wc -l: 12;  ... rice-sans ...: 20
package.json:81 "7z-wasm": "1.2.0"  (base: 0 lines naming 7z)
grep -rln "darus\|pdebench_data_urls" projects tools/oculus/.scratch/migration/agents: O38-recover.md, D73-report.md, O38-report.md (no file address)
grep for the Part 10 old names (nav_live|tab_split|leads_badge_days|tab_rollup|typeSplit|RAIL_COLLECTIONS|RAIL_CELLS) over src config docs HELP.md DESIGN.md tests: only ui.tab_split_* (the pane Split words, unrelated)
grep -rnw for the Part 13 old keys (status_legend, status_palette, waiting_status, type_color, type_order, archive_dead, terminal_types, archive_outcomes, archive_categories, project_label_mode, archive_label_mode): none; deadline_horizon_days only under focus:
Recorded answers: the 11 .body files are byte-identical to the fixtures. tr -d '\r' < O38-fixtures/physionet-mitdb.headers | diff - tests/server/machine/runs/recover/answers/physionet/mitdb.headers gives:
   1c1  < HTTP/2 200 <space>  ---  > HTTP/2 200
   The same trailing space is gone from the first line of 7 header files (dandi, figshare, hf p1, hf p2, mimiciv-nologin, mitdb, tcia). Geo, stanford and the two zenodo files are equal once the CR is removed.
Declined: case 14's probe (see Declined to judge).
```

## Verdicts

Items of the brief's "What to build", in its numbering:

- 1.1: holds. K1 rerun; the nine skill paths are gone.
- 1.2: holds. K3 gives 0. The 14 `.depositignore` comments are in the report's section 8 (7 of them outside the path list, named there). Not every line was read by the reviewer.
- 1.3: holds. Case 16's grep leaves only the lines listed under Verification 6.
- 1.4: not applicable (the session's at landing).
- 2.1: violated, Spec 3. 63 entries are typed lists, but pdebench has `retrieval: []` and pbc-cirrhosis is `library` where the table asks for `url`. The pdebench blocker is real: the reviewer's grep finds no DaRUS address in the tree. For pbc, the dataset page `https://archive.ics.uci.edu/dataset/878` is in `projects/manuscripts/meseret-cirrhosis/manuscript/refs.bib:13`, but the download address is not.
- 2.2: holds. `normalise-parts/retrieval.ts` parses the list once and sets `recover` only for an all-runnable, non-empty list. Reached by the 24-file run.
- 2.3: holds. `machine-values.ts:14-15,107` and `machine-answer.test.ts:117-118`. Part of the 24-file run.
- 2.4: holds for the code, with two Standards findings on its tests. The config file is written mode 600 (`local.ts:247`, `cluster.ts:254`; `safety.test.ts:349,403-405`). The Behaviour finding 1 on per-poll login requests applies here too.
- 2.5: holds. G1 row of `recover.test.ts`, in the 24-file run.
- 2.6: holds against the brief, conflicts with DESIGN.md, Spec 1.
- 2.7: holds, by reading `DatasetCard.svelte` and `views/sources/data/recover/`. The look is at landing.
- 2.8: holds against the brief, conflicts with DESIGN.md, Spec 1.
- 2.9 to 2.11: holds, by the report's ledger. Not reread line by line by the reviewer.
- 2.12: holds. `package.json:81`.
- 3.1: holds. 18 files under `.oculus/data` parse (Verify 7). The old folders are gone (K1).
- 3.2: holds. `config/sources.yml:29,50`. No `REGISTRY_FILES`, `LITERATURE_FILE` or `CAREER_FILE` in src (`grep -rn`: none).
- 3.3: holds. The hub `.oculus/config.yml` holds no `collections:` and no `career_file` (grep).
- 3.4 to 3.6: holds, by the report and the 24-file and guarded runs.
- 3.7: holds. `migrate-joint-work.mjs` is deleted (`git status`: D). `rename-program-to-pillar.ts` is also deleted, outside the list and named in the report.
- 4.1 to 4.5: holds. Case 16's pattern (`data/archive|ptb-xl-raw|PED_unzip`) has no hit. Case 18 was read by the report. The reviewer did not reread `run_all.sh`.
- 5: holds (covered by 2.1).
- 6.1 to 6.5: holds. 12 and 20 rules under the two selectors, the classes in `theme.ts:44,50`, `ui.svelte.ts` `brackets` and `monospace`. The look is at landing.
- 7: not applicable (the session's).
- 8.1 to 8.6: holds, by `make.test.ts` (24-file run) and the report's case 21 and 22 runs. Case 21's numbers come from a removed probe (Spec 4).
- 9: holds (see 2.3).
- 10.1: holds. `config/layout.yml:304-325` equals the brief's table row for row.
- 10.2 to 10.6: holds. The old names grep gives none.
- 10.7: holds on the hub per the report's probe (Talks & Events 2; Projects hover "in progress: 20 | idea: 33").
- 11: holds. `ui/display/text/` holds LinkedText and CodeText, and `ui/display` holds 10 items (ls). The `html.ts:670-711` rule matches the brief's address rule.
- 12: holds. `affiliation_retired`, `theme_labels_retired`, `key_renamed`, `RETIRED_KEYS` and `RENAMED_FIELDS` are gone (report K11; case 27 rows in the 24-file run). The rule is also applied to `ui.svelte.ts` (Behaviour 3).
- 13.1: holds. 33 `chip: true`.
- 13.2: violated, Behaviour 2. The Archival order changed.
- 13.3, 13.4, 13.6: holds. The Part 13 old key grep gives none, and the boards and focus readers are in place.
- 13.5: violated, Behaviour 4. A status-less host is now '' in the snapshot apps receive.
- 14 (statuses, types, tiers, ticker, Focus columns): holds for the base values sampled; 29 places were compared with the base, see Behaviour 2.
- 14 ("compared as the base compares it, trimmed, lower case"): holds in behaviour. The vocab.yml header says otherwise (Standards 5).
- 14 (sweep listed): holds, by the report's section. Not reread whole.
- 14 (options catalog gets each new flag and list with its help): unmet for the vocab.yml flags and `publication_kinds`, Spec 2. Met for the five `focus.*` lists.
- 14 (HELP.md and DESIGN.md): holds, by the report.
- 15.1 to 15.3: holds. Config-folder and schema-rules rows (guarded run). `behavior.yml:121`, `options.yml:486`.
- 16.1 to 16.4: holds. `menu-answer.test.ts:104` and `menu-template` rows. `:help` is `available` and `:keys` added (palette.ts diff).
- 17.1, 17.2: holds, by the report's removed probe (Spec 4) and the palette diff.
- 17.3: holds. `cmd_theme_hint` and `cmd_file_icons_hint` now read `'<theme>'` and `'<file icon theme>'`, as `cmd_language_hint` reads `'<language>'`. The inline list is gone. The brief says the hint "goes"; the keys are kept as the bare argument hint the other list modes use. This is a reading of "goes", stated in the report's judgment calls.

Cases of the brief's "Cases":

- 1 to 10: met. 24-file run, 530 passed. Case 9 rests on a real-process wall-clock test (Standards 2).
- 11: met, by reading `cluster.ts:319,348,399` and the safety row.
- 12: met, by reading `retrieval.ts`.
- 13: met. The integrity file is in the guarded run (passed when run alone).
- 14: not verifiable by the reviewer (declined). The report's rerun used an edited copy of the probe (Spec 4).
- 15: met. make.test rows in the 24-file run.
- 16: partial, Proof 2. 43 lines, not only the 34. The extra 9 are lines the builder may not touch, plus one false hit.
- 17: not verifiable (the look's).
- 18: met by the report's reading. Not reread.
- 19: met. `local.test.ts` in `tests/data/sources/config/` (24-file run).
- 20: met. machine-answer row.
- 21: met by a removed probe. Not reproducible (Spec 4).
- 22: met. make.test rows.
- 23: met by the report's reading.
- 24: partial. The "map form is a finding" half is by reading only, "not run as a test". 2.1's two entries apply.
- 25: met. counts.test rows and the report's hub probe.
- 26: met by reading `html.ts:676-711`. The 3MI entry is absent from the tree.
- 27: met. normalise and schema-rules rows.
- 28: met on the hub (no paused project there). The order contract is broken for a hub with one (Behaviour 2).
- 29: met by the report's probe and rows.
- 30: met. Config-folder rows.
- 31: partial. The menu, palette and persistence are by reading only, the rest is the look's.
- 32: met by rows and a removed probe.
- 33: met by a removed probe (Spec 4).
- 34: met for the key and catalog entry; the rest is the look's.
- 35: met. The unit runs are named.

## 1. Spec

- `src/lib/state/system/machine/recover.svelte.ts` (`POLL_MS = 3000`), `src/lib/views/sources/data/recover/Recover.svelte:94-99`, `src/lib/views/system/machine/hpc/Login.svelte:58-61`: "setInterval ... while running" / "while the fold is open".
  - What is wrong: the brief (items 2.6 and 2.8) asks for polling, and `DESIGN.md` "Live data" says "the page polls nothing: no repeating timer of the page asks the server for anything". The builder followed the brief and raised the clash as open item A, so this is a brief-versus-DESIGN clash, not a builder deviation.
  - What a server-push design needs on the existing channels:
    - a server watcher per running dataset, started by the POST that starts a run and ended when no run remains, as `src/lib/server/machine/hpc/poll.ts` `watchHpc` is started from `src/lib/server/root/watch/pollers.ts`;
    - on this Mac, the pid file's process and the target folder's bytes, read on the server;
    - on the cluster, one batched ssh command (`tmux -L oculus-recover ls` plus the per-dataset byte count) per interval, as `batchCommand` does for the Live HPC watcher;
    - a channel `recover` published through `Hub.publish` (`src/lib/server/core/channels.ts`), with its payload shape in `state/client/shapes/payloads.ts` beside `hpc` (:51), read by the store through `payload('recover')` (`state/client/entities.svelte.ts`);
    - a GET only on open, with the access check made once per open and not once per refresh.
  - Failure scenario: as built, every open Recover view and the open Login node fold each send a request every 3 s. Behaviour 1 gives the cost.
  - Verdict: items 2.6 and 2.8 hold against the brief. The clash is Axel's (open item A).

- `config/catalogs/options.yml:6` header, `server/edit/writes/config/config-key.ts:121-125`, `config-value.ts:157-160`: "the file must be one of its tracked files, the key one of its entries".
  - What is wrong: Part 14's "the options catalog gets each new flag and list with its help" is not met for the vocab.yml flags or `publication_kinds`. The builder's reason is substantively right, with one correction. The catalog keeps no list of tracked files: `readCatalog` (`catalog/options.ts:313-331`) takes any file key. The write's gate is `optionOf(catalogOf(...), file, key)` plus the `LOCAL_NAME` refusal, so an entry for vocab.yml would make Settings list it and the writes accept it. `placeOf` (`config-checks.ts:116-121`) would put the write at `config/vocab.yml`, while the file is at `config/catalogs/vocab.yml`.
  - The only file the catalog describes without Settings writing it is `local.yml`. It is special-cased by name in both writes. There is no catalog field for a described-but-not-written entry.
  - Describing vocab.yml without making it writable therefore needs either a new catalog shape (a user-visible key) or Settings writes into a catalog file. Both are Axel's call, which the report raises as open item H.
  - Failure scenario: a reader looks in Settings for `lead_closed` and finds nothing. The help is only in vocab.yml's header comment.
  - Verdict: the Part 14 options-catalog bullet is unmet, raised as an open item.

- `.oculus/data/research/data.yml:582-595` (pdebench `retrieval: []`) and `:1053-1055` (pbc-cirrhosis `kind: library`, `call: "ucimlrepo.fetch_ucirepo(id=878)"`).
  - What is wrong: `O38-recover.md`'s table asks for `url` sources for both. The pdebench addresses are not in the tree (grep under Verification), and no live web API may be called, so the gap is blocked, as the report says.
  - For pbc, the tree holds the UCI dataset page address (`meseret-cirrhosis/manuscript/refs.bib:13`, `https://archive.ics.uci.edu/dataset/878`), but not the static download address, so the report's claim holds for the download.
  - The pdebench `notes:` says "the source gets a `url` row for each once they are copied from it". This is a to-do inside hub data.
  - Failure scenario: pdebench shows no Recover control. pbc shows a library call rather than a fetch.
  - Verdict: 2.1 violated for two entries, blocked as stated.

- Process deviations against `agents/briefs/O38-launch.md` and `agents/spec.md`:
  - (a) Two `sed -i` edits (`desktop-keys.ts` `OWN` rename, and a temporary probe). The launch says "Edit files with your editing tools". The current `OWN` names are consistent: svelte-check is 0 errors in Verify 1.
  - (b) The first case 14 run read 8 session records under `~/.claude` with the real HOME. After compaction the builder read its own tool-results under `~/.claude/projects`. The launch says `~/.claude` is "neither read nor written".
  - (c) Several removed probes and `o38tmp-` test copies (cases 21, 28, 32, 33, the edited case 14 probe, the hub probe of cases 25 and 29) produced the figures the report gives (49 rows, 103 rows, 30 rows and so on). The launch says "no one-off ... that edits files or computes a figure, in the tree or under `$TMPDIR`". Copying the brief's own tests into the base copy for first runs is allowed; probes that measure are not. Those figures cannot be rerun by a reviewer.
  - (d) `test:quick` ran 3 times, with no red line named as the reason. The launch allows 1 plus 1 rerun after a red line in a changed file. Spec "Tests while you work" says such a run "is a finding of the review".
  - (e) K6 `npx vitest run tests/checks` is the tree-check suite, which is a whole-suite command (`npm run test:checks`) not on the brief's verify list.
  - The tree is not changed by any of (a) to (e).
  - Failure scenario: cases 14, 21, 32 and 33 rest on evidence a reviewer cannot reproduce, and the landing record cannot tell what the probes asserted.
  - Verdict: no item violated. Process findings for the record.

## 2. Proof

- `tests/server/machine/runs/recover/answers/*/*.headers` (11 files) against `O38-fixtures/*.headers`. The report's "What in the brief was wrong" says: "'Copy the fixtures as they are' cannot hold with the ASCII gate, which refuses the CRs".
  - What is wrong: the claim names CR removal only. The rerun diff also shows the trailing space after the status code removed on line 1 of 7 files (`< HTTP/2 200 <space>` / `> HTTP/2 200`).
  - The parse is unaffected: `recorded.ts` takes the status by `split(' ')[1]` and trims header values. No assertion is weaker. The bodies are byte-identical.
  - `tests/checks/source/history.test.ts` now exempts any `.body` or `.headers` file anywhere in the tree by extension (`/\.(body|headers)$/`), not only the recorded-answers folder. The report lists this under "Edits to existing assertions".
  - Failure scenario: a reader of the report believes only line ends changed. A future `.headers` file elsewhere skips the history check unseen.
  - Verdict: none (a narrow accuracy issue).

- The report's case 16 row and "What in the brief was wrong": 43 lines, as stated.
  - What is wrong: nothing in the count. The rerun gives the same 43. Verify 5 (the perl ASCII check over changed hub files) is not quoted anywhere in the report, and the brief's "Verify before you report" asks for each item. The rerun prints the moved files' pre-existing glyphs (check marks, emoji, <euro sign>), which the item's "accented letters in names excepted and named" does not cover. The report should have named them as base content moved byte for byte.
  - Failure scenario: the landing reads "every verify item passed" with item 5 never run in the report.
  - Verdict: case 16 partial, as the report itself says. Verify 5 unreported.

- `tests/server/machine/runs/recover/runs.test.ts:163-194` (`vi.waitFor(..., { timeout: 10000 })` twice, test timeout 30000).
  - What is wrong: the lead was that this test was edited after an "expected [] to deeply equal [ 'curl' ]" failure. The file is new in this step, so no earlier form exists on disk to compare, and whether the margin was widened is not verifiable from the tree. As it stands, the failure message is the first `waitFor` timing out before the stand-in curl recorded its call. The code under test (`startLocalFetch` spawning a detached `sh` that runs curl) is not at fault: the run passes when not under load.
  - Failure scenario: under the load of a full run, a 10 s margin can expire again and the case goes red with no code at fault (the guarded run here had three such load timeouts in other files).
  - Verdict: case 9 met. See Standards 2 for the rule broken.

## 3. Standards

- New exports used only by tests: `runs/recover/cluster.ts` `jobScript`, `local.ts` `systemProcessOf` and `ProcessInfo`, `plan.ts` `stateOf`, `routes.ts` `listFiles` (Verify 8; the report's section 12 says "imported by a recover test ... and by no other production file").
  - What is wrong: `agents/spec.md` requires an export that only a test uses to be removed or made local.
  - Failure scenario: `unused-exports.sh` keeps five lines that the next step must explain or clear.
  - Verdict: none on the items. A Standards finding.

- `tests/server/machine/runs/recover/runs.test.ts:163-194`: "spawns a real detached fetch ... `{ timeout: 10000 }`", not tagged slow.
  - What is wrong: `agents/spec.md` (the test rules) says a test that cannot run in well under a second ("a real process, a timer") is tagged slow. It also says "A test waits on a signal ... never on a fixed sleep or a wall-clock margin". This test starts a real `sh` and a stand-in curl that sleeps 30 s, and polls with 10 s margins.
  - Failure scenario: `npm test` and `test:quick` include it. A loaded machine turns it red with no defect.
  - Verdict: none on the cases (case 9 met). A Standards finding.

- New test files no `agents/guarded.md` entry names: `tests/data/sources/config/boards.test.ts` (108 lines), `tests/data/sources/config/counts.test.ts`, `tests/state/workbench/count-row.test.ts` (29 lines).
  - What is wrong: `grep "boards\.test\|counts\.test\|count-row\.test" agents/guarded.md` matches only `accounts.test.ts` on the G1 line. `agents/spec.md` says a builder writes no test that an entry does not name, and a step needing a new entry stops and asks. The brief's cases 25, 28 and 29 put the malformed-form rows in "the test that covers the config check".
  - Failure scenario: three tests outside the guarded ledger, which the plan's test inventory does not account for.
  - Verdict: none on the cases. A Standards finding for the orchestrator to book or fold.

- `test:quick` time: 236.9 s (reviewer) and 117.1 s (report K7) against the 45 s limit.
  - What is wrong: `agents/spec.md` says the list "finishes within 45 s". The cause is the step's breadth: 467 changed files select 250 test files, because core data, config and shape modules changed, and svelte-check (96.6 s) and eslint (86.1 s) run over a large changed set. No single slow test was found. The real-process test above adds its own seconds.
  - Failure scenario: none for correctness. The limit cannot hold for a step of this size.
  - Verdict: none.

- `config/catalogs/vocab.yml` statuses header: "each read with the word trimmed and in lower case".
  - What is wrong: the chip flags are read through `anyWord` and `hasWord` as written, not through `wordFlag`. The behaviour equals the base (the base compared chips as written), so the comment is false for those flags. The "Writing docs" rule (the comment says what the code does) is broken.
  - Failure scenario: a reader writes `Blocked` as a chip, expects it to count as blocked, and it does not.
  - Verdict: none.

## 4. Behaviour

- `src/lib/server/machine/runs/recover/routes.ts` (every GET calls `accessOf`, plus `clusterDisk`, `clusterState` and `clusterLog`), `files.ts` (`getText` reads the body whole).
  - What a user sees: each 3 s poll of an open Recover view makes a live login request per credentialed source. For PhysioNet, that is a read of the whole `SHA256SUMS.txt`, twice for mimic-iv-ecg's two physionet sources. On the cluster target it also makes 3 to 4 ssh commands. The Login node fold runs `tmux ls` plus one `clusterDisk` ssh per session every 3 s.
  - The report does not state this cost. The size of the SHA256SUMS files was not measured (not verified).
  - Failure scenario: a Recover view left open during a long fetch sends roughly 1,200 PhysioNet requests and up to 4,800 ssh commands per hour, which risks rate limiting by PhysioNet and login-node load on the cluster.
  - Verdict: none on the items (the brief asks for polling). Belongs with open item A.

- `src/lib/state/boards/structure/lines.ts:99-103`: "Non-real projects grouped by type, in the order of the types of `types` carrying `dead`", against the base's `archival(projects, dead)` in `archive_dead`'s order.
  - What a user sees: the Archival band (`Pillars.svelte:64`) now orders groups `paused, nogo, dropped, disproved, abandoned` (vocab.yml:65-72). The base ordered `nogo, dropped, disproved, abandoned, paused` (base vocab.yml:203).
  - Part 13's preamble says "Each keeps every ... order". Part 13 item 2's "in `type_order`'s order" put `paused` first, and nothing kept the old `archive_dead` order. The report's visible changes do not state it.
  - The hub today has no paused project (abandoned 1, disproved 1, dropped 2, nogo 3), so the hub shows no change.
  - Failure scenario: a hub with a paused project sees its Paused group move from last to first in the Archival band.
  - Verdict: 13.2 violated.

- `src/lib/state/workbench/ui.svelte.ts` (the diff drops `UI_VERSION_UNCHOSEN` and the `unicode` field).
  - What a user sees: a browser whose saved envelope is version 1 starts at the defaults and loses its instance records. This is the spec's no-migration-code rule applied outside Part 12's three named places, which the report states as open item E. Part 15 lists `ui.svelte.ts` among its paths.
  - Failure scenario: a browser last saved before version 2 loses its per-view state once.
  - Verdict: none (reported, within the spec's rule).

- `src/lib/data/snapshot/normalise-parts/career.ts:64-66`: "A row with no `status:` holds the empty status, which the readers take as the hub's status carrying `default`". The base had `status: str(row.status) ?? HOST_DEFAULT` (`'candidate'`).
  - What a user sees: the board reads the default through `hostStatusOf` (`state/boards/career.ts:83-86`), so the Focus card is unchanged. The snapshot apps receive now holds `''` for a status-less host instead of `candidate` (apps get `career` through the portfolio, `docs/apps.md:353,385`). The report's visible changes omit it.
  - The flags `default` and `waiting` on the hub's `career_host_status`, and `in_flight`, are new config names. The report lists `in_flight` in open item G and `default` in judgment calls. `waiting` on career hosts is not listed.
  - Failure scenario: an app that groups hosts by status puts status-less hosts in an empty-named group rather than under candidate.
  - Verdict: 13.5 violated (the base's values are kept for the board, not for the snapshot apps read).

- New config names the brief does not name (lead point 6). The brief names: throttle, lead_closed, pauses_countdown, blocked, published, default_lead, live, on_map, placed, standard, idea, public, negative, dead_end, publication_kinds, tiers finished/software, ticker_sources/categories, applications_open, education_open, applications_sent.
  - Not named by the brief: `submit_ready`, `new_idea`, `default_task`, `lead_declined`, `default_application`, `lead_applied`, tiers `main`, `backlog`, `personal`, `type_folders`, `outcome_folders`, the hub's `career_host_status` `in_flight`, `waiting` and `default`, the url `name`, and the venue tier `fallback`, which is derived from the existing `assignable`.
  - Each one sampled reproduces the base. In the 29 places sampled (leads isLeadClosed/Declined/Open, lead-application default, feeds.ts:90, stats.ts:48/60/86, focus-lanes 101 and the two open lists, graph.ts archived/archiveStatuses/typeFilters, lines.ts inFlight/isDormant/tierStrip, collection groupProjects/blocked/noFunding, audit placed/live/outcomeOf/standard/published/isPersonal, publication kinds, focus.ts statusFlag/backlogTier/idea, presets softwareTiers, manifest.ts new idea, career inFlight), every place gives the base's result, except the Archival order and the snapshot host status above.
  - The names are user-visible config vocabulary and are open item G. `waiting` on the host statuses is missing from G's list.
  - Verdict: none beyond 13.2 and 13.5.

## Declined to judge

- Case 14 probe (`tests/data/real-hub.probe.ts`): not run. It reads session records under `~/.claude` and runs git. A HOME-scratch run would need an edited copy of the probe, which is a script written for the review.
- The cases that are the look's at landing (17, 26's drawing, 31, 32's Monaco keys, 33's preview, 34's panel, 35): they need a browser.
- Whether Axel's browser still holds a version 1 UI envelope (Behaviour 3): no browser storage can be read from here.
- The size of PhysioNet's `SHA256SUMS.txt` per set, and so the bytes per poll: it needs a live request.
- Whether `runs.test.ts`'s 10 s margins were widened during the build: the file is new and its edit history is not on disk.
- Whether the builder's runs of `unused-exports.sh` read the main checkout's `local.yml`: not reproducible without reading it.
- Lines 9 and 10 of the verify list (first runs on the unchanged tree; list items and sentence length of every new sentence): taken from the report's table and not rerun or read whole.
- The open items A, D, G and H: Axel's rulings.

Reviewer usage: ac403e5a86a3d6757, claude-opus-5-5, 190,477 tokens, 165 tool uses, 28.8 min.

## Repair round 1, refuted

Reviewer over O38 repair round 1. Worktree `.agents/worktrees/migration-O38`, base db086e36d, snapshot `.agents/worktrees/migration-O38-round-1` (files.txt 811 paths). The round's delta (68 modified paths of files.txt, `src/lib/server/machine/runs/recover/log.ts` moved to `live/log.ts`, and 21 paths changed outside files.txt, the untracked `live/batch.ts`, `live/log.ts` and `live/watch.ts` whole) was read in full against the whole diff since the base. No file was changed by the reviewer.

```
cd tools/oculus; PATH=$HOME/.nvm/versions/node/v24.21.0/bin:$PATH HOME=<fresh $TMPDIR folder> npm run test:quick -- --base db086e36d
  487 changed file(s), from git since db086e36d
  250 test file(s), 9 essential
  ok prettier (1.0 s) | ok ASCII gate (1.0 s) | ok svelte-kit sync (2.7 s) | ok eslint (2.2 s)
  ok svelte-check (7.0 s): 524 FILES 0 ERRORS 0 WARNINGS
  ok vitest (70.4 s)
  test:quick: 73.2 s (limit 45.0 s); every command passed
  test:quick: over the time limit
  exit 0
(npm run diagrams not run; its staleness checked by tests/checks/tree/diagrams.test.ts, in the guarded run below, passed)

npx vitest run <the 34 files of the Test lines of G1, G111 to G116> + config-folder, config.test, normalise, career, catalog/options, diagrams.test
  Test Files 40 passed (40)
  Tests 451 passed | 2 skipped (453)
  (the 2 skips are config-folder's real-hub rows, OCULUS_TEST_HUB unset)
OCULUS_TEST_HUB=<worktree root> npx vitest run tests/checks/config/config-folder.test.ts <integrity test>
  Test Files 2 passed (2)
  Tests 46 passed (46)

npx vitest run tests/checks/tree/boundaries.test.ts tests/checks/tree/size.test.ts tests/checks/source/history.test.ts --testTimeout 0 --hookTimeout 0
  Test Files 3 passed (3)
  Tests 27 passed (27)

sh utils/unused-exports.sh (fresh HOME, no workspace) compared with O38-base/unused-exports.txt
  no new name. Lines gone against the base: DISMISSED, LEAD_CLOSED, IN_FLIGHT, NOT_APPLIED, removedChords, RemovedChord, BrowserValues; the tab-out entry under its moved path; one type line reordered in ui.svelte.ts.

grep -rn "setInterval\|POLL_MS" src/lib/state/system/machine/recover.svelte.ts src/lib/views/sources/data/recover src/lib/views/system/machine/hpc/Login.svelte
  (nothing), exit 1

LC_ALL=C grep -n '[^ -~]' over the 83 non-svg files the round changes
  one line: .oculus/data/research/data.yml:691, the name Hjortkj<ae>r, base content

python3 -c "import yaml; yaml.safe_load(open('.oculus/data/research/data.yml'))"   (worktree root)
  exit 0

Verify item 5 of the first brief (the perl character check) over the 104 changed hub files outside tools/oculus
  165 lines in 18 files. Moved files: 0 added non-ASCII lines against their base copy. Edited files: the only added non-ASCII line is the accented name Fabian G<u umlaut>iza in funding/2026-fwo-senior-stopped-meyfroidt.

sh utils/folder-check.sh
  exit 0 (src/lib/server/machine/runs/recover holds 10 entries)

Tree checks outside test:quick, run because the landing runs them:
npx vitest run tests/checks/source/keys.test.ts
  FAILED: orphaned settings.editor_add_group, settings.editor_group_down, settings.editor_group_key, settings.editor_group_up, settings.editor_remove_group (config/text/views/system/workbench.yml:37,42,43,44,51)
npx vitest run tests/checks/source/comment-width.test.ts
  FAILED: src/lib/data/model/model-entities.ts:707 (101 columns) and src/lib/server/root/watch/pollers.ts:2 (138 columns)
npx vitest run <imports cycles, imports order, templates, config.test, duplication>
  Test Files 5 passed, Tests 82 passed
npx vitest run tests/server/machine/runs/recover/runs.test.ts tests/server/machine/runs/recover/safety.test.ts (verbose, slow rows included)
  46 passed

grep for the old Jakel file names in projects/archive/disproved/ms-lipid-handshake/code: 0 lines
grep archive_order docs/figures/project-lifecycle.svg: the label "archive_order: published, submitted, ..." is drawn
```

### Verdicts

Items of the round brief O38-round1.md:

- R1 (push, no polling): holds. The grep above gives nothing; live/watch.ts publishes `recover` through Hub.publish; the Live HPC batch carries Recover's section (SEC_RECOVER, live/batch.ts); payloads.ts holds the shape beside hpc; Login.svelte draws the channel's sessions; DESIGN.md "Live data" and HELP.md name the channel; runs.test.ts and history.test.ts rows cover a start push with bytes and an end push with its state, waiting on fs.watch and a channel subscription. The clause "accessOf ... in that GET alone" is not met literally (Spec R1-a) and three host-visible changes are unreported (Behaviour R-1, R-2, R-3).
- R2 (Jakel names): holds. config.py now names the two GEO files; grep of the old names gives 0.
- R3 (url sources for pdebench and pbc-cirrhosis, md5 rows): holds. The five DaRUS rows and the UCI row in .oculus/data/research/data.yml match the brief byte for byte; retrieval.ts refuses a row with both sha256 and md5; url.ts checksumOf, verify.ts createHash(kind) and the cluster's "$1"sum check md5; docs/templates.md and docs/apps.md state the row shape.
- R4 (describe help in catalog-files.ts): holds. Every flag key of statuses, types and tiers and publication_kinds carries .describe; vocab.yml's header now says wordFlag compares trimmed and lower case, anyWord/hasWord as written. public, negative and dead_end share one header line (a note, no finding).
- R5 (remove the holds: lists record-field shape): violated, Standards R-2. Code removed as listed (Rollup.svelte deleted, slots.ts, draft.ts rollup form, schemas/options.ts, config-fit.ts branches, references walk, Editor.svelte branch), catalogOf refuses the shape; but the five catalog strings that served only Rollup.svelte stay and keys.test.ts is red.
- R6 (dead as an Archival order number): holds. vocab.yml dead: nogo 1, dropped 2, disproved 3, abandoned 4, paused 5; lines.ts:106 wordsNumbered, collection.ts:763 and venues.ts:38 read membership as wordNumber(...) !== null / === null; docs/figures/project-lifecycle.svg redrawn.
- R7 (career host default status): holds. src/lib/data/snapshot/normalise-parts/career.ts:122 reads `const unset = wordsWith(config, 'career_host_status', 'default').at(0) ?? ''`; the career.test.ts row is in the guarded run and the first run on the unchanged tree is quoted in the round report. hostStatusOf keeps a duplicate fallback (Standards R-4).
- R8 (unexport five names): holds. unused-exports rerun above shows no new line.
- R9 (runs.test real-process row slow, signal wait): holds. runs.test.ts:224 `{ tags: ['slow'], timeout: 30000 }`, waits on fs.watch `called()` and a `pushed()` subscription, no vi.waitFor and no sleep. The safety.test.ts rows were changed beyond the item (Spec R-2).
- R10 (history exemption by path): holds. history.test.ts `ANSWERS = 'tests/server/machine/runs/recover/answers/'`, with rows for paths outside it; the round report lists the CR and trailing-space changes per file.
- R11 (boards.test shipped-values describe removed): holds. The describe is gone; the malformed-row table, counts.test.ts and count-row.test.ts stay (G116 is in the main checkout's guarded.md, the orchestrator's booking).
- R12 (gen_figures label): holds. gen_figures.py labels the line archive_order:, and the svg shows it.
- R13 (quote verify item 5): violated, Proof R-1. The round report quotes the round-files grep, not the perl check over the changed hub files. The rerun above shows the content is fine (moved bytes and one accented name).

Items of O38.md "What to build", again over the whole diff since the base:

- 1.1, 1.2, 1.3: holds, as the first report gives; the round touches none of them.
- 1.4: not applicable (the session's at landing).
- 2.1: holds. pdebench has one url source with the five rows and pbc-cirrhosis one url source with unpack: true (R3); the first report's Spec 3 is closed.
- 2.2, 2.3: holds, as the first report gives; 2.2's parse also takes md5 rows (R3).
- 2.4: holds for the code. The per-poll login request of the first report's Behaviour 1 is gone: accessOf runs in the route's GET and the POST fetch, never on a push.
- 2.5: holds for the guarded rows. The GET's no-key `target=cluster` sessions answer is removed and the sessions come by the channel, as Z937 and R1 rule; the brief's 2.5 sentence on that answer is superseded by that ruling.
- 2.6, 2.8: holds as ruled by Z937 (server push in place of the brief's polling); the first report's Spec 1 is closed.
- 2.7: holds by reading; the look is at landing.
- 2.9 to 2.11, 2.12: holds, as the first report gives.
- 3.1 to 3.7: holds, as the first report gives.
- 4.1 to 4.5, 5: holds (5 by 2.1).
- 6.1 to 6.5: holds; the look is at landing.
- 7: not applicable (the session's).
- 8.1 to 8.6: holds, as the first report gives (case 21's probe, see Cases).
- 9: holds.
- 10.1 to 10.7: holds, as the first report gives.
- 11: holds.
- 12: holds.
- 13.1: holds.
- 13.2: holds. The Archival band orders nogo, dropped, disproved, abandoned, paused by the dead numbers (R6); the first report's Behaviour 2 is closed.
- 13.3, 13.4, 13.6: holds.
- 13.5: holds. A status-less host holds the default word in the snapshot (R7); the first report's Behaviour 4 is closed.
- 14 (statuses, types, tiers, ticker, Focus columns): holds.
- 14 (compared trimmed, lower case): holds; the vocab.yml header now says so (R4).
- 14 (sweep listed): holds, by the report.
- 14 (options catalog gets each new flag and list with its help): holds through Z943, the help carried by the schema's .describe (R4).
- 14 (HELP.md and DESIGN.md): holds.
- 15.1 to 15.3, 16.1 to 16.4: holds.
- 17.1 to 17.3: holds, as the first report gives.
- Landing note across items: two tree checks the landing runs are red, keys.test.ts (Standards R-2) and comment-width.test.ts (Standards R-1).

Cases of O38.md "Cases":

- 1 to 8, 10: met. Guarded and test:quick runs above.
- 9: met. The real-process row waits on signals (R9) and passed in the verbose run.
- 11, 12, 13: met (12 by reading retrieval.ts with the md5 rows; 13 by the integrity run with OCULUS_TEST_HUB set).
- 14: not verifiable by the reviewer, as in the first report (the probe).
- 15: met.
- 16: partial, unchanged: 43 lines, not only 34, as the cases file rules; the first report's Proof 2 stands as ruled.
- 17: not verifiable (the look's).
- 18: met by the report's reading.
- 19, 20, 22, 25, 27, 29, 30, 35: met, as the first report gives.
- 21: met by the builder's removed probe, not reproducible here.
- 23: met by reading.
- 24: met for the 2.1 entries (pdebench and pbc now typed url sources); the map form half stays met by reading only.
- 26: met by reading html.ts.
- 28: met. The Archival order holds for a hub with a paused project by the dead numbers (R6).
- 31: partial, unchanged: menu, palette and persistence by reading only, the rest the look's.
- 32, 33: met by rows and the builder's probes.
- 34: met for the key and catalog entry; the rest the look's.

### Findings

- Spec R1-a, src/lib/server/machine/runs/recover/routes.ts:318: "const access = await accessOf(entry.retrieval, {"; what is wrong: R1 says the access login requests "run in that GET alone, never on a push"; the POST fetch still calls accessOf (a line from round 0, not changed in the round; the builder's report discloses it). The "never on a push" half holds. failure scenario: a reader of the brief who checks the clause literally finds a second caller; a Fetch press makes a login request outside the GET, which is needed to download but is outside the clause's words. verdict: none; the orchestrator rules whether the clause covers the POST fetch.
- Spec R-2, tests/server/machine/runs/recover/safety.test.ts:538: "])('$name', { tags: ['slow'], timeout: 90000 }, async (one) => {"; what is wrong: the unpack rows of safety.test.ts are newly tagged slow and rewritten to wait on an ended promise; R9 asks this only of runs.test.ts's real-process row, and the round report does not name the change; no item. failure scenario: npm test (which skips slow rows) no longer runs these guarded unpack rows, so a regression in unpack safety passes the everyday run and is caught only by a run that includes slow tags. verdict: none.
- Proof R-1, O38-report.md section "Repair round 1", item 13: the report quotes the round-files grep in place of verify item 5's perl check over the changed hub files; what is wrong: the item asked for that run and a name for each non-ASCII line; my rerun gives 165 lines in 18 files, of which the only added non-ASCII line is the accented name G<u umlaut>iza and the rest moved byte for byte. No decision rests on the wrong quote, since the content is clean. failure scenario: the orchestrator reading the report has no evidence for item 13 and would accept the hub files on a check that did not read them. verdict: R13 violated.
- Standards R-1, src/lib/server/root/watch/pollers.ts:2 (138 columns) and src/lib/data/model/model-entities.ts:707 (101 columns): "/** The listed files whose bytes changed since the reading before, with their rate (this Mac). */"; what is wrong: the repository's comment width rule (tests/checks/source/comment-width.test.ts, 100 columns) fails on both lines; the check is not in test:quick. Other comments of the round were left with short unrewrapped lines (Cards.svelte "place. The keyboard's cursor names one of them (the instance's card", Editor.svelte "with the control its catalog spec gives it, the problems of the", references/model.ts), a prettier-width standard the check does not flag. failure scenario: the landing's verify list runs comment-width.test.ts and goes red. verdict: none (landing).
- Standards R-2, config/text/views/system/workbench.yml:37,42,43,44,51: "editor_add_group: Add a key", "editor_group_down: 'Move key {0} down'"; what is wrong: R5 removes every part that served the holds: lists record shape alone; these five strings were read only by the deleted Rollup.svelte and are now orphaned, and tests/checks/source/keys.test.ts fails on them. The round report claims R5 DONE without this check. failure scenario: the landing's verify list runs keys.test.ts and goes red; the catalog keeps dead strings a translator would maintain. verdict: R5 violated.
- Standards R-3, tests/data/sources/config/catalog/options.test.ts:80: "it('refuses holds: lists on a family of record fields and keeps it on a key/value family', () => {"; what is wrong: a new row for a refusal of a config shape (a wrong configuration accepted is a cost the rules file names), in a file G-listed in guarded.md line 188 by row titles, and this title is not among them; guarded.md is the orchestrator's to book. failure scenario: a later step edits or drops the row without a guarded-test review, since guarded.md does not name it. verdict: none (booking).
- Standards R-4, src/lib/state/boards/career.ts:83-85: "if (host.status !== '') return host.status; ... return wordsWith(config, 'career_host_status', 'default')[0] ?? '';"; what is wrong: R7 moves the default into normalise-parts/career.ts:122 and says hostStatusOf "keeps reading the snapshot's word"; hostStatusOf still carries its own copy of the default rule, a fallback for an input normalise no longer gives (spec.md's rule against code larger than its job). failure scenario: a later change to the default rule in normalise leaves a second copy in the board that disagrees for a host built outside normalise, such as a test fixture. verdict: none.
- Standards R-5, test:quick: "test:quick: 73.2 s (limit 45.0 s); every command passed / test:quick: over the time limit"; what is wrong: the run exceeds the time limit test:quick states; 487 changed files since the base select 250 test files. failure scenario: a builder of a later step treats the limit as already broken and stops reading the warning. verdict: none (the size of the step's diff since the base; the round's own share not measured).
- Behaviour R-1, live/batch.ts and config/behavior.yml:85 ("poll_min: 20"): the cluster Recover progress and the Login node section now refresh once per Live HPC poll (20 min by default), where round 0 refreshed every 3 s; the round report says "at each Live HPC poll" without the interval or the before and after. failure scenario: a user starting a cluster fetch sees bytes and sessions unchanged for up to 20 minutes and reads the run as stalled. verdict: none.
- Behaviour R-2, src/lib/views/system/machine/hpc/Login.svelte:100: "<Empty message={t('hpc.login_loading')} />"; the Login node section's error and refused (no host) states are removed: with no Live HPC answer it shows "Waiting for the next Live HPC answer from the login node..." and after a failed poll it keeps the last sessions; the report does not state this before and after. failure scenario: a hub with no hpc_host, or an ssh failure, shows "Waiting..." indefinitely, or stale sessions, in place of the reason. verdict: none.
- Behaviour R-3, src/lib/server/machine/runs/recover/live/batch.ts:19: "\"$(du -sb ${pathWord(folder)} 2>/dev/null | cut -f 1)\""; what is wrong: a du -sb per session folder now runs inside the one Live HPC batch, whose timeout is 40000 ms (src/lib/server/machine/hpc/poll.ts:114); the report does not say the Live HPC poll's cost grows with the Recover folders. failure scenario: a large dataset folder on NFS makes du exceed the remaining time and the whole Live HPC poll (queue, accounting, nodes) times out. Not verified (no cluster).

### Declined to judge

- Case 14's probe and the builder's other removed probes (cases 21, 32, 33): the probes are not on the tree, and a rerun needs the builder's copies.
- The look of cases 17, 26, 31 to 35 and items 2.7 and 6: at landing, in a browser the reviewer may not open.
- The du -sb timing on the cluster and the Live HPC behaviour on a real host: no cluster access is allowed.
- The builder's first runs on the unchanged tree for R1 and R7: quoted in the round report, not rerun (they need the unchanged tree, which git stash or a checkout would make, outside the three git commands allowed).
- Whether guarded.md should gain Code lines for live/watch.ts and live/batch.ts beside G1 and G115: the orchestrator's booking.
- Whether R1's accessOf clause covers the POST fetch (Spec R1-a): the orchestrator's or Axel's ruling.

Reviewer usage: a75fec14c07a3891c, claude-opus-5-5, 94,722 tokens, 89 tool uses, 15.8 min.

### Closed

Dispositions of the findings of the review over round 1, by the orchestrator at landing.

- Spec R1-a: closed by Z948 (automode); the Fetch POST keeps its access check, and no access request runs on a push or a timer.
- Spec R-2: closed by Z949 (automode); the unpack rows stay tagged slow and wait on the run's end signal; they run in `npm run test:landing`.
- Proof R-1: closed; the reviewer's rerun of verify item 5 above is the evidence (165 lines in 18 files, the one added line the accented name G<u umlaut>iza, the rest moved byte for byte).
- Standards R-1: fixed at landing; the two comment lines rewrapped to 100 columns, and the short unrewrapped comment lines of `Cards.svelte`, `Editor.svelte` and `references/model.ts` rewrapped.
- Standards R-2: fixed at landing; the five strings `settings.editor_add_group`, `editor_group_down`, `editor_group_key`, `editor_group_up` and `editor_remove_group` removed from `config/text/views/system/workbench.yml`.
- Standards R-3: booked at landing; the row title of `options.test.ts:80` added to the guarded entry of `agents/guarded.md` that lists that file, and `live/watch.ts` and `live/batch.ts` added to the Code lines of G1 and G115.
- Standards R-4: fixed at landing; `hostStatusOf` removed from `src/lib/state/boards/career.ts`, its callers in `career.ts`, `focus.ts` and `CareerHosts.svelte` reading the snapshot's `host.status`.
- Standards R-5: closed; the time is the size of the step's diff since the base (487 changed files), and `test:quick` passed.
- Behaviour R-1: raised to Axel as open item 176 (the cadence of the cluster reading), ruled (a) by Axel and built at landing: while a cluster run is followed, the Recover watcher reads its section over ssh once a minute.
- Behaviour R-2: fixed at landing; the Login node section shows Live HPC's reason when Live HPC has no answer, in place of the waiting words.
- Behaviour R-3: fixed at landing; each `du -sb` of Recover's section runs under `timeout 5`, so a slow folder leaves its bytes out and never holds the Live HPC poll past its timeout.
- Found by the orchestrator at landing: `Lanes.svelte:103` decides by the chip word `blocked`; fixed at landing through the `blocked` flag of `statuses`, a place of item 14.
- Found at the landing gate: `npm run lint` refused `EntryCard.svelte:222-223` (no-unsafe-assignment), the card's `CardAction` imported from `CardActions.svelte` while `entry-actions.ts` takes it from `card.ts`; fixed at landing, the card importing the type from `card.ts`.
- Found at the look: the Recover view said "of 1 files", "1 files whose size the source does not state" and "0 B to fetch" for a set whose one file has no stated size; fixed at landing with the singular strings and a line for files of unstated size (`data.yml` text, `RecoverPlan.svelte`, `RecoverProgress.svelte`).
- Found at the look: on the Cluster target with the cluster unreachable, the plan read every file missing with Fetch enabled, since `clusterDisk` read an empty listing from a failed ssh; fixed at landing: `clusterDisk` gives null when its command did not reach the shell, the route answers `refused: unreachable` before any other ssh, and the view shows it as an error with Retry; a row of `tests/routes/machine/recover.test.ts`, red on the unchanged code ("1 failed", a plan answered with `target: cluster`); DESIGN.md and HELP.md say so.
- Found at the look: the Findings view named `.oculus/data/research/data.yml:1182`, mist-weights' `access: public`, not a word of `data_access`; mist-weights came from main and was resolved in the landing's merge; fixed at landing to `access: open`.
- Ruled by Axel at landing (2026-10-19): Live HPC's `hpc.unreachable_msg` (`config/text/views/system/machine/hpc.yml:90`) reads "The cluster did not answer over ssh. Is this Mac on the UT network or on EduVPN?", the sentence Recover's unreachable answer opens with, in place of "Cluster unreachable - on UT network / EduVPN?".
- Found at the landing gate: `npm test` timed out on `safety.test.ts` "fetches on the cluster with each value one shell word..." (5880 ms against 5000; 0.4 to 0.7 s alone), a row that starts real `sh` processes; `agents/spec.md:59` tags such a row slow. Fixed at landing: the seven Recover rows that start a process (the Mac and cluster fetch rows, the line-break row and the verify and unpack job table of `safety.test.ts`, the CLUSTER table and the login-node push row of `runs.test.ts`, the sessions push row of `tests/routes/machine/recover.test.ts`) tagged slow, run by `npm run test:slow` with its 20 s limit; the rows that start no process stay in `npm test`.
