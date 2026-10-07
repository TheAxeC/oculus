# Debugging guide

Debugging a `.rite` program from oculus: breakpoints in the editor, a launch from the open file or from a configuration of the repository, stepping, the call stack, variables, watch expressions, a hover that evaluates, and a console. The debugger is a client of cathedra's `rite_dap` adapter, which oculus starts; nothing else is debugged.

## Starting

Press F5, or Start in the Debug view, or pick a configuration in the list of the status bar's debug item. The debugger runs the configuration the Debug view's picker shows, which is the first of the repository's `.oculus/launch.yml` until you pick another, and a repository with no `launch.yml` runs the `.rite` file on screen as Debug the open file. The repository is the deepest git repository holding the file of the source tab on screen, or of the one you focused last, or else the served root holding it. A file under no served root is refused with a notice naming it. F5 with no `.rite` file to run says "Open a .rite file to debug". A repository whose `launch.yml` lists no configuration that reads launches nothing and says so; the file's findings are listed in the Debug view.

Only one session runs at a time. A start while a session is starting, running or paused is refused with "A debug session is running: stop it first", from every surface: the key, the picker, the toolbar and the status bar. Start stays drawn in the Debug view while a session runs and gives that answer.

The unsaved `.rite` tabs are saved first, as Cmd+S saves them, because the adapter reads the file on disk and its own imports. A tab that cannot be saved stops the launch and says why.

Every launch asks before it runs. The question lists what runs, `rite_dap <program>` and the folder when it is not the repository's, and a yes is kept, so the same text is not asked again. The text is the repository, the configuration's `cwd` and its `program` as written, so the name of a configuration is not part of it, a renamed entry asks nothing again, and a changed `program` or `cwd` asks again. The default configuration is asked too, once for each repository, and its text is the same as a configured entry of `program: ${file}` in `cwd: .`, so one yes covers both. The adapter itself is `rite_dap_bin` of `config/local.yml` and is not part of the text. The approvals are kept in the file the `approvals` key of `local.yml` names, together with the project commands'.

The Debug Console opens when a session starts. The Debug view opens when the program pauses.

## The launch file

`.oculus/launch.yml` of a repository is a map whose `configurations:` is a list of entries, each with `name`, `program`, and optionally `cwd` and `before`.

```yaml
configurations:
    - name: Debug the open file
      program: ${file}
    - name: Benchmark
      program: utils/benchmark/fib.rite
      cwd: utils
      before: build
```

`name` follows the rule of a project command's name. `program` is required and is the `.rite` file to run: a path relative to the repository that exists and ends `.rite`, or a text holding `${file}`, `${fileDirname}`, `${fileBasename}`, `${fileBasenameNoExtension}` or `${workspaceFolder}`, which is filled with the file on screen when a launch starts and must then name an existing `.rite` file under a served root. `cwd` is a folder of the repository, the repository when absent, and takes no placeholder. `before` names a project command. An entry with a fault is left out and each fault is a finding in the Debug view, naming the file and the field; a key other than these four is one, so a `programm:` is caught instead of running the open file, and so are the keys of VS Code's `launch.json`. A repeated name keeps the first entry.

Add Configuration in the Debug view opens `.oculus/launch.yml` at its first entry, and makes the file with one configuration, Debug the open file, when the repository has none. Open launch.yml opens it at the chosen entry.

## A command before the launch

A configuration with `before` runs that project command first, found as a `depends_on` name is: the repository's file, then the saved, then the found. It runs as any command of the repository does, in its own terminal and after its own approval, and the launch goes on when the command's line ends with exit code 0. A name that is no command of the repository refuses the launch. A command that ends with another code asks "The command <name> ended with exit code <n>." with Debug Anyway, Show Errors, which shows that terminal, and Abort. A command still running ten seconds after its terminal started posts the notice "Waiting for the command <name>..." with Debug Anyway, which launches now and leaves the command running, and Abort, which drops the launch and asks, behind a confirmation, to stop the command's terminal. The command's end removes the notice. A launch that waits drops when the command is refused, not approved or its terminal is closed before its line ended, and each says which. Another start while a launch waits is refused; Stop drops the waiting launch and leaves the command's terminal. Restart runs the `before` command again.

## Breakpoints

A breakpoint is set in a `.rite` source tab of a file on disk with F9 at the caret's line, or a left press without Control in the editor's glyph margin, where a faint dot shows under the pointer. Only `.rite` files take breakpoints, and a version, diff or library tab takes none. A breakpoint is drawn in the glyph margin as a filled red dot; a hollow red ring is one the adapter does not hold yet, which it says until the module loads, with the adapter's message as the tooltip; a grey ring is one turned off in the Breakpoints section. Breakpoints move with their line when lines are added or removed above them. A middle or right press in the margin does nothing. The overview ruler draws none.

The Breakpoints section lists every one by file and line with an enable box and a remove, and the function breakpoints by name, with Add Function Breakpoint, Enable All, Disable All and Remove All. A press on a row opens the file at its line. The breakpoints, function breakpoints, watch expressions and the chosen configuration of each repository are kept in this browser under `oculus.debug.v1`, and two tabs of the page follow each other's changes, so a session is never sent two lists. During a session each change is sent at once; a launch carries the lists as they stand.

## Stepping

F5 continues a paused program, F10 steps over, F11 steps into and Shift+F11 steps out. Finish Frame, a request of rite's adapter, runs to the end of the frame and has no key. The floating toolbar offers Continue, Step Over, Step Into, Step Out, Finish Frame, Restart and Stop, each drawn off where the state does not allow it; it floats over the top of the workbench while a session is starting, running or paused, is dragged along the top edge by its grip, and is hidden when the session ends. Where it was left is kept in `oculus.debug.v1`.

When the program pauses, the file of its top frame opens at the line, with the line tinted and a yellow arrow in the margin, the editor takes the focus, the Debug view shows, and the page asks the browser to focus its window; whether the browser raises the window is its decision. A frame in a file under no served root is listed and not opened, with a notice naming the path.

The Debug view's state line says Starting, Running, Paused on breakpoint, Paused after a step or Ended with the reason. Variables lists the scopes of the selected frame, Locals then Module, as `name = value`, flat and with no type. Watch evaluates each expression as typed at every pause and shows not available while the program runs. Call Stack lists the frames; a press selects one, which shows its variables and opens its file. A hover over a word of the program in a `.rite` tab shows the value of that word in the selected frame while paused, and nothing for a word that no scope of the frame holds.

## Stop and restart

The adapter cannot be stopped by the protocol, since a disconnect lets the program run to its end. Stop sends SIGTERM to the process oculus started, and SIGKILL two seconds later if it has not ended, after a confirmation naming the process, `rite_dap <program> (pid <pid>)`, every time. Shift+F5 and the toolbar's Stop ask. Restart is Stop with its confirmation, then the same configuration again from the start, its `before` command included; Cmd+Shift+F5 (Ctrl+Shift+F5 off macOS) does it. A session that ends by itself says why in the state line and in the console, and the Debug Console stays open.

## The console

The Debug Console shows what the program wrote, what the adapter said, each expression you evaluated and its result, in the terminal's font and wrapped, with `stderr` and errors in the error tone. It keeps the last 10,000 lines, says how many earlier lines it let go, and is emptied at each new session. A run of identical consecutive lines of one kind is drawn as one line with its count, and the console keeps and counts each line. The input evaluates in the selected frame while the program is paused and is read-only otherwise. Enter sends what is typed. The earlier inputs that start with the typed text are listed under the box, Tab or a press takes one into it without sending it, and Up and Down step through what was sent.

## Keys

| Key | Does |
|---|---|
| F5 | Start, or Continue while paused. |
| Shift+F5 | Stop, after its confirmation. |
| Cmd+Shift+F5 | Restart (Ctrl+Shift+F5 off macOS). |
| F9 | Toggle a breakpoint on the caret line of the `.rite` tab on screen. |
| F10 / F11 / Shift+F11 | Step over, into, out. |

The keys answer while the editor or a field has the keyboard and with no dialog open. While a session is starting, running or paused, or a `.rite` tab has the focus, they are kept from the browser, so F5 never reloads the page; under a dialog they then do nothing, and with neither the browser's own key runs. While a session runs the same keys, except Cmd+Shift+F5, go to the debugger also when a Terminal tab has the keyboard, and the terminal's program gets none of them; with no session the terminal gets every key. No key pauses a running program.

## What the debugger does not offer

Pause: the adapter refuses it. Conditional, hit-count, log, data, inline and triggered breakpoints, and exception breakpoints: the adapter offers none. Setting a variable's value: the adapter does not offer it. Restart Frame: the adapter does not offer it. Loaded scripts: the adapter lists none. Inline values: VS Code shows them only for a language with an inline values provider, which rite has not. A variable that expands: the adapter answers flat lists. Compounds and a server-ready action: there is one adapter and one program to a launch. Several sessions and a session picker: one session runs at a time.

## The settings VS Code has for this

None of VS Code's `debug.*` settings is a key of oculus; each is the choice stated here.

| VS Code setting | Choice |
|---|---|
| `debug.closeReadonlyTabsOnEnd` | The tabs a session opened stay open; a session opens no read-only tab of its own. |
| `debug.console.closeOnEnd` | The Debug Console stays open when a session ends. |
| `debug.console.collapseIdenticalLines` | On, as in The console above. |
| `debug.console.acceptSuggestionOnEnter` | Off: Enter sends the text typed. |
| `debug.console.historySuggestions` | On. |
| `debug.console.maximumLines` | 10,000. |
| `debug.console.fontFamily`, `fontSize`, `lineHeight`, `wordWrap` | The terminal's font, wrapped. |
| `debug.focusWindowOnBreak` | On. |
| `debug.focusEditorOnBreak` | On. |
| `debug.gutterMiddleClickAction` | Nothing, since the adapter offers no log point or conditional breakpoint. |
| `debug.hideLauncherWhileDebugging` | Off: the picker and Start stay shown. |
| `debug.openExplorerOnEnd` | Off: the end of a session opens no view. |
| `debug.showBreakpointsInOverviewRuler` | Off: breakpoints are drawn in the glyph margin. |
| `debug.showInlineBreakpointCandidates` | No candidate is drawn, since the adapter offers no inline breakpoint. |
| `debug.showVariableTypes` | Off: Variables shows no type. |
| `debug.internalConsoleOptions` | The Debug Console opens at every session's start. |
| `debug.toolBarLocation` | Floating. |
| `debug.openDebug` | The Debug view opens on a pause and not at a session's start. |
| `debug.saveBeforeStart` | The unsaved `.rite` tabs are saved first. |
| `debug.onTaskErrors` | A `before` command that ends other than 0 asks. |
| `debug.hideSlowPreLaunchWarning` | Off: the notice after ten seconds is shown. |
| `debug.showInStatusBar` | The status item shows once a session has run since the server started. |
| `debug.enableStatusBarColor` | On: the bar is painted while a session runs or is paused. |
| `debug.breakpointsView.presentation` | A flat list of file and line rows, with no tree by folder. |
| `debug.inlineValues`, `autoExpandLazyVariables`, `disassemblyView.showSourceCode`, `showSubSessionsInToolBar` | Not offered by the adapter or by oculus. |
| `debug.terminal.clearBeforeReusing` | No debug terminal. |
| `debug.confirmOnExit` | Stopping asks first. |
