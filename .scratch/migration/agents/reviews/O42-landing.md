# O42 landing

Position: the cockpit-to-oculus migration, step O42 (the app menu with Open in Browser, the repository details header, each root's `.oculus/settings.yml` in the folder list, the rice theme's empty state, the citation key of "et al.") landed; next O38 (the cockpit retired and the hub's tools cleaned, each deletion on Axel's yes path by path), then O39.

Open items: none.

## Check of Steps 1
The builder aaa21bf27aeba936c and the reviewers a1771f58c31fcccbc and adad48ff0edac1de7 had all completed; none was running when the worktree's range was taken.

## NOT DONE
Nothing of O42's brief, round 1, rulings 149 and 150 or the landing.

## What landed
- O42's range from base 3587a477a (`.agents/worktrees/migration-O42`), cherry-picked onto main, with the fixes at landing below.
- The review over round 1, fixed at landing:
  - RB1: `focusedOf` in `src/desktop/windows/menu-template.ts`; a window of no entry or with its DevTools focused is `other`, so Close Tab and Save do nothing there; its row in `tests/server/desktop/menu-template.test.ts`.
  - RB2: the menu's colon path names a command with no reason of its own as "<description>: unavailable" (`palette_unavailable_named`).
  - RB3: the `settings_origin_none` words and their row.
  - RS2, RS3: the `showTerminal` and `menu-commands.ts` comments. RS4: DESIGN.md's two reasons. RS1, RS5: `agents/guarded.md` (the save rules' test under G59, G108's approved text and path). RS6 kept, with its reason under Closed.
- Ruling 149 (b): the Accent Colour... menu item and the `:accent` palette command removed with their words and test rows; a row for the notice of a command with no reason of its own; `docs/palette.md` regenerated.
- Red lines of the landing list fixed:
  - The shell folder order: `shell/window/menu-answer.ts` imported `shell/commands/colon-effects.ts` and `shell/keys/palette-modes.ts`; colon-effects moved to `shell/window/` with `MODE_COMMANDS` and `opensAsMode`.
  - The history check: `phosphor.css` comments named P1 and P3, read as step ids; reworded.
  - The layer boundaries: `appearance.svelte.ts` imported a data helper; the wallpaper value is read through the wallpapers store.
  - Comment width: four comment lines over 100 columns, rewrapped.
  - The Files toggle styled `TreeItem`'s own `.twisty` from `Tree.svelte`, which the layer boundaries refuse; it is the `--tree-leaf-twisty` token.
  - The size line: `TreeItem.svelte` reached 543 lines against a component's 540; brought back to 540 by shortening its own additions, its allowance unchanged.
  - `tests/state/sessions/source/source-unserved.client.test.ts` failed under the full suite in two runs and passed alone (2 of 2): the read was made but the store had not taken its answer in when the test checked; the test waits for the outcome it asserts (`vi.waitFor`, the expected value unchanged). The step of the store that runs after the request ends was not found.
- Axel's look, fixed at his word:
  - The wallpaper did not follow a pick in Settings: the layer drew one address, `url(/api/wallpaper)`, which the browser kept (`private, max-age=3600`). The layer's address names the image, `/api/wallpaper?v=<value>`, which the route serves as the image that value names; the value is the pick while its write is out (`wallpapers.svelte.ts`, set by `WallpaperPicker.svelte`), else the config's; `wallpaperValue` moved to `data/helpers/hub-names.ts`.
  - The Files tree stepped 12px a level where its explorer asks for VS Code's 8px, the row's 4px flex gap coming after each guide; a guide's right margin is its gap less 4px (`TreeItem.svelte`): the explorer steps 8px with each guide line on its folder's arrow, every other tree keeps 16px.
  - Ruling 150 (a): `files.file_icon_at_arrow`, default true, a toggle in Settings under Files; a file's row drops the empty arrow slot, its icon where its sibling folders' arrows sit (`behavior.yml`, the options catalog, `fileIconAtArrow` in `settings.ts`, the `arrowless` class of `Tree.svelte` setting `--tree-leaf-twisty: none`, which `TreeItem.svelte` reads for the arrow slot of a row that does not open, HELP.md, the behavior.yml description).
- Ledger: the booking under O42 in `plan.md`, its four agents in the Agents section, rulings 149 and 150, `agents/guarded.md`, the review's Closed section.

## Verification
- In the gate worktree `.agents/worktrees/gate` at main's head with the range and the fixes, `npm run diagrams && npm run test:landing` (`scratchpad/gate-runs/O42-gate-9.log`):
  - `ok ASCII gate`, `ok npm run format:check`, `ok npm run lint`, `ok npm run check ... 0 ERRORS 0 WARNINGS 0 FILES_WITH_PROBLEMS`, `ok npm run test:checks`, `ok npm test`, `ok npm run test:slow`, `ok npm run build`; `test:landing: 408.3 s; every command passed`.
- Main's staged diff equals the gate's: `cmp` of `git diff --cached` over `tools/oculus` outside the ledger, 9,572 lines, 102 paths (+4,168 -1,755).
- The landing list was never run in main's checkout (Z492).

## The look
On TEST (tab 812143689, Axel's 8790 server serving main's working tree):
- The header row "RESEARCH-HUB main". holds
- The eight app looks taken by Axel in the desktop app: the menu bar, the keys, the float's Save with Settings opening in main, Close Tab under DevTools doing nothing, Open in Browser and Open Recent, the accent notice, rice Empty, the Settings sentence. every one holds
- The wallpaper: two picks in Settings, the layer's address naming the pick 25 and 32 ms after the click, its bytes those of the picked tile's image, still that image 6 s later after the config was read again; a third pick, the green field, filled the background in the screenshot at once. Axel's choice set back to `research-hub/wallhaven-83do1o.jpg`, the tile selected before the first pick. holds
- The Files tree: levels 8px apart, guide lines at 10, 18 and 26 on the arrows of the folders above (measured on `cathedra/docs/user/diagrams`); with `files.file_icon_at_arrow` true the root's files (`.DS_Store` to `skills-lock.json`) have their icons where the sibling folders' arrows sit. holds
- No A/B: the configuration block names no bench.

## Agents
- Builder aaa21bf27aeba936c (claude-opus-5-5): 345,248 tokens, 469 tool uses, 86.5 min; round 1 353,781 tokens, 155 tool uses, 31.8 min. Its first report did not pass its bar (one repair round, 17 items).
- Brief check a66ad9473b70689d0 (claude-opus-5-5): 284,652 tokens, 95 tool uses, 16.0 min.
- Reviewer a1771f58c31fcccbc (claude-opus-5-5): 350,419 tokens, 85 tool uses, 16.7 min.
- Reviewer over round 1 adad48ff0edac1de7 (claude-opus-5-5): 249,683 tokens, 75 tool uses, 13.2 min.

## Next
O38: `/spec` O38, the cockpit retired and `tools/cockpit`, `tools/present`, `tools/data` and `tools/deposit` deleted with their users updated, each deletion and each edit of a skill's file on Axel's yes path by path (ruling 121); then O39.
