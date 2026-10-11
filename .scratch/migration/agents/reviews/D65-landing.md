# D65 landing: one kind of project

Position: the oculus migration plan; D65, one kind of project, landed. Nothing in flight. The loop is paused at Axel's word ("Please pause once these 2 steps are landed", D62 and D65); on his go, D63 (apps in the shell), then D64, Q72 and O33.

## Open items

- Open item 52: the six repository manifests outside the hub are not rewritten. D65's brief has the orchestrator rewrite `~/workspace/{cathedra,game-engine,ordo,scotoma,officium,youtube-downloader}/.oculus/project.yml` at landing to the shape of ruling 47 (G): each `status: <word>` line becomes `type: active`, `tier: personal` and `status:` with `chips: [<chip>]`, the chips cathedra `paused`, game-engine (Missal) `paused`, ordo `building`, scotoma `paused`, officium `running`, youtube-downloader `finished`. The runner's permission check refused the write as a change to shared resources outside this repository. Until they are rewritten, each of the six is two findings ("key tier is required", "key type is required") and on no board. game-engine's manifest also holds an uncommitted change of Axel's (`waiting-on: "cathedra"` to `waiting-on: [cathedra]`). Options: (a) Axel allows the write and the orchestrator rewrites and commits each in its repository, game-engine's together with his change (recommended); (b) Axel edits the six lines himself; (c) leave them, the six off the boards (the lazy option).

## The check before the landing

The runner's agent listing (ListAgents) shows no agent of the step: the builder a0206ba4b2a7a65d7 was stopped with TaskStop after round 1, the brief check ac3dad5f32f862a13 and the reviewers a6b133f897aac2f1a and ac6277e62a30bdbbd had finished. The one other entry is the peer session ordo-ed, idle.

## NOT DONE

- The six repository manifests outside the hub (open item 52).
- Not looked at: the Focus lanes with a personal project, the dark theme, the Edit Manifest form.

## What landed

Personal projects are projects of the tier `personal`, read, written, drawn and audited by the research code; the side-project record, reader, schema, form, status list and Personal board component are removed. Every manifest carries `tier` and `type`, under one schema for every tier; `status` is the `{ chips, line }` map from one `status_legend` that gains `building`, `running`, `finished` and `paused` (`parked` renamed). `active` and `manuscript` are one stage. `scan:` is a list of folders walked to any depth; a `roots:` entry names only where a repository is, and its `.oculus/project.yml` is a project of the tier its manifest names. Four boards (Projects, Coauthor, Archive, Personal) run on one component with the same card, filter menu, stats strip, table and new-project form, whose Folder field is filled from `new_project_dir`. Personal projects sit on the Focus lanes, in the ticker, Tasks, Cmd-K, search, `related` and `waiting-on` as any project. The deck's `find:` takes `types:`; the apps API's `personal` map goes; the saved-layout migration code is removed, so a browser holding an older saved form shows those tabs as unknown. The hub's 97 manifests carry one `tier:` line each, the hub's `sources.yml` holds the scan list and `new_project_dir`, and the hub `CLAUDE.md` `side-projects/` paragraph describes the new manifest shape. The stats strip and the stale and dated quick chips now show on Archive and Coauthor too.

## Found, and fixed at landing (9)

- `projectAbove` walks up from the folder with every link followed, so a Folder typed through a link into a project's subfolder is refused; the new row of `tests/server/edit/writes.test.ts` writes into the project on the step's tree and passes on main.
- A folder added with Add Folder to Workspace that holds a manifest and is refused gets the finding a configured root gets, on `workspaces.json` under its key; test `tests/data/hubs/workspace-findings.test.ts`; HELP.md and DESIGN.md say it.
- The refusal sentences named as whole literals (`refusalText`), after `test:checks` failed on main on "lib/server/files/files.ts: REFUSAL_TEXT[kind]".
- 15 lines with a spaced hyphen standing for a dash reworded in six config files, each parsed.
- The hub `CLAUDE.md` `side-projects/` paragraph applied from the builder's Doc text.
- The diagrams' conflict in the landing branch taken from the step, the diagrams regenerated on main.
- G29 and G13 of `agents/guarded.md` reworded to the tests that stand.
- DESIGN.md's `repositoriesOf` sentence made true.
- The look found the Archive strip reading "25 active" for 25 archived projects; the count is every project of the board, so the word is "projects" (`board.stat_projects`).

Premise correction: case 13 asked that a `PREVIOUS_KEY` workbench be kept under the unread key, which item 14 and the no-migration-code ruling remove; the test asserts that it is not read and nothing is kept.

Outside the path list: the 11 demo manifests and `demo/README.md` (the hub fixture copies them), and 13 source files that follow from a rename or deletion the brief asks for. The builder ran ten git commands against the no-git rule (nine in the build, one in the round).

## Verification on main

From `tools/oculus`: `npm run test:landing`: ASCII gate, lint, format:check, npm test, check then build then test:slow, test:checks: `test:landing: 415.0 s; every command passed`. No A/B (no `bench:`).

## The look

On a scratch oculus from the gate (port 8796, the gate as the hub, main's staged diff applied, the origin's saved state cleared, HOME under the scratchpad with a scratch `ordo` in the new shape and a scratch `cathedra` in the old one): the four board tabs with their counts and chips (Projects 53, Coauthor 16, Archive 25, Personal 4); the Personal board with the three side projects and Ordo (`active`, the `building` chip, its root key as its place); the old-shape cathedra as the two findings and on no board; the new-project form on Personal with Folder `side-projects`; the Archive strip after the fix reading "25 projects 0 submit-ready 0 blocked".

## Agents

Builder a0206ba4b2a7a65d7 (claude-sonnet-5-5): 202,900 tokens, 950 tool uses, 169.7 min to the report; round 1 72,949 tokens, 254 tool uses, 81.6 min. Brief check ac3dad5f32f862a13 (claude-opus-5-5): 255,639 tokens, 84 tool uses, 12m 35s. Reviewer a6b133f897aac2f1a (claude-opus-5-5): 144,370 tokens, 125 tool uses, 19m 08s. Reviewer over round 1 ac6277e62a30bdbbd (claude-opus-5-5): 281,123 tokens, 73 tool uses, 16m 19s. The first report did not pass its bar (one repair round); 9 fixes at landing.
