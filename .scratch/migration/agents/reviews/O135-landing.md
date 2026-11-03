# O135 landing

Roadmap entry: the cockpit-to-oculus migration. Step O135, an Add Front Matter command for a note (ruling 650). Next: O138, an `interview` and an `offered` status (rulings 657, 659, 660, 663 and 664), reviewed with no finding; then O137 and O139, whose builders have reported.

## Open items

None.

## Steps 1

The runner's agent listing (ListAgents) showed three subagents running: O137's builder aa29cd8b3c25cd0a1, O139's builder a729ad7b0ba28a258 and O138's reviewer afc96bfed496776c2. None of O135's agents (the builder a873dc4f1798414d2, the brief check a283b3d0c29ce5214, the reviewer a75b874ccb284432f, the reviewer over round 1 a9f05aa5b3678a368) was listed.

## Not done

Nothing of the step.

## What landed

The whole range from base c931e9418 (the builder's work and repair round 1, in the wip commit 4e556c1ad), with the fixes at landing: 26 paths, 297 insertions and 92 deletions.

- `readFrontMatter` (`src/lib/data/prose/markdown/front-matter.ts`) is the one reading of a note's header, shared by `scanNote` and the offer; `NOTE_HEAD` is the head the command writes.
- The offer (`src/lib/views/sources/source/status/front-matter-offer.svelte.ts`) gives Add Front Matter on an editable note of a hub (`isNoteFile`) whose text has no header, as the tab action `FRONT_MATTER_ACTION` (label `source.cmd_front_matter`), which the palette lists and the tab's menu shows in its own group.
- A run performs the editor's `prepend`: one edit at the top that one Undo takes back, the caret kept on its text, the keyboard in the editor. A pick on the menu of a tab hidden behind another shows that tab first.
- `docs/HELP.md:407` says where the command is offered. `status/editor-actions.ts` keeps `Source.svelte` at 518 lines. The diagrams `layer-shell.*`, `layer-views.*` and `layers.*` are regenerated.

## Fixes at landing

From the review over round 1 (`agents/reviews/O135-refuter.md`, "Closed"):

- Standards 1: `TabMenuDeps.shown` is required (`src/lib/shell/panes/strip/tab-menu-state.svelte.ts`), the pick's guard reads `deps.shown() !== tab`, and the fixture of `tests/shell/panes/strip/tab-menu.test.ts` gains `shown: () => ''`.
- Standards 2: the offer's flag holds the editor the run was asked of and clears once the text has a header or the tab holds another editor; `prepend` gains `unless` (`src/lib/ui/controls/editor/types.ts`), tested on the model's text when the edit runs (`commands.ts`), and the offer passes the header reading. A note read again from disk while the editor loads gets no second head, and an Editor remounted after a failed read offers the command again.
- Proof: the rows of `agents/reviews/O135-report.md` that quoted figures from before the round now quote those after it.

## Verification

In the gate worktree, `npm run diagrams && npm run docs:palette && npm run test:quick`:

```
test:quick: 26 changed file(s), from git since HEAD
test:quick: 29 test file(s)
ok      prettier (2.2 s): All matched files use Prettier code style!
ok      ASCII gate (2.4 s)
ok      svelte-kit sync (4.8 s)
ok      eslint (25.0 s)
ok      svelte-check (53.0 s): 1793736965311 COMPLETED 582 FILES 0 ERRORS 0 WARNINGS 0 FILES_WITH_PROBLEMS
ok      vitest slow (77.4 s): Duration  47.47s (transform 24.00s, setup 0ms, import 31.01s, tests 16.14s, environment 0ms)
ok      vitest (91.7 s): Duration  63.50s (transform 166.22s, setup 0ms, import 241.51s, tests 3.91s, environment 3.23s)
ok      vitest checks (102.8 s): Duration  74.68s (transform 35.54s, setup 0ms, import 60.40s, tests 166.87s, environment 3ms)
test:quick: 108.0 s; every command passed
```

On main, `git diff --cached --binary` equals the gate's under `cmp`. The verify list equals the page's commands. No A/B: the configuration names no bench.

## The look

A scratch server on 8797 from the gate, with a note `.oculus/notes/look-o135.md` that has no header in the scratch research hub:

- The tab's menu shows Add Front Matter in its own group, after Select for Compare.
- A pick writes `---`, `tags: []`, `---` at the top; the caret is on Ln 4, Col 1 and the keyboard is in the editor.
- The menu then no longer lists the command. One Undo gives the old text back, and the menu lists it again.
- With books.md shown in front of it, a pick on the note's hidden tab shows the note and writes the head there, the keyboard in its editor.
- The palette lists "Markdown: Add Front Matter" on books.md.
- No console error. The server is stopped and 8797 is free.

## Agents

The builder's first report did not pass its bar: the review found Spec 1, Proof 1 to 3, Standards 1 to 3 and Behaviour 1, which repair round 1 closed. The fixes at landing are the three above.

- Builder a873dc4f1798414d2 (claude-opus-5-5): first run 278737 tokens, 148 tool uses, 21 min 27 s; round 1 354292 tokens, 85 tool uses, 12 min 43 s.
- Brief check a283b3d0c29ce5214 (claude-opus-5-5): 229441 tokens, 92 tool uses, 12 min 31 s.
- Reviewer a75b874ccb284432f (claude-opus-5-5): 222808 tokens, 70 tool uses, 11 min 11 s.
- Reviewer over round 1 a9f05aa5b3678a368 (claude-opus-5-5): 204038 tokens, 68 tool uses, 17 min 7 s.

## Next

/land O138, with the hub's option orders of rulings 660, 663 and 664; /refute O137 and O139.
