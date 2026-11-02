# O114 landing

Position: roadmap entry "migration (cockpit to oculus)"; step O114, one Terminal view for a session, landed, the last of O110 to O114. Next: none queued.

## Open items

None.

## The check of Steps 1

`ListAgents` shows the last reviewer as completed and no agent of O114 running before the worktree was committed.

## NOT DONE

- `~/.oculus/layouts.json` is changed on disk, but a 1.0.0 page open on 8790 holds its own copy and its next layout write can bring the old tabs back; a build with O114 would then draw "Unknown view: transcript". The backup is `~/.oculus/layouts.before-O114.json`.
- `tests/checks/imports/cycles.test.ts` fails at the base on Cards.svelte and NestedCards.svelte; the step does not change those files and the landing list does not run it.
- The gap between the `ps` answer and `send-keys` stays: an agent that quits in that moment gets the text typed into its shell.
- Moving a by-hand pane to another session was checked by a test of the driver and of the list, and a live move was not pressed in the look.

## Landed

See O114's booking in `plan.md`: 85 paths, the Terminal view's Live and Transcript switch, the lock, agent detection from the process table, by-hand panes as terminals, the Transcript view removed.

## Verification

`npm run diagrams && npm run docs:palette && npm run test:quick` in the gate: "test:quick: 276.4 s; every command passed".

## Usage

Brief check 313105 tokens, 42 tool uses, 800.0 s; builder 203300 tokens, 501 tool uses, 5152.5 s, round 1 359932 tokens, 98 tool uses, 1467.7 s; reviewer 333851 tokens, 45 tool uses, 1051.8 s; reviewer over round 1 334737 tokens, 51 tool uses, 1019.3 s. The first report did not pass its bar; fixes at landing are listed under Closed in `O114-refuter.md`.
