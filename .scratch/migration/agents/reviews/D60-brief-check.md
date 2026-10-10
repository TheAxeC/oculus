Brief check of D60, `tools/oculus/.scratch/migration/agents/briefs/D60.md`, read on main at 776696a28 (`git log --oneline -1` prints `776696a28 Land D59, the hub fixes and personal projects`). `plan.md` has no `## Goal` section. Its opening says "Execution ledger for `tools/oculus/DESIGN.md`", so the goal D60 delivers is taken from its step line (plan.md:745) and the ruling "Repository projects" (plan.md:1710).

## Names

1. **The record's `root` field is never decided, and both possible values break readers the brief does not list.**
   - If `root` is absent (read as `hub`), these readers pair `rootOf(project)` with a repository-relative or absolute path and get it wrong:
     - `src/lib/state/life/present.svelte.ts:274-290` builds the Present view's project-deck list as `ref: { root: rootOf(project), path: project.deck }`. Item 3 makes `deck` repository-relative (`folderHolds(root.dir, '')` gives `present`), so this opens `<hub>/present`.
     - `src/lib/state/client/context.ts:296-300` returns `{ root: rootOf(project), path: project.folder }` for `projectFolder`, which is the lookup `write-files.ts`'s `manifestOf` reads. Item 4's "`<root>`, `.oculus/project.yml` for a repository" cannot be reached by editing `write-files.ts` alone, and `context.ts` is not in the write list. It is also already 885 lines (`wc -l`), over the 880 limit, so any change to it needs a split.
     - `src/lib/state/client/selectors.svelte.ts:286-295` (`hubRoot`) returns `hubOfProject` of the first project whose root is `hub`. For a repository that is `repository.dir` (lines 104-105). An absolute `folder` sorts before `projects/...`, so the terminal's start folder (`terminals.svelte.ts:346,356`, `Composer.svelte:97`) can become the repository.
   - If `root` is the key instead, `fieldChoices` (`selectors.svelte.ts:448-449`) offers the records of a hub named `alpha`, so the editor's choices are empty. `RootChip` and `hubHint` (`palette.ts:160`) would also mark the project as another hub's.
   - The brief should state the value and list these readers.
2. **The undo of a write to a repository's research project is routed by `holding` (`src/lib/server/edit/writes/hubs.ts:183-189`, called at `undo.ts:299` for `manifest`, `subtask` and `subtask-add`).**
   - `holding` accepts a file inside the hub or a side project's file. Anything else is null, which answers `outside`.
   - After item 3 removes the root from `personalRoots`, `<root>/.oculus/project.yml` is neither, so case 8's "its undo puts it back" cannot pass.
   - `hubs.ts` (and its comment at 179-182) is not in the write list.
3. **The editor's YAML schema is not covered.** `src/lib/data/snapshot/schema/static.ts:66-80` maps `every: ['.oculus/project.yml']` to the side-project schema. `run.ts:141-146` associates the manifest schema only with `hub` globs of the scan folders. A repository's research manifest would therefore be checked in the editor against `side_project_schema`. That goes against the step line's "the editor ... as a hub project is" and item 5's "fields of `manifest_schema`". The files are under the `data/` folder of the write list, but no item names them.
4. **`src/lib/data/sources/deck/read.ts:116-120` is missed.** It maps deck folders to projects with `join(context.hub.dir, project.folder, PROJECT_DECK)`, and `data/index.ts:194-232` (`deckProjects` and `decks`) feeds it every manifest. Item 4 names only `server/content/deck/read.ts:44`, and verify check 2's grep does not match `join(context.hub.dir, project.folder`.
5. **App writes are undecided.**
   - DESIGN.md:558 and `src/lib/server/edit/writes.ts:329-336` (`sidesFor`) say a repository's `.oculus/project.yml` answers not found to an app's frame.
   - A research repository found through the new reader in `homeOf` would be writable from an app. Item 5 does not say whether an app may write it.
   - `writes.ts` is not in the write list. The rule is user-visible and touches security, so it needs a decision.
6. **Comments and docs made false that the brief does not name.**
   - DESIGN.md:593 ("Every record carries `root` ... its hub-relative paths stay relative to its own hub") is false for a first-hub record with an absolute `folder`. It is not in the write list, which names only DESIGN.md:558.
   - `model-entities.ts:104-107` (RawManifest `folder` "relative to the hub", `id` "the folder's basename") and `:602` (`folder` "relative to the hub") become false. Item 4 names only the comment of `Project.repository`.
   - `validate.ts:163-166` ("The folder name is the project's id") becomes false.
   - `config/catalogs/options.yml:1363-1371`, the Settings help and fields of `roots:` (`key` and `dir` only), names no `tier`, and it is not in the write list.
7. **Hits checked and not made false:**
   - `ScanRule`: `hub-names.ts:230` and the test constructions.
   - `RootItem` in `writes.ts:169`.
   - `personalRoots` and `readManifests` in `data/index.ts:244` and `tests/data/real-hub.probe.ts`.
   - The other `placeOf` hits: `files.ts:162`, `config-checks.ts`, the lsp files and `docs/diagrams/writes.dot:192` are different functions.
   - `homeOf` in `tests/routes/sessions/latex-approvals.test.ts:39` is an alias of `latexHome`.
   - The `manifestOf` hits in tests and `schema/manifest.ts` are different functions.
   - `insideHub` appears only in `manifest.ts`.
   - HELP.md:218 (the LaTeX panel).

## The step line

8. **Item 7 (Z780) goes beyond the step line and contradicts it.** It turns on LaTeX for repository side projects ("a repository's (side or research)"), while the step line says that with `personal` or no `tier` the repository "is a side project as now".
9. **Item 6 (no Deposit) departs from the step line's "as a hub project is" without a ruling.** It is decision Z780.
10. **Z778, Z779 and Z780 are not booked.** `grep -rn 'Z778\|Z779\|Z780' tools/oculus/.scratch/migration | grep -v briefs/D60.md` prints nothing, and plan.md's last Z line is Z777 (plan.md:1717).
11. **The step line's part "drawn on ... its project page, the editor, Cmd-K and the Map as a hub project is" has no item that builds the editor (finding 3) and no case or look that checks the project page, the editor, Cmd-K or the Map.**
12. **Item 5 lists "a board move" among the writes to `.oculus/project.yml`, and item 8 says "No action of the board writes it".**
    - Neither says how a `tier: projects` repository moves between ideas, active and manuscripts. That move is set by the manifest's `type`, which a write refuses (DATA-MAP.md:570).
    - The step line's "moving ... is a change of its `tier`" does not cover it.

Every other part of the line maps to an item:
- `tier` and its four values, and the finding on `hub: true`: item 1.
- The research tier and the side project otherwise: items 2 and 3.
- The type and the references against the first hub's registries: item 3.
- Archiving: item 8.
- Writes to `<root>/.oculus/project.yml` only: item 5.
- DATA-MAP and HELP: item 9.

## Premises

13. **Several line ranges are off by one or two:**
    - `readRoots` is `files.ts:204-300`, not 204-299.
    - `hubRefusal` is 171-194, not 172-192.
    - `RESERVED_HUB_KEYS` is at 157, not 156 (`grep -n` output).
    - `roleDirectories` starts at 257, not 247.
    - `Tier` is at `model-entities.ts:26-27`, not 27-28.
14. **The "File sizes" premise misses three files the step changes that are at their limit:**
    - `model-entities.ts` is 880 lines (item 2 adds `tier` to `ScanRule`).
    - `ProjectCard.svelte` is 520 lines (item 6).
    - `context.ts` is 885 lines (finding 1).
    - Source: `wc -l`.
15. **Every folder the step may add a file to already holds ten tracked items.** `git ls-files ... | awk ... | sort -u | wc -l` gives 10 for each of `src/lib/data/sources`, `src/lib/data/snapshot`, `tests/data/sources` and `tests/routes/edit`. The write list invites "any new file beside" `manifests.ts`, so that file would need a folder split, and the brief does not say so.
16. **Decision 1's collision command `ls -d projects/*/*/ projects/*/*/*/` does not reach 30 manifests.**
    - `find projects -name project.yml | awk -F/ '{print NF}' | sort | uniq -c` prints `53 4`, `11 5`, `30 6`; the six-field ones are four folders deep.
    - The full `find ... -exec dirname | xargs basename | grep -x ...` also exits 1, so the conclusion holds and only the command is wrong.
    - The sentence says "Five real cases" and then lists six keys.
17. **The premise list of `join(hub, project.folder)` readers misses readers that the brief's own grep `grep -rn "project\.folder\|manifest\.folder" src` prints, plus one that it does not print:**
    - `src/lib/state/client/context.ts:299` (grep output).
    - `src/lib/data/sources/deck/read.ts:118` (grep output).
    - `present.svelte.ts:281` is not printed by that grep; its `project.deck` path breaks the same way.

All other premises reproduce:
- The ruling text.
- `browserRoots` at 35-46.
- The six roots at `.oculus/config/sources.yml:81-87`, with no `hub` and no `tier`.
- `roots: []` at the engine's sources.yml:77.
- `personalRoots` at 291-307 and `rootPersonal` at 338-357.
- `scanRuleShape` drops `tier`.
- `TIERS` at `presets.ts:199-203`.
- `Project.repository` at 605-610.
- `placeOf` at 58-76.
- Every listed file:line of item 4's readers.
- `homeOf` and `insideHub` at 311-330 and 381.
- `isOwnFile` at 285-299.
- `deposit.ts:1-5`, 251 and 287.
- `RootItem` at 77-79, `itemShape` at 89-93, `kept` at 222-227.
- The listed line counts.
- The DATA-MAP, HELP, apps.md and personal.yml lines.

## Cases and checks

18. **Cases 1-7 and 16 are to be "rows" of tests that are single `it()`s, not tables:**
    - `tests/data/sources/manifests.test.ts:115`, 'carries the provenance of a flat project'.
    - `personal.test.ts:56,89,110`.
    - `tests/routes/edit/roots.test.ts:111,194`.

    `spec.md:57` lets a test exist only under a `guarded.md` entry that names it by file and title. The brief names no title for any new case and does not say the orchestrator will add one to `guarded.md`, which the builder may not edit. Case 4 (the `readRoots` findings) has no named home at all: the existing hub-root tests (`tests/data/hubs/hub-roots.test.ts:41-123`) are named by no entry (`grep -n "hub-roots" guarded.md` prints nothing), and G13 lists no roots test.
19. **Case 8's undo falls under G9** (`tests/routes/edit/undo/undo.test.ts`), and the brief does not list G9 among the entries to read.
20. **Case 8's "a write naming `alpha` with a file path anywhere else" names an input a manifest write cannot carry.** The bodies hold an id and fields (`bodies.ts`, `writes.ts:393-405`). The case cannot be built as written.
21. **Cases 13 and 15 cannot be run as written.**
    - Case 15 says "while the server runs", and case 13 says "a session started in `<tmp>/alpha`". `spec.md:38,62` give the builder no server and no page, and the brief names no port.
    - Each should be stated as a unit run (a synthetic transcript for the session index, and the watcher's predicate or rebuild for case 15).
22. **Verify check 4 uses `LC_ALL=C grep -n '[^ -~]'`.** `spec.md:99` says the perl gate replaces that form wherever a brief names it.
23. **Verify check 5 cites "the template's rule 4", which neither the brief nor `spec.md` defines.**
24. **The read list for `portfolio.ts` (180-310, 640-720) leaves out `watchRootParents` and `openRootFolder` (532-560).** Those are what hears a root's `.oculus/` folder, which decision 4 relies on once research roots leave `personalRoots`.

No case asks the builder to explain a place the step does not change. Case 12's "no check reads `<hub>/<tmp>/alpha`" is a check on a changed reader.

## The question

25. **Case 1** can pass with the editor on the side schema (finding 3), the Present deck list on `<hub>/present` (finding 1) and Cmd-K never looked at, because it asserts only the snapshot's fields. It asserts neither `root` nor where `deck` resolves.
26. **Case 8** can pass with the repository missing from the snapshot after the write. It checks the file only, and with the research roots left out of `personalRoots` nothing says the watcher hears the edit and rebuilds. No case checks a rebuild after `<root>/.oculus/project.yml` is edited or created.
27. **Case 10** can pass with the project page's README tab broken. It checks the `docs` flags and `api/project-files` but not `api/docs` for `alpha`. (`renderDoc`, `docs.ts:536-539`, works only if the snapshot record carries `repository`.)
28. **Verify check 2** can print nothing while the readers of findings 1, 4 and 17 still read the wrong path, because its patterns cover four spellings only.
29. **Item 4** can be ticked with `write-files.ts` changed and `context.ts`'s lookup untouched, so the session's manifest file names `{ root: hub, path: '/abs/.oculus/...' }`.
30. **Item 5** can be met and undo still answer `outside` (finding 2).

Cases 2, 3, 4, 5, 6, 7, 9, 11, 12, 14 and 16 cannot pass without their part of the goal: each asserts the snapshot field, finding, file bytes or route answer the goal changes.

## Implied inputs

31. **A root whose dir is the first hub, lies inside it, or is a symlink to a hub project folder, with a research `tier`.**
    - `personalRoots` drops only a dir equal to the hub's (`portfolio.ts:294-301`).
    - Expected: a finding on the entry and no research project, so one folder never gives both a scan project and a repository project.
32. **Two keys naming one directory, both with a research `tier`.**
    - Expected: the first is read and the second gives a finding and no second project, as `personalRoots` already drops a second spelling. Otherwise two projects write one file.
33. **A research root plus a workspace-added root (Add Folder to Workspace) for the same directory.**
    - `addedRoots` reaches `personalRoots` through `paths.roots()`, and the research root is no longer in its seen set.
    - Expected: no side project for the added root.
34. **A key that is no usable id: one holding a colon (for example `root:foo`, which collides with the side project `root:foo` of a root keyed `foo`), a slash, or whitespace.**
    - `rootShape` accepts any non-empty text (`files.ts:136-139`).
    - Expected: a finding on the entry, and the repository read as a side project, as `RESERVED_HUB_KEYS` does for a hub root.
35. **A key different from the dir's basename (`{ key: alpha, dir: <tmp>/beta }`).**
    - `checkFolderNames` (`validate.ts:167-180`) and the session matcher take the folder's basename, so `beta` would clash with a hub folder `beta` and `alpha` would not.
    - Expected: the repository's name in those checks is its id.
36. **A manifest with an `id:` key different from the root key.**
    - Expected: the `id` finding a scan project gets (`model-entities.ts:93-95`), and `manifestId` kept.
37. **A manifest with no `type`, or a `type` that is not text, under `tier: projects`.**
    - Expected: the finding on `type`, and the repository read as a side project (only `idea2` is a case).
38. **A research repository's id in another manifest's `related` or `waiting-on`.**
    - Expected: it resolves with no finding (stated in decision 1, no case).
39. **A research root whose dir is not on this machine.**
    - `readRoots` already raises `missing_dir`.
    - Expected: that one finding, not a second "no manifest" finding.
40. **The Present view's project deck, the terminal's hub folder (`hubRoot`) and the editor's schema association** (findings 1 and 3).
    - Expected: the repository's deck opens under its root, the terminal starts in the hub, and the editor uses the manifest schema.
41. **`tier` set from the Settings view.** `options.yml` gives `roots` the fields `key` and `dir` only.
    - Expected: the Settings form shows and keeps `tier`, or the docs say it is set in the file.

The Focus lanes (`Lanes.svelte`, which builds a path from `folder` only for a ghost), the palette (`palette.ts:160`, fine with `root` absent) and the Map (`views/structure/map` reads no `folder` or `tier`, `grep -rn "folder\|tier\|rootOf"` prints nothing) need nothing more. A `tier` written in another letter case is covered by item 1's "any other value".

## ADRs

None. `ls docs/adr tools/oculus/docs/adr` prints "No such file or directory" for both. `find . -name '[0-9][0-9][0-9][0-9]-*.md'` finds only Jekyll gem fixtures under `theaxec.github.io/vendor/`. `grep -n adr orchestrator-state.md` prints nothing.

## Dictated text

42. The one string dictated word for word is the report's first line "Everything in the brief is done" (`grep -n '"Everything in the brief is done"' D60.md` gives line 140). It holds: it is `spec.md:80`'s own wording.
    - No finding wording, comment, heading or doc sentence is dictated: items 1 and 9 give content only.
    - `LC_ALL=C grep -n '[^ -~]' D60.md` prints nothing.
    - `grep -n '"' D60.md` shows quotes only around the ruling's name (line 13), a grep pattern (line 133) and line 140.

## Declined to judge

- Whether `optionFindings` or another config shape reports an unknown `tier` key on a `roots:` entry. I did not read `src/lib/data/sources/config/catalog/options.ts` or the whole-file shapes, and a run of the config checks with a `tier` written would settle it.
- Whether `normalise.ts` and `joinHubs` (`snapshot/hubs/merge.ts`) need changes beyond what item 3 implies. I did not read them in full.
- Whether `portfolio.ts` stays under 880 lines once research roots are watched. It cannot be measured before the build.
- The rest of plan.md beyond the D59 and D60 lines and the Rulings tail (1703-1717). The plan has 2019 lines.

Usage: a9cd3f67733719350, claude-opus-5-5, 222,061 tokens, 70 tool uses, 9.4 min.
