# O55, landing

Position: roadmap entry O55, the project boards choose their projects by kind, role and state, step 1 of 1 of its plan entry, landed on main; next: /spec O60, O63, O66 and O68.

## Open items

None.

## The check of Steps 1

TaskStop on the builder a0427a2b388f4e3d1 and the reviewers aa96d29100a7ec667 and ab4a4e18a17c03122 answered "No task found" for each, and the agent listing (ListAgents) named no subagent: all three had ended before the landing. The brief check ad41355696e11ab72 had ended at /spec.

## NOT DONE

Nothing of O55 is left undone.

## What landed, what was found

O55 landed on main from base 00bebb58, the whole range (one wip commit 2dbcf86d of the builder's work and repair round 1), 158 files, +5770 -3508 with the fixes at landing (`git cherry-pick -n 00bebb58..migration-O55` in the gate worktree `.agents/worktrees/gate`, then the same range on main, `git diff --cached --binary` of main equal under `cmp` to the gate's).

Built: every project has a `tier:` of `research`, `personal` or `software`; the `roles:` list (lead, supervisor, collaborator, other) and the user's role, the first row whose field holds `self`; six boards (Projects, Archive, Supervision, Coauthor, Personal, Software) choosing their projects by `tier`, `role`, `stages`, `chips`, `forms`, `hub` and `match`; `categories:` read by the boards, the rail and the Archival band; `cards: sections | grid`; Mine only on by default, the Lead badge and the Role facet on the boards and on every collection that declares the people fields; the Idea lane; the audit's findings for a manifest naming no lead, a project no board takes and a terminal project on a chip lane; New project only on a board whose rule takes the project it writes (ruling Z975), so Archive draws none; a reload draws the saved arrangement of the workspace the browser tab last loaded in its first draw.

Ruling 308 (a): the builder's three edit programs were accepted after the fact, and O55 landed as built.

Fixes at landing, from the review over round 1 (`agents/reviews/O55-refuter.md`, "Closed"):

- Finding 1: the sentence "When a project lies deeper than one level, the first folder under the `dir` is its category." cut from `config/defaults/sources.yml` and `config/options/sources.yml`.
- Finding 3: a change made while the reload's workspace is presumed went stale when another page saved that workspace, and the confirming answer wrote it over that page's save. `follow` in `src/lib/state/workbench/layout/saved/storage.ts` now drops the held change when another page's save is heard and runs the change again on the arrangement that save made, as a waiting change is run again. The new G29 row 'keeps the change of another page saved to the workspace the reload drew, and its own' failed on the unchanged code (`expected '{"version":7,"pages":[{"id":"main",...` to contain 'From the other page'`: the server held only 'From the reloaded tab') and passes after (`layout-workspaces.test.ts` 25 of 25).
- Finding 4: `carried`'s local `held`, which shadowed the held change, renamed `kept`.
- Finding 5: the head comment of `storage.ts` reads "writes, once, the pages of a change made before it".
- Finding 6: the comment paragraphs at `src/lib/server/edit/writes/manifest.ts:603` and `src/lib/state/boards/board/new-project.ts:6` rewrapped at 100 columns.
- Finding 7, the history-word grep over the added comments and test titles (`git diff --cached -U0 -- src tests | grep "^+" | grep -i -E "\b(before|previously|used to|no longer|formerly|originally|anymore)\b"`, the comment and title lines): 14 hits, each "before" about order within a run (a row before it in `categories:`, before the first snapshot, before the workspace answer, before a load attached the store, before a question asks), none about the code's history.
- Finding 8: a board whose rule names `hub:`, or `match:` on a field New project does not set, drew `+ new idea` before O55 and draws none after, since the project the write makes carries no hub and no such field until its form is filled. No shipped board names either key.

`agents/guarded.md`: G124 added with the text the brief gave and one sentence for ruling Z975's New project rows, its Code and Test lines naming `tests/state/boards/board/board-rules.test.ts`; G29's text names the reload's first draw and the change saved at the answer, and its row list holds the six rows of 'the workspace answer'.

The hub rewrite, with automode choice Z976 for the people no ruling named (`plan.md` Rulings, `choices.md`): hub commit f4ef3afb5, 121 files. Every research manifest that read `tier: projects`, `coauthor` or `archive` reads `research`, FL4E `software`; the chips `lead` and `coauthor` gone, and `parked` from FedBTD (stopped); every manifest names a lead: axel-faes on the 27 personal and software manifests that had none, pirmani on FL4E with peeters and axel-faes as collaborators, valentina-pergher and axel-faes on ERP Signatures; axel-faes is collaborator on each project whose `coauthor` chip went and supervisor on BTTR-AF, BSA-ECoG, Cirrhosis-CR and ECG-Repr; applications, funding, education, events and tasks declare `lead` (required), `collaborators` and `supervisors`, each of their 67 entries names its people, and the 15 Role rows of funding and education are folded into those fields; `new_project_dir` is keyed by `research`; the deck takes `tiers: [research]`; the scan comments, the category sentence and the README's tier table were corrected. The workspace repositories' manifests are committed in their own repositories (cathedra 633b250f, game-engine 75ef561, ordo 87880ba, scotoma 051b42f, officium 42cad59, youtube-downloader a495217, theaxec.github.io 0764888), oculus's own `.oculus/project.yml` in this landing's commit. Before it was applied, over a scratch copy of the hub with the gate's code: `OCULUS_TEST_HUB=<copy> node tests/data/real-hub.probe.ts` gave 0 findings in every source (the live hub before the rewrite, read by the same code: 159 snapshot findings); `tests/checks/config/integrity.test.ts` and `config-folder.test.ts` 45 of 45 passed; every manifest names a lead, no manifest carries `lead` or `coauthor` as a chip, and no terminal project carries `parked` or `blocked`. Each live file was then equal under `cmp` to the checked copy.

Host- and user-visible changes, with the before and after, are the builder's report's (`agents/reviews/O55-report.md`, "Host- and user-visible changes"), with finding 8 above and finding 3's: before, a change made right after a reload could overwrite another window's save of the same workspace; after, both changes are kept.

## Verification

In the gate, after the fixes: `npm run diagrams && npm run test:quick`: ASCII gate, svelte-kit sync, prettier, svelte-check (538 files, 0 errors, 0 warnings), eslint, vitest checks, vitest and vitest slow ok, `test:quick: 285.7 s; every command passed`, exit 0. Not covered: tests that reach no changed file within the import depth, the build, the lint of unchanged files. The verify list was not changed. A/B: none, `bench: []`.

## The look

Axel's server on 8790 had run from 2026-10-23 17:51 (`ps`) and still built its projects with the code before the landing, so its rail threw `project.supervisors is not iterable`; the code on main always fills `supervisors` (`src/lib/data/snapshot/normalise.ts:283`). The look was first taken on a scratch server on 8797 (the gate's code, a scratch HOME, the rewritten hub copy): the tabs Projects 47, Supervision 4, Coauthor 16, Archive 26, Personal 24, Software 4; the sections ('in review 7' on Projects); the Lead badge; Mine only; `+ new idea` on Projects, Supervision, Coauthor, Personal and Software and none on Archive; Supervision holding BTTR-AF, BSA-ECoG, Cirrhosis-CR and ECG-Repr; Coauthor's Filter with the Category facet and the Role facet (Lead 0, Supervisor 0, Collaborator 16, Other 0); FL4E on Software with no Lead badge; the Funding collection with the Lead badge, Mine only and the Role facet (Lead 10, Supervisor 0, Collaborator 1, Other 0). The scratch server was stopped (`lsof` on 8797: nothing listening). After Axel restarted 8790, on TEST: the Archive tab with 26 projects in sections ('publications 10'), the Lead badge, Mine only and no `+ new idea`; a reload drew TEST's arrangement, with no default arrangement first in the captures.

## Agents

Builder a0427a2b388f4e3d1, claude-opus-5-5, 322681 tokens, 718 tool uses, 1 h 50 min 28 s; round 1 219652 tokens, 127 tool uses, 21 min 33 s. Brief check ad41355696e11ab72, claude-opus-5-5, 262016 tokens, 93 tool uses, 13 min 18 s. Reviewer aa96d29100a7ec667, claude-opus-5-5, 234310 tokens, 102 tool uses, 15 min 11 s, findings: spec 0, proof 3, standards 2, behaviour 4. Reviewer over round 1 ab4a4e18a17c03122, claude-opus-5-5, 227015 tokens, 61 tool uses, 11 min 16 s, findings: spec 1, proof 1, standards 4, behaviour 2. The builder's first report did not pass its bar (the repair round); the fixes at landing are listed above.

## Next

/spec O60 (each part of `config/` overridden where it belongs), O63 (the audit's hub conventions as hub settings), O66 (the Gallery shows every word) and O68 (the Focus lane card marks), O60's brief carrying the note that the `PEOPLE` map of `takes.ts` reads only `lead`, `collaborators` and `supervisors`.
