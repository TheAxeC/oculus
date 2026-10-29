# Step O99 refuter report (on /Users/axelfaes/workspace/oculus/.agents/worktrees/migration-O99, base a5281619a)

A page this report cites (the rules file, a standard, a skill's text) is named with its section, never with a line number, since a page's lines move and a section's name does not. A finding in code keeps its `file:line`.

The report is written in the rules file's character set. A character outside it in a quoted line is written by its name in angle brackets, such as `<tab>` or `<em dash>`.

## Verification (rerun by the reviewer)

The rules file (`.scratch/migration/agents/spec.md`) names no output filter (`grep -n -i "filter\|piped\|redact" .scratch/migration/agents/spec.md` exits 1), so each command ran unfiltered. All runs were from the worktree root with `PATH=$HOME/.nvm/versions/node/v24.21.0/bin:$PATH`. No other vitest or svelte-check was running at the start (`ps -Ao command | grep -E 'vitest|svelte-check'` printed nothing).

```
$ npm run diagrams && npm run docs:palette && npm run test:quick -- --base a5281619a; echo exit=$?
test:quick: 222 changed file(s), from git since a5281619a
test:quick: 340 test file(s)
ok      ASCII gate (2.7 s)
ok      svelte-kit sync (2.7 s)
ok      prettier (2.7 s): All matched files use Prettier code style!
ok      eslint (22.1 s)
ok      svelte-check (32.4 s): 1793297781627 COMPLETED 568 FILES 0 ERRORS 0 WARNINGS 0 FILES_WITH_PROBLEMS
ok      vitest checks (169.2 s): Duration  157.71s (transform 45.15s, setup 0ms, import 185.41s, tests 377.80s, environment 5ms)
ok      vitest (201.2 s): Duration  192.39s (transform 142.45s, setup 0ms, import 313.98s, tests 402.60s, environment 14.20s)
ok      vitest slow (283.2 s): Duration  274.54s (transform 17.69s, setup 0ms, import 153.67s, tests 932.34s, environment 20ms)
test:quick: 286.2 s; every command passed
test:quick: not covered: tests that reach no changed file within the import depth,
            other than the checks under tests/checks/source and tests/checks/tree,
            which run for any change under src, tests or utils; the build, the lint
            of unchanged files
exit=0
(git status --short | wc -l: 205 before and after; npm run diagrams rewrote only the docs/diagrams files already in the diff)

Verify 2 (the ASCII gate over the 211 files git status lists, deleted paths and every file named local.yml left out):
$ tr '\n' '\0' < o99-files.txt | xargs -0 env LC_ALL=C perl -ne '...as the brief gives it...'; echo exit=$?
verify2 exit=0          (nothing printed)

Verify 3:
$ sh utils/unused-exports.sh > o99-unused.txt; diff ../O99-base/unused-exports.txt o99-unused.txt
1c1
< Unused exports (230)
---
> Unused exports (228)
40a41
> src/lib/server/core/files/yaml/yaml-edit.ts: BLOCK_LISTS, pathOf, renameKey
52d52
< src/lib/server/edit/writes/config/lists/rail.ts: RAIL
56d55
< src/lib/server/edit/yaml/yaml-edit.ts: BLOCK_LISTS, pathOf, renameKey
179c178
< src/lib/state/system/config/groups.ts: FILES, CATALOGS_GROUP, TEXTS_GROUP
---
> src/lib/state/system/config/groups.ts: FILES
182d180
< src/lib/state/system/config/write.ts: commit
232c230
< Unused exported types (109)
---
> Unused exported types (108)
318d315
< src/lib/state/system/config/write.ts: Committed
(the one added line is the moved yaml-edit.ts; equal to the builder's quote)

Verify 4 (the first grep run as grep -rn, not git grep):
$ grep -rn "EditLink\|settings_machine_edit_in\|settings_machine_edit_tip" src config tests --exclude=local.yml; echo $?
1
$ grep -n "ships none\|ships neither" config/defaults/behavior.yml src/lib/data/sources/config/settings/rows/read.ts; echo $?
1
$ grep -nE "Empty makes no key|Empty tells no failure apart|Empty downloads nothing|says no source is configured" config/options/behavior.yml; echo $?
1

Verify 6:
$ wc -l <changed src .ts/.svelte> | sort -rn | head
  871 src/lib/data/model/index.ts / 869 src/lib/state/client/writes.svelte.ts / 867 src/lib/data/sources/config/catalog/options.ts
  components: 520 src/lib/shell/keys/Palette.svelte / 519 src/lib/views/system/workbench/Settings.svelte / 518 .../editors/FieldControl.svelte
$ sh utils/folder-check.sh; echo $?
folder exit=0

Verify 7 (the + lines of git diff a5281619a -- src tests and every new file under them, comment lines and it/test/describe titles, grepped for the history words, a package id and a date):
every hit is "before", "still" or "no longer" about the order of the program's own steps or a file's state at run time (e.g. in-place.ts "a new failure row comes before oculus's", scopes/rows.ts "it still draws rows from"); no package id, date, session or reverted attempt.

The builder's quoted evidence, rerun or reproduced:
- Cases 18, 19, 20, 30, 31: the builder's rows.ts is deleted and its source is not in the report; my own read-only probe (scratchpad o99rev/merge.ts, loadConfig(<worktree>, { hub, instead: hub text })) printed:
  c18 none ["openalex","semantic_scholar","crossref","pubmed","europe_pmc","arxiv","wos","scopus"] []
  c19 ["openalex=Renamed",...,"scopus=Scopus","extra=Extra"] []
  c20 ["arxiv","arxiv_pdf","pubmed","europepmc","scholar","shellcheck"] []
  c30 ["doi","arxiv","arxiv_pdf","pubmed","europepmc","scholar","shellcheck"] ["links names doi in more than one entry; none of them is applied and oculus's entry stands"]
  c31 ["Mine","Key refused","Unknown host","No route to the cluster","Host key not trusted","Git sign-in refused","Git key refused"] []
  which agrees with the builder's lines.
- The shipped rows against the research hub's (node, yaml parse of config/defaults/behavior.yml and the hub's .oculus/config.yml, isDeepStrictEqual per row):
  literature.sources equal: false rows 8 vs 8 (only arxiv.fields.oa.value "true" || true)
  recover.sources equal: true rows 11 vs 11
  links equal: true rows 7 vs 7
  sign_in equal: true rows 3 vs 3
  connections.failures equal: false rows 6 vs 6
    row 1 fix "...that this machine is on the cluster's network" || "...that this Mac is on the UT network or on EduVPN"
    row 2 fix "Connect this machine to the cluster's network" || "Connect this Mac to the UT network or to EduVPN"
    row 5 fix "Add this machine's ssh key to the git host, ..." || "Add this Mac's ssh key to the git host, ..."
  recover.node_download, clusters.key_type, clusters.key_file equal: true
- Verify 1's first-run timeout of tests/data/hubs/hub-portfolio.test.ts: my run of the list passed every tier, that file included, so the claim needs no run alone.
- The base batch (o99notes/base-batch.json, read with node): ten files do not load on the base (Cannot find module), the counts per file equal the report's.
- Cases 9 to 11 (draws.test.ts), 21, 22, 22a, 35, 36 (views.test.ts), case 2 (c2.ts) and the oa probe (o99probe/oa.ts): deleted, source not quoted; not rerun (Proof 1).
```

## Verdicts

Items of the brief's "What to build", in its numbering:

- 1: holds, by reading `src/lib/state/system/config/scopes/scope.ts` (`takes`, `fileOf`, `standing`, `hubsOf`, `reposOf`), `scopes/rows.ts` (`scopeGroups`) and `settings/scopes/scopes.svelte.ts`, and the rows of `hub-scope.test.ts`, `machine-section.test.ts`, `row-writer.test.ts` green in Verify 1; the Repository scope draws `editor.languages` alone, under the premise finding Spec 4.
- 2: holds, by reading `scopes.svelte.ts` (`save`, `saveAll`, `named`, `resume`, `saveFile` with the digest), `autosave.svelte.ts` (`joinSaveEvery`) and `tests/routes/edit/undo/config-save.test.ts` (one record per file, digest refusal, put back on refusal); the reach of Save All into an app's call is Behaviour 1.
- 3: violated, Spec 5 (a save that moves a secret loses the undo of every key of the save, where the item keeps undo off "for that field"); the rest holds: Verify 4's first grep, `SecretBox.svelte`, `local-save.ts`, `tests/routes/hubs/settings-secrets.test.ts` green.
- 4: holds, `described_by` read in `catalog/options.ts` (`describedRecord`, `namedField`, `fillNamed`, the `described_loop` finding), the five field records of `config/options/behavior.yml` named once (24 `described_by` lines), `sparse-card.test.ts` and `options.test.ts` green.
- 5: holds, `debug.test.ts`, `cpp.test.ts`, `deck-slides.test.ts`, `primary-key.test.ts` (per ruling 2 of the cases ruling), `config-save.test.ts` (folder names) green; the guarded coverage of the two new routes is Spec 7.
- 6: holds by reading `LineCounts.svelte` (`--group-strip: 0px` on the scroller); the look at landing settles it.
- 7: violated, Spec 3 (three `connections.failures` rows are not the rows the hub holds today, and the report does not say so); the merge by row reproduces (my probe above), the sentences are corrected (Verify 4), and the merge's test is Spec 1.
- 8: holds, `src/lib/state/workbench/layout/saved/views.ts` (`giveViews`, `withView`), `parseLayout`'s `views` read (`saved.ts:550-551`), `newPage`/`remade` recording `views`, `venues-browser` after `venues` in `config/defaults/layout.yml`, the G29 row green.

Cases of the brief's "Cases":

- 1: met, `config-save.test.ts` row 'two options of the workspace file' (one record) and the reading of `scopes.svelte.ts` `stage.set` and the tab's save key; the press is the look.
- 2 (as ruled): met by reading `takes` (`literature.timeout_s` is a workspace-layer row, `literature.prefer` a hub-layer row) and `config-save.test.ts` row "an option of the primary's settings file".
- 3: met by reading (`fileOf` names `hub:<primary>` from the live ground); the look.
- 4: met by reading (`hubsOf` and `reposOf` over the live `roots`); the look.
- 5: met by reading (`ask`, `named`, `resume`); the look.
- 6: met by reading (`saveAll` saves each file in order, `save` only the scope on screen) and the one-record rows of `config-save.test.ts`; the File menu press is the look.
- 7: met, `config-save.test.ts` row "the machine's port in the primary's local.yml" and the four rows of `settings-secrets.test.ts` (545 (a)).
- 8: met by reading (`saveLocal` writes 600 and `ignoreLocal` for a made file; `saveRepo` makes `.oculus/` and the file, `created` recorded); the Repository half has no run.
- 9: not verifiable, the probe `draws.test.ts` is deleted and its source is not quoted; the reading gives no file-opening control in Settings (Verify 4, `Control.svelte`, `List.svelte`, `Origins.svelte`) but not that every option draws field by field; settled by the probe's source and output, or the look.
- 10: met by reading (`Control.svelte` draws `Editor` whenever `drawsEditor(row)`, the `missing` branch to `EditLink` gone); the look.
- 11: met by reading (judgment call 8, `workbench.settings_undrawn` on the row).
- 12: met, `sparse-card.test.ts` describe "a reader row's values at any depth, each drawn by a control of its own" green.
- 13: met, `debug.test.ts` the three edit and delete rows green.
- 14: met, `cpp.test.ts` green.
- 15: met, `deck-slides.test.ts` describe "writing a deck's keys" green.
- 16 (as ruled): met, `primary-key.test.ts` the four rows and the choices row green.
- 17: not verifiable, a drawing only; the look at its narrowest and widest pane.
- 18: met, my probe (literature) and the row comparison above (11, 7, 3, 6 rows shipped; `ed25519`, `~/.ssh/id_{type}_{resource}`).
- 19: partial, the run gives the expected order and names; no test, Spec 1.
- 20: partial, as 19, Spec 1.
- 21: met by reading `viewed` (records `venues-browser`, a closed tab is not given again); the look.
- 22: met by reading (a page with no `views` is given every view it lacks and the record is written).
- 22a: met by reading (`fresh.length === 0` returns the page).
- 23: met, Verify 4's second grep exits 1.
- 24: met, `downloadRows` (`local-save.ts`) keeps the stored secret for a row sent with none, `SecretBox` holds nothing for an empty box, `settings-secrets.test.ts` row 'a row sent with no secret'.
- 25: met by reading (`fileOf` keeps both scopes under `hub:<name>`, one `saveFile`).
- 26: met by reading (changes keyed by the hub's name, not by "primary").
- 27: met, `config-save.test.ts` describe "a folder's name and the primary set in the Workspace scope", four rows.
- 28: met, `config-save.test.ts` 'refuses a save over a file changed since it was read, naming it, and writes nothing'.
- 29: met, `machine-section.test.ts` and `hub-scope.test.ts` rows named in the report, green.
- 30: partial, as 19, Spec 1.
- 31: partial, as 19, Spec 1.
- 32: met by reading (`saveAll` sets `asking = 'all'` and `resume` saves every file after the name); the look.
- 33: met by reading (`saveTarget` 'gone', `scopeGone`); the look.
- 34: met under the corrected premise (Spec 4): `takes` gives the Repository scope `layer === 'repo'`, `saveRepo` refuses any key but `languages`.
- 35: met by reading `withView` (the pane holding the arrangement's tab before it).
- 36: met, the G29 row 'rail pages: the views a rail page records, an empty and a repeated entry left out' green; `parseLayout` drops '' and repeats.

## 1. Spec

- `src/lib/data/sources/config/merge/in-place.ts:133-145` (`ROW_SHAPES`, `hubShapeOf`) with the report's "Anything in the brief that was wrong or impossible": "The merge of the five shipped service lists by key ... has no test ... The text G126 would need, with its rows, is under 'Doc text' as a proposal"; what is wrong: the rules file's test rule calls for a test here (a hub row silently dropped, a removal ignored, or a failure row matched in the wrong order is a wrong configuration accepted), no existing entry holds it (G126's text names the keys of `config/catalogs/vocab.yml` and the workspace catalogs, not these lists of `config/defaults/behavior.yml`; G136's 'case 15' row covers only case 18's literature half), and the brief says such a test is handed back before it is written; the builder built on and opened its report "Everything in the brief is done"; failure scenario: a later change that makes `connections.failures` new rows go after oculus's again, or drops `added: 'first'`, passes every test, and a hub's own error text stops being matched first. It needs Axel's ruling: (a) G126 widened to "the service lists `literature.sources`, `recover.sources`, `links` and `sign_in` by `key` and `connections.failures` by `kind`, laid the same way, a new failure row read before oculus's", its Test line naming rows of `tests/data/sources/config/layers/hub-vocab.test.ts` for cases 19, 20, 30 and 31 (its Code line already names `merge/`); (b) a new entry; (c) no test, the lazy option. Recommendation (a), the same reasoning as 545 (a). Verdict: cases 19, 20, 30, 31 partial.
- The report's "Shell edits": "python3 heredocs on: `key-path.ts` ... `sed -i` on `deck-slides.test.ts` ... `cat >` of `src/routes/api/(files)/primary-key/+server.ts` ... python3 rewrap helper (`scratchpad/o99tools/rewrap.py`, deleted)", and the probes `o99probe/oa.ts`, `c2.ts`, `rows.ts`, `views.test.ts`, `draws.test.ts`; what is wrong: file edits and probes by programs the brief does not build and no line of `plan.md`'s Rulings approves (spec.md "What every package obeys", the case-run program paragraph; the probes do not qualify as case-run programs since their source is not in the report); disposition by the standing ruling "Unapproved builder scripts" (plan.md Rulings): booked, every hunk those commands changed read against the brief; failure scenario: a heredoc that rewrote a whole file (`list-entries.ts`, `local-save.ts`, `writer.ts`) carries a change no Edit diff shows the builder deciding, and the landing keeps it unread.
- `config/defaults/behavior.yml:87-93` (the `connections.failures` rows) with the report's Hub text "93-102: `connections:` with its `failures:` rows (the six oculus now ships)": "fix: Check the host of the cluster entry in the resources registry and that this machine is on the cluster's network" / "fix: Connect this machine to the cluster's network" / "fix: \"Add this machine's ssh key to the git host, ...\""; what is wrong: item 7 ships "the rows the hub holds today"; three rows carry reworded fix texts (the hub's say "this Mac is on the UT network or on EduVPN", "Connect this Mac to the UT network or to EduVPN", "Add this Mac's ssh key"), the report does not say so, and the Hub text deletes the hub's six rows, although by decision 8 the hub's three UT texts are its own and can stay as rows of the same `kind` replacing oculus's in place; failure scenario: after landing, Axel's failed ssh to the UT cluster says "Connect this machine to the cluster's network" in place of the EduVPN instruction he wrote. The generic words in oculus are the right ones to ship; the Hub text should keep rows 96, 97 and 100 (kinds `Unknown host`, `No route to the cluster`, `Git key refused`) and delete the other three. Verdict: item 7 violated.
- Brief "What is on the tree", the Repository scope premise: "The Repository scope's keys are the `editor:` block (`src/lib/data/sources/config/editor-options.ts:1-3`)"; what is wrong: the premise does not reproduce: `parseRepoSettings` (`editor-options.ts:207-219`) reads `languages:` alone and names every other top-level key `unknown-key`; the builder drew `editor.languages` alone and said so; failure scenario: a reader of the brief and decision 4 expects the Repository scope to set `editor.word_wrap` per repository, which no file can hold. Verdict: none (case 34 met under the corrected premise).
- `src/lib/server/edit/writes/config/save/local-save.ts:316,320-327`: "const moved = secretsMoved(source, after, dir); ... undo: moved ? 'none' : 'field',"; what is wrong: item 3 says History records that the secret field was set "and its undo is not offered for that field"; the record offers no undo for the whole save, so every other key saved with it loses its undo; failure scenario: in This machine of the primary, set `port` to 8799 and a `downloads` secret, Save: History offers no way to take the port back. Verdict: item 3 violated.
- `src/routes/api/(machine)/cpp/+server.ts` and `src/routes/api/(docs)/primary-key/+server.ts` (two new write routes): "export const POST: RequestHandler = ({ request, locals }) => handleCppPost(request, locals.server.token, options(locals));"; what is wrong: both routes write and take a root from the body, so they fall under G1 (a write route refuses a request without the token) and G2 (a path outside the workspace is refused), whose Code lines name each route under `src/routes/api/`; the step adds no G1 or G2 row for them and the Doc text does not add them to those entries (the handlers do call `tokenedBody` and `repositoryOf`, `cpp-write.ts:123,131`); failure scenario: a later edit drops `tokenedBody` from `handleCppPost` and no test fails, and a page from another origin can rewrite a repository's `cpp.yml`. Fix inside the brief: G1 and G2 Code and Test lines in the Doc text, and one refusal row each in `cpp.test.ts` and `primary-key.test.ts`. Verdict: none.

## 2. Proof

- The report's "The cases' first run" and "The cases after the change": "The merge cases ran through a case-run program, `rows.ts` in the scratchpad ... the program and its scratch hubs are deleted", and likewise `views.test.ts`, `draws.test.ts`, `c2.ts`, `o99probe/oa.ts`; what is wrong: the rules file allows a case-run program only with its source and output quoted, so the reviewer can run it again; no source is quoted; the decision resting on them is the verdict of cases 9, 10, 11 (every option draws a control), 21, 22, 22a, 35 and the oa reading of judgment call 12; I reproduced 18, 19, 20, 30, 31 with a probe of my own and read 21 to 35 from `views.ts`; 9 stays not verifiable; failure scenario: an option whose control falls back to a text box for a record (a raw YAML box, which item 3 says is no control) passes, since the only evidence it does not is a deleted program's "NODRAW layout.yml:rail" line. Verdict: case 9 not verifiable.
- The report's "Verify 1": "The second run (`o99notes/verify1-final2.txt`) prints the lines below ... The run before it ... failed one slow test"; what is wrong: the notes hold three runs of the list (`verify1.txt` 18:07 with 5 failed checks and 1 failed test, `verify1-final.txt` 18:44, `verify1-final2.txt` 18:51); the report names two, and the third was a whole rerun after a red line in a file the step does not change, which the rules file's token discipline answers with a run of that file alone and no rerun of the list; the decision resting on it is whether the step stayed in its run budget; failure scenario: the orchestrator books two list runs for O99 where there were three, one of them beyond what the rules allow.
- The report, the base runs of changed tests: "base 235 tests, 201 pass, 32 fail, 2 skipped, 10 files do not load"; what is wrong: the rules file asks the report to quote, for each test added or changed, its failing line on the unchanged tree; the report quotes lines for some files and only counts or "do not load" for `tests/state/system/entry-forms.test.ts`, `editor-saved.test.ts`, `row-writer.test.ts`, `machine-section.test.ts`, `options-pages.test.ts`, `port-row.test.ts`, `connection-keys.test.ts`, `config-folder.test.ts`, `options.test.ts`, `reader.test.ts` and `config-key.test.ts` (the lines are in `o99notes/base-batch.json`, which I read); failure scenario: a reader of the report cannot tell which row of `port-row.test.ts` failed on the base and whether it fails for the behaviour or for a fixture.

## 3. Standards

- `tests/state/system/entry-forms.test.ts` (new file): "describe('the changes an entry form sends', () => {"; what is wrong: the rules file's test rule says a test exists only as the test of one entry of `agents/guarded.md`, named there by file and title; the Doc text names this file under no entry (the report's only mentions are the DONE row of item 5, the rewrap list and the line counts); failure scenario: the file stands under no guarantee, so the next step that deletes the tests its change makes obsolete has no entry to judge it by, and the landing books a test no entry holds.
- `src/lib/state/sessions/source/autosave.svelte.ts:148-153`: "/** Save every tab that holds unsaved text, as a press of Save on each does; whether every such tab was written. ... */ /** The saves that joined Save All: a Settings view's save of every scope. */ const joined = ..."; what is wrong: the `joined` declaration was put between `saveEvery`'s doc comment and the function, so that comment now stands over `joined` and `saveEvery` has none, and the comment no longer says that it also runs the joined saves (rules file, the head and doc comment of every function touched re-read); failure scenario: an editor's hover on `saveEvery` shows no doc, and a reader of the comment over `joined` reads a description of a different thing.
- The report's "Doc text", `docs/HELP.md` line 344 replacement: "Each heading has Open Settings File and Show Defaults, which opens oculus's defaults file to read only."; what is wrong: the step removes Open Settings File from every heading (`List.svelte` diff, its head comment "No line opens a user's file"); the proposed HELP line is false the day it lands (rules file, a sentence a change makes false is a defect of the change); failure scenario: a reader of HELP looks for Open Settings File under a Settings heading and finds none.
- The report's "Hub text": "88-90: `clusters:` ... 93-102: `connections:` ..."; what is wrong: I checked each range against `/Users/axelfaes/workspace/research-hub/.oculus/config.yml` (760 lines): 88-90, 93-102, 103-130, 131-325, 334-710 and 752-760 hold what the report says, but the comment lines 87 ("# The key Account setup makes for a cluster: ...") and 92 ("# The rows that tell a failed cluster connection or git fetch apart, ...") are left above the next key once their blocks go, and the six-row deletion is Spec 3; failure scenario: after the landing deletes the ranges, line 87's comment sits over `connections:`'s comment and both over `literature:`'s neighbour, describing keys the file no longer holds.

## 4. Behaviour

- `src/lib/state/sessions/source/autosave.svelte.ts:162` with `src/lib/state/client/context.ts:734` ("saveAll: autosave.saveEvery,") and `src/lib/state/system/apps/apps.svelte.ts:432`: "const others = await Promise.all([...joined].map((one) => one()));"; what a host or user sees change: an app's `workspace.saveAll` (`oculus/workspace/saveAll`, `server/machine/apps/tools/workspace/workspace.ts:431`) reaches `saveEvery`, which now saves every Settings scope's held changes, the This machine scope's `local.yml` and its secrets included, and can raise the workspace name question; the report states this only for the File menu; failure scenario: an approved app that calls `workspace.saveAll` writes a hub's `config.yml` and `local.yml` with changes the reader had not chosen to save, past G77's rule that an app acts only within its own scope. A decision for the orchestrator: keep an app's saveAll to the source tabs (a second entry point for the File menu) or state it as intended.
- `src/lib/views/system/workbench/settings/other-rows/ClusterRows.svelte` (deleted) and the Port row (`port-row.test.ts:62-68`); what a host or user sees change: the This machine `clusters:` editor with a Save and Remove per row and a pick that adds a row for a cluster of `slurm.resource` that has none is replaced by the generic family editor, and the Port row shows the port `local.yml` names with a note for the listened port, where it showed the listened port; neither is in the report's "Host-visible changes" with its before and after (the test table and the Doc text name them); failure scenario: the look at landing does not check whether the generic editor still offers the clusters of `slurm.resource`, and Axel finds the add-for-cluster pick gone (not verified whether it is).
- `config/defaults/behavior.yml` `sign_in` and `connections.failures`; what a host or user sees change: a hub that sets none now gets the Google, Microsoft and GitHub providers in Account setup and oculus's six failure texts; the report's case 18 line names the Literature search, Recover, links and the key file only; failure scenario: the look at landing does not open Account setup on a hub with no `sign_in`, and a provider row Axel did not configure shows up unchecked.

## Declined to judge

- `config/options/local.yml` and its diff, never read: the hard limit forbids reading any file named `local.yml` (the classifier also refused a grep of it); whether its six changed lines give every `LOCAL_KEYS` key a control and the `secret` field its password box is not checked.
- New files not read whole, by the time of the review: `src/lib/server/core/files/yaml/key-path.ts`, `yaml-edit.ts`, `yaml-values.ts`, `why.ts` (the last three moved), `server/edit/writes/config/save/settings-save.ts` past line 80, `repo-save.ts` lines 1-59, `scopes/changes.ts`, `scopes/write.ts`, `scopes/save.ts`, `settings/scopes/ScopeBar.svelte`, `WorkspaceRows.svelte`, `lists.svelte.ts`, `files.ts`, `context.ts`, `state/system/machine/lsp/clangd/*`, `launch-form.ts`, `key-choice.ts`, `posted.ts`, `deck-keys.ts`, `list-entries.ts`, `cpp-write.ts` past line 116, `CppRows.svelte` past the delete rows, `GroupKeys.svelte`, `Keys.svelte`, `KeyChoice.svelte`, `LaunchEdit.svelte` past its delete, `tests/routes/write-log.ts`, `tests/checks/tree/layer-rows.ts` (compared line by line with the removed `ALLOWED` block: the only additions are the two rows and their reasons the report names), `cpp.test.ts`, `primary-key.test.ts` and `hub-scope.test.ts` past their titles. Of the tracked diff I read the merge, rows reader, `hub-names.ts`, `machine.ts`, `machine-values.ts`, `fs.ts`, the layout files, `Control.svelte`, `List.svelte`, `Origins.svelte`, `LineCounts.svelte`, `autosave.svelte.ts`, `context.ts`, `Workbench.svelte`, the account-setup and data text, `config/options/layout.yml`, the head of `config/defaults/behavior.yml` and the boundary and credentials test changes; the rest (about 120 files, among them `Settings.svelte` past line 140, `Item.svelte`, `editors/*`, `rows.ts`, `groups.ts`, `Slides.svelte`, `debug/*`, `config/options/behavior.yml`, `config/catalogs/latex` options, the History and Findings views) is not reviewed here.
- Verify 8, every new sentence against the prose rules: read only in the files listed above; the catalog words of `config/text/views/system/workbench.yml`, `server.yml` and the other text files are not read.
- The builder's git commands (`git status --porcelain -uall`, `git diff -U0 a5281619a -- tests`, `git grep` of Verify 4, `git diff --stat ... guarded.md docs/...`): not run, the reviewer runs no git command but the three; Verify 4's first grep ran as `grep -rn` over the same paths.
- Every view case (1 to 17, 21, 22, 22a, 24 to 35 in their drawing), the name question raised from the File menu while the Settings tab is not the one on screen, and the z-order of the cpp form over the palette (`Prompt.svelte` `level`): the look at landing.
- Whether a hub's whole-row replacement (case 19's `{ key: openalex, name: Renamed }` replaces oculus's row and drops its address) is what Axel means by "changes one": the vocabulary merge's rule, which the brief names, gives it; Axel's call if a field-by-field change was meant.

Reviewer usage: aeb88e56ffde106e9, claude-opus-5-5, 355591 tokens, 114 tool uses, 18 min 27 s.
