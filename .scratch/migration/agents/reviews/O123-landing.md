# O123 landing

Position: roadmap entry "migration (cockpit to oculus)"; step O123, sessions move into the Explorer, landed. Next: nothing queued; open item 637 waits on a ruling.

## Open items

- Open item 637 (2026-11-03), from O124's look. Over a wallpaper a group's sticky strip is painted at `wallpaper.panel_opacity` (0.8), so what scrolls under it shows at 20 %. (a) Recommended: inside a `Surface` or a tinted pane the strip paints solid `--panel`, for every view. (b) Keep it translucent as now; the lazy option. The full text is in `orchestrator-state.md`.

## The check of Steps 1

`ListAgents` shows O123's builder gone and its last reviewer completed.

## NOT DONE

Nothing in the brief is unbuilt. The cases under "Not seen" were not taken on a page.

## What landed

The Sessions tab of the Explorer: the session list above and the picked session's Details, Changes, Timeline and Agents under it, Customizations as a section, in rows of the Files look. The Sessions rail page and its chord are gone. The Explorer and each workbench have Files, Repositories, Sessions, Search and LaTeX on the left, documents top right, Terminal, Problems, References and Debug Console bottom right. A pinned Terminal tab stands and shows its composer when its last terminal goes. Repositories and Problems give the rail no count. 60 paths, +1646 -1294, from base 3e2595261.

`~/.oculus/layouts.json`: the Explorer page, the HCCNet workbench and the kept raw-pls workbench took the new shape and the Sessions page went. It held no Terminal tab, so no terminal moved. The session-detail and files tabs of that page are gone with it. A copy of the file before the edit is at `/private/tmp/claude-502/o118/layouts.before-O123.json`.

## Checks

In the gate `npm run diagrams && npm run docs:palette && npm run test:quick` printed `test:quick: 68.3 s; every command passed`, after the fixes at landing. `cmp` of main's and the gate's staged diffs reports no difference.

## The look

Scratch server on port 8797 from the gate, under mocha with the wallpaper, in a window 820 px wide.

- New page: the rail has no Sessions button; left tabs Files, Repositories, Sessions, Search, LaTeX; top right empty; bottom right Terminal, Problems, References, Debug Console.
- Sessions tab: five rows of 22 px, the sections under them. A press on a session with no terminal: the sections followed and a Terminal tab read it in the bottom pane. Three more presses kept the one tab. A reload kept the session shown.
- A double press opened the title field on the row's one line with the focus in it. Shift+Tab moved the focus to the row, and Escape then closed the field (R1-B1).
- New with nothing typed showed the composer. With "foo draft" typed, a press read a session in another tab, and New brought the tab with the prompt back with its words.
- The list's scroller has `tabindex="-1"`.
- The saved layout, edited as above, loaded in the scratch server on a copy: Explorer tabs as they should be, no Sessions rail button, no console error. Its documents gave 404 since the scratch hub does not hold them.

Not seen: a list of 200 sessions, a terminal row, resume, fork and a by-hand terminal, a press on a terminal another page owns, a section's close and reorder over a reload, a file opened from a session's Changes, a Timeline or Agents row, the row menu's Pinned and Rename, a notice's press, the workbench shape on a real folder, the pinned tab's last terminal ending, the badge with sessions waiting, the status bar items, a debug start, Find All References, a task start over a hidden draft (R1-B2, by reading), the wallpaper case with a real picture, and no session at all.

## Findings

R1-P1, R1-ST1, R1-ST2, R1-B1, R1-B2 of the run over round 1, closed at landing (`O123-refuter.md`, Closed). R1-ST2 records that the builder ran `pkill -f "tests/tiers/quick.mjs"`, whose pattern matches any worktree's run; whether it hit another run is not known.

## Usage and bars

The first report did not pass its bar: one repair round. Fixes at landing in code: three (`SessionWorkspace.svelte`, `opening.svelte.ts`, `terminal-lists.ts`). Builder acbcf929837bf5594: first run 365848 tokens, 59 tool uses, 10 min 43 s; build 100660, 385, 59 min 48 s; round 1 235365, 79, 11 min 4 s. Brief check afb7b4f6cc7cbec97: 332174, 59, 12 min 34 s. Reviewer a782a024916820caa: 88630, 56, 17 min 56 s. Reviewer over round 1 ac007d7895e827e38: 292420, 42, 10 min 32 s. No A/B: no bench for this step.

## Next

Nothing queued. Open item 637.
