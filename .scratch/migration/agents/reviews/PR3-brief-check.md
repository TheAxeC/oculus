# Brief check of step PR3

Read on main at e7952e16 by a fresh agent; the brief is `agents/briefs/PR3.md`. The findings are given below by check, as the agent reported them; the session's change for each is under "Closed".

## 1. Names

- `docs/apps.md:435` (the writes an app cannot ask for) and `docs/configuration.md:64` (what the change log records) become incomplete or false; neither is in the write list.
- `DESIGN.md:390` describes `deck-slides` as writing one group's list; part 9 only names the closed-writes sentence.
- `config/text/views/system/history.yml:51` `kind_deck_slides: deck group` would label an `order` record; `config/text/server.yml:50-57` `server.deck_slides.changed` names a group's list, which case 3 uses for a stale `order.base`.
- `src/lib/server/edit/writes.ts:204` re-exports every body reader and is not in the write list.
- `deck-edit` is also the module `src/lib/server/edit/deck-edit.ts` and its test; "Outline" also names the Files view's Outline section and the LaTeX outline.
- `src/lib/state/shared/stores/desktop.ts:67`, the page's type of the bridge, is not in the write list.
- No hits for the new route, channel, act or field names.

## 2. The step line

Every part of the step line (`plan.md:655`) has a requirement. Part 4 copies an image into the folder of the slide's file, where the step line and `PR2-design.md:7` say the deck's folder; the two differ for a slide file in a subfolder. The step line and Z664 still say 38 lines; the brief says 40. Part 9 maps to no part of the line and is required by `spec.md:66`.

## 3. Premises

Every claim of "What is on the tree" reproduces (line counts, `order:` entries, keys, the model, the kinds, the write chain, the row menu, the upload, the drafts, no print code, the dependencies, the routes, `deck/closing.md`, the 40 lines in 8 files with 41 dashes and no formula minus, 21 slides for case 24 computed from the files). Not said: `src/lib/server/edit/writes/config/` holds ten items, so a `deck-files.ts` beside `deck.ts` breaks the ten-item rule; `src/lib/state/life`, `tests/routes/edit` and `tests/data/sources` hold ten; `Present.svelte` is 511 lines and `Slides.svelte` 442 against 520.

## 4. Cases and checks

- G1 does not cover the deck POST (a read), and the write route's G1 row already covers every body: drop the G1 rows, keep case 15 as a quoted run.
- G9's and G32's Test lines name titles no test has; `tests/routes/docs/deck.test.ts` and `tests/routes/edit/deck-slides.test.ts` are under no entry.
- The outline split's file is not named, so G32's Code line may not cover it.
- G49, G47 and G53 cover code the step touches and are not named.
- Cases 16, 18, 24 and 25 need a DOM or the desktop app, which `spec.md:61` gives to the look; case 24 would bring Axel's window forward (G48).
- Case 24 expects `deck/deck.pdf` while verify 6 forbids writing the real `deck/`.
- Part 8 writes 8 files under `projects/` with no script, against `spec.md:37` and `:101`; a rewording is judgment, which the hub's rules keep out of scripts. A rule clash for the orchestrator to settle.
- The base copy holds only `tools/oculus/`, so the `projects/` changes need their own listing.
- Verify 4's `pptx` grep fails on the unchanged tree (`config/behavior.yml:69,192,193`, `config/catalogs/options.yml:330`) and reads `config/local.yml`.
- Verify 5 promises the brief says which test is an audit and names none.

## 5. The question

- Case 2 passes with an order edit that moves only one-line entries; the grid entry is five block lines.
- Edit Slide on a summary or a grid has no case.
- Case 10 cannot pass under part 2's rule: deleting the first slide removes the separator after it, which is the second slide's front-matter opener.
- Duplicating a first slide with front matter gives `---` twice.
- Part 3's server read over drafts has no test row.
- Case 26 passes with ` - ` replaced by `--`; the before and after list is the proof.

## 6. Implied inputs

A `~2` key on Delete; a file named in `order:` and missing on disk; a flow `order:` list; no `order:` key; a root's own folder as a deck; a project deck's PDF name (`present/present.pdf`); an image name with a space, `(`, `/` or `..`; a title with a newline, empty, or starting `#`; a PDF over 32 MB; a print route that never sets `data-ready`; the same deck in two panes; a draft outside the served roots or under a second root key; a member deck in another root (`source` needs `root`); a stale `after` key; where the page gets `base`; a member dropped into a group whose `find:` does not find it; an outline file with front matter, a setext level-1 heading, a `---` underlining a paragraph; a group named `order` or a file token `slides:x`; an image's bytes in the change log; the undo of an old-shape `deck-slides` record.

## 7. ADRs

None: `ls tools/oculus/docs/adr docs/adr` prints "No such file or directory" for both.

## 8. Dictated text

- The fenced body shapes leave out the acts of parts 5 and 6, and `new_deck` mixes snake case with plain words.
- `# New slide` is reader-facing words outside the catalog (`spec.md:48`).
- Decision 1 uses the negation-contrast construction.
- Every other dictated line holds (the image link, the `present.yml` and `closing.md` templates, the menu items, `***`, the print call, case 20's title); the brief holds no non-ASCII.

## Declined to judge

The save path's marking of the file store; the 21 pages by running the reader; Electron 44.5.1's `printToPDF` with `@page` px sizes in a hidden window; whether part 8 falls under the `remove-unicode` skill; whether `interactjs` is needed.

Usage: a8ea4645a98e6dde0, claude-opus-5-5, 218,976 tokens, 88 tool uses, 12.1 min (from its completion notice).

## Closed

- Check 1, the docs and catalog lines: part 9 names `docs/apps.md:435`, `docs/configuration.md:64`, `DESIGN.md:390`, a History kind word for the order record (`kind_deck_order`) and its own refusal sentence `server.deck_slides.order_changed`; the write list names those files, `config/text/server.yml`, `desktop.yml`, `src/lib/server/edit/writes.ts` and `src/lib/state/shared/stores/desktop.ts`.
- Check 1, `deck-edit` and "Outline": both kept and stated in the brief (Decision 2 and part 6), booked as Z668.
- Check 2, the image folder: the folder of the slide's file, stated as Decision 7 (Z668), the deck's folder for every deck on the tree. The count: the step line reads 40 in `plan.md`; Z664 keeps Axel's words.
- Check 3, folder sizes: `deck.ts` and `deck-files.ts` go into a new folder `writes/config/deck/`; the state folder takes new state in its files or a subfolder; the Present and Slides folders are "any file".
- Check 4, G1: no G1 row; case 15 is a quoted run; G2, G49 named; G47, G49, G53 tests run (verify 8).
- Check 4, G9 and G32's stale Test lines and the two unnamed test files: the builder corrects and names them; the outline split lives in `src/lib/data/sources/deck/outline.ts` under G32.
- Check 4, the DOM and desktop cases: 16, 18, 24, 25 are looks at landing, with the runs the builder quotes named in each; the builder never starts the desktop app.
- Check 4, case 24's location: every case that writes runs over a copy of `deck/` in a scratch root; the worktree's `deck/` is read only.
- Check 4, part 8: raised to Axel as open item Z667 (a rule clash), booked in the state file and under PR3's Step 0; part 8 in the brief waits for the ruling, and the builder does parts 1 to 7 and 9 first.
- Check 4, the base copy: the report lists each project file changed by path.
- Check 4, verify 4: the `pptx` grep runs over the files the step changes. Verify 5's audit clause removed.
- Check 5, case 2: case 27 moves the five-line grid entry and a flow entry.
- Check 5, Edit Slide on a summary: case 11a.
- Check 5, Delete and Duplicate of a first slide: part 2 states the separator rules from `split.ts`; case 10 rewritten.
- Check 5, the draft read: a G32 row.
- Check 5, case 26: the before and after list is read line by line; `--` named as not allowed.
- Check 6, each implied input: stated in parts 1 to 7 with its result, and cases 28 to 36 added (the old-shape undo, a missing named file, no `order:` key, a `~2` delete, image names, titles, a member dropped outside its group's `find:`, the outline's front matter and setext headings, drafts under a second root or outside the roots); the PDF name, the root's own folder, the 32 MB limit, the 60 s print timeout, two panes, `source.root`, a stale `after`, `base` read through the source route, record keys, and an image recorded by path and SHA-256 are in parts 1 to 4 and 7.
- Check 8, the body shapes: `create` and `outline` in the fenced block; acts are one word each (Z668). The heading's words are `server.deck_edit.new_slide_heading`. Decision 1 states the choice directly.
- Dictated lines added after the check, each held against the prose rules (plain, ASCII, no dash stand-in, no history): the two fenced body lines, the `order:` block of part 6, `kind_deck_order`, `server.deck_slides.order_changed`, `server.deck_slides.not_found_by`, `server.deck_edit.new_slide_heading`, the image link `![<stem>](<<name>>)`; each holds.
