# U2 report

NOT done: three states were not reached (the populated `doc` view, the populated `customization` view, the error state of `findings`), the Live HPC empty state does not exist, no narrow shot of `agents` with subagents was taken, the cause of Monaco's late repaint on a theme switch is undetermined, and about 18 tabs that the audit opened remain in the right-hand pane of TEST. Everything else in the brief is done.

## Open items (the state file's, verbatim)

- Z138 (raised 2026-10-01 03:36, step X3d, its builder's open item A). Your ruling of 2026-09-25 says Seti's own table and colours, and X3d's round-0 ruling 4 draws them as `--seti-*` tokens set to `seti-ui`'s `ui-variables.less` values in every theme. Its premise that one set serves every theme is wrong: VS Code's Seti theme carries a `light` set (238 extension, 98 filename and 82 language entries; the default file icon `#d4d7d6` dark, `#bfc2c1` light), and on oculus's light panel Seti's own colours measure a contrast of 1.45 for white, 1.73 for yellow (every `.json`) and 2.13 for green (the builder's report, `agents/reviews/X3d-report.md`). (1) Keep Seti's colours in every theme. For: your ruling's words exactly. Against: icons on the light themes are hard to see, `.json` worst. (2) Copy VS Code's light values. For: what VS Code shows. Against: breaks the brief's rule that no VS Code hex is copied. (3) Keep Seti's values on the dark themes and set each `--seti-*` token on the light themes to a darker value derived from the same colour in `themes/derive.ts`, as other light tokens are derived. For: Seti's colours where they were made for, readable icons everywhere, no copied hex. Against: the light theme's icon colours are oculus's, not Seti's. Recommendation: (3). The lazy option is (1). What waits: only the light-theme colours of X3d's icons. X3d landed at 06:19 with Seti's colours in every theme, as (1) reads; a ruling of (3) or (2) is a change on top of it, folded into U2's fixes or the next step that touches `themes/`.

Read with `sed -n '102,112p' orchestrator-state.md` in the worktree; this is the only entry in the list.

## A question for Axel raised by the audit

The icon set, once, under Common differences item 19: oculus draws Lucide at 12 x 12 px, VS Code's codicons are 16 x 16 px (`U2-vscode.css:241`, `U2-vscode.css:252`). Option 1: keep Lucide (the `DESIGN.md` "Theming" decision) and raise the size to 16 px. Option 2: replace the set with codicons through `icons.yml`, which matches VS Code glyph for glyph, re-maps every id and has no codicon for several domain icons. Recommendation: option 1. The lazy option is leaving the icons at 12 px.

## The cases' first read

Read against the unchanged tree before the first look; the results that can be re-run are re-run here.

1. HELP.md's table: `grep '^| `' HELP.md | cut -d'|' -f2 | tr -d ' `' | awk 'NR<=47' | wc -l` prints 47; minus `files` and `repositories` gives the 45 of the brief, in HELP.md's order.
2. TEST reachable: the tab list shows one tab on `http://localhost:8790/`, id 812136282.
3. `tmux list-sessions` before the first look recorded `oculus-a5f844-shell` and `oculus-d0935c-shell`.
4. The first read found no case the brief's rules get wrong, so nothing was handed back; its per-case notes were not kept in a file, so only the results above can be re-run.
5. One premise of the brief is not borne out by the measure (the theme switch, below).

## DONE / NOT DONE

| Check | Result | Output |
| --- | --- | --- |
| 56 view sections plus 2 closing | DONE | `grep -c '^## ' U2-audit.md` prints `58` |
| Section ids and order | DONE | `grep '^## ' U2-audit.md \| head -56 \| cut -c4- \| diff - <the 56 ids>` prints nothing, exit 0; the last two are `## Common differences` and `## Proposed grouping` |
| Every VS Code value names a line | DONE | a script read every `css:N` and `css:N to css:M` in the audit: 531 cites, 0 name a blank or missing line of `U2-vscode.css`; every difference line that contains "against" carries a cite |
| ASCII only | DONE | `LC_ALL=C grep -c '[^ -~]'` prints `U2-audit.md:0` and `U2-vscode.css:0` |
| No shot of personal views | DONE | `ls U2-shots \| grep -cE '^(config\|inbox\|calendar\|memories\|transcript\|terminal\|session-detail\|linkedin\|person\|gallery)-'` prints `0` |
| tmux unchanged | DONE | `tmux list-sessions` prints `oculus-a5f844-shell: 1 windows (created Wed Sep 30 14:19:19 2026)` and `oculus-d0935c-shell: 1 windows (created Thu Oct  1 00:04:02 2026)`, the two recorded before the first look |
| History lists no write made during the audit | DONE | History read this turn in TEST: the filter was empty and the newest entry is `09-30 18:28 project field projects/ideas/attention-scoped-instructions/project.yml`, then `09-30 00:37 deck`, `09-29 19:16 session`; the first shot of the audit is dated `Oct 1 07:09` (`ls -lT U2-shots`), later than every listed entry |
| Config measured by computed styles only | DONE | `ls U2-shots \| grep -i config` prints nothing; the `local.yml` card was not opened; the current tabs were checked before each screenshot (not re-provable now); the check made this turn read `["Repositories","Staged Changes","Settings"]` |
| Theme switch made and undone | DONE | Settings Theme set to dark and back to light; final read: page rgb(241,245,249), Monaco rgb(255,255,255) |
| Header wrap measured per view | DONE | table in Common differences item 1, 27 views |
| Populated `doc` view | NOT DONE | the Views catalogue group headings are plain `h3`, not links, so no group opens a document |
| Populated `customization` view | NOT DONE | the Customizations rows in Sessions open source tabs, and the chips Claude, gmail and hub gave only the empty state |
| `findings` error state | NOT DONE | needs a broken hub file, which is a write |
| `hpc` empty state | does not exist | the poll always yields the table or the error; the error state is measured |
| `agents` populated at narrow | NOT DONE | the populated state was measured at wide only (`agents-wide.png`) |
| Cause of Monaco's late repaint | UNDETERMINED | stated as such in Common differences item 2 |

## Views that could not be put in a state

- `doc`: only the empty state; attempt as above.
- `customization`: only the empty state; attempt as above.
- `findings`: only the empty state; the state with findings needs a write.
- `hpc`: only the error state, since the cluster is unreachable.
- `deposit`: the populated state was reached through the project card More menu (`deposit-populated.png`); its error state was not reached, since commit and push write.
- `search`: the results state was reached (`search-results.png`); its error state was not reached.
- `source`: the error state was reached (`source-error.png`, "Cannot open: HTTP 404").
- `timeline`, `agents`, `changes`, `transcript`, `session-detail`: measured on session `S2 status`; `transcript` showed both a no-turns and a with-turns state.

## Files written

- `agents/reviews/U2-vscode.css`: 1105 lines.
- `agents/reviews/U2-audit.md`: 1139 lines.
- `agents/reviews/U2-report.md`: this file.
- `agents/reviews/U2-shots/`: 97 PNG files named `<view-id>-<state>.png`.

## Things to know about the files and the page

- The two Usage shots show Axel's two account email addresses; they are `usage-narrow.png` and `usage-wide.png`, and Axel may delete them before the landing commits the folder.
- The Applications and Joint-work shots are cropped to the header and chips because the cards show third-party email addresses.
- A toast ("S2 status finished its turn") sits at the bottom right of `tasks-wide.png`, and a shell toast overlays the bottom of `search-narrow.png`.
- `file-theme-switch.png` was taken in a source tab (`idea.md`); the `file` view itself is an image view with no Monaco.
- The Common differences item 2 states the measured fact: Monaco did not repaint on its own and repainted only at the next captured frame. The brief's premise (colours kept until the page is reloaded) was not shown.
- `merge` (registered) and `diff` are outside the brief's 56 views; `diff` is X3d's.
- TEST: the window was resized between 1000 and 1512 px and panes were maximised and restored during the looks; the Files tree filter and the History filter text `transcript` were cleared; the Terminal palette entry opened a composer tab only, and the one tmux session the audit started was ended; a click placed the cursor at Ln 34 in the `idea.md` Monaco (no edit); a `+ subtask` form on the BT-Op-Theory project card was opened and closed without saving. Two bookmarks existed before the audit; whether the audit created either is not verified.
- About 18 extra view tabs opened for the looks remain in the right-hand pane of TEST; closing them would have selected the Config tab.

## Anything in the brief that was wrong or impossible

- The brief's theme-switch premise (an open code editor keeps the old theme's colours until reload) is not what was measured; see Common differences item 2.
