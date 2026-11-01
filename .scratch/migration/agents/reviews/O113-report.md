# O113 report: Timeline is a section of the Session view

Everything in the brief is done. Every case a page shows is checked by reading only: the builder runs no page, so each such case's proof is the orchestrator's look at landing, and those rows say so.

## Open items of the state file, verbatim

`sed -n 165,171p .scratch/migration/orchestrator-state.md` prints the heading and the sentence below and no entry:

> An entry leaves this list for the closed log the moment Axel rules on it. What a review or a look found and no brief covered is not an open item: it is folded into an existing step in `plan.md` (Z468), never booked as a step of its own.

## The cases' first run, by reading, on the unchanged tree

No case is one the brief's rules get wrong, so the builder did not stop. "Unchanged" is what the tree gave at base 0c02442c5; "rule" is what the brief's items give once built. Two cases (7 and 8) would have failed had the scroll code of `Timeline.svelte` been carried over word for word. The brief's rule asks for the right result in both, and its code does not give it, so they were built to the rule (Judgment calls 1 and 2).

| # | Case | Unchanged tree | Rule's result, by reading |
| --- | --- | --- | --- |
| 1 | Sections read Details, Changes, Timeline, Agents; head counts turns | Three sections, `session-sections.ts:12` | Holds: `SECTIONS` order; `count` is `timelineTurns(...).length` |
| 2 | Same turns, tags, tones, clocks, tooltips | Drawn by the Timeline view | Holds: markup and `kindLabel`, `text`, `tip`, `TONES` moved unchanged |
| 3 | Past the 200-event cap | `record.ts:373` keeps the newest 200; `folds.ts:205` opens a prompt-less group when the first event held is no prompt | Holds. A window that happens to start on a prompt has no such group; the fixture of the look needs a window starting on a non-prompt |
| 4 | No events | View draws `tl_empty` | Holds: `TreeItem.svelte:245` draws a count of 0, since it tests `count !== undefined` |
| 5 | Close and reopen | `SessionSection` unmounts the body; `named()` drops an unknown id, so `timeline` needs item 1 | Holds: the closed list keeps `timeline`; a remount starts with `stuck` true |
| 6 | Another session picked | View goes to the foot when the id changes | Holds. A pick while the tab is hidden set a scroll that does nothing, so the box also goes to the foot on the return to the tab |
| 7 | Move: at the foot it still follows a push | No section to move | Rule holds; `Timeline.svelte`'s code would not: `each.js:722` moves a block by `dest.before(node)`. By the reconcile at `each.js:531-563`, Alt+Down on Timeline moves the Timeline block, Alt+Up does not. A moved scroller is expected to lose its offset (browser behaviour, not measured here), and a position read at the push then says "not at the foot" |
| 8 | Push: scrolled up, no move; at the foot, follows | View's effect reads the position after the rows are in the DOM | Rule holds; `Timeline.svelte`'s code would not: a push adding more than `SLACK` (24 px) reads as "not at the foot" and is not followed. A row is `--tree-row` 22 px, so two rows, or a new turn with its padding, miss it. `Transcript.svelte:74-77` states this same reason for its scroll listener |
| 9 | More events than the box | View fills its pane | Holds: `max-height: 40vh`; `Pane.svelte:237` `.body` has `overflow: auto`, so the pane scrolls past the box |
| 10 | Rows `--fs-sm`, clocks `--fs-xs` | `--fs-md`, `--fs-sm` | Holds: `.session` sets `--fs-sm`; no global `h4` rule (`grep -rn -E '(^\|[ ,{])h4\b' src --include='*.css'` prints nothing) |
| 11 | Pinned toolbar holds Transcript alone | Transcript and Timeline | Holds |
| 12 | Folder-limited pick | Transcript and Timeline | Holds: `openInto` routes `document: true` to `openOpened`, as it did for `timeline` |
| 13 | No Timeline view on offer; the grep | Grep finds 4 lines (`SessionList.svelte:241`, `Timeline.svelte:5`, `SessionDetail.svelte:104`, `layout.yml:64`) | Holds; the Files section's id is the bare string in `files-view.ts:124`, which the grep does not match |
| 14 | Fresh layout has no Timeline tab | `layout.yml:64` | Holds |
| 15 | A saved `timeline` tab draws as unknown | Registered | Holds: `registry.ts:245` comment and `dropView` state it; no code converts it |

## DONE / NOT DONE

Final run: `npm run diagrams && npm run docs:palette && npm run test:quick -- <the 11 changed paths>`, each read from its own exit (`diagrams exit 0`, `palette exit 0`, `quick exit 0`). The list's last lines:

```
ok      prettier (0.7 s): All matched files use Prettier code style!
ok      ASCII gate (0.8 s)
ok      svelte-kit sync (2.2 s)
ok      svelte-check (10.1 s): 1793564758163 COMPLETED 577 FILES 0 ERRORS 0 WARNINGS 0 FILES_WITH_PROBLEMS
ok      eslint (10.1 s)
ok      vitest (29.4 s): Duration  17.26s (transform 31.23s, setup 0ms, import 53.40s, tests 2.44s, environment 264ms)
ok      vitest slow (37.3 s): Duration  24.92s (transform 12.66s, setup 0ms, import 16.47s, tests 8.28s, environment 0ms)
ok      vitest checks (59.7 s): Duration  47.47s (transform 14.48s, setup 0ms, import 30.08s, tests 122.01s, environment 3ms)
test:quick: 61.9 s; every command passed
```

It does not cover: tests that reach no changed file within the import depth, the build, and the lint of unchanged files, as the list prints. No view is exercised in a page by it.

| Item | State | Proof |
| --- | --- | --- |
| 1 `SECTIONS` | DONE | `session-sections.ts:12`; final run, last line `test:quick: 61.9 s; every command passed` |
| 2 `TimelineTurns.svelte` | DONE | New file; svelte-check `0 ERRORS 0 WARNINGS`; no Pane, bar, picker, registration or record-less state |
| 3 Box and sizes | DONE | `TimelineTurns.svelte:163` `max-height: 40vh`, `:199` `font-size: var(--fs-xs)`, no `--fs-md`, rice rule gone. `getComputedStyle` is the look |
| 4 `SessionDetail.svelte` | DONE | Branch at `:158`, `:174` explicit Agents branch, toolbar `:100` holds Transcript alone, head comments state four sections |
| 5 Delete `views/sessions/timeline/` | DONE | `ls src/lib/views/sessions` prints customization, session-detail, session-list, terminal, transcript |
| 6 `timeline.yml` | DONE | Head line, `section_timeline`; three keys gone: `grep -rnE "view_timeline\|timeline_bar\|timeline_glyph" src tests config docs README.md --exclude=local.yml` prints nothing. Every other key has a reader; `catalog-file-keys.test.ts` passed in the final run |
| 7 Glyph `timing` stays | DONE | `VenueCard.svelte:225`, `Ribbon.svelte:53` print it; `glyphs.yml` not in `diff -rq` |
| 8 `layout.yml` | DONE | `diff` shows the one line gone |
| 9 `card.ts` | DONE | `card.ts:59` |
| 10 `SessionList.svelte` | DONE | `:241`; head comment `:32` |
| 11 Comments and docs | DONE | `selection.svelte.ts` comments, `docs/HELP.md:246,342`, the `timeline` row gone; `diff` of `docs/palette.md` is `44d43 < \| Timeline \| timeline \|` from `npm run docs:palette` |
| No code handles a saved `timeline` tab | DONE | Nothing added; `grep -rnE "['\"]timeline['\"]" src` prints the new section's id (`session-sections.ts:12`, `SessionDetail.svelte:158`) and the Files view's and `Venues.svelte`'s own uses, none about a view or a tab |
| Case grep | DONE | `grep -rnE "pin\('timeline'\)\|openView\('timeline'\|id: 'timeline'\|view: timeline" src config/defaults --exclude=local.yml` prints nothing, exit 1 |
| Perl gate over the changed files | DONE | prints nothing, `perl exit 0` |
| Page cases 1 to 15 | Read; look owed | Proof is the look at landing, see "Before and after" |

## Files with line counts

Made from `diff -rq` against the base copy over `src`, `tests`, `config`, `docs`. All are on the write list. `tests` shows no difference. "Lines" is `wc -l` now; "changed" is the count of `<` and `>` lines of `diff`.

| Path | Lines | Changed |
| --- | --- | --- |
| `src/lib/views/sessions/session-detail/TimelineTurns.svelte` | 208 | new |
| `src/lib/views/sessions/session-detail/SessionDetail.svelte` | 214 | 50 |
| `src/lib/views/sessions/session-detail/session-sections.ts` | 55 | 2 |
| `src/lib/views/sessions/session-list/SessionList.svelte` | 453 | 4 |
| `src/lib/views/shared/card/card.ts` | 244 | 2 |
| `src/lib/state/workbench/selection.svelte.ts` | 114 | 14 |
| `src/lib/views/sessions/timeline/Timeline.svelte` | deleted (213) | deleted |
| `config/text/views/sessions/timeline.yml` | 14 | 6 |
| `config/defaults/layout.yml` | 346 | 1 |
| `docs/HELP.md` | 605 | 5 |
| `docs/palette.md` | 205 | 1 |
| `docs/diagrams/layer-views.dot`, `.svg`, `layers.dot`, `.svg` | generated | counts of edges (for example `views to ui` 1100 to 1098) |

The folder `session-detail` holds 10 files (`ls | wc -l`), the limit.

## Judgment calls, each a decision the orchestrator may reverse

1. **`TimelineTurns` takes a second prop, `place`.** Item 2 says it takes the session record. A DOM move gives a child no signal, so `SessionDetail` passes `order.indexOf(id)`, and `standing` (`:86`) re-runs the effect at `:90`, which puts the box back. This is what makes case 7 hold with the box at the foot at once, instead of standing at the top until the next push. It writes nothing saved.
2. **The foot is kept by a scroll listener (`stuck`, `offset`, `scrolled`), as `Transcript.svelte` keeps it, in place of `Timeline.svelte`'s measure in the effect.** This is a change of mechanism under the rule "follows a push only while the reader is at the foot", and it is what makes case 8 hold for a push of several rows. A reader sees a follow where the view failed to follow.
3. **The return to a hidden tab puts the box back too**, through `useShown` (existing, `state/client/use.ts`). The brief does not name it; it makes case 6 hold when the pick is made while the Session tab is hidden, the default layout's pane shares that tab with Files.
4. `pin(area)` became `openTranscript()`, since one caller with one argument was left.
5. `SLACK` stays 24, the view's value. `Transcript.svelte` uses 40.
6. `data-turn` and `data-instance` on the turns are dropped: `grep -rn 'data-turn' src tests` printed only the old file, and `.session` already carries `data-instance`.
7. HELP's Session bullet words: "Timeline (its turns over time, in a box that follows the newest event while you are at its foot)".
8. `selection.svelte.ts`'s "Sessions are six views, not one" was false after the section merges and is rewritten to name what follows.
9. `registration.order` of `session-detail` stays 4, leaving 3 unused; only the relative order is read.

## User-visible changes, before and after, for the look

Put a scratch server on a page with sessions, HOME scratch, a session with more events than 40vh holds.

| View and state | Before | After |
| --- | --- | --- |
| Session view, a session with events | Details, Changes, Agents | Details, Changes, Timeline, Agents; Timeline's head counts the turns (cases 1, 2) |
| Timeline section rows | Own tab, rows `--fs-md`, clocks `--fs-sm` | Rows at `--fs-sm`, clocks at `--fs-xs` by `getComputedStyle` (case 10); rice face from `.session` |
| A session past 200 events, first event held no prompt | Tab drew the group | First group reads "Before the first prompt"; head counts that group (case 3) |
| A session with no events | Tab drew the message | Head 0, body `tl_empty` (case 4) |
| Close and reopen the section | No section | Closed kept in the tab; box at the newest event (case 5) |
| Pick another session, section open, also with the Files tab on top of the pane | No section | Box at the newest event of that session (case 6) |
| Alt+Down on the Timeline head with the box at the foot, then a push | No section | Box stands at the foot right after the move and follows the push. Same with the box scrolled up: it keeps its offset and does not follow (case 7). Also a drag, Alt+Up, and a reload |
| Append lines to a transcript under the scratch HOME | View followed one row, missed several | Scrolled up: box does not move. At the foot: follows, also for a push of several rows (case 8) |
| Many events | Own tab | Box scrolls; pane's scroll reaches the Agents head (case 9) |
| Pinned Session tab's toolbar | Transcript, Timeline | Transcript alone (case 11) |
| Pick in a folder-limited list | Transcript and Timeline in the documents | Transcript and Session in the documents, no `timeline` tab (case 12) |
| Palette and view menus | Timeline offered | Not offered (case 13) |
| Fresh layout's Sessions page | Timeline tab beside Transcript | Transcript alone in that pane (case 14) |
| A saved `timeline` tab | The view | Unknown view, until the orchestrator changes `~/.oculus/layouts.json` once (case 15) |

## Wrong or impossible in the brief

- The prompt and brief item 1 say to run each command through "the rules file's output filter". `grep -n -i filter .scratch/migration/agents/spec.md` prints nothing, so no such filter exists. Each command's output went to a file in the scratchpad, read by its own exit, as `orchestrator-state.md` "Verification, every package" says.
- `spec.md` names a base for `sh utils/unused-exports.sh` that "the brief names"; the brief names none. The base was taken in the worktree before any change. That run printed a knip error from a missing `.svelte-kit/tsconfig.json`, which `test:quick`'s sync later made. `diff` of base and after: the only lines are those three knip error lines, on the base's side. The step added no line. No export was added.
- The brief's line numbers `docs/HELP.md:343` and `:249` are base numbers; the Session bullet stands at `:342` now that the `timeline` row is gone.

## Limitations and sharp edges

- **Not verified in a page, by anyone yet:** every behaviour above. That a browser drops a moved scroller's offset is known browser behaviour, not measured here. The code at `:90` is right whether it drops it or not.
- **Alt+Down on any section head probably loses the keyboard focus. Unfixed, and not caused by this step.** The block moved in the DOM on Alt+Down is the head's own (`each.js:722`), and moving a focused element drops focus, so a second Alt+Down may do nothing. Alt+Up keeps it, since the neighbour moves. This reads the same for Details, Changes and Agents on the unchanged tree. Case 7's wording (a press moves the section) holds. The fix belongs in the section heads' shared key handling, `SessionSection.svelte` or `list-drag.svelte.ts`, outside the write list. Not verified in a page; the look at case 7 should press Alt+Down twice.
- The box may be a keyboard stop of its own, since Chrome focuses a scroller with no focusable child. Not verified. Arrow keys on it stay with the browser: `TreeView.svelte` `pressedKey` returns for a target that is no row.
- At the cap a scrolled-up reader's `scrollTop` stays and the words under it change as old rows fall off, as in the view.
- `timelineTurns` folds twice per push, in `SessionDetail` for the count and in `TimelineTurns` for the rows, over at most 200 events. Passing the turns down would break item 2's shape.
- The "at the foot" test now lives in `TimelineTurns.scrolled`, `Transcript.svelte:108` and `Console.svelte:106`, three copies with the same count as on the base.
- A tab holding a `sections` list of three would draw Timeline last, by `sectionOrder`. The brief's premise is that no saved layout names `sections`; `~/.oculus` was not read here. Not verified.
- Pushes while the section is closed draw nothing, and the head's count still moves, since `turns` is derived in `SessionDetail`.

## Keys, async paths and untrusted values

- `section_timeline`: joins the group `sessions` in the file that group's Timeline words already used, and collides with no key (`grep -n 'section_' config/text/views/sessions/*.yml` prints details, changes, agents and this one).
- `place`: always found, since `id` comes from `order`.
- Async: the step adds no timer or request. A superseded push re-runs the effect. After close the effects go with the component.
- Event text reaches the DOM as text and `title`, as in the view; no `{@html}`.

## Greps

- Name of the deleted view: `grep -rnE "view_timeline|timeline_bar|timeline_glyph|sessions/timeline/|Timeline\.svelte" src tests config docs README.md --exclude=local.yml | grep -v 'sources/files'` prints nothing.
- Literals: `grep -rnE "['\"]timeline['\"]" src tests config --exclude=local.yml` before the change printed the Files section's uses, `tab-menu.ts:63`, `row-menu.ts:102`, `Venues.svelte:139`, and the four lines this step changed, which are gone. Those others are the Files view's Timeline and are not touched.
- Before helpers: `grep -rn 'timelineTurns' src tests` and `grep -rn -E 'onscroll|scrollTop' src/lib` showed the fold and `useShown`, both reused, and the scroll listener shape of `Transcript.svelte`, copied in shape.
- History words over added comments and titles: `diff -ru <base>/src src | grep -E '^\+' | grep -E '//|/\*|^\+\s+\*' | grep -i -E 'before|used to|no longer|still|always|as before|previously|the step adds|after this'` hits `SessionDetail.svelte:87` "a session the pane still holds", kept wording meaning "holds now"; and in `TimelineTurns.svelte`, `:64` "that still count as reading", carried from the view, same sense, and `tl_before`, a key. No hit compares with an earlier state. `grep -n -E 'O[0-9]{2,}|Q[0-9]{2,}|20[0-9]{2}-'` over the new file prints nothing.
- Exports: `sh utils/unused-exports.sh` added no line.

## Head comments, doc comments and docs re-read

| Text | State |
| --- | --- |
| `SessionDetail.svelte` head comments, `<style>` comment | rewritten; style comment still true |
| `TimelineTurns.svelte` head and doc comments | new |
| `SessionSection.svelte` head | still true (a body that is no row is an `li`) |
| `session-sections.ts` head | still true |
| `SessionList.svelte` head | rewritten |
| `card.ts` `SESSION_VIEWS` and `sessionTab` doc | still true |
| `selection.svelte.ts` head | rewritten |
| `README.md:25,37` "transcript, timeline and changes" | still true, the page still shows them |
| `docs/HELP.md:246,342` | rewritten; `:224,383` are the Files Timeline, still true |
| `docs/apps.md`, `docs/data-map.md` | no mention (`grep -rIl -i timeline docs README.md` prints HELP, palette, README) |
| `config/text/views/sessions/timeline.yml` head | rewritten |

## Tests and checks

The step adds or changes no test, so there is no failing line to quote. `tests` shows no difference against the base copy, and no assertion, allow list or predicate is edited. No test was run on purpose beyond the list and `tests/checks/source/comment-width.test.ts`. No script and no case-run program was written; no library is proposed. No agent was started. Nothing of the step is left running: `ps` for the worktree's vitest, svelte-check and quick processes counts 0.

Reading against the standards: the new sentences follow `agents/spec.md`'s prose and comment rules, widths checked by `comment-width.test.ts`. No departure found.

## Number of full-list runs

3. Runs 1 and 2 went red on one line, `tests/checks/source/comment-width.test.ts`, a comment in `TimelineTurns.svelte` over 100 columns; every other command in them was green. Run 3 is the final run quoted above, all green. No whole-suite command was run.
