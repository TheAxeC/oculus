# Q79c landing

Roadmap entry oculus migration. Plan step Q79c: the page half of the library audit's section D. Next: Q79a, the server half, then Q99's repair round.

## Open items

- None.

## Steps 1 check

ListAgents before the cherry-pick showed the Q79c round reviewer completed, and the Q99 reviewer and the Q79a round reviewer running; the Q79c builder and its first reviewer were no longer listed.

## Not done

- Not seen at the look: the Memories add press (it opens the system file dialog, which the browser tool cannot dismiss), the stop control keeping focus between its two presses (the second press stops a terminal), and the selection colour inside the grid. The Live HPC jobs table and log were not seen, since the cluster was unreachable.

## What landed

- `svelte/no-restricted-html-elements` over every view folder in place of `tests/checks/source/controls.test.ts`; the raw controls under `src/lib/views` drawn with ui/ primitives (a new `ui/forms/FileChooser.svelte`, ToolButton's `plain` variant, RowButton in more rows).
- The manual cut at its diagrams on the server (`renderManualParts` with marked's `walkTokens`), the Help view drawing the parts.
- `hljs.getLanguage` before the extension map: 21 more extensions painted in a source tab (`.html`, `.svg`, `.diff`, `.patch`, `.jsonc`, `.mk` and the aliases of registered grammars).
- The Config view's YAML in the shared code window (`views/shared/code/Code.svelte`).
- The terminal's font and selection from `--font-mono` and `--accent-bg`, through `gridOptions` and `applyLook` of `views/sessions/terminal/grid-look.ts`.
- The HPC views' markup one element per line, and the plural a catalog key per count.
- A terminal row's stop control one button whose words follow the arming.

## Fixes at landing (5)

- The merge with Q92: `views/system/help/manual.ts` takes Q79c's side, and the diagrams are regenerated.
- The diagram's alternative text decoded on the server (`decodeHTML` in `diagramOf`, `server/content/docs.ts`): moving the cut to the server had dropped Q92's decoding. Q92's case now runs through `renderManualParts`, and fails with the decode removed (1 failed, 19 passed).
- The Career panel's host moves drawn as default ToolButtons and ToolButton's `capsule` variant removed: DESIGN.md:273 keeps the capsule for the status words and the project type, and `tests/views/whole/chips.test.ts` refuses a Chip toned otherwise.
- `state/sources/fs.ts` split by concern (it sat at the 900-line limit): what a file name says is `state/sources/file-type.ts`, exported from `fs.ts`; `fs.ts` is 797 lines.
- The extension rule written once, `extensionOf` of `data/helpers/opens-in-program.ts`, and its `allow-duplication.txt` entry removed; DESIGN.md:282 names `file-type.ts`.

## Verified on main

`sh ~/.claude/skills/land/templates/verify.sh orchestrator-state.md`: "Test Files 345 passed (345)", "Tests 5493 passed (5493)", "COMPLETED 1479 FILES 0 ERRORS 0 WARNINGS 0 FILES_WITH_PROBLEMS", build, "All matched files use Prettier code style!", "verify: 6 commands passed".

## The look (TEST, vscode dark modern)

- Help: nine diagrams drawn inline, each labelled, no image of `docs/diagrams`.
- Focus, career panel: each host's moves as buttons (awaiting, candidate, drafted, dropped).
- Config: `appearance.yml` in the code window with line numbers and YAML colours.
- Terminal: the grid's font `ui-monospace, SFMono-Regular, Menlo, monospace`, equal to `--font-mono`.
- Live HPC: its unreachable state.

## Next

Q79a lands next (its round's findings are small and inside the brief). Q99 gets one repair round from its review. Then Q100 and Q101.
