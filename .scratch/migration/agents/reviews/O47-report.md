# O47 report

Built inline by the orchestrator in `.agents/worktrees/migration-O47` from base ad63b0b0. 72 paths changed (`git status --short`), one new file (`src/lib/views/shared/forms/Followups.svelte`), one test file deleted (`tests/state/forms/followup-values.test.ts`).

## Not done

- No test, check, lint, format or type check was run after Axel's order "NO running tests. Not a single one. NOT EVER" (2026-10-21). Before that order these ran: `tests/server/edit/writes.test.ts` with `tests/routes/edit/undo/undo.test.ts` (108 passed), `tests/server/core/changes.test.ts` (18 passed), `tests/routes/docs/wallpaper.test.ts` with `tests/routes/docs/memories.test.ts` (10 passed), `tests/data/snapshot/normalise.test.ts` (2 passed after its expectation gained the note keys), and svelte-check (0 errors, before the layout changes). The layout changes, the follow-up docs and the comment edits after those runs have not been run.
- The first run of the changed tests on the unchanged tree was not taken.
- At landing, in the hub (Axel's uncommitted edits in those files kept): the six `followup:` values rewritten into the list form (the hccnet-fl and linfoot `project.yml`, `applications.yml` entries 0 and 1, `funding.yml` entry 1, `education.yml` entry 0), and the `followup` field lines removed from the hub's collection schemas (events, education, applications, joint-work, funding, tasks).
- At landing, in the ledger: `agents/guarded.md` G8 and G9 take the new test titles, and line 212 drops the `followup-values.test.ts` clause.
- The look on TEST: Axel's server runs main, so the look is taken after the landing.

## What changed, by ruling

1. Ruling 198, subtask edit: the `subtask` write takes the actions `do` and `deadline`; each subtask line has an Edit control that turns it into a form with its text and deadline (`Subtasks.svelte`).
2. Ruling 197, follow-ups as a list: `followup:` is a list of `{ do, after }` notes on a manifest and a collection entry. New write kinds `followup` (actions `done`, which takes the note out, `do`, `after`) and `followup-add`, built on the subtask line editor (`entry-edit/subtasks.ts` takes the block name), with undo, History words, the change log and the app gate. The cards draw a Follow-ups block that adds, edits and marks each note done (`Followups.svelte`, in `ProjectCard.svelte` and `EntryCard.svelte`). Quick Add appends a note. The project form no longer edits follow-ups (the field is `keymap`, read-only). The reader takes only a list of `{ do, after }` maps, and the YAML writer's single-note shorthand (`noteMapOf`, `replaced`, `putBackNote`, `insertReplaced`) is removed.
3. Ruling O47 recursive: `images()` lists pictures in every folder under the memories and wallpaper folders, by path relative to the folder, dot folders skipped and folder links not followed; `stream` accepts such a path (`isFilePath`) and still refuses `..`, dot parts, empty parts and an absolute path. A scratch run (`npx tsx` over a planted folder) listed `a.jpg`, `sub/b.png`, `sub/deeper/c.webp`, served the two in subfolders with 200, and answered 404 for `.hidden/d.jpg`, `sub/../a.jpg`, `../outside/s.jpg`, `//a.jpg`, a path through a looping link and `/etc/passwd`. Uploads still go into the wall folder itself.
4. Ruling O47 Focus lines: a funding scheme's deadline and follow-up lines open the Funding view, a conference call opens the Venues view, and the follow-ups of an entry whose status is terminal with `live_subtasks` (the status `ongoing`) show as its subtasks do.
5. Ruling 199, layout: the Files view's workspace header has the same line over it as the other section heads (`Tree.svelte`, `.head`), and Bookmarks and Notes lose the extra 6 px above them (their `margin-top` removed); the source editor and the terminal draw their Pane body without its 10 px / 12 px inset (`Pane.svelte` gains `flush`, passed by `Source.svelte` and `Terminal.svelte`). Measured on the page before the change: section heads 27 px apart, 33 px above Bookmarks and Notes; the editor 12 px in from the pane on each side.

## Docs

`docs/apps.md` write table (the new subtask actions, `followup`, `followup-add`), `docs/data-map.md` (the follow-up list), `docs/templates.md`, `config/defaults/sources.yml` and the wallpaper finding texts (file paths in subfolders), the `live_subtasks` help in `vocab.ts` and `vocab.yml`.

## Review findings, closed in the worktree

The review (agents/reviews/O47-refuter.md) was answered by edits in the worktree, with no run, after Axel's order against tests.

- B1, B8: `holds(dir, path)` in `server/content/images.ts` answers whether a path names a picture `images` lists: every folder on the way is checked with `lstat` and must be a real folder, not a link, and the end must be a regular file with a picture extension inside the folder. `stream` and the wallpaper's `named()` use it, so a request cannot cross a folder link and a wallpaper thumbnail no longer walks the whole folder.
- B2, S7 (reader), S4: `followups()` in `data/snapshot/normalise-parts/plans.ts` reads only a list of `{ do, after }` maps, keyed by position; a string or a single map holds no note. `entryFollowups` in `state/boards/collection.ts` calls it, so there is one reader. The generated schemas hold a `followup` field to that list by its name (`schema/record.ts` `fieldSchema`), so a manifest or a collection entry whose `followup:` is anything else gets a schema finding. The manifest's map groups (`status`, `code_availability`, `repository`, `reproduced`) take only a map or an empty key; no manifest in the hub or the workspace writes one as text or a list (checked over 114 hub manifests and 7 workspace manifests with a Python read of each).
- B3: the read-only line of a source tab (`LockedCode.svelte`) has 4 px / 12 px padding and the terminal start form (`TerminalStart.svelte`) 6 px top and sides.
- B4: the `Tree.svelte` comment names both headers that take the line, the Files workspace header and the Notes head.
- B5: the card shows "not until" only while the note's date is after today, the same test as the Focus board (`daysUntil`).
- B7: follow-up writes refuse in their own words (`server.edit.no_followup`, `followup_not_flow`, `followup_no_do`, `followup_needs_do`, `followup_block_is_map`), chosen per block in `entry-edit/subtasks.ts`; `not_scalar` reads "a field of the line takes ...". The Focus board's follow-up Done has the card's title, "done; takes the note out".
- S1, S5: the long code lines are split and the edited comments rewrapped at 100 columns; the two blank lines in `ticker.ts` are one.
- S2: removed `fs: { primary, roots }` in `Editor.svelte`, `openAtKey` (`entry-file.ts`), `findKey` (`draft-entry.ts`), `keyPlace` (`collection-text.ts`), the `link` prop of `EntryForm.svelte` and `ui/forms/Field.svelte` with its style, and the `FollowupAction` re-export of `writes.ts`.
- S3: removed `REFUSALS.commentInValue` and `noteNotText` with their catalog lines.
- S6: the `ReplacedText` doc in `server/core/changes.ts` no longer names the removed manifest rewrite; `schema/hub.ts` names the three fields oculus writes.
- S7 (view): the add and edit forms of `Subtasks.svelte` and `Followups.svelte` are one component, `views/shared/forms/LineForm.svelte`.
- S8: the local `name_` is `word`.
- `tests/data/snapshot/normalise.test.ts` writes its follow-up input as a list of maps.

Behaviour the report did not state before: a Memories tile's label, title and alt text carry the picture's path under the wall folder (`sub/deeper/c.webp`), and the wall is ordered by that path, so a subfolder's pictures sort by the folder's name among the top-level ones (B6). Every Memories listing walks the whole folder tree and reads each picture's head.

Left for the landing: the bullets of the help page for the follow-up list, the subtask edit and the recursive folders go into `docs/HELP.md`, which exists once O39 part D has landed.

