# O38 report: stopped at the first task

NOT done: every part of the brief (Parts 1 to 9). The builder stopped after the first run of the cases and before any change, because case 16 (and Verify 6, which repeats it) expects a result the brief's own rules forbid the builder to reach. The brief ("When the first run finds a case the brief's own rules get wrong, the builder stops there, before changing any code") and the dispatch prompt both require this stop. No file of the worktree was changed except this report.

## Open items of the state file, verbatim

`orchestrator-state.md:159-161`:

> ## Open items (only what Axel must rule on; every report tells him these in plain words, decisions first, until he has ruled)
>
> An entry leaves this list for the closed log the moment Axel rules on it. What a review or a look found and no brief covered is not an open item: it is folded into an existing step in `plan.md` (Z468), never booked as a step of its own.

The list holds no entry.

## The case that stops the step

Case 16 says its grep, run from the worktree root, "prints only the 34 dated scout lines of `.oculus/data/academic/leads.yml`". Verify 6 says the same.

The rules that make it wrong:

- Part 1 item 4: "The hub's `CLAUDE.md` ... are the session's at landing."
- Part 3 item 5: "`funding/2026-fwo-senior-transplant/proposal/proposal/form-fields.md` and the hub `CLAUDE.md` are the session's."
- "Paths this step writes": "Every file of `O38-sweep.txt` except `CLAUDE.md` and `funding/2026-fwo-senior-transplant/proposal/proposal/form-fields.md`".

The result those rules give: the grep still prints the lines of those two files, which the builder may not edit. On the unchanged tree they are (case 16's grep, filtered to the two files):

```
CLAUDE.md:56:- **Pick the best-fit, well-indexed venue on merit, ... The Venues tab (`registries/venues.yml`) is the catalogue.
CLAUDE.md:60:Grant-funded manuscripts must carry the funder's acknowledgment. The canonical verbatim snippet lives on its **funding scheme's entry in `funding/funding.yml`** ...
CLAUDE.md:72:- **ALL local data lives under `~/data/<dataset>`, no exceptions.** ... every one of them is registered in `registries/data.yml`. ...
funding/2026-fwo-senior-transplant/proposal/proposal/form-fields.md:238:Recommended answer: No. ...
funding/2026-fwo-senior-transplant/proposal/proposal/form-fields.md:635:- FWO PhD fellowship amount (2.4, 2.5): ...
funding/2026-fwo-senior-transplant/proposal/proposal/form-fields.md:637:- ERC call (2.5): ... marked TBC in `funding/funding.yml` lines 90 to 100.
funding/2026-fwo-senior-transplant/proposal/proposal/form-fields.md:641:- Prior submissions (3.1) and unrelated applications (3.2): `funding/funding.yml`, ...
```

So after the builder's full work, the most case 16 can print is the 34 scout lines plus these 7 lines (3 in `CLAUDE.md`, 4 in `form-fields.md`). The case as written can hold only after the session's edits at landing. Two ways to close it, for the orchestrator: (a) case 16 and Verify 6 expect "the 34 scout lines and the lines of `CLAUDE.md` and `form-fields.md`, which the session edits", or (b) both files join the builder's write list. Option (b) clashes with the rules that make `CLAUDE.md` the session's and route the grant file through `academic-paper`, so (a) is the one that keeps every rule.

A second point the orchestrator may want to close in the same amendment. It is not a case, but the tests of cases 6 to 8 sit under these entries:

- `agents/guarded.md:320`, G114, reads: "Missing access (no `machine physionet.org` line in the target's `~/.netrc`, no Synapse or Kaggle token) disables Fetch, and the check asks only whether the line is there (`grep -q`), never reading the file into oculus." Brief Part 2 item 3 (open item 158) replaces this with the `downloads` rows of `local.yml` and a login request by the server, and says `~/.netrc` is never opened. `spec.md:59` says a builder writes a test only as the test of an entry, so the G114 test would sit under a sentence that is false of the code.
- `agents/guarded.md:317`, G113, says "every value reaches curl, ssh, tmux, sbatch and the unpacker as one argument". On the cluster the brief (Part 2 item 4, and brief check I.2) reads it as "one shell word", since the `Runner` takes one remote command string (`src/lib/server/machine/hpc/ssh.ts:7-12`).

`guarded.md` is the orchestrator's file, and the builder does not edit it.

## The cases' first run, on the unchanged tree

Every command ran from `tools/oculus` in the worktree with `PATH=$HOME/.nvm/versions/node/v24.21.0/bin:$PATH` unless it names another folder. `W` is the worktree root, `B` the base copy.

1. Zenodo reader (G111). `ls src/lib/server/machine/runs/recover tests/server/machine/runs/recover`: `ls: src/lib/server/machine/runs/recover: No such file or directory`, `ls: tests/server/machine/runs/recover: No such file or directory`. No reader exists. The fixtures `zenodo-aad-dtu` and `zenodo-picai` are in `agents/briefs/O38-fixtures/` (`ls`), both `HTTP/1.1 200 OK` by its `README.md`.
2. PhysioNet reader (G111, G114). The same `ls`: no reader. `physionet-mitdb.headers` says `HTTP/2 200`; `physionet-mimiciv-nologin.headers` says `HTTP/2 403`, its body an HTML page titled `403: Forbidden Access` (`head -c 300`).
3. figshare, DANDI, Hugging Face over two pages, Stanford, GEO, TCIA, Kaggle, Synapse readers (G111). The same `ls`: none exists. The eight recorded pairs are present (`ls`); Kaggle and Synapse have no recording, as the fixtures' `README.md` says.
4. Plan states (G112). No `plan.ts` (same `ls`).
5. Fetch list and resume (G112). No `local.ts` or `cluster.ts` of Recover (same `ls`). Today Recover runs `python3 tools/data/redownload.py {key}` in a terminal (`grep -n recover_command ../../.oculus/config.yml`: `65:recover_command: python3 tools/data/redownload.py {key}`).
6. Refusals and shell words (G113). No Recover server (same `ls`). Today the key reaches the hub's command through `shellWord` (`src/lib/server/machine/pty/routes.ts:402`: `command: template.replaceAll(RECOVER_KEY, shellWord(own))`).
7. Credentials never on a command line (G113). No Recover server. Today wget reads `~/.netrc` itself (brief premise, `tools/data/redownload.py:86`).
8. Access (G114). No `access.ts`. `local.yml` has no `downloads` key: `LOCAL_KEYS` (`src/lib/data/sources/config/local.ts:152-175`) ends at `'literature'`.
9. Runs after a restart, Stop (G115). No Recover run exists (same `ls`).
10. The recover route without the token (G1). `ls "src/routes/api/(machine)/recover"`: `No such file or directory`.
11. The cluster job script. No `cluster.ts`. `scratchRule` reads files only (`src/lib/server/machine/hpc/scratch.ts:111-145`, `readFileSync` through `printed`); no text entry point exists.
12. `library`, `request` and `derived` sets. Reading `src/lib/data/index.ts:603-610` (`recoverable`): with a hub whose `recover_command` holds `{key}`, every dataset is marked `recover: true`, whatever its method; the real hub sets one (`.oculus/config.yml:65`), so every one of its 54 sets has the control, the library and private sets included.
13. `OCULUS_TEST_HUB=$W npx vitest run tests/checks/config/integrity.test.ts`: `Test Files  1 passed (1)`, `Tests  14 passed (14)`, no skip line. The run printed four lines `/Users/axelfaes/workspace/research-hub/.oculus/local.yml: ignoring unknown key(s) downloads` (the test's own read of the main checkout's machine file; the builder opened no `local.yml`).
14. `OCULUS_TEST_HUB=$B node tests/data/real-hub.probe.ts` and the same with `$W` (the brief's `npx vitest run tests/data/real-hub.probe.ts` runs nothing: the file has no `.test.` in its name, and vitest prints only its include list; the probe's own head comment names `node`). Both print the same collection counts:
    ```
    data: 54 entries, meta keys intro, schema
    venues: 72 entries, meta keys intro, schema
    pillars: 9 entries, meta keys intro, schema
    domains: 12 entries, meta keys intro, schema
    statements: 2 entries, meta keys title, intro, schema
    people: 19 entries, meta keys schema
    organisations: 8 entries, meta keys schema
    resources: 3 entries, meta keys schema
    funding: 11 entries, meta keys title, intro, schema
    events: 7 entries, meta keys title, intro, schema
    education: 22 entries, meta keys title, intro, schema
    applications: 26 entries, meta keys title, intro, schema
    joint-work: 10 entries, meta keys title, intro, schema
    tasks: 0 entries, meta keys schema
    literature: 0 entries, meta keys title, intro, schema
    collection findings: 0
    ```
    The two runs differ only where the base copy holds fewer files: `manifests: 97` against `113` (the base copy holds no `side-projects/`) and `snapshot findings: 25` against `0` (the base copy holds no image, so 24 `figure ... is not in` findings and one `deck folder deck is not in`). Neither run printed a skip.
15. Make Folder a Hub (G9). `npx vitest run tests/routes/hubs/make.test.ts`: `Test Files  1 passed (1)`, `Tests  25 passed (25)`. Reading `src/lib/server/files/project/make.ts:185-208` (`filesOf`): a hub make writes `.oculus/config.yml` and the ticked collections' files only; no `local.yml`, `.gitignore` or `schedules.yml`.
16. Case 16's grep, from `$W`: 1071 lines in 218 files (`wc -l`, `cut -d: -f1 | sort -u | wc -l`); 143 of the files lie outside the four tools and three skills. `feeds/position-leads.yml` gives 35 lines: the 34 `/research-cockpit scout` lines (`grep -c "research-cockpit scout"`: `34`) and line 601, a lead's `fit` text naming `registries/career.yml`, which is no dated record of a run and is to be rewritten. The lines of `CLAUDE.md` and `form-fields.md` are quoted above.
17. Rice toggles. `grep -n "'brackets'\|'monospace'\|rice-plain\|rice-sans" -r src config`: one hit, `config/catalogs/latex.yml:325: name: 'brackets',` (a LaTeX catalog word, not a browser value). `BROWSER_NAMES` (`src/lib/state/system/config/other-rows/browser.ts:23-31`) ends at `'icons'`. The drawing is for the look on landing.
18. bttn-incident-af's PTB-XL block, read: `code/run_all.sh:55` `PTBXL_ZIP="${AFNET_PTBXL_ZIP:-$DATA/archive/ptb-xl-1.0.3.zip}"`, `:56` `P="ptb-xl-a-large-publicly-available-electrocardiography-dataset-1.0.3"`, `:60` `unzip -q -n "$PTBXL_ZIP" "$P/ptbxl_database.csv" "$P/records100/*" -d "$DATA/ptb-xl-raw"`, `:65-66` `rm -rf "$DATA/ptb-xl"` and `ln -sfn "$DATA/ptb-xl-raw/$P" "$DATA/ptb-xl"`. Today the block extracts into `ptb-xl-raw/<top folder>/` and links `~/data/ptb-xl` to it.
19. `downloads` rows of `local.yml`. The key is unknown to the reader (`LOCAL_KEYS`, `local.ts:152-175`); case 13's run shows the reader warning of it: `ignoring unknown key(s) downloads`. No row check exists.
20. The Settings answer. Reading `src/lib/server/root/process/context/machine-values.ts:35-48` (`scalarsOf`): each `literature.*` key is sent with `literature?.[field]`, its value as written, so every literature key and token is drawn in plain text; no `downloads` row is read.
21. The offer. Reading `src/lib/data/helpers/hub-names.ts:234-237` (`makeOffer`): only `marks.home` and `marks.project` close a folder; `~/.oculus` and `~/.oculus/notes` are no home folder, so both offer Make Folder a Hub (when no hub is above) and Make Folder a Project. Neither Make Folder a Git Repository nor Add Repository Configuration... exists (`grep -n "ROW_MAKE" src/lib/views/shared/explorer/tree/menu/row-menu.ts`: `90: ROW_MAKE_HUB`, `91: ROW_MAKE_PROJECT` and their two uses only).
22. Make Folder a Git Repository: no such item or action (the grep of case 21; `makeShape` of `make.ts` takes `offer`, `hub` and `project` only).
23. The four repository files as their commented templates, read against their readers: `settings.yml` (`languages:` with comments under it reads `languages: null`) gives no record and no problem (`src/lib/data/sources/config/editor-options.ts:219-220`); `commands.yml` (`commands: null`) passes `commandsFileShape`, the list `nullish` (`src/lib/server/machine/runs/commands/files.ts:63`); `launch.yml` (`configurations: null`) passes `launchFileShape`, the list `nullish` (`src/lib/server/machine/debug/launch/read.ts:69-70`); `cpp.yml` (`configurations: null`) answers no configuration and no finding (`src/lib/server/machine/lsp/adapters/clangd/cpp-file.ts:122-124`). The case holds on the unchanged tree by this reading.
24. The registry's `retrieval`. From `$W`: `grep -c "^  - key:" registries/data.yml`: `54`; `grep -c "^    retrieval:" registries/data.yml`: `54`; `grep -c "^      method:" registries/data.yml`: `54`. Every entry holds the old map form, and the parser keeps it as a map (`src/lib/data/snapshot/normalise.ts:353`, `mapShape.safeParse`); no finding names it.

## DONE / NOT DONE

| Item | State | Proof |
|---|---|---|
| First run of every case | DONE | the commands and readings above |
| Part 1, the tools and skills deleted, references fixed | NOT DONE | stopped before any change |
| Part 2, Recover | NOT DONE | stopped before any change |
| Part 3, the data files moved | NOT DONE | stopped before any change |
| Part 4, the gathered sets' readers | NOT DONE | stopped before any change |
| Part 5, the derived sets | NOT DONE | stopped before any change |
| Part 6, the rice toggles | NOT DONE | stopped before any change |
| Part 8, the make items | NOT DONE | stopped before any change |
| Part 9, no secret in Settings | NOT DONE | stopped before any change |
| Verify 1 to 10 | NOT RUN | no change to verify |

## Files

No file of the worktree was changed except this report. The report is the ledger file the dispatch allows.

## The coordinator's amendment, acknowledged

The message received during the first runs: `machineValues` sends the catalog word for "set" in place of the value of the six literature keys and tokens (`wos_key`, `scopus_key`, `scopus_insttoken`, `openalex_key`, `semantic_scholar_key`, `ncbi_key`) and of each `downloads` row's `secret`; `literature.mailto` is sent as written; case 20's fixture holds `literature.mailto` and the answer shows it. This is taken into Part 9 and case 20 for the build once the step resumes.

## Runs of the verify list

None. No whole-suite command was run. The test files run: `tests/checks/config/integrity.test.ts` (once, case 13) and `tests/routes/hubs/make.test.ts` (once, case 15); the probe `tests/data/real-hub.probe.ts` twice with `node` (case 14).
