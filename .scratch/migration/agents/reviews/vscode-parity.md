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

## Sources

- https://code.visualstudio.com/docs/getstarted/userinterface
- https://code.visualstudio.com/docs/sourcecontrol/overview
- https://code.visualstudio.com/docs/debugtest/debugging
- https://code.visualstudio.com/docs/agents/run/agents-window
- https://code.visualstudio.com/docs/agents/overview
- https://github.com/James-Yu/LaTeX-Workshop/wiki
- vscode.dev, measured in Chrome on 2026-09-23
