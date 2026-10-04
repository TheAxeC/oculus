# Brief: X3e, the Files view's lists reordered by drag and by key, the Files tree following the disk, nested repositories found to a configured depth, and the owed Files and Source Control defects

Read `tools/oculus/.scratch/migration/agents/spec.md` first; its rules govern this step unchanged. Then, in full, the files this brief names under "Read, with sections or line ranges". No ADR touches the step: `ls docs/adr` fails and `.agents/plan.yaml` has no `adr:` key (`grep -n '^adr' .agents/plan.yaml` prints nothing).

A design ruling decides what is built. It never exempts the code: every line is written to the standards pages, so that people can read, use and maintain it.

## The plan line (`plan.md:193-197`) and the rulings it names

"X3e the Files view's lists reordered by drag as VS Code's: the roots (written to the workspace in force, `sources.yml` for the default one), the folder bookmarks (written to `~/.oculus/bookmarks.yml`, the rail menu following), the notes and the view's sections; a second Collapse Folders press, with no folder under a root open, closes the roots, as VS Code's `collapseAll` does; the Repositories view finding repositories nested under every root, repository roots included, to a configured depth (Z269); the open-editors list's dirty dot in a colour the colour rule accepts (Z359)", widened by Z358 (a cut Focus ticker row gives its whole text as its tooltip), Z289 (X3a-1 to X3a-7, Q88c-1 to Q88c-14, Q88c-19 to Q88c-22, D27-3, D13a-5, A1-4, the hub Graph's 10 s wait) and Z311 (Cmd+A selects a tree's rows; Cmd+Enter opens a row to the side).

The rulings, as `choices.md` and `plan.md` Rulings hold them:

- Z263: the four lists reorder by drag as VS Code's Explorer does; a second Collapse Folders press closes the roots.
- Z269: nested repositories are found to a configured depth under every root, repository roots included, so `theaxec.github.io` inside the hub shows.
- Z284: the roots reorder within their group through a `roots` write action `order` (default workspace, `config/sources.yml`) and a `POST /api/fs` action `order-roots` (a named workspace, the saved workspaces file); the notes order is kept in `~/.oculus/notes/order.json`, a new note on top; the sections order is kept in the tab's instance state; Alt+Up and Alt+Down move the focused row of each list; the depth is `repository_scan_depth` in `config/sources.yml`, default 1, range 0 to 3.
- Z289: the owed-look defects listed below, each with its cause.
- Z311: Cmd+A selects a tree's rows; Cmd+Enter opens a row to the side.
- Z358: a Focus ticker row cut by its ellipsis gives its whole text as its tooltip.
- Z359: the Open Editors dirty dot takes a colour the colour rule accepts; widening the rule to accept `currentColor` is the lazy option and is not taken.
- Z438: G31 is widened: its Code line names `src/lib/server/files/fs/notes.ts` and its Test line one new case in the notes test file, 'refuses a write over an order file it cannot read, leaving it'.
- Z439: the shapes this brief adds stand as written: the `files` payload `{ root, folders?, bookmarks?, workspaces? }`, the notes order file `{ "version": 1, "order": [...] }`, the refusal codes `roots-changed` and `notes-order-unreadable`, the `POST /api/fs` fields `keys` and `ids`, the glyph `head` (ASCII `@`, lucide `target`).
- Z440: the `repository_scan_depth` reader throws naming the key, as its siblings in `data/sources/config/settings.ts` do, with one case in `tests/data/sources/config/settings.test.ts`.
- Z441: D27-3 is read at X3f's landing look; Q88c-22 is closed; the hub Graph's first read, X3a-1's 5 s Delete and Q88c-19's server half each go through `/diagnose` on an agent before X3e's builder starts, and a cause found joins this brief then.
- Z442: the write-token sentence of `server/core/auth.ts:97` is worded once in the server catalog, every route answering it changes with it, and every test assertion quoting the old words follows.
- Z443 (open, Axel's): G13 says a wrong config value is refused with a finding and its default used, while the setting readers of `data/sources/config/settings.ts` throw naming the key. This brief does not decide it; E1's reader throws as its siblings do (Z440).
- Z451: the move of an open editor within its pane by Alt+Up and Alt+Down is not built, since no ruling names it.
- Z452: X3e is prepared after D42 lands; this brief is closed against D42's write list now, and its premises are checked again on main at `/spec` once D42 has landed.

## What is on the tree (read on main at e354291af)

Paths are under `tools/oculus/` in the worktree `.agents/worktrees/X3e`. The base copy is `.agents/worktrees/X3e-base/tools/oculus/` (`src`, `tests`, `utils`, `config`), with `unused-exports.txt` beside it. No file under `src`, `tests` or `config` changed between ed0e6de58 and e354291af (`git diff --stat ed0e6de58 e354291af -- tools/oculus/src tools/oculus/config tools/oculus/tests` prints nothing). Every line number below is read at e354291af.

X3f has landed since, at b68058ce4 (`git log --oneline -1 b68058ce4`), and changed these files of this step's write list (`git diff -U0 e354291af b68058ce4 -- <file> | grep '^@@'`): `Tree.svelte` (:100-101, :194, so the row `<li>` and the style block move down 3 lines), `Source.svelte` (:42-46, :89-96, :300-305, :405), `fs.svelte.ts` (:165, :532-554), `RootedTree.svelte` (:70), `PaneView.svelte` (:10), `files.yml` (:149) and `source.yml` (:30). Under Z452 the step is prepared after D42 lands, and `/spec` then reads every premise and line number of this section again on main.

Files view, reorder and collapse:

- The tree's drag is `src/lib/views/shared/explorer/tree/control/dragging.svelte.ts` (135 lines; `draggable` at :54 requires `depth > 0`, so a root never drags; `over` :84, `dropped` :105) and `tree/drag.ts` (41 lines). `Tree.svelte:276-288` puts the drag handlers on each row's `<li>`, the `<ul class="rows">` at :266 carries `ondragleave={dragger.left}`, and the component's style block is :351-379. The drag types are `FILE_DRAG` and `FOLDER_DRAG` (`src/lib/state/sources/explorer/view/place.ts:174-180`). There is no `state/workbench/drag/` folder (`ls` fails).
- Which roots may move: `fixedRootKeys` and `fixedRootsOf` (`src/lib/state/sources/fs-transport.ts:87-125`). In the default workspace the movable roots are the keys `config/sources.yml` lists under `roots:` (cathedra, game-engine, ordo, scotoma, officium, youtube-downloader at `config/sources.yml:96-102`); the hub, the engine's config folder, the fallback folder and any root saved under the default workspace's own entry are fixed. In a named workspace the movable roots are the workspace's own (`fixed: false`); a tab following a session moves none.
- The roots write: `writeRoots(file, wanted, id?)` (`src/lib/server/edit/writes/config/roots.ts:140`) writes any order and keeps each item's text and padding; `addRootTo` :173 and `removeRootFrom` :184 call it. `RootsWrite` (`src/lib/server/edit/writes/bodies.ts:110-112`) and `rootsShape` (:280-283) hold `add` and `remove`; `config-write.ts:80-89` dispatches them.
- The named workspace write is `POST /api/fs` (`src/lib/server/files/fs.ts`): `ACTIONS` :487-494 (`add-root`, `remove-root`, `save-workspace`, `select-workspace`, `note-save`, `note-delete`), `fsBodyShape` (:500-508) holds text fields only, each read through `textShape = z.string().catch('')` (:425), so a field that is not text reads as the empty text; every action runs on the one write chain (`chained(into.writes, ...)`, :658).
- `writeRoots` rewrites the whole `roots:` block through `setItems` (`server/edit/list-edit.ts:113`), which writes each entry as one `- <item>` line (`listText`, :73-84), and keeps only entries that are a key and dir pair (`rootsOf`, `writtenItems`); its read-back check `kept` compares parsed values only, so a comment line or a malformed entry between the list's entries is dropped by an add or a remove without a refusal (read from `roots.ts:67-194`; case 92's first run on the unchanged tree confirms it with an add).
- Notes: `src/lib/server/files/fs/notes.ts` (125 lines); `listNotes` sorts newest first; `noteFile` accepts ids matching `^[A-Za-z0-9][A-Za-z0-9_-]{0,63}$` and refuses a link. `server/core/json.ts` has `readJsonChecked` and `writeJsonAtomic`. No test reads `notes.ts` (`grep -rln "fs/notes\|listNotes\|saveNote" tests` prints nothing), and G31's Code line does not name it until the orchestrator writes Z438's widening into `agents/guarded.md`. `tests/server/files` holds 8 items (`git ls-tree --name-only HEAD tools/oculus/tests/server/files/ | wc -l`).
- The client's refusal words: `refusal()` (`state/sources/explorer/acts/refusal.ts:11-24`) maps each code of `POST /api/fs` to a `files.refused_*` line and says any other code through `files.refused_other` ("The server refused that: {0}").
- Bookmarks reorder already exists as a collection write: `reorderEntries(collection, order)` (`src/lib/state/client/writes.svelte.ts:297`), `reorderCollection` (`src/lib/server/edit/writes/entries.ts:444`, refuses duplicate identities), `fileOrder` and `movedOrder` (`src/lib/state/boards/collection.ts:417`, `:437`).
- Sections: `Files.svelte` (321 lines) draws OpenEditors (:230), the note line (:234-236), Outside (:238), BookmarkForm (:246), the said line (:262-264), ShowPath (:265), Follow (:273), RootedTree with the workspace header (:287), then `Sections.svelte` (:295; 110 lines) draws Outline, Timeline, Bookmarks, Notes (:86-110). Each section component draws its own head: `OpenEditors.svelte:148`, `Outline.svelte:111`, `Timeline.svelte:144`, `Bookmarks.svelte:72`, `Notes.svelte:61` (`grep -rn "<Section" src/lib/views/sources/files`). Section heads are `views/sources/files/sections/Section.svelte` (68 lines) over `ui/tree/TreeSection.svelte` (94 lines). Open and closed state: `state/sources/explorer/sections/section-state.ts` (25 lines). The view state: `filesViewOf` (`state/sources/explorer/view/files-view.ts:176`, 230 lines).
- Collapse: `collapseAll` (`views/shared/explorer/control/tab-actions.ts:96-103`) closes every folder below each shown root through `collapseRoot` (`place.ts:161-165`) and leaves each root row open, whatever is open. `collapseRoot` filters `expanded` by key prefix, so it also drops the remembered folder keys under a root that is closed.
- Keys: the Files keymap `ENTRIES` (`state/sources/explorer/acts/keys.ts:40-57`) holds Cmd+A `select-all` (:54) and no Cmd+Enter; `keyed.ts` (`tree/control/keyed.ts`) carries the plans out. `ui/tree/TreeView.svelte:7-9` keeps Cmd+A and Ctrl+A the browser's, and `tree-keys.ts:133` sends a bare `a` as type-ahead. The Repositories changes tree has no selection model and no keymap (`grep -n "keymap\|selected" src/lib/views/sources/repositories/changes/Changes.svelte` names none for rows).

Files view, following the disk:

- `state/sources/fs.svelte.ts` (809 lines). Its head comment (:11-18) says nothing polls and a folder changed on disk is read again only by closing and opening it. `afterReceive` (:374-379) hears only a `files` message with `bookmarks`. `relistFolder(root, path, below)` :423, `readListing` :445-456 answers a held, unmarked listing without asking (the X3a-5 cause). `refresh(root, version)` :684-688 marks the listings, texts and file kinds held under one root key, once per version; nothing calls it (`grep -rn "fs.refresh\|\.refresh(" src/lib/state src/lib/views src/lib/shell` names no caller of the fs store's), and the head comment's paragraph at :31-34 names a Settings view caller that does not exist. `WORKSPACES` (:155) is marked by the store's own writes and by `invalidate` (:669-671, `queries.mark(ALL, ...)`), which only the Files view's Refresh calls (`Files.svelte:218`, `onrefresh={invalidate}`) and `ops.svelte.ts:549`; nothing marks it when `sources.yml` or the saved workspaces file changes on disk, so a root removed there stays drawn until a Refresh (the X3a-6 and Q88c-3 cause).
- The `files` channel: `FilesPayload = { root: string; bookmarks?: boolean }` (`data/model/model-sessions.ts:615`); the git watcher publishes `{ root }` on every re-read (`server/root/watch/git.ts:233-237`), where `root` is the watched directory's absolute path; `mergeFiles` (`server/files/files-channel.ts:8-14`) keeps the newest non-empty root and the bookmarks flag, and a subscriber that missed a message sees a version gap. The page checks the payload with `filesShape` (`state/client/payloads.ts:108-110`, `z.object({ root: z.string(), bookmarks: z.boolean().optional() })` through `unchangedAs`), a check that passes fields it does not name through unread. `docs.svelte.ts:205-215` and `terminal/commands.svelte.ts:320-330` follow the version-gap rule.
- `server/root/watch/git.ts` (505 lines): `relevant` :119 drops `.git/objects`, locks and every path through `IGNORED` (:80, `node_modules`, `.svelte-kit`, `build`, `__pycache__`); `heard` :300 rescans only on a top-level event of a non-repository root; `subrepositories` :144-155 looks one folder deep and returns nothing for a root that is a repository; `scan` :385, `wanted` :398, `follow` :418-447 reads new roots with a synchronous `statusFor`; the workspaces poll :479. Its head comment :26-31 states the one-deep rule. The watch callback (:337-339) drops the event type.
- The watcher is built at `server/root/context.ts:353-358` with `roots: () => repositoryRoots(...)` read at each call.
- The listing of a missing folder answers `{ error: 'missing' }` with 404 (`server/files/fs.ts:482`), and `listingAnswer` (`fs-transport.ts:280-293`) holds that as the listing's `error`.

Repositories view and Changes view:

- `openHead` (`state/sources/repositories/repositories.svelte.ts:431-437`) opens the index copy for a `changed` row (the Q88c-1 cause). `loadSourceDraft` (`state/sessions/source.svelte.ts:287-296`) returns at once for any draft already read in this lifetime (`:295`, `readIn === LIFETIME`), working files included; a working file is read again through `reloadSource` (:355), and nothing reads a head or index draft again (the Q88c-2 cause).
- `switchBranch` (`server/git/git-write.ts:353-366`) and `switchDetached` (:372-385) refuse any line of `git status --porcelain`, untracked `??` lines included (the Q88c-4 cause). Both end in a defaulted parameter, `roots: string[] = allowedRoots()`. Besides `git-write.test.ts` and `git-ops.test.ts`, five test files call the git action functions: `tests/server/git/refs/cherry-pick.test.ts`, `delete-branch.test.ts`, `detached.test.ts` and `tests/server/git/untracked/ignore.test.ts`, `trash.test.ts` (`grep -rln "server/git/git-\|server/git/deposit" tests`). `detached.test.ts:24`, 'detaches HEAD at a hash on a clean tree', is G33's test of `checkoutDetached`.
- `CommitBox.svelte:67-73` puts the prepared message in once and never takes it out (the Q88c-5 cause).
- 62 refusal literals in lower case (`grep -rn "failed(\`[a-z]\|failed('[a-z]" src/lib/server | wc -l`): `git-index.ts` 18, `git-write.ts` 14, `git-remote.ts` 4, `git-refs.ts` 4, `git-routes.ts` 1, `deposit.ts` 20, `deposit-git.ts` 1; beside them the `json({ error: '...' })` literals of `git-routes.ts` (:128, :242, :341, :365), `git-reads.ts` (:113, :214), `git-message.ts:75` and `deposit-routes.ts` (:97, :122, :160, :167, :191). That grep sees only a literal on the line of `failed(`; the sentences it misses are the multi-line `failed(` literals (`git-write.ts:255-256`, :512-513, :548-549, :580-581, `git-refs.ts:77-78`), the template `error:` literals (`git-routes.ts:341`, `deposit-routes.ts:122`), the sentences helpers return (`git-write.ts:181-182` and :186 in `checkPaths`, :749-751 in `checkName`, `git-refs.ts:106-107` in `tagName`, `deposit.ts:752-754` in `checkName`), `git-write.ts:143` and :147 (the action runner's 'git timed out' and 'git failed'), `git-message.ts:68`, :75 and :97 ('claude failed'), and `auth.ts:97` and :101, written as `?? '...'`. The read path answers sentences of its own through GET /api/git and the git state: `server/core/git/run.ts:158` and :162 ('git timed out', 'git failed'), the read refusals of `core/git/compare.ts`, `files.ts` and `reads.ts` (`'that is not a commit'`, `` `the path ${path} is not inside the repository` ``, `'git log failed'` and their neighbours), and `core/git/state.ts:117`, :146, :169 and :195, whose texts become `GitState.error`, drawn by `Repo.svelte:113` through `sessions.ch_failed` ('git could not read this repository: {0}', `config/text/views/sessions/changes.yml:70`) and as the row's tooltip (:186). No test asserts a read-path sentence (`grep -rnE "not inside the repository|that is not a (commit|reference|stash|branch)|git log failed|git status failed|git named no branch" tests` prints nothing). The lines a sentence literal can sit on are listed by `grep -rnE "['\`\"][a-z][a-z]* [a-z]" src/lib/server/git src/lib/server/core/git src/lib/server/core/auth.ts | grep -vE ":[0-9]+:\s*(//|/?\*)"` (every line holding a string literal that opens with a lower-case word and a space, comment lines left out); it also prints git arguments and parse prefixes (`parse.ts:547-554`), which are not sentences. The conflict sentence is `git-write.ts:581`. The plural "{0} files are in conflict" is `config/text/views/sources/repositories.yml` `merging` (:123), `rebasing` (:135), `cherry_picking` (:231) and `config/text/views/sessions/changes.yml:30` `commit_unmerged` (the Q88c-6 cause), read by `Repo.svelte:130-132` and `CommitBox.svelte:78`. The server words lines through `words(catalog, key, ...)` (`server/core/words.ts`), with the catalog from `textCatalog(config)` passed in, as `config-value.ts:138-166` does. The refusal sentences of `config/text/server.yml` (`server.config_key` and `server.config_value`, :24-54) start with a capital and end with no full stop.
- The write token: `tokenedBody(request, token, shape)` (`server/core/auth.ts:89-103`) answers 403 with `shape.words?.token ?? 'the write token is missing or stale'` (:97) and 400 with `shape.words?.json ?? 'the body is not JSON'` (:101). It has 13 call sites (`grep -rn "tokenedBody(" src/lib`, the definition left out), one of them `gatedBody` (:114), which 5 routes call (`grep -rn "gatedBody(" src/lib`): 18 routes in all. `gatedBody` and the three file routes (`fs.ts:646`, `fs/ops.ts:674`, `fs/picker.ts:97`) pass words of their own, refusal codes (`forbidden`, `bad body`, `token`, `not-json`); the nine others answer the two default sentences: `handleLatexPost` (`server/content/latex/endpoint.ts:274`), memories' `add` (`server/content/memories.ts:164`), `handleWrite` (`server/edit/writes.ts:274`), `handleOpen` (`server/files/open.ts:350`), `handleSource` (`server/files/source.ts:150`), `handleDeposit` (`server/git/deposit-routes.ts:182`), `handleGit` (`server/git/git-routes.ts:355`), `handleCommandsPost` (`server/machine/commands/routes.ts:90`) and `handleTerminal` (`server/machine/pty/routes.ts:495`). Three test assertions quote the token sentence (`grep -rn "missing or stale" src tests config --exclude=local.yml`): `tests/server/core/auth.test.ts:27`, `tests/routes/edit/write.test.ts:27` and `tests/routes/git/git.test.ts:60`; `write.test.ts` is in `tests/tiers/essential.txt`. No test asserts 'the body is not JSON'. `GitOptions.config` (`git-routes.ts:175-176`), deposit's `deposit.config` and `CommandsOptions.configFor` (`commands/routes.ts:33-34`) already carry the request's configuration, and `target()` (`writes.ts:226`) builds `handleWrite`'s target from the merged configuration; `handleLatexPost`, `add`, `handleOpen`, `handleSource` and `handleTerminal` take none.
- `changeGroups` (`state/sources/repositories/change-tree.ts:209-220`) keeps an empty `changed` and `untracked` group, and `Changes.svelte:213-216` and `ChangeGroups.svelte:143-144` draw `sessions.ch_group_empty` ("nothing", `config/text/views/sessions/changes.yml:71`) under it (the Q88c-7 cause).
- Graph: `CommitRow.svelte:75-83` builds one pill per name, each drawn whole (`flex: none`), so they take the row (Q88c-8). `Graph.svelte:358` and `:417` pass `count={commits.length}`, which is 0 until the section is opened (Q88c-9). `RepoList.svelte:103-106` names a detached HEAD with `sessions.ch_detached` and nothing marks HEAD's commit (Q88c-10). `commitMenu` (`views/sources/repositories/menus/graph-menu.ts:76-118`) offers Checkout (Detached) and Cherry Pick on every commit (Q88c-11). `git.log[0]` is HEAD's newest commit (`server/core/git/state.ts:205`, `git log -N` with no ref).
- `worktreeLabel` (`state/sources/repositories/repositories.ts:495-498`) answers the whole path for a worktree outside the worktrees folder (Q88c-12). The New worktree `TextInput` (`views/sources/repositories/refs/Worktrees.svelte:212`) has no `onenter` (Q88c-13). `pickerRoots` (`repositories.ts:580-582`) keeps every root with a state, so a deleted session workspace stays listed as "no repository" (Q88c-14). `openWorktree` (`repositories.ts:870-880`) calls `showInFiles(dir)` with an absolute folder and no root, which Files reads under the hub root (Q88c-20). `repositories.ts` is 880 lines, at the limit (`wc -l`).
- `ChangeGroups.svelte` (338 lines): rows are a `div.file`, the path a `<span class="pa">` cut at its end (:154, :308); the row has no press and no Open File (D13a-5, A1-4). `ChangesTouched.svelte:51` cuts the path at its end (X3a-7). `views/sources/repositories/changes/ChangeRow.svelte` already shows the name first with the folder as detail.

Other:

- Palette: `commands()` (`state/workbench/palette.ts:276-292`) holds literal hints and no description (Q88c-21). `shell/keys/Palette.svelte` is 523 lines, over the 520 rule (`wc -l`).
- Ticker: `ui/display/Ticker.svelte:304-320` (`button.name`) and :322 (`span.name.plain`) carry no `title` (Z358).
- Open Editors: `.dirty` (`views/sources/files/sections/OpenEditors.svelte:250-256`) fills with `background: currentColor`, the one such declaration under `src` (`grep -rn "background: currentColor" src`). `spec.md:48` says only that colours come from `themes/tokens.css`; the finer rule, `currentColor` allowed for `color` and only a surface, a hue, its tint or its lane surface for `background`, is the head comment of `tests/ui/theme/colours.test.ts` (`git show 2af5d443a^:tools/oculus/tests/ui/theme/colours.test.ts`, lines 12-18), a test 2af5d443a deleted, so nothing checks the rule now. `TabFace.svelte:157-159` draws the same mark as `<Glyph name={t('ui.dirty_glyph')} />`.
- Folder panel: `server/files/fs/picker.ts` answers `busy` while its panel is open and `{ ok: true, paths: [] }` on a cancel; the client's lines are `pickerLine` (`state/sources/explorer/acts/folders.ts:78-84`), among them `files.picker_busy: The folder panel is already open.` (`files.yml:145`); the note line is cleared only by `newItem` (`tab-actions.ts:105-110`) and the bookmark actions (X3a-4).
- The breadcrumb row that pushed the tree down (X3a-2) is gone from the Files view: X3c (1e14d2799) took `Breadcrumb` and `crumbsOf` out of `Files.svelte` (`grep -n "Breadcrumb\|crumbsOf" src/lib/views/sources/files/Files.svelte` prints nothing), and the crumbs sit on the file tab's strip (`shell/panes/strip/tab-crumbs.ts`). What still pushes the tree down is the same defect in the message lines above it (the note line, the said line, ShowPath's reveal line), which C4 ends.
- Tabs: the `Tab` type is `ui/tabs/tab-strip.ts:8-36`; `PaneView.svelte:183-213` builds each tab, `tabHint` is `shell/panes/pane-view.ts:421-427`.
- Glyphs: no `head` glyph exists; `lucide-static` holds `target.svg` (`ls node_modules/lucide-static/icons/target.svg`).
- Config readers: `data/sources/config/settings.ts` (297 lines) holds the setting readers, each throwing a sentence naming its file and key, a missing key included (`settingOf`, :73-83, reads `block[key]` through its shape); `server/edit/writes/config/config-checks.ts:104-118` READERS; the start check `server/root/context.ts:282`; `config/catalogs/options.yml` holds `sources.yml`'s `roots` at :680. The `roots:` list of `config/sources.yml` is :96-102, the `languages:` block's comment follows at :105.
- Palette group: the palette's lines are the group `app.palette` (`config/text/app.yml:17-29`, read as `t('app.palette.cmdk_placeholder')`), which already holds `cmd_unknown`. The `theme` command's hint is built from the configured themes (`palette.ts:280`, `` `<${themes.join(' | ')}>` ``); `crt`, `help`, `update` and `folder` have no hint.

Folder counts (`git ls-files <d> | sed "s|^<d>/||" | cut -d/ -f1 | sort -u | wc -l`): at 10, full: `state/sources`, `server/files`, `server/git`, `ui/tree`, `ui/display`, `state/workbench`, `shell/panes`, `state/sessions`, `views/sources/source`. With room: `state/sources/explorer/acts` 8, `state/sources/repositories` 9, `views/shared/explorer/tree` 9, `data/sources/config` 9, `server/core` 9, `views/sources/files/sections` 8, `shell/keys` 7, `server/files/fs` 7, `views/shared/changes` 5, `tests/server/files` 8.

## What to build

### A. Reorder by drag and by key (Z263, Z284)

A1. **Roots.** A movable root row (item "Which roots may move" above) is draggable in the Files tree. It carries a new drag type `ROOT_DRAG = 'application/x-oculus-root'` (beside `FOLDER_DRAG` in `place.ts`), holding the dragged root keys, and `text/plain` holding the dirs. Over a movable root row of the same group, the drop place is `before` when the pointer is in the row's upper half and `after` in its lower half, drawn as a 2 px line in `var(--accent)` on that edge of the row (`data-drop-place="before|after"` on the `<li>` in `Tree.svelte:276-288`, styled in the component's style block, :351-379). Over any other row, over a fixed root, over itself, or from another tree, the drag answers `dropEffect = 'none'` and draws nothing. Below the last row (over the `<ul class="rows">` at `Tree.svelte:266`, under its last row), the roots go last. Several selected roots move together in their current order; a drag that starts on a root and holds files moves only the roots. A file or folder dragged onto a root row is the tree's existing move, unchanged. The work lives in `dragging.svelte.ts` (`draggable`, `started`, `over`, `dropped`, `ended`, `left`), and the order arithmetic in a pure module `state/sources/explorer/acts/reorder.ts`: `dropPlace(rect, clientY): 'before' | 'after'` and `reorderedKeys(order, moving, target, place): string[]`, answering the order unchanged when the drop is on itself or leaves every key in place.
A2. **The roots write.** The default workspace writes through `/api/write` `{ kind: 'roots', action: 'order', keys }`: `RootsWrite` and `rootsShape` gain the member, `config-write.ts:80-89` dispatches it to a new `orderRootsIn(file, keys)` in `roots.ts`, which reads the list (`rootsNow`), refuses `roots-changed` unless `keys` names each listed key exactly once, and calls `writeRoots(file, keys.map(...))`, so the undo record is the one `writeRoots` already makes. `writeRoots` itself refuses `invalid`, writing nothing, when the source lines of the `roots:` list hold a line that is neither one of its key and dir entries nor blank (a comment line, a malformed entry), so no add, remove or order drops a line the reader wrote; the client says that refusal with `files.refused_roots_invalid: The roots in config/sources.yml cannot be rewritten without losing a line, so the file is left as it is.` An `order` body whose `keys` is absent, not a list or holds a non-text item does not parse as a roots write and gets the route's answer for a body it does not know (`writes.ts:510`). A named workspace writes through `POST /api/fs` `{ action: 'order-roots', keys }`: `ACTIONS` gains `order-roots`, `fsBodyShape` gains `keys: z.array(z.string()).catch([])`, the list of text it came as and the empty list for anything else, as `textShape` reads the text fields, and the action reorders the workspace in force's own roots in the saved workspaces file through the existing load and save path, refusing `roots-changed` the same way and `no-such-workspace` when no named workspace is in force. The client sends either through `fs.svelte.ts` (`orderRoots(keys)`, choosing as `addRoot` does at :785-792 through `inDefault()`), and marks `WORKSPACES` after the answer, ok or not. `refusal()` (`state/sources/explorer/acts/refusal.ts`) gains `roots-changed`, with `files.refused_roots_changed: The roots changed since this list was read; it has been read again.`, and `invalid`, with `files.refused_roots_invalid` above.
A3. **Bookmarks.** A Bookmarks row drags over another Bookmarks row with the same before and after rule; a drop computes `fileOrder` then the moved order and sends `writes.reorderEntries('bookmarks', order)`, then marks the bookmarks (`bookmarksChanged`), so the rail's bookmark menu, which reads the same file, follows. A refusal of the write (duplicate labels, the file unreadable) is said in the Files view's message line (item C4) in the existing collection-refusal words. A missing bookmark (its folder gone) drags like any other.
A4. **Notes.** A Notes row drags over another Notes row the same way. A drop sends `POST /api/fs` `{ action: 'order-notes', ids }` (`ACTIONS` and `fsBodyShape` gain `order-notes` and `ids: z.array(z.string()).catch([])`, read as `keys` is). `notes.ts` gains `readNoteOrder(dir)` and `writeNoteOrder(dir, ids)` over `<notes dir>/order.json`, `{ "version": 1, "order": [ids] }`, read with `readJsonChecked` against that shape and written with `writeJsonAtomic` on the existing write chain; the folder is made when missing, as a note save makes it; an id that fails `noteFile`'s rule or names no note is dropped on write, and an id named twice is kept once, at its first place; a list that names no note after that is refused `no-such-note` and writes nothing; a link at `order.json` is refused as `noteFile` refuses a link; a file that does not read, or reads as JSON of another shape (another `version`, an `order` that is no list of text), is refused with `notes-order-unreadable` and left as it is. `refusal()` gains `notes-order-unreadable`, with `files.refused_notes_order_unreadable: The file that keeps the order of the notes cannot be read, so it is left as it is.` `listNotes` answers the notes in this order: the notes the order file does not name, newest first (so a new note is on top), then the named ones in the file's order. A file that does not read lists newest first and the list says nothing more; the refusal shows only on a reorder.
A5. **Sections.** Every section head of the Files view drags over another section head: Open Editors (`editors`), the tree (`files`), Outline, Timeline, Bookmarks and Notes. `FilesView` gains `sections: string[]`, the order drawn; `filesViewOf` reads it, keeping known ids once in the saved order and appending any missing one in the default order (`editors`, `files`, `outline`, `timeline`, `bookmarks`, `notes`), so an older saved layout and a corrupt value both draw the default (G29). `Files.svelte` and `Sections.svelte` draw the six in that order (`Sections.svelte` takes the order and two snippets for the editors and the tree from `Files.svelte`). The tree's section drags only while its head is drawn (`headed`, `Files.svelte:136`); in a following or rooted tab it keeps its place in the order and is no drop target. `TreeSection.svelte` gains optional drag props (`draggable`, the four handlers, and `dropPlace`) on its head; `Section.svelte` passes them through, each of the five section components that draws its own head (`OpenEditors.svelte:148`, `Outline.svelte:111`, `Timeline.svelte:144`, `Bookmarks.svelte:72`, `Notes.svelte:61`) passes them to its `<Section>`, and the workspace header row takes the same through `RootedTree.svelte`.
A6. **Keys (Z284).** Alt+Up and Alt+Down move the focused row one place within its list: a movable root, a bookmark, a note and a section head. An open editor row is not moved by them (Z451). The move writes as a drop does and keeps the focus on the moved row. At the list's end the key does nothing. A fixed root, a row of a following tab and a missing-key row do nothing. The Files keymap gains `{ code: 'ArrowUp', alt: true, action: 'move-up' }` and `{ code: 'ArrowDown', alt: true, action: 'move-down' }`; the section head, bookmark and note rows take the same chords through their own `onkey`.
A7. **Drag end.** Escape during a drag cancels it as the browser does; `ended` and `left` clear every drop line. A drop that leaves the order unchanged writes nothing. A drop whose write is refused leaves the list as the server holds it and says why.

### B. Collapse Folders (Z263)

B1. An open folder, for this item, is a folder key in `expanded` that is drawn: its root's key and the key of every folder above it are in `expanded` too. `collapseAll` (`tab-actions.ts:96-103`) first does what it does now, which also drops the remembered folder keys under a closed root. When, before the press, no folder below any shown root was open in that sense, the same press also takes the shown roots' own keys out of `expanded`, as VS Code's `collapseAll` does when no expanded root has an expanded child. A closed root's remembered folders are not drawn, so they never count as open. In a rooted tab (one root drawn from a folder) the second press does nothing more. Under a filter the press acts on `expanded` as now.

### C. The Files tree following the disk (X3a-1 to X3a-6)

C0. **The page's check of the payload.** `filesShape` (`state/client/payloads.ts:108-110`) gains `folders: z.array(z.string()).optional()` and `workspaces: z.boolean().optional()`, so a `files` message whose `folders` or `workspaces` is malformed fails the check as one with a malformed `root` does.
C1. **What the channel carries.** The git watcher collects, per root, the parent folder (relative to the root, `''` for the top) of each event `heard` takes within the throttle window, before the `relevant` filter for the folders and after it for the git re-read: an event under an `IGNORED` folder adds its folder and touches the root's timer so the folders are published, without a git re-read when no relevant event came. `reread` publishes `{ root, folders }` with the collected folders, or `{ root }` (the whole root) when more than 64 folders came in the window. `FilesPayload` becomes `{ root: string; folders?: string[]; bookmarks?: boolean; workspaces?: boolean }`. `mergeFiles` keeps both flags whenever either message carries one (`bookmarks` and `workspaces` alike), and for the root and folders: a message with the empty root (a bookmarks or workspaces message) takes the other message's root and folders as they are; two messages naming the same root union their `folders`, and drop `folders` (the whole root) when either names none; two messages naming different roots keep the newest message's root and folders, since the subscriber sees the version gap. The workspaces poll (`git.ts:479`) also publishes `{ root: '', workspaces: true }`, and a `config` message read by the watcher publishes the same.
C2. **What the fs store does with it.** `afterReceive` hears every `files` message newer than the last one heard. For each served root whose `dir` holds the message's `root` folder, or is held by it, it relists the folders named, mapped to paths under that served root (`relistFolder(key, path)`), or, when `folders` is absent, marks the whole served root through the existing `refresh(key, version)` (:684-688) with the message's version, which re-reads its listings, texts and file kinds once per version. A version gap calls `refresh` for every served root and marks `WORKSPACES` and the bookmarks, since a missed message may have carried either flag. `workspaces: true` and a `config` channel message mark `WORKSPACES` and the bookmarks. The head comment (:11-18) is rewritten to say what follows the disk and why no poller is needed, and its paragraph on `refresh` (:31-34) and `refresh`'s doc comment name the `files` channel as its caller.
C3. **A deleted file's tab (X3a-3).** The fs store answers `gone(root, path): boolean` from the listing of the file's folder under `{ hidden: true, ignored: true }`, read through the listing query: true when that listing answered without error and holds no entry of the name, or answered `missing`. A held listing that a `files` message relists answers anew. `Tab` gains `gone?: boolean`; `PaneView.svelte:183-213` sets it for a tab whose file (`fileOfTab`) is gone; `TabFace.svelte` draws a gone tab's label struck through in `var(--c-red-txt)` and `tabHint` adds the line `ui.tab_deleted: Deleted`. Open Editors draws the same for its row. A file put back clears it.
C4. **The lines above the tree (X3a-2, X3a-4).** The breadcrumb row X3a-2 named is gone from the Files view (item "The breadcrumb row" above); the message lines push the tree down the same way, and this item ends that. The note line, the said line and ShowPath's reveal line draw as one message line laid over the foot of the Files view (absolute, above the Sections, never pushing a row), with a close control (`ui/` `ToolButton`, glyph `dismiss`, `config/catalogs/glyphs.yml:32`), cleared by the close, by Escape in the view and by the next action that sets or clears the note (every `answerAt` and `patch` that acts). The bookmark form's outcome line uses the same place. The report's before and after names, for the look, that no tree row moves when a line shows or clears.
C5. **Reveal reads fresh (X3a-5).** `readListing` gains an option `fresh` that skips the held answer; `resolveReveal` (`reveal.ts:52-73`) reads each folder on the way fresh once before it answers that a part is missing.
C6. **Removed roots leave (X3a-6, Q88c-3).** Covered by C1 and C2: a root taken off `sources.yml` or the saved workspaces file leaves the tree at the next poll or config push, and a path the hub's root holds opens in a tab again.

### D. Source Control defects

D1. **Open File (HEAD) (Q88c-1).** `openHead` opens the HEAD copy (`stage 'head'`) for a staged and a changed row. The `index` stage stays readable for a saved tab (G29).
D2. **A head or index tab follows git (Q88c-2).** `source.svelte.ts` gains `reloadHead(id)`, which reads the head or index draft again; `Source.svelte`'s load effect calls it when the git state's signature for the tab's file moves: HEAD's commit (`git.log[0]?.hash`) for a HEAD tab, and the file's staged and unstaged entries for an index tab.
D3. **Switch with untracked files (Q88c-4).** `switchBranch` and `switchDetached` ignore `??` lines in their dirty check; git itself refuses a switch that would overwrite an untracked file, and that refusal is answered with git's own message under the catalog's sentence (D5).
D4. **The prepared message (Q88c-5).** `CommitBox.svelte:67-73`: when the prepared message goes back to empty (the merge, rebase or cherry-pick ended or was aborted) and the field still holds the offered text unchanged, the field is emptied and `offered` reset.
D5. **The server's sentences (Q88c-6, Z442).** Every sentence the git and deposit routes answer, POST and GET, the git state's error and `auth.ts`'s two move into `config/text/server.yml` under `server.git`, `server.deposit` and `server.auth`, each starting with a capital and ending with no full stop, as the refusal sentences of `server.yml` do (:24-54), and each worded through `words(text, 'server.git.<key>', ...)` with a literal key (G24). The inventory is every sentence the premises name: the 62 single-line `failed(` literals and the `json({ error })` literals, the multi-line `failed(` literals, the template `error:` literals, the sentences the helpers return, the action runner's 'git timed out' and 'git failed' (`git-write.ts:143`, :147), `git-message.ts`'s three, the confirm sentence (`git-routes.ts:128`), the read path's sentences (`core/git/run.ts:158` and :162, the read refusals of `core/git/compare.ts`, `files.ts` and `reads.ts`, `core/git/state.ts`'s errors) and `auth.ts:97` and :101. A sentence that opens with a placeholder (`stoppedOn`'s `${what} stopped on conflicts`, `git-write.ts:580-581`) takes a capitalised word for it from the catalog.

The catalog reaches each function that words a sentence as `text: Record<string, string>`, as `config-value.ts:138` takes it: as the last parameter, or right before the first defaulted parameter in a function that ends in one (`switchBranch(root, name, roots = allowedRoots())` and its neighbours), since a required parameter cannot follow a defaulted one. Every caller passes it, and so does every test that calls such a function. `handleGit` builds it once per request with `textCatalog(options.config)` (`git-routes.ts:175-176`) and passes it through `OPERATIONS` and to the GET reads; `handleDeposit` builds it from `options.deposit.config`, which `src/routes/api/(git)/deposit/+server.ts` already passes. On the read path, `core/git/run.ts` sets `text` to git's own words, or to the empty text where it now writes 'git timed out' or 'git failed' (`answered` already says that a run timed out or was killed); each core reader that answers a failed run words an empty reason as `server.git.timed_out` when the run did not answer and `server.git.failed` otherwise, and its own refusals through `server.git.<key>`; `statusFor` takes the catalog from the git watcher (`make.watchGit`, `context.ts:354-358`), which is handed `textCatalog(config)` read at start and the catalog of each later config push, as the processes poller is handed `processesText` (`context.ts:418`, through `liveSettings` at :406); `context.ts` is in the paths. A sentence that carries git's own output gives it after the catalog sentence through `server.git.git_said: '{0} (Git said: {1})'`. The Repositories row's failure line is capitalised with it: `sessions.ch_failed: 'Git could not read this repository: {0}'` (`config/text/views/sessions/changes.yml:70`).

The write token's sentences (Z442) are `server.auth.token_refused: The write token is missing or stale` and `server.auth.body_not_json: The body is not JSON`. `RefusalShape` (`auth.ts:78-82`) gains `text: () => Record<string, string>`, the catalog read only when a refusal is worded, and its type takes either `words` or `text` (a union, so a call naming neither does not compile); `tokenedBody` words its two sentences from `text()` when the shape names no `words`, and the literals at :97 and :101 go. `gatedBody` and the three file routes keep the codes they pass as `words`. The nine routes that answer the sentences pass `text`: `handleGit` and `handleDeposit` the catalog above, `handleCommandsPost` one read through `configFor()`, `handleWrite` one its target carries (`target()` builds it from the merged configuration, `writes.ts:226`), and `handleLatexPost`, memories' `add`, `handleOpen`, `handleSource` and `handleTerminal` one their route file builds as `() => textCatalog(locals.config().config)`, as a member of the options object a handler takes, or, for a handler with positional parameters, as the parameter right after `token`. Every test file that calls one of the nine handlers passes it, and the three assertions that quote the token sentence (`tests/server/core/auth.test.ts:27`, `tests/routes/edit/write.test.ts:27`, `tests/routes/git/git.test.ts:60`) follow the new words.

The client catalog gains a singular line for each conflict count, picked when the count is 1 by `Repo.svelte:130-132` and `CommitBox.svelte:78`:

- `repositories.merging_one: A merge is in progress. 1 file is in conflict.`
- `repositories.rebasing_one: A rebase is in progress. 1 file is in conflict.`
- `repositories.cherry_picking_one: Cherry-picking. 1 file is in conflict.`
- `git.commit_unmerged_one: '1 file is still in conflict; resolve it before committing.'`
D6. **Empty groups (Q88c-7).** `changeGroups` drops an empty `untracked` group as it drops merge and staged; `changed` (Changes) keeps its head with no rows, as VS Code's does. The "nothing" row is removed from `Changes.svelte:213-216` and `ChangeGroups.svelte:143-144`, which hides empty merge, staged and untracked groups the same way; the key `sessions.ch_group_empty` is removed when nothing reads it.
D7. **Graph pills (Q88c-8).** The first pill keeps its name, cut with an ellipsis at 100 px; every other name is drawn as glyph only, grouped by kind (local, remote, tag) with a count when more than one, each group's names in its tooltip. The subject keeps at least the remaining width (`flex: 1 1 auto; min-width: 4ch`).
D8. **Graph count (Q88c-9).** The Graph section head draws no count, as VS Code's does; `count` is removed from the two heads at `Graph.svelte:358` and `:417`.
D9. **Detached HEAD (Q88c-10).** The repository row names a detached HEAD by the first 8 characters of HEAD's commit (`git.log[0].hash`), with `sessions.ch_detached` in its tooltip. The graph row of HEAD's commit carries a pill with a new glyph `head` (`config/catalogs/glyphs.yml` `head: "@"`, `icons.yml` `head: target`) and the short hash, first among its pills, whether or not HEAD is detached.
D10. **Commit menu (Q88c-11).** Cherry Pick is not offered on a commit HEAD contains (a row of the log or of the outgoing list); Checkout (Detached) is not offered on HEAD's own commit while HEAD is detached. VS Code offers both everywhere; this is kept as an oculus improvement.
D11. **Worktree rows (Q88c-12, Q88c-13).** `worktreeLabel` answers the worktree folder's last name for every path, with the whole path as the row's tooltip. The New worktree field submits on Enter (`onenter={made}`).
D12. **Stale repositories (Q88c-14).** `pickerRoots` keeps a root whose state is `missing` or `none` (no repository) only when it is a served root's `dir`; a session's workspace that is gone or no repository is not listed.
D13. **Open Worktree (Q88c-20).** `WorktreeOpening` gains `rootOf(dir): Promise<string | null>`, the served root key whose `dir` equals the folder, read after the add through a new awaited `fs.workspacesNow()`; `openWorktree` shows the root with `showInFiles('', key)`, and says the existing `repositories.worktree_open_failed` when no root holds it. To stay at 880 lines, `repositories.ts` moves its worktree helpers (`worktreeLabel`, `worktreesDir`, `openWorktree`, `WorktreeOpening` and their neighbours) to `state/sources/repositories/worktrees.ts`.
D14. **A change row's press and Open File (D13a-5, A1-4).** In `ChangeGroups.svelte` the path becomes a press target (a `ui/` `ToolButton` drawn as plain text) that opens the row as VS Code's does: the diff for staged and changed, the file for untracked, the merge editor for merge. Each row gains Open File, with the actions in VS Code's order: Open File, Discard, Stage (Unstage for staged).
D15. **Long paths (X3a-7).** `ChangeGroups.svelte` and `ChangesTouched.svelte` draw the file name first and the folder after it, dimmed and cut at its end, the whole path in the tooltip, as `ChangeRow.svelte` does.
D16. **Cmd+A and Cmd+Enter (Z311).** `TreeView.svelte` takes Cmd+A (Ctrl+A off macOS) on every tree: it is handed to the caller's `onkey` as `select-all` and prevented whether or not the caller selects, so page text is never selected from a tree. The Repositories changes tree gains a multi-selection (press, Cmd+press, Shift+press, Shift+Up and Shift+Down, Cmd+A) over its rows, reusing `state/sources/explorer/acts/selection.ts` with the group id in the `RowRef` root slot, kept in the view state as `picked: string[]`; inline Stage, Unstage and Discard on a selected row act on every selected row of its group. Cmd+Enter opens a row to the side: in Repositories through the row's open with `layout.openBeside`, in Files through the keymap entry `{ code: 'Enter', cmd: true, action: 'open-side' }` and the existing `ROW_OPEN_SIDE` pick.
D17. **Folder panel (Q88c-19, client part).** While the page's panel request is out, Add Folder to Workspace and `:folder` are disabled and the message line says the existing `files.picker_busy` ("The folder panel is already open.", `files.yml:145`); a second press while one is out does nothing. A cancel (ok with no paths) says nothing and clears the line.

### E. Nested repositories (Z269)

E1. `repository_scan_depth` in `config/sources.yml`, placed right after the `roots:` list (:96-102) with a comment line saying what it is, value 1, read by a reader in `data/sources/config/settings.ts` that throws `config/sources.yml: repository_scan_depth must be a whole number from 0 to 3` for any other value and for a missing key, as its siblings throw (Z440), added to READERS, to the start check (`context.ts:282`) and to `config/catalogs/options.yml`. The options entry is written in the entry vocabulary `options.yml` holds when X3e is prepared: S5 (in flight) brings Z428's `heading:`, `min:` and `max:`, which give this entry its heading and its range 0 to 3 if S5 has landed by then. Z443 (G13's sentence against the throwing readers) is Axel's open item; this brief does not decide it, and the reader follows his ruling in the step that ruling makes.
E2. `subrepositories(root, depth)` walks every folder to `depth` levels under the root, repository roots included and inside found repositories, skipping links, `.git` and the `IGNORED` names, entering other dot folders as VS Code's scan does; a folder holding `.git` (a folder or a file) is found; a folder the scan cannot read is skipped and the rest of the walk goes on. Depth 0 finds nothing. The scan is passed `depth: () => number` from `context.ts:355`, read inside `readRoots`' try, so a bad value logs and keeps the depth in force.
E3. `heard` takes the event type from the watch callback and rescans a root when a `rename` event names a path of at most `depth` segments, or a path ending in `/.git` of at most `depth + 1` segments. The head comment :26-31 is rewritten.

### F. Smaller items

F1. **Ticker (Z358).** `Ticker.svelte` sets the row's `title` to the label and the tail when the name is cut (`scrollWidth > clientWidth`), measured on `pointerenter` and `focus`, and no title otherwise.
F2. **Dirty dot (Z359).** The Open Editors mark becomes `<Glyph name={t('ui.dirty_glyph')} />` as `TabFace.svelte:157-159` draws it, coloured by `color`; the `.dirty` background rule goes.
F3. **Palette (Q88c-21).** Each colon command gets a description and, when it takes an argument, an argument hint from the group `app.palette` (`config/text/app.yml:17-29`): `app.palette.cmd_<name>` and `app.palette.cmd_<name>_hint`, the name with its dash written as an underscore (`cmd_workspace_save`), each read through a literal key; `crt`, `help`, `update` and `folder` take no hint key. The `theme` hint keeps the configured theme names, so its line carries a placeholder (`app.palette.cmd_theme_hint: '<{0}>'`), filled with the names joined by ` | ` as `palette.ts:280` joins them. Both are drawn on the row as `PaletteRow.svelte` draws `hint`. The command rows move out of `Palette.svelte` into `shell/keys/PaletteCommands.svelte`, bringing `Palette.svelte` under 520 lines.

### G. The items of the plan line this brief does not build (Z441)

The builder does not work on these, and the report says so in one line each:

- D27-3 (two single presses on `notes.txt` selected the row and opened nothing): the press path is X3f's, so it is read at X3f's landing look, not in this step.
- Q88c-22 (empty folders named `config/behavior.yml`, `config/layout.yml` and `config/sources.yml` at the hub root): closed, since the folders are gone (`ls config` at the hub root fails) and `~/.oculus/changes.jsonl` names no write that made them.
- The hub Graph's 10 s wait before its first rows, X3a-1's five-second Delete, and Q88c-19's server half (a second panel opened by one page, and the cancel said as a failure; the client half is D17): each goes through `/diagnose` on an agent before this step's builder starts. A cause found joins this brief then, as an item of "What to build" with its cases, before the builder is launched; an item whose diagnosis finds no cause goes to the orchestrator before the launch.

## Cases

Reorder:

1. Default workspace, drag `ordo` onto the upper half of `cathedra`: the line shows above `cathedra`; the drop writes `sources.yml` with `ordo` first among the configured roots and every other line unchanged; the tree redraws in that order; Undo puts it back.
2. Drag `ordo` onto its own row: no line, no write.
3. Escape during a root drag: no write, no line left.
4. Drag a configured root onto the hub, the config root or the fallback root: no line, `dropEffect` none, no write.
5. Drag a configured root onto a file or folder row: no line, no write.
6. Drag a file onto a root row: the existing move, unchanged.
7. Two roots selected and dragged: both move together in their order.
8. A selection of a root and a file, drag started on the root, dropped on another root: only the root moves.
9. A root dropped below the last row: it goes last of its group.
10. A root dragged from one Files tab to another tab's tree: refused.
11. `sources.yml` edited by hand between the page's read and the drop, so the keys differ: refused `roots-changed`, the line `files.refused_roots_changed` shows, nothing written, the roots read again.
12. A named workspace, drag one of its own roots: `order-roots` writes the saved workspaces file, the configured roots unchanged.
13. A named workspace whose saved workspaces file does not read: refused with G31's reason, the file left as it is.
14. `order-roots` with no named workspace in force: refused `no-such-workspace`.
15. A tab following a session: no root drags.
16. A default workspace with a single movable root: it drags nowhere; Alt+Up and Alt+Down do nothing.
17. Bookmarks: drag the third bookmark above the first: `bookmarks.yml` written in the new order, the rail menu in the new order.
18. Bookmarks with two entries of one label: the reorder is refused and said; the file unchanged.
19. A missing bookmark dragged: it moves like any other.
20. A bookmark dragged onto a note row or a tree row: refused.
21. Notes: drag a note to the top: `~/.oculus/notes/order.json` written as `{ "version": 1, "order": [...] }`; the list in that order after a reload.
22. A new note after a reorder: it is first.
23. `order.json` that is not JSON: the list is newest first; a reorder is refused `notes-order-unreadable` and the file left as it was.
24. `order.json` a link: not read and not written through.
25. An `order-notes` body with an id of 65 characters, an id with a dot, and an id naming no note: those ids dropped, the rest written.
26. The notes folder missing at the first reorder: made, then written.
27. Sections: drag Bookmarks above Open Editors: drawn in that order, kept after a reload.
28. A saved layout with no `sections`: the default order. One with `sections: "x"` or `["notes", "notes", "bogus"]`: notes once, the others in the default order after it, `bogus` dropped.
29. A following tab: the tree's head is not drawn; the other sections drag around its place.
30. Alt+Down on a focused bookmark: it moves one down and keeps the focus; on the last one nothing happens.
31. Alt+Up on the hub root: nothing.
32. Alt+Down on Open Editors' head: the section moves below the tree.

Collapse:

33. Folders open under two roots: the first press closes the folders and leaves both roots open; the second closes both roots.
34. No folder open, roots open: one press closes the roots.
35. A closed root with remembered open folders and another open root with nothing open: no folder is open in B1's sense, so one press drops the closed root's remembered folders and closes the open root.
36. A rooted tab: the second press changes nothing.

Following the disk:

37. A folder made outside oculus in an open folder: the tree shows it within about two seconds, with no Refresh.
38. Undo of a delete: the restored files show.
39. A move outside oculus: the file leaves its old place and shows at the new one.
40. A write under `node_modules` of an expanded folder with Show Hidden Files on: the listing follows.
41. More than 64 folders written within one window: every held listing of the root is read again once.
42. A tab whose file is deleted outside oculus: the tab label struck through in red, the tooltip ending "Deleted"; the file put back clears it.
43. A tab on a dotfile (`.gitignore`) that exists: not marked.
44. The folder panel line after a cancel and after a failure: closes with its control, Escape or the next action.
45. Show in Files on a folder the tree has not read (an untracked folder in Changes): the folder shows and is selected.
46. A root removed from `sources.yml` by hand: it leaves the tree at the next config push.
47. A root removed from the saved workspaces file by hand: it leaves the tree within one poll.
48. With the page open, a repository added as a root by a hand edit of `sources.yml`, then Add to .gitignore in it, then Open File on its `.gitignore`: it opens, since the root is served by the time the file is asked for.

Source Control:

49. Open File (HEAD) on a changed file: opens HEAD's copy, labelled with the HEAD label.
50. An index tab open, then `git add` of the file: the tab shows the new index text.
51. A HEAD tab open, then a commit: the tab shows the new HEAD text.
52. Checkout (Detached) with only an untracked file: checks out, the untracked file stays.
53. Switch with a modified tracked file: refused with the catalog sentence, capitalised.
54. Switch where git refuses because an untracked file would be overwritten: refused with the catalog sentence and git's own line.
55. Cherry-pick, conflict, Abort: the commit box is empty.
56. The same, with the message edited before Abort: the edited text stays.
57. One conflicted file: "1 file is in conflict"; two: "2 files are in conflict".
58. Every sentence of `server.git`, `server.deposit` and `server.auth` starts with a capital and ends with no full stop, and verify 9's grep prints no line that words a sentence.
59. A clean repository: Changes head with no rows; no Untracked, Staged or Merge head; no "nothing".
60. A commit with three branches and two tags: the first name whole, then one branch glyph with 2 and one tag glyph with 2, the subject readable.
61. The Graph head before the section is opened: no count.
62. Detached HEAD: the repository row shows 8 characters of the commit; HEAD's graph row carries the head pill.
63. HEAD on a branch: the head pill on HEAD's commit as well.
64. The menu of a commit in the log: no Cherry Pick. Of an incoming commit: Cherry Pick. Of HEAD's commit while detached: no Checkout (Detached).
65. A worktree outside the worktrees folder: its folder name, the whole path in the tooltip.
66. Enter in the New worktree field: the worktree is made.
67. A session workspace deleted from disk: not in the Repositories list. A configured root deleted from disk: listed as missing.
68. Open Worktree: (a) the added worktree is held by a served root after the add: Files shows that root by its key; (b) no served root holds it after the add: the line `repositories.worktree_open_failed`.
69. A press on a changed row's path: the diff opens. On an untracked row: the file. On a merge row: the merge editor.
70. The row's actions read Open File, Discard, Stage.
71. A long path in Changed and in Touched by this session: the file name visible, the folder dimmed after it.
72. Cmd+A in the Repositories changes tree: every row of the tree selected, no page text selected.
73. Cmd+A in a tree whose caller has no select-all (the Outline): no page text selected.
74. Three rows selected, Stage on one: all three staged.
75. Cmd+Enter on a staged row: the diff opens beside. On a Files row: the file opens beside.
76. Add Folder pressed twice quickly: one panel; the line says `files.picker_busy`; the control disabled until it answers.
77. The panel cancelled: no line.

Nested repositories:

78. Default depth 1: `theaxec.github.io` (depth 1 under the hub) is in the Repositories list.
79. Depth 0: no nested repository listed.
80. Depth 3: `.agents/worktrees/X3e` (this step's own worktree, a `.git` file, depth 3, there at the look) listed.
81. `repository_scan_depth: 4` or `"one"`: refused at start with the sentence naming the file and key; a hand edit while running logs and keeps the depth in force.
82. A repository cloned at depth 1 while running: listed after the event.
83. A repository nested inside a found repository, within depth: listed.
84. A nested repository that is also a configured root: listed once.
85. A link to a repository: not followed.
86. The depth lowered by a config push: the deeper repositories leave the list.

Smaller items:

87. A ticker row cut by its ellipsis: its tooltip is the whole label and tail. A row that fits: no tooltip.
88. The Open Editors dirty mark: a dot glyph in the row's text colour, no `background: currentColor`.
89. The palette at `:`: each command row shows its description and hint; the `theme` row's hint names the configured themes.

Inputs the step implies:

90. `sources.yml` unwritable at an `order` write: refused `unwritable`, the file unchanged.
91. An `order` body whose `keys` is absent, not a list, or holds a non-text item: answered 400 with the route's answer for a body it does not know (`writes.ts:510`), nothing written.
92. A `roots:` list with a comment line between two of its entries: an `order`, an add and a remove are each refused `invalid`, the file unchanged, the line `files.refused_roots_invalid` shown. The first run, on the unchanged tree, is an add over such a list, which drops the comment line.
93. `keys` or `ids` sent to `POST /api/fs` as something other than a list of text: read as the empty list; `order-roots` is then refused `roots-changed` (a named workspace with no own root writes nothing), and `order-notes` is refused `no-such-note`.
94. An `order-notes` body naming one id twice: kept once, at its first place.
95. `order.json` that parses as JSON of another shape (`"version": 2`, or `order` not a list of text): the list newest first; a reorder refused `notes-order-unreadable`, the file left as it was.
96. `repository_scan_depth` missing from `sources.yml`: refused at start with the sentence naming the file and key, as its siblings are.
97. A folder the depth scan cannot read: skipped, the rest scanned.
98. A pending `files` message with the empty root (`{ root: '', bookmarks: true }` or `{ root: '', workspaces: true }`) merged with one naming a root and `folders`: the merged message keeps that root and its folders, and both flags.
99. A version gap on the `files` channel: every served root refreshed, `WORKSPACES` and the bookmarks marked.
100. A notes reorder refused `notes-order-unreadable`: the message line says `files.refused_notes_order_unreadable`.
101. A token refused by any of the nine routes that answer the sentence: `{ error: 'The write token is missing or stale' }`, with the route's own headers and fields; a refusal by `gatedBody` or the three file routes keeps its code.

The builder's first task, before any change, is the first run of every case above on the unchanged tree, read from the code (no server and no browser run here), with each case's result noted.

- A case becomes a test only where `agents/spec.md`'s test rule calls for one: a row in a guarded entry's test for a unit that entry names (item "Tests" under "What it must do"). Each such row is run on the unchanged tree first and the report quotes its failure.
- For each case kept as a test, the report names one small change to the code under test that the case must catch, and quotes the test's failing line with that change made on a scratch copy.
- The cases kept as rows of guarded tests (item "Tests"): 1 and 11, 92 (G8 and G9, `roots.test.ts`), 13 (G31, `workspaces.test.ts`), 23, 24 and 95 (G31, the new `notes.test.ts`), 81 and 96 (G13), 52 to 54 (G33), 101 (G1's three assertions).
- The server-side cases a look cannot see are checked by a run the report quotes, with no test kept: 14, 18, 25, 26, 41, 58, 81's hand edit while running, 83 to 86, 90, 91, 93, 94, 97, 98 and 99. Each run calls the worktree's module on a scratch folder or a scratch repository (or `grep` for 58), and the report quotes its command and output.
- Every other case is checked by the orchestrator's look on TEST; the report states for each what the look should see.

When the first run finds a case the brief's own rules get wrong, the builder stops there, before changing any code, and hands back the first run and that case, with the rule and the result it gives.

## Paths this step writes

Server:

- `tools/oculus/src/lib/server/root/watch/git.ts`
- `tools/oculus/src/lib/server/root/context.ts`
- `tools/oculus/src/lib/server/files/files-channel.ts`
- `tools/oculus/src/lib/server/files/fs.ts`
- `tools/oculus/src/lib/server/files/fs/notes.ts`
- `tools/oculus/src/lib/server/files/open.ts`, `source.ts` (the token refusal's catalog, D5)
- `tools/oculus/src/lib/server/edit/writes.ts` (`WriteTarget`, `target()` and `handleWrite`'s token refusal, D5)
- `tools/oculus/src/lib/server/edit/writes/config/roots.ts`
- `tools/oculus/src/lib/server/edit/writes/config/config-write.ts`
- `tools/oculus/src/lib/server/edit/writes/config/config-checks.ts`
- `tools/oculus/src/lib/server/edit/writes/bodies.ts`
- `tools/oculus/src/lib/server/git/git-write.ts`, `git-index.ts`, `git-refs.ts`, `git-remote.ts`, `git-routes.ts`, `git-reads.ts`, `git-message.ts`, `deposit.ts`, `deposit-git.ts`, `deposit-routes.ts`
- `tools/oculus/src/lib/server/core/git/run.ts`, `compare.ts`, `files.ts`, `reads.ts`, `state.ts` (the read path's sentences, D5)
- `tools/oculus/src/lib/server/core/auth.ts` (`RefusalShape` and `tokenedBody`'s two sentences)
- `tools/oculus/src/lib/server/content/latex/endpoint.ts`, `tools/oculus/src/lib/server/content/memories.ts`, `tools/oculus/src/lib/server/machine/commands/routes.ts`, `tools/oculus/src/lib/server/machine/pty/routes.ts` (the token refusal's catalog only, D5)
- `tools/oculus/src/routes/api/(sessions)/latex/+server.ts`, `(docs)/memories/+server.ts`, `(files)/open/+server.ts`, `(files)/source/+server.ts`, `(sessions)/terminal/+server.ts` (the catalog passed to the handler, D5)
- `tools/oculus/src/lib/data/model/model-sessions.ts` (`FilesPayload` only)
- `tools/oculus/src/lib/data/sources/config/settings.ts`

Client state:

- `tools/oculus/src/lib/state/client/payloads.ts` (`filesShape` only, C0)
- `tools/oculus/src/lib/state/sources/fs.svelte.ts`
- `tools/oculus/src/lib/state/sources/fs-transport.ts`
- `tools/oculus/src/lib/state/sources/explorer/acts/reorder.ts` (new)
- `tools/oculus/src/lib/state/sources/explorer/acts/keys.ts`, `refusal.ts`, `folders.ts`
- `tools/oculus/src/lib/state/sources/explorer/ops.svelte.ts` (the panel's in-flight state in `addFolders`, `openFolder` and `pick`, :555-590)
- `tools/oculus/src/lib/state/sources/explorer/view/files-view.ts`, `place.ts`, `reveal.ts`
- `tools/oculus/src/lib/state/sources/explorer/sections/section-state.ts`
- `tools/oculus/src/lib/state/sources/repositories/repositories.ts`, `worktrees.ts` (new), `change-tree.ts`, `repositories.svelte.ts`
- `tools/oculus/src/lib/state/sessions/source.svelte.ts`
- `tools/oculus/src/lib/state/workbench/palette.ts`

Views, shell and primitives:

- `tools/oculus/src/lib/views/sources/files/Files.svelte`
- `tools/oculus/src/lib/views/sources/files/sections/Sections.svelte`, `Section.svelte`, `Bookmarks.svelte`, `Notes.svelte`, `OpenEditors.svelte`, `Outline.svelte`, `Timeline.svelte` (the section head's drag props in `Outline.svelte` and `Timeline.svelte`, A5)
- `tools/oculus/src/lib/views/shared/explorer/tree/Tree.svelte` (the `<ul class="rows">` at :266, the row `<li>` at :276-288, the style block at :351-379, and the key handler wiring only)
- `tools/oculus/src/lib/views/shared/explorer/tree/control/dragging.svelte.ts`, `keyed.ts`
- `tools/oculus/src/lib/views/shared/explorer/tree/ShowPath.svelte`
- `tools/oculus/src/lib/views/shared/explorer/RootedTree.svelte` (the header's drag props only)
- `tools/oculus/src/lib/views/shared/explorer/control/tab-actions.ts`
- `tools/oculus/src/lib/views/shared/changes/ChangeGroups.svelte`, `CommitBox.svelte`
- `tools/oculus/src/lib/views/sessions/changes/ChangesTouched.svelte`
- `tools/oculus/src/lib/views/sources/repositories/RepoList.svelte`, `Repositories.svelte`, `Repo.svelte` (the singular conflict lines at :130-132 only)
- `tools/oculus/src/lib/views/sources/repositories/changes/Changes.svelte`
- `tools/oculus/src/lib/views/sources/repositories/graph/CommitRow.svelte`, `Graph.svelte`
- `tools/oculus/src/lib/views/sources/repositories/menus/graph-menu.ts`
- `tools/oculus/src/lib/views/sources/repositories/refs/Worktrees.svelte`
- `tools/oculus/src/lib/views/sources/source/Source.svelte` (the load effect at :325-332 only)
- `tools/oculus/src/lib/ui/tree/TreeView.svelte`, `tree-keys.ts`, `TreeSection.svelte`
- `tools/oculus/src/lib/ui/tabs/tab-strip.ts`, `TabFace.svelte`
- `tools/oculus/src/lib/ui/display/Ticker.svelte`
- `tools/oculus/src/lib/shell/panes/PaneView.svelte`, `pane-view.ts`
- `tools/oculus/src/lib/shell/keys/Palette.svelte`, `PaletteCommands.svelte` (new), `PaletteRow.svelte`

Config:

- `tools/oculus/config/sources.yml` (the `repository_scan_depth` key and its comment, right after the `roots:` list)
- `tools/oculus/config/catalogs/options.yml`, `glyphs.yml`, `icons.yml`
- `tools/oculus/config/text/server.yml`, `app.yml`, `ui.yml`
- `tools/oculus/config/text/views/sources/files.yml`, `repositories.yml`, `source.yml`
- `tools/oculus/config/text/views/sessions/changes.yml`

Tests, the rows of the guarded tests named under "Tests":

- `tools/oculus/tests/routes/edit/roots.test.ts`
- `tools/oculus/tests/server/files/workspaces.test.ts`
- `tools/oculus/tests/server/files/notes.test.ts` (new, G31 as Z438 widens it)
- `tools/oculus/tests/server/files/fs.test.ts` (only where its routes' answers move)
- `tools/oculus/tests/data/sources/config/settings.test.ts`
- `tools/oculus/tests/server/git/git-write.test.ts`, `git-ops.test.ts`, `deposit.test.ts`
- `tools/oculus/tests/server/git/refs/detached.test.ts` (G33's untracked-only row)
- `tools/oculus/tests/routes/git/git.test.ts`, `deposit.test.ts`, `untracked.test.ts`
- `tools/oculus/tests/server/core/auth.test.ts`, `tools/oculus/tests/routes/edit/write.test.ts` (the token sentence's assertions, Z442)

Tests, the calls alone, where a test calls a function or a handler whose parameters D5 changes (no assertion changes):

- `tools/oculus/tests/server/git/refs/cherry-pick.test.ts`, `delete-branch.test.ts`, `tools/oculus/tests/server/git/untracked/ignore.test.ts`, `trash.test.ts`
- `tools/oculus/tests/routes/docs/memories.test.ts`, `tools/oculus/tests/routes/sessions/latex.test.ts`, `compose.test.ts`, `terminal-actions.test.ts`, `terminal-edit.test.ts`, `terminal-fixture.ts`, `terminal.test.ts`, `tools/oculus/tests/server/machine/commands/run.test.ts`, `tools/oculus/tests/routes/machine/commands.test.ts`
- `tools/oculus/tests/routes/files/open.test.ts`, `source.test.ts`, `history.test.ts`, `file-undo.test.ts`
- `tools/oculus/tests/routes/edit/write-fixture.ts`, `audit-mute.test.ts`, `config-key.test.ts`, `config-value.test.ts`, `rail.test.ts`, `undo/undo.test.ts`, `tools/oculus/tests/routes/replace/replace-fixture.ts`, `tools/oculus/tests/server/core/changes.test.ts`
- `tools/oculus/tests/data/real-hub.probe.ts` (its `statusFor` call, :128)

Ledger:

- `tools/oculus/docs/diagrams/` (whatever `npm run diagrams` rewrites)
- `tools/oculus/.scratch/migration/agents/reviews/X3e-report.md`

`HELP.md` and `DESIGN.md` are not in this list: D37, S5, H3 and D42 write them beside this step. The report's "Doc text" section gives their lines (see Report). `agents/guarded.md` is not in it either: the orchestrator writes Z438's widening of G31 there.

The step writes these paths and nothing else; a path outside them that the step needs is named in the report with the reason.

### Shared with the steps in flight (Z452)

Read from each step's worktree diff (`git diff -U0 -- <file> | grep '^@@'` inside `.agents/worktrees/<step>`) and, for X3f, from its landed commit; each region is given in the step's own new line numbers, and this step's regions in the base's. X3e is prepared after D42 lands, and `/spec` then checks these premises again against main and against the steps still in flight.

- X3f, landed at b68058ce4: `Tree.svelte` :100-104 and :197, `Source.svelte` :42-49, :92-100, :304 and :404-411, `fs.svelte.ts` :166-168 and :535-564, `RootedTree.svelte` :70-71, `PaneView.svelte` :10-11, `files.yml` :150, `source.yml` (its :30 taken out). None is one of this step's regions; the line numbers above move with them.
- D37: `ops.svelte.ts` :67-80 and :205-224 against this step's :555-590; `repositories.svelte.ts` :121-125, :160 and :262-263 against :431-437; `model-sessions.ts` :279-361 against :615; `pty/routes.ts`, where D37 rewrites `handleTerminal` from the base's :498 on, three lines below this step's one change there, the catalog `handleTerminal` passes to `tokenedBody` (:495); `server.yml` (D37 takes the base's :17 and :20-23 out of `server.commands`) against this step's new `server.git`, `server.deposit` and `server.auth` groups; the terminal tests `compose.test.ts`, `terminal-actions.test.ts`, `terminal-fixture.ts` and `terminal.test.ts` against this step's change to their handler calls; `HELP.md` :163, :181, :183 and `DESIGN.md` :131, :372, :409, which the Doc text section does not touch.
- S5: `config-write.ts`, where S5 changes the base's :71 and :77 beside this step's roots dispatch at :80-89; `config-checks.ts` (S5 adds to FINDERS at :134, this step to READERS at :104-118); `context.ts` :18 and :309 against :282 and :355; `writes.ts` :45, :111-116 (S5 adds to `WriteTarget`) and :245 against this step's `text` in `WriteTarget` and `target()`; `server.yml` :32-47 and :69-70 against the new groups; `options.yml`, whose entries S5 rewrites throughout to Z428's vocabulary (`heading:`, `min:`, `max:`), so E1's entry is written in the vocabulary in force when X3e is prepared; `tests/routes/edit/config-value.test.ts` :39 against this step's change to its handler call.
- H3: `config/sources.yml`, the base's :12-85 (comment lines and registry keys), against this step's key after the `roots:` list (:96-102); `config/text/app.yml` :12 (`app.keys.rows`) against `app.palette` (:17-29); `HELP.md` :19 and :74.
- D42: `Files.svelte` :300, `Sections.svelte` :51-52, :60-70 and :98-104, `files-view.ts` (D42 adds the Timeline's state to `FilesView` at :95-100 and to its shape at :176-179 and :219-222), `section-state.ts` :26-30, `fs.svelte.ts` :114-120, :283-302, :582 and :799-800, `reveal.ts` :10-121, `ShowPath.svelte` :4-11 and :104-108, `Timeline.svelte` throughout, `files.yml` :110 and :207-229, `repositories.yml` :53, `model-sessions.ts` :385-402, `git-reads.ts` :163-170 and :259-264, and `server/core/git/run.ts` :21-22 and :58-62 (its head comment) and `files.ts`. A5 restructures `Files.svelte` and `Sections.svelte` and adds `sections` to `FilesView` where D42 adds the Timeline's state, which is why Z452 prepares X3e after D42 lands; D5 then changes `run.ts`, `files.ts` and `git-reads.ts` on D42's text.

## Decisions taken in this brief (each reversible, none silent)

1. **How the tree follows the disk (C1, C2).** Options: (a) the git watcher's existing recursive watch publishes the changed folders on the `files` channel and the fs store relists them; (b) the fs store polls each open folder; (c) Refresh only, as now (the lazy option). Pros of (a): no new watch, no poll, changes arrive within the watcher's two-second throttle, and the channel already reaches every page. Cons: a busy root relists more; the 64-folder cap bounds it. (b) reads the disk for folders nobody is looking at; (c) leaves X3a-1. Taken: (a).
2. **Events under `IGNORED` folders.** Options: (a) published as folders without a git re-read; (b) dropped as now (the lazy option), leaving an open `node_modules` listing stale. Taken: (a).
3. **The deleted-file mark (C3).** Options: (a) struck through in `--c-red-txt` with "Deleted" in the tooltip, as VS Code's `list.errorForeground`, strikethrough and "Deleted"; (b) a glyph on the tab; (c) close the tab. Taken: (a); (c) loses the reader's unsaved text.
4. **Where the lines above the tree go (C4).** Options: (a) one overlay line at the foot of the view with a close control; (b) keep them above the tree and reserve their height; (c) a toast. Pros of (a): no row ever moves, and the line stays near what it is about. (b) costs a blank row in every tab. Taken: (a).
5. **Reveal (C5).** Options: (a) a fresh read before answering missing; (b) always fresh (slower for every reveal). Taken: (a).
6. **Open File (HEAD) (D1).** Options: (a) HEAD for both groups, as VS Code's `openHEADFile` labels it; (b) index for changed (now). VS Code opens `leftUri`, the index, for a working-tree change but labels it HEAD; oculus labels honestly, so (a) makes label and content agree. Taken: (a).
7. **Head and index tabs (D2).** Options: (a) re-read on the git state's signature for the file; (b) re-read on every git message (reads on every unrelated change). Taken: (a).
8. **The server's sentences (D5).** Options: (a) catalog through `words()` with the catalog passed as a parameter, as `config-value.ts` does; (b) functions return refusal ids and the routes word them (a new outcome type across seven modules and every test that reads `.error`); (c) capitalise the literals in place (the lazy option; the sentences stay outside the catalog). Taken: (a).
9. **Empty groups (D6).** VS Code hides empty Merge, Staged and Untracked and keeps Changes (`hideWhenEmpty` absent on `workingTree`). Taken: as VS Code.
10. **Graph pills (D7).** VS Code's `_renderBadges`: the first reference with its name, the others as icons grouped with a count. Taken: as VS Code.
11. **Graph count (D8).** Options: (a) no count, as VS Code; (b) a count read at mount (an extra graph read per repository). Taken: (a).
12. **Detached HEAD (D9).** VS Code names it by the commit's first 8 characters and marks HEAD with its `head` icon. Taken: as VS Code, with lucide `target` as the glyph.
13. **The commit menu (D10).** Options: (a) hide the two items where they would do nothing; (b) offer them everywhere, as VS Code. Taken: (a), an oculus improvement kept.
14. **Worktree label (D11).** Options: (a) the folder's last name; (b) the path relative to the repository. Taken: (a), the name a worktree is made under.
15. **Stale repositories (D12).** Options: (a) keep a gone or non-repository root only when it is a served root; (b) drop every gone root. (b) hides a configured root the reader must fix. Taken: (a).
16. **Repositories selection (D16).** Options: (a) reuse `selection.ts` with the group id as the root slot; (b) a new selection module. Taken: (a); one selection rule for both trees.
17. **The folder panel (D17).** The page holds its own in-flight flag, so a second press never asks the server, whatever its state. Taken.
18. **Section order (A5).** All six sections move, the tree included, as VS Code's Explorer views do. The tree's section moves only while its head is drawn.
19. **Keyboard reorder (A6).** VS Code binds Alt+Up and Alt+Down to `list.focusAnyUp` and `list.focusAnyDown` and has no move key; Z284 rules Alt+Up and Alt+Down as oculus's move key for the four lists. Kept as an oculus feature. An open editor row has no drag and no ruling, so the keys do not move it (Z451).
20. **The roots' group.** The movable roots are the removable ones (`fixedRootKeys`), which are one contiguous run in both workspaces; a drop outside that run is refused.
21. **The notes order file.** Options: (a) `order.json` beside the notes, read checked; (b) an order field in each note (a write per note per reorder). Taken: (a), as Z284 rules.
22. **The depth scan (E2).** Dot folders are entered, as VS Code's `traverseWorkspaceFolder` does; `node_modules` and the other `IGNORED` names, links and `.git` are skipped. At depth 3 the hub lists its `.agents/worktrees/<step>` checkouts; at the default 1 it does not.
23. **Rescan trigger (E3).** Options: (a) only `rename` events within depth; (b) any event within depth (a scan on nearly every edit in the hub at depth 3). Taken: (a).
24. **Palette (F3).** The split puts the command rows in `PaletteCommands.svelte`, since `Palette.svelte` is over 520 lines now.
25. **The ticker title (F1).** Measured on pointer entry and focus, so a resize between is caught at the next hover.
26. **How `tokenedBody` gets the catalog sentence (D5, Z442).** Options: (a) `RefusalShape` takes `text: () => Record<string, string>`, the catalog read only when a refusal is worded, and the nine routes that answer the sentence pass it, each from the configuration its options carry or from a function its route file builds over `locals.config()`; (b) the server context words the sentence once at start and every route passes a `{ token, refused }` pair in place of the token string; (c) `auth.ts` imports `config/text/server.yml` with `?raw`, as `ui/theme.ts:12` imports `tokens.css`, and words the sentence from that copy; (d) the literal capitalised in place (the lazy option, which Z442 refuses). Pros of (a): the catalog reaches the sentence as it reaches every other server sentence (`config-value.ts:138`, D5's git functions), the configuration is read only on the refusal path, the four routes that answer codes are untouched, and a call that names neither words nor text does not compile. Cons: nine handlers, five route files and the tests that call those handlers change. (b) changes all 18 routes and every test that passes a token string, and freezes the sentence at start; (c) adds a second reader of the catalog beside `loadConfig`, which `server/core/words.ts` says is the server's one reader, and a catalog edit is not followed until a rebuild. Taken: (a).
27. **Which sentences are in scope (D5).** Options: (a) every sentence the git and deposit routes answer, POST and GET, the git state's error drawn in the Repositories row (`Repo.svelte:113`, :186) and `auth.ts`'s two, which takes in `server/core/git/run.ts`'s 'git timed out' and 'git failed' and the read refusals of `core/git`; (b) `server/git` and `auth.ts` only, the read path's sentences left lower case; (c) the single-line `failed(` literals that the old grep sees, the multi-line, template and helper sentences left (the lazy option). Pros of (a): every sentence a reader sees from these routes and from the git state starts with a capital, under one mechanism, which is what Q88c-6 names ("refusal and status sentences start in lower case"). Cons: `core/git`'s readers and the git watcher take the catalog, and `run.ts`, `files.ts` and `git-reads.ts` are D42's text, which this step's preparation after D42's landing (Z452) takes in. (b) leaves the GET answers and the row's failure line in lower case, the same defect. Taken: (a).
28. **The full stop of a server sentence (D5).** Options: (a) no full stop, as every refusal sentence of `server.yml` (:24-54) ends, with git's words given in parentheses (`server.git.git_said: '{0} (Git said: {1})'`); (b) a full stop on the new sentences only, which leaves two forms in one catalog file; (c) a full stop added to every server sentence, which rewrites lines and assertions outside this step. Taken: (a), the file's own form. The client lines (`repositories.*_one`, `git.commit_unmerged_one`, `files.refused_*`) end with a full stop as their neighbours do.
29. **The unused `refresh(root, version)` (C2).** Options: (a) C2 calls it for a whole root (a `files` message with no `folders`, and each served root at a version gap), and its doc comment and the head comment's paragraph name that caller; (b) remove it and relist each held listing of the root one by one; (c) leave it uncalled with a comment that names a caller that does not exist (the lazy option). Pros of (a): it already marks a root's listings, texts and file kinds once per version, which is what a whole-root change needs, a changed open file's text included. (b) writes again what `refresh` does and misses the texts. Taken: (a).
30. **A roots list holding a line that is no entry (A2).** Options: (a) `writeRoots` refuses `invalid` when the list's lines hold a comment or a malformed entry, for an add, a remove and an order, said with `files.refused_roots_invalid`; (b) the comment line moves with the entry below it, which needs `setItems` (`list-edit.ts`, shared with the rail, the deck and the audit mute) to write an item over several lines; (c) the order drops the line as an add and a remove do now (the lazy option, a reader's text lost without a word). Pros of (a): nothing the reader wrote is lost, in one place, through the existing `invalid` code. Cons: a list with a comment cannot be changed from the view until the comment is moved; the line says so. (b) changes a module four writers share. Taken: (a).
31. **`keys` and `ids` that are not a list of text (A2, A4).** Options: (a) read as the empty list, as `textShape` reads a field that is not text as the empty text, and refused by the action (`roots-changed`, `no-such-note`); (b) the whole body refused `not-an-action`, which would also refuse an `add-root` whose stray `keys` is malformed. Taken: (a), the form of the body's other fields.

Kept as oculus features, which VS Code does not have: Alt+Up and Alt+Down moving a row; the Bookmarks and Notes sections and their order; the hidden Cherry Pick and Checkout (Detached) where they would do nothing; the HEAD pill on a non-detached HEAD; badge rows for configured roots that are no repository; the session-touched list's file-first paths.

## Libraries checked

`.agents/plan.yaml` has `libraries: check`. Candidates for the drag and drop, looked up with `npm view <name> version license time.modified peerDependencies`:

- `svelte-dnd-action` 0.9.79, MIT, modified 2026-08-21, peer svelte >=3.23 or ^5. It owns the list's DOM order and moves items itself, which the tree's `VirtualRows` (only the rows in view are drawn) and its existing HTML5 drag types cannot share.
- `@thisux/sveltednd` 0.8.0, MIT, modified 2026-09-01, peer svelte ^5. A second drag system beside the tree's own drag types; the same conflict.
- `sortablejs` 1.15.7, MIT, modified 2026-02-11, no peer. It reorders DOM nodes directly, which a Svelte-keyed and virtualized list cannot accept.
- `@atlaskit/pragmatic-drag-and-drop` 4.0.0, Apache-2.0, modified 2026-09-24, no peer. The nearest fit (its closest-edge helper is the before and after rule); adopting it means replacing the tree's whole drag, files and folders included, which is not this step.

None is taken. What stays hand-written: the before and after rule (`dropPlace`, a few lines over `getBoundingClientRect`) and the order arithmetic (`reorderedKeys`, beside the existing `movedOrder`). No new dependency. The builder adds no dependency this brief does not name; a library the builder finds that would cover its work is reported, not installed.

## Read, with sections or line ranges

1. `src/lib/views/shared/explorer/tree/control/dragging.svelte.ts` whole, `tree/drag.ts` whole, `tree/Tree.svelte:130-300` and `:351-379`, `tree/control/keyed.ts` whole: the drag and the keys.
2. `src/lib/state/sources/fs-transport.ts:80-130`, `state/sources/explorer/view/place.ts:150-185`, `state/sources/explorer/acts/keys.ts` whole, `acts/selection.ts` whole, `acts/refusal.ts` whole, `acts/folders.ts` whole.
3. `src/lib/state/sources/fs.svelte.ts:1-60`, `:150-165`, `:360-460`, `:600-809`.
4. `src/lib/server/edit/writes/config/roots.ts` whole, `config-write.ts:60-95`, `bodies.ts:100-115` and `:275-285` and `:415-425`.
5. `src/lib/server/files/fs.ts:230-260` and `:460-659`, `server/files/fs/notes.ts` whole, `server/core/json.ts` whole.
6. `src/lib/state/boards/collection.ts:410-460`, `state/client/writes.svelte.ts:290-305`.
7. `src/lib/views/sources/files/Files.svelte` whole, `sections/Sections.svelte` whole, `sections/Section.svelte` whole, `sections/OpenEditors.svelte` whole, `sections/Outline.svelte:100-120`, `sections/Timeline.svelte:135-155`, `ui/tree/TreeSection.svelte` whole, `state/sources/explorer/view/files-view.ts` whole, `sections/section-state.ts` whole.
8. `src/lib/views/shared/explorer/control/tab-actions.ts` whole.
9. `src/lib/server/root/watch/git.ts` whole, `server/files/files-channel.ts` whole, `state/client/payloads.ts:100-130`, `data/model/model-sessions.ts:600-616`, `state/system/docs.svelte.ts:195-220`, `server/root/context.ts:275-290` and `:345-360`.
10. `src/lib/state/sources/explorer/view/reveal.ts` whole, `views/shared/explorer/tree/ShowPath.svelte` whole.
11. `src/lib/ui/tabs/tab-strip.ts:1-40`, `ui/tabs/TabFace.svelte:80-170`, `shell/panes/PaneView.svelte:165-215`, `shell/panes/pane-view.ts:410-441`, `state/workbench/navigation/pages.ts:355-366`.
12. `src/lib/state/sources/repositories/repositories.svelte.ts:200-215`, `:320-335`, `:420-440`; `state/sources/repositories/file-git.ts` whole; `state/sessions/source.svelte.ts:180-200` and `:280-370`; `views/sources/source/Source.svelte:315-340`.
13. `src/lib/server/git/git-write.ts:100-120`, `:345-390`, `:570-590`; `git-routes.ts` whole; `server/core/words.ts` whole; `server/edit/writes/config/config-value.ts:130-170` and `:225-240`; `config/text/server.yml` whole.
14. `src/lib/views/shared/changes/CommitBox.svelte:50-80`, `state/sources/repositories/repositories.ts:480-500`, `:575-600`, `:630-640`, `:845-880`; `state/sources/repositories/change-tree.ts:200-222`.
15. `src/lib/views/shared/changes/ChangeGroups.svelte` whole, `views/sessions/changes/ChangesTouched.svelte` whole, `views/sources/repositories/changes/ChangeRow.svelte` whole, `changes/Changes.svelte` whole.
16. `src/lib/views/sources/repositories/graph/CommitRow.svelte` whole, `graph/Graph.svelte:230-260` and `:350-420`, `menus/graph-menu.ts` whole, `RepoList.svelte:90-130`, `refs/Worktrees.svelte` whole.
17. `src/lib/ui/tree/TreeView.svelte` whole, `ui/tree/tree-keys.ts:100-140`.
18. `src/lib/ui/display/Ticker.svelte:280-340`, `state/workbench/palette.ts:260-300`, `shell/keys/Palette.svelte` whole, `shell/keys/PaletteRow.svelte` whole.
19. `src/lib/data/sources/config/settings.ts` whole, `server/edit/writes/config/config-checks.ts:95-125`, `config/catalogs/options.yml:670-690`, `config/sources.yml:80-105`.
20. `tools/oculus/.scratch/migration/agents/guarded.md` entries G6, G8, G9, G13, G24, G29, G31, G33, and `tests/routes/edit/roots.test.ts`, `tests/server/files/workspaces.test.ts`, `tests/data/sources/config/settings.test.ts`, `tests/server/git/git-write.test.ts` whole.
21. `HELP.md:120-121` and `:139`, `DESIGN.md:116`: the paragraphs the "Doc text" section rewrites.
22. `src/lib/server/core/auth.ts` whole, and the `tokenedBody` call with ten lines around it in each of the nine handlers the premise "The write token" names, with each one's route file under `src/routes/api/`: the token sentence's mechanism (D5).
23. `src/lib/server/core/git/run.ts` whole, `core/git/state.ts:90-200`, and every `refused(` line of `core/git/compare.ts`, `files.ts` and `reads.ts` with the function around it; `src/lib/server/git/git-message.ts` whole; `git-refs.ts:60-110`; `deposit.ts:740-760`; `git-write.ts:120-190`, `:240-260`, `:500-560`, `:730-760`: the read path's sentences and the rest of the inventory (D5).
24. `src/lib/server/edit/list-edit.ts:60-180`: how `setItems` writes the `roots:` block (A2).

## What it must do

Every item of "What to build", in the order A to F. The items are independent except: C0 and C1 before C2 and C3; A1 before A6; D5 before D3's refusal sentence.

Tests, under `agents/guarded.md` (a test exists only as an entry's test; one test per unit, a table with one row per input that gives a different outcome):

- G8 (`tests/routes/edit/roots.test.ts`): the roots write kind gains rows for `order`: a permutation written with every other line byte-identical; a list that names a key twice, misses one or names an unknown one refused `roots-changed` with the file unchanged.
- G8 (`roots.test.ts`): a row for a `roots:` list holding a comment line between two entries, refused `invalid` by an add, a remove and an order, the file byte-identical (case 92).
- G9 (`roots.test.ts`, 'records the add and the remove, and the undo of each puts the list back'): a row for `order` and its undo.
- G31 (`tests/server/files/workspaces.test.ts`): `order-roots` over a saved workspaces file that does not read is refused and the file left.
- G13 (`tests/data/sources/config/settings.test.ts`, one case per setting reader): the `repository_scan_depth` reader with rows 0, 3, 4, -1, 1.5, `"one"` and the key missing (Z440; Z443 is Axel's open item and does not change these rows).
- G33 (`tests/server/git/git-write.test.ts`, 'switches to another branch'): rows for an untracked file only (switches, the file kept) and a modified tracked file (refused with the catalog sentence).
- G33 (`tests/server/git/refs/detached.test.ts:24`, 'detaches HEAD at a hash on a clean tree'): a row for an untracked file only (detaches, the file kept) (case 52).
- G1 (Z442): the three assertions that quote the token sentence, `tests/server/core/auth.test.ts:27`, `tests/routes/edit/write.test.ts:27` and `tests/routes/git/git.test.ts:60` (the count `grep -rn "missing or stale" tests` prints), follow the catalog's words; each edit is listed in the report with its before and after.
- G6 and the git and deposit tests that assert a sentence (`tests/routes/git/git.test.ts:60, :72, :136`, `untracked.test.ts:56`, `deposit.test.ts:74`, `tests/server/git/git-write.test.ts:174-175`, `git-ops.test.ts:188, :197, :278, :297`, `tests/server/git/deposit.test.ts:141`): each assertion follows the moved sentence; each such edit is listed in the report with its before and after.
- G31 (Z438, `tests/server/files/notes.test.ts`, new, 'refuses a write over an order file it cannot read, leaving it'): a table over `order.json` that is not JSON (case 23), that is JSON of another shape (case 95) and that is a link (case 24), each refused with the file byte-identical, and a missing file, written. `tests/server/files` then holds 9 items. The orchestrator writes G31's Code line (`src/lib/server/files/fs/notes.ts`) and this Test line into `agents/guarded.md`; the builder writes the test.
- No other test is added. The behaviour of every view item is proved by the orchestrator's look on TEST.

## Conventions

On top of `agents/spec.md`:

- Every string from `config/text/` through `t()` or the server's `words()`, with literal keys (G24); every glyph from `config/catalogs/glyphs.yml` with its `icons.yml` row; every colour from `themes/tokens.css` under the colour rule (spec.md:48), with no `background: currentColor`.
- Every control a `ui/` primitive.
- A source file at or under 880 lines and a component at or under 520; `repositories.ts` (880) and `Palette.svelte` (523) are split as items D13 and F3 say; any other file that would pass is split by concern.
- At most ten tracked items in a folder; the new files go to folders with room (`state/sources/explorer/acts` 8, `state/sources/repositories` 9, `shell/keys` 7, `tests/server/files` 8). `server/git`, `server/files`, `state/sources`, `ui/tree`, `ui/display`, `shell/panes` and `state/workbench` are full: no new file there.
- A config value is read from its key with no fallback beside it; the default lives in `config/sources.yml`.
- Each id or key checked empty, duplicated and colliding (root keys, note ids, section ids, bookmark labels); each asynchronous path in flight, after close and superseded (a reorder write superseded by another, a `files` message landing while a listing is out, the panel request after the tab closes).
- No history in comments; every head comment that describes changed behaviour is rewritten.
- Git: no git command. The base copy and `sh utils/unused-exports.sh` stand in for diffs.

## Verify before you report

Run from `tools/oculus` in the worktree:

1. `npm run diagrams`, then `npm run test:quick` once, after the last change; it prints each command and `test:quick: <seconds> s (limit 45.0 s); every command passed`. The report quotes its final lines.
2. The tree checks that cover what this step changes: `npx vitest run tests/checks/tree/boundaries.test.ts tests/checks/tree/size.test.ts tests/checks/tree/duplication.test.ts tests/checks/config/config.test.ts tests/checks/source/keys.test.ts tests/checks/imports/order.test.ts`, after the last change; the report quotes their final lines.
3. The guarded tests named under "Tests", each run on the unchanged tree (the new rows failing, quoted) and after the change (passing, quoted).
4. The test file of each `agents/guarded.md` entry whose Code line names a path of this step's write list, run alone with `npx vitest run <file>` after the last change, the report quoting each run's final lines: G1 (`tests/routes/edit/write.test.ts`, `tests/routes/files/fs.test.ts`, `open.test.ts`, `source.test.ts`, `tests/server/files/picker.test.ts`, `tests/routes/git/git.test.ts`, `deposit.test.ts`, `tests/routes/sessions/terminal.test.ts`, `latex.test.ts`, `tests/routes/machine/commands.test.ts`, `tests/routes/docs/memories.test.ts`), G2 (`tests/server/files/fs.test.ts`, `tests/routes/files/history.test.ts`), G6 (`tests/routes/git/untracked.test.ts`), G8 and G9 (`tests/routes/edit/roots.test.ts`, `tests/server/core/changes.test.ts`, `tests/routes/edit/undo/undo.test.ts`, `rail.test.ts`, `config-key.test.ts`, `config-value.test.ts`, `tests/routes/files/file-undo.test.ts`), G13 (`tests/data/sources/config/settings.test.ts`), G30 (`tests/server/git/deposit.test.ts`), G31 (`tests/server/files/workspaces.test.ts`, `notes.test.ts`), G33 (`tests/server/git/git-write.test.ts`, `git-ops.test.ts`, `refs/cherry-pick.test.ts`, `refs/delete-branch.test.ts`, `refs/detached.test.ts`, `untracked/ignore.test.ts`, `untracked/trash.test.ts`), and any other entry whose Code line names a path of the write list.
5. For each added row, one run on a scratch copy with the behaviour removed, and the failing line.
6. The ASCII gate of `agents/spec.md` (the `LC_ALL=C perl` command at spec.md:97) prints nothing.
7. `sh utils/folder-check.sh` passes.
8. `sh utils/unused-exports.sh`, compared with `.agents/worktrees/X3e-base/unused-exports.txt`: each added line quoted with what was done to it.
9. `grep -rnE "['\`\"][a-z][a-z]* [a-z]" src/lib/server/git src/lib/server/core/git src/lib/server/core/auth.ts | grep -vE ":[0-9]+:\s*(//|/?\*)"`, after the last change: the report quotes its output and names each line it prints as what it is (a git argument, a parse prefix, a code), none a sentence a reader sees; and the report quotes the groups `server.git`, `server.deposit` and `server.auth` of `config/text/server.yml` whole, each value read to start with a capital or a placeholder and to end with no full stop.
10. `grep -rn "ch_group_empty" src config --exclude=local.yml` prints nothing, or the report names the reader that keeps it.
11. `grep -rn "background: currentColor" src` prints nothing (F2).

## Report

Write it to `tools/oculus/.scratch/migration/agents/reviews/X3e-report.md` in the worktree, with these parts in this order.

- The first line: anything NOT done, or "Everything in the brief is done".
- The open items of the state file, verbatim.
- The cases' first run: all 101 cases by number, each with the reading that checked it and its result on the unchanged tree.
- The DONE / NOT DONE table with the checks above and their output as printed, the ASCII gate's exit status included, and the number of runs of the verify list.
- The files with line counts (from `diff -rq` against the base copy).
- Every judgment call the brief left open.
- Every host- or user-visible change with its before and after: the view, the state to put it in, and what the look should see.
- Every edit to an existing test assertion, with its before and after.
- The 'still true' or 'rewritten' list of every paragraph and head comment that describes the changed behaviour.
- Anything in the brief that was wrong or impossible, with the evidence.
- A section "Doc text" for `HELP.md` and `DESIGN.md`: for each paragraph this step changes, the current line as `grep -n` prints it and its replacement, so the orchestrator applies them at landing. It covers at least: the Files row (`HELP.md:120`, the reorder of roots, bookmarks, notes and sections, the second Collapse Folders press, the deleted-tab mark, the message line, Alt+Up and Alt+Down, Cmd+Enter), the Repositories row (`HELP.md:121`, nested repositories and `repository_scan_depth`, the HEAD pill, the change row's press and Open File, Cmd+A selection), the Changes row (`HELP.md:139`, the file name first), the `sources.yml` row of the config table (`HELP.md:276`), and the Watchers paragraph (`DESIGN.md:116`, the `files` channel's folders and the scan depth).

## Changes from the brief check

The brief check's report is `agents/reviews/X3e-brief-check.md`; each item names its finding and what changed here.

1. Finding 1, the token sentence (Z442): D5 words `tokenedBody`'s two sentences from the catalog (`server.auth.token_refused`, `server.auth.body_not_json`) through a lazily read `text` on `RefusalShape`, passed by the nine routes that answer them (decision 26); the premise "The write token" names the 13 call sites, the 18 routes, the nine handlers and the three assertions the grep prints; `tests/server/core/auth.test.ts` and `tests/routes/edit/write.test.ts` join the paths and "Tests" beside `git.test.ts`, with the handlers' modules, route files and calling tests in the paths; case 101.
2. Finding 2, the git tests outside the paths: the five `refs/` and `untracked/` test files are in the paths (the calls alone), and D5 puts `text` right before the first defaulted parameter of a function that ends in one, such as `switchBranch`'s `roots`.
3. Finding 3, the client's payload check: item C0 widens `filesShape` with `folders` and `workspaces`, and `state/client/payloads.ts` is in the paths.
4. Finding 4, the section heads: the premise names the five components that draw their own `<Section>`, A5 says each passes the drag props, and `Outline.svelte` and `Timeline.svelte` are in the paths.
5. Finding 5, `Tree.svelte`'s restriction: the paths take the `<ul class="rows">` at :266, the row `<li>` at :276-288 and the style block at :351-379; A1 names the `<ul>` for the drop below the last row and the style block for the line; Read 1 covers them.
6. Finding 6, the notes test (Z438): "Tests" names the new `tests/server/files/notes.test.ts` with its title and rows in place of the old bullet, the folder count (8, then 9) is in the premises and Conventions, and the paths name the file.
7. Finding 7, `switchDetached` under G33: "Tests" adds an untracked-only row to `tests/server/git/refs/detached.test.ts:24`, and the file is in the paths.
8. Finding 8, the open-editor move (Z451): A6 no longer moves an open editor row; Alt+Up and Alt+Down move the four lists Z284 names, and decision 19 says so.
9. Finding 9: `ACTIONS` is at `fs.ts:487-494`, with `fsBodyShape` at :500-508 and `textShape` at :425.
10. Finding 10, X3a-2: a premise says the breadcrumb row left the Files view with X3c (1e14d2799) and the crumbs sit on the tab strip; C4 says the message lines are the same defect and names the look's check that no tree row moves.
11. Finding 11, `WORKSPACES` and `refresh`: the premise says `invalidate` marks `WORKSPACES` too, called by Refresh and `ops.svelte.ts:549`, and that `refresh` has no caller; C2 uses `refresh` for a whole root and at a version gap and rewrites its comments (decision 29).
12. Finding 12, line drifts: the `<li>` is :276-288 and `loadSourceDraft` returns early for every draft read in the lifetime; the roots stay at `sources.yml:96-102` (`roots:` at :96, the last entry at :102 on e354291af and 039cd3988), so that part of the finding does not reproduce.
13. Finding 13, the colour rule: the premise attributes the `background` rule to the deleted test's head comment (`colours.test.ts` lines 12-18 before 2af5d443a) and keeps `spec.md:48` for what it says.
14. Finding 14, the rulings after the brief was written: Z438 to Z443, Z451 and Z452 are in the rulings list; section G follows Z441 (D27-3 at X3f's landing look, Q88c-22 closed, three items through `/diagnose` before the builder starts); Z443 is named as Axel's open item in the rulings list, E1 and "Tests", undecided here.
15. Finding 15, shared paths (Z452): a section "Shared with the steps in flight" gives, for X3f (landed at b68058ce4), D37, S5, H3 and D42, each shared file with both regions; "What is on the tree" says X3f's landing moved line numbers and that `/spec` checks every premise again on main once D42 has landed; E1 places the key right after the `roots:` list and writes its options entry in the vocabulary `options.yml` holds when X3e is prepared; the `HELP.md` and `DESIGN.md` note names D37, S5, H3 and D42.
16. Finding 16, how a case is checked: the Cases section lists the cases kept as guarded rows, the server-side cases checked by a quoted run (14, 18, 25, 26, 41, 58, 81's hand edit, 83 to 86, 90, 91, 93, 94, 97 to 99), and the rest at the look.
17. Finding 17: case 48 adds the repository as a root by a hand edit of `sources.yml` while the page is open.
18. Finding 18: case 80 names `.agents/worktrees/X3e`, which is there at the look.
19. Finding 19: case 68 pairs (a) a root holding the worktree with Files showing it, and (b) none with `repositories.worktree_open_failed`.
20. Finding 20, B1 against case 35: B1 defines an open folder as a drawn one, says the press drops a closed root's remembered folders as now, and case 35 states both results of its one press.
21. Finding 21, the inventory and its check: the premise lists every sentence the old grep misses and the read path's sentences; D5's inventory names them all, `server/core/git/run.ts` and the read refusals included (decision 27); verify 9 lists every line holding a lower-case sentence-like literal under `server/git`, `server/core/git` and `auth.ts` for the report to name, and reads the three catalog groups whole; Read 23 covers the files.
22. Finding 22: verify 4 runs the test file of every guarded entry whose Code line names a path of the write list, each named.
23. Finding 23: verify 11 is `grep -rn "background: currentColor" src`, printing nothing.
24. Finding 24, implied inputs: cases 90 to 100; A2 says how a malformed `keys` is answered and that `writeRoots` refuses a list holding a line that is no entry (decision 30, `files.refused_roots_invalid`); A2 and A4 read a `keys` or `ids` that is no list of text as the empty list (decision 31); A4 keeps a duplicate id once, refuses a list naming no note, treats JSON of another shape as unreadable and adds `files.refused_notes_order_unreadable`; C1 gives `mergeFiles` its rule for an empty-root message and for both flags; C2 marks `WORKSPACES` and the bookmarks at a version gap; E1 throws for a missing key; E2 skips a folder it cannot read.
25. Finding 25, the palette keys: F3 names the group `app.palette` (`app.yml:17-29`), the key form for a dashed name, the commands with no hint, and the `theme` hint's `{0}`; a premise names the group and `palette.ts:280`.
26. Finding 26, the conflict singulars and the full stop: D5 dictates the four `_one` lines whole and names their readers (`Repo.svelte:130-132`, `CommitBox.svelte:78`, `Repo.svelte` added to the paths); server sentences end with no full stop as `server.yml:24-54` does, git's words given as `server.git.git_said: '{0} (Git said: {1})'` (decision 28); `sessions.ch_failed` is capitalised with them.
27. Finding 27: D17 says the existing `files.picker_busy`, and `files.picker_open` is gone; case 76 follows.
