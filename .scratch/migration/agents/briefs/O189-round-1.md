# O189, repair round 1

Read with the brief `.scratch/migration/agents/briefs/O189.md` and the rulings `.scratch/migration/agents/briefs/O189-cases.md`, whose rules hold unchanged except where this round says otherwise. The review is `.scratch/migration/agents/reviews/O189-refuter.md`. Each item below is a finding of that review, or of the orchestrator's read of the diff, with its ruling; build each one.

## Items

1. Review Behaviour 1, `grid.css`: an inverse cell with a colour of its own as its foreground and the default background. xterm measures the ink on that colour; where the ink clears the floor it writes no colour and gives the cell `xterm-fg-257`, so the panel's colour, which nothing measured, is drawn (black in Dark High Contrast 1.00:1, in Dark Modern 1.27:1). Ruling 773 asks for 4.5:1 in every theme. Ruling: a second rule of `grid.css` draws a cell that has `xterm-fg-257`, no `xterm-bg-257` and no `xterm-cursor-block` in the ink (`var(--ink)`), which is the colour xterm measured and passed; its dim form takes half the ink, as dim text in the default colours does. A cell in the two default colours keeps the rule it has. Accepted effects, stated in the rule's comment in one clause each: such text is the ink also where the panel's colour would have been readable, and a powerline, box or block glyph of such a cell, which xterm never measures, is drawn in the ink as well. No private member of xterm is used.
2. Review Behaviour 2, the cells the present rule recolours that the report does not name. Ruling: rulings 2 and 3 of `O189-cases.md` cover them, since CSS cannot tell them from the cells the floor recoloured: (a) a powerline, box or block glyph drawn inverse with the default foreground and a truecolor background takes the panel's colour; (b) dim inverse text with a truecolor background takes half the panel's colour. The rule's selector stays. Name both in the report with their before and after.
3. Review Standards 1, the comments of `CONTRAST_FLOOR` (`grid-look.ts`), the head of `tokens.css` and the head of `vscode-map.ts`. Read each against the code after item 1 and make each sentence true: the floor is kept for text, a powerline, box or block glyph is exempt in xterm, and dim text is held to half of it.
4. Review Standards 2, `grid.css`: "Dim text takes half of it, as xterm draws dim text." Ruling: the sentence says that dim text the rule recolours takes half, as xterm draws dim text in a palette or a default colour.
5. Review Proof 1, the report's row on inverse text with its own foreground and its case 18. Ruling: run `floor.mjs` at 1 and 4.5 with inverse black, inverse red, inverse truecolor foreground `#101010`, inverse 256-colour 236, and the dim forms of the first two, add their rows, and correct the report's row and its look table.
6. Review Behaviour 3, bold text. xterm's `drawBoldTextInBrightColors` is on by default, as VS Code's `terminal.integrated.drawBoldTextInBrightColors` is (`default:!0` in the installed workbench), so bold text in one of the eight names takes the bright twin's colour, which ruling 771 now makes a colour of its own. Ruling: no code change. The report names it with its before and after, and the look table gets a bold sample.
7. The orchestrator's read: `rice/tokyo.css`, the section comments "Tokyo Night Storm(folke" and "Tokyo Neon(folke" lost the space before the parenthesis. Put it back in both, so the two lines equal the base's.

## Cases of this round

Over the 49 theme rows and the sixteen colours, computed by a program in the worktree's scratch folder with xterm's own contrast arithmetic: for every inverse cell with that colour as its foreground and the default background, the colour drawn after the change (the inline one xterm writes, or the ink) against that colour is 4.5:1 or more. Give the count of pairs, the lowest ratio and its theme and colour, first with the panel's colour on the tree as this round finds it and then with the rule. A pair that no colour lifts to 4.5 is listed.

## Paths this round writes

- `src/lib/views/sessions/terminal/grid/grid.css`
- `src/lib/views/sessions/terminal/grid/grid-look.ts`
- `src/lib/themes/tokens.css`
- `src/lib/themes/vscode-map.ts`
- `src/lib/themes/rice/tokyo.css`
- `.scratch/migration/agents/reviews/O189-report.md`

## Verify before you report

From the worktree root, Node at `$HOME/.nvm/versions/node/v24.21.0/bin`, TMPDIR unset, once each at the end, a failing file rerun alone:

1. `npm run test:quick`, which prints `test:quick: <time>; every command passed`.
2. `node utils/migrations/convert-vscode-themes.ts --check`, which names the same seven blocks.
3. The ASCII gate over the paths above, which prints nothing.
4. `sh utils/unused-exports.sh` compared with `/Users/axelfaes/workspace/oculus/.agents/worktrees/O189-unused-base.txt`: no difference.

No test is added. No page is opened. No code is altered to watch a check fail. The plan's whole verify list runs once, at landing.

## Report

Update `.scratch/migration/agents/reviews/O189-report.md` in place, in ASCII, with a section "Repair round 1" that gives, item by item, what changed (file and lines), the runs of item 5 and of the cases above, and the checks with their output. It opens with anything NOT done.
