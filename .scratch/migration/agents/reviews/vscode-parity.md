# VS Code parity inventory (P1)

Every feature of the VS Code surfaces oculus copies, set against what oculus has, and the step that owns each gap. Taken on 2026-09-23 from vscode.dev in Chrome (measurements below), the VS Code docs (sources at the end) and Axel's screenshot of the Agents window (`~/Desktop/Screenshot 2026-09-23 at 23.18.20.png`). Oculus's side is read from each view's catalog words under `config/text/`, which name every control a view draws, and from the code where named; "not checked" means neither was read for it.

Status words: **has**, **part** (some of it, the rest named), **none**, **not checked**. A step's brief carries its rows whole; a row left out by a brief says why.

## Measured on vscode.dev

- Activity bar 44 px wide; each item 36 by 36 px, the icon 36 px box; the active item drawn as a soft tile behind the icon in this build (the desktop default draws a 2 px bar on the left edge, which Axel ruled for L5).
- A badge is a 16 by 16 px pill, 9 px text, placed 17 px from the item's left and 18 px from its top: inside the item, over the icon's lower right corner.
- Status bar 28 px high, 12 px text. Items seen with a GitHub repository open: remote (GitHub), Restricted Mode, problems (0 errors, 0 warnings), notifications bell, keyboard layout, Copilot status.

## Activity bar (oculus: the rail; owner L5)

| VS Code | oculus | step |
|---|---|---|
| Icon-only items, about 36 px in a 44 to 48 px bar | none: 98 px, icon over name | L5 |
| Name on hover, with the shortcut | part: tooltip "Focus, key 1" on a stacked button | L5 |
| Active marker (left bar or tile) | part: accent fill | L5 |
| One badge per item, inside, lower right | none: a row of badges under the button | L5 |
| Drag to reorder items | none: order only from Settings | L5 |
| Right-click to hide or show an item | none | L5 |
| Move the bar left or right | none | L5 (left out: oculus has one side) |
| Accounts and Manage at the foot, with badges | part: Search and Update at the foot | L5 (Bookmarks menu added there) |

## Status bar (owner L6)

| VS Code | oculus | step |
|---|---|---|
| 22 to 28 px bar, 12 px text | none: larger text | L6 |
| Left group and right group | none: one run of items | L6 |
| Remote or host indicator | none | L6 (the machine or cluster) |
| Git branch, with a switch on click | none | L6 |
| Sync status (ahead, behind), sync on click | none | L6 |
| Problems count, opens Problems | none (Findings is the nearest) | L6 (Findings count) |
| Notifications bell, the notification centre | none | L6 |
| Line and column, go to line on click | none | L6 (source tab) |
| Indentation, change on click | none | L6 (source tab) |
| Encoding | none | L6 (source tab) |
| Line endings, LF or CRLF, change on click | none | L6 (source tab) |
| Language mode, change on click | none | L6 (source tab) |
| Right-click to hide items | none | L6 |
| Debug colour while debugging | none | D11 |
| Items an extension adds (Copilot, LaTeX) | part: server, usage, HPC, live sessions, unsaved tabs | L6 keeps these |

## Explorer (oculus: Files; owner X3)

| VS Code | oculus | step |
|---|---|---|
| New file, new folder buttons | none | X3 |
| Rename, delete (to trash) | none (only a note is deleted) | X3 |
| Move by drag and drop | none | X3 |
| Drop files from outside to copy | none | X3 |
| Copy, cut, paste, duplicate | none | X3 |
| Collapse all, refresh | has | none |
| Filter or find in the tree | has: filter over folders read | X3 (fuzzy toggle) |
| File-type icons in colour | none: one file glyph, html, image | X3 |
| Git decorations (modified, untracked colours) | not checked | X3 |
| Problem decorations | none | X3 |
| Compact folders | not checked | X3 |
| File nesting | none | X3 |
| Multi-select | not checked | X3 |
| Compare selected | none | X3 |
| Reveal in Finder | has (D16) | none |
| Open Editors section | none (the tab strip) | X3 |
| Outline section | none | X3 |
| Timeline section (commits and local saves per file) | none | X3 |
| Hidden and ignored files toggles | has (Q65) | none |
| Bookmarks and notes | has (oculus's own) | none |

## Source Control (oculus: Repositories and Changes; owner X3)

| VS Code | oculus | step |
|---|---|---|
| Repositories list | has: picker | X3 (a list) |
| Changes and Staged sections | has | none |
| Stage and unstage per file | has | none |
| Stage per line or hunk | none | X3 |
| Discard | has | none |
| Diff editor, side by side and inline | part: a diff view | X3 (both modes, actions) |
| Gutter marks in the editor | none | X3 |
| Commit box, commit button | has | none |
| Commit with amend, commit and push | part: commit, push | X3 |
| Generated commit message | has (suggest) | none |
| Branches: list, switch, create | has | none |
| Merge | has | none |
| Merge conflicts, 3-way editor | none | X3 |
| Pull, fetch, sync | part: push | X3 |
| Stash | none | X3 |
| Tags | none | X3 |
| Graph of commits, incoming and outgoing | part: a log | X3 |
| Blame | none | X3 |
| Worktrees: list, create, remove | has | A2 (a session in one) |
| Terminal in the repository | has | none |

## Editor tabs (owner X3, the shell)

| VS Code | oculus | step |
|---|---|---|
| Preview tabs (italic, reused) | has (preview_tab) | none |
| Pinned tabs | not checked | X3 |
| Dirty dot, close on hover | has | none |
| Tab context menu (close others, to the right, all) | not checked | X3 |
| Split right, split down | has | none |
| Editor actions at the strip's end | part: pane menu, split | X3 |
| Breadcrumbs | none | X3 |
| Wrapped tabs | none | X3 |

## Agents window (oculus: Sessions, Session, Terminal, Transcript, Timeline, Changes, Agents; owner S2, with A1 to A3)

| VS Code | oculus | step |
|---|---|---|
| Sessions list grouped by workspace | has | S2 (restyle) |
| New session with its shortcut | part: new terminal | S2 |
| Filter and search the list | none | S2 |
| Status and change counts per row | part: live, busy, idle | S2 |
| Pin, rename, archive, delete, fork, export | part: pin, rename, dismiss | S2 |
| Open sessions side by side | has: panes | none |
| Composer: workspace picker | part: the terminal's folder | S2 |
| Composer: agent picker (Copilot, Claude, Codex) | has: Claude, Codex, shell | S2 |
| Composer: model, mode, effort pickers | none (shown, not set) | S2 |
| Composer: attach files and images | none | S2 |
| Permissions mode (interactive, manual, auto) | none | S2 |
| New worktree toggle and branch | none | A2 |
| Stop or steer a running turn | part: stop the terminal | S2 |
| Notification when a session needs input | part: waiting count in the title | S2 and L6 |
| Changes panel beside the session | part: the Changes view | S2 |
| Files panel beside the session | none | S2 |
| Review with comments on lines | none | A1 |
| Automations on a schedule | none | A3 |
| Quick chats | none | S2 (left out unless ruled: the terminal is the chat) |
| Customizations: instructions, agents, skills, hooks, MCP servers, tools, plugins, with counts | none | S2 |
| Handoff local to background to cloud | none | left out: oculus runs local CLIs |
| Agent Host, remote access | none | left out: loopback only by design |

## Run and Debug (oculus: D11, the debug client for rite)

| VS Code | oculus | step |
|---|---|---|
| Variables, Watch, Call Stack, Breakpoints, Loaded scripts | none | D11 |
| Breakpoints: conditional, hit count, logpoint, function, data, inline, triggered | none | D11 |
| Toolbar: continue, pause, step over, into, out, restart, stop, session picker | none | D11 |
| Debug console, evaluate in frame | none | D11 |
| Launch configurations and picker | none | D11 |
| Inline values, hover to evaluate, set value | none | D11 |
| Status bar colour and configuration picker | none | D11 and L6 |

## LaTeX (the LaTeX Workshop extension; oculus: D5's panel, D14, D15)

| VS Code | oculus | step |
|---|---|---|
| Build, clean | has (D5) | none |
| Build on save | none | D14 |
| Recipes, magic comments, root detection | part: a main file | D14 |
| PDF tab, reloaded after a build | has | none |
| Forward and inverse search (SyncTeX) | none | D15 |
| Zoom and scroll kept | none | D15 |
| Errors and warnings with file and line | has | D14 (a Problems list) |
| Outline of sections | none | D14 |
| Citation and reference completion | none | D13 and D23 |
| Hover preview of math and images | none | D14 |
| Word count | none | D14 |
| Formatting, linting (ChkTeX) | none | D14 |

## Terminal panel (oculus: the Terminal view; owner Q89)

Taken 2026-09-28 from the two VS Code pages "Terminal Basics" and "Terminal Appearance" (sources below). Oculus shows one terminal per Terminal tab, and its tabs sit in the page's panes, so VS Code's terminal groups and its editor-area terminals are panes of a page here.

| VS Code | oculus | step |
|---|---|---|
| Tabs list beside the terminal, on the right, shown from two terminals on (`tabs.hideCondition` singleTerminal, `tabs.location` right) | none: a "Pick a terminal" menu on the bar | Q89 |
| With one terminal, its name and actions in the view's header (`tabs.showActiveTerminal` singleTerminal) | none | Q89 |
| A row: icon, title, description, the one shown marked | part: the menu lists names | Q89 |
| Title named after what runs (`${process}`) | none: the session title or the tmux name | Q89 |
| Description after the title (`${task}`, `${cwdFolder}`) | none | Q89 |
| Status icon on the row: bell (`enableBell`, `bellDuration`) | none | Q89 |
| Status icon on the row: a task's check or cross | none | left out: oculus runs no VS Code tasks; an update task is a terminal like any other |
| Hover detail on a row (process, folder, id) | none | Q89 |
| Row actions on hover: split, kill | part: stop in the Sessions list | Q89 |
| New terminal (+) and the profile dropdown | has: New terminal and the composer's agent choice (Claude, Codex, shell) | none |
| Split the terminal beside | part: panes, opened by hand | Q89 |
| Kill the terminal from the view | part: stop in the Sessions list | Q89 |
| Previous and next terminal by keyboard (Cmd+[ and Cmd+]) | none | Q89: arrow keys in the tabs list |
| Right-click menu: split, rename, change icon, change colour, move, kill | none | Q88 (the terminal is in its list) |
| Drag a row to reorder, or to another group | none | Q89: reorder within the list, the order kept in the reader's layout state; another group is another pane, reached by dragging the tab |
| Terminal in the editor area, in a new window | has: a Terminal tab opens in any pane of any page | none |
| Maximize the panel | has: the pane menu | none |
| Find in the terminal (Cmd+F) | none | Q83 (the xterm search addon) |
| Links: URLs, file paths, open detected link | none | Q83 (the web-links addon) for URLs; file paths left out until Q83 lands |
| Copy, paste, select all, Alt-click selection | has: xterm's own | none |
| Multi-line paste warning | none | Q89 |
| Scroll by line, page, top, bottom; previous and next command | part: xterm's own scrolling | left out: command navigation needs shell integration, which oculus does not install |
| Shell integration decorations | none | left out: needs a script injected into the reader's shell |
| Run selected text, run active file | none | left out until the editor is Monaco (D13) |
| Fixed dimensions, size to content width | none | left out: tmux owns the size |
| Drag a file into the terminal to type its path | none | Q89: a row dragged from the Files view, as the composer already takes one |
| Scrollback length setting | part: tmux's history | none |
| Inline chat and `@terminal` | none | left out: the terminal is the agent |
| Message box under the terminal | part: shown under every terminal | Q89: only under a Claude or Codex terminal |

## Sources

- https://code.visualstudio.com/docs/getstarted/userinterface
- https://code.visualstudio.com/docs/sourcecontrol/overview
- https://code.visualstudio.com/docs/debugtest/debugging
- https://code.visualstudio.com/docs/agents/run/agents-window
- https://code.visualstudio.com/docs/agents/overview
- https://github.com/James-Yu/LaTeX-Workshop/wiki
- vscode.dev, measured in Chrome on 2026-09-23
- https://code.visualstudio.com/docs/terminal/basics
- https://code.visualstudio.com/docs/terminal/appearance
