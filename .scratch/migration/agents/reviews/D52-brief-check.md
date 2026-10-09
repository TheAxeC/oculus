# Step D52 brief check (on main at 75d586b5b)

`git log --oneline dd431acdc..HEAD` prints only `75d586b5b Send D57 its repair round 1`. `git diff --stat dd431acdc HEAD` touches only four ledger files under `tools/oculus/.scratch/migration/`, so the brief's reading at dd431acdc still holds for the tree. `ls .agents/worktrees/` lists no `D52-base` yet. The brief names that folder as its base copy, and /spec creates it after this check.

## 1. Names

1. **The moved card files.** `git grep -n "EntryCard\|entry-actions\|Grip\.svelte"` (outside `.scratch`) finds hits only in `Collection.svelte:68,299`, the three moved files, `Subtasks.svelte:12`, `allow-duplication.txt:20` and `allow-styling.ts:24-41`. All of these are in the write list.
   - The `why` strings of `allow-styling.ts` carry line numbers (`EntryCard.svelte:418`, `:422`, `:411`). The `allow-duplication.txt:20` reason carries `at 187 and 127`. Item 7 says these entries "change their path alone". Item 5 (the `ontitle` opener) and item 6 (the folder Show in Files) both edit `EntryCard.svelte`, so its lines move. If only the path changes, the reasons quote stale line numbers, which is a sentence the change makes false (spec.md:68). The checks do not catch this: `isReason` reads the text and the duplication check matches by mark.
2. **`task-card.ts` is missing from the move.** `views/boards/collection/task-card.ts` holds `taskCardActions`, which `Collection.svelte:313` hands to `EntryCard` as `extra` (Start Agent on a task). Item 4 requires "Start Agent on a task" on the page's card. The page may not import `views/boards/collection/` (boundaries.test.ts:284-292), so `task-card.ts` must move to `views/shared/forms/entry/` as well, together with the `startAgent` wiring. It is not in item 7 or in the write list.
3. **Sessions, Documents and Files blocks "drawn as the project page / Person page draws them".** The session row is the local snippet `sessionRow` at `Project.svelte:126-144`. The Files block is local markup in `Person.svelte`. The page can import neither, and the write list names neither file and no new shared partial. That leaves two routes, both outside the brief:
   - copy the markup, which the duplication check flags and the brief forbids answering with a new allow-list line ("nothing added or widened");
   - move the markup into `views/shared/` (`views/shared/sessions` holds 6 items), which needs `Project.svelte` and `Person.svelte` in the write list.
4. **Funding identity outside the write list.** `git grep` for funding identity by title finds these hits outside the write list, each made false or obsolete by item 2 and `idRequired: true`:
   - `src/lib/data/snapshot/validate.ts:279-282`: the `checkEntryIdentity` comment says "funding with `title`".
   - `validate.ts:333-347`: `checkFundingIdentity` (`funding_no_identity`).
   - `validate.ts:356-376`: `checkFundingStatements`' `funding_no_key`. Once `entry_no_id` fires on every keyless entry, this repeats it.
   - `validate.ts:296-297`: the `exempt` keyless branch for funding. It becomes unreachable, because `idFields.get(funding.yml) === 'key' === ident` makes the loop `continue`.
   - `src/lib/data/snapshot/normalise.ts:514`: the comment "known by its `title` otherwise".
   - `src/lib/server/files/fs/collections.ts:133`: "funding.yml's schema opens with `title` while three of its entries carry a `key`".
   - `src/lib/data/helpers/hub-names.ts:93-96`: the head comment of `REGISTRY_SHAPES` says "its own schema marks it optional, so an entry without one is not a finding". The write list limits this file to line 106.
   - `config/text/findings.yml:200-201`: `funding_no_identity` and `funding_no_key`. They become orphans if the code above is removed, and the keys test fails on an orphan.

   Item 8 says "Each file's head comment that says how an entry is identified is made true", but the write list excludes all of these files except `collection.ts`.
5. **`docs/DATA-MAP.md` ranges.** `grep -n` puts the table rows the step changes at 162 (boilerplate), 167 (repos), 172 (funding), 173 (events), 175 (education), 176 (applications) and 177 (tasks). The brief's range `156-175` leaves out 176 and 177. Line 193 ("`funding/funding.yml` writes by `title` ... an entry without a `key` is known by its `title` (`checkFundingIdentity` ...)") becomes false and is not in the list. Lines 284 and 352 say the key is required only on an awarded or contributing entry, which is false once `idRequired` is true. Line 156 also names `identityField` in `server/edit/writes/entries.ts`, but `grep -rn "function identityField"` finds it only in `server/files/fs/collections.ts:50` and `state/boards/collection.ts:381`. The step rewrites line 156, so this stale pointer is in its range.
6. **`docs/files-and-search.md:39`.** It reads "Show in Files of a folder (a project card, a person's supervision folder) opens a Files tab rooted at that folder" and says a collection card's control selects a path. Item 6 makes both incomplete or false. `DESIGN.md:562` defers to this paragraph. It is not in the write list.
7. **Hub document comments.** `hubDocument`'s doc comment (`state/system/docs.svelte.ts:193`, "by the path its `docs:` entry in layout.yml names") and `renderHubDoc`'s comment (`server/content/docs.ts:451-456`, "the documents the `docs:` list of config/layout.yml lists") describe callers the entry page widens. Not in the write list.
8. **The new view id `entry`.** `git grep "id: 'entry'"` finds no view with that id. `'entry'` is already a write kind (`bodies.ts:38`) and an app write name (`apps.ts:106`), which are different namespaces. There is no collision, and no `entry:` text group exists under `config/text/views/boards`.
9. **Overlap with steps in flight.**
   - `docs/window.md:41` is also a write path of D57 (its brief lists "docs/window.md lines 15 and 41"). `diff` of line 41 between main and `.agents/worktrees/D57` shows D57 has already changed it. Both steps write the same line, and no `shared_paths:` judgment for D52 exists yet in `orchestrator-state.md`.
   - Other shared files are on different lines: `docs/views.md` (D41 73, D47 159-181, D48 5-7 and 21-23), `HELP.md` (D46 79-80, D47 43/134/138-139, D48 105), `keys.test.ts`, `docs/diagrams/` (D47, D48), `hub-names.ts` (D48 line 82) and `allow-duplication.txt` (D47 line 23).

## 2. The step line

1. "a `key` added to every entry of `funding/funding.yml` and the other collection files": items 1 and 2. Venues keep `id` (decision 3, Z749 (c), a self-rule choice), and `data`, `pillars`, `domains` and `joint-work` already key every entry.
2. "an entry whose link is a folder (funding, education, applications and the like) gets a page of its own": items 3, 4 and 5.
3. "built from the project and person pages": item 4. Its Sessions and Files blocks have no route that respects the boundary rule (Names 3).
4. "its Show in Files opens a Files tab rooted at the folder as a project card's does": item 6.
5. Every part maps to a requirement. None is left without one.

## 3. Premises

1. **Collections list.** `sed -n 45,70p config/sources.yml`: `collections:` is at line 53, `code` at 65. Holds.
2. **Survey.** `python3 -I $TMPDIR/survey.py .` printed, per file, the same counts the brief quotes: funding 11, 3 keys, 6 links, 4 folders; events 7/0/3/3; education 21/0/5/5; applications 25/0/24/23; venues 71 with `id`, 63 links, 0 folders; schema first field `title` for the seven, `name` for venues. Holds.
   - The survey for the demo printed `venues ... schema first id`, which differs from the hub's `name`. The brief does not mention it, and it is not this step's concern.
3. **Quoted keys.** My run of decision 1 (`$TMPDIR/keys.py`: kept key, else folder basename if `link` is a hub dir, else NFKD slug) diffed against the brief's quoted block differs only by the code-fence line. No clash. Holds.
4. **Identity functions.** `identityField` is at `collection.ts:381` and `collections.ts:50`. The function is `identityFieldOf` at `validate.ts:234`; the brief calls it `identityField` there. `identityFindings` is at `validate.ts:249` and gives `identity_empty`/`identity_shared`. Holds.
   - `normalise.ts`: the brief says 540-550, but `entry()` starts at 541 and the id expression is at 552-557. Funding's id is at 515-518, as the brief says. Minor drift.
5. **Manifests.** `grep -rh "^funding:" --include=project.yml projects side-projects | sort | uniq -c` gives `[FAIR]` 8, `[FWO-PhD]` 9, `[ZonMw-AI-HCC]` 4 plus 1 with a trailing comment (5 together), and 3 bare `funding:`. Holds.
6. **`hub-names.ts`.** `:102` venues `idField: 'id'`, `:106` funding `idRequired: false`. Holds.
7. **DATA-MAP.** The `:156-175` range is wrong; the rows run to 177 (Names 5). `:194` holds.
8. **Demo hub.** The survey over `tools/oculus/demo` shows funding 2 entries with 1 key, events 3, education 2, applications 2, tasks 3, code 3, statements 3, links 0 everywhere. Holds. `tools/cockpit/dummy` appears only as a lint glyph pattern in `config/behavior.yml:215` and `options.yml:786`, not as data read. Holds.
9. **Card and control lines.** `EntryCard.svelte` 506, `entry-actions.ts` 86, `Grip.svelte` 38 (`wc -l`). `Card.svelte:36` (`ontitle`) and `:79-85` (the button) hold. `hubPathsOf` is at `collection.ts:297-313`. `EntryCard.svelte:155-168` (`shows`) holds. `ProjectCard.svelte:163-170` and `:243-252` hold. `show.ts:66-80` (`showFolderInFiles`) holds.
10. **Project and Person pages.** `Project.svelte` 285 and `Person.svelte` 346 lines. `Segment`, `doc` in the instance state, `Markdown.svelte` and `sessionsForProject(folder)` hold for Project. `SourceButton`, Open Joint Work, `listing(HUB_ROOT, folderPath)`, `fileEntries`, `openSourceFile` and `showFolderInFiles` hold for Person.
11. **Brief section 4's other references.** `docs.svelte.ts:194` `hubDocument` holds. `server/content/docs.ts:458` `renderHubDoc` serves any `.md` inside the hub; holds. `fs.svelte.ts:384` `listing` and `:361` `relistFiles` hold. `fs-transport.ts:321` holds; the entry also carries `link?: true` for a symlink. `src/routes/views.ts:45` glob holds. `instance.ts:132-141` `stateId` holds.
12. **Boundaries.** `boundaries.test.ts:284-292` (`ownPartials`) and `DESIGN.md:220` hold. The claim that the three files are imported only inside `views/boards/collection/` holds, except that `task-card.ts` is a fourth file the card depends on through `Collection.svelte` (Names 2).
13. **Docs lines.** `docs/views.md:95-118`, `:249-253` and `:257` ("Seven views ...") hold. `HELP.md:156` ("Six views ...") holds. `docs/window.md:41` holds.
14. **Folder sizes** (`ls`): boards 8, shared 10, shared/card 10, shared/forms 9, state/boards 10, config/text/views/boards 8. Holds.
15. **Guarded entries.** G8 is at `guarded.md:49`, G32 at 182, G66 at 134, G67 at 137. They hold. The brief says case 4's row goes in "G8's table" in `tests/server/edit/writes.test.ts`, which is wrong:
    - `writes.test.ts` holds no entry-write table, and its header says "The collection entry writes are writes-collection.test.ts".
    - G8's entry-write case is `tests/server/edit/writes-collection.test.ts` 'sets a field of the entry the id names'. It is a single case over a `tasks` fixture, not a table of rows.
    - `writes-collection.test.ts` is in neither the write list nor verify item 2's command.
16. **Decision 6.** `server/root/watch/portfolio.ts:9-14` (rebuild only for `.yml`/`.md`) holds.
17. **Decision 1 and item 2: funding already has a `key` row.** "the `schema:` gains `{ field: key, ... }` as its first row" is wrong for funding. `grep -n "field: key" funding/funding.yml` gives `18:  - { field: key, type: text, help: "Cross-link anchor (the funding: tag on manifests)" }`, and the demo's `funding.yml:13` holds `{ field: key, type: text, help: "funding: tag the projects use" }`. Adding a row would declare `key` twice, and no finding exists for a field declared twice (`grep twice config/text/findings.yml` finds none for schema fields). For funding, the existing row has to move to the front and become required, and case 1's "only the key lines and the schema row" then includes removing line 18.
18. **Hub data writes have no named script.** spec.md:103 says a brief that names a hub data path writes there "through the script the brief names and by nothing else". spec.md:37 bans writes under `funding/`, `registries/` and the other data folders otherwise. The brief names seven hub files to rewrite and no script. The tree has a precedent folder for such scripts: `ls utils/migrations` gives `convert-decks.mjs`, `migrate-joint-work.mjs` and `rename-program-to-pillar.ts`. Z749 is a self-rule choice, not a ruling of Axel's that asks for hand rewording.

## 4. Cases and checks

1. **Case 4 cannot fail on the unchanged tree.** It is placed in the wrong file and called a table row (Premises 15). It also cannot meet verify items 2 and 4 ("quoted failing on the unchanged tree", "Case 4's row is a proof"):
   - the write path already addresses an entry by whatever the schema's first field is (`collections.ts:50`, `entries.ts` `identityOf`/`entryOf`);
   - a synthetic fixture with `key` first therefore passes on the unchanged code;
   - spec.md:37 forbids a test that reads the real `funding.yml`.

   The case asks for a proof that cannot exist.
2. **Case 13 conflicts with the configured look.** It asks for "the landing look on a scratch oculus over a scratch hub". `.agents/plan.yaml` `look:` and spec.md:58 put the look on the TEST page on Axel's running server. spec.md:38 says the dev server uses "the port the brief names", and this brief names none.
3. **Case 12 names no method** (no run and no reading named), unlike every other case.
4. **Verify item 5 cannot pass as written.** It uses `LC_ALL=C grep -n '[^ -~]'`. spec.md:99 says the perl form "replaces the `grep '[^ -~]'` form wherever a brief or a check names it". Its expected output, "only the accented letters of names the files already held", is also unreachable: `LC_ALL=C grep -n '[^ -~]'` over the hub files prints existing non-letter characters, for example `funding/funding.yml:19 ... the 🔔 Follow-ups group` and `:52 (€50k)`. The gate's condition would have to be "no line the step added".
5. **Case 3 is not breakage testing.** It changes data in a `$TMPDIR` copy to exercise the finding the step adds. No code is broken, so it holds against spec.md:64. Its expected result is incomplete, though:
   - `schema/check.ts:233-241` gives `findings.schema.required` for a missing `required: true` field, and `registries.ts:96-100` gives `entry_no_id`;
   - for an awarded or contributing entry (FAIR), `validate.ts:369-375` also gives `funding_no_key`;
   - so one keyless funding entry yields two or three findings, and the brief does not decide which ones stay.
6. **Cases that check a place the step does not change:**
   - case 6 (`crossLinks`);
   - case 15 (`ticker.ts:259-260`, `views/boards/focus/rows.ts:315`);
   - case 14 (`blockedBy` in `entry-file.ts`);
   - case 5 (the Add builder, `entry-file.ts` and `draft-entry.ts`);
   - case 2 (`validate.ts`).

   These are preservation checks over unchanged code, and they are legitimate as such.
7. Every other case is consistent with spec.md. Cases 9 and 14 left to the look follow spec.md:62-63.

## 5. The question

1. **Case 1:** cannot pass without the keys. It does not cover the page.
2. **Case 2:** can pass without the goal. Today the files give no identity findings either (the real-hub `integrity.test.ts` 'validates with no findings' holds on main), so it only guards against regression.
3. **Case 3:** the `entry_no_id` half needs `idRequired: true`. The `duplicate_key` half passes on the unchanged tree, because `duplicateKeys` (`schema/lists.ts:107-139`) already checks funding by `key`.
4. **Case 4:** can pass without the goal (Cases 1).
5. **Case 5:** depends on the schema row, so it fails without it. The caret placement is read only.
6. **Case 6:** passes on the unchanged tree.
7. **Case 7:** a test of the folder function can pass while the card does not use it. The look covers the wiring.
8. **Case 8:** the controls are a `$derived` inside `EntryCard.svelte:158-168`, so "a scratch run of the controls the card builds" reaches them only if they are extracted. Otherwise only the look shows them.
9. **Cases 9, 13 and 14:** look and reading only.
10. **Case 10:** `stateId` is unchanged. The case proves something only if it runs over the states the real opener builds, not over hand-written states.
11. **Cases 11 and 12:** reading only for 12.
12. **Case 15:** passes either way, since the server maps `id` to the identity value through `entryId`.
13. **Case 16:** passes on the unchanged tree, and passes when the page does not draw the card at all.
14. **Items:**
    - Item 1 is held by case 1.
    - Item 2 has no executable proof beyond case 1's diff and case 5.
    - Item 3 is held by cases 7 and 13.
    - Items 4 and 5 rest on the look.
    - Item 6 rests on case 8 and the look.
    - Item 7 rests on case 16 and the tree checks.
    - Item 8 rests on verify 6 and the keys test.
    - Item 9 rests on the size and folder checks.

## 6. Implied inputs

1. **Has happened: live funding entries with a folder but a file link.** The Veni entry links `funding/2026-nwo-veni-self-explaining-hospital/CALL-REQUIREMENTS.md` and ENW-XS links `funding/2026-nwo-enw-xs/OVERVIEW.md`. Under the rule they get no page, and their keys come from their titles (`nwo-veni-the-self-explaining-hospital`), not from their folders. The brief should state this as the expected result or decide otherwise. The same holds for the VIB.AI application (`applications/information/vib-ai-aerts-inquiry.md`).
2. **Has happened: undo of a write recorded before the change.** `undo.ts:168` finds the entry with `entryOf(collection.held, change.key)`. A recorded change holds the identity value, which was the title. That includes funding entries that already had a key, since funding was written by `title`. After the switch, undoing such a record finds no entry. Expected: the undo refuses with the entry-gone sentence and writes nothing. The brief does not name this.
3. **A key YAML reads as a number or boolean** (a folder named `2026`, a title such as "True"). `registries.ts:95` `filledText` would give `entry_no_id`. Expected: the key is written double-quoted so it reads back as text, as G67 does. None in the current data.
4. **A title that slugs to the empty string** (punctuation or non-Latin script only). The rule gives `''`, which yields `identity_empty` and the `required` finding. Expected: not written empty. The brief gives no fallback. None in the current data.
5. **A clash.** "a clash takes `-2`, `-3`" does not say which entry keeps the bare key (file order is the natural answer). Two entries linking one folder clash by construction. None in the current data.
6. **A link with a trailing slash or `./`.** A plain basename of `funding/x/` gives `''`. Expected: the folder name after `normalisePath`. None present (every link listed by my run is bare).
7. **A folder reached through a symlink.** `server/files/fs.ts:345-352` lists it as `kind: 'dir'` with `link: true` while its real path is inside the root, and drops it otherwise. So the page follows the real path. `find funding network education applications -maxdepth 4 -type l` finds none now.
8. **A link to a dot folder or a build folder** (`SKIPPED`, `fs.ts:112`). It is missing from the default listing, so the folder exists but gives no page. Not stated.
9. **A flow-map entry.** All 14 files hold block entries only (my awk count: flow 0 in every file). The rule is hypothetical today.
10. **Files the demo lacks.** No demo entry has a link (survey), so the demo hub shows no entry page and no rooted Show in Files.
11. **Saved state holding entry ids.** The collection instance state `more: string[]` (`collection.ts:86`) and `reveal` hold entry ids. For the six keyless files these change from title to key, so saved `more` lists stop matching once (a card's long fields close).
12. **A saved tab of the `entry` view after its key changes.** Covered by case 11.
13. **The view opened bare** (no state, for example from an app's `open` or a saved layout without state). Person says "opened bare it can only report that it was opened for nobody". The brief gives no sentence for it.
14. **The reference index and rename for a funding key.** Every funding entry becomes a definition, so the title-slug keys become nameable from manifests. G67's rename of a funding key now also renames the write identity. Expected: as G67 states. No conflict, but not named.
15. **New entries added by hand without `key`.** After the change these give `required` plus `identity_empty`, or `entry_no_id` for funding. This is acceptable as a finding, but the hub's instructions for adding a funding entry do not mention `key`.

## 7. ADRs

1. None. `grep -n "adr" .agents/plan.yaml` prints nothing, and `find . -name adr -type d -not -path '*/node_modules/*' | wc -l` prints `0`.

## 8. Dictated text

1. `D52.md:68` `{ field: key, type: text, required: true, help: "..." }`: ASCII and one line, so it holds against the prose rules. For `funding/funding.yml` and `demo/funding/funding.yml` it is wrong as an added row, because both files already declare `field: key` (Premises 17). The help text is left to the builder.
2. `D52.md:65` `-2`, `-3`: holds. Which entry takes the suffix is left open (Implied 5).
3. `D52.md:196` "Everything in the brief is done": holds; it is spec.md:80's wording.
4. `D52.md:200` "no glossary": holds. `ls tools/oculus/docs` lists apps.md, configuration.md, debugging.md, diagrams, files-and-search.md, source-control.md, terminals.md, views.md and window.md, with no glossary.

## Declined to judge

- Whether the rebuild on a file change relists a parent folder when an empty folder is made (case 13). Only a run shows it, and I started no server.
- Whether a copied session row would cross the duplication check's threshold. Not run.
- What `~/.oculus`'s change log holds today (Implied 2). Not opened, by instruction.

Usage: served model claude-opus-5-5.

Usage (filled by the orchestrator from the completion notice): af6a63a7f7aa23810, claude-opus-5-5, 227,555 tokens, 99 tool uses, 13.1 min.

## Closed

Each finding is closed by a change to `agents/briefs/D52.md`; the choices are booked as Z752.

- 1.1 (reasons quoting line numbers): item 7 has the allow-list reasons take the moved file's path and true line numbers.
- 1.2 (`task-card.ts`): item 7 and the path list move it with the card.
- 1.3 (the session row and the Files block): item 4 has them shared in `views/shared/sessions/SessionRow.svelte` and `views/shared/links/FolderFiles.svelte`, drawn by the project and person pages; the path list names both pages; decision 5; the landing look checks both pages.
- 1.4 (funding identity outside the write list): item 2 removes `checkFundingIdentity`, `funding_no_key` and the keyless branch with their sentences; item 8 makes the comments true; the path list names `validate.ts`, `normalise.ts:514`, `collections.ts:133`, `hub-names.ts` 93-106 and `findings.yml` 200-201; decision 7; case 19.
- 1.5 (DATA-MAP ranges): the premises and item 8 name 156-177, 193-194, 284 and 352 and the stale `identityField` pointer.
- 1.6 (`files-and-search.md:39`): item 8 and the path list; `DESIGN.md:562` defers to it and stays true.
- 1.7 (hub document comments): item 8 and the path list name `docs.svelte.ts:193` and `server/content/docs.ts:451-456`.
- 1.8 (the id `entry`): no collision; nothing to change.
- 1.9 (`docs/window.md:41` with D57): judged at dispatch as a one-line merge of two additions to one sentence, resolved by hand at landing, recorded in `shared_paths`.
- 3.4 (`identityFieldOf`, normalise lines): corrected in the premises.
- 3.15 and 4.1 (case 4's test and proof): case 4 is now a scratch run over a copy and a preservation check, and G8's `writes-collection.test.ts` case runs on both trees; verify 2 names that file; the failing-first demand on case 4 removed.
- 3.17 (funding already has a `key` row): item 2 moves the existing row to the front and makes it required.
- 3.18 (hub data writes without a script): item 1 has the builder write the keys by hand under Axel's ruling (13), as the rules file allows for a ruling's rewording, each key line listed in the report; decision 7 of Z752 (e).
- 4.2 (case 13's look): case 13 is a reading and a scratch run; the landing look runs on TEST only.
- 4.3 (case 12's method): a scratch run and reading.
- 4.4 (the ASCII gate): verify 5 uses the `perl` gate and checks only the lines the step added in the hub and demo files.
- 4.5 (case 3's findings): case 3 keeps `duplicate_key`; case 19 states the findings of a keyless funding entry after the change.
- 4.6 (cases over unchanged code): kept as preservation checks.
- 5.x (the question): case 10 runs over the states the opener builds (unchanged text); the page's wiring rests on the landing look, as the rules file says for a DOM behaviour.
- 6.1 (file links in a folder): item 3 and decision 8.
- 6.2 (undo of an old record): item 2 and case 17.
- 6.3, 6.4, 6.5, 6.6 (key forms): item 1's rule.
- 6.7, 6.8 (symlinked and skipped folders): item 3.
- 6.11 (saved `more` and `reveal` ids): named in the premises; the report lists it as a visible change.
- 6.13 (opened bare): item 4 and case 18.
- 6.14 (the reference index): unchanged behaviour under G66 and G67, run in verify 2.
- 6.15 (adding a funding entry by hand): item 8 has the funding file's head comment say a new entry needs a `key`.
- 8.1 (the dictated schema row for funding): item 2 says the funding files move their row rather than add one.
