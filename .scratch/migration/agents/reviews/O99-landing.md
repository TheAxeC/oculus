# O99 landing

Position: the migration plan (`.scratch/migration/plan.md`), step O99, every setting edited in Settings through its scope, a form for every file that is no setting, and the generic service rows shipped in oculus's defaults, landed on main. In flight: none. Next: `/spec migration O101` (the Zenodo deposit) and `/spec migration O102` (the website's data files generated from oculus) side by side, by ruling 549 (b).

## Open items

None.

## Check of Steps 1

The runner's agent listing (ListAgents) showed no subagent of this session: none of O99's builder (a4c10c31eedf15f05), brief check (a5e0fbddd32b98bcf) or reviewers (aeb88e56ffde106e9, a0a0fcdd662cc3122, aade82c34310c3cf7), only two peer sessions of Axel's.

## NOT DONE

- The Hub text, the research hub's copies of the rows oculus now ships, is applied in the hub after this commit, in a hub commit of its own; its blocks are checked equal to oculus's shipped values as parsed YAML.
- Not looked at: a Save of any scope, the launch and cpp forms, the Deck section and Set as primary key, since each writes one of Axel's files; they rest on the tests and the three reviews.

## What landed

The whole range `a5281619a..migration-O99` (one wip commit 5493c61bf of the builder's work, with its cases ruling and repair rounds 1 and 2) and the fixes at landing: 229 paths, 45 added and 2 deleted, 17002 insertions and 8040 deletions.

- Settings with a scope picker: Workspace, Primary hub, Hub, This machine and Repository, each drawing the keys its file takes; a change held until Save, Cmd+S or Save All, one write of the file over its bytes and one History record.
- A control for every setting; the reader rows' nested values drawn from the `descriptions:` field records; the control word `scalar` for a reader row's constant `value`.
- This machine's `clusters:` row offering a new row the clusters of `slurm.resource` that no row holds.
- The Debug view's Edit and Delete Configuration of `launch.yml`; the cpp.yml form at the compile database item; the Slides view's Deck section; Set as primary key in the Findings view; the workspace file's primary and folder names.
- The service rows (`literature.sources`, `recover.sources`, `links`, `sign_in`, `connections.failures`) and `recover.node_download`, `clusters.key_type` and `clusters.key_file` shipped in `config/defaults/behavior.yml`, a hub's rows laid over them by row.
- The journal browser pinned on the Registries page, and a saved page given a view newly added to its arrangement.

## Fixes at landing

- `launch-form.ts` and `cpp-form.ts` draw no list or map part their typed line would not read back (an empty part, a part with a space at either end, a part holding `,`, a map key holding `=`, a cpp part that is no text); new rows and corrected titles in `tests/state/system/entry-forms.test.ts`, 16 passed. The forms are new in the step, so these rows have no run on the unchanged tree; they are judged by reading.
- `cluster-rows.ts`: the arm for a row with no hub removed; two rows of `tests/state/system/settings/cluster-rows.test.ts` call `clusterChoice` (a row of another hub's file counts, the scope's own saved row counts through its card, a row taken out in the draft is offered again), 4 passed.
- `local-save.ts` `keptAsAsked`: a `downloads` change is compared with the rows the save writes, where any list passed. Found while reading `list-entries.ts`, `local-save.ts` and `writer.ts` whole, as the review over round 1 asked; the other two read clean.
- The four rows of ruling 547 (a) in `tests/data/sources/config/layers/hub-vocab.test.ts`, cases 19, 20, 30 and 31, each failing on the base copy and passing after.
- `tests/views/system/workbench/scopes.client.test.ts` waits on a promise settled from `send` in place of a sleep loop.
- Comments: the paragraphs of `schemas/options.ts`, `value-rule.ts` and `Item.svelte` rewrapped; `scalar` named among the box controls in `typed.ts` and `draft.ts`; the service lists in the head comments of `hub-vocab.test.ts` and `cluster-rows.test.ts`.
- The report's Doc text written into `docs/HELP.md`, `docs/templates.md`, `docs/data-map.md` and `agents/guarded.md`. HELP line 599 also says the cluster pick restored in round 2. guarded.md: G1, G2, G8, G9, G13, G29, G76, G77, G96, G126 and G138; every test file and title the changed lines name is found under `tests/`; the file's 41 `.;` seams are made `;`.
- The check of edits to existing assertions made again from `git diff a5281619a -U0 -- tests` over the landed tree: 94 removed assertion lines in 15 files, each following a behaviour the step changes, none loosened.

## Verification

In the gate worktree at b1bdefe3e, `npm run diagrams && npm run docs:palette && npm run test:quick`:

```
test:quick: 229 changed file(s), from git since HEAD
test:quick: 344 test file(s)
ok      ASCII gate (1.3 s)
ok      svelte-kit sync (2.9 s)
ok      prettier (3.0 s): All matched files use Prettier code style!
ok      svelte-check (34.5 s): 1793308857519 COMPLETED 569 FILES 0 ERRORS 0 WARNINGS 0 FILES_WITH_PROBLEMS
ok      eslint (50.1 s)
ok      vitest checks (154.2 s)
ok      vitest (169.1 s)
ok      vitest slow (257.4 s)
test:quick: 260.7 s; every command passed
```

A first run over the tree before the last fixes failed prettier (`hub-vocab.test.ts`), eslint (an empty arrow in `scopes.client.test.ts`), the comment width (`cluster-rows.test.ts:5,7`), the diagrams (stale after later edits) and two load timeouts in `tests/data/hubs/hub-portfolio.test.ts`, a file the step does not change; each is fixed and the second run is green. Main: the same range cherry-picked, the gate's fixes applied as one diff of the two index trees, and `git diff --cached --binary` of main and the gate equal under `cmp` (229 files). Not covered: tests that reach no changed file within the import depth, the build, the lint of unchanged files. The verify list equals its page, the state file itself.

## The look

On 8790, read only, in a new Chrome tab:

- Settings: the scope picker; the Workspace scope with Primary hub and the folder names.
- This machine, `research-hub/.oculus/local.yml`: the Port row with its default 8790; the `clusters:` row with no entry, whose Add drew a draft row offering "Not set" and "UTwente HPC" (`utwente`, the one cluster `slurm.resource` names, drawn by its name); the draft row taken out again, "No unsaved change".
- Primary hub, `literature.sources`: the arXiv card's `type` drawn as `preprint` and its `oa` constant, a boolean in the file, as the text `true` in a box.
- Account setup, UTwente HPC: the key file filled from the shipped default, `/Users/axelfaes/.ssh/id_ed25519_utwente`.

## Agents

- Builder a4c10c31eedf15f05 (claude-opus-5-5): round 0 hand-back 182961 tokens, 47 tool uses, 6 min 33 s; round 0 after the cases ruling 323090 tokens, 2109 tool uses, 5 h 28 min 10 s; round 1 271922 tokens, 415 tool uses, 56 min 7 s; round 2 280640 tokens, 284 tool uses, 33 min 16 s.
- Brief check a5e0fbddd32b98bcf (claude-opus-5-5): 258157 tokens, 106 tool uses, 12 min 12 s.
- Reviewer aeb88e56ffde106e9 (claude-opus-5-5): 355591 tokens, 114 tool uses, 18 min 27 s.
- Reviewer over round 1 a0a0fcdd662cc3122 (claude-opus-5-5): 332257 tokens, 103 tool uses, 19 min 49 s.
- Reviewer over round 2 aade82c34310c3cf7 (claude-opus-5-5): 294967 tokens, 106 tool uses, 19 min 53 s.

The builder's first report did not pass its bar: it handed back the cases (ruled in `agents/briefs/O99-cases.md`) and open item 545; the review's findings went back in round 1; the review over round 1 found a red verify line and the base's cluster pick unbuilt, carried by round 2 (rulings 548 (a) and 550 (a)); the review over round 2 found every item holding but round 2 item 2 partial, each finding closed at landing (`agents/reviews/O99-refuter.md`, both Closed sections). No A/B: the configuration block names no bench.

## Next

`/spec migration O101` and `/spec migration O102` side by side, O102's brief naming the source of each paper's `Code:` link: the DOI when there, else `code_availability.url`.
