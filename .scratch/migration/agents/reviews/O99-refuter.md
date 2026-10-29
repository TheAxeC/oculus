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

## Repair round 1, refuted

The rules file (`.scratch/migration/agents/spec.md`) names no output filter, so every command below ran unfiltered. All ran from the worktree root `/Users/axelfaes/workspace/oculus/.agents/worktrees/migration-O99` with `PATH=$HOME/.nvm/versions/node/v24.21.0/bin:$PATH`, in the foreground, with no other vitest or svelte-check running (`ps -Ao pid,etime,command | grep -E 'vitest|svelte-check|test:quick'` printed nothing). The harness moved the Verify 1 run to the background after 180 s. I waited for its completion notice and did not poll it. Its first lines (the changed-file and test-file counts) were cut off by my own `tail -60` and are not quoted.

Round delta: I compared every path of `migration-O99-round-1/files.txt` (git status format, first 3 columns cut) with `cmp` and `diff -u`. Changed since the snapshot: `config/defaults/behavior.yml`, `docs/diagrams/{layer-state,layer-views,layers,writes}.{dot,svg}`, `src/lib/state/sessions/source/autosave.svelte.ts`, `src/lib/state/system/config/editors/{draft,fields,slots}.ts`, `src/lib/views/system/workbench/editors/FieldControl.svelte`, `tests/server/core/reader/rows.yml` (back to the base), `tests/state/system/config/sparse-card.test.ts`, `src/lib/server/edit/writes/config/save/local-save.ts`, `src/lib/state/system/machine/debug/launch-form.ts`, `src/lib/state/system/machine/lsp/clangd/cpp-form.ts`, `src/lib/views/system/workbench/settings/scopes/scopes.svelte.ts`, and the tests `primary-key`, `config-save`, `settings-secrets`, `cpp` and `entry-forms`. Changed now but not in `files.txt`: `config/options/catalogs/agents.yml`, `src/routes/+page.svelte`, `src/lib/state/system/config/editors/offers.ts` (new), `tests/state/sessions/autosave.client.test.ts`, `tests/state/system/settings/collection-fields.test.ts`, `tests/state/system/settings/theme-groups.test.ts` and `tests/views/system/workbench/scopes.client.test.ts` (new).

```
Verify 1
$ npm run diagrams && npm run docs:palette && npm run test:quick -- --base a5281619a 2>&1 | tail -60; echo exit=${pipestatus[1]} $?
ok      svelte-kit sync (2.5 s)
ok      ASCII gate (2.8 s)
ok      prettier (3.7 s): All matched files use Prettier code style!
ok      svelte-check (42.4 s): 1793302730075 COMPLETED 568 FILES 0 ERRORS 0 WARNINGS 0 FILES_WITH_PROBLEMS
ok      eslint (56.2 s)
FAILED  vitest checks (128.0 s)
 FAIL  |unit| tests/checks/config/config-folder.test.ts > oculus's own config directory > passes every config file through the schema it is matched to
+   "defaults/behavior.yml:765 literature.sources[5].fields.oa does not fit the schema of this file",
 <heavy right-pointing angle quotation mark ornament> tests/checks/config/config-folder.test.ts:683:26          (the <heavy right-pointing angle> glyph is vitest's)
 Test Files  1 failed | 14 passed (15)
      Tests  1 failed | 252 passed | 9 skipped (262)
ok      vitest (169.9 s): Duration  161.03s (transform 153.47s, setup 0ms, import 305.10s, tests 291.39s, environment 17.83s)
ok      vitest slow (244.9 s): Duration  236.12s (transform 16.69s, setup 0ms, import 135.80s, tests 798.80s, environment 18ms)
test:quick: 248.0 s; failed: vitest checks
test:quick: not covered: tests that reach no changed file within the import depth, other than the checks under tests/checks/source and tests/checks/tree, which run for any change under src, tests or utils; the build, the lint of unchanged files
(md5 of git status --short: ab9f6143976add27a6bb4a470bf587dc before and after)

The red line, alone (a file the step changes):
$ npx vitest run tests/checks/config/config-folder.test.ts --reporter=dot
 Test Files  1 failed (1)
      Tests  1 failed | 27 passed | 2 skipped (30)
(the same assertion at config-folder.test.ts:683:26)

Verify 2 (the 220 files git status lists, untracked folders expanded, deleted paths and secret local.yml files left out; config/options/local.yml included):
$ files | tr '\n' '\0' | xargs -0 env LC_ALL=C perl -ne '...as the brief gives it...'; echo verify2 exit=$?
verify2 exit=0          (nothing printed)

Verify 3: .agents/worktrees/O99-base/unused-exports.txt is gone
$ ls ../O99-base/unused-exports.txt
ls: ../O99-base/unused-exports.txt: No such file or directory
$ sh utils/unused-exports.sh | grep -n "Unused\|...the changed modules..."
1:Unused exports (228)
41:src/lib/server/core/files/yaml/yaml-edit.ts: BLOCK_LISTS, pathOf, renameKey
178:src/lib/state/system/config/groups.ts: FILES
230:Unused exported types (109)
315:src/lib/state/system/config/editors/fields.ts: Scalar
(round 0, by the first review: 228 and 108. Each line naming a file the step changes was checked against git show a5281619a:<file>. The only names missing there are the moved yaml-edit.ts, a known round-0 line, and fields.ts: Scalar, which is new in round 1:
 chk src/lib/state/system/config/editors/fields.ts Scalar -> base:0; grep -rn "Scalar\b" src tests outside fields.ts finds only yaml's own Scalar type.)

Verify 4 (the first grep run as grep -rn, since git grep is not a command I may run):
$ grep -rn "EditLink\|settings_machine_edit_in\|settings_machine_edit_tip" src config tests --exclude=local.yml; echo $?
v4a exit=1
$ grep -n "EditLink\|..." config/options/local.yml   -> v4a-local exit=1
$ grep -n "ships none\|ships neither" config/defaults/behavior.yml src/lib/data/sources/config/settings/rows/read.ts   -> v4b exit=1
$ grep -nE "Empty makes no key|Empty tells no failure apart|Empty downloads nothing|says no source is configured" config/options/behavior.yml   -> v4c exit=1

Verify 6:
$ wc -l <changed src/tests/utils .ts/.svelte>, with any .svelte over 520 or source over 880 printed: (nothing)
  520 FieldControl.svelte / 520 Palette.svelte / 519 Settings.svelte; 871 model/index.ts / 869 writes.svelte.ts / 867 catalog/options.ts
$ sh utils/folder-check.sh; echo $?
folder exit=0

Verify 7 (the + lines of the round's delta and offers.ts / scopes.client.test.ts grepped for the history words, a package id, a date, "round"):
hits are only identifiers or run-time order: settings-secrets.test.ts `const before = textOf(...)`, entry-forms.test.ts `'before'` (a launch field key), scopes.client.test.ts `ScopeGround`/`GROUND`, offers.ts "before it is sent" and "still loading". No history.

The builder's round-1 evidence, rerun:
$ npx vitest run <settings-secrets, config-save, cpp, primary-key, debug, entry-forms, autosave.client, scopes.client, sparse-card, collection-fields, theme-groups, comment-width> --reporter=verbose
  every round-1 row passes (the G1/G2 rows of cpp and primary-key, "the History record holds no secret", "the undo of a save of the port and a secret ...", 'writes an existing local.yml at mode 644 ...', the two G77 rows, the three scopes.client rows, the six entry-forms separator rows, the three constant-value rows)
 Test Files  12 passed (12)
      Tests  147 passed (147)
$ git diff a5281619a --stat -- tests/server/core/reader/rows.yml      -> prints nothing
Hub text (the hub's .oculus/config.yml, 760 lines; read with sed -n, no local.yml):
$ diff <(sed -n '95,100p' hub | sed 's/^    - //') <(sed -n '87,92p' config/defaults/behavior.yml | sed 's/^ *- //')
  2,3c2,3 and 6c6 only (Unknown host, No route to the cluster, Git key refused), as the report says
$ diff -w (comments and blanks left out) hub 104-128 vs defaults 96-121, hub 132-324 vs 124-317, hub 335-710 vs 479-854, hub 753-760 vs 868-878
  same / same / same / same
  each range end read: 87 comment, 88-90 clusters, 91 blank, 92 comment kept, 101 blank, 102 comment, 103-128 sign_in, 129 blank, 130 comment, 131-324 recover, 325 blank, 333 literature:, 334-710 sources, 711 prefer:, 716-750 venues, 751 blank, 752-760 links
Item 12's program: the quoted source equals o99notes/r1/o99-cases.test.ts.source (diff prints nothing) and the quoted output equals item12-out.txt (336 lines, diff prints nothing); ls tests/o99* finds none. I did not rerun it: that would need a file written into the worktree's tests/.
Item 13's table: jq over o99notes/base-batch.json gives the same failed/total and "Cannot find module" lines per file.
Item 15's checks: ls $TMPDIR | grep -c o99-case -> 0; ls .agents/worktrees/ -> gate, migration-O99, migration-O99-round-1; the scratchpad holds no o99base, o99tools or o99probe (caserun/ holds files dated 2026-10-27, before O99).
```

### Verdicts

Items of the brief's "What to build", for the whole diff since the base:

- 1: holds. The round did not touch the scope code. The first review read `scope.ts`, `scopes/rows.ts` and `scopes.svelte.ts`, and `hub-scope`, `machine-section` and `row-writer` pass in my Verify 1 vitest tier.
- 2: holds. The File menu's Save All is `saveJoined` (`autosave.svelte.ts:177`, `src/routes/+page.svelte:359`), an app's `saveAll` stays `saveEvery` (`context.ts:734`), and the two G77 rows are green.
- 3: holds. `local-save.ts:313` records `undo: 'field'` and `undoLocal`/`unmasked` keep the stored secret. The five `settings-secrets` rows are green. The `agents` `lists` are now described (`config/options/catalogs/agents.yml`), and the case-9 output reads "values kept as the file has them: []". Verify 4 exits 1.
- 4: violated, Spec 1 (the record `reader_value` describes `value` as a text, the shipped `oa: { value: true }` is a flag, and Verify 1 is red).
- 5: holds. Debug, cpp and entry-forms are green, and the separator guard is in. The remaining loss of whitespace or empty parts is Behaviour 1.
- 6: holds by reading `LineCounts.svelte`. The round did not change it, and the look settles it.
- 7: holds. The shipped rows equal the hub's except the three failure rows the hub keeps (my diff), `ROW_SHAPES` is at `in-place.ts:133-139`, and Verify 4 (b) and (c) exit 1. The Hub text ranges reproduce. The merge test rows are landing work under ruling 547 (a).
- 8: holds. The round did not change it, and the case program's output for cases 21, 22, 22a and 35 agrees.

Cases of the brief's "Cases" (as ruled in `O99-cases.md`):

- 1: met, `config-save.test.ts` row 'two options of the workspace file', and the reading. The press is the look.
- 2: met, by `takes` and the `config-save` row "an option of the primary's settings file".
- 3: met by reading `fileOf`; the look.
- 4: met by reading `hubsOf` and `reposOf`; the look.
- 5: met by reading `ask`, `named` and `resume`; the look.
- 6: met by reading `saveAll` and `save`, with the one-record rows. The File menu path now goes through `saveJoined`. The press is the look.
- 7: met, the `config-save` port row and the five `settings-secrets` rows, the undo row among them.
- 8: met by reading `saveLocal` and `saveRepo`, and the 'writes $row' table (a made `local.yml` at 600, named in `.gitignore`).
- 9: met by the quoted case program's output (235 options drawn in some scope, 21 of 21 `LOCAL_KEYS`, no record or list on a one-value control, nothing kept, no NO EDITOR row). I read the program; I did not rerun it (Declined). The Hub scope of a second hub is not in it.
- 10: met, the case-10 output ("no empty editor: ["layout.yml:rail"]", the rail drawn by `RailEditor`).
- 11: met, the case-11 output (`settings_mismatch_list` for a list held as a map, `settings_undrawn` for a family held as 7).
- 12: met, `sparse-card` "a reader row's values at any depth ...", every row green with the shipped boolean `oa`.
- 13: met, the `debug.test.ts` edit and delete rows green.
- 14: met, `cpp.test.ts` green.
- 15: met, `deck-slides` "writing a deck's keys" green.
- 16: met, the four `primary-key.test.ts` rows and its choices row green.
- 17: not verifiable here; it is a drawing, settled by the look at the narrowest and widest pane.
- 18: met, the row comparison above, `connection-keys` green, `ed25519` and `~/.ssh/id_{type}_{resource}`.
- 19, 20, 30, 31: met by reading `ROW_SHAPES` and `in-place.ts`, and by the first review's probe (not rerun by me). The test rows are written at landing under ruling 547 (a), so their absence is no finding.
- 21, 22, 22a, 35: met, the case program's output lines for cases 21, 22, 22a and 35.
- 23: met, Verify 4 (b) exits 1.
- 24: met, the `settings-secrets` row 'a row sent with no secret'.
- 25, 26: met by reading `fileOf` and the changes keyed by hub name.
- 27: met, the four `config-save` folder-name rows.
- 28: met, the `config-save` digest refusal row.
- 29: met, the `machine-section` and `hub-scope` rows green.
- 32, 33: met by reading `saveAll`/`resume` and `saveTarget`/`scopeGone`; the look.
- 34: met under the corrected premise (Repository draws `editor.languages` alone).
- 36: met, the G29 row green.

Items of the round-1 brief:

- 1: holds. `local-save.ts:313`, `undoLocal`/`unmasked` (`local-save.ts:333-360`), the row at `settings-secrets.test.ts:82` green, and its before-failure quoted (`item1-before.txt`, expected 404 to be 200).
- 2: holds. The premise did not reproduce: `writeTextAtomic(path, content, newMode)` gives `newMode` only to a new file (`src/lib/server/core/json.ts:89-92`). The two mode rows pass after the change (my run), and the head comment and the G8 Doc text say so.
- 3: holds. Both refusal rows are green. The handlers already called `tokenedBody`, `repositoryOf` and `hubFor`, so the rows test a behaviour the round keeps; their passing run after the change is mine. The G1 and G2 Doc text is present.
- 4: holds. `saveJoined` is split from `saveEvery`. The rows fail before the change (`item4-before.txt`) and pass now, and the G77 Doc text is present.
- 5: holds. `joined` stands above `saveEvery`'s doc comment, and the comment states what it does now.
- 6: holds. The Doc text's line 344 reads "Each heading has Show Defaults, ...".
- 7: holds. The G8 Doc text names `launchForm`, `launchChanges`, `cppFields` and `cppChanges` and the describe 'the changes an entry form sends'.
- 8: holds. The ranges reproduce, the three hub rows are kept, and comments 87, 102 and 130 go with their blocks while 92 stays.
- 9: partial. The shipped `oa: { value: true }` is in and the card draws it (Spec 1, Spec 2).
- 10: holds for the separator. The launch rows have no before-run (Proof 2), and whitespace or empty parts are still lost (Behaviour 1).
- 11: holds. `sentSecrets` and `typed` restaged (`scopes.svelte.ts:186-200`), the row's before-failure quoted, 3 of 3 green.
- 12: holds. The source and output are quoted whole and equal the notes, and the program is deleted. The report's "run once" is Proof 1.
- 13: holds. Three runs are named with their times and results, and the base lines equal `base-batch.json`.
- 14: partial. The Port and `sign_in`/`connections.failures` before-and-after statements are given, but the base's cluster offer was not built (Spec 3).
- 15: partial. The commands and files are listed but not their hunks, and the orchestrator's base copy was deleted (Spec 4).

### 1. Spec

- **Spec 1.** `config/defaults/behavior.yml:765` `oa: { value: true }`, with `config/options/behavior.yml:1314-1322` (`reader_value` ... `value: a fixed value, with holes`, a text) and `src/lib/data/sources/config/catalog/schemas/options.ts:81-87` (`textSchema`, `{ type: 'string' }`).
  - What is wrong: the described record of a reader row says its constant is a text, while the row oculus ships holds a flag. Verify 1 is red on `defaults/behavior.yml:765 literature.sources[5].fields.oa does not fit the schema of this file`, and my run of that file alone reproduces it.
  - On point (1), no existing word or mechanism fits a constant that may be a text, a number or a flag:
    - `CONTROLS` (`src/lib/data/shapes/catalog-words.ts:13-31`) has no such control.
    - `HOLDS` (`:40`) has `lists` and `record` only.
    - `OWN_READER` (`schemas/options.ts`, "A text field of such a family takes any value") is a hard-coded list of the two layout-tree families `arrangements` and `workbench`. Adding a description record to it would hard-code a vocabulary name and make the field take any value, records included.
    - The pairs rule `scalar()` (`catalog/value-rule.ts:257-262,271-273`) applies only to the values of a key/value family, inside the value rule; its JSON schema (`familySchema`, `fieldSchema(fields.value)`) still says string.
  - So a new catalog word is needed. That is a config vocabulary nothing names, so it is Axel's open item. The builder named it correctly and did not take it on its own.
  - Option (b), shipping the text `'true'`, is the lazy option and contradicts round item 9.
  - My judgment is option (a), a control word for a scalar value given to `reader_value`'s `value`. The same word should also scope the card's scalar reading of Spec 2 to that word, which closes Spec 2 in the same change.
  - Failure scenario: at landing the gate's Verify 1 is red on `config-folder.test.ts:683`, and the editor marks oculus's own `defaults/behavior.yml:765` as not fitting its schema.
  - Verdict: item 4 violated, round item 9 partial.
- **Spec 2.** `src/lib/state/system/config/editors/fields.ts:301-305` (`case 'text': ... if (typeof held === 'boolean') return scalarText(held); if (typeof held === 'number' && Number.isFinite(held)) return scalarText(held);`) and `fields.ts:692-693` (`const made = control === 'text' ? scalarOf(held, reading) : held; if (typeof made !== 'string') return done(made);`).
  - What is wrong: round item 9 asked that "the card of a constant `value`" be drawn whatever its scalar type. The change reads and writes every `text` field of every family card, pairs values included (`draft.ts:215,531,684`), so it reaches beyond item 9.
    - A flag or number a text field holds used to be kept as the file has it, with the row's kept-value sentence. It is now drawn as editable text and written back in the held type whenever the typed text reads as that type.
    - On that path `valueProblem` and the field's `form` check are skipped (`return done(made)` comes before `troubleOf(valueProblem(...))`).
    - The G138 Doc text describes only "a constant `value`", so the guarded entry would understate what the code does. The host-visible changes section does not state the wider change.
  - Failure scenario: a hub row holds an unquoted number at a text field, such as a `sign_in` row's text field written `42`. The reader types `042`, `decimalOf` reads it as 42 (`DECIMAL`, `fields.ts:85`), and the save writes the number 42, so the leading zero the reader typed is lost and no form check ran.
  - Verdict: round item 9 partial.
- **Spec 3.** The report's item 14: "A new row's `resource` is a choice `from: clusters` (`config/options/local.yml:22-25`), which offers every cluster entry of the resources registry ... Offering exactly the clusters of `slurm.resource` with no row needs a source word the catalog does not have ... so it is not built".
  - What is wrong: round item 14 asked, if the family editor does not offer the base's choice, to "give the row's `resource` field the choice of those clusters, as the base offered them". That choice is not built.
  - On point (3), the stated reason holds only for the catalog route. The `clusters` source is every cluster-kind resource (`editors/sources.ts:190-193`), and `slurm.resource` draws from the same source (`config/options/behavior.yml:203`), so narrowing that source would break `slurm.resource`'s own choice. No choice in a card leaves out a value a sibling row holds (`offers.ts` `poolOf`).
  - The Settings view already draws special rows through `settings/other-rows/` (on the base `ClusterRows.svelte` drew exactly this pick; `WallpaperPicker.svelte` and `AppControl.svelte` are there now). That mechanism offers the base's choice without a new catalog word, so the choice could have been built without one.
  - Failure scenario: in This machine of the primary, the reader adds a `clusters:` row and picks a cluster that already has a row, which gives the finding "a second row for one cluster" (the catalog help, `config/options/local.yml:20`). The reader can also pick a cluster `slurm.resource` does not name. The base's pick offered neither.
  - The report's first line ("Every other item of the round is done") does not name this.
  - Verdict: round item 14 partial.
- **Spec 4.** The report's item 15: "Their hunks cannot be told apart in the diff from later Edit hunks over the same files" and "Round 0, the base copies `.agents/worktrees/O99-base` (under the main checkout's `.agents/`, outside the worktree, which the rules forbid) ...: both are deleted."
  - Hunks: round item 15 asked for "the hunks it made in the worktree", and none are given. Under the ruling "Unapproved builder scripts" the orchestrator must then read every file "Shell edits" lists whole.
  - The base copy: the orchestrator made `O99-base` at launch (`orchestrator-state.md:723`, "the base copy `O99-base` are made"), and the brief names it as the step's given base copy (`O99.md:11`, Verify 3 at `:158`). The report calls it the builder's own copy, outside the worktree. Item 15 asked for it to be listed, not removed. Deleting it removed `unused-exports.txt`, so the brief's Verify 3 can no longer run as written. The builder had also, by its own account, written the step's tests into it in round 0.
  - The report's first line does not name the missing hunks.
  - Failure scenario: at landing, Verify 3 has no base list, so a new unused export (Standards 1) passes unless someone finds it by hand, as this review did. The heredoc-written files of `list-entries.ts`, `local-save.ts` and `writer.ts` are kept without the read the ruling asks for, unless the orchestrator reads each file whole.
  - Verdict: round item 15 partial.

### 2. Proof

- **Proof 1.** The report's item 12: "The program `tests/o99-cases.test.ts` was written with Write, run once with `OUT=... npx vitest run tests/o99-cases.test.ts`", and item 15: "Round 1, the case-run program of item 12: written with Write, run once".
  - The claim: one run.
  - What the rerun showed: the notes hold two runs. `o99notes/r1/item12-cases.txt` (Start at 20:03:19, `Tests 1 failed | 3 passed (4)`, case 11 printing through stdout `lint.writing_skip held {"not":"a list"}: null`) was an earlier version of the program. `item12-run.txt` (Start at 20:04:59, 4 passed) is the quoted one. The report also says "Its first run found `catalogs/agents.yml:agents[0].lists` kept as the file has it", which is a run no file quotes.
  - The decision resting on it: the `config/options/catalogs/agents.yml` change and the case-9 verdict rest on the quoted last version alone, and the earlier versions' sources and outputs are not quoted.
  - Failure scenario: the orchestrator books one program run and reads the agents.yml change as the product of the quoted run, when it came from an unquoted one.
  - Verdict: none.
- **Proof 2.** `tests/state/system/entry-forms.test.ts:102-122` (point (2)): "draws no launch attribute whose %s holds the separator, and sends nothing for it".
  - What is wrong: these four rows of a behaviour the round changes have no failure quoted from before the change; they were written after `launch-form.ts` changed. That `launch-form.ts` is new in the step does not excuse this: the round's unchanged tree is the snapshot, which holds the round-0 file.
  - Judged by reading: the snapshot's `launch-form.ts` draws a list when every part is a string and a map when every value is a string (`wordMap`). So in all four rows both `list` and `words` would be drawn, and the keys assertion would fail there.
  - By the rules no further run on the unchanged tree is asked. The builder states the gap in its first line.
  - Failure scenario: none beyond the missing record, since the reading shows the rows check the new behaviour.
  - Verdict: none.

### 3. Standards

- **Standards 1.** `src/lib/state/system/config/editors/fields.ts:74`: "export type Scalar = 'boolean' | 'number';".
  - What is wrong: a new export with no importer outside its file (`sh utils/unused-exports.sh` prints "src/lib/state/system/config/editors/fields.ts: Scalar", and the base file holds no `Scalar`). This breaks the rules file's "The principles every package is judged on", which says an export the step adds with no importer is removed or made local, and the brief's Verify 3 ("no new unused export"). The round report ran no Verify 3.
  - Failure scenario: the gate's unused-exports list grows by one line that no step owns.
- **Standards 2.** `tests/views/system/workbench/scopes.client.test.ts:44-46`: "while (answers.length === 0) await new Promise((next) => setTimeout(next, 0));".
  - What is wrong: the rules file ("What every package obeys") says a test waits on a signal (an event, a promise, a fake clock), never on a fixed sleep. This is a sleep loop polling a condition. A promise resolved from `send` is the signal that exists here.
  - Failure scenario: a change that makes the Save never call `send` leaves the test spinning to vitest's 5 s timeout instead of failing at once.
- **Standards 3.** `tests/state/system/entry-forms.test.ts:102-108`: the title "draws no launch attribute whose %s holds the separator, and sends nothing for it" with the names 'a list part' and 'a map key that holds ='.
  - What is wrong: the titles print as "whose a list part holds the separator" and "whose a map key that holds = holds the separator", which breaks the brief's Verify 8 (each new sentence read against the prose rules).
  - Failure scenario: a reader of a failing run cannot parse which input the row names.
- **Standards 4.** The report's "Doc text", the bullet "G126 (proposal for the orchestrator to raise; nothing written)", which would add rows "for cases 18, 19, 20, 30 and 31", and "Anything in the brief that was wrong or impossible", which says such a row "is a new entry and Axel's".
  - What is wrong: ruling 547 (a) has ruled. G126 is widened, and its Test line names the rows for cases 19, 20, 30 and 31. The Doc text the landing writes from still calls this a proposal and names case 18 too. The round brief told the builder not to write the rows; it did not ask it to keep the ruled entry's text stale.
  - Failure scenario: the orchestrator copies the G126 Test line with case 18, which G136's 'case 15' row already holds.

### 4. Behaviour

- **Behaviour 1.** `src/lib/state/system/machine/debug/launch-form.ts:35-58,145-163` (`partsList`, `partsMap`, `answerValue`: `.split(PARTS).map((one) => one.trim()).filter((one) => one !== '')`) and `src/lib/state/system/machine/lsp/clangd/cpp-form.ts:51-62,89-93` (`drawnTags` takes a number or a flag and draws it as `String(one)`).
  - What a user sees change: a list or map that the form's line does not read back is still drawn and rewritten once its field is edited. Examples are a part that is empty or has leading or trailing spaces (`args: ['--prefix', '']`, `env: { X: ' padded' }`), and in cpp.yml a `tags` part that is a number or a flag, which comes back as a text. The head comment's reason ("since its line would not read back as the value") covers these, but the guard lists only the separator.
  - Where the report should have stated it: item 10's section.
  - Failure scenario: in the Debug view the reader edits that configuration's `args` to add `--verbose`, and the save writes `['--prefix', '--verbose']`, dropping the empty argument the program needed.
  - The fix is small and inside round item 10, so it can be made at landing.
  - Verdict: none.

### Declined to judge

- Verify 3 against the base list: the base copy and its `unused-exports.txt` are gone (Spec 4). I compared with base facts readable by `git show a5281619a:<path>` for every line of a file the step changes, and the counts with the first review's round-0 figures. A full line-by-line comparison with the base list would need `sh utils/unused-exports.sh` run on a checkout of `a5281619a`, which is a git command I may not run.
- Rerunning item 12's case program: it needs `tests/o99-cases.test.ts` written into the worktree, and I write no file. I compared its quoted source and output with the notes instead (both equal).
- When and by whom `.agents/worktrees/O99-base` was removed is taken from the report and the state file. The file system's record is not read here, and no git command would settle it.
- The red line's cause outside oculus's own files: whether a hub's `config.yml` holding `oa: { value: true }` (the research hub's, on the base too) gets the same schema mismatch in the editor. The base had it before the step, and no run over a hub's `config.yml` was made.
- Items 2 and 3 of the round (point (4)): their rows test behaviour the round keeps. Their passing run after the change is mine. The builder's "pass before" is not quoted, and I cannot run it on the round-0 tree without writing a file.
- The edits to round-0 assertions (point (5)) were read and hold. Removing `expect(change.undo).toBe('none')` at `settings-secrets.test.ts:72` follows round item 1. Adding `saved: false` to the NESTED row (`sparse-card.test.ts:420`) and `one.saved ?? one.value` follows the shipped flag of item 9. `rows.yml` is back to the base. None loosens a check.
- The path widenings (point (6)): all of them except `src/routes/+page.svelte` fall inside the brief's write list: `src/lib/state/system/config/` (`offers.ts`, `draft.ts`, `slots.ts`), `config/defaults/behavior.yml`, `config/options/` with `catalogs/`, and `tests/`. The `offers.ts` split is forced by the size rule (`fields.ts` 863 in the snapshot, 757 now, and the moved functions equal their old text by diff). `+page.svelte` is where the File menu's Save All prop is passed, so round item 4 needs it. I find nothing to judge against there.
- The views' cases (1 to 17, 21, 22, 22a, 24 to 35) in their drawing, the Settings card of a number- or flag-held text field (Spec 2), and the cluster pick (Spec 3): the look at landing.
- `config/options/local.yml`: I read lines 15-35 only, by its path.
- The files the first review declined and the round did not change remain unread here.

Reviewer usage: a0a0fcdd662cc3122, claude-opus-5-5, 332257 tokens, 103 tool uses, 19 min 49 s.

## Closed

The dispositions of the findings of the run over repair round 1, which are never sent to the builder.

- Spec 1 (the red verify line, the constant of `reader_value`): raised as open item 548.
- Spec 2 (the scalar reading of every `text` box): closed by the fix of open item 548 (a), which scopes that reading to the new control word; raised with 548.
- Spec 3 (the base's cluster pick not built): raised as open item 550, one more round under the exception for an unbuilt acceptance item.
- Spec 4 (the hunks of the shell edits; the base copy deleted): at landing the orchestrator reads `list-entries.ts`, `local-save.ts` and `writer.ts` whole under the ruling "Unapproved builder scripts", and makes the base list of Verify 3 again from `git archive a5281619a` in the scratchpad.
- Proof 1 (two runs of the case program, one quoted): booked at landing; the `config/options/catalogs/agents.yml` change is judged by the orchestrator's reading.
- Proof 2 (the four launch rows with no before-failure): no change; the reading shows the rows check the new behaviour; booked at landing.
- Standards 1 (`Scalar` exported with no importer): fixed at landing.
- Standards 2 (the sleep loop in `scopes.client.test.ts`): fixed at landing, the test waiting on a promise resolved from `send`.
- Standards 3 (the titles of the separator rows): fixed at landing.
- Standards 4 (the G126 Doc text): fixed at landing to ruling 547 (a), the rows of cases 19, 20, 30 and 31.
- Behaviour 1 (empty or padded parts, and number or flag `tags` parts, still drawn): fixed at landing, the guard of `launch-form.ts` and `cpp-form.ts` extended to every part its line would not read back.
