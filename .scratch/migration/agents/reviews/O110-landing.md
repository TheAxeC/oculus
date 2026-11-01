# O110 landing

Position: roadmap entry "migration (cockpit to oculus)"; step O110, terminal text keeps its characters, landed. Next: O111, alone, then O113 and O114.

## Open items

None.

## The check of Steps 1

The builder and both reviewers had ended before the worktree was committed; the agent listing shows none running.

## Not done

A live resize of a wide pane was not looked at. Rice is not looked at for O112.

## What landed

`createParser` decodes a reply line to UTF-8 and closes a block only on its matching line; `control` gives the final newline `run` gives. G90 widened. `sessions.test.ts` waits for the client.

## What was found

The first run found the missing final newline (Z1090). The review found the truncation by a pane line beginning `%end ` or `%error `, closed in round 1.

## Verification

`npm run diagrams && npm run docs:palette && npm run test:quick`, gate worktree: `test:quick: 69.8 s; every command passed`. Staged diff on main equals the gate's. Look on port 8797 as booked.

## Usage

Builder 235022 tokens, 36 tool uses, 477.5 s. Brief check 175851, 20, 347.7 s. Reviewer 183290, 26, 499.7 s. Over round 1: 200141, 40, 1260.6 s. The first report did not pass its bar; one fix at landing, in `sessions.test.ts`.
