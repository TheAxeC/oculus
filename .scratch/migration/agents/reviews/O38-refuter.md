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
