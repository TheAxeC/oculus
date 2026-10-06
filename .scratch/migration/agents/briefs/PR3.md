# Brief: PR3, Present decks edited and generated in oculus, and exported to PDF

Size: a full step

Read `tools/oculus/.scratch/migration/agents/spec.md` first; its rules govern this step unchanged. Then, in full: `tools/oculus/.scratch/migration/agents/briefs/PR2-design.md` (the deck format Axel ruled, which this step edits and never changes), and `tools/oculus/.scratch/migration/agents/guarded.md` entries G2, G8, G9, G14, G32, G47, G49 and G53 (this step touches the code of each: G47 the desktop windows and the sender check, G49 the app gate and the closed writes, G53 the window file a hidden window must stay out of), and runs each one's test. No ADR folder exists (`ls tools/oculus/docs/adr docs/adr` fails for both), so no ADR touches this step.

A design ruling decides what is built. It never exempts the code: every line is written to the standards pages, so that people can read, use and maintain it.

The worktree is `.agents/worktrees/PR3`. Its sparse checkout holds the plan's paths plus `deck`, which the cases read; no case writes into the worktree's `deck/` or a project, and every case that writes runs over a copy of `deck/` in a scratch root of the scratch server. The base copy is `.agents/worktrees/PR3-base/tools/oculus/`, unpacked by the orchestrator at the base. Your scratch server uses port 8794.

## What is on the tree (read on main at e7952e16)

- A deck is a folder holding `present.yml` and Markdown slide files, read on the server by `src/lib/data/sources/deck/` (`spec.ts` 163 lines reads `present.yml` into `{ title, tagTones, groups, order }`; `split.ts` 117 lines cuts a file into slides at a line holding only `---` outside a fence or an HTML comment; `read.ts` 533 lines places the slides; `kinds.ts` 331 lines builds each kind; `groups.ts` 188 lines the placement rule; `files.ts` 82 lines resolves a path inside its root), served whole by `GET /api/deck?root=&path=` (`src/routes/api/(docs)/deck/+server.ts`, `src/lib/server/content/deck/endpoint.ts` and `read.ts`) (`wc -l`, `ls`).
- `order:` entries are a file name (`title.md`), `{ slides: <group> }`, and `{ kind: summary | grid, of: <group>, title?, lede?, foot? }` (`spec.ts:35-47`, `orderOf` at `:116-152`).
- A slide's key is `<file>#<n>` for a slide of the deck's own file, the n-th slide of that file counted from 0 (`read.ts:296`), `<member deck name>/<that member's key>` for a slide a group places (`read.ts:411`), and `summary:<group>` or `grid:<group>` for a generated one (`read.ts:348`); a repeated key gets `~2`, `~3` (`read.ts:429`). `DeckSlide` (`src/lib/data/model/model-entities.ts:365`) carries `key`, `title` and `notes?` from `SlideBase` (`:348-354`) and no source file.
- The kinds are `title`, `closing`, `section`, `text`, `image`, `columns`, `equation`, `code`, `project`, `idea` (`kinds.ts:229-330`, `grep -n "case '"`). A slide file with no `kind:` is `text` (`kinds.ts:213`). `deck/closing.md` is `kind: closing` with `kicker:` and `contact:` front matter keys and a `#` heading.
- The Slides view (`src/lib/views/academic/slides/Slides.svelte` 442 lines, state in `src/lib/state/life/slides.ts` 168 lines) lists each group's members with a tick and moves within one group, and saves each changed group through the write `deck-slides` `{ root, path, group, base, slides }` (`src/lib/server/edit/writes/config/deck.ts` 160 lines, the line edit `src/lib/server/edit/deck-edit.ts`, the body at `writes/bodies.ts:101,268`, routed at `writes/config/config-write.ts:59`, gated for apps at `writes/app-gate.ts:78` and closed to apps at `src/lib/data/helpers/files/apps.ts:134`, undone at `writes/undo.ts:135,304`, sent at `src/lib/state/client/writes.svelte.ts:409`). It does not show or write `order:`, and a deck cannot move from one group to another.
- The Present view (`src/lib/views/academic/present/Present.svelte` 511 lines, `Bar.svelte` 75 lines the toolbar, `Slide.svelte`, `Overview.svelte`, `Panel.svelte`, `parts/`, `keys.ts`) offers no edit of a slide, no new slide, no image drop and no export.
- The Files view's row menu (`src/lib/views/shared/explorer/tree/menu/row-menu.ts`) has Open Presentation (`ROW_DECK` at `:80`, the item at `:279`, the action at `:552,573`) and no New Presentation or outline item.
- The file operations endpoint `POST /api/ops` (`src/lib/server/files/fs/ops.ts`) has `create`, `trash` and `upload` (`{ root, path, name, data (base64), replace }`, at most `MAX_UPLOAD_BYTES` = 32 MB, `src/lib/data/file-ops.ts:30,123-143`), each recorded as one `files` record whose undo is `server/edit/writes/file-undo.ts`; the client sends an upload from `src/lib/state/sources/explorer/ops.svelte.ts:540-560`.
- A source tab's unsaved text is its draft in client state, `sourceDraft(instance.id).text` (`src/lib/views/sources/source/Source.svelte:175,441`); a save marks the file store's text query, and the deck route's answer is marked stale when the `files` channel moves (`src/lib/state/life/present.svelte.ts:84-89`), so a slide redraws at the push after a save and not while it is typed.
- The desktop host's bridge (`src/desktop/decide/channels.ts`, `src/desktop/windows/bridge.ts`, `src/desktop/preload.cjs`) has no print channel; `grep -rn "printToPDF\|jspdf\|pdf-lib\|window.print" src` prints nothing. Electron is 44.5.1 (`package.json:36`). The page routes are `src/routes/+page.svelte`, `apps/` and `find/` (`ls src/routes`).
- Premise corrected (Z664's count): the lines of the converted decks with a spaced hyphen standing for a dash are 40, not 38: `grep -nE "\S - \S" projects/*/*/present/*.md projects/archive/*/*/*/present/*.md deck/*.md` prints raw-pls 12, fed-multicellular-immune 6, dries-bttr-ecg 6, hccnet-fl 5, hccnet-revision 5, ecg-readable-substrate 3, ward-bttr-crosssubject 2, bttd-source-eeg 1, each in its `present/main.md`, and none in `deck/`.
- Folder sizes (`utils/folder-check.sh` refuses an eleventh item): `src/lib/server/edit/writes/config/`, `src/lib/server/edit/writes/`, `src/lib/server/edit/`, `src/lib/state/life/`, `tests/routes/edit/` and `tests/data/sources/` hold ten each (`ls | wc -l`). `Present.svelte` is 511 lines and `Slides.svelte` 442 against the limit of 520, so both folders are written as "any file".
- Words this step makes false or incomplete outside its code: `docs/apps.md:435` (the write kinds an app cannot ask for, which gain `deck-edit`), `docs/configuration.md:64` (what the change log records), `DESIGN.md:390` (`deck-slides` "writes the `slides:` list of one group"), `config/text/views/system/history.yml:51` (`kind_deck_slides: deck group`, which an `order` record would wear), `config/text/server.yml:50-57` (`server.deck_slides.changed` names a group's slides list); `src/lib/server/edit/writes.ts:204` re-exports every body reader. `src/lib/server/content/deck/endpoint.ts:1,15` says GET only.
- The name `deck-edit` is also the module `src/lib/server/edit/deck-edit.ts` (the line edit of a `slides:` list) and its test `tests/server/edit/deck-edit.test.ts`; "Outline" also names the Files view's Outline section (`config/text/views/sources/files.yml:138`) and the LaTeX outline (`latex.yml:24`).
- The palette lists only a source tab's editor actions (`src/lib/shell/keys/Palette.svelte:15-26`, `src/lib/state/workbench/palette.ts:163` `editorItems`, `palette-source.svelte.ts`); no view adds commands to it. A new file's name is asked by the tree's row naming (`src/lib/views/shared/explorer/tree/row-ops.ts:225`, `tree/control/picks.svelte.ts:90-109`). A page route gets its catalog, glyphs, icons and token from a server load (`src/routes/+page.server.ts`, `src/routes/find/+page.server.ts`). The page's type of the bridge is `src/lib/state/shared/stores/desktop.ts:60-72`; a window at the page's address is a full `page` sender to the host (`src/desktop/decide/sender.ts:20-28`), its options set in `decide/window-options.ts`, and the window file is written by `recordWindow` (`src/desktop/windows/windows.ts`).
- A slide after a separator opens its front matter with that separator line (`split.ts:5-8,86-104`): in a file `---`, `kind: text`, `---`, `# A`, `---`, `kind: image`, `---`, `# B`, the fifth line is both the separator and the second slide's front-matter opener.
- The images of a slide resolve against the folder of the slide's file (`read.ts:299-300`), which is the deck's folder for every deck on the tree (`ls projects/*/*/present deck`).
- Guarded entries: G9's and G32's Test lines name titles no test has (`grep -c "two lists" tests/server/core/changes.test.ts tests/routes/edit/undo/undo.test.ts` prints 0 and 0; the titles are at `changes.test.ts:241` and `undo.test.ts:175`; `grep -c "reads the front matter into one slide" tests/data/sources/present.test.ts` prints 0), and `tests/routes/docs/deck.test.ts` and `tests/routes/edit/deck-slides.test.ts` are named under no entry. G1 covers routes that write, run or open something; the deck POST is a read, and the write route's G1 row already covers every body.
- Dependencies already installed that this step uses: `marked` (its lexer finds headings outside code), `yaml`, `trash`, `write-file-atomic`, `electron` (`package.json`).

## What to build

Eight parts. Every write goes through the write endpoint or the ops endpoint with the page's token, is recorded in the change log, and is undone from History.

### 1. The slide list: drag within and across groups, and `order:`

The Slides view shows, above the groups, the deck's `order:` as one list, one row per entry: a file entry by its file name and the title of its first slide, `{ slides: <group> }` as the group's name, a summary or a grid by its kind, its group and its title. Each row is dragged to a new place in the list; the same keyboard moves the group rows have today (Move Up, Move Down) are offered on it.

A member of a group is dragged within its group, as today, and onto another group, where it lands at the place it is dropped and leaves the group it came from. A name dropped on a group is accepted when it is a member, a candidate, a missing name or a conflicting deck of either the group it leaves or the group it joins.

Save posts one `deck-slides` write carrying every list the reader changed, applied to the file as one edit, all or nothing:

```
{ kind: 'deck-slides', root, path, groups: [{ group, base, slides }], order?: { base, entries } }
```

- `order.base` and `order.entries` name the entries of `order:` by a token: a file entry by its file name as `order:` writes it, `{ slides: g }` as `slides:g`, a summary as `summary:g`, a grid as `grid:g`; an entry that appears twice keeps its place by `~2`, `~3` as slide keys do. `entries` is a permutation of `base`: the save moves entries and adds or removes none.
- Each list is refused, and nothing is written, when the file no longer holds its `base` (the sentence that the file changed since it was read), as today's group write is.
- The edit moves each entry's own lines (a block entry such as the grid's five lines in `deck/present.yml` moves whole, a flow entry `{ kind: summary, ... }` as its one line), its comments and its indentation kept, and keeps every other byte of the file; a flow list `order: [a.md, b.md]` is written back as a block list, as `list-edit.ts` writes a flow list today; the result is read back and compared as the group edit's is (`deck-edit.ts`), so a shape the edit cannot keep is refused whole.
- The record keys cannot collide: a group's list is recorded under `slides:<group>` and the order list under `order`, and a file entry of `order:` is a path ending `.md`, so no group name and no file name can take another's key. A member dropped on a group whose `find:` would not find it is refused with its own sentence (`server.deck_slides.not_found_by`), and nothing is written. A stale `order.base` is refused with a sentence of its own, `server.deck_slides.order_changed` (the order of the deck changed on disk since it was read).
- The change log holds one record per list written (`key` the group, or `order` with `field: 'order'`), each with `before` and `after`; History names an `order` record by its own kind word (`kind_deck_order`) in `views/system/history.yml`; History undoes each while the file still holds its `after`. The records `deck-slides` wrote before this step keep their undo.
- The body of a `deck-slides` write of the old shape (`group`, `base`, `slides` at the top) is refused as an unknown shape: the page is the only sender, and no app may send it (`apps.ts` keeps it closed).

### 2. A slide's actions in the Present view

Each slide has a menu, on a right-click of the slide in the Present pane and of its tile in the overview grid, and the same items in the command palette for the slide on screen:

- **Edit Slide** opens the file the slide is in, in a source tab beside the Present pane (`openBeside`), at the slide's first line. For a slide of a member deck it opens the member's file; for a summary or a grid it opens the deck's `present.yml` at its `order:` entry.
- **New Slide** writes a new Markdown file in the deck's folder, `slide-<n>.md` with the smallest `n` from 1 whose name is free on disk and not named by `order:` (a name `order:` holds for a missing file is taken), holding `kind: text` front matter and a heading whose words are the catalog's `server.deck_edit.new_slide_heading` ("New slide"), and inserts its file name in `order:` after the entry of the slide on screen (at the end when the deck has no slides, or when the entry of that slide has left `order:` since; a deck with no `order:` key gets one holding the new entry). The pane then shows the new slide. Offered for any deck with a readable `present.yml`.
- **Duplicate Slide**, on a slide of the deck's own file: when the file holds that one slide, a copy of the file named `<stem>-copy.md` (then `<stem>-copy-2.md` and on, the first free name) with its entry after the slide's entry in `order:`; when the file holds several slides, a copy of that slide's text right after it in the same file: the separator line before the copy is the copy's front-matter opener when the slide has front matter, and a `---` line otherwise, so the first slide of a file (whose front matter is the file's) is copied as `---`, its front-matter lines, `---`, its body. The pane then shows the copy.
- **Delete Slide**, on a slide of the deck's own file: when the file holds that one slide, the file goes to the Trash and its entry leaves `order:`; when the file holds several, that slide's text and the separator before it leave the file; for the first slide, its text leaves and the second slide's separator line stays as the file's opening line when the second slide has front matter (it is that front matter's opener), and leaves otherwise. A file named twice in `order:` (a slide key with `~2`) loses every entry when it goes to the Trash. On a summary or a grid, its `order:` entry leaves the file. A slide of a member deck offers no Delete (it belongs to the other deck; the Slides view takes it out of the group). Delete asks first, naming the slide's title and the file.

These actions are one new write kind, `deck-edit`, through the write endpoint:

```
{ kind: 'deck-edit', root, path, act: 'new', after?: <slide key> }
{ kind: 'deck-edit', root, path, act: 'duplicate' | 'delete', slide: <slide key>, base: <the file's text as read> }
{ kind: 'deck-edit', root, path, act: 'image', slide: <slide key>, base, name, data }
{ kind: 'deck-edit', root, act: 'create', folder, title }
{ kind: 'deck-edit', root, act: 'outline', file }
```

- `base` is the slide file's text as the page read it through the source route (the file text query the source tab uses), so the deck answer carries no file text.
- For `create`, `folder` is a folder under a served root that holds no `present.yml`, and `title` a non-empty line (a newline in it becomes a space; an empty title is refused with its own sentence). For `outline`, `file` is a `.md` file under a served root. Each is refused, with its own sentence, outside the served roots or when its condition fails.
- `path` is the deck's `present.yml` under a served root; a path outside the served roots, a file not named `present.yml`, a slide key the deck does not hold or that is not of the deck's own file (for `duplicate`, `delete` and `image`), and a slide file whose text is not `base` (the file changed since it was read) are each refused with a sentence of their own and write nothing.
- One record per file the act changed, with the file's text before and after (a new file's `before` empty, a trashed file's `after` empty); an image is recorded by its path and the SHA-256 of its bytes, never its bytes, and its undo trashes it; History undoes the act while every file still holds its `after` text: a new file goes to the Trash, a trashed file is written back, an edited file gets its `before` text. The write is closed to apps (`apps.ts`).

### 3. The slide drawn live beside its editor

While a source tab on the same page holds an unsaved draft of a file the shown deck reads (its `present.yml` or a slide file of the deck or of a member deck), the Present pane draws the deck from that draft, at most 250 ms after the last keystroke: the page asks `POST /api/deck` with `{ root, path, drafts: [{ root, path, text }] }` and the server reads the deck as if each named file held its draft text (only files the deck reads; other paths are ignored; a draft over 1 MB is refused). A draft is matched to a file the deck reads by real path, so the same file under a second root key is drawn from its draft, and a draft outside the served roots is ignored. Only the pane whose page holds the draft draws from it; a pane on another page keeps the GET answer, and a pane whose slide key has left the deck shows the deck's first slide (`indexOf`). With no draft, the pane reads `GET /api/deck` as today. The POST is a read, needs the page's token as the GET does, and writes nothing.

`DeckSlide` gains `source?: { root: string; path: string; index: number }`: the served root and the slide file under it (a member deck may live in another root than the deck) and the slide's place in it (0-based), set for every slide drawn from a file (own or member), and for a summary or a grid `path` is the deck's `present.yml` and `index` the place of its entry in `order:`. Edit Slide and the live drawing read it; nothing reads a file path out of a key.

### 4. An image dropped on a slide

An image file dropped from outside the page onto a slide of the deck's own file in the Present pane (PNG, JPEG, GIF, WebP or SVG, by extension; at most 32 MB) is sent as `deck-edit` `act: 'image'` with its name and its bytes in base64. The server takes the name's last part, refuses a name holding `/`, a backslash or `..` or starting with `.`, copies the file into the folder of the slide's file (the folder its images resolve against, `read.ts:299-300`, which is the deck's folder for every deck on the tree) under that name, or the first free name `<stem>-2.<ext>`, `<stem>-3.<ext>` and on, and appends a line `![<stem>](<name>)` with a blank line before it to the end of that slide's text; a name holding a space or a parenthesis is written as `![<stem>](<<name>>)` so the link resolves. The pane shows the slide with the image at the next push. A drop on any other slide, of any other file or of more than one file says why in the pane's status line and writes nothing.

### 5. New Presentation

The Files view's row menu on a folder that holds no `present.yml`, a root's own folder included, offers **New Presentation...**. It asks for the deck's title in the input box oculus uses for a new file's name (the tree's row naming), the folder's name filled in, and writes, as one `deck-edit` act `create` `{ root, folder, title }`:

- `present.yml`:

  ```yaml
  deck:
      title: '<title>'

  order:
      - closing.md
  ```

- `closing.md`, unless the folder holds one (then the entry names the existing file):

  ```markdown
  ---
  kind: closing
  ---
  # <title>
  ```

The title is written as a single-quoted YAML scalar with each `'` doubled, and in the heading as typed. The deck then opens in a Present tab. A folder that holds a `present.yml` does not offer the item.

### 6. From outline

The Files view's row menu on a Markdown file (`.md`) offers **New Presentation from Outline**, written as one `deck-edit` act `outline` `{ root, file }` (the word names a Markdown file's level-1 headings as the outline of a talk; the Files view's Outline section and the LaTeX outline keep their meaning):

- A new folder beside the file, `<stem>-slides` (then `<stem>-slides-2` and on, the first free name), holding `present.yml`, `slides.md` and `closing.md`.
- The deck's title is the text of the file's first level-1 heading, else the file's stem.
- `slides.md` holds one slide per level-1 heading (`# `, found by `marked`'s lexer, so a `#` line inside a fenced block or a level-2 heading is no slide), each the heading and everything after it up to the next level-1 heading, the slides joined by a line holding only `---`. Text before the first level-1 heading that is not blank becomes a first slide of `kind: title` with the deck's title as its heading and that text below it. A file with no level-1 heading gives one `kind: text` slide holding the whole file.
- The file's YAML front matter, when it opens with one, is dropped. A setext level-1 heading (a line underlined by `===`) is a level-1 heading, its slide starting at its text line, written in `# ` form. A line holding only `---` inside a slide's text would cut it: one that underlines a line of text (a setext level-2 heading) is written as that heading in `## ` form, and any other such line outside a fence as `***` (the same thematic break in Markdown).
- `present.yml` holds the title as part 5 writes it and the order as these block lines, and `closing.md` is as part 5 writes it:

  ```yaml
  order:
      - slides.md
      - closing.md
  ```
- The deck then opens in a Present tab. The Markdown file itself is not changed.

### 7. Export to PDF, the only export

Ruled by Axel (Z665): no new dependency.

- A page route `src/routes/present/print/+page.svelte`, at `/present/print?root=&path=`, draws every slide of the deck in order, each in its 1280 by 720 frame at scale 1 and one per printed page, through the same slide components as the Present view, with `@page { size: 1280px 720px; margin: 0 }` and the theme of the page. It waits for the deck, the fonts and every image before it says it is ready (a `data-ready` attribute on its root).
- **Export to PDF** is a control in the Present toolbar and a palette command, for the deck on screen. The palette gains a way for the focused view to add its commands (the Present view's slide actions and Export to PDF), beside the source tab's editor actions.
- The print route has its own server load (`+page.server.ts`) giving the catalog, glyphs, icons and token, as the root page's does.
- In the desktop app the page asks the host over a new bridge channel, `oculus:print-pdf` with the print route's address; the host loads the route in a hidden window of the same origin, waits for `data-ready`, calls `webContents.printToPDF({ preferCSSPageSize: true, printBackground: true })`, closes the window and answers the bytes. The print window is a sender the host answers only the channels a print needs (`decide/sender.ts`), opens no other address (G47), and is never recorded in the window file (G53). A route that has not said it is ready after 60 s is closed and the status line says so, in words from `config/text/desktop.yml`. The page then writes them with the ops `upload` to `<deck folder>/<name>.pdf`, `<name>` the deck folder's name, or the project folder's name when the deck folder is a project's `present/` (`projects/manuscripts/btfno/present/btfno.pdf`), or the root's folder name for a root's own folder; a PDF over the upload's 32 MB is refused and the status line names the limit; a file of that name is replaced only after the question the Files view asks before a replace. The status line names the file written.
- In a browser tab the control opens the print route in a new browser tab, which calls `window.print()` once ready, so the reader saves the PDF from the browser's print dialog.
- No other format is exported, and no control names one.

### 8. The carried spaced hyphens (Z664)

This part waits for Axel's ruling Z667 on how a project deck is written in this step: `agents/spec.md` lets a builder write a hub data path only through a script the brief names, and a rewording is a judgment no script makes. Do parts 1 to 7 and 9 first; the orchestrator sends the ruling while you build, and you do this part as it says. If no ruling has come when the rest is done, say so on the report's first line.


Each of the 40 lines that `grep -nE "\S - \S" projects/*/*/present/*.md projects/archive/*/*/*/present/*.md` prints is reworded so the spaced hyphen standing for a dash is a comma, a colon, a semicolon, parentheses or a new sentence, as the hub's prose rule says. Every number, name, unit, HTML tag and Markdown mark on the line is kept byte for byte; a hyphen inside a word or a number range and a minus sign in a formula are not touched. The report lists each line before and after.

### 9. The documents

`HELP.md` names the new controls in a sentence in the Present row; `docs/views.md`, "Present", describes parts 1 to 7 for a reader; `docs/files-and-search.md` names New Presentation and New Presentation from Outline in the row menu's list; `docs/apps.md:435` names `deck-edit` among the writes an app cannot ask for; `docs/configuration.md:64` names the order and the deck file records; `DESIGN.md`'s two Present items state the decisions of parts 1 to 3 and 7 with their reasons, `DESIGN.md:390`'s description of `deck-slides` says it writes several lists and `order:`, and the closed-writes sentence names `deck-edit`. The words of every control, menu item, question, refusal and status line are in `config/text/` (`views/academic/present.yml`, `views/academic/slides.yml`, the files view's text, `server.deck_slides.*` and a new `server.deck_edit.*` in `config/text/server.yml`, `views/system/history.yml` for the History kinds `deck-edit` and the order record, `desktop.yml` for the print window's timeout).

## Cases

1. Slides view, `deck/`: drag `btfno` from `pillars` to the second place of `more`, Save: `pillars.slides` loses it, `more.slides` holds it second, every other byte of `present.yml` kept (`diff` shows two changed lines), one record per group; History undo of both puts the file back byte for byte.
2. Slides view, `deck/`: drag the order row `transition.md` above `{ slides: pillars }`, Save: `order:` has the entry moved with its exact text; `diff` shows only the moved line.
3. A `deck-slides` save whose `order.base` is not what the file holds: refused with the file-changed sentence, the file unchanged, and none of the group lists in the same request written.
4. A `deck-slides` body of the old shape (`group`, `base`, `slides` at the top): refused, nothing written.
5. New Slide on `deck/` with `engine.md` on screen: `slide-1.md` written with `kind: text` and `# New slide`; `order:` holds `slide-1.md` right after `engine.md`; undo trashes `slide-1.md` and puts `order:` back.
6. New Slide twice: `slide-1.md`, then `slide-2.md`.
7. Duplicate Slide on `closing.md#0` (a one-slide file): `closing-copy.md` with the same text, its entry after `closing.md`.
8. Duplicate Slide on the second slide of a file holding two slides: the file holds three slides, the copy right after the second with a `---` line between; `order:` unchanged.
9. Delete Slide on `slide-1.md#0`: asks first; on yes the file is in the Trash and its entry gone; undo writes it back and puts the entry back.
10. Delete Slide on the first of two slides in one file, the second with front matter: the file holds the second slide alone, opening with its front matter's `---`.
11. Delete on `summary:pillars`: its `order:` entry gone; `pillars` and its `slides:` kept.
11a. Edit Slide on `summary:pillars`: `deck/present.yml` opens beside the pane at that entry's line.
12. A slide of a member deck (`btfno/main.md#0` on the portfolio deck): the menu offers Edit Slide and no Duplicate or Delete; Edit Slide opens `projects/manuscripts/btfno/present/main.md` beside the pane.
13. `deck-edit` `delete` with a `base` that is not the file's text: refused with the file-changed sentence, nothing written.
14. `deck-edit` and the deck POST with `path` outside the served roots, or `../../etc/present.yml`: refused, nothing written (G2).
15. `deck-edit` and the deck POST without the page's token: refused, a quoted run (the write route's G1 row covers every body; the POST is a read).
16. Edit Slide on `title.md#0`, then type in the source tab without saving: the Present pane draws the typed heading within 250 ms of the last keystroke; Revert in the source tab draws the file's text again. A look at landing; the builder quotes a `POST /api/deck` with a draft of `title.md` whose answer carries the typed heading.
17. A draft of a file the deck does not read (`README.md`): the deck answer is the file's, unchanged.
18. Drop `fig.png` on a slide of `slide-1.md` (a look at landing; the builder quotes the `deck-edit` `image` write and its result): `fig.png` copied into the deck's folder, the slide's text ends with `![fig](fig.png)`; a second drop of a file named `fig.png` writes `fig-2.png`.
19. Drop a `.pdf` or two files: the status line says why, nothing written.
20. New Presentation on a folder with no `present.yml`, title `Axel's talk`: `present.yml` holds `title: 'Axel''s talk'` and `order:` with `closing.md`; `closing.md` holds `kind: closing` and `# Axel's talk`; the deck opens in Present. The item is not offered on a folder holding a `present.yml`.
21. From outline on a file with text, then `# A`, a fenced block holding a `# not a heading` line, `## B`, `# C`: folder `<stem>-slides`; `slides.md` holds a `kind: title` slide, then slide `# A` with the fence and `## B` inside it, then slide `# C`; the source file unchanged.
22. From outline on a file with no level-1 heading: one `kind: text` slide holding the whole file.
23. From outline on a file holding a `---` line between two headings: that line is `***` in `slides.md`, and the deck reads one slide per heading.
24. Export to PDF in the desktop app on `deck/` (a look at landing on the scratch copy; the builder quotes a fetch of `/present/print?root=<scratch>&path=deck` and its `data-ready`): `deck.pdf` written in the deck's folder, one page per slide (21 pages, read with `pdfinfo` or by opening it), text selectable; a second export asks before it replaces.
25. Export to PDF in a browser tab (a look at landing): a new tab on `/present/print?root=hub&path=deck` opens the print dialog; its preview shows one slide per page.
26. The 40 lines of part 8: each reworded with every number and name kept; `grep -nE "\S - \S"` over the same files prints nothing, no line holds `--` or a hyphen standing for a dash, and the report's before and after list is read line by line.
27. Slides view, `deck/`: drag the order row of the grid entry (five block lines) above `transition.md`, Save: the five lines move whole; a flow entry `{ kind: summary, of: x }` moves as its one line.
28. A `deck-slides` record of the old one-group shape, written before this step: History undoes it, the group's list put back.
29. New Slide on a deck whose `order:` names `slide-1.md` and no such file exists: `slide-2.md` is written.
30. New Slide on a deck whose `present.yml` has no `order:` key: `order:` is added holding the new file.
31. Delete Slide on a one-slide file named twice in `order:` (`engine.md` and `engine.md~2`): the file goes to the Trash and both entries leave `order:`.
32. Drop of an image named `my fig.png`: copied as `my fig.png`, the line `![my fig](<my fig.png>)`; a name `../x.png` is refused, nothing written.
33. New Presentation with an empty title: refused with its sentence; a title holding a newline is written with a space.
34. Dragging `btfno` from `pillars` into `ideas` (whose `find:` takes the ideas tier): refused with its sentence, nothing written.
35. From outline on a file opening with YAML front matter and holding a setext heading `Intro` over `===` and a paragraph line underlined by `---`: the front matter is dropped, `# Intro` opens a slide, the underlined line is a `## ` heading.
36. A draft of `title.md` sent under a second root key that reaches the same file: drawn from the draft; a draft of a path outside the served roots: ignored.

The builder's first task, before any change, is the first run of every case above on the unchanged tree, with each case's result noted.

- A case of a code step (a script, or a product's code) becomes a test of the step only when the rules file's test rule calls for a test of it.
- A case kept as a test is run on the unchanged tree first.
- No prototype script stands in for such a test.
- Every other case of a code step is checked by a run the report quotes, and no test is kept for it.
- A case of a text or judgment step is checked by reading the unchanged tree.
- The first read of a text or judgment case is noted.

When the first run finds a case the brief's own rules get wrong, the builder stops there, before changing any code, and hands back the first run and that case, with the rule and the result it gives. The orchestrator rules on the case and resumes the builder with the ruling, and the final report carries it.

The tests this step keeps are rows of existing entries' tables: G8 (each of `deck-slides`'s new outcomes and each `deck-edit` act changes only its files, and a stale `base` is refused), G9 (each `deck-edit` act and each multi-list `deck-slides` save is recorded and undone), G2 (`deck-edit` and the deck POST refuse a path outside the roots), G32 (the outline split, as the parser of a Markdown file into slides, in `src/lib/data/sources/deck/outline.ts`; and the deck read over drafts, as the deck reader), G49 (the app gate refuses `deck-edit`). The Test lines of G9 and G32 that name titles no test has are corrected to the real titles, and `tests/routes/docs/deck.test.ts` and `tests/routes/edit/deck-slides.test.ts` are named under the entry whose code they test. A case that needs a test outside these entries is handed back before it is written.

## Paths this step writes

- `tools/oculus/src/lib/data/sources/deck/` (any file)
- `tools/oculus/src/lib/data/model/model-entities.ts`
- `tools/oculus/src/lib/server/content/deck/` (any file)
- `tools/oculus/src/routes/api/(docs)/deck/+server.ts`
- `tools/oculus/src/routes/present/print/+page.svelte`, `+page.ts` and `+page.server.ts`
- `tools/oculus/src/lib/server/edit/deck-edit.ts`
- `tools/oculus/src/lib/server/edit/writes/config/deck.ts`, moved with a new `deck-files.ts` into a new folder `writes/config/deck/` (the folder holds ten items, so the move keeps it at ten)
- `tools/oculus/src/lib/server/edit/writes/bodies.ts`, `undo.ts`, `app-gate.ts`, `config/config-write.ts`, and `src/lib/server/edit/writes.ts` (the body-reader export)
- `tools/oculus/src/lib/data/helpers/files/apps.ts`
- `tools/oculus/src/lib/state/client/writes.svelte.ts`, `tools/oculus/src/lib/state/shared/stores/shapes.ts`
- `tools/oculus/src/lib/state/life/present.ts`, `present.svelte.ts`, `slides.ts` (the folder holds ten: new state goes into these files, or into a new subfolder that takes one of them with it)
- `tools/oculus/src/lib/state/shared/stores/desktop.ts` (the bridge's `printPdf`)
- `tools/oculus/src/lib/state/workbench/palette.ts`, `palette-source.svelte.ts`, `tools/oculus/src/lib/shell/keys/Palette.svelte` (a view's commands in the palette)
- `tools/oculus/src/lib/views/shared/explorer/tree/row-ops.ts`, `tree/control/picks.svelte.ts` (the title asked in the row naming)
- `tools/oculus/src/lib/views/academic/present/` (any file)
- `tools/oculus/src/lib/views/academic/slides/` (any file)
- `tools/oculus/src/lib/views/shared/explorer/tree/menu/row-menu.ts`
- `tools/oculus/src/desktop/decide/channels.ts`, `decide/sender.ts`, `decide/window-options.ts`, `src/desktop/windows/bridge.ts`, `windows/windows.ts`, `src/desktop/preload.cjs`, and a new `src/desktop/windows/print.ts`
- `tools/oculus/config/text/` (the files part 9 names: `server.yml`, `desktop.yml`, `views/system/history.yml`, `views/academic/present.yml`, `views/academic/slides.yml`, the files view's text)
- `tools/oculus/tests/` (the rows of the entries named under "Cases", and the tests the change makes obsolete)
- `tools/oculus/.scratch/migration/agents/guarded.md` lines of G2, G8, G9, G32 and G49 (the Code and Test lines only)
- `tools/oculus/HELP.md`, `tools/oculus/DESIGN.md`, `tools/oculus/docs/views.md`, `tools/oculus/docs/files-and-search.md`, `tools/oculus/docs/apps.md` line 435, `tools/oculus/docs/configuration.md` line 64 (the passages part 9 names)
- once Z667 is ruled, as it says: `projects/manuscripts/raw-pls/present/main.md`, `projects/manuscripts/fed-multicellular-immune/present/main.md`, `projects/manuscripts/dries-bttr-ecg/present/main.md`, `projects/archive/published/2026/hccnet-fl/present/main.md`, `projects/manuscripts/hccnet-revision/present/main.md`, `projects/manuscripts/ecg-readable-substrate/present/main.md`, `projects/manuscripts/ward-bttr-crosssubject/present/main.md`, `projects/manuscripts/bttd-source-eeg/present/main.md`
- `tools/oculus/.scratch/migration/agents/reviews/PR3-report.md`

One path per line: a whole file, or a range of lines of a shared document, numbered as on main at the base. The step writes these paths and nothing else.

## Decisions taken in this brief (each reversible, none silent)

1. The slide actions are in a slide's right-click menu and the palette, so the toolbar keeps the reader's controls; Export to PDF is the one new toolbar control (Z666).
2. One write kind `deck-edit` for the acts on slide files (the line-edit module `server/edit/deck-edit.ts` keeps its name, which no reader of History sees), with one record per file holding its text before and after, so every act is undone as one step from History and no act leaves a file and its `order:` entry out of step (Z666).
3. `deck-slides` carries several lists and `order:` in one request applied as one edit, so a move across groups never removes a name from one group without adding it to the other (Z666).
4. The live drawing is a POST of the drafts to the deck route, read on the server, because the slides are built on the server from the files and a second builder in the page would draw differently (Z666).
5. New Slide names `slide-<n>.md`; Duplicate names `<stem>-copy.md`; an image keeps its name, then `-2`; From outline writes `<stem>-slides/`; the PDF is `<deck folder name>.pdf` in the deck's folder, the project's folder name for a project's `present/` (Z666, Z668).
7. An image is copied into the folder of the slide's file, which the reader resolves its images against and which is the deck's folder for every deck on the tree (Z668).
8. The `deck-edit` acts are `new`, `duplicate`, `delete`, `image`, `create` and `outline`, one word each (Z668).
6. The PDF is written through the ops `upload`, so it is recorded and undone like any file the reader adds, and the desktop host writes no file of its own (Z666).

## Libraries checked

Under `libraries: check`. PDF writing: Axel ruled Z665, no new dependency (playwright-core 1.63.0, puppeteer-core 25.12.0, modern-screenshot 4.7.0 with jsPDF 4.2.1 not chosen). Drag and drop: the Slides view's existing drag code and `interactjs` 1.10.28, already a dependency, cover it. Heading split: `marked`'s lexer, already a dependency. No other candidate found.

The builder adds no dependency this brief does not name. A library the builder finds that would cover its work is reported, not installed.

## Read, with sections or line ranges

1. `tools/oculus/src/lib/data/sources/deck/` whole: the format, the keys, the reader.
2. `tools/oculus/src/lib/server/edit/writes/config/deck.ts` and `src/lib/server/edit/deck-edit.ts` whole: the write and the line edit this step extends.
3. `tools/oculus/src/lib/views/academic/slides/Slides.svelte` and `src/lib/state/life/slides.ts` whole.
4. `tools/oculus/src/lib/views/academic/present/` whole.
5. `tools/oculus/src/lib/server/files/fs/ops.ts` `upload` and `trash`, and `src/lib/server/edit/writes/file-undo.ts` head: the file operations reused.
6. `tools/oculus/src/desktop/` `decide/channels.ts`, `windows/bridge.ts`, `preload.cjs`: the bridge pattern.

## Conventions

The rules file's. ASCII only in every file the step writes; the deck files keep the accented letters and the HTML entities they hold.

## Verify before you report

Run from `tools/oculus` in the worktree, each output piped through the filter the rules file names:

1. `npm run test:quick` once, after the last change. Its ASCII gate covers the files the step changes. The report quotes the lines it prints. The plan's whole verify list runs once, at landing on main.
2. `npx vitest run <each test file the step changed>` passes, quoted.
3. `grep -nE "\S - \S" ../../projects/*/*/present/*.md ../../projects/archive/*/*/*/present/*.md` prints nothing.
4. `grep -rn "printToPDF" src` names only `src/desktop/windows/print.ts`; `grep -ni "pptx\|powerpoint"` over the files the step changes prints nothing.
5. Each new or changed test is run on the unchanged tree and after the change.
   - A test of a behaviour the change adds or changes fails on the unchanged tree, in the form it has after its last change, and the report quotes that failure.
   - A test of a behaviour the change preserves passes after the change and, where it can run there, on the unchanged tree, and the report quotes those runs.
   - A case checked by a quoted run is no test and is not judged as one.
6. Every case that writes runs on the scratch server on port 8794 over a copy of the hub's `deck/` folder in a scratch root, and is quoted; no case writes into `deck/` or a project. Cases 16, 18, 24 and 25 are looks at landing: the builder quotes the runs those cases name and never starts the desktop app, since a second start brings Axel's window forward (G48).
8. `npx vitest run` of the tests of G47, G49 and G53, since the step touches their code, quoted.
7. Each new or changed list item and sentence is read against the standards pages' rules on list items and sentence length, and each place it departs from them is named in the report with why it needs its form.

## Report

Write it to `tools/oculus/.scratch/migration/agents/reviews/PR3-report.md`, with these parts in this order.

- The first line: anything NOT done, or "Everything in the brief is done".
- The open items of the state file, verbatim, which hold only what the user must rule on.
- The cases' first run: every case of "Cases" by its number, none left out, each with the command or the reading that checked it and its output as printed, and each case the brief's rules got wrong with the rule, the result and the orchestrator's ruling.
- The DONE / NOT DONE table with the checks above and their output as printed, the ASCII gate's line included. A line shortened with "..." is not verbatim.
- The files with line counts.
- Every judgment call the brief left open.
- Every host- or user-visible change with its before and after.
- Part 8's 40 lines, each before and after (the base copy holds only `tools/oculus/`, so the report lists each project file changed by its path).
- Anything in the brief that was wrong or impossible, with the evidence.
