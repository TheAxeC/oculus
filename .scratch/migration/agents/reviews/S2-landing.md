# S2 landing

## Open items

None. Booked, no ruling needed: 3 (Q72, O33, O32).

## NOT DONE

Nothing of S2's brief. Not looked at: a session actually started from the composer on the TEST page (a start runs a real agent under Axel's account); the argv reaching `claude` and `codex` is covered by `composer.spec.ts` against the run's stand-ins, and the two real CLIs were checked to take `--` before a prompt (below).

## What landed

S2, the sessions views rebuilt to VS Code's Agents window, one commit on main (the commit that carries this file). Axel's rulings applied: the composer's choices in `config/catalogs/agents.yml`, and an arrangement's tab in `config/layout.yml` carrying a starting `state:` (the Sessions page's Files tab starts as `{ view: files, state: { follow: true } }`).

- The composer: workspace, agent (Claude, Codex, Shell), account, model, effort and permission mode pickers, a multi-line prompt box (Enter starts, Shift+Enter adds a line) and an attach control; the prompt reaches the agent as one argument after `--`, never through a shell.
- The steer box and Stop for a running session; the sessions list as side-bar sections per workspace, rows of two 22 px lines, pinned-to-top, rename, archive; the Customizations section (instructions, skills, agents, hooks, MCP servers, plugins, tools per account); the Sessions page arrangement with the Files tab following the selected session's workspace; Q35's session picker in every session view.

## Fixed at landing

- The round refutation's seven findings, each under the Closed heading of `S2-refuter.md`.
- `Files.svelte` `held()` declared `FsEntry[] | null`, the type `heldEntries` returns (`npm run check` reported it).
- Three comment lines over 100 columns (`fs.ts`, `sessions-page.spec.ts`), which `comment-width.test.ts` reported.
- The collapse-all title assertion reads the tooltip as the accessible description, as the button carries it.
- From the look: the composer's prompt box showed no cue that it is a field. `TextArea` takes an optional `placeholder` (as `TextInput` does), and the composer shows the box's label there ("The first message", "The first command" for Shell); cases in `sessions.test.ts`.
- From the look: a Files tab following nothing still said "No roots yet. Add a folder to this workspace." under "No session is picked", and kept the breadcrumb of a row its tree no longer drew. The empty sentence is not drawn while following nothing or a folder no root serves, and the breadcrumb is drawn only for a root the tree draws; a case in `files.spec.ts` and an assertion in the follow case of `sessions-page.spec.ts`.
- From the look: the sessions search box took its own width and cut its placeholder ("Search title, promp"). It spans the list now; an assertion in the geometry case of `sessions-page.spec.ts`.
- Checked at landing: the real `claude` 2.1.283 takes `--` before a prompt (`claude -p --no-session-persistence --model claude-haiku-4-5-20251001 -- "mcp: reply with the single word OK"` printed `OK`), and `codex` 0.155.1 takes the word after `--` as its prompt (`codex -- --help` went on to `Error: stdin is not a terminal` instead of printing help).

## Verification on main, after the fixes

- `npx vitest run --reporter=dot`: `Test Files  330 passed (330)`, `Tests  5134 passed (5134)`
- `npm run check`: `COMPLETED 1458 FILES 0 ERRORS 0 WARNINGS 0 FILES_WITH_PROBLEMS`
- `npm run format:check`: `All matched files use Prettier code style!`; `npm run lint`: exit 0
- the ASCII gate over `src` and `tests`: 0 lines; `sh bin/size-check.sh` and `sh bin/folder-check.sh`: exit 0
- `npm run diagrams` twice: the hash of `docs/diagrams` the same before and after both runs (`94f4155f...`)
- `npm run build`: exit 0; `npx playwright test`: `407 passed (6.7m)`
- `node bin/revert-check.mjs` over the unit files whose directives moved: `68 reverts, 0 unproven` (state/sources and server/sessions), `16 reverts, 0 unproven` (`explorer.test.ts`, `follow.test.ts`), `17 reverts, 0 unproven` (`sessions.test.ts`, `wall.test.ts`)
- `node bin/revert-check.mjs` over `sessions-page.spec.ts`, `files-forms.spec.ts`, `files-sections.spec.ts` and `files.spec.ts`: `41 reverts, 0 unproven, 25 unchecked`; over `files.spec.ts` and `sessions-page.spec.ts` after the look's fixes: `24 reverts, 0 unproven, 15 unchecked`. The unchecked cases name no revert.
- `ls -d $TMPDIR/oculus-*`: none.
- Agents: S2's builder `a0d1d20bd4bdc8a6f` and Q67's builder `a9137058567ab4a15` stopped with TaskStop; `ListAgents` shows both `killed`, S2's two reviewers not listed, and X3b's builder `ad0b6c5a79cafa228` running its repair round.

## The look

On the TEST page of the dev server on 8790, under light and under mocha (a rice theme, wallpaper on; the contrast case in `sessions-page.spec.ts` measures every theme): the Sessions list with its workspace sections, the needs-input row, the Customizations section with its seven groups; the composer in a Terminal tab with its pickers and the agent menu (Claude, Codex, Shell) opened and closed; the Files tab's follow toggle following nothing, following a session in `ordo` (no root serves it: "No root holds /Users/axelfaes/workspace/ordo, so its files cannot be listed here.") and following a session in the hub (the tree rooted at `research-hub`). Nothing was started, renamed or archived. The Terminal tab was closed, follow turned off, the theme set back to light and the page left on Config, as found.

## Next

X3b's repair round is running; X3a is specced into the freed slot; X3c after X3b; then L4, Q66, Q35 and the rest of the queue.

## Found after landing, fixed 2026-09-28

Q52's owed look found the Changes view without the session control its empty text names, against this brief's item 8. `Changes.svelte` draws `SessionPicker` first on its bar; the case "draws the session control on its bar that its empty state names" in `tests/views/sessions/changes.test.ts` failed before the fix (1 failed, 23 passed) and passes after it (24 passed).
