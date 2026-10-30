# The palette

Cmd+K opens the palette outside the editor; in the editor Cmd+K starts the editor's chords, and Cmd+Shift+P, F1 and Cmd+P open the palette. With nothing typed it lists the views, and a typed word matches fuzzily, its letters in order, across views, projects, collection entries and feed entries. A collection entry or a lead or Lit Watch paper opens its page, and a person opens the person's page.

## Contents

[TOC]

---

## Views

Every registered view is listed by its words.

| View | Id |
| --- | --- |
| Career | career |
| LaTeX | latex |
| Math Preview | math-preview |
| Present | present |
| Slides | slides |
| Apps | apps |
| Deposit | deposit |
| Editor | editor |
| Entry | entry |
| Focus | focus |
| Person | person |
| Project | project |
| Awaiting | awaiting_board |
| Inbox | inbox |
| Position Leads | leads |
| LinkedIn | linkedin |
| Literature search | literature-search |
| Lit Watch | radar |
| Account setup | account-setup |
| Calendar | calendar |
| Memories | memories |
| Customization | customization |
| Session | session-detail |
| Sessions | session-list |
| Terminal | terminal |
| Timeline | timeline |
| Transcript | transcript |
| Data | data |
| Recover | recover |
| Document | doc |
| Markdown preview | markdown-preview |
| Document | document |
| File | file |
| Files | files |
| Notes Graph | notes-graph |
| Diff | repositories-diff |
| Merge Editor | repositories-merge |
| Repositories | repositories |
| Problems | problems |
| Refactor Preview | refactor-preview |
| References | references |
| Search | search |
| Source | source |
| Journal Browser | venues-browser |
| Venues | venues |
| Domains | domains |
| Map | map |
| Pillars | pillars |
| Audit | audit |
| Findings | findings |
| Gallery | gallery |
| Help | help |
| Keyboard Shortcuts | keys |
| History | history |
| Debug Console | debug-console |
| Debug | debug |
| Live HPC | hpc |
| Language Server Output | lsp-output |
| Processes | processes |
| Usage | usage |
| Status | status |
| Views | catalogue |
| Pages | pages |
| Settings | settings |
| Workbenches | workbenches |
| Statements | statements |
| People | people |
| Organisations | organisations |
| Resources | resources |
| Funding | funding |
| Talks & Events | events |
| Education & Service | education |
| Applications | applications |
| Tasks | tasks |
| Literature | literature |
| Projects | projects |
| Supervision | supervision |
| Coauthor | coauthor |
| Archive | archive |
| Personal | personal |
| Software | software |

## Colon commands

A colon starts a command. The commands that list choices type their name and a space when chosen, and a command marked unavailable in the list is drawn and does not run. A command whose argument is empty or names no view, project, theme or file icon theme says so in the palette, which stays open.

| Command | Argument | What it does |
| --- | --- | --- |
| `:theme` | `<theme>` | Switch the theme |
| `:crt` | - | Turn the CRT overlay on or off |
| `:file-icons` | `<file icon theme>` | Switch the file icon theme |
| `:tab` | `<view id>` | Open a view in a tab |
| `:reopen-closed-tab` | - | Reopen the tabs closed last |
| `:go-back` | - | Go Back |
| `:go-forward` | - | Go Forward |
| `:toggle-left-dock` | - | Toggle Left Dock |
| `:toggle-bottom-dock` | - | Toggle Bottom Dock |
| `:toggle-right-dock` | - | Toggle Right Dock |
| `:goto` | `<project id>` | Open a project in a tab |
| `:language` | `<language>` | Set the language of the source tab |
| `:interpreter` | `<path>` | Choose the Python interpreter of the repository |
| `:compile-database` | `<name>` | Choose the compile database of the repository |
| `:svelte-config` | - | Approve or stop running the Svelte configuration of the repository |
| `:eslint-config` | - | Approve or stop running the ESLint configuration of the repository |
| `:clone` | `<name / url>` | Clone a GitHub repository |
| `:task-add` | `<title>` | Add a task to the tasks collection |
| `:help` | - | Show the help |
| `:keys` | - | Show the keyboard shortcuts |
| `:update` | - | Open the update tasks |
| `:workspace` | `<hub/name>` | Switch Workspace |
| `:workspace-save` | `<name>` | Save Workspace As |
| `:workspace-new` | `<name>` | New Workspace |
| `:workspace-close` | - | Close Workspace |
| `:folder` | - | Open a folder in the Files view |
| `:folder-add` | - | Add Folder to Workspace |
| `:folder-remove` | `<folder>` | Remove Folder from Workspace |

## Prefixes

| Type | What it does |
| --- | --- |
| `:` | starts a command from the table of colon commands |
| `:<number>` | goes to that line of the source tab on screen |
| `#` | searches the symbols of the workspace through the language server of the source tab on screen |
| `Cmd+P` | lists files by name across the served roots, matching the name first and the whole path after |

## Editor commands

While a source tab is on screen the palette also lists the actions of the editor's Cmd+K chords, and on macOS Delete All Right, each under the editor's own label with the keys that run it in the editor beside it. Pin Editor and Unpin Editor are listed with the chord that runs them in the editor, as in VS Code. The table names each action by the editor's action id.

| Editor action | Chord |
| --- | --- |
| editor.action.addCommentLine | Cmd+K Cmd+C |
| editor.action.removeCommentLine | Cmd+K Cmd+U |
| editor.action.formatSelection | Cmd+K Cmd+F |
| editor.action.trimTrailingWhitespace | Cmd+K Cmd+X |
| editor.action.moveSelectionToNextFindMatch | Cmd+K Cmd+D |
| editor.action.setSelectionAnchor | Cmd+K Cmd+B |
| editor.action.selectFromAnchorToCursor | Cmd+K Cmd+K |
| editor.action.showHover | Cmd+K Cmd+I |
| editor.action.revealDefinitionAside | Cmd+K F12 |
| editor.toggleFold | Cmd+K Cmd+L |
| editor.toggleFoldRecursively | Cmd+K Shift+Cmd+L |
| editor.foldRecursively | Cmd+K Cmd+[ |
| editor.unfoldRecursively | Cmd+K Cmd+] |
| editor.foldAll | Cmd+K Cmd+0 |
| editor.unfoldAll | Cmd+K Cmd+J |
| editor.foldAllBlockComments | Cmd+K Cmd+/ |
| editor.foldAllMarkerRegions | Cmd+K Cmd+8 |
| editor.unfoldAllMarkerRegions | Cmd+K Cmd+9 |
| editor.foldAllExcept | Cmd+K Cmd+- |
| editor.unfoldAllExcept | Cmd+K Cmd+= |
| editor.createFoldingRangeFromSelection | Cmd+K Cmd+, |
| editor.removeManualFoldingRanges | Cmd+K Cmd+. |
| editor.foldLevel1 | Cmd+K Cmd+1 |
| editor.foldLevel2 | Cmd+K Cmd+2 |
| editor.foldLevel3 | Cmd+K Cmd+3 |
| editor.foldLevel4 | Cmd+K Cmd+4 |
| editor.foldLevel5 | Cmd+K Cmd+5 |
| editor.foldLevel6 | Cmd+K Cmd+6 |
| editor.foldLevel7 | Cmd+K Cmd+7 |
| deleteAllRight | Ctrl+K |
| Pin Editor | Cmd+K Shift+Enter |
| Unpin Editor | Cmd+K Shift+Enter |

## Present commands

While a Present tab is on screen the palette lists these commands for the slide on screen.

| Command |
| --- |
| Edit Slide |
| New Slide |
| Duplicate Slide |
| Delete Slide |
| Export to PDF |

## Keys

| Key | What it does |
| --- | --- |
| `Cmd+K` | opens the palette, or closes it when it is open; in the editor it starts the editor's chords instead |
| `Cmd+Shift+P`, `F1` | opens the palette in its command mode, as a colon does; either key closes it again |
| `Cmd+P` | lists files by name across the served roots |
| `Cmd+T` | lists the symbols of the workspace through the language server of the source tab on screen |
| `ArrowUp`, `ArrowDown`, `Home`, `End`, `Enter` | move through the results and open the selected one |
| `Shift+Enter` | on :task-add, adds the task and opens its page in its editor |
| `Escape` | closes the palette |
