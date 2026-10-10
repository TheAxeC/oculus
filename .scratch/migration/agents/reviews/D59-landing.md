# D59 landing

Position: the oculus migration plan; step D59, the hub fixes and personal projects, landed. Next: /spec D60 (repositories read as projects of the hub), D61 (the Workbenches view and the status bar's repository) and D62 (apps, the host and the bridge) side by side, then D63, D64, Q72 and O33.

## Open items

None.

## The check of Steps 1

`ListAgents` before the wip commit listed two peer sessions (research-hub-92, ordo-ed) and no agent of D59.

## NOT DONE

Nothing of the step. Two states of the rice red command could not be opened on the gate hub, which holds neither `CAREER.yml` nor the Nudge app: `text:README.md` stood for the open file, and the approval panel was checked by reading (`ApprovalPanel.svelte:108,115,130` read `--fs-lg`, `--fs-xl`, `--fs-sm`). A repository side project's page was not looked at: the scratch hub's repository roots lie under the scratch HOME and do not exist, so the Personal board drew none.

## What landed

From base aff419a0b: 142 paths, +3071 -1849 against main. The booking in `plan.md` under D59 states each item.

- The Help page holds the manual, Research approach, Agent approach, HPC how-to, Data map, the Apps guide and Memories. A saved page gains the documents it lacks once.
- A document row of the Views catalogue and its `h` chord show the `doc` tab a page or float already holds, putting its page on screen, by a click or a shift-click. The row's right-click items open a copy.
- The config cache reads again when a file under `<hub>/.oculus/config/` changes.
- A side project has its own page, the editor, the project card with every action except Deposit, a Cmd-K entry, and the Cards and List switch. Its page's LaTeX panel reads a hub side project's `manuscript/`; a repository side project draws none.
- Focus's Command center and Tasks fold, each kept across a reload.
- A workbench's Files and LaTeX tabs read Files and LaTeX.
- The memories photos and the wallpaper are in `<hub>/.oculus/memories` and `<hub>/.oculus/wallpaper`.
- Under a rice theme no measured text is at or above its size under a VS Code theme.
- `docs/DATA-MAP.md` says each hub's config layer is its own.

## Fixes at landing, 7

- The held engine document is found on the first press after a reload: `engineAtSettled` in `state/system/docs.svelte.ts` waits for the manual's answer, and `Catalogue.svelte` and `Workbench.svelte` reach it through the selectors store.
- HELP.md lines 24 and 26 describe the held document's click, shift-click, chord and right-click items.
- DESIGN.md describes the `held` option, and a page "saved with no record of the paths it was given".
- The `kept.ts` head comment says a label the reader gave a tab stays.
- The rice comment of `themes.css` and the slide comment of `slide.css` are rewrapped at 100 columns. `tokens.css:134` is unchanged: the next word with the comment's close runs to 103 columns.
- G61, G8, G32 and G29 written into `agents/guarded.md`, G29 with the table 'reads $name' and its six rows.
- Found in the look: every hub side project's page drew the LaTeX refusal `no-project`, since `api/latex` looked the id up among research projects only. The route now looks it up with `projectOrSide`, leaving a repository side project out as the build does, and the project page draws no LaTeX panel for a repository side project. After the fix `api/latex?id=side:residual` answers 200 with `"mains":[]`, as `adapter-format-theory` does, and the Residual page draws no panel.

## Verification

In the gate `.agents/worktrees/gate` at main's head with the range cherry-picked:

```
$ npm run diagrams && npm run test:landing
ok      ASCII gate (0.9 s)
ok      npm run lint (3.1 s)
ok      npm run format:check (32.5 s): All matched files use Prettier code style!
ok      npm test (101.6 s)
ok      npm run check, then npm run build, then npm run test:slow (276.4 s)
ok      npm run test:checks (386.5 s)
test:landing: 386.5 s; every command passed
```

`git diff --cached --binary` against main's head: the same hash on main and in the gate (675087f4). No A/B: the configuration names no `bench:`.

## The look

Taken on a scratch oculus from the gate (port 8796, HOME under the scratchpad, the gate as the hub), the browser's saved state for that origin cleared first.

- Help page on a first start: Help, Research approach, Agent approach, HPC how-to, Data map, Apps guide, Memories.
- From Focus: the HPC how-to row (h5), its shift-click and the keys `h` `5` each put the Help page on screen with HPC how-to active, and Focus kept its one tab.
- The row's right-click menu offered Open on this page and Open beside on this page; Open on this page opened a copy on the System page.
- A temporary `docs:` entry for `tools/oculus/docs/apps.md` in the gate's hub layer was read with no restart. The first `h` `7` after a reload showed the Help page's one engine Apps guide tab. The entry was removed afterwards.
- Focus drew the folds of Command center and Tasks.
- The Personal board drew three cards with the Cards and List switch, each collapsed card's next line cut short. The Residual page drew the card's actions, the next line, the files and the documents. Its editor opened over the manifest, and nothing was written.
- Open Workbench on Residual gave the tabs Files, Search, Repositories, LaTeX, Problems and Sessions.
- The Memories wall drew its photos from `/api/memories`, and `/api/wallpaper` answered an image from the hub.
- Under mocha the rail badges read at 8px.
- The diagnosis's red command `red-all.sh`, mocha against vscode-dark-2026 over 16 states: `GREEN: every text under mocha is below its size under vscode-dark-2026`.

## Agents

| Agent | Role | Model | Tokens | Tool uses | Time |
|---|---|---|---|---|---|
| a8937b5db1f83f3b6 | builder | claude-sonnet-5-5 | 204,768 + round 1 120,879 | 470 + 133 | 93.5 + 34.1 min |
| a6e3a619d676d8cdf | brief check | claude-opus-5-5 | 262,611 | 106 | 12.7 min |
| a7d96fd7cc9f172c5 | reviewer | claude-opus-5-5 | 375,724 | 109 | 27.5 min |
| a331fd523c64b7d1d | reviewer over round 1 | claude-opus-5-5 | 311,085 | 101 | 24.4 min |
| ac259ac1e1fc1d63d | diagnosis (item 7) | claude-opus-5-5 | 321,726 | 118 | 55.9 min |

The first report did not pass its bar: one repair round. The diagnosis record `agents/reviews/D59-diagnosis.md` found the cause of item 7: four size sources `body.rice` did not step down.

## Next

/spec D60, D61 and D62 side by side, then D63, D64, Q72 and O33.
