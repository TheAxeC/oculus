# O90 landing report

Position: the migration plan (`.scratch/migration/plan.md`), step O90, the board bar's Waiting on filter, landed with the landing commit. In flight: none. Next: /spec O92.

## Open items

None.

## The check of Steps 1

ListAgents, run before the landing commit: no subagent running, only the idle peer session research-hub-6f; none of O90's builder aae26928d468b78b8, its brief check ac1a6cbad4e5cb3e9 or its reviewer a06d8386fc5730138 listed as running.

## NOT DONE

Nothing.

## What landed

- oculus: the range 9f55cd701..migration-O90 (wip fab797ef0), 23 paths, 176 insertions and 79 deletions, with the fixes at landing.
- A project board's bar: the toggle `waiting <n>` after `deadline <n>`, counting the board's projects whose `waiting-on:` is not empty and keeping those while it is on; the group button Waiting on after Venue, listing each person and project waited on once by name, and each value that names neither as written, red, keeping the projects that wait on any value picked.
- The merge trims each `waiting-on:` value, drops an empty one and keeps a repeated one once.

## What changes for a reader (review findings Sp1, B1-B3, kept)

- The Focus Awaiting box: a project whose `waiting-on:` holds only empty values no longer counts as waiting; a submitted one counts under its venue's Under review row. A padded ` amir ` joins Amir Haeri's row instead of a row of its own.
- The Person view's Waiting on block, a person's record page and the question before a delete now list a project that writes the person's key padded.
- The toggle takes room on line 1 of every project board, so at a given pane width one group button fewer may fit before More.

## Fixes at landing

- S1: the doc of `waitingOn` in `src/lib/data/model/model-entities.ts` and the comment in `src/lib/state/boards/focus.ts` say what an entry is.
- S2: the comment in `src/lib/data/snapshot/hubs/merge.ts` rewritten.
- S3: ", not a key" dropped from the head comment of `src/lib/state/boards/board/facets.ts`.
- S4: `docs/HELP.md:306` gives Waiting on a sentence of its own.
- S5, recorded: the builder ran `git -C /dev/null status`, which the spec forbids; it printed nothing and changed nothing.

## Verification

- Gate, after the last change: svelte-kit sync, prettier, ASCII gate, eslint, vitest slow, svelte-check (552 files, 0 errors, 0 warnings), vitest checks and vitest ok, "test:quick: 186.9 s; every command passed".
- Main: the gate's staged diff applied with `git apply --index`; each of the 23 staged paths equal under `cmp` to the gate's file.

## The look, localhost:8790, Axel's page

- Right after the files reached main the dev server's module swap threw `Cannot read properties of undefined (reading 'default')` and lost its connection; after a reload the page loads.
- Projects (47): line 1 reads stale, deadline 1, waiting 1, then Form, Situation, Role, Year, Domain, Venue, Waiting on, More. Pressing waiting 1 leaves BT-Op-Theory alone, "1 of 47 shown". The Waiting on menu lists BT-FNO 1, then Maryam Amir Haeri 1, each with a red dot; picking BT-FNO keeps BT-Op-Theory and the button reads "Waiting on: BT-FNO" (case 17).
- Narrow window: at 1180 px every group shows; at 1120 px Waiting on folds into More, at 1070 px Venue too, at 1000 px Domain too; More lists Domain, Venue, then Waiting on under its heading (case 18).
- Supervision (4 projects, none waiting): waiting 0 and no Waiting on button (case 19).
- The Lead track record board: waiting 2, and More lists Waiting on with BT-FNO, Cathedra and Maryam Amir Haeri at 1 each.
- The status bar's 17 warnings are the BT-FNO manuscript's LaTeX box warnings in the Problems view, not this step's.
- The window size, the Career fold and the Settings page were put back as Axel had them.

## Agents

- Builder aae26928d468b78b8 (claude-opus-5-5): 283406 tokens, 143 tool uses, 18 min 8 s. Its first report passed its bar: no repair round.
- Brief check ac1a6cbad4e5cb3e9 (claude-opus-5-5): 217625 tokens, 67 tool uses, 8 min 49 s.
- Reviewer a06d8386fc5730138 (claude-opus-5-5): 224665 tokens, 64 tool uses, 11 min 34 s.
