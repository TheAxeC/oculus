# O39 part A landing

Position: roadmap entry the cockpit-to-oculus migration; step O39 (oculus in its own repository), the last open step, part A of three (the new repository's own files and `CLAUDE.md`, the theme lists, groups and first paint); next: O39 part B (the filtered clone, the checks, the GitHub repository, the Release, the Lima run), then part C path by path on Axel's yes.

Open items: none.

## Check of Steps 1

The builder a2e8810ef4785fd47, the reviewers a32b6d70ea5cdc87a, a9bd27380cac16947 and ad8fb318e8e3d6926 and the brief check aeebe0d3e26943120 had ended before the landing began; ac49a900edbdff4fe was stopped on Axel's word. The agent listing at the commit shows no subagent running.

## NOT DONE

- The look on TEST: no Chrome was connected (`list_connected_browsers` returned an empty list). It is booked in `agents/reviews/owed-looks.md` under "To take": the Theme and Code theme choices with their groups, Cmd-K's `:theme`, the Oculus and `theaxec.github.io` cards, and a desktop window on an app's theme from its first paint. Axel's server on 8790 runs main's checkout and needs a restart before the look, since the server reads the config at start.
- Parts B and C of O39, which are the orchestrator's work after this landing.

## What landed

O39 part A from base e9fd29162, the whole range with repair rounds 1 and 2, onto main at c50e68bc0: 129 files, +4187 -1126 with the fixes at landing. The booking in `plan.md` under O39 lists the parts: the new repository's `.agents/plan.yaml`, `.gitignore` lines, `.oculus/project.yml`, `CLAUDE.md` with its `AGENTS.md` link; Theme and Code theme as two lists, `code_themes.vscode` by `class` and `code_themes.shiki` by `id`, each theme under its row's group; the six Shiki duplicates labelled " (Shiki)" in config; every UI theme label capitalised, the terminal labels by Shiki's names; an app's colour theme drawn from a window's first paint, the host filling the window from the same file and fetching it from an oculus it did not start; the refusal of a workspace folder inside a hub removed, and `theaxec.github.io` added to `.oculus/workspaces/research-hub.yml`; `agents/guarded.md` G118 and G119.

## What was found

The builder's first report did not pass its bar: the review's findings went to round 1, and rulings 186, 187 and 188 to round 2 (ruling 191).

Fixes at landing, twelve:

1. The host asks an oculus it did not start for the app themes before the window opens (`fetchAppThemes` in `src/desktop/server/health.ts`, `startThemeNames`, `appThemeNames`, `themeAnswer`), with `tests/server/desktop/attached-themes.test.ts`.
2. The page drops an app theme whose first-load file failed only while the offers it failed under still stand (`src/lib/shell/window/appearance.svelte.ts`).
3. `themeClass` gives a pending app theme the start class.
4. One start-theme lookup, `startOf` in `src/lib/data/helpers/editor/start-theme.ts`, for the page and the host.
5. `withoutThemes` moved into `src/lib/state/shared/words/appearance.ts`, so the shell imports no `data/helpers`.
6. `src/lib/data/places/code-rules.ts` without the `guards` import a `data/places` file may not make.
7. Four comments rewrapped at 100 columns (`roots.ts`, `undo.test.ts`, `theme-groups.test.ts`, `window-guard.test.ts`).
8. Ruling 190's labels and ruling 192's `code_themes.shiki` rows, with their check, findings, options help, pages and tests.
9. The `HELP.md` and `docs/templates.md` sentences on the keyed lists and the Shiki list.
10. Ruling 187's workspace folder line.
11. The guarded entries of Z971.
12. The desktop host read the stylesheets from the folder `--engine` names, which may hold `config/` alone, so under such a folder `readdirSync` threw and no window was made. That is what made the Electron row "brings the running app forward on a second start" hang at 600 s in the builder's round 2 and in the first gate run. `startColours` now takes the checkout `code` for the sheets beside `engine` for the config (`src/desktop/windows/start-colours.ts`, `src/desktop/app.ts:133`). The new row "reads the sheets from the code folder when the config folder holds config/ alone" in `tests/server/desktop/window-guard.test.ts` covers it; a call of the step's `startColours` with such a folder threw `ENOENT ... scandir '.../cfgonly/src/lib/themes/rice'`. With the fix the five Electron rows of `start.test.ts` passed alone in 173.3 s, the second start in 50.4 s.

The diagrams were regenerated after fixes 5 and 6.

Measured and left as it is: `startColours` loads the merged config on each window it fills, 179 to 202 ms per call on this machine (a node timing of three calls), on the Electron main process. The step leaves `loadConfig` itself as fast as before (mean 164.5 to 166.5 ms with the step, 170.3 to 181.7 ms at main's head, ten calls each).

Builder departures: the quick tier run four times in round 2 where two were allowed, and one vitest run over `tests/server/desktop` that started `start.test.ts`. The orchestrator's own run of `tests/server/desktop` in main's checkout during this landing also started that file and rebuilt main's gitignored `build-app/`.

## Verification

In the gate `.agents/worktrees/gate` at 1bdb9ead1 (main's oculus tree; main's two later commits change only Linfoot files) with the range and the fixes, `npm run diagrams && npm run test:landing`, the fourth run:

```
ok      ASCII gate (1.0 s)
ok      npm run lint (16.7 s)
ok      npm run format:check (53.1 s): All matched files use Prettier code style!
ok      npm run check, without its type sync (92.9 s): COMPLETED 4253 FILES 0 ERRORS 0 WARNINGS 0 FILES_WITH_PROBLEMS
ok      npm run test:checks (226.7 s)
ok      npm test (462.1 s)
ok      npm run test:slow (499.3 s)
ok      npm run build (527.2 s)
test:landing: 527.2 s; every command passed
```

The earlier runs failed on rows that time out under load (load averages 10 to 17): in run 1, `app-theme-start.test.ts` (four rows over 5 s), `app-setting`, `hub-portfolio` and `hub-writes` (over 20 s), and the Electron hang of fix 12; in run 3, a row each of `changes.test.ts` (5.7 s) and `language-features.test.ts` (30 s). Each of those files passed alone in the gate (18 to 474 ms, 1.0 to 2.1 s, 29 ms, 245 ms), and the fourth run passed whole. The verify list on main, `checks.sh` from `tools/oculus` over the final tree: `test:quick: 121.4 s (limit 45.0 s); every command passed` and `checks: 1 commands passed`. Main's 128 staged oculus files equal the gate's byte for byte, the `AGENTS.md` link included. No A/B: the configuration names no bench.

## Agents

- Builder a2e8810ef4785fd47 (claude-opus-5-5): first run 317,021 tokens, 508 tool uses, 65.7 min; resumed with ruling Overview drawing 366,349 tokens, 42 tool uses, 5.0 min; round 1 252,462 tokens, 331 tool uses, 43.5 min; round 2 355,147 tokens, 810 tool uses, 124.0 min.
- Brief check aeebe0d3e26943120 (claude-opus-5-5): 235,565 tokens, 82 tool uses, 13.4 min. Brief check ac49a900edbdff4fe (claude-opus-5-5): stopped on Axel's word, nothing it found used.
- Reviewer a32b6d70ea5cdc87a (claude-opus-5-5): 365,215 tokens, 99 tool uses, 18.4 min.
- Reviewer over round 1 a9bd27380cac16947 (claude-opus-5-5): 286,977 tokens, 68 tool uses, 13.1 min.
- Reviewer over round 2 ad8fb318e8e3d6926 (claude-opus-5-5): 110,615 tokens, 86 tool uses, 15.1 min.

## Next

O39 part B by the orchestrator: the filtered clone at `~/workspace/oculus`, its checks, the private GitHub repository, the draft Release, the Lima run. Then part C, each hub change and the deletion of `tools/oculus` on Axel's yes path by path. The owed look on TEST once Chrome is connected.
