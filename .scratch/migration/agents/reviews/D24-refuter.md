# Step D24 refuter report (on /Users/axelfaes/workspace/research-hub/.agents/worktrees/D24, base bca66b3c)

Sections named below are pages' sections; findings in code keep `file:line`. All paths under `tools/oculus` of the worktree unless stated.

## Verification (rerun by the reviewer)

```
$ export PATH=$HOME/.nvm/versions/node/v24.21.0/bin:$PATH; npm run diagrams
... (rewrote docs/diagrams/*.dot and *.svg)
npm run diagrams  10.06s user 0.84s system 35% cpu 30.808 total
git status --short | grep docs/diagrams afterwards: the same 10 files the diff lists (layer-data, layer-server, layer-state, layer-views, layers; .dot and .svg)

$ sh ~/.claude/skills/land/templates/checks.sh /Users/axelfaes/workspace/research-hub/tools/oculus/.scratch/migration/orchestrator-state.md      (run 1 of the list, 14 min 16 s)
$ npm run format:check
Checking formatting...
All matched files use Prettier code style!
$ npm run lint
$ ! LC_ALL=C grep -rna '[^ -~]' src tests
checks: 7 commands passed
```
My capture of that run was piped through `tail -60`, so the `$ npm test`, `$ npm run test:checks`, `$ npm run check` and `$ npm run build` lines and their summaries are not in what I hold; the build's own tail ("built in 55.41s", adapter-node "done") is. The last line is `checks: 7 commands passed`, exit 0, so all seven exited 0.

Separate runs, same worktree:
```
$ npm test                    Test Files  1 failed | 429 passed | 23 skipped (453)   Tests  1 failed | 11301 passed | 625 skipped (11927)
```
The one failing file is `tests/server/edit/config-key.test.ts`, which this step does not change (`git diff bca66b3c --stat -- tests/server/edit/config-key.test.ts` prints nothing). I did not capture its failure text beyond a source excerpt. Alone: `npx vitest run tests/server/edit/config-key.test.ts` -> `Test Files 1 passed (1)  Tests 38 passed (38)`. Full runs used: checks.sh once (passed), `npm test` once (red only on that unchanged file, green alone). So the list passed in one full run; the report's statement that checks.sh never printed `checks: <n> commands passed` is true of the builder's three runs and not reproduced in mine.

Commands the report quotes:
```
$ npx vitest run tests/data/sources/personal.test.ts tests/views/boards/personal.test.ts tests/state/boards/board/personal.test.ts
 Test Files  3 passed (3)   Tests  91 passed (91)      (report: 51 + 20 + the state file's)
$ npx vitest run tests/data/sources/personal.test.ts -t "are read by the reader as one card each"
 Test Files  1 passed (1)   Tests  1 passed | 50 skipped (51)
$ npx vitest run tests/server/root/watch/portfolio tests/server/root/context.test.ts tests/server/edit/writes.test.ts      (slow-tagged files, run alone)
 Test Files  5 passed (5)   Tests  90 passed (90)
$ npx vitest run tests/checks/config/integrity.test.ts tests/checks/config/config-folder.test.ts
 Test Files  2 passed (2)   Tests  36 passed (36)       (not skipped; ls ../../side-projects prints gpu-game-boy residual scripted-os)
$ python3 -c "import yaml,sys; [yaml.safe_load(open(f)) for f in sys.argv[1:]]" config/sources.yml config/catalogs/vocab.yml config/layout.yml config/text/views/boards/personal.yml config/text/findings.yml     -> no output, exit 0
$ sh utils/folder-check.sh                                  -> no output, exit 0
$ LC_ALL=C perl -ne '... spec.md ASCII gate ...' $(find src tests config -type f ! -name local.yml)   -> no output
$ LC_ALL=C grep -n '[^ -~]' HELP.md DESIGN.md              -> no output
```
First run on the unchanged tree: the builder's copy of the base exists in this session's scratchpad (`.../scratchpad/base/tools/oculus`; `diff -rq` against the worktree's `src` lists 17 entries, equal to the 13 modified plus 4 new source files; its `tests` equal the worktree's). I ran, there, `npx vitest run` over the personal tests, `tests/server/root/watch/portfolio`, deposit, docs, project-files, pty context, writes, navigation, config-folder and root context: `Test Files 16 failed | 7 passed (23)`, 30 failed tests. Failing assertions seen there include `expected 200 to be 404` (3, the deposit, docs and project-files cases), `expected { found: true, ... } to deeply equal { found: false, changed: [], ... }` (the manifest and subtask writes), `expected [ 'alpha', 'x' ] to deeply equal [ 'alpha' ]` (deposit ids), `expected '# registries/venues.yml ...' not to contain 'side-projects/x'` (chat context), `expected [] to deeply equal [ 'root:tool' ]` (6 watcher cases), `TypeError: paths.roots is not a function`, and three files failing at import. Of the Projects-page pair, only "shows four tabs once the pages are reset" fails there, as the report says.

Mechanism check (reviewer's own runs, `node --experimental-strip-types` over the worktree's `watchPortfolio`, scratch hub and engine in the scratchpad, `rmSync`/`rm -rf` after 1.5 s of settling), counting portfolio messages after the removal and the personal ids afterwards:
```
remove .oculus/project.yml : 4 of 4 runs  -> 1 new portfolio message, personal ids []
remove .oculus (recursive)  : 4 of 4 runs  -> 1 new portfolio message, personal ids []
remove the whole root dir   : 4 runs: rmSync 1 message/[], rm -rf 1 message/[], rmSync 0 messages/[ 'root:tool' ], rm -rf 0 messages/[ 'root:tool' ]
```

## Verdicts

Items of the brief's "What to build", in its numbering:

- 1: holds. `config/sources.yml:123` is the rule after `projects/ideas`; `Tier` gains `'side-projects'` at `src/lib/data/model/model-entities.ts:16`; `config-folder.test.ts` "names the six research tiers and the side-projects folder..." passes.
- 2: holds. `isSideTier` skip at `src/lib/data/sources/manifests.ts:211` and `src/lib/server/content/docs.ts:190`; a test per caller exists and fails on the base (see Proof 1 for where three of them run).
- 3: holds. `readPersonal` and the shape are in `manifests.ts` (409 lines) and `model-entities.ts`; `normalise-personal.ts`, `state/boards/board/personal.ts` are where the item puts them; no file was added to a folder over ten (`sh utils/folder-check.sh` exit 0).
- 4: holds. `npm run check` is inside checks.sh (passed); `ENTITY_KINDS` holds `personal` (`normalise.ts:104`); `integrity.test.ts` passes unskipped.
- 5: violated, Spec 1. The signature, `WatchPaths.roots`/`workspacesFile` and the `context.ts` wiring hold; the engine config folder is not skipped by real path.
- 6: holds. `namedByConfig`, `roleDirectories`, `openRootFolder`, `openParent`, `pollFile` do what the text says, and the listed cases pass when run alone. The deleted-root gap is Behaviour 1; the item does not name it.
- 7: holds. `tests/data/sources/personal.test.ts` covers every field rule, finding key and file kind of the item (51 tests pass); `tests/checks/source/keys.test.ts` passes inside the list.
- 8: holds. `config/catalogs/vocab.yml:195-201` is the block; the glyph test covers its icons; `statusRows` is shared with `career_host_status` (Spec 4).
- 9: holds. `Personal.svelte` registration, `config/text/views/boards/personal.yml`, `layout.yml:73`, `registry.test.ts`, `catalogue.test.ts`, `arrangement.test.ts` pass.
- 10: holds as far as a string render and the pure functions can show; no press is exercised (the report says so).
- 11: holds. `config/sources.yml` roots; `config-folder.test.ts` "names roots that are on this machine" passes.
- 12: holds. Each draft's cited README lines were read and agree (see Spec 5); the reader's run over all six passes with zero findings.
- 13: violated, Spec 2. `HELP.md:104` lacks three things the item names.

Cases of the brief's "Cases":

- 1: met. `personal.test.ts` "gives three cards for three folders..."; `integrity.test.ts` "reads every side project of the hub with no finding" runs and passes; the view test draws three cards.
- 2: partial. Projects/Coauthor/Archive boards, `entities.projects`, the audit and the chat context are asserted; no test puts a side project through the Focus lanes, and the Personal-board side of the case has no research project in its fixture. Spec 3, Proof 3.
- 3: met. Deposit ids, 404 on POST and GET, manifest write, subtask writes, undo lookup, docs route, project-files route all pass (the deposit file in `npm test`, the rest run alone); all fail on the base. Proof 1.
- 4: met. `personal.test.ts` "gives a card root:<key>..." and the view test `--tone-txt: var(--c-green-txt)`.
- 5: met. "gives nothing, and no finding, for a root without .oculus" and the `.oculus`-is-a-file case.
- 6: met. Same directory twice, link to another root (both orders), hub under another key and by link.
- 7: met. "gives nothing, no finding and no throw for a root that is not on this machine".
- 8: met. `it.each(['done','Running','3','""','null'])` plus the no-status case.
- 9: met. Missing, empty, blank, list, number titles; root key fallback.
- 10: met. `it.each(['venue','type','id'])` asserts exactly one `personal_key` finding.
- 11: met. Not parsing, empty, list, 70 KiB, directory, symlink, FIFO each give a finding and no card; size bound tested at and over.
- 12: met. Mixed links and `links: x`.
- 13: met. View test "shows eli5 markup as its characters".
- 14: met. `personal_no_manifest`; no folder gives `{ personal: [], findings: [] }`.
- 15: met for the case as written (manifest written, edited, removed, with `.oculus` present and absent; `.oculus` removed and made again): `roots.test.ts` passes alone and fails on the base. Not covered, and not in the case: the whole root deleted (Behaviour 1).
- 16: met. `roots.test.ts` "reads the roots again at the next tick..." and "...once per change, not once per tick", on a manual clock.
- 17: met. `roots.test.ts` "lets the newest roots win..." and `portfolio.test.ts` "publishes and opens nothing after a close that came during a rebuild"; both fail on the base.
- 18: met. "keeps a side project that has the slug of a research project, each in its own kind".
- 19: met. State and view tests for the `idea` toggle and the `GAME` search.
- 20: met by reading. `config-folder.test.ts` glyph test prints `key: icon` for a side-status icon missing from `glyphs.yml`; I did not reproduce the report's `nonesuch_glyph` substitution (no edits allowed).
- 21: met. View test on `personal.empty`; all eight glyph names it uses exist in `config/catalogs/glyphs.yml`.
- 22: met. `arrangement.test.ts` "a Projects page saved before the Personal tab", both tests; the first passes on the base, the second fails there.
- 23: met. Data test with `my repo`, view test with `/home/me/my repo`; `manifestTarget` and `folderTarget` use the key and a relative path, never the root's directory.
- 24: met. Six drafts, zero findings.

## 1. Spec

1. `src/lib/data/sources/manifests.ts:368-390` (`rootPersonal`), `src/lib/server/root/watch/portfolio.ts:242-253` (`personalRoots`): "const hubReal = realDir(hub); if (hubReal !== undefined) taken.add(hubReal);" and "if (root.key === HUB_ROOT || root.key === ENGINE_ROOT) continue;". What is wrong: item 5 says `readPersonal` drops HUB_ROOT and ENGINE_ROOT and skips a root "whose real path is the hub, the engine's config folder or an earlier root's". The reader skips the hub and earlier roots by real path; nothing skips the engine's config folder by real path, and the key drop lives in the watcher. The report states the move of the key drop. Failure scenario: a Files root added with Add Folder that is `tools/oculus/config` under a key other than `engine`, holding a `.oculus/project.yml`, gets a `root:<key>` card; the brief says it gets none. Low reach, since it needs that folder added and a manifest in it. Verdict: item 5 violated.
2. `HELP.md:104` (the `personal` row): "...and a repository that is a Files root and holds `.oculus/project.yml`. A card shows the title, which opens the manifest, the status in its colour..." What is wrong: item 13 asks the row to name the four statuses, to say a side project is on no other board, and to say a repository is read once it is a Files root "added with Add Folder or under `roots:` in `sources.yml`". The row names none of the three; the "no other board" sentence is only in the data-source paragraph at `HELP.md:241`. Failure scenario: a reader of the views table who has a repository with a manifest and no card does not learn from that row that the repository must first be a Files root, or how to make it one. Verdict: item 13 violated.
3. `tests/server/root/watch/portfolio/...` none; `tests/data/sources/personal.test.ts:611-638` and `tests/state/boards/focus/*`: case 2 lists "the Focus lanes" and no test sends a side project through `laneItems` (`src/lib/state/boards/focus.ts:261,347` read `entities.projects` only; the Focus tests changed only by `personal: {}`). What is wrong: a case with one named surface unasserted. Failure scenario: a later change that lets `laneItems` read `entities.personal` is not caught. Verdict: case 2 partial.
4. Changes no item asks for, each reported afterwards in "Judgment calls": `src/lib/state/shared/words/status-rows.ts` (new) and `src/lib/state/boards/career.ts:12-37` (the career reader rewritten onto it); `src/lib/state/workbench/navigation/registry.ts` (`personalBadge` in `BadgeClient`); `config/text/app.yml` and `HELP.md:62` (`p1-p4`); `tests/checks/tree/allow-duplication.txt` (four clone marks re-written: only the four hash/line-count entries changed, none added); `tests/server/root/watch/portfolio.test.ts` replaced by the folder `tests/server/root/watch/portfolio/` (every old `it`/`describe` title is still present: `diff` of the sorted title lists shows additions only). The brief's path list names none of these and says a needed path outside it "is reported before it is written". The `registry.ts`, `app.yml`, `allow-duplication.txt` and test-folder changes follow from a type error, `tests/views/system/help.test.ts`, the clone check and the ten-item folder limit; the `career.ts` rewrite follows from the duplication check, not from item 8, which only says the new reader "follows" the career one. Failure scenario: none to the tree; the orchestrator should know that landing carries these files. Verdict: none.
5. The six manifest drafts, judged against the README lines each cites (read-only): cathedra README 1, 3, 5-7 and "Possible future extensions" agree with title, eli5 and empty `next`; game-engine README 1, 3, 5, 9-14 (`> **Status: in progress.**`) agree with `Missal`, `building`, eli5 and the empty `next` (the README gives a not-built list and `docs/roadmap/`, no single next action); ordo README 1, 3, 5 and the `utils/pin.sh v1.1.0` install block agree (`git tag` in the clone ends at v2.7.0, so `running` rests on use, not on the README stating a status); scotoma README 1, 3, 7 and "Order of work" step 9 agree with `building` and the `next` text; officium README 1, 3 and the `Run`/`Desktop application`/`Verify` sections agree (the README states no status; `running` is the builder's reading, which the report says is Axel's to correct); youtube-downloader README 1, 3, 5 and `ls` (`ytdlp.py requirements.txt data.yml stats.yml ...`) agree, and `git -C ~/workspace/youtube-downloader check-ignore -v .oculus/project.yml` prints `.gitignore:4:*.yml` while the same command prints nothing for the other five. Status choices for cathedra, ordo and officium rest on use rather than on a stated status; they are drafts the brief leaves to the landing. No finding.

## 2. Proof

1. `tests/server/edit/writes.test.ts:10`, `tests/routes/docs/docs.test.ts:16`, `tests/server/root/watch/portfolio/roots.test.ts:6`, `tests/server/root/watch/portfolio/portfolio.test.ts:4`: "// @module-tag slow: its cases time out or fail on a loaded machine, so npm test leaves it out." What is wrong: `package.json` runs `vitest run --tagsFilter '!slow'` for `npm test` and `test:checks`, so the manifest-write, subtask-write and undo-lookup tests (case 3), the docs-route test (case 3), the three watcher cases 15, 16, 17 and the close-during-rebuild test are never run by `checks.sh`. I ran them alone and they pass (90 tests above), and they fail on the base. The `writes.test.ts` and `docs.test.ts` additions are plain synchronous tests that could sit in a file the list runs. Failure scenario: a later change makes `readManifests` yield the side tier again; `checks.sh` stays green because the only tests of the subtask and manifest writes are in a file it leaves out. For the real-event watcher cases the slow tag is the tree's convention for load; the same exposure applies to them. Verdict: none (cases stay met on the strength of my alone runs).
2. Report, "The cases on the unchanged tree": "Result: `Test Files 17 failed | 8 passed | 1 skipped (26)` ... fails at import". What is wrong: the brief requires the failing run of each new test to be quoted; the report quotes one aggregate line, a table of the word "fails", and one assertion (case 20). Not one failing assertion of the 30 is quoted. The failures are real (my rerun above reproduces them), so the cost is the reader's, not the tree's. Failure scenario: the landing reader cannot tell from the report which of the 30 failures is an import error and which an assertion on behaviour. Verdict: none.
3. `tests/views/boards/personal.test.ts:112-115`: "it('draws a card for a side project of a research slug, and none for a research project', () => { install([side('alpha')]); expect(cards(html())).toEqual(['side:alpha']);". What is wrong: the title claims the Personal board omits a research project, but the snapshot (`badgeSnapshot(true)`) holds no research project, so the test passes with the isolation removed. The isolation is asserted in `personal.test.ts:611-638` (`entities.projects` and boards), not here. Failure scenario: none for behaviour (the data test covers it); the test title overstates what it checks. The test at `:196-200` ("keeps a folder named like an object key...") and the "audits that the badge counts no cards" test are likewise guards that pass without the behaviour. Verdict: case 2 partial (Spec 3).
4. Report, "One limit": "a root directory deleted as a whole sends the watcher no event on this platform (the test that removed a whole root got none)". What is wrong: no test of a whole-root removal is kept in the tree, and my four runs through `watchPortfolio` gave an event in two and none in two (table above), so "sends no event" is neither reproducible as stated nor false everywhere; delivery is unreliable. A decision rests on it: whether to book the gap or close it. Failure scenario: Behaviour 1. Verdict: none.

## 3. Standards

1. Report, "A rule of the brief was crossed twice": the builder ran `git diff --stat ... >/dev/null` and `$(git diff --name-only ...)`. What is wrong: `agents/spec.md`, "Where you work": "You never run a git command. Not `add`, not `commit`, not `stash`, not `checkout`, not `status`." Both were read-only with output discarded; I found no change to the tree from them. Failure scenario: a `git diff` in a worktree can refresh the index stat cache, which the orchestrator's later `git diff` does not depend on; no wrong result follows here. Verdict: none.
2. `src/lib/data/sources/manifests.ts:302`: "function expandHome(dir: string): string { if (dir === '~') return homedir(); return dir.startsWith('~/') ? join(homedir(), dir.slice(2)) : dir; }" against `src/lib/server/files/files.ts:205` (`export function expandHome`, same logic). The dedup by real path also exists twice: `portfolio.ts:242-253` (`personalRoots`) and `manifests.ts:368-390` (`rootPersonal`), and the home expansion runs in both. What is wrong: `agents/spec.md`, "The principles every package is judged on": "a parser, a fold or a rule exists once and is reused". The data layer cannot import the server, so the one copy belongs in a data-layer helper that `files.ts` imports. Failure scenario: a later change to home expansion (for example `~user`) lands in `files.ts` only; the Files view and the Personal board then resolve the same root to different directories. Verdict: none.

## 4. Behaviour

1. `src/lib/server/root/watch/portfolio.ts:402-422` (`openRootFolder`) and report "One limit": "booking it is the orchestrator's call". What is wrong: a repository whose directory is deleted keeps its card until some other rebuild runs; my runs gave a rebuild in 2 of 4 whole-root deletions and none in the others, while removing `.oculus/project.yml` or `.oculus` rebuilt in 8 of 8. The root's parent is not watched while the root exists (`openParent` is reached only when `.oculus` is missing at a rebuild), so nothing hears the root disappear when the `.oculus` handle misses it. `agents/spec.md` ("Nothing left undone") and the global rule on lazy options say a limit stated instead of a defect fixed is a finding; the fix is in the step's own file: a flat watch on each root's parent filtered on the root's name, as `openParent` already does for a missing folder. Failure scenario: the reader moves or deletes `~/workspace/scotoma`; the Personal board still draws `root:scotoma` with its title and next action until something else rebuilds the portfolio, and Show in Files and the title press then point at a path that is not there. Verdict: none (item 6 and case 15 hold as written; this is the gap the report names).
2. `config/text/views/boards/personal.yml:4` and `HELP.md:104`'s counterpart: "once the repository is a Files root, added with Add Folder or under `roots:` in `sources.yml`". What is wrong: the Files view's control is "Add Folder to Workspace..." (`config/text/views/sources/files.yml:50`, `menu_add_root`), so the empty-board sentence names a control by a name it does not carry; the brief used the same short name. Failure scenario: a reader looks for a control labelled "Add Folder" and finds "Add Folder to Workspace...". Verdict: none.

## Declined to judge

- The look on screen (card layout, the chip colours, the clamp, the presses of the title and of Show in Files): needs a DOM and Axel's Chrome on TEST; the unit suite renders to a string only, as the report says.
- The first four commands' summary lines inside `checks.sh` run 1 (`npm test`, `test:checks`, `check`, `build`): my capture was truncated by `tail -60`; the run exited with `checks: 7 commands passed`, and `npm test` was rerun on its own (above). The report's counts (`COMPLETED 2971 FILES`, 443 tests) were not reproduced; no decision rests on them.
- `tests/data/snapshot/build-timing.test.ts` (slow, 5000 ms): not changed in substance by the step; not run.
- Whether `youtube-downloader`'s `!.oculus/project.yml` line and the six commits are done correctly at landing: nothing is written there by this step; reading only.
- Whether `running` is the right status for cathedra, ordo and officium: a call for Axel, not settled by a README read.
- The mutation check "this test fails without the behaviour" for each new test: I reproduced the failures on the builder's base copy, but I did not edit the worktree to remove behaviour, so the claim for each individual test beyond that run is by reading.
- Reviewer side effects: one command of mine wrote an empty file `/tmp/old_names.txt` (outside every repository), and the watcher reproduction wrote scratch folders under this session's scratchpad (`e1`, `h1`, `r-*`, `w-*`); neither is read by anything. `npm run diagrams` and `npm run build` regenerated tracked and untracked outputs in the worktree as the list requires. No other file was edited, and no git command other than `git diff bca66b3c`, `git diff ... --stat`/`--name-only`, `git status --short`, and read-only `git check-ignore`/`git tag` in the six repositories was run.

Reviewer usage: about 312,000 tokens (budget counter), about 75 tool uses (count by hand), about 50 minutes (clock); no completion notice is available to the reviewer.
