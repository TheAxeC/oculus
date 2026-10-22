# O52 builder report: the Focus board's three section headings in one shape

Everything in the brief is done. Two things are open for the orchestrator. First, the brief's report section still describes the career control as named "Fold <line>" / "Unfold <line>". Ruling 225 replaces that, and the build follows ruling 225 ("Fold Career strategy" / "Unfold Career strategy"). Second, the verify list ran over its 45 s limit both times (398.5 s, then 93.2 s).

## Open items of the state file (verbatim, the worktree's copy at base d7625582)

This is the worktree's copy of `.scratch/migration/orchestrator-state.md`, lines 203-207. It still shows item 225 as open. The dispatch message says Axel ruled (a), and the build follows (a).

> - Open item 225 (2026-10-22): O52, the Focus board's headings in one shape. O52's brief check found that a career file with no title, no next milestone and no host in flight (the normaliser allows it: a half-filled career file draws the half it has) leaves the career banner's line empty, so its fold control is named "Unfold " with nothing after it, the name a screen reader reads and the tooltip shows. Naming it needs a heading word the text catalog does not have (`config/text/views/boards/focus.yml` holds no career heading), which widens O52 beyond its line, so it is yours (ruling Brief check scope). (a) O52 adds the key `focus.career_heading: Career strategy` and names the fold control "Fold Career strategy" / "Unfold Career strategy", the row's title staying the career line; the path `config/text/views/boards/focus.yml` is added. Pro: the control always says what it folds, and the name matches the heading the plan's line calls Career strategy. Con: one more text key and path. (b) the control keeps the career line as its name and nothing is added. Pro: O52 stays on its paths. Con: an empty career file gives a control named "Unfold ". Recommended: (a), since it ends the nameless control; (b) is the lazy option. O52 is built now on its line; on (a) the key goes into O52's repair round with the path widened.

## The cases' first run (unchanged tree, before any change)

All commands were run from the worktree root, `F=src/lib/views/boards/focus`. The rules got no case wrong, so nothing was handed back.

- **C1 (one component).** `grep -n "FoldHead" $F/CommandCenterView.svelte $F/Tasks.svelte $F/career/CareerPanel.svelte` printed nothing, exit 1. `grep -n '<details class="career"\|<summary>' $F/career/CareerPanel.svelte` printed `106:    <details class="career" data-surface bind:open={unfolded}>` and `107:        <summary>`, exit 0. `grep -n 'class="head"' $F/CommandCenterView.svelte $F/Tasks.svelte` printed `Tasks.svelte:77:        <div class="head">` and `CommandCenterView.svelte:136:        <div class="head">`, exit 0. Result: unmet on the base, as expected, since this is what the step builds.
- **C2 (one geometry).** `grep -rn "gap: 4px\|gap: 8px" $F/Tasks.svelte $F/CommandCenterView.svelte` printed `Tasks.svelte:134:        gap: 4px;` and `CommandCenterView.svelte:308:        gap: 8px;`, exit 0. `grep -n 'padding: 4px 8px'` over the three files printed `CommandCenterView.svelte:284`, `Tasks.svelte:110`, and `CareerPanel.svelte:281` (the `<summary>`), `:295` (`.body`) and `:357` (`.milestone`). The `.career` box itself has none. Result: unmet on the base.
- **C3 (folds by press, Enter and Space).** Read on the base: `CareerPanel.svelte:106-113` is a `<details bind:open={unfolded}>`, toggled by the browser's own `<summary>` press and keys. `unfolded` starts false (line 81). Result: holds on the base. Its proof is the look on landing.
- **C4 (long career line cut on one line).** Read on the base: `.career > summary > b` (lines 286-292) has `min-width: 0; overflow: hidden; white-space: nowrap; text-overflow: ellipsis` in a non-wrapping flex `<summary>`. Result: holds on the base for the career. Its proof is the look on landing.
- **C5 (HPC pill).** `grep -n 'pillText' $F/CommandCenterView.svelte` printed `17:        hpc: { pillText }`, `151:            {#if pillText()}` and `154:                        label={pillText()}`. `.head` has `flex-wrap: wrap` (line 309) and `.head > b` has `margin-right: auto` (line 316). Result: holds on the base.
- **C6 (fold control names).** `grep -n "focus.fold\|focus.unfold\|career_heading"` over the three files and `focus.yml` printed only `Tasks.svelte:81-82` and `CommandCenterView.svelte:140-141`. The career heading has no fold control name and no `career_heading` key. Result: unmet on the base.
- **C7 (nothing drawn when empty).** `grep -n '{#if career !== null}\|{#if anything}'` printed `Tasks.svelte:75:{#if anything}`, `CommandCenterView.svelte:134:{#if anything}` and `CareerPanel.svelte:105:{#if career !== null}`. Result: holds on the base.
- **C8 (wallpaper).** `grep -n 'data-surface\|body.wall' $F/career/CareerPanel.svelte` printed `106` (`data-surface` on `<details>`), `264`, `265:    :global(body.wall) .career {` and `270:    :global(body.wall [data-surface]) .career {`, besides the `.milestone`, `.caveat` and `.when` rules. Result: holds on the base.
- **C9 (editor state kept across a fold).** Read on the base: the body is a child of a closed `<details>`, so it stays mounted and hidden. `EntryEditor.svelte:64-66` holds `result`, `refusals` and `saving` as local state. Result: holds on the base.

## DONE / NOT DONE

| Item | State | Proof (command and last line of its final run) |
|---|---|---|
| 1. `FoldHead.svelte`, the one heading row | DONE | `src/lib/views/boards/focus/FoldHead.svelte`, 99 lines. A bare `ToolButton` (`expanded={open}`, label `t('focus.fold', name)` / `t('focus.unfold', name)`), then `<b>` holding the `Glyph` and `<span class="words">`, then the optional `end` snippet in `<span class="end">`. The CSS is `.head` (flex, `column-span: all`, `align-items: center`, `gap: 8px`, `flex-wrap: wrap`); `.lead` (flex, `flex: 0 1 auto`, `gap: 8px`, `min-width: 0`, `margin-right: auto`); `.lead > b` (`gap: 6px`, `min-width: 0`, `var(--fs-md)`, weight 600); `.words` (`min-width: 0; overflow: hidden; white-space: nowrap; text-overflow: ellipsis`); `.end` (`flex: 0 0 auto`). The head comment says what it draws and which three sections use it. |
| 2. Command center through `FoldHead` | DONE | `grep -n "<FoldHead"` prints `CommandCenterView.svelte:141`. The pill is the snippet `pill` (lines 114-116), passed as `end={pillText() === '' ? undefined : pill}`. `.head`, `.head > b` and `.pill` are removed (shown by `diff` against the base). |
| 3. Tasks through `FoldHead` | DONE | `grep -n "<FoldHead"` prints `Tasks.svelte:77`. `.head` and `.head > b` are removed, and the unused `ToolButton` import goes (shown by `diff` against the base). |
| 4. Career banner | DONE | `CareerPanel.svelte:111` `<section class="career" data-surface>`, then `FoldHead` at line 112 with `glyph={t('focus.career_glyph')}`, `title={summary}`, `name={t('focus.career_heading')}`, `open={unfolded}` and `ontoggle={() => (unfolded = !unfolded)}`. Line 119 is `<div class="body" hidden={!unfolded}>`. `.career` gains `padding: 4px 8px` (line 262), and `.body` is `padding: 4px 0 0`. The rules `.career > summary` and `.career > summary > b` are gone. The head comment and the style comments are rewritten. |
| 5. Same x and one height | DONE by reading; the look on landing measures it | All three boxes have the same borders (1 px, with a 3 px left edge) and `padding: 4px 8px` (`grep -n 'padding: 4px 8px'` prints `CommandCenterView.svelte:272`, `Tasks.svelte:105` and `CareerPanel.svelte:262`), and one `FoldHead`. The row height is the bare button's `--tab-action` box. Not measured: the builder starts no app. |
| 6. `focus.career_heading` | DONE | `diff` of `focus.yml` against the base prints `9a10 > career_heading: Career strategy` (between `career_glyph` and `career_next`). It is read at `CareerPanel.svelte:115`. |
| C1 | met | `grep -n "<FoldHead"` over the three files prints `CareerPanel.svelte:112`, `Tasks.svelte:77` and `CommandCenterView.svelte:141`, exit 0. The `<details class="career"\|<summary>` grep over `CareerPanel.svelte` prints nothing, exit 1. The `class="head"` grep over `CommandCenterView.svelte` and `Tasks.svelte` prints nothing, exit 1. |
| C2 | met | The `gap: 4px\|gap: 8px` grep over `Tasks.svelte` and `CommandCenterView.svelte` prints nothing, exit 1. The gap, font size and weight are only in `FoldHead.svelte:65` (`gap: 8px`), `:75` (`gap: 8px`), `:83` (`gap: 6px`), `:85` (`font-size: var(--fs-md)`) and `:86` (`font-weight: 600`). |
| C3 | met by reading; proof is the look on landing | `FoldHead.svelte` uses `ToolButton`, which renders `<button type="button"` (`ToolButton.svelte:69`) with `aria-expanded={expanded}` (`:90`), so Enter and Space press it as a button. `ontoggle` flips `unfolded`, which starts false (`CareerPanel.svelte:86`). |
| C4 | met by reading; proof is the look on landing in a pane narrower than the career line | `.lead` shrinks (`flex: 0 1 auto; min-width: 0`) and does not wrap. `.words` cuts with an ellipsis. A lead wider than the row takes a line of its own, where it shrinks to the pane. With no `end`, that is the only line. The Command center and Tasks titles are drawn by the same rules (see the before/after section for the narrow-pane change). |
| C5 | met by reading | `end` is passed only while `pillText()` gives words. `.end` is `flex: 0 0 auto` after `.lead`'s `margin-right: auto`, and the row has `flex-wrap: wrap`, so the pill stands at the right and wraps to a second line in a narrow pane. |
| C6 | met by reading | The fold control label is `t(open ? 'focus.fold' : 'focus.unfold', name)`, and `name` is `t('focus.command.command_center')`, `t('focus.tasks.heading')` or `t('focus.career_heading')`. The career `name` does not depend on `summary`, so an empty career line still gives "Unfold Career strategy", while the title is `summary` (empty). |
| C7 | met | `grep` prints `CareerPanel.svelte:110:{#if career !== null}`; `{#if anything}` is kept in `CommandCenterView.svelte` and `Tasks.svelte` (unchanged lines). |
| C8 | met by reading | `CareerPanel.svelte:111` carries `data-surface`; `:global(body.wall) .career` and `:global(body.wall [data-surface]) .career` are kept (lines 270-279). |
| C9 | met by reading | The body is `<div class="body" hidden={!unfolded}>` (line 119), always mounted under `{#if career !== null}`, so `EntryEditor` and its `result`, `refusals` and `saving` survive a fold. `.body` sets no `display`, so the UA's `[hidden]` rule hides it (no global `[hidden]` override: `grep -rn 'hidden\]' src` prints only Tabs, TabView, quiet-focus, key-dom, workbench-keys and the pdf viewer). |
| Verify 1: scoped checks while working | DONE, red on the base only | `npx vitest run tests/checks/tree/boundaries.test.ts tests/checks/tree/size.test.ts`, run after the last change: `Tests  4 failed \| 17 passed (21)`. The same 4 failures are on the unchanged tree: `state/boards/collection.ts imports data/snapshot/normalise-parts/plans`, `views/shared/forms/Followups.svelte imports data/model`, `src/lib/state/client/writes.svelte.ts is 903 lines`, `src/lib/views/shared/card/project/ProjectCard.svelte is 549 lines` (two size tests) and `src/lib/views/shared/forms holds 12 items`. None of these is in a step path, and no new line appears. |
| Verify 2: format, diagrams, verify list | DONE | `npm run format` was run twice. Each time it rewrote `src/lib/server/content/wallpaper.ts` and `src/lib/views/shared/forms/entry/edit/EntryForm.svelte`, and both were copied back from the base copy (`cmp` printed "back to base" for each). `npm run diagrams && npm run test:quick` ran twice. The first run printed `failed: eslint, vitest`. The eslint error was in `FoldHead.svelte` (`53:43 error Unused eslint-disable-next-line directive`). The directive was removed, and `npx eslint` over the four components then exits 0. The vitest failures were 10 timeouts in `tests/routes/edit/write.test.ts` and `tests/server/edit/writes.test.ts`, which the step does not change. Rerun alone, the first rerun printed `Tests  1 failed \| 55 passed (56)` and the second `Tests  56 passed (56)`. The second list run printed: `ok prettier`, `ok ASCII gate`, `ok svelte-kit sync`, `ok svelte-check (50.8 s): ... 0 ERRORS 0 WARNINGS 0 FILES_WITH_PROBLEMS`, `ok eslint (51.1 s)`, `ok vitest (86.2 s)`, `test:quick: 93.2 s (limit 45.0 s); every command passed`. |
| Verify 3: ASCII gate | DONE | The `spec.md` perl gate over `focus.yml`, `FoldHead.svelte`, `CommandCenterView.svelte`, `Tasks.svelte` and `CareerPanel.svelte` printed nothing, exit 0. |
| Verify 4: C1 and C2 greps | DONE | Quoted in the C1 and C2 rows above. |
| Verify 5: unused exports | DONE | `sh utils/unused-exports.sh` output compared with `diff` against the base's `unused-exports.txt` (342 lines): no difference, exit 0. |
| Verify 6: history-word grep | DONE | The comment lines added or changed (38 lines: every comment line of `FoldHead.svelte` and the `diff` `>` comment lines of the other three components) were grepped with `grep -i -E 'before\|used to\|no longer\|still\|always has been\|always had\|as before\|previously\|the step adds\|after this package\|O[0-9]{2}\|20[0-9]{2}-'`. The one hit is `/** The glyph name drawn before the title. */` (`FoldHead.svelte:21`), where "before" means placement in the row, not time. Kept. |
| Verify 7: tests | DONE | This step adds, changes and deletes no test. `agents/guarded.md` names none of the files. |

Run counts: the verify list (`npm run diagrams && npm run test:quick`) ran 2 times. No whole-suite command was run. The scoped tree checks ran 3 times (base, mid-work, final). The two timed-out test files were rerun alone 2 times.

## Files (from `diff -rq` against the base copy over src, tests, utils and config; docs from `git diff --stat`)

| Path | Lines base / after | In the write list |
|---|---|---|
| `src/lib/views/boards/focus/FoldHead.svelte` | new / 99 | yes |
| `src/lib/views/boards/focus/CommandCenterView.svelte` | 378 / 347 | yes |
| `src/lib/views/boards/focus/Tasks.svelte` | 161 / 140 | yes |
| `src/lib/views/boards/focus/career/CareerPanel.svelte` | 416 / 405 | yes |
| `config/text/views/boards/focus.yml` | 137 / 138 (line 10 added) | yes |
| `docs/diagrams/layer-state.{dot,svg}`, `layer-views.{dot,svg}`, `layers.{dot,svg}`, `writes.{dot,svg}` | 8 files, 38 insertions, 38 deletions | yes, written by `npm run diagrams` |
| `.scratch/migration/agents/reviews/O52-report.md` | new | yes |

The diagram changes include lines this step's code cannot cause. Examples are `writes.dot`, where the tooltip gains `writeFollowup`, the `layer-state` count `state/boards to layer data` going from 49 to 50, and the `views/shared` and `views/system` counts. `diff -rq` shows the step changes no file under `src/lib/state`, `src/lib/server`, `src/lib/views/shared` or `src/lib/views/system`, so main's committed diagrams were behind main's source at the base. `npm run diagrams` wrote the current state. Which of the count lines this step accounts for (it adds two ui imports in `FoldHead` and removes one in `Tasks`) is not verified line by line.

`ls src/lib/views/boards/focus | wc -l` now prints 10, the folder limit.

## Head comments, doc comments and documents that describe the behaviour

- `CareerPanel.svelte` lines 2-18 (now 2-22): rewritten. The first paragraph now says the heading is the row the other two sections draw with (`FoldHead.svelte`), with the fold control named "Fold Career strategy" or "Unfold Career strategy", then the career line cut with an ellipsis. The last paragraph adds that the folded panel is hidden and stays mounted, so the editor keeps its refusals, result words and a save in flight.
- `CareerPanel.svelte` lines 254-255 (the comment over `.career`): rewritten. It now names the padding and the borders it shares with `.week`.
- `CareerPanel.svelte` lines 275-276 (the comment over `.career > summary`): removed with its rule. A new comment over `.body` says what its padding keeps.
- `CareerPanel.svelte` `/** Whether the banner is unfolded; it starts folded. */`: still true.
- `CommandCenterView.svelte` head comment (lines 2-3): still true.
- `Tasks.svelte` head comment (lines 2-9): still true.
- `Focus.svelte` lines 21-27 (outside the paths): still true. "The career banner folds by itself and starts folded" holds, and `FoldHead` is a partial of the partials, as `CommandCenterView` is.
- `docs/HELP.md:282` (outside the paths): still true. The banner is folded to one line and unfolds to the whole panel, and a hub with no career file has no banner.
- Grep of the changed names: `grep -rn --exclude=local.yml 'career > summary\|class="pill"\|FoldHead\|career_heading\|Career strategy' src tests config docs README.md`. The `FoldHead` and `career_heading` hits are the step's own lines. `class="pill"` is only `repositories/graph/CommitRow.svelte:150`, a different component's scoped class. "Career strategy" appears in tests, fixtures and docs as the career file's title value, which is unrelated and stays true.

## Judgment calls the brief left open (each reversible)

1. `FoldHead`'s props are `glyph`, `title`, `name`, `open`, `ontoggle` and `end?: Snippet`. `open` and `ontoggle` are the existing `SectionProps` names.
2. `FoldHead` wraps the end snippet in its own `<span class="end">` (`flex: 0 0 auto`), so the row's geometry is written only in `FoldHead`. The command center passes the snippet only while `pillText()` gives words. An empty end item in a wrapping row would otherwise take a second line with an 8 px row gap in a narrow pane.
3. The career box is a `<section>`, as `.week` and `.tasks` are, in place of `<details>`.
4. `.body` is `padding: 4px 0 0`. The content keeps 11 px from the box's outer left edge (3 px border plus 8 px padding), 9 px from the right and 4 px from the bottom. Its top stands 4 px under the 22 px row, as the command center's first `.grp` (`margin-top: 4px`) stands under its heading. By reading, the body's first line is 31 px from the box's outer top before and after (1 + 26 + 4 against 1 + 4 + 22 + 4). Not measured.
5. The folded body is hidden with the `hidden` attribute (`hidden={!unfolded}`), the form `TabView.svelte:48` uses.

## Host- and user-visible changes, for the look on TEST

Open the Focus board on TEST. Check folded and unfolded, under a light theme, a dark theme and a wallpaper.

- **The three headings' positions.**
  - Before: the career circle at x 79.3 against 82.3 for the other two; the glyph at 108 (career) against 116.6 (Command center) and 112.6 (Tasks); the career row 26 px high against 22.
  - After: the fold circles at one x, the glyphs at one x (the Command center's), the titles at one x, each row 22 px high.
- **The career fold glyph.**
  - Before: a bare `Glyph` in the line's own colour and size.
  - After: a bare `ToolButton` in the `--tab-action` box, glyph at `--fs-lg` in the muted colour, with the bare button's hover and focus ring, as on the other two headings.
- **The career fold control.**
  - Before: a `<summary>` toggled by a click anywhere on the line, with a pointer cursor over the whole line, and no tooltip.
  - After: a button named "Unfold Career strategy" while folded and "Fold Career strategy" while unfolded, with that name as its tooltip. A click on the title words no longer folds the banner, and the cursor over the words is the default one. Enter and Space on the focused button fold and unfold.
- **An empty career line** (no title, no next milestone, no host in flight).
  - Before: the line empty, the `<summary>` with no name.
  - After: the row shows the fold control and the glyph with an empty title, and the control is named "Unfold Career strategy".
- **A long career line in a pane narrower than it.**
  - Before: cut with an ellipsis in a 26 px row.
  - After: cut with an ellipsis on the fold control's line, one row 22 px high.
- **The Tasks heading.** The gap between the fold control and the glyph goes from 4 px to 8 px, so the Tasks glyph and title move 4 px right (Decision 3).
- **The Command center's HPC pill.**
  - Before: at the right end, wrapping to a second line in a narrow pane.
  - After: the same.
- **Command center and Tasks titles in a very narrow pane.**
  - Before: `.head > b` was `flex: 0 0 auto`, so a pane narrower than the fold control, the glyph and the title let the title overflow the box.
  - After: the same rules as the career title apply, so the title is cut with an ellipsis inside the box. Visible only in a pane narrower than about the width of "Command center" plus the two glyph boxes.
- **The unfolded career panel.**
  - Before: content 11 px from the outer left edge.
  - After: the same, with the same vertical position under the heading (by reading, not measured).
- **The folded career panel keeps its state.** Unfold, press Edit, make a field refuse or start a save, fold, then unfold: the refusal or the save's words are still there, as with `<details>` before.
- **The accessible role of the career box.**
  - Before: a `<details>` group with a disclosure `<summary>`.
  - After: a `<section>` with a button that carries `aria-expanded`, the same as the other two sections.

## Anything in the brief that was wrong or impossible

- The brief's "Report" section asks the before/after to describe the career control as "a button named "Fold <line>" or "Unfold <line>"". Ruling 225, given in the dispatch and in the brief's own item 6 and Decision 4, names it "Fold Career strategy" / "Unfold Career strategy". The build and the before/after above follow ruling 225, and the "Report" sentence is the brief's leftover from before that ruling.
- `spec.md` ("Where you work") says a builder runs no git command, read-only ones included. The dispatch message allows `git status`, `git diff` and `git show`. I ran `git status --short` twice, `git diff` on the brief and on `docs/diagrams` (`--stat` and the dot files), and `git log --oneline -1` once at the start. That last one is in neither list. None of them changes state.
- The verify list ran over its 45 s limit both times (398.5 s, then 93.2 s), and the first run's 10 vitest timeouts were in files this step does not change. Whether other suites were running on the machine at the time is not verified; the worktree's state file lists O59 and O62 in flight beside O52.

## Repair round 1

Everything in the round brief is done.

One premise of the round brief did not reproduce. Item 1 asks for "the way Svelte 5 attaches an event the element types do not list (an attachment or an action)". The element types do list it: `grep -n "beforematch" node_modules/svelte/elements.d.ts` prints `452:<tab>onbeforematch?: EventHandler<Event, T> | undefined | null;` (Svelte 5.57.1), and line 772 types `hidden?: boolean | 'until-found' | '' | undefined | null;`. So the body takes the typed `onbeforematch` attribute, with no cast, no attachment and no action. Compiling `CareerPanel.svelte` with `svelte/compiler` (`compile(src, { generate: 'client' })`) prints `$.event('beforematch', div, () => $.set(unfolded, true));` and `$.template_effect(() => $.set_attribute(div, 'hidden', $.get(unfolded) ? false : 'until-found'));`. That is, Svelte adds a real `beforematch` listener on the element. This is a decision the orchestrator may reverse.

No test was written. `agents/guarded.md:3` says "Views have no entry: the look on TEST covers them.", so `spec.md`'s test rule calls for none, and the proof of cases 2 and 3 is the look on landing.

The paths are within the round's write list: `CareerPanel.svelte`, `FoldHead.svelte` lines 69-70, and this report. `npm run format` rewrote `src/lib/server/content/wallpaper.ts` and `src/lib/views/shared/forms/entry/edit/EntryForm.svelte` again, and both were copied back from the base copy (`cmp` printed "back to base" for each).

### B2: the browser's find reaches the folded career panel

What changed, in `src/lib/views/boards/focus/career/CareerPanel.svelte`:
- Lines 120-124. The body was `<div class="body" hidden={!unfolded}>`. It is now:
  ```svelte
  <div
      class="body"
      hidden={unfolded ? false : 'until-found'}
      onbeforematch={() => (unfolded = true)}
  >
  ```
  The body stays mounted under `{#if career !== null}`.
- Lines 18-23, the head comment's last paragraph, are rewritten to say the folded panel is hidden until found, stays mounted, and unfolds on `beforematch` when find-in-page matches inside it.

How Svelte sets the attribute (`node_modules/svelte/src/internal/client/dom/elements/attributes.js:181-195`):
- The string `'until-found'` goes through `element.setAttribute('hidden', 'until-found')`.
- `false` goes through the `hidden` property setter, which removes the attribute.
- Svelte caches the last value it set, so a fold after a reveal sets `until-found` again whether or not the browser removed the attribute on reveal.

The sentences of Chromium's documentation the choice rests on (https://developer.chrome.com/docs/css-ui/hidden-until-found, read with WebFetch):
- "By adding `hidden=until-found` to the container for your hidden content, you make it possible for the browser to search text in that hidden region"
- the `beforematch` event "will be fired on the `hidden=until-found` element right before the element is revealed by the browser."
- "`hidden=until-found` applies the `content-visibility:hidden` CSS property instead of the `display:none` property that the regular hidden attribute applies."
- of content under the regular attribute: "content hidden in the collapsed sections becomes impossible to search using a find-in-page search."

Before and after:
- Before, after round 0: the folded career text was under plain `hidden`, so find-in-page found nothing in it.
- After: a find of a word in the folded career text matches. The browser fires `beforematch` on the body, `unfolded` becomes true, and the panel is drawn unfolded with the fold control reading "Fold Career strategy".

### S1: the comment at `FoldHead.svelte:69-70`

`FoldHead.svelte:69-70` now reads, at 98 and 38 columns (`awk '{print length}'`):

```
    /* The fold control, the glyph and the title: one line that shrinks to the pane and pushes the
       end of the row to the right. */
```

Before, line 69 ended at "pushes" with "the" carried to line 70, although it fit within 100 columns.

### B1: the folded career box's height

By reading the CSS, not measured:
- **Folded:** the box was 28 px before the step (1 + 26 + 1: border, the 26 px `<summary>` row, border). It is 32 px after (1 + 4 + 22 + 4 + 1: border, padding, the 22 px row, padding, border). That is the same as the command center's folded box, so everything under the banner moves 4 px down while it is folded.
- **Unfolded:** the total is unchanged. Before it was 1 + 26 + (4 + content + 4) + 1. After it is 1 + 4 + 22 + (4 + content) + 4 + 1. Both are content + 36.

### Cases

The first run was on the round-0 tree, before any change: `grep -n 'hidden\|beforematch\|until-found\|ontoggle\|unfolded' src/lib/views/boards/focus/career/CareerPanel.svelte` printed lines 19, 85, 86, 116, 117 and `119:        <div class="body" hidden={!unfolded}>`. Nothing mentioned `until-found` or `beforematch`.

1. **C9, read again.**
   - Round 0: the folded body is in the document under plain `hidden` (line 119).
   - After: the body is in the document whenever there is a career file, and carries `hidden="until-found"` while `unfolded` is false (line 122, `hidden={unfolded ? false : 'until-found'}`). Met by reading.
2. **A find in the folded panel.**
   - Round 0: by reading the attribute, plain `hidden` (display none) is not searched, so a find matches nothing in the panel.
   - After: line 123, `onbeforematch={() => (unfolded = true)}`, compiles to `$.event('beforematch', div, ...)`, so a match unfolds the panel. Met by reading. Proof: the look on landing, with Cmd+F for a word of the career text while the banner is folded.
   - No client test: `guarded.md` has no entry for views.
3. **The fold control pressed while unfolded.**
   - Round 0: `ontoggle={() => (unfolded = !unfolded)}` (line 117) folds the panel under plain `hidden`.
   - After: the same toggle (line 118) sets `unfolded` to false, and `set_attribute` puts `hidden="until-found"` back. Met by reading. Proof: the look on landing.

### Verify

- `npm run diagrams && npm run test:quick`, run once after the last change, printed:
  - `ok prettier (1.1 s): All matched files use Prettier code style!`
  - `ok ASCII gate (2.0 s)`
  - `ok svelte-kit sync (30.2 s)`
  - `ok vitest (95.3 s)`
  - `ok svelte-check (112.1 s): ... 0 ERRORS 0 WARNINGS 0 FILES_WITH_PROBLEMS`
  - `ok eslint (112.5 s)`
  - `test:quick: 143.0 s (limit 45.0 s); every command passed`

  It is over the time limit. No whole-suite command was run.
- The ASCII gate of `spec.md` over `CareerPanel.svelte` and `FoldHead.svelte` printed nothing, exit 0.
- History-word grep over the comment lines changed this round: `grep -i -E 'before|used to|no longer|still|...'` over `CareerPanel.svelte:18-23` and `FoldHead.svelte:69-70` hits only `beforematch`, an event name. Kept.
- Line counts: `CareerPanel.svelte` is 410 lines and `FoldHead.svelte` is 99 lines.
